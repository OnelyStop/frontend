// Display copy only. Prices come from payment_plans on the server.

export type PlanId = "free" | "pro" | "school";

export type PlanCopy = {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
  featured?: boolean;
};

export const PLAN_COPY: PlanCopy[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need to start sitting papers",
    features: [
      "Knowledge base: every subject, chapter and topic",
      "Private notes and flashcards",
      "Daily current affairs, last 7 days",
      "Two full mocks a month under sectional timing",
      "5 community doubts a month",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Unlimited practice, calibrated to your exam",
    featured: true,
    features: [
      "Unlimited mocks and drills",
      "Unlimited descriptive marking",
      "Full current-affairs archive",
      "Attempt map and progress across every sitting",
      "Ask Onely on any passage",
      "15 community doubts a month",
    ],
  },
  {
    id: "school",
    name: "Institute",
    tagline: "For coaching centres and colleges",
    features: [
      "Pro for every student in the batch",
      "One invoice, paid by the institute",
      "Priced per student per year",
    ],
  },
];
