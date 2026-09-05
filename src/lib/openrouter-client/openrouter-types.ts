export type Turn = { role: "user" | "assistant"; content: string };

export type ClientDefaults = {
  model?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  /** Ceiling on a single attempt. */
  timeoutMs?: number;
  /** Ceiling across every attempt and both models. */
  totalTimeoutMs?: number;
  maxAttempts?: number;
};

export type AskInput = {
  system?: string;
  prompt: string;
  history?: Turn[];
  model?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type Answer = {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costMicros: number;
};

export type AiFailure =
  "unauthorized" | "rate_limited" | "timeout" | "upstream" | "bad_request";

export class AiError extends Error {
  constructor(
    readonly kind: AiFailure,
    readonly status?: number,
    message = "",
    /** From a Retry-After header, when the provider sent one. */
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "AiError";
  }
}
