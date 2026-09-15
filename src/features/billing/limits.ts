export type PlanTier = "free" | "pro" | "pro_plus";

/** "account" is a lifetime cap, not a period — it never refills, which is what makes a free AI allowance a trial rather than a recurring cost. */
export type Period = "day" | "month" | "account";

export type Quota = { cap: number | null; per: Period };

export type PlanLimits = {
  mocks: Quota;
  drills: Quota;
  descriptiveMarkings: Quota;
  askOnely: Quota;
  communityDoubts: Quota;
  currentAffairsDays: number | null;
  /** How stale the newest free day is. Current affairs is worth most the day it happens, so the delay is the paywall and the window is only a taste. */
  currentAffairsDelayDays: number | null;
  knowledgeBaseTopicsPerSubject: number | null;
  privateNotes: number | null;
  mockPapers: number | null;
  attemptMap: boolean;
};

const UNLIMITED: Quota = { cap: null, per: "month" };

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  // Held to 15% of what a paid tier gets, on every countable axis.
  free: {
    mocks: { cap: 2, per: "month" },
    drills: { cap: 5, per: "month" },
    descriptiveMarkings: { cap: 2, per: "account" },
    askOnely: { cap: 3, per: "account" },
    communityDoubts: { cap: 2, per: "month" },
    currentAffairsDays: 2,
    currentAffairsDelayDays: 5,
    knowledgeBaseTopicsPerSubject: 2,
    privateNotes: 4,
    mockPapers: 5,
    attemptMap: false,
  },
  pro: {
    mocks: UNLIMITED,
    drills: UNLIMITED,
    descriptiveMarkings: { cap: 10, per: "month" },
    askOnely: { cap: 250, per: "month" },
    communityDoubts: { cap: 15, per: "month" },
    currentAffairsDays: null,
    currentAffairsDelayDays: null,
    knowledgeBaseTopicsPerSubject: null,
    privateNotes: null,
    mockPapers: null,
    attemptMap: true,
  },
  // Capped, not unlimited — every marking is a model call. Ceiling in cost.ts.
  pro_plus: {
    mocks: UNLIMITED,
    drills: UNLIMITED,
    descriptiveMarkings: { cap: 50, per: "month" },
    askOnely: { cap: 550, per: "month" },
    communityDoubts: { cap: 30, per: "month" },
    currentAffairsDays: null,
    currentAffairsDelayDays: null,
    knowledgeBaseTopicsPerSubject: null,
    privateNotes: null,
    mockPapers: null,
    attemptMap: true,
  },
};

/** Exam strategy is how to pass the exam, not subject content — gating it would hide the most persuasive thing a prospect can read. */
export const UNGATED_SUBJECT_SLUGS = ["exam-guidance"] as const;

export const limitsFor = (plan: PlanTier): PlanLimits => PLAN_LIMITS[plan];

/** Pure so the page, the listing and the tests all decide the same way; rank comes from the database. */
export function topicUnlocked(
  limits: PlanLimits,
  subjectSlug: string,
  rank: number,
): boolean {
  const cap = limits.knowledgeBaseTopicsPerSubject;
  if (cap === null) return true;
  if ((UNGATED_SUBJECT_SLUGS as readonly string[]).includes(subjectSlug))
    return true;
  return rank <= cap;
}

export const PLAN_NAME: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

export function withinLimit(cap: number | null, used: number): boolean {
  return cap === null || used < cap;
}

const PERIOD_LABEL: Record<Period, string> = {
  day: "a day",
  month: "a month",
  account: "in total",
};

/** Every page renders a quota through this, so a limit change cannot leave one of them promising the old number. */
export function quotaPhrase(q: Quota, noun: string): string {
  return q.cap === null
    ? `Unlimited ${noun}`
    : `${q.cap} ${noun} ${PERIOD_LABEL[q.per]}`;
}
