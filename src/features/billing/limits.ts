export type PlanTier = "free" | "pro" | "pro_plus";

export type PlanLimits = {
  mocksPerMonth: number | null;
  drillsPerDay: number | null;
  descriptiveMarkingsPerMonth: number | null;
  // Monthly, not daily: a daily cap is silently thirty times itself.
  askOnelyPerMonth: number | null;
  communityDoubtsPerMonth: number | null;
  currentAffairsDays: number | null;
  attemptMap: boolean;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    mocksPerMonth: 2,
    drillsPerDay: 3,
    descriptiveMarkingsPerMonth: 2,
    askOnelyPerMonth: 30,
    communityDoubtsPerMonth: 5,
    currentAffairsDays: 7,
    attemptMap: false,
  },
  pro: {
    mocksPerMonth: null,
    drillsPerDay: null,
    descriptiveMarkingsPerMonth: 30,
    askOnelyPerMonth: 250,
    communityDoubtsPerMonth: 15,
    currentAffairsDays: null,
    attemptMap: true,
  },
  // Capped, not unlimited — every marking is a model call. Ceiling in cost.ts.
  pro_plus: {
    mocksPerMonth: null,
    drillsPerDay: null,
    descriptiveMarkingsPerMonth: 80,
    askOnelyPerMonth: 800,
    communityDoubtsPerMonth: 40,
    currentAffairsDays: null,
    attemptMap: true,
  },
};

export const limitsFor = (plan: PlanTier): PlanLimits => PLAN_LIMITS[plan];

export const PLAN_NAME: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

export function withinLimit(cap: number | null, used: number): boolean {
  return cap === null || used < cap;
}
