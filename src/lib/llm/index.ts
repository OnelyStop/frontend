import { aiConfig } from "@/config/env";

import { createOpenRouterClient } from "./OpenRouterClient";
import {
  LlmError,
  RETRYABLE_STATUS,
  type ChatMessage,
  type ChatOptions,
  type ChatResponse,
  type LlmClient,
} from "./types";

export * from "./types";
export { OpenRouterClient, createOpenRouterClient } from "./OpenRouterClient";

const PROVIDERS: Record<string, () => LlmClient> = {
  openrouter: createOpenRouterClient,
};

export function getLlmClient(provider = aiConfig.provider): LlmClient {
  const make = PROVIDERS[provider];
  if (!make) {
    throw new LlmError(
      "bad_request",
      undefined,
      `LLM_PROVIDER "${provider}" is not one of: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  return make();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ResilientOptions = ChatOptions & {
  /** Tried after the primary is exhausted. Omit to fail instead. */
  fallbackModel?: string;
  maxAttempts?: number;
  /** Injected in tests. */
  client?: LlmClient;
};

/**
 * Retry and fallback live here rather than in a client, so every provider gets
 * the same behaviour and a new client only has to implement `chat`.
 */
export async function chat(
  messages: ChatMessage[],
  options: ResilientOptions,
): Promise<ChatResponse> {
  const client = options.client ?? getLlmClient();
  const maxAttempts = options.maxAttempts ?? aiConfig.limits.maxAttempts;
  const chain = options.fallbackModel
    ? [options.model, options.fallbackModel]
    : [options.model];

  let last: LlmError | undefined;

  for (const model of chain) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await client.chat(messages, { ...options, model });
      } catch (err) {
        if (!(err instanceof LlmError)) throw err;
        last = err;

        // Fails identically on every model; retrying only costs time.
        if (err.kind === "unauthorized" || err.kind === "bad_request") throw err;

        const retryable = err.status === undefined || RETRYABLE_STATUS.has(err.status);
        if (!retryable || attempt === maxAttempts) break;
        await wait(2 ** (attempt - 1) * 250);
      }
    }
  }

  throw last ?? new LlmError("upstream", undefined, "no attempt was made");
}
