import "server-only";
import { unstable_cache } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentPlans } from "@/db/schema";
import { captureError } from "@/lib/observability.server";
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
const cachedPlans = unstable_cache(queryPlans, ["billing", "plans"], {
  revalidate: 3600,
});

/**
 * Display prices only — `findPlan` is what a charge is computed from, and it
 * has no fallback on purpose.
 *
 * An empty list renders as "—" rather than a price, which is the right outcome
 * for the public landing page: it is the front door and must not 500 because
 * the database blinked or because nothing has been seeded yet. The catch sits
 * outside the cache so a transient failure is not held for the full hour.
 */
export async function listPlans(currency: Currency): Promise<PlanPrice[]> {
  try {
    return await cachedPlans(currency);
  } catch (error) {
    captureError(error, { at: "listPlans", currency });
    return [];
  }
}
