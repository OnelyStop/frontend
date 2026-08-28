import { afterEach, describe, expect, it, vi } from "vitest";

/** aiConfig snapshots process.env at import, so each case needs a fresh one. */
async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import("./env")).aiConfig;
}

afterEach(() => vi.unstubAllEnvs());

describe("aiConfig", () => {
  it("works with nothing set", async () => {
    const c = await load();
    expect(c.model).toContain("/");
    expect(c.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(c.maxAttempts).toBeGreaterThan(0);
  });

  it("lets any model be swapped by env", async () => {
    const c = await load({ AI_MODEL: "meta-llama/llama-4-70b" });
    expect(c.model).toBe("meta-llama/llama-4-70b");
  });

  it("lets the gateway be pointed elsewhere", async () => {
    const c = await load({ OPENROUTER_BASE_URL: "https://proxy.internal/v1" });
    expect(c.baseUrl).toBe("https://proxy.internal/v1");
  });

  // NaN or an absurd value silently removes the ceiling it was meant to be.
  it("ignores a number that is unusable or out of range", async () => {
    const c = await load({
      AI_MAX_TOKENS: "nine thousand",
      AI_TEMPERATURE: "50",
      AI_MAX_ATTEMPTS: "999",
    });
    expect(c.maxTokens).toBe(2000);
    expect(c.temperature).toBe(0.7);
    expect(c.maxAttempts).toBe(3);
  });

  it("accepts an in-range override", async () => {
    const c = await load({ AI_TEMPERATURE: "0", AI_MAX_TOKENS: "500" });
    expect(c.temperature).toBe(0);
    expect(c.maxTokens).toBe(500);
  });

  // Logging the config must not be able to leak the key.
  it("does not carry the API key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-secret");
    const c = await load();
    expect(JSON.stringify(c)).not.toContain("sk-secret");
  });
});
