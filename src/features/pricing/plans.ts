import {
  PLAN_LIMITS,
  type PlanLimits,
  type PlanTier,
} from "@/features/billing/limits";

// Display copy only. Prices come from payment_plans on the server.

export type PlanId = PlanTier | "school";

export type PlanCopy = {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
  featured?: boolean;
};

// Bullets are generated from the limits table rather than typed out beside it.
// A pricing page that promises a number the server does not enforce is the
// failure mode worth designing out.
const per = (n: number | null, noun: string, period: string) =>
  n === null ? `Unlimited ${noun}` : `${n} ${noun} ${period}`;

const paidBullets = (l: PlanLimits): string[] => [
  per(l.mocksPerMonth, "full mocks", "a month"),
  per(l.drillsPerDay, "drills", "a day"),
  per(l.descriptiveMarkingsPerMonth, "descriptive markings", "a month"),
  per(l.askOnelyPerDay, "Ask Onely questions", "a day"),
  per(l.communityDoubtsPerMonth, "community doubts", "a month"),
];

export const PLAN_COPY: PlanCopy[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Enough to sit real papers and find your weak section",
    features: [
      "Knowledge base, private notes and flashcards",
      ...paidBullets(PLAN_LIMITS.free),
      `Current affairs, last ${PLAN_LIMITS.free.currentAffairsDays} days`,
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Unlimited practice, calibrated to your exam",
    featured: true,
    features: [
      ...paidBullets(PLAN_LIMITS.pro),
      "Attempt map and progress across every sitting",
      "Full current-affairs archive",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    tagline: "For the descriptive papers and the last mile",
    features: [
      "Everything in Pro",
      per(
        PLAN_LIMITS.pro_plus.descriptiveMarkingsPerMonth,
        "descriptive markings",
        "a month",
      ),
      per(PLAN_LIMITS.pro_plus.askOnelyPerDay, "Ask Onely questions", "a day"),
      per(
        PLAN_LIMITS.pro_plus.communityDoubtsPerMonth,
        "community doubts",
        "a month",
      ),
    ],
  },
  {
    id: "school",
    name: "Institute",
    tagline: "For coaching centres and colleges",
    features: [
      "Pro+ for every student in the batch",
      "One invoice, paid by the institute",
      "Priced per student per year",
    ],
  },
];
