import "server-only";
import { unstable_cache } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentPlans } from "@/db/schema";
import type { Currency } from "./money";
import type { BillingInterval, PlanKey, PlanPrice } from "./types";

export type PricedPlan = PlanPrice & { id: number; razorpayPlanId: string };

// The only place an amount comes from. A checkout route that took an amount
// from its caller would sell Pro for one paisa, and the pricing copy file
// cannot stand in — it ships to the browser, so it holds display values.
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

// Returns prices, never Razorpay plan ids — a plan id in the page source lets
// the caller open a checkout for a plan they chose rather than one we priced.
async function queryPlans(currency: Currency): Promise<PlanPrice[]> {
  const rows = await db
    .select()
    .from(paymentPlans)
    .where(
      and(eq(paymentPlans.currency, currency), eq(paymentPlans.active, true)),
    );

  return rows.map(({ plan, interval, amountMinor }) => ({
    plan,
    interval,
    currency,
    amountMinor,
  }));
}

// Prices change by seeding a new plan row, which is rare; the landing page
// renders these to every visitor.
export const listPlans = unstable_cache(queryPlans, ["billing", "plans"], {
  revalidate: 3600,
});
