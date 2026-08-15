"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import {
  MONTHLY_PRICE,
  PLANS,
  type BillingCycle,
  type Plan,
} from "../../data/plans";
import Link from "next/link";

const ANNUAL_SAVING_PCT = Math.round(
  (1 - PLANS[1].annual / MONTHLY_PRICE) * 100,
);

type Props = {
  // "app" renders checkout CTAs for logged-in users; "public" renders
  // signup-style CTAs for the marketing site
  variant: "app" | "public";
};

function PlanCta({ plan, billing, variant }: Props & { plan: Plan; billing: BillingCycle }) {
  if (plan.id === "pro") {
    return (
      <Link href={`/upgrade/checkout?billing=${billing}`}>
        <Button className="plan-card__cta">
          {variant === "public" ? "Get Pro" : plan.cta}
        </Button>
      </Link>
    );
  }
  if (plan.id === "free") {
    return variant === "public" ? (
      <Link href="/signup">
        <Button variant="outline" className="plan-card__cta">
          Start free
        </Button>
      </Link>
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

export function PlanGrid({ variant }: Props) {
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
              <h2 className="plan-card__name">{plan.name}</h2>
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
