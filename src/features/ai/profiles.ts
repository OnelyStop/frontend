import { aiConfig } from "@/config/env";

export type Profile = {
  model: string;
  fallbackModel?: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};

const { models, limits } = aiConfig;

/**
 * No feature names a model string; every slug comes from config, so any model
 * is swappable by env without a code change.
 */
export const PROFILES = {
  tutor: {
    model: models.default,
    fallbackModel: models.fallback,
    temperature: 0.7,
    maxTokens: limits.maxTokens,
    timeoutMs: limits.timeoutMs,
  },
  // Temperature 0: marking is graded output a student can dispute, and the
  // same answer must not score differently on a re-run.
  marker: {
    model: models.default,
    fallbackModel: models.fallback,
    temperature: 0,
    maxTokens: 1500,
    timeoutMs: 90_000,
  },
  interview: {
    model: models.default,
    fallbackModel: models.fallback,
    temperature: 0.8,
    maxTokens: 1200,
    timeoutMs: limits.timeoutMs,
  },
  // No fallback: this runs unattended on a schedule, and silently escalating
  // to a costlier model is how bills happen. A failed item retries next run.
  newsQuestions: {
    model: models.fast,
    temperature: 0.3,
    maxTokens: 1000,
    timeoutMs: 45_000,
  },
} as const satisfies Record<string, Profile>;

export type FeatureKey = keyof typeof PROFILES;
