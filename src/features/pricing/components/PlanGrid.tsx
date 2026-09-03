"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Segmented,
  cn,
} from "@/design-system";
import {
  MONTHLY_PRICE,
  PLANS,
  type BillingCycle,
  type Plan,
} from "@/features/pricing/plans";

const ANNUAL_SAVING_PCT = Math.round(
  (1 - PLANS[1].annual / MONTHLY_PRICE) * 100,
);

type Props = {
  // Drives the CTA: checkout vs signup.
  variant: "app" | "public";
  // The landing page already owns an <h2> for the pricing section, so plan
  // names drop a level there to avoid outranking it.
  headingLevel?: 2 | 3;
};

function PlanCta({
  plan,
  billing,
  variant,
}: Props & { plan: Plan; billing: BillingCycle }) {
  if (plan.id === "pro") {
    return (
      <ButtonLink href={`/upgrade/checkout?billing=${billing}`} block>
        {variant === "public" ? "Get Pro" : plan.cta}
      </ButtonLink>
    );
  }
  if (plan.id === "free") {
    return variant === "public" ? (
      <ButtonLink href="/signup" variant="secondary" block>
        Start free
      </ButtonLink>
    ) : (
      <Button variant="secondary" block disabled>
        Current plan
      </Button>
    );
  }
  return (
    <Button variant="secondary" block>
      Contact us
    </Button>
  );
}

function billingNote(plan: Plan, billing: BillingCycle): string {
  if (plan.id === "pro") {
    return billing === "annual"
      ? "Billed £59 yearly · cancel anytime"
      : "Billed monthly · cancel anytime";
  }
  return plan.id === "school"
    ? "Annual invoice · min 20 students"
    : "Free forever";
}

export function PlanGrid({ variant, headingLevel = 2 }: Props) {
  const [billing, setBilling] = useState<BillingCycle>("annual");
  const PlanName = headingLevel === 3 ? "h3" : "h2";

  return (
    <>
      <Segmented
        value={billing}
        options={["monthly", "annual"] as const}
        onChange={setBilling}
        className="mt-10"
        labels={{
          monthly: "Monthly",
          annual: (
            <>
              Annual
              <Badge tone="ok">Save {ANNUAL_SAVING_PCT}%</Badge>
            </>
          ),
        }}
      />

      <div className="mt-7 grid items-start gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const price = billing === "annual" ? plan.annual : plan.monthly;
          return (
            <Card
              key={plan.id}
              pad={false}
              className={cn(
                "relative flex flex-col p-6",
                // The featured plan is raised by a ring, not a shadow -- the
                // design system reserves shadows for things that float.
                plan.featured && "ring-brand ring-1",
              )}
            >
              {plan.featured ? (
                <span className="rounded-pill bg-brand absolute -top-3 left-6 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <Sparkles size={12} strokeWidth={2} />
                  Most popular
                </span>
              ) : null}

              <PlanName className="text-[18px] font-semibold tracking-[-0.02em]">
                {plan.name}
              </PlanName>
              <p className="text-ink-2 mt-0.5 text-[14px]">{plan.tagline}</p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="tnum text-[30px] font-semibold tracking-[-0.03em]">
                  £{price % 1 === 0 ? price : price.toFixed(2)}
                </span>
                <span className="text-ink-3 text-[14px]">
                  {plan.id === "school" ? "/ student / mo" : "/ month"}
                </span>
              </div>
              <p className="text-ink-3 mt-1 text-[12.5px]">
                {billingNote(plan, billing)}
              </p>

              <ul className="text-ink-2 mt-5 mb-6 grid gap-2.5 text-[14px]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      size={15}
                      strokeWidth={2.5}
                      className="text-ok mt-0.5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <PlanCta plan={plan} billing={billing} variant={variant} />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
