import {
  PLAN_LIMITS,
  quotaPhrase,
  type PlanLimits,
  type PlanTier,
} from "@/features/billing/limits";

// Display copy only. Prices come from payment_plans on the server.

export type PlanId = PlanTier;

export type PlanCopy = {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
  featured?: boolean;
};

// Generated from the limits table, so the page cannot promise an unenforced number.
const quotaBullets = (l: PlanLimits): string[] => [
  quotaPhrase(l.mocks, "full mocks"),
  quotaPhrase(l.drills, "drills"),
  quotaPhrase(l.descriptiveMarkings, "descriptive markings"),
  quotaPhrase(l.askOnely, "Ask Onely questions"),
  quotaPhrase(l.communityDoubts, "community doubts"),
];

const free = PLAN_LIMITS.free;

export const PLAN_COPY: PlanCopy[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Enough to sit a real paper and see where you stand",
    features: [
      `The first ${free.knowledgeBaseTopicsPerSubject} topics of every subject`,
      ...quotaBullets(free),
      `Current affairs, last ${free.currentAffairsDays} days`,
      `${free.privateNotes} private notes and ${free.mockPapers} mock papers`,
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Unlimited practice, calibrated to your exam",
    features: [
      "The whole knowledge base, every mock paper, unlimited notes",
      ...quotaBullets(PLAN_LIMITS.pro),
      "Attempt map and progress across every sitting",
      "Full current-affairs archive",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    tagline: "For the descriptive papers and the last mile",
    // The one paid plan built around a person, not a cap — the marking. Carries the card's flagship treatment.
    featured: true,
    features: [
      "Everything in Pro",
      quotaPhrase(
        PLAN_LIMITS.pro_plus.descriptiveMarkings,
        "descriptive markings",
      ),
      quotaPhrase(PLAN_LIMITS.pro_plus.askOnely, "Ask Onely questions"),
      quotaPhrase(PLAN_LIMITS.pro_plus.communityDoubts, "community doubts"),
    ],
  },
];
