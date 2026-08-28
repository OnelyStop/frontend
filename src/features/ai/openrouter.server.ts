import "server-only";

import { MODELS, type FeatureKey, type ModelProfile } from "./models";

const API = "https://openrouter.ai/api/v1/chat/completions";

/** Retried; anything else fails immediately. */
const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

export type AiFailure =
  | "unauthorized"
  | "rate_limited"
  | "timeout"
  | "upstream"
  | "bad_request";

/** Typed so a feature can react without leaking a provider message. */
export class AiError extends Error {
  constructor(
    readonly kind: AiFailure,
    readonly status: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

export type Message = { role: "system" | "user" | "assistant"; content: string };

export type Completion = {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Integer micro-dollars; OpenRouter reports a float in credits. */
  costMicros: number;
};

// Read at call time: importing this must not crash a route that merely
// shares a bundle with it when the var is absent.
function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new AiError("unauthorized", undefined, "OPENROUTER_API_KEY is not set");
  return key;
}

function classify(status: number): AiFailure {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "upstream";
  return "bad_request";
}

async function once(
  model: string,
  profile: ModelProfile,
  messages: Message[],
): Promise<Completion> {
  const abort = AbortSignal.timeout(profile.timeoutMs);
  let res: Response;
  try {
    res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://onelystop.com",
        "X-OpenRouter-Title": "OnelyStop",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: profile.temperature,
        max_tokens: profile.maxTokens,
      }),
      signal: abort,
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof AiError) throw err;
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    throw new AiError(timedOut ? "timeout" : "upstream", undefined, String(err));
  }

  if (!res.ok) {
    // The body may carry a provider message; it is for our logs, never a user.
    const detail = await res.text().catch(() => "");
    throw new AiError(classify(res.status), res.status, detail.slice(0, 300));
  }

  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new AiError("upstream", res.status, "no message content in response");
  }

  const usage = body.usage ?? {};
  return {
    text,
    // Not the requested model: an alias resolves, and cost is attributed
    // to what actually answered.
    model: body.model ?? model,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    costMicros: Math.round((usage.cost ?? 0) * 1_000_000),
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries the primary on transient failures, then tries the fallback. Spend is
 * NOT checked here -- callers must consult `withinBudget` first.
 */
export async function complete(
  feature: FeatureKey,
  messages: Message[],
): Promise<Completion> {
  // Widened: `satisfies` keeps literal types, so profiles without a fallback
  // have no such key to narrow through.
  const profile: ModelProfile = MODELS[feature];
  const chain = profile.fallback ? [profile.model, profile.fallback] : [profile.model];
  let last: AiError | undefined;

  for (const model of chain) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await once(model, profile, messages);
      } catch (err) {
        if (!(err instanceof AiError)) throw err;
        last = err;

        // Fails identically on every model; retrying only costs time.
        if (err.kind === "unauthorized" || err.kind === "bad_request") throw err;

        const retryable = err.status === undefined || RETRYABLE.has(err.status);
        if (!retryable || attempt === MAX_ATTEMPTS) break;
        await wait(2 ** (attempt - 1) * 250);
      }
    }
  }

  throw last ?? new AiError("upstream", undefined, "no attempt was made");
}
