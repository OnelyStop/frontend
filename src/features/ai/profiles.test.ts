import { describe, expect, it } from "vitest";

import { PROFILES } from "./profiles";

describe("profiles", () => {
  const entries = Object.entries(PROFILES);

  it("is not empty", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("bounds every profile's cost and wait", () => {
    for (const [name, p] of entries) {
      // No profile may run unbounded: maxTokens is the per-call cost ceiling,
      // timeoutMs is what stops a hung request holding a user's connection.
      expect(p.maxTokens, name).toBeGreaterThan(0);
      expect(p.timeoutMs, name).toBeGreaterThan(0);
      expect(p.temperature, name).toBeGreaterThanOrEqual(0);
      expect(p.temperature, name).toBeLessThanOrEqual(2);
    }
  });

  it("never falls back to the model it already tried", () => {
    for (const [name, p] of entries) {
      const fallback = "fallbackModel" in p ? p.fallbackModel : undefined;
      if (fallback) expect(fallback, name).not.toBe(p.model);
    }
  });

  // Marking is graded output a student can dispute. Above zero, the same answer
  // scores differently on a re-run and we have no defence. Fail if changed.
  it("marks deterministically", () => {
    expect(PROFILES.marker.temperature).toBe(0);
  });
});
