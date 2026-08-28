import { describe, expect, it } from "vitest";

import { MODELS, MONTHLY_SPEND_CAP_MICROS } from "./models";

describe("model registry", () => {
  const entries = Object.entries(MODELS);

  it("is not empty", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("gives every profile a bounded cost and a bounded wait", () => {
    for (const [name, p] of entries) {
      expect(p.maxTokens, name).toBeGreaterThan(0);
      // No profile may run unbounded: max_tokens is the per-call cost ceiling
      // and timeoutMs is what stops a hung request holding a user's connection.
      expect(p.maxTokens, name).toBeLessThanOrEqual(4000);
      expect(p.timeoutMs, name).toBeGreaterThan(0);
      expect(p.temperature, name).toBeGreaterThanOrEqual(0);
      expect(p.temperature, name).toBeLessThanOrEqual(2);
    }
  });

  it("uses a slug with a provider prefix", () => {
    for (const [name, p] of entries) {
      expect(p.model, name).toMatch(/^[a-z0-9-]+\/[a-z0-9.\-]+$/);
    }
  });

  it("never falls back to the model it already tried", () => {
    for (const [name, p] of entries) {
      const fallback = "fallback" in p ? p.fallback : undefined;
      if (fallback) expect(fallback, name).not.toBe(p.model);
    }
  });

  // Marking is graded output a student can dispute. At any temperature above
  // zero the same answer scores differently on a re-run, and we would have no
  // defence. This is a decision, not an accident -- fail if someone changes it.
  it("marks deterministically", () => {
    expect(MODELS.marker.temperature).toBe(0);
  });

  it("caps monthly spend at a whole number of micro-dollars", () => {
    expect(MONTHLY_SPEND_CAP_MICROS).toBeGreaterThan(0);
    expect(Number.isInteger(MONTHLY_SPEND_CAP_MICROS)).toBe(true);
  });
});
