export type BillingCycle = "monthly" | "annual";

export type Plan = {
  id: "free" | "pro" | "school";
  name: string;
  tagline: string;
  monthly: number;
  annual: number; // per month, billed yearly
  cta: string;
  featured?: boolean;
  features: string[];
};

export const ANNUAL_TOTAL = 59;
export const MONTHLY_PRICE = 7.99;

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started with the essentials",
    monthly: 0,
    annual: 0,
    cta: "Current plan",
    features: [
      "Question bank access",
      "5 answer markings / week",
      "1 PYQ mix per day",
      "Flashcards from your dropped marks",
      "Basic progress tracking",
      "Sticky notes",
      "5 community posts / month",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Everything unlimited, built for A*",
    monthly: MONTHLY_PRICE,
    annual: ANNUAL_TOTAL / 12,
    cta: "Upgrade to Pro",
    featured: true,
    features: [
      "Unlimited answer & essay marking",
      "Unlimited PYQ mixes",
      "Ask Onely on any question or paper",
      "Flashcard scheduling tied to your exam dates",
      "Full progress insights",
      "15 community posts / month",
      "Priority marking queue",
    ],
  },
  {
    id: "school",
    name: "School",
    tagline: "For departments and sixth forms",
    monthly: 3,
    annual: 3,
    cta: "Contact us",
    features: [
      "Everything in Pro, per student",
      "Class dashboards & teacher analytics",
      "Set assignments from the bank",
      "Bulk seats with central billing",
      "Priority support",
    ],
  },
];
