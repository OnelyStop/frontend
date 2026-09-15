import { describe, expect, it } from "vitest";
import {
  MONTHLY_PRICE_PAISE,
  ceilingMonthlyAiCostPaise,
  grossMarginPercent,
  monthlyAiCostPaise,
  monthlyCostPaise,
  paymentFeePaise,
} from "@/features/billing/cost";
import {
  PLAN_LIMITS,
  limitsFor,
  topicUnlocked,
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
    expect(discountPercent(270_000, 660_000)).toBe(59); // Pro yearly, ₹2,700 from ₹6,600
    expect(discountPercent(432_000, 1_200_000)).toBe(64); // Pro+ yearly, ₹4,320 from ₹12,000
  });

  // Yearly is twelve months less 10%, which is what the plan grid's toggle quotes.
  it("prices a year at ten per cent under twelve months", () => {
    expect(270_000).toBe(Math.round(25_000 * 12 * 0.9));
    expect(432_000).toBe(Math.round(40_000 * 12 * 0.9));
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
    const quotas = [
      "mocks",
      "drills",
      "descriptiveMarkings",
      "askOnely",
      "communityDoubts",
    ] as const;
    const counts = [
      "currentAffairsDays",
      "privateNotes",
      "mockPapers",
      "knowledgeBaseTopicsPerSubject",
    ] as const;

    for (const key of quotas) {
      expect(rank(PLAN_LIMITS.free[key].cap)).toBeLessThanOrEqual(
        rank(PLAN_LIMITS.pro[key].cap),
      );
      expect(rank(PLAN_LIMITS.pro[key].cap)).toBeLessThanOrEqual(
        rank(PLAN_LIMITS.pro_plus[key].cap),
      );
    }
    for (const key of counts) {
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
      expect(PLAN_LIMITS[tier].descriptiveMarkings.cap).not.toBeNull();
      expect(PLAN_LIMITS[tier].askOnely.cap).not.toBeNull();
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
    (monthlyCostPaise(tier) / MONTHLY_PRICE_PAISE[tier]) * 100;

  it("prices a month of model calls", () => {
    // Zero, not small: free's AI caps are lifetime, so they cost once and never again.
    expect(monthlyAiCostPaise("free")).toBe(0);
    expect(monthlyAiCostPaise("pro")).toBe(1_110);
    expect(monthlyAiCostPaise("pro_plus")).toBe(3_450);
  });

  it("adds Razorpay's cut, which follows the price and not the usage", () => {
    expect(paymentFeePaise("pro")).toBe(590);
    expect(paymentFeePaise("pro_plus")).toBe(944);
    expect(paymentFeePaise("free")).toBe(0);
  });

  it("totals what one subscriber costs", () => {
    expect(monthlyCostPaise("pro")).toBe(1_700);
    expect(monthlyCostPaise("pro_plus")).toBe(4_394);
  });

  it("leaves the margin a subscription business needs", () => {
    expect(grossMarginPercent("pro")).toBe(93);
    expect(grossMarginPercent("pro_plus")).toBe(89);
    expect(grossMarginPercent("free")).toBeNull();
  });

  // Raising a limit unchecked is how a plan starts losing money.
  it("keeps a maxed-out paid user well inside their subscription", () => {
    expect(pct("pro")).toBeLessThan(40);
    expect(pct("pro_plus")).toBeLessThan(40);
  });

  // Free has no revenue behind it, so its cost is an acquisition cost.
  it("keeps a free user under ₹5 a month", () => {
    expect(monthlyAiCostPaise("free")).toBeLessThan(500);
  });

  // Pro+ reaches 78% of its own price here, so what caps the loss is call size, not the quota.
  it("records the ceiling a determined user could reach", () => {
    expect(ceilingMonthlyAiCostPaise("pro")).toBe(8_240);
    expect(ceilingMonthlyAiCostPaise("pro_plus")).toBe(20_900);
  });

  it("never lets even that ceiling cost more than the subscription", () => {
    expect(ceilingMonthlyAiCostPaise("pro")).toBeLessThan(
      MONTHLY_PRICE_PAISE.pro,
    );
    expect(ceilingMonthlyAiCostPaise("pro_plus")).toBeLessThan(
      MONTHLY_PRICE_PAISE.pro_plus,
    );
  });
});

describe("pricing copy", () => {
  it("offers the three tiers, with one featured", () => {
    expect(PLAN_COPY.map((p) => p.id)).toEqual(["free", "pro", "pro_plus"]);
    expect(PLAN_COPY.filter((p) => p.featured)).toHaveLength(1);
  });

  // Pins that the bullets really are generated from PLAN_LIMITS.
  it("states the limits the server enforces", () => {
    const pro = PLAN_COPY.find((p) => p.id === "pro")!;
    expect(pro.features).toContain("10 descriptive markings a month");
    expect(pro.features).toContain("Unlimited full mocks");

    const free = PLAN_COPY.find((p) => p.id === "free")!;
    expect(free.features).toContain("2 community doubts a month");
    expect(free.features).toContain(
      "Current affairs 5 days late, 2 days at a time",
    );
  });
});

// A cap that quietly refills monthly looks identical to a working one until the bill arrives.
describe("lifetime caps", () => {
  it("meters free's two AI features per account, not per month", () => {
    expect(PLAN_LIMITS.free.askOnely.per).toBe("account");
    expect(PLAN_LIMITS.free.descriptiveMarkings.per).toBe("account");
  });

  it("never gives a paid tier a lifetime cap", () => {
    for (const tier of ["pro", "pro_plus"] as const) {
      expect(PLAN_LIMITS[tier].askOnely.per).toBe("month");
      expect(PLAN_LIMITS[tier].descriptiveMarkings.per).toBe("month");
    }
  });
});

describe("knowledge base depth", () => {
  const free = PLAN_LIMITS.free;

  it("gates subject content but never the exam guidance", () => {
    expect(topicUnlocked(free, "quantitative-aptitude", 2)).toBe(true);
    expect(topicUnlocked(free, "quantitative-aptitude", 3)).toBe(false);
    expect(topicUnlocked(free, "exam-guidance", 99)).toBe(true);
  });

  it("leaves every topic open on a paid tier", () => {
    expect(topicUnlocked(PLAN_LIMITS.pro, "quantitative-aptitude", 999)).toBe(
      true,
    );
  });
});

describe("current affairs delay", () => {
  it("holds free back but never a paid tier", () => {
    expect(PLAN_LIMITS.free.currentAffairsDelayDays).toBe(5);
    expect(PLAN_LIMITS.pro.currentAffairsDelayDays).toBeNull();
    expect(PLAN_LIMITS.pro_plus.currentAffairsDelayDays).toBeNull();
  });
});
