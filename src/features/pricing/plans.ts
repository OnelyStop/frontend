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
      "Basic progress tracking",
      "Sticky notes",
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
      "Unlimited AI-curated exams & PYQ mixes",
      "AI tutor with step-by-step working",
      "Diagram generator",
      "AI interview practice",
      "A* Memory & full progress insights",
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
