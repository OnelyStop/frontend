import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import {
  applySubscription,
  getEntitlement,
} from "@/features/billing/entitlements.server";
import {
  fetchSubscription,
  verifySubscriptionSignature,
} from "@/features/billing/razorpay.server";
import { checkoutCallback } from "@/features/billing/types";
import { currentUserId } from "@/lib/auth.server";
import { log } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

// The browser's claim grants nothing. A good signature earns one read of
// Razorpay's own record, applied through the same guarded path as the webhook.
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return fail("unauthorized", 401);
  if (!rateLimit(`billing-verify:${userId}`, 10, 60_000).ok)
    return fail("rate_limited", 429);

  const parsed = checkoutCallback.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return fail("invalid_body", 400);
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    parsed.data;

  if (
    !verifySubscriptionSignature({
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
      signature: razorpay_signature,
    })
  ) {
    // Should be zero. A rate means an attack or a botched secret rotation.
    log.warn("billing.verify.bad_signature", {
      userId,
      subscription: razorpay_subscription_id,
    });
    return fail("invalid_signature", 400);
  }

  const [row] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.razorpaySubscriptionId, razorpay_subscription_id),
        eq(subscriptions.userId, userId),
      ),
    )
    .limit(1);
  if (!row) return fail("not_found", 404);

  try {
    const sub = await fetchSubscription(razorpay_subscription_id);
    await applySubscription(db, sub, { observedAt: new Date() });
  } catch (err) {
    log.error("billing.verify.reconcile_failed", {
      userId,
      subscription: razorpay_subscription_id,
      error: (err as Error).message,
    });
  }

  const entitlement = await getEntitlement(db, userId);
  return NextResponse.json({ ok: true, active: entitlement.active });
}
