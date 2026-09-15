import { describe, expect, it } from "vitest";
import { areaForPath, pathOf, tagEvent, type TaggableEvent } from "./sentry";

describe("areaForPath", () => {
  it("names the area a rule filters on", () => {
    expect(areaForPath("/api/v1/billing/webhook")).toBe("billing");
    expect(areaForPath("/upgrade/checkout")).toBe("billing");
    expect(areaForPath("/reset-password")).toBe("auth");
    expect(areaForPath("/mocks/ssc-cgl")).toBe("attempts");
    expect(areaForPath("/study/quant/algebra")).toBe("study");
    expect(areaForPath("/api/v1/internal/ingest")).toBe("admin");
  });

  it("falls back to app rather than guessing", () => {
    expect(areaForPath("/search")).toBe("app");
    expect(areaForPath("")).toBe("app");
  });

  // /api/v1/descriptive is also under no shorter prefix here, but /descriptive is — longest has to win.
  it("prefers the longest matching prefix", () => {
    expect(areaForPath("/api/v1/descriptive")).toBe("attempts");
  });

  it("matches a path segment, not a string prefix", () => {
    expect(areaForPath("/mocks-guide")).toBe("app");
    expect(areaForPath("/upgrades")).toBe("app");
  });
});

describe("pathOf", () => {
  it("drops the origin, the query and the fragment", () => {
    expect(pathOf("https://www.onelystop.in/upgrade/checkout?plan=pro")).toBe(
      "/upgrade/checkout",
    );
    expect(pathOf("/reset-password#token=x")).toBe("/reset-password");
  });
});

describe("tagEvent", () => {
  it("marks money and sign-in critical, everything else normal", () => {
    const paid = { request: { url: "https://x/api/v1/billing/verify" } };
    tagEvent(paid);
    expect(paid).toMatchObject({
      tags: { area: "billing", severity: "critical" },
    });

    const read = { request: { url: "https://x/study/quant" } };
    tagEvent(read);
    expect(read).toMatchObject({ tags: { area: "study", severity: "normal" } });
  });

  it("keeps an area the caller declared", () => {
    const event = { tags: { area: "billing" }, transaction: "/study" };
    tagEvent(event);
    expect(event.tags).toEqual({ area: "billing", severity: "critical" });
  });

  it("ignores an area the caller invented", () => {
    const event = { tags: { area: "nonsense" }, transaction: "/mocks" };
    tagEvent(event);
    expect(event.tags).toEqual({ area: "attempts", severity: "normal" });
  });

  it("treats a fatal anywhere as critical", () => {
    const event = { level: "fatal", transaction: "/search" };
    tagEvent(event);
    expect(event).toMatchObject({
      tags: { area: "app", severity: "critical" },
    });
  });

  it("collapses everything below critical into one issue per area", () => {
    const render: TaggableEvent = { transaction: "/study/quant" };
    const fetchFailed: TaggableEvent = { transaction: "/notes" };
    tagEvent(render);
    tagEvent(fetchFailed);
    expect(render.fingerprint).toEqual(["low", "study"]);
    expect(fetchFailed.fingerprint).toEqual(["low", "study"]);
  });

  it("leaves critical errors on their own grouping", () => {
    const paid: TaggableEvent = { transaction: "/api/v1/billing/verify" };
    tagEvent(paid);
    expect(paid.fingerprint).toBeUndefined();
  });

  it("keeps a fingerprint the caller set", () => {
    const event = { transaction: "/study", fingerprint: ["mine"] };
    tagEvent(event);
    expect(event.fingerprint).toEqual(["mine"]);
  });

  it("falls back to the transaction when there is no request", () => {
    const event = { transaction: "/upgrade/checkout" };
    tagEvent(event);
    expect(event).toMatchObject({ tags: { area: "billing" } });
  });
});
