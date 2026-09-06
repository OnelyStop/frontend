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
import { SUPPORT_EMAIL } from "@/config/site";
import { formatAmount } from "@/features/billing/money";
import type { BillingInterval, PlanPrice } from "@/features/billing/types";
import { PLAN_COPY, type PlanCopy } from "@/features/pricing/plans";

type Props = {
  variant: "app" | "public";
  prices: PlanPrice[];
  entitled?: boolean;
  billingEnabled?: boolean;
  // The landing page already owns an <h2> for the pricing section, so plan
  // names drop a level there to avoid outranking it.
  headingLevel?: 2 | 3;
};

function PlanCta({
  plan,
  interval,
  variant,
  entitled,
  available,
}: {
  plan: PlanCopy;
  interval: BillingInterval;
  variant: Props["variant"];
  entitled: boolean;
  available: boolean;
}) {
  if (plan.id === "pro") {
    if (entitled)
      return (
        <Button variant="secondary" block disabled>
          Current plan
        </Button>
      );
    if (!available)
      return (
        <Button variant="secondary" block disabled>
          Coming soon
        </Button>
      );
    return (
      <ButtonLink href={`/upgrade/checkout?interval=${interval}`} block>
        {variant === "public" ? "Get Pro" : "Upgrade to Pro"}
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
        {entitled ? "Included" : "Current plan"}
      </Button>
    );
  }
  return (
    <ButtonLink href={`mailto:${SUPPORT_EMAIL}`} variant="secondary" block>
      Contact us
    </ButtonLink>
  );
}

export function PlanGrid({
  variant,
  prices,
  entitled = false,
  billingEnabled = true,
  headingLevel = 2,
}: Props) {
  const [interval, setInterval] = useState<BillingInterval>("yearly");
  const PlanName = headingLevel === 3 ? "h3" : "h2";

  const monthly = prices.find(
    (p) => p.plan === "pro" && p.interval === "monthly",
  );
  const yearly = prices.find(
    (p) => p.plan === "pro" && p.interval === "yearly",
  );
  const savingPct =
    monthly && yearly
      ? Math.round((1 - yearly.amountMinor / (12 * monthly.amountMinor)) * 100)
      : 0;

  const proPrice = (interval === "yearly" ? yearly : monthly) ?? null;
  const available = billingEnabled && !!proPrice;

  const priceLine = (plan: PlanCopy): string => {
    if (plan.id === "free") return "Free forever";
    if (plan.id === "school") return "Per student, annual invoice";
    if (!proPrice) return "";
    return interval === "yearly"
      ? `${formatAmount(proPrice.amountMinor, proPrice.currency)} a year · cancel anytime`
      : "Billed monthly · cancel anytime";
  };

  const headline = (plan: PlanCopy): string => {
    if (plan.id === "free") return formatAmount(0, proPrice?.currency ?? "INR");
    if (plan.id === "school") return "Custom";
    if (!proPrice) return "—";
    const perMonth =
      interval === "yearly"
        ? Math.round(proPrice.amountMinor / 12)
        : proPrice.amountMinor;
    return formatAmount(perMonth, proPrice.currency);
  };

  return (
    <>
      <Segmented
        value={interval}
        options={["monthly", "yearly"] as const}
        onChange={setInterval}
        className="mt-10"
        labels={{
          monthly: "Monthly",
          yearly: (
            <>
              Yearly
              {savingPct > 0 ? (
                <Badge tone="ok">Save {savingPct}%</Badge>
              ) : null}
            </>
          ),
        }}
      />

      <div className="mt-7 grid items-start gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_COPY.map((plan) => (
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
                {headline(plan)}
              </span>
              {plan.id !== "school" ? (
                <span className="text-ink-3 text-[14px]">/ month</span>
              ) : null}
            </div>
            <p className="text-ink-3 mt-1 min-h-5 text-[12.5px]">
              {priceLine(plan)}
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
              <PlanCta
                plan={plan}
                interval={interval}
                variant={variant}
                entitled={entitled}
                available={available}
              />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
