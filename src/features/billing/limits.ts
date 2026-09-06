// Every per-plan limit in the product, in one table. Client-safe: the pricing
// grid renders these, and each route re-reads them server-side before allowing
// the action — a number shown to the browser is display, never the check.

export type PlanTier = "free" | "pro" | "pro_plus";

// null means no cap. Only ever put null against something whose marginal cost
// is a database read; anything that costs an LLM call per use carries a number.
export type PlanLimits = {
  mocksPerMonth: number | null;
  drillsPerDay: number | null;
  descriptiveMarkingsPerMonth: number | null;
  askOnelyPerDay: number | null;
  communityDoubtsPerMonth: number | null;
  /** How far back the archive opens. null is the whole thing. */
  currentAffairsDays: number | null;
  attemptMap: boolean;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    mocksPerMonth: 2,
    drillsPerDay: 3,
    descriptiveMarkingsPerMonth: 2,
    askOnelyPerDay: 5,
    communityDoubtsPerMonth: 5,
    currentAffairsDays: 7,
    attemptMap: false,
  },
  pro: {
    mocksPerMonth: null,
    drillsPerDay: null,
    descriptiveMarkingsPerMonth: 30,
    askOnelyPerDay: 50,
    communityDoubtsPerMonth: 15,
    currentAffairsDays: null,
    attemptMap: true,
  },
  // Deliberately capped rather than unlimited. A marking is one LLM call at
  // roughly ₹1.85, so 150 of them is ₹277 of a ₹400 plan; "unlimited" against
  // a per-call cost loses money precisely on the heaviest users.
  pro_plus: {
    mocksPerMonth: null,
    drillsPerDay: null,
    descriptiveMarkingsPerMonth: 150,
    askOnelyPerDay: 200,
    communityDoubtsPerMonth: 40,
    currentAffairsDays: null,
    attemptMap: true,
  },
};

export const limitsFor = (plan: PlanTier): PlanLimits => PLAN_LIMITS[plan];

// A null cap always passes. Callers pass the count already used this period.
export function withinLimit(cap: number | null, used: number): boolean {
  return cap === null || used < cap;
}
