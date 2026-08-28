/**
 * The only place that reads process.env for AI settings, so "what can change
 * without a deploy" has one answer.
 */

const str = (key: string, fallback: string) => process.env[key] || fallback;

const num = (key: string, fallback: number) => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  // A typo'd env var must not silently become NaN and disable a token ceiling.
  return Number.isFinite(n) ? n : fallback;
};

export const aiConfig = {
  provider: str("LLM_PROVIDER", "openrouter"),

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseUrl: str("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
    referer: str("OPENROUTER_REFERER", "https://onelystop.com"),
    title: str("OPENROUTER_TITLE", "OnelyStop"),
  },

  // Model slots. Pointing the whole product at a different model is one var.
  models: {
    default: str("AI_MODEL_DEFAULT", "anthropic/claude-sonnet-4.5"),
    fast: str("AI_MODEL_FAST", "google/gemini-2.0-flash"),
    fallback: str("AI_MODEL_FALLBACK", "openai/gpt-4o"),
  },

  limits: {
    /** Per-user monthly ceiling, integer micro-dollars. */
    monthlySpendMicros: num("AI_MONTHLY_SPEND_MICROS", 2_000_000),
    temperature: num("AI_TEMPERATURE", 0.7),
    maxTokens: num("AI_MAX_TOKENS", 2000),
    timeoutMs: num("AI_TIMEOUT_MS", 60_000),
    maxAttempts: num("AI_MAX_ATTEMPTS", 3),
  },
} as const;

export type AiConfig = typeof aiConfig;
