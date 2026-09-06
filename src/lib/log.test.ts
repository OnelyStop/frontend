import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { log } from "./log";

let written: string[];

beforeEach(() => {
  written = [];
  // Every case here asserts on output, so the test-silence rule has to be off.
  vi.stubEnv("LOG_IN_TESTS", "1");
  for (const m of ["log", "warn", "error"] as const) {
    vi.spyOn(console, m).mockImplementation(
      (line) => void written.push(line as string),
    );
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const parsed = () => written.map((l) => JSON.parse(l));

describe("log", () => {
  it("writes one parseable JSON object per line", () => {
    log.info("thing.happened", { count: 2 });
    expect(written).toHaveLength(1);
    expect(parsed()[0]).toMatchObject({
      level: "info",
      event: "thing.happened",
      count: 2,
    });
    expect(typeof parsed()[0].at).toBe("string");
  });

  it("sends warnings and errors to their own console channels", () => {
    log.warn("a");
    log.error("b");
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("carries debug on the ordinary channel", () => {
    log.debug("noisy.detail");
    expect(parsed()[0].level).toBe("debug");
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  // A key with no value breaks grouping in any tool that indexes on presence.
  it("drops undefined fields rather than writing empty keys", () => {
    log.info("x", { present: 1, missing: undefined });
    expect(Object.keys(parsed()[0])).not.toContain("missing");
    expect(parsed()[0].present).toBe(1);
  });

  it("keeps a null, which means something different from absent", () => {
    log.info("x", { status: null });
    expect(parsed()[0]).toHaveProperty("status", null);
  });

  it("stays silent under test unless LOG_IN_TESTS is set", () => {
    vi.stubEnv("LOG_IN_TESTS", "");
    log.info("quiet");
    log.error("also quiet");
    expect(written).toHaveLength(0);
  });
});
