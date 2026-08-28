import { aiConfig } from "@/config/env";

import {
  classify,
  LlmError,
  type ChatMessage,
  type ChatOptions,
  type ChatResponse,
  type LlmClient,
} from "./types";

export type OpenRouterOptions = {
  apiKey?: string;
  baseUrl?: string;
  referer?: string;
  title?: string;
  fetchImpl?: typeof fetch;
};

export class OpenRouterClient implements LlmClient {
  readonly name = "openrouter";

  private readonly baseUrl: string;
  private readonly referer: string;
  private readonly title: string;
  private readonly fetchImpl: typeof fetch;
  private readonly apiKeyOverride?: string;

  constructor(options: OpenRouterOptions = {}) {
    this.baseUrl = options.baseUrl || aiConfig.openrouter.baseUrl;
    this.referer = options.referer || aiConfig.openrouter.referer;
    this.title = options.title || aiConfig.openrouter.title;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.apiKeyOverride = options.apiKey;
  }

  /**
   * Resolved per call, not in the constructor: constructing this must not throw
   * in a route that merely shares a bundle with it when the var is absent.
   */
  private apiKey(): string {
    const key = this.apiKeyOverride || aiConfig.openrouter.apiKey;
    if (!key) {
      throw new LlmError("unauthorized", undefined, "OPENROUTER_API_KEY is not set");
    }
    return key;
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const key = this.apiKey();

    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.referer,
          "X-OpenRouter-Title": this.title,
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        }),
        signal: AbortSignal.timeout(options.timeoutMs),
        cache: "no-store",
      });
    } catch (err) {
      if (err instanceof LlmError) throw err;
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      throw new LlmError(timedOut ? "timeout" : "upstream", undefined, String(err));
    }

    if (!res.ok) {
      // Captured for our logs; a provider message never reaches a user.
      const detail = await res.text().catch(() => "");
      throw new LlmError(classify(res.status), res.status, detail.slice(0, 300));
    }

    const body = await res.json();
    const text = body?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new LlmError("upstream", res.status, "no message content in response");
    }

    const usage = body.usage ?? {};
    return {
      text,
      model: body.model ?? options.model,
      promptTokens: usage.prompt_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
      costMicros: Math.round((usage.cost ?? 0) * 1_000_000),
    };
  }
}

export const createOpenRouterClient = (options?: OpenRouterOptions) =>
  new OpenRouterClient(options);
