import { and, eq, inArray, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import {
  applySubscription,
  getBillingStatus,
} from "@/features/billing/entitlements.server";
import { fetchSubscription } from "@/features/billing/razorpay.server";
import { currentUserId } from "@/lib/auth.server";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

const STALE_MS = 15 * 60_000;

// A webhook that never arrived is the failure that costs a paying customer, so
// a subscription still mid-flight after fifteen minutes is re-read from
// Razorpay when its owner next asks.
async function reconcileStale(userId: string) {
  const [stale] = await db
    .select({ id: subscriptions.razorpaySubscriptionId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, ["created", "authenticated", "pending"]),
        lt(subscriptions.updatedAt, new Date(Date.now() - STALE_MS)),
      ),
    )
    .limit(1);
  if (!stale) return;
  try {
    const sub = await fetchSubscription(stale.id);
    await applySubscription(db, sub, { observedAt: new Date() });
  } catch (err) {
    log.warn("billing.status.reconcile_failed", {
      userId,
      subscription: stale.id,
      error: (err as Error).message,
    });
  }
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await reconcileStale(userId);
  return NextResponse.json(await getBillingStatus(db, userId));
}
