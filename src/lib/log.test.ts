import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { log } from "./log";

let written: string[];

beforeEach(() => {
  written = [];
  for (const m of ["log", "warn", "error"] as const) {
    vi.spyOn(console, m).mockImplementation(
      (line) => void written.push(line as string),
    );
  }
});
afterEach(() => vi.restoreAllMocks());

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

  // An undefined field would serialise as a key with no value, which breaks
  // grouping in any log tool that indexes on presence.
  it("drops undefined fields rather than writing empty keys", () => {
    log.info("x", { present: 1, missing: undefined });
    expect(Object.keys(parsed()[0])).not.toContain("missing");
    expect(parsed()[0].present).toBe(1);
  });

  it("keeps a null, which means something different from absent", () => {
    log.info("x", { status: null });
    expect(parsed()[0]).toHaveProperty("status", null);
  });
});
