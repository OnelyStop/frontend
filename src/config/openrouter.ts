const str = (key: string, fallback: string) => process.env[key] || fallback;

const num = (key: string, fallback: number, min: number, max: number) => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

export const openrouterConfig = {
  baseUrl: str("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
  referer: str("OPENROUTER_REFERER", "https://onelystop.com"),
  title: str("OPENROUTER_TITLE", "OnelyStop"),

  model: str("AI_MODEL", "anthropic/claude-sonnet-4.5"),
  fallbackModel: str("AI_MODEL_FALLBACK", "openai/gpt-4o"),

  temperature: num("AI_TEMPERATURE", 0.7, 0, 2),
  maxTokens: num("AI_MAX_TOKENS", 2000, 1, 32_000),
  timeoutMs: num("AI_TIMEOUT_MS", 60_000, 1_000, 300_000),
  totalTimeoutMs: num("AI_TOTAL_TIMEOUT_MS", 120_000, 1_000, 600_000),
  maxAttempts: num("AI_MAX_ATTEMPTS", 3, 1, 5),
} as const;
