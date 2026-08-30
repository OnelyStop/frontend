"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button, ButtonLink } from "@/components/marketing/Button";
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

function PlanCta({ plan, billing, variant }: Props & { plan: Plan; billing: BillingCycle }) {
  if (plan.id === "pro") {
    return (
      <ButtonLink
        href={`/upgrade/checkout?billing=${billing}`}
        className="plan-card__cta"
      >
        {variant === "public" ? "Get Pro" : plan.cta}
      </ButtonLink>
    );
  }
  if (plan.id === "free") {
    return variant === "public" ? (
      <ButtonLink href="/signup" variant="outline" className="plan-card__cta">
        Start free
      </ButtonLink>
    ) : (
      <Button variant="outline" className="plan-card__cta" disabled>
        Current plan
      </Button>
    );
  }
  return (
    <Button variant="outline" className="plan-card__cta">
      Contact us
    </Button>
  );
}

export function PlanGrid({ variant, headingLevel = 2 }: Props) {
  const [billing, setBilling] = useState<BillingCycle>("annual");

  return (
    <>
      <div className="billing-toggle" role="tablist" aria-label="Billing cycle">
        <button
          type="button"
          role="tab"
          aria-selected={billing === "monthly"}
          className={`billing-toggle__option ${
            billing === "monthly" ? "billing-toggle__option--active" : ""
          }`}
          onClick={() => setBilling("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={billing === "annual"}
          className={`billing-toggle__option ${
            billing === "annual" ? "billing-toggle__option--active" : ""
          }`}
          onClick={() => setBilling("annual")}
        >
          Annual
          <span className="billing-toggle__save">Save {ANNUAL_SAVING_PCT}%</span>
        </button>
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const price = billing === "annual" ? plan.annual : plan.monthly;
          return (
            <article
              key={plan.id}
              className={`plan-card ${plan.featured ? "plan-card--featured" : ""}`}
            >
              {plan.featured && (
                <div className="plan-card__flag">
                  <Sparkles size={12} strokeWidth={2} />
                  Most popular
                </div>
              )}
              {headingLevel === 3 ? (
                <h3 className="plan-card__name">{plan.name}</h3>
              ) : (
                <h2 className="plan-card__name">{plan.name}</h2>
              )}
              <p className="plan-card__tagline">{plan.tagline}</p>
              <div className="plan-card__price">
                <span className="plan-card__amount">
                  £{price % 1 === 0 ? price : price.toFixed(2)}
                </span>
                <span className="plan-card__per">
                  {plan.id === "school" ? "/ student / mo" : "/ month"}
                </span>
              </div>
              <div className="plan-card__billing-note">
                {plan.id === "pro"
                  ? billing === "annual"
                    ? "Billed £59 yearly · cancel anytime"
                    : "Billed monthly · cancel anytime"
                  : plan.id === "school"
                    ? "Annual invoice · min 20 students"
                    : "Free forever"}
              </div>

              <ul className="plan-card__features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>

              <PlanCta plan={plan} billing={billing} variant={variant} />
            </article>
          );
        })}
      </div>
    </>
  );
}
