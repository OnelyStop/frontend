import "server-only";

import { aiConfig } from "@/config/ai";

export type AskInput = {
  /** Who the model is and how to behave. */
  system?: string;
  /** The question, plus whatever context the feature gathered. */
  prompt: string;
  model?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type Answer = {
  text: string;
  /** What answered. Slugs resolve to dated versions, so this is not the ask. */
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Integer micro-dollars; OpenRouter reports a float. */
  costMicros: number;
};

export type AskFailure =
  | "unauthorized"
  | "rate_limited"
  | "timeout"
  | "upstream"
  | "bad_request";

export class AskError extends Error {
  constructor(readonly kind: AskFailure, readonly status?: number, message = "") {
    super(message);
    this.name = "AskError";
  }
}

// 408 and 409 are transient and must map to a retryable kind, not bad_request.
function classify(status: number): AskFailure {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate_limited";
  if (status === 408) return "timeout";
  if (status === 409 || status >= 500) return "upstream";
  return "bad_request";
}

const RETRYABLE: ReadonlySet<AskFailure> = new Set(["rate_limited", "timeout", "upstream"]);

type Attempt = {
  system?: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};

async function send(a: Attempt): Promise<Answer> {
  // Read here, not in aiConfig, so logging the config cannot leak it.
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new AskError("unauthorized", undefined, "OPENROUTER_API_KEY is not set");

  const messages = a.system
    ? [{ role: "system", content: a.system }, { role: "user", content: a.prompt }]
    : [{ role: "user", content: a.prompt }];

  let res: Response;
  try {
    res = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": aiConfig.referer,
        "X-OpenRouter-Title": aiConfig.title,
      },
      body: JSON.stringify({
        model: a.model,
        messages,
        temperature: a.temperature,
        max_tokens: a.maxTokens,
      }),
      signal: AbortSignal.timeout(a.timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    throw new AskError(timedOut ? "timeout" : "upstream", undefined, String(err));
  }

  if (!res.ok) {
    // For our logs; a provider message never reaches a user.
    const detail = await res.text().catch(() => "");
    throw new AskError(classify(res.status), res.status, detail.slice(0, 300));
  }

  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new AskError("upstream", res.status, "no content");

  const usage = body.usage ?? {};
  return {
    text,
    model: body.model ?? a.model,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    costMicros: Math.round((usage.cost ?? 0) * 1_000_000),
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Anything not passed comes from config, so a caller names only what differs. */
export async function ask(input: AskInput): Promise<Answer> {
  const model = input.model ?? aiConfig.model;
  const fallback = input.fallbackModel ?? aiConfig.fallbackModel;
  const perAttempt = input.timeoutMs ?? aiConfig.timeoutMs;

  const base = {
    system: input.system,
    prompt: input.prompt,
    temperature: input.temperature ?? aiConfig.temperature,
    maxTokens: input.maxTokens ?? aiConfig.maxTokens,
  };

  // Without this, attempts across two models can hold a request for minutes.
  const deadline = Date.now() + aiConfig.totalTimeoutMs;
  const chain = fallback && fallback !== model ? [model, fallback] : [model];
  let last: AskError | undefined;

  for (const candidate of chain) {
    for (let attempt = 1; attempt <= aiConfig.maxAttempts; attempt++) {
      const left = deadline - Date.now();
      if (left <= 0) throw last ?? new AskError("timeout", undefined, "deadline exceeded");

      try {
        return await send({ ...base, model: candidate, timeoutMs: Math.min(perAttempt, left) });
      } catch (err) {
        if (!(err instanceof AskError)) throw err;
        last = err;
        // Fails identically on every model, so retrying only costs time.
        if (!RETRYABLE.has(err.kind)) throw err;
        if (attempt === aiConfig.maxAttempts) break;
        await wait(2 ** (attempt - 1) * 250);
      }
    }
  }

  throw last ?? new AskError("upstream", undefined, "no attempt was made");
}
