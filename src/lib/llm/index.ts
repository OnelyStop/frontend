import { aiConfig } from "@/config/env";

import { createOpenRouterClient } from "./OpenRouterClient";
import {
  LlmError,
  RETRYABLE_STATUS,
  type ChatMessage,
  type ChatOptions,
  type ChatRequest,
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

export type ChatArgs = ChatRequest & {
  maxAttempts?: number;
  client?: LlmClient;
};

/**
 * Retry and fallback live here rather than in a client, so every provider gets
 * the same behaviour and a new client only has to implement `chat`.
 */
export async function chat(
  messages: ChatMessage[],
  args: ChatArgs = {},
): Promise<ChatResponse> {
  const client = args.client ?? getLlmClient();
  const maxAttempts = args.maxAttempts ?? aiConfig.limits.maxAttempts;

  // Anything the caller left out comes from config, so a call can name only
  // what it wants to differ.
  const options: ChatOptions = {
    model: args.model ?? aiConfig.models.default,
    temperature: args.temperature ?? aiConfig.limits.temperature,
    maxTokens: args.maxTokens ?? aiConfig.limits.maxTokens,
    timeoutMs: args.timeoutMs ?? aiConfig.limits.timeoutMs,
  };

  const chain = args.fallbackModel
    ? [options.model, args.fallbackModel]
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
