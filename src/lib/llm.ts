import "server-only";

import { aiConfig } from "@/config/env";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatArgs = {
  model?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Injected by tests; nothing else passes it. */
  fetchImpl?: typeof fetch;
};

export type ChatResponse = {
  text: string;
  /** What answered. Slugs resolve to dated versions, so this is not the ask. */
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Integer micro-dollars; OpenRouter reports a float. */
  costMicros: number;
};

export type LlmFailure = "unauthorized" | "rate_limited" | "timeout" | "upstream" | "bad_request";

export class LlmError extends Error {
  constructor(readonly kind: LlmFailure, readonly status?: number, message = "") {
    super(message);
    this.name = "LlmError";
  }
}

// 408 and 409 are transient and must map to a retryable kind, not bad_request.
function classify(status: number): LlmFailure {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate_limited";
  if (status === 408) return "timeout";
  if (status === 409 || status >= 500) return "upstream";
  return "bad_request";
}

const RETRYABLE: ReadonlySet<LlmFailure> = new Set(["rate_limited", "timeout", "upstream"]);

async function once(
  messages: ChatMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
  timeoutMs: number,
  doFetch: typeof fetch,
): Promise<ChatResponse> {
  // Read here, not in aiConfig: a key inside a printable object leaks the first
  // time someone logs the config while debugging.
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new LlmError("unauthorized", undefined, "OPENROUTER_API_KEY is not set");

  let res: Response;
  try {
    res = await doFetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": aiConfig.referer,
        "X-OpenRouter-Title": aiConfig.title,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    throw new LlmError(timedOut ? "timeout" : "upstream", undefined, String(err));
  }

  if (!res.ok) {
    // Kept for our logs; a provider message never reaches a user.
    const detail = await res.text().catch(() => "");
    throw new LlmError(classify(res.status), res.status, detail.slice(0, 300));
  }

  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new LlmError("upstream", res.status, "no content");

  const usage = body.usage ?? {};
  return {
    text,
    model: body.model ?? model,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    costMicros: Math.round((usage.cost ?? 0) * 1_000_000),
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send messages to a model. Anything not passed comes from config, so a caller
 * names only what it needs to differ.
 */
export async function chat(messages: ChatMessage[], args: ChatArgs = {}): Promise<ChatResponse> {
  const model = args.model ?? aiConfig.model;
  const fallback = args.fallbackModel ?? aiConfig.fallbackModel;
  const temperature = args.temperature ?? aiConfig.temperature;
  const maxTokens = args.maxTokens ?? aiConfig.maxTokens;
  const perAttempt = args.timeoutMs ?? aiConfig.timeoutMs;
  const doFetch = args.fetchImpl ?? fetch;

  // Without an overall deadline, 3 attempts across 2 models plus backoff can
  // hold a user's request for minutes.
  const deadline = Date.now() + aiConfig.totalTimeoutMs;
  const chain = fallback && fallback !== model ? [model, fallback] : [model];
  let last: LlmError | undefined;

  for (const candidate of chain) {
    for (let attempt = 1; attempt <= aiConfig.maxAttempts; attempt++) {
      const left = deadline - Date.now();
      if (left <= 0) throw last ?? new LlmError("timeout", undefined, "deadline exceeded");

      try {
        return await once(messages, candidate, temperature, maxTokens, Math.min(perAttempt, left), doFetch);
      } catch (err) {
        if (!(err instanceof LlmError)) throw err;
        last = err;
        // Fails identically on every model, so retrying only costs time.
        if (!RETRYABLE.has(err.kind)) throw err;
        if (attempt === aiConfig.maxAttempts) break;
        await wait(2 ** (attempt - 1) * 250);
      }
    }
  }

  throw last ?? new LlmError("upstream", undefined, "no attempt was made");
}
