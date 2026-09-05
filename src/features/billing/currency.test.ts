import { describe, expect, it } from "vitest";

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

  // The reason this is an allowlist and not a `.in` suffix test. Host arrives
  // from the request, so a caller who could name any host would otherwise pick
  // whichever of the two price points is cheaper for them.
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
  // Minor units in, readable string out. 799 is $7.99, not $799 -- getting this
  // backwards misprices the page by 100x in the direction nobody notices until
  // someone tries to pay.
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
