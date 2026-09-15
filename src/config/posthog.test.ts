import { describe, expect, it } from "vitest";
import {
  POSTHOG_ASSET_HOST,
  POSTHOG_INGEST_HOST,
  POSTHOG_RELAY_PATH,
  replayAllowed,
  scrubUrls,
} from "./posthog";

describe("the relay path", () => {
  // The list PostHog publishes; a path matching any of them is dropped by the blockers it exists to get past.
  it("is not one of the words blockers match on", () => {
    for (const blocked of ["analytics", "tracking", "telemetry", "posthog"]) {
      expect(POSTHOG_RELAY_PATH).not.toContain(blocked);
    }
  });

  it("is one rooted segment with no trailing slash", () => {
    expect(POSTHOG_RELAY_PATH).toMatch(/^\/[a-z0-9-]+$/);
  });

  it("serves assets and events from the same region", () => {
    expect(POSTHOG_ASSET_HOST).toBe(
      POSTHOG_INGEST_HOST.replace(".i.posthog.com", "-assets.i.posthog.com"),
    );
  });
});

describe("replayAllowed", () => {
  it("records the funnel", () => {
    expect(replayAllowed("/")).toBe(true);
    expect(replayAllowed("/signup")).toBe(true);
    expect(replayAllowed("/upgrade")).toBe(true);
  });

  it("records neither an exam nor a password reset", () => {
    expect(replayAllowed("/reset-password")).toBe(false);
    expect(replayAllowed("/upgrade/checkout")).toBe(false);
    expect(replayAllowed("/drills")).toBe(false);
    expect(replayAllowed("/mocks/ssc-cgl")).toBe(false);
    expect(replayAllowed("/results/412")).toBe(false);
    expect(replayAllowed("/descriptive")).toBe(false);
  });

  it("matches a path segment, not a string prefix", () => {
    expect(replayAllowed("/drills-guide")).toBe(true);
  });
});

describe("scrubUrls", () => {
  it("drops the query and the fragment from every URL property", () => {
    expect(
      scrubUrls({
        $current_url: "https://www.onelystop.in/login?from=/today",
        $initial_current_url: "https://www.onelystop.in/reset-password#token=x",
        $referrer: "https://www.onelystop.in/upgrade?plan=pro",
      }),
    ).toEqual({
      $current_url: "https://www.onelystop.in/login",
      $initial_current_url: "https://www.onelystop.in/reset-password",
      $referrer: "https://www.onelystop.in/upgrade",
    });
  });

  it("leaves everything else exactly as it was", () => {
    expect(
      scrubUrls({ plan: "pro", length: 20, $referrer: "$direct" }),
    ).toEqual({ plan: "pro", length: 20, $referrer: "$direct" });
  });
});
