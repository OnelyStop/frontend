import { describe, expect, it } from "vitest";
import { DAY_RE, istDayKey } from "./day";

describe("istDayKey", () => {
  it("rolls to the next day at 18:30 UTC", () => {
    expect(istDayKey(new Date("2026-09-05T18:29:59Z"))).toBe("2026-09-05");
    expect(istDayKey(new Date("2026-09-05T18:30:00Z"))).toBe("2026-09-06");
  });
});

describe("DAY_RE", () => {
  it("accepts only YYYY-MM-DD", () => {
    expect(DAY_RE.test("2026-09-05")).toBe(true);
    expect(DAY_RE.test("2026-9-5")).toBe(false);
    expect(DAY_RE.test("2026-09-05T00:00")).toBe(false);
  });
});
