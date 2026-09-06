import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted, because the vi.mock factory is lifted above any ordinary const.
const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException }));

import { captureError } from "./observability.server";

let written: string[];

beforeEach(() => {
  written = [];
  vi.stubEnv("LOG_IN_TESTS", "1");
  vi.spyOn(console, "error").mockImplementation(
    (line) => void written.push(line as string),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  captureException.mockClear();
});

describe("captureError", () => {
  it("writes the log line as well as reporting, so a missing DSN loses nothing", () => {
    captureError(new Error("razorpay unreachable"), { route: "/webhook" });

    const line = JSON.parse(written[0]);
    expect(line).toMatchObject({
      level: "error",
      event: "razorpay unreachable",
      route: "/webhook",
      error: "Error",
    });
    expect(typeof line.stack).toBe("string");
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  // A rejected promise carries whatever it was rejected with; Sentry needs an
  // Error to have anything to group on.
  it("wraps a thrown non-Error", () => {
    captureError("just a string", { route: "/x" });

    expect(JSON.parse(written[0]).event).toBe("just a string");
    expect(captureException.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
