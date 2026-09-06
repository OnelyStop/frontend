import { afterEach, describe, expect, it, vi } from "vitest";

/* AUTH_DISABLED is the one flag that turns off every check in the product:
   the proxy waves requests through, currentUserId invents a user, and study
   authorization returns true. It is read once at import, so each case needs a
   fresh module. */
async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import("./auth")).AUTH_DISABLED;
}

afterEach(() => vi.unstubAllEnvs());

describe("AUTH_DISABLED", () => {
  it("is off when nothing is set", async () => {
    expect(await load({ NODE_ENV: "development" })).toBe(false);
  });

  it("is on in development when asked for", async () => {
    expect(await load({ AUTH_DISABLED: "true", NODE_ENV: "development" })).toBe(
      true,
    );
  });

  it("cannot be turned on in production, however it is set", async () => {
    for (const value of ["true", "TRUE", "1", "yes"]) {
      expect(await load({ AUTH_DISABLED: value, NODE_ENV: "production" })).toBe(
        false,
      );
    }
  });

  it("ignores anything but the exact string true", async () => {
    expect(await load({ AUTH_DISABLED: "1", NODE_ENV: "development" })).toBe(
      false,
    );
    expect(await load({ AUTH_DISABLED: "yes", NODE_ENV: "development" })).toBe(
      false,
    );
  });
});
