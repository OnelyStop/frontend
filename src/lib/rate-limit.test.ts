import { beforeEach, describe, expect, it } from "vitest";
import { _resetRateLimits, rateLimit } from "./rate-limit";

beforeEach(() => _resetRateLimits());

describe("rateLimit", () => {
  it("allows up to the limit, then blocks within the window", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++)
      expect(rateLimit("u", 3, 1000, t0 + i).ok).toBe(true);
    const blocked = rateLimit("u", 3, 1000, t0 + 4);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("frees a slot once the oldest hit ages out of the window", () => {
    const t0 = 2_000_000;
    rateLimit("k", 2, 1000, t0);
    rateLimit("k", 2, 1000, t0 + 10);
    expect(rateLimit("k", 2, 1000, t0 + 20).ok).toBe(false);
    expect(rateLimit("k", 2, 1000, t0 + 1001).ok).toBe(true);
  });

  it("keys are independent", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("a", 1, 1000, 1).ok).toBe(false);
    expect(rateLimit("b", 1, 1000, 1).ok).toBe(true);
  });
});
