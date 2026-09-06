import { describe, expect, it } from "vitest";
import {
  PLAN_LIMITS,
  limitsFor,
  withinLimit,
  type PlanTier,
} from "@/features/billing/limits";
import { discountPercent } from "./discount";
import { PLAN_COPY } from "./plans";

const TIERS: PlanTier[] = ["free", "pro", "pro_plus"];

describe("discountPercent", () => {
  // The launch prices, pinned. A price edit that leaves the struck-through
  // figure behind changes the badge, and this is what says so.
  it("quotes the advertised launch discounts", () => {
    expect(discountPercent(25_000, 55_000)).toBe(55); // Pro ₹250 from ₹550
    expect(discountPercent(40_000, 100_000)).toBe(60); // Pro+ ₹400 from ₹1,000
    expect(discountPercent(250_000, 550_000)).toBe(55); // Pro, yearly
    expect(discountPercent(400_000, 1_000_000)).toBe(60); // Pro+, yearly
  });

  it("shows nothing when there is no offer", () => {
    expect(discountPercent(25_000, null)).toBeNull();
  });

  // A list price at or below the real one would otherwise render "0% off", or
  // a negative, next to the price someone is about to pay.
  it("shows nothing when the list price is not higher", () => {
    expect(discountPercent(25_000, 25_000)).toBeNull();
    expect(discountPercent(25_000, 20_000)).toBeNull();
  });

  it("hides a discount too small to be worth a badge", () => {
    expect(discountPercent(9_900, 10_000)).toBeNull();
  });
});

describe("plan limits", () => {
  it("gives every tier every limit", () => {
    const keys = Object.keys(PLAN_LIMITS.free).sort();
    for (const tier of TIERS) {
      expect(Object.keys(PLAN_LIMITS[tier]).sort()).toEqual(keys);
    }
  });

  // Paying more must never buy less. null is unlimited, so it sorts last.
  it("never lets a higher tier get a lower cap", () => {
    const rank = (n: number | null) => (n === null ? Infinity : n);
    const metered = [
      "mocksPerMonth",
      "drillsPerDay",
      "descriptiveMarkingsPerMonth",
      "askOnelyPerDay",
      "communityDoubtsPerMonth",
      "currentAffairsDays",
    ] as const;

    for (const key of metered) {
      expect(rank(PLAN_LIMITS.free[key])).toBeLessThanOrEqual(
        rank(PLAN_LIMITS.pro[key]),
      );
      expect(rank(PLAN_LIMITS.pro[key])).toBeLessThanOrEqual(
        rank(PLAN_LIMITS.pro_plus[key]),
      );
    }
  });

  // Each of these is one LLM call per use. Unlimited against a per-call cost
  // loses money on exactly the users who use it most, so no tier may set null.
  it("caps everything that costs a model call, on every tier", () => {
    for (const tier of TIERS) {
      expect(PLAN_LIMITS[tier].descriptiveMarkingsPerMonth).not.toBeNull();
      expect(PLAN_LIMITS[tier].askOnelyPerDay).not.toBeNull();
    }
  });

  it("treats an absent cap as no cap", () => {
    expect(withinLimit(null, 10_000)).toBe(true);
    expect(withinLimit(5, 4)).toBe(true);
    expect(withinLimit(5, 5)).toBe(false);
  });

  it("only free is barred from the attempt map", () => {
    expect(limitsFor("free").attemptMap).toBe(false);
    expect(limitsFor("pro").attemptMap).toBe(true);
    expect(limitsFor("pro_plus").attemptMap).toBe(true);
  });
});

describe("pricing copy", () => {
  it("offers the three tiers plus Institute, with one featured", () => {
    expect(PLAN_COPY.map((p) => p.id)).toEqual([
      "free",
      "pro",
      "pro_plus",
      "school",
    ]);
    expect(PLAN_COPY.filter((p) => p.featured)).toHaveLength(1);
  });

  // The bullets are generated from PLAN_LIMITS, so a limit change rewrites the
  // marketing copy. This pins that they are actually wired to it.
  it("states the limits the server enforces", () => {
    const pro = PLAN_COPY.find((p) => p.id === "pro")!;
    expect(pro.features).toContain("30 descriptive markings a month");
    expect(pro.features).toContain("Unlimited full mocks");

    const free = PLAN_COPY.find((p) => p.id === "free")!;
    expect(free.features).toContain("5 community doubts a month");
    expect(free.features).toContain("Current affairs, last 7 days");
  });
});
