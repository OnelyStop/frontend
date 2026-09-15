import "server-only";
import { unstable_cache } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentPlans } from "@/db/schema";
import { captureError } from "@/lib/observability.server";
import type { Currency } from "./money";
import { keyMode, type RazorpayMode } from "./razorpay.server";
import type { BillingInterval, PlanKey, PlanPrice } from "./types";

export type PricedPlan = PlanPrice & { id: number; razorpayPlanId: string };

/** Display tolerates a missing key — a build with no Razorpay wiring still renders prices, and live is the set a visitor should see. */
const displayMode = (): RazorpayMode =>
  process.env.RAZORPAY_KEY_ID ? keyMode() : "live";

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
        // The charge path throws rather than guessing: a plan from the other mode is a 400 at Razorpay.
        eq(paymentPlans.razorpayMode, keyMode()),
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

async function queryPlans(
  currency: Currency,
  mode: RazorpayMode,
): Promise<PlanPrice[]> {
  const rows = await db
    .select()
    .from(paymentPlans)
    .where(
      and(
        eq(paymentPlans.currency, currency),
        eq(paymentPlans.razorpayMode, mode),
        eq(paymentPlans.active, true),
      ),
    );

  return rows.map(({ plan, interval, amountMinor, listAmountMinor }) => ({
    plan,
    interval,
    currency,
    amountMinor,
    listAmountMinor,
  }));
}

const cachedPlans = unstable_cache(queryPlans, ["billing", "plans"], {
  revalidate: 3600,
});

/** Display prices only, so an empty list is safe here — a charge is computed from `findPlan`, which has no fallback on purpose. */
export async function listPlans(currency: Currency): Promise<PlanPrice[]> {
  try {
    // Mode is an argument, not a constant, so it joins the cache key — otherwise a sandbox list gets served in production.
    return await cachedPlans(currency, displayMode());
  } catch (error) {
    captureError(error, { at: "listPlans", currency });
    return [];
  }
}
