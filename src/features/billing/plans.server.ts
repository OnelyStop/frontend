import "server-only";
import { unstable_cache } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentPlans } from "@/db/schema";
import type { Currency } from "./money";
import type { BillingInterval, PlanKey, PlanPrice } from "./types";

export type PricedPlan = PlanPrice & { id: number; razorpayPlanId: string };

// The only place an amount comes from; a caller-supplied one sells Pro for a paisa.
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
        listAmountMinor: row.listAmountMinor,
      }
    : null;
}

// Prices, never plan ids: a plan id in the page source lets the caller pick it.
async function queryPlans(currency: Currency): Promise<PlanPrice[]> {
  const rows = await db
    .select()
    .from(paymentPlans)
    .where(
      and(eq(paymentPlans.currency, currency), eq(paymentPlans.active, true)),
    );

  return rows.map(({ plan, interval, amountMinor, listAmountMinor }) => ({
    plan,
    interval,
    currency,
    amountMinor,
    listAmountMinor,
  }));
}

// Prices change only by seeding a new row, and every visitor renders these.
export const listPlans = unstable_cache(queryPlans, ["billing", "plans"], {
  revalidate: 3600,
});
