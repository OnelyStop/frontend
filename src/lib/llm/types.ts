export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};

export type ChatResponse = {
  text: string;
  /** What actually answered. Providers resolve aliases, and cost follows this. */
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Integer micro-dollars; providers report a float. */
  costMicros: number;
};

export type LlmFailure =
  | "unauthorized"
  | "rate_limited"
  | "timeout"
  | "upstream"
  | "bad_request";

/** Typed so a feature can react without leaking a provider message to a user. */
export class LlmError extends Error {
  constructor(
    readonly kind: LlmFailure,
    readonly status: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

/** Depended on instead of a concrete client, so a new provider is a new file. */
export interface LlmClient {
  readonly name: string;
  chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse>;
}

/** Retried; anything else fails immediately. */
export const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

export function classify(status: number): LlmFailure {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "upstream";
  return "bad_request";
}
