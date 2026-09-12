"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  StatusPill,
  Button,
  ButtonLink,
  Card,
  Segmented,
  cn,
} from "@/design-system";
import { SUPPORT_EMAIL } from "@/config/site";
import type { PlanTier } from "@/features/billing/limits";
import { formatAmount } from "@/features/billing/money";
import type { BillingInterval, PlanPrice } from "@/features/billing/types";
import { discountPercent } from "@/features/pricing/discount";
import { PLAN_COPY, type PlanCopy } from "@/features/pricing/plans";

type Props = {
  variant: "app" | "public";
  prices: PlanPrice[];
  entitled?: boolean;
  currentPlan?: PlanTier;
  billingEnabled?: boolean;
  // The landing page owns the section's <h2>, so plan names drop a level there.
  headingLevel?: 2 | 3;
};

function PlanCta({
  plan,
  interval,
  variant,
  entitled,
  currentPlan,
  available,
}: {
  plan: PlanCopy;
  interval: BillingInterval;
  variant: Props["variant"];
  entitled: boolean;
  currentPlan: PlanTier;
  available: boolean;
}) {
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

  if (plan.id === currentPlan)
    return (
      <Button variant="secondary" block disabled>
        Current plan
      </Button>
    );
  // A second mandate is refused while one is active, so switching tiers is a support job, not a checkout.
  if (entitled)
    return (
      <ButtonLink href={`mailto:${SUPPORT_EMAIL}`} variant="secondary" block>
        Email us to switch
      </ButtonLink>
    );
  if (!available)
    return (
      <Button variant="secondary" block disabled>
        Coming soon
      </Button>
    );

  // "secondary" (opaque white) rather than "primary" (near-black) when featured — the card itself is already dark.
  return (
    <ButtonLink
      href={`/upgrade/checkout?plan=${plan.id}&interval=${interval}`}
      variant={plan.featured ? "secondary" : "primary"}
      block
    >
      {variant === "public" ? `Get ${plan.name}` : `Upgrade to ${plan.name}`}
    </ButtonLink>
  );
}

export function PlanGrid({
  variant,
  prices,
  entitled = false,
  currentPlan = "free",
  billingEnabled = true,
  headingLevel = 2,
}: Props) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const PlanName = headingLevel === 3 ? "h3" : "h2";

  const priceFor = (plan: PlanCopy, at: BillingInterval = interval) =>
    prices.find((p) => p.plan === plan.id && p.interval === at) ?? null;

  // Quoted off Pro, which is the plan the toggle is really asking about.
  const pro = PLAN_COPY.find((p) => p.id === "pro")!;
  const proMonthly = priceFor(pro, "monthly");
  const proYearly = priceFor(pro, "yearly");
  const savingPct =
    proMonthly && proYearly
      ? Math.round(
          (1 - proYearly.amountMinor / (12 * proMonthly.amountMinor)) * 100,
        )
      : 0;

  // Yearly quoted per month so tiers compare; the line below says the real total.
  const perMonth = (minor: number) =>
    interval === "yearly" ? Math.round(minor / 12) : minor;

  const headline = (plan: PlanCopy): string => {
    if (plan.id === "free")
      return formatAmount(0, priceFor(pro)?.currency ?? "INR");
    const price = priceFor(plan);
    return price
      ? formatAmount(perMonth(price.amountMinor), price.currency)
      : "—";
  };

  const priceLine = (plan: PlanCopy): string => {
    if (plan.id === "free") return "Free forever";
    const price = priceFor(plan);
    if (!price) return "";
    return interval === "yearly"
      ? `${formatAmount(price.amountMinor, price.currency)} a year · cancel anytime`
      : "Billed monthly · cancel anytime";
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
                <span className="text-ok-2 text-[12px] font-semibold">
                  −{savingPct}%
                </span>
              ) : null}
            </>
          ),
        }}
      />

      <div className="mt-7 grid items-stretch gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_COPY.map((plan) => {
          const price = priceFor(plan);
          const off = price
            ? discountPercent(price.amountMinor, price.listAmountMinor)
            : null;

          return (
            <Card
              key={plan.id}
              pad={false}
              className={cn(
                "relative flex flex-col p-6",
                // The flagship is a dark card, not a ring on a white one — the rest of it inverts to match.
                plan.featured && "bg-frame shadow-pop",
              )}
            >
              {plan.featured ? (
                <span className="bg-canvas text-frame rounded-pill absolute -top-3 left-6 px-2.5 py-1 text-[11px] font-bold tracking-[0.01em]">
                  onelystop flagship
                </span>
              ) : null}

              <PlanName
                className={cn(
                  "text-[18px] tracking-[-0.02em]",
                  plan.featured
                    ? "text-on-frame text-[20px] font-bold"
                    : "font-semibold",
                )}
              >
                {plan.name}
              </PlanName>
              <p
                className={cn(
                  "mt-0.5 text-[14px]",
                  plan.featured ? "text-on-frame-2" : "text-ink-2",
                )}
              >
                {plan.tagline}
              </p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "tnum tracking-[-0.03em]",
                    plan.featured
                      ? "text-on-frame text-[24px] font-bold"
                      : "text-[20px] font-semibold",
                  )}
                >
                  {headline(plan)}
                </span>
                <span
                  className={cn(
                    "text-[14px]",
                    plan.featured ? "text-on-frame-3" : "text-ink-3",
                  )}
                >
                  / month
                </span>
              </div>

              {off && price?.listAmountMinor ? (
                <p className="mt-1 flex items-baseline gap-2 text-[12.5px]">
                  <span
                    className={cn(
                      "tnum line-through",
                      plan.featured ? "text-on-frame-3" : "text-ink-3",
                    )}
                  >
                    {formatAmount(
                      perMonth(price.listAmountMinor),
                      price.currency,
                    )}
                  </span>
                  <StatusPill tone="ok">{off}% off</StatusPill>
                </p>
              ) : null}

              <p
                className={cn(
                  "mt-1 min-h-5 text-[12.5px]",
                  plan.featured ? "text-on-frame-3" : "text-ink-3",
                )}
              >
                {priceLine(plan)}
              </p>

              <ul
                className={cn(
                  "mt-5 mb-6 grid gap-2.5 text-[14px]",
                  plan.featured ? "text-on-frame font-medium" : "text-ink-2",
                )}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      size={15}
                      strokeWidth={2.5}
                      className={cn(
                        "mt-0.5 shrink-0",
                        plan.featured ? "text-on-frame" : "text-ok",
                      )}
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
                  currentPlan={currentPlan}
                  available={billingEnabled && !!price}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
