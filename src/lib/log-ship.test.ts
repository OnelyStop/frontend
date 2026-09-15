import { beforeEach, describe, expect, it, vi } from "vitest";

const sent: { level: string; event: string; attributes: unknown }[] = [];
let logger: Record<string, (event: string, attributes: unknown) => void>;

vi.mock("@/config/sentry", () => ({
  SENTRY_DSN: "https://placeholder@o0.ingest.sentry.io/0",
}));

vi.mock("@sentry/nextjs", () => ({
  get logger() {
    return logger;
  },
}));

const record = (level: string) => (event: string, attributes: unknown) =>
  void sent.push({ level, event, attributes });

beforeEach(() => {
  sent.length = 0;
  logger = {
    debug: record("debug"),
    info: record("info"),
    warn: record("warn"),
    error: record("error"),
  };
  vi.stubEnv("LOG_IN_TESTS", "1");
  for (const m of ["log", "warn", "error"] as const) {
    vi.spyOn(console, m).mockImplementation(() => {});
  }
});

describe("log shipping", () => {
  it("sends the event name and its fields as structured attributes", async () => {
    const { log } = await import("./log");
    log.info("billing.webhook", { outcome: "processed", eventId: "evt_1" });
    expect(sent).toEqual([
      {
        level: "info",
        event: "billing.webhook",
        attributes: { outcome: "processed", eventId: "evt_1" },
      },
    ]);
  });

  it("uses the matching Sentry level, not one channel for everything", async () => {
    const { log } = await import("./log");
    log.warn("a");
    log.error("b");
    expect(sent.map((s) => s.level)).toEqual(["warn", "error"]);
  });

  // Sentry attributes reject null, and a dropped field is better than a rejected log line.
  it("drops null and undefined rather than sending them", async () => {
    const { log } = await import("./log");
    log.info("x", { kept: 1, empty: null, absent: undefined });
    expect(sent[0]!.attributes).toEqual({ kept: 1 });
  });

  it("still writes to the console when Sentry throws", async () => {
    const { log } = await import("./log");
    logger.info = () => {
      throw new Error("transport down");
    };
    expect(() => log.info("survives")).not.toThrow();
    expect(console.log).toHaveBeenCalledTimes(1);
  });
});
