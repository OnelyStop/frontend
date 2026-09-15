import { describe, expect, it } from "vitest";
import * as Sentry from "@sentry/node";

/* Unmocked on purpose. The rest of the telemetry suite mocks the SDK, so it would stay green if an upgrade removed one of these and every log or counter became a swallowed TypeError in production. */
describe("the Sentry surface this repo calls", () => {
  it("still exposes the four logger levels log.ts ships through", () => {
    for (const level of ["debug", "info", "warn", "error"] as const) {
      expect(typeof Sentry.logger[level]).toBe("function");
    }
  });

  it("still exposes the counter metrics.server.ts calls", () => {
    expect(typeof Sentry.metrics.count).toBe("function");
  });

  it("still exposes flush, which is what after() awaits", () => {
    expect(typeof Sentry.flush).toBe("function");
  });

  // Defaulted true by the SDK, and set explicitly at both init sites so an upgrade cannot quietly flip it.
  it("defaults logging on rather than requiring an opt-in", () => {
    const client = new Sentry.NodeClient({
      dsn: "https://placeholder@o0.ingest.sentry.io/0",
      transport: Sentry.makeNodeTransport,
      stackParser: Sentry.defaultStackParser,
      integrations: [],
    });
    expect(client.getOptions().enableLogs).toBe(true);
  });
});
