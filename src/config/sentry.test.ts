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

  it("leaves grouping to Sentry, which reads the stack trace", () => {
    const render: TaggableEvent = { transaction: "/study/quant" };
    const paid: TaggableEvent = { transaction: "/api/v1/billing/verify" };
    tagEvent(render);
    tagEvent(paid);
    expect(render.fingerprint).toBeUndefined();
    expect(paid.fingerprint).toBeUndefined();
  });

  it("groups a failed query by area, not by the parameters in its message", () => {
    const inr: TaggableEvent = {
      transaction: "/upgrade",
      exception: {
        values: [{ value: "Failed query: select … params: INR,true" }],
      },
    };
    const usd: TaggableEvent = {
      transaction: "/upgrade",
      exception: {
        values: [{ value: "Failed query: select … params: USD,true" }],
      },
    };
    tagEvent(inr);
    tagEvent(usd);
    expect(inr.fingerprint).toEqual(["failed-query", "billing"]);
    expect(usd.fingerprint).toEqual(inr.fingerprint);
  });

  it("does not touch an ordinary error's grouping", () => {
    const event: TaggableEvent = {
      transaction: "/study",
      exception: { values: [{ value: "Cannot read properties of undefined" }] },
    };
    tagEvent(event);
    expect(event.fingerprint).toBeUndefined();
  });

  it("keeps a fingerprint the caller set", () => {
    const event: TaggableEvent = {
      transaction: "/study",
      fingerprint: ["mine"],
      exception: { values: [{ value: "Failed query: select …" }] },
    };
    tagEvent(event);
    expect(event.fingerprint).toEqual(["mine"]);
  });

  it("falls back to the transaction when there is no request", () => {
    const event = { transaction: "/upgrade/checkout" };
    tagEvent(event);
    expect(event).toMatchObject({ tags: { area: "billing" } });
  });
});
