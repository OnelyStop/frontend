const str = (key: string, fallback: string) => process.env[key] || fallback;

const num = (key: string, fallback: number, min: number, max: number) => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

export const openrouterConfig = {
  baseUrl: str("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
  referer: str("OPENROUTER_REFERER", "https://onelystop.com"),
  title: str("OPENROUTER_TITLE", "OnelyStop"),

  // Never the -contributor tier: it trains on what we send, and we promise not.
  model: str("AI_MODEL", "meta/muse-spark-1.3"),

  // Explaining a passage does not need the same tier, and is asked far more often.
  cheapModel: str("AI_CHEAP_MODEL", "deepseek/deepseek-v4-flash-0731"),
  fallbackModel: str("AI_MODEL_FALLBACK", "openai/gpt-4o"),

  temperature: num("AI_TEMPERATURE", 0.7, 0, 2),
  maxTokens: num("AI_MAX_TOKENS", 2000, 1, 32_000),
  timeoutMs: num("AI_TIMEOUT_MS", 60_000, 1_000, 300_000),
  totalTimeoutMs: num("AI_TOTAL_TIMEOUT_MS", 120_000, 1_000, 600_000),
  maxAttempts: num("AI_MAX_ATTEMPTS", 3, 1, 5),
} as const;
