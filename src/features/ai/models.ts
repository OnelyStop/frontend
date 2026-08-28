/**
 * Every model choice in the product, in one place. Features ask for a profile
 * by name and never name a model string.
 */
export type ModelProfile = {
  model: string;
  /** Tried when the primary fails a retryable error. Omit to fail instead. */
  fallback?: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};

export const MODELS = {
  tutor: {
    model: "anthropic/claude-sonnet-4.5",
    fallback: "openai/gpt-4o",
    temperature: 0.7,
    maxTokens: 2000,
    timeoutMs: 60_000,
  },
  // Temperature 0: marking is graded output a student can dispute, and the
  // same answer must not score differently on a re-run.
  marker: {
    model: "anthropic/claude-sonnet-4.5",
    fallback: "openai/gpt-4o",
    temperature: 0,
    maxTokens: 1500,
    timeoutMs: 90_000,
  },
  interview: {
    model: "openai/gpt-4o",
    fallback: "anthropic/claude-sonnet-4.5",
    temperature: 0.8,
    maxTokens: 1200,
    timeoutMs: 60_000,
  },
  // No fallback: this runs unattended on a schedule, and silently escalating
  // to a costlier model is how bills happen. A failed item retries next run.
  newsQuestions: {
    model: "google/gemini-2.0-flash",
    temperature: 0.3,
    maxTokens: 1000,
    timeoutMs: 45_000,
  },
} as const satisfies Record<string, ModelProfile>;

export type FeatureKey = keyof typeof MODELS;

/** Per-user monthly ceiling, integer micro-dollars. Set against plan price. */
export const MONTHLY_SPEND_CAP_MICROS = 2_000_000; // $2.00
