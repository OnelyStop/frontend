import { describe, expect, it } from "vitest";
import {
  MONTHLY_PRICE_PAISE,
  worstCaseMonthlyCostPaise,
} from "@/features/billing/cost";
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
  // Pinned: a price edit that leaves the list price behind moves the badge.
  it("quotes the advertised launch discounts", () => {
    expect(discountPercent(25_000, 55_000)).toBe(55); // Pro ₹250 from ₹550
    expect(discountPercent(40_000, 100_000)).toBe(60); // Pro+ ₹400 from ₹1,000
    expect(discountPercent(250_000, 550_000)).toBe(55); // Pro, yearly
    expect(discountPercent(400_000, 1_000_000)).toBe(60); // Pro+, yearly
  });

  it("shows nothing when there is no offer", () => {
    expect(discountPercent(25_000, null)).toBeNull();
  });

  // Otherwise "0% off", or a negative, next to a price someone is about to pay.
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
      "askOnelyPerMonth",
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

  // One model call each, so no tier may leave them uncapped.
  it("caps everything that costs a model call, on every tier", () => {
    for (const tier of TIERS) {
      expect(PLAN_LIMITS[tier].descriptiveMarkingsPerMonth).not.toBeNull();
      expect(PLAN_LIMITS[tier].askOnelyPerMonth).not.toBeNull();
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

describe("what a user costs us", () => {
  const pct = (tier: PlanTier) =>
    (worstCaseMonthlyCostPaise(tier) / MONTHLY_PRICE_PAISE[tier]) * 100;

  // The ceiling, in paise a month, if someone uses every call they are owed.
  it("prices each tier's ceiling", () => {
    expect(worstCaseMonthlyCostPaise("free")).toBe(160); // ₹1.60
    expect(worstCaseMonthlyCostPaise("pro")).toBe(1_950); // ₹19.50
    expect(worstCaseMonthlyCostPaise("pro_plus")).toBe(5_800); // ₹58.00
  });

  // Raising a limit unchecked is how a plan starts losing money.
  it("keeps a maxed-out paid user well inside their subscription", () => {
    expect(pct("pro")).toBeLessThan(40);
    expect(pct("pro_plus")).toBeLessThan(40);
  });

  // Free has no revenue behind it, so its ceiling is an acquisition cost.
  it("keeps a free user under ₹5 a month", () => {
    expect(worstCaseMonthlyCostPaise("free")).toBeLessThan(500);
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

  // Pins that the bullets really are generated from PLAN_LIMITS.
  it("states the limits the server enforces", () => {
    const pro = PLAN_COPY.find((p) => p.id === "pro")!;
    expect(pro.features).toContain("30 descriptive markings a month");
    expect(pro.features).toContain("Unlimited full mocks");

    const free = PLAN_COPY.find((p) => p.id === "free")!;
    expect(free.features).toContain("5 community doubts a month");
    expect(free.features).toContain("Current affairs, last 7 days");
  });
});
