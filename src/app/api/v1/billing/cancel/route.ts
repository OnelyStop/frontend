import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { applySubscription } from "@/features/billing/entitlements.server";
import { cancelSubscription } from "@/features/billing/razorpay.server";
import { currentUserId } from "@/lib/auth.server";
import { log } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export async function POST() {
  const userId = await currentUserId();
  if (!userId) return fail("unauthorized", 401);
  if (!rateLimit(`billing-cancel:${userId}`, 3, 60_000).ok)
    return fail("rate_limited", 429);

  const [row] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, [
          "authenticated",
          "active",
          "pending",
          "halted",
        ]),
      ),
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  if (!row) return fail("nothing_to_cancel", 404);
  if (row.cancelledAt) return NextResponse.json({ ok: true });

  try {
    const sub = await cancelSubscription(row.razorpaySubscriptionId);
    // Razorpay keeps the mandate `active` until the cycle ends; the local
    // timestamp is what tells the UI it is winding down.
    await db
      .update(subscriptions)
      .set({ cancelledAt: new Date() })
      .where(eq(subscriptions.id, row.id));
    await applySubscription(db, sub, { observedAt: new Date() });
  } catch (err) {
    log.error("billing.cancel_failed", {
      userId,
      subscription: row.razorpaySubscriptionId,
      error: (err as Error).message,
    });
    return fail("payment_provider", 502);
  }

  log.info("billing.cancelled", {
    userId,
    subscription: row.razorpaySubscriptionId,
  });
  return NextResponse.json({ ok: true });
}
