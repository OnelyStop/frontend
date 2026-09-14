import { PLAN_LIMITS, type PlanTier } from "./limits";

// OpenRouter rates on 2026-09-14 at ₹95.56/USD: marking on Muse Spark 1.3, Ask Onely on GLM-5.3-Flash.
export const COST_PER_CALL_PAISE = {
  descriptiveMarking: 36,
  askOnely: 3,
} as const;

// The same calls with every input at its cap and the reply run to maxTokens.
export const CEILING_PER_CALL_PAISE = {
  descriptiveMarking: 99,
  askOnely: 29,
} as const;

// Razorpay's domestic rate: 2%, plus 18% GST charged on that fee.
export const PAYMENT_FEE_BPS = 236;

// One scheduled job for the whole product, so it divides by subscribers rather than multiplying.
export const CURRENT_AFFAIRS_MONTHLY_PAISE = 1_500;

// Launch prices in paise, pinned so the cost guard has something to measure.
export const MONTHLY_PRICE_PAISE: Record<PlanTier, number> = {
  free: 0,
  pro: 25_000,
  pro_plus: 40_000,
};

type CallCosts = {
  readonly descriptiveMarking: number;
  readonly askOnely: number;
};

export function monthlyAiCostPaise(
  plan: PlanTier,
  perCall: CallCosts = COST_PER_CALL_PAISE,
): number {
  const l = PLAN_LIMITS[plan];
  return (
    (l.descriptiveMarkingsPerMonth ?? 0) * perCall.descriptiveMarking +
    (l.askOnelyPerMonth ?? 0) * perCall.askOnely
  );
}

export const ceilingMonthlyAiCostPaise = (plan: PlanTier): number =>
  monthlyAiCostPaise(plan, CEILING_PER_CALL_PAISE);

export const paymentFeePaise = (plan: PlanTier): number =>
  Math.round((MONTHLY_PRICE_PAISE[plan] * PAYMENT_FEE_BPS) / 10_000);

export const monthlyCostPaise = (plan: PlanTier): number =>
  monthlyAiCostPaise(plan) + paymentFeePaise(plan);

export function grossMarginPercent(plan: PlanTier): number | null {
  const price = MONTHLY_PRICE_PAISE[plan];
  if (price === 0) return null;
  return Math.round(((price - monthlyCostPaise(plan)) / price) * 100);
}
