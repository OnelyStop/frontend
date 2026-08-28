import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { paymentPlans } from "@/db/schema";
import type { Currency } from "./currency";

export type BillingInterval = "monthly" | "yearly";
export type PlanKey = "pro" | "school";

export type PricedPlan = {
  id: number;
  plan: PlanKey;
  interval: BillingInterval;
  currency: Currency;
  razorpayPlanId: string;
  amountMinor: number;
};

/**
 * The price of one plan, read from the database.
 *
 * This is the only place an amount comes from. A checkout route that accepted
 * an amount from its caller would sell Pro for one paisa, and `features/pricing/
 * plans.ts` cannot stand in for it: that file ships to the browser, so anything
 * it says is a display value, not a price.
 *
 * `server-only` at the top of this file makes importing it from a client
 * component a build error rather than a leak.
 */
export async function findPlan(
  plan: PlanKey,
  interval: BillingInterval,
  currency: Currency,
): Promise<PricedPlan | null> {
  const [row] = await db
    .select()
    .from(paymentPlans)
    .where(
      and(
        eq(paymentPlans.plan, plan),
        eq(paymentPlans.interval, interval),
        eq(paymentPlans.currency, currency),
        eq(paymentPlans.active, true),
      ),
    )
    .limit(1);

  return row
    ? {
        id: row.id,
        plan: row.plan,
        interval: row.interval,
        currency: row.currency,
        razorpayPlanId: row.razorpayPlanId,
        amountMinor: row.amountMinor,
      }
    : null;
}

/**
 * Every active plan in one currency, for rendering a pricing page.
 *
 * Returns prices, never Razorpay plan ids — a plan id in the page source is an
 * invitation to open a checkout for a plan the caller chose rather than one we
 * priced.
 */
export async function listPlans(
  currency: Currency,
): Promise<Omit<PricedPlan, "razorpayPlanId">[]> {
  const rows = await db
    .select()
    .from(paymentPlans)
    .where(and(eq(paymentPlans.currency, currency), eq(paymentPlans.active, true)));

  return rows.map(({ id, plan, interval, amountMinor }) => ({
    id,
    plan,
    interval,
    currency,
    amountMinor,
  }));
}
