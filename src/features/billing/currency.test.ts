import { describe, expect, it, vi } from "vitest";

import { DEFAULT_CURRENCY, currencyForHost } from "./currency";
import { formatAmount } from "./money";

describe("currency from host", () => {
  it("maps each domain to the currency it sells in", () => {
    expect(currencyForHost("onelystop.in")).toBe("INR");
    expect(currencyForHost("www.onelystop.in")).toBe("INR");
    expect(currencyForHost("onelystop.com")).toBe("USD");
    expect(currencyForHost("www.onelystop.com")).toBe("USD");
  });

  it("ignores case and port", () => {
    expect(currencyForHost("OnelyStop.IN:443")).toBe("INR");
    expect(currencyForHost("onelystop.com:3000")).toBe("USD");
  });

  // Host arrives from the request, so a suffix test would let a caller pick the price.
  it("does not honour a lookalike host", () => {
    for (const host of [
      "onelystop.in.evil.com",
      "notonelystop.in",
      "onelystop.in.",
      "evil.com",
    ]) {
      expect(currencyForHost(host)).toBe(DEFAULT_CURRENCY);
    }
  });

  // Pinned by default, or the landing page is a function invocation — and a cold start — per visitor.
  it("only reads the host when SITE_CURRENCY says host", async () => {
    const load = async (value?: string) => {
      vi.resetModules();
      const before = process.env.SITE_CURRENCY;
      if (value === undefined) delete process.env.SITE_CURRENCY;
      else process.env.SITE_CURRENCY = value;
      const headers = vi.fn(async () => new Headers({ host: "onelystop.com" }));
      vi.doMock("next/headers", () => ({ headers }));
      const mod = await import("./currency");
      const currency = await mod.requestCurrency();
      if (before === undefined) delete process.env.SITE_CURRENCY;
      else process.env.SITE_CURRENCY = before;
      return { currency, read: headers.mock.calls.length };
    };

    expect(await load(undefined)).toEqual({ currency: "INR", read: 0 });
    expect(await load("INR")).toEqual({ currency: "INR", read: 0 });
    expect(await load("USD")).toEqual({ currency: "USD", read: 0 });
    expect(await load("host")).toEqual({ currency: "USD", read: 1 });
  });

  it("falls back for previews, localhost and a missing header", () => {
    expect(currencyForHost("localhost:3000")).toBe(DEFAULT_CURRENCY);
    expect(currencyForHost("onelystop-git-main.vercel.app")).toBe(
      DEFAULT_CURRENCY,
    );
    expect(currencyForHost(null)).toBe(DEFAULT_CURRENCY);
    expect(currencyForHost(undefined)).toBe(DEFAULT_CURRENCY);
    expect(currencyForHost("")).toBe(DEFAULT_CURRENCY);
  });
});

describe("formatAmount", () => {
  // Minor units in: 799 is $7.99, not $799 — backwards misprices the page by 100x.
  it("renders minor units as major", () => {
    expect(formatAmount(799, "USD")).toBe("$7.99");
    expect(formatAmount(5_900, "USD")).toBe("$59");
    expect(formatAmount(49_900, "INR")).toBe("₹499");
    expect(formatAmount(499_900, "INR")).toBe("₹4,999");
  });

  it("keeps two decimals only when there are any", () => {
    expect(formatAmount(100, "USD")).toBe("$1");
    expect(formatAmount(150, "USD")).toBe("$1.50");
  });
});
