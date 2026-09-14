export type Turn = { role: "user" | "assistant"; content: string };

export type ClientDefaults = {
  model?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
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
  /** JSON Schema the reply must satisfy. Only some models honour it. */
  responseSchema?: { name: string; schema: object };
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
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "AiError";
  }
}
