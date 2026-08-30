import "server-only";

import { openrouterConfig as config } from "@/config/openrouter";
import { log } from "@/lib/log";

import {
  AiError,
  type Answer,
  type AskInput,
  type ClientDefaults,
} from "./openrouter-types";

type Message = { role: "system" | "user" | "assistant"; content: string };

type Settings = {
  models: string[];
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  totalTimeoutMs: number;
  maxAttempts: number;
};

function messagesFor(input: AskInput): Message[] {
  return [
    ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
    ...(input.history ?? []),
    { role: "user" as const, content: input.prompt },
  ];
}

// 408 and 409 are transient and must map to a retryable kind, not bad_request.
function classify(status: number) {
  if (status === 401 || status === 403) return "unauthorized" as const;
  if (status === 429) return "rate_limited" as const;
  if (status === 408) return "timeout" as const;
  if (status === 409 || status >= 500) return "upstream" as const;
  return "bad_request" as const;
}

// A bad key or malformed request fails the same on every model and attempt.
function worthAnotherTry(error: unknown): error is AiError {
  return (
    error instanceof AiError &&
    error.kind !== "unauthorized" &&
    error.kind !== "bad_request"
  );
}

// An unexpected throw is a bug in our code, not a provider failure. Logging it
// as `kind: undefined` would lose the only description of what actually broke.
function failureFields(error: unknown) {
  return error instanceof AiError
    ? { kind: error.kind, status: error.status }
    : { kind: "unexpected", detail: String(error).slice(0, 200) };
}

/** Seconds, or an HTTP date. Ignored when absurd, so a bad header cannot hang us. */
function retryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
  return ms > 0 && ms <= 60_000 ? ms : undefined;
}

function readAnswer(body: unknown, asked: string, status: number): Answer {
  const payload = body as {
    model?: string;
    choices?: { message?: { content?: unknown } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  };

  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new AiError("upstream", status, "no content");

  const usage = payload.usage ?? {};
  // OpenRouter reports cost on every response, so an absent one means the shape
  // changed or something stripped it. Left silent it reads as a free call, and
  // any spend cap built on it would be counting zeroes.
  if (typeof usage.cost !== "number") {
    log.warn("openrouter.cost_missing", { model: payload.model ?? asked });
  }

  return {
    text,
    model: payload.model ?? asked,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    costMicros: Math.round((usage.cost ?? 0) * 1_000_000),
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Jittered, so a hundred requests failing together do not all retry in lockstep
// and hit the provider as one wave.
const backoff = (attempt: number) => {
  const base = 2 ** (attempt - 1) * 250;
  return base / 2 + Math.random() * (base / 2);
};

/**
 * One instance per feature. Settings resolve call → instance → config, so a
 * feature states its defaults once and a call names only what differs.
 */
export class OpenRouterClient {
  constructor(private readonly defaults: ClientDefaults = {}) {}

  async ask(input: AskInput): Promise<Answer> {
    const settings = this.settingsFor(input);
    const messages = messagesFor(input);
    const startedAt = Date.now();
    // Without this, attempts across two models can hold a request for minutes.
    const deadline = startedAt + settings.totalTimeoutMs;

    let lastError: unknown;

    for (const model of settings.models) {
      // Stop rather than enter a model with no time left: that attempt can only
      // fail on the deadline, and its synthetic error would replace the real
      // reason the previous model failed.
      if (Date.now() >= deadline) break;

      try {
        const answer = await this.askModel(model, messages, settings, deadline);
        // Never the prompt or the answer: an operations log, not a transcript.
        log.info("openrouter.ok", {
          model: answer.model,
          fellBack: model !== settings.models[0],
          ms: Date.now() - startedAt,
          promptTokens: answer.promptTokens,
          completionTokens: answer.completionTokens,
          costMicros: answer.costMicros,
        });
        return answer;
      } catch (error) {
        lastError = error;
        if (!worthAnotherTry(error)) break;
      }
    }

    log.error("openrouter.failed", {
      models: settings.models.join(","),
      ms: Date.now() - startedAt,
      ...failureFields(lastError),
    });
    throw lastError ?? new AiError("upstream", undefined, "no model was attempted");
  }

  private settingsFor(input: AskInput): Settings {
    const d = this.defaults;
    const model = input.model ?? d.model ?? config.model;
    const fallback = input.fallbackModel ?? d.fallbackModel ?? config.fallbackModel;

    return {
      models: fallback && fallback !== model ? [model, fallback] : [model],
      temperature: input.temperature ?? d.temperature ?? config.temperature,
      maxTokens: input.maxTokens ?? d.maxTokens ?? config.maxTokens,
      timeoutMs: input.timeoutMs ?? d.timeoutMs ?? config.timeoutMs,
      totalTimeoutMs: d.totalTimeoutMs ?? config.totalTimeoutMs,
      maxAttempts: d.maxAttempts ?? config.maxAttempts,
    };
  }

  private async askModel(
    model: string,
    messages: Message[],
    settings: Settings,
    deadline: number,
  ): Promise<Answer> {
    let lastError: unknown = new AiError("timeout", undefined, "deadline exceeded");

    for (let attempt = 1; attempt <= settings.maxAttempts; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;

      try {
        return await this.callOnce(
          model,
          messages,
          settings,
          Math.min(settings.timeoutMs, remaining),
        );
      } catch (error) {
        if (!worthAnotherTry(error)) throw error;
        lastError = error;
        log.warn("openrouter.attempt_failed", {
          model,
          attempt,
          kind: error.kind,
          status: error.status,
        });
        if (attempt === settings.maxAttempts) break;
        // The provider's own Retry-After beats our guess when it sent one, but
        // clamped: an unclamped sleep runs past the one thing bounding the call.
        const asked = error.retryAfterMs ?? backoff(attempt);
        await wait(Math.min(asked, deadline - Date.now()));
      }
    }

    throw lastError;
  }

  private async callOnce(
    model: string,
    messages: Message[],
    settings: Settings,
    timeoutMs: number,
  ): Promise<Answer> {
    // Read here rather than in the config object, so logging it cannot leak the key.
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new AiError("unauthorized", undefined, "OPENROUTER_API_KEY is not set");

    let response: Response;
    try {
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": config.referer,
          "X-OpenRouter-Title": config.title,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        }),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      throw new AiError(timedOut ? "timeout" : "upstream", undefined, String(error));
    }

    if (!response.ok) {
      // For our logs; a provider message never reaches a user.
      const detail = await response.text().catch(() => "");
      throw new AiError(
        classify(response.status),
        response.status,
        detail.slice(0, 300),
        retryAfterMs(response.headers.get("retry-after")),
      );
    }

    return readAnswer(await response.json(), model, response.status);
  }
}

/** The default client. A feature wanting different settings makes its own. */
export const openrouter = new OpenRouterClient();
