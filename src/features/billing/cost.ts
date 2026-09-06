import { PLAN_LIMITS, type PlanTier } from "./limits";

// Paise per call: marking on Gemini 3.8 Flash, Ask Onely on DeepSeek V4 Flash.
export const COST_PER_CALL_PAISE = {
  descriptiveMarking: 26,
  askOnely: 2,
} as const;

// A month of one user using every call they are owed. Real use is far below it.
export function worstCaseMonthlyCostPaise(plan: PlanTier): number {
  const l = PLAN_LIMITS[plan];
  return (
    (l.descriptiveMarkingsPerMonth ?? 0) *
      COST_PER_CALL_PAISE.descriptiveMarking +
    (l.askOnelyPerMonth ?? 0) * COST_PER_CALL_PAISE.askOnely
  );
}

// Launch prices in paise, pinned so the cost guard has something to measure.
export const MONTHLY_PRICE_PAISE: Record<PlanTier, number> = {
  free: 0,
  pro: 25_000,
  pro_plus: 40_000,
};
