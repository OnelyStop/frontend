import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requestCurrency } from "@/features/billing/currency";
import { getEntitlement } from "@/features/billing/entitlements.server";
import { findPlan } from "@/features/billing/plans.server";
import { createSubscription } from "@/features/billing/razorpay.server";
import { subscriptionCreate } from "@/features/billing/types";
import { currentUserId } from "@/lib/auth.server";
import { log } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

// A mandate needs a horizon. These are "until cancelled" in practice.
const TOTAL_COUNT = { monthly: 100, yearly: 10 } as const;

export async function POST(request: Request) {
  // Payments can be switched off without a deploy.
  if (process.env.BILLING_ENABLED !== "true")
    return fail("billing_disabled", 503);

  const userId = await currentUserId();
  if (!userId) return fail("unauthorized", 401);
  if (!rateLimit(`billing:${userId}`, 5, 60_000).ok)
    return fail("rate_limited", 429);

  const parsed = subscriptionCreate.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return fail("invalid_body", 400);

  if ((await getEntitlement(db, userId)).active)
    return fail("already_subscribed", 409);

  const currency = await requestCurrency();
  const plan = await findPlan("pro", parsed.data.interval, currency);
  if (!plan) return fail("plan_unavailable", 404);

  let created;
  try {
    created = await createSubscription({
      planId: plan.razorpayPlanId,
      totalCount: TOTAL_COUNT[plan.interval],
      notes: { user_id: userId },
    });
  } catch (err) {
    log.error("billing.subscription.create_failed", {
      userId,
      error: (err as Error).message,
    });
    return fail("payment_provider", 502);
  }

  await db.insert(subscriptions).values({
    userId,
    razorpaySubscriptionId: created.id,
    planId: plan.id,
    status: "created",
  });
  log.info("billing.subscription.created", {
    userId,
    subscription: created.id,
    plan: plan.id,
    currency,
  });

  return NextResponse.json({
    subscriptionId: created.id,
    // Public by design: Checkout needs it, and it authorises nothing alone.
    keyId: process.env.RAZORPAY_KEY_ID,
    amountMinor: plan.amountMinor,
    currency,
    interval: plan.interval,
  });
}
