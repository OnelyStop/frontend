import { afterEach, describe, expect, it, vi } from "vitest";

/** aiConfig snapshots process.env at import, so each case needs a fresh one. */
async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import("./env")).aiConfig;
}

afterEach(() => vi.unstubAllEnvs());

describe("aiConfig", () => {
  it("has usable defaults with no env set", async () => {
    const c = await load({});
    expect(c.provider).toBe("openrouter");
    expect(c.openrouter.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(c.models.default).toContain("/");
    expect(c.limits.monthlySpendMicros).toBeGreaterThan(0);
  });

  it("lets any model be swapped by env, with no code change", async () => {
    const c = await load({
      AI_MODEL_DEFAULT: "meta-llama/llama-4-70b",
      AI_MODEL_FAST: "mistralai/mistral-small",
      AI_MODEL_FALLBACK: "openai/gpt-4o-mini",
    });
    expect(c.models.default).toBe("meta-llama/llama-4-70b");
    expect(c.models.fast).toBe("mistralai/mistral-small");
    expect(c.models.fallback).toBe("openai/gpt-4o-mini");
  });

  it("lets the whole gateway be pointed elsewhere", async () => {
    const c = await load({ OPENROUTER_BASE_URL: "https://proxy.internal/v1" });
    expect(c.openrouter.baseUrl).toBe("https://proxy.internal/v1");
  });

  // A typo'd number must not become NaN: NaN as a token ceiling or a spend cap
  // silently disables the limit rather than failing loudly.
  it("ignores a non-numeric override rather than producing NaN", async () => {
    const c = await load({ AI_MAX_TOKENS: "two thousand", AI_MONTHLY_SPEND_MICROS: "" });
    expect(c.limits.maxTokens).toBe(2000);
    expect(Number.isFinite(c.limits.monthlySpendMicros)).toBe(true);
    expect(c.limits.monthlySpendMicros).toBeGreaterThan(0);
  });

  it("never ships a default API key", async () => {
    const c = await load({});
    expect(c.openrouter.apiKey).toBe("");
  });
});
