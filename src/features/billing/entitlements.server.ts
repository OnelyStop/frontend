import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import {
  entitlements,
  paymentPlans,
  payments,
  subscriptions,
} from "@/db/schema";
import type { RazorpayPayment, RazorpaySubscription } from "./razorpay.server";
import type { BillingStatus, Entitlement } from "./types";

type SubscriptionStatus = (typeof subscriptions.$inferSelect)["status"];

const STATUSES: readonly SubscriptionStatus[] = [
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "cancelled",
  "completed",
  "expired",
];

const asStatus = (raw: string): SubscriptionStatus =>
  (STATUSES as readonly string[]).includes(raw)
    ? (raw as SubscriptionStatus)
    : "pending";

// Only these carry a paid `current_end`. Before the first charge, and after a
// failed one, Razorpay still reports a period — one nobody has paid for.
const GRANTS = new Set<SubscriptionStatus>(["active", "completed"]);

const toDate = (unix: number | null | undefined) =>
  unix ? new Date(unix * 1000) : null;

export async function getEntitlement(
  db: Db,
  userId: string,
  now = new Date(),
): Promise<Entitlement> {
  const [row] = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.userId, userId))
    .limit(1);
  const active = !!row && row.accessUntil > now;
  return {
    plan: active ? "pro" : "free",
    active,
    accessUntil: row?.accessUntil.toISOString() ?? null,
  };
}

export async function getBillingStatus(
  db: Db,
  userId: string,
  now = new Date(),
): Promise<BillingStatus> {
  const [entitlement, [sub]] = await Promise.all([
    getEntitlement(db, userId, now),
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1),
  ]);
  return {
    ...entitlement,
    subscription: sub
      ? {
          id: sub.razorpaySubscriptionId,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          cancelledAt: sub.cancelledAt?.toISOString() ?? null,
        }
      : null,
  };
}

export type ApplyOutcome = "updated" | "stale" | "unknown";

// The one place subscription state becomes access. Idempotent, and ordered:
// an observation older than what is stored is dropped, so a late `authenticated`
// cannot overwrite a live `active`; and access_until only ever moves forward,
// so no event can take back a period that was paid for.
export async function applySubscription(
  db: Db,
  sub: RazorpaySubscription,
  opts: { observedAt: Date; userId?: string },
): Promise<ApplyOutcome> {
  const status = asStatus(sub.status);
  const currentPeriodEnd = toDate(sub.current_end);

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubscriptionId, sub.id))
    .limit(1);

  let row = existing;
  if (!row) {
    if (!opts.userId) return "unknown";
    const [plan] = await db
      .select({ id: paymentPlans.id })
      .from(paymentPlans)
      .where(eq(paymentPlans.razorpayPlanId, sub.plan_id))
      .limit(1);
    if (!plan) return "unknown";
    [row] = await db
      .insert(subscriptions)
      .values({
        userId: opts.userId,
        razorpaySubscriptionId: sub.id,
        planId: plan.id,
        status,
        currentPeriodEnd,
        cancelledAt: status === "cancelled" ? opts.observedAt : null,
        updatedAt: opts.observedAt,
      })
      .returning();
  } else {
    if (existing.updatedAt > opts.observedAt) return "stale";
    [row] = await db
      .update(subscriptions)
      .set({
        status,
        currentPeriodEnd,
        cancelledAt:
          status === "cancelled"
            ? (existing.cancelledAt ?? opts.observedAt)
            : existing.cancelledAt,
        updatedAt: opts.observedAt,
      })
      .where(eq(subscriptions.id, existing.id))
      .returning();
  }

  if (GRANTS.has(status) && currentPeriodEnd) {
    await db
      .insert(entitlements)
      .values({
        userId: row.userId,
        plan: "pro",
        accessUntil: currentPeriodEnd,
        status,
        subscriptionId: row.id,
        updatedAt: opts.observedAt,
      })
      .onConflictDoUpdate({
        target: entitlements.userId,
        set: {
          accessUntil: sql`greatest(${entitlements.accessUntil}, excluded.access_until)`,
          status,
          subscriptionId: row.id,
          updatedAt: opts.observedAt,
        },
      });
  } else {
    await db
      .update(entitlements)
      .set({ status, updatedAt: opts.observedAt })
      .where(
        and(
          eq(entitlements.userId, row.userId),
          eq(entitlements.subscriptionId, row.id),
        ),
      );
  }

  return "updated";
}

export async function recordPayment(
  db: Db,
  payment: RazorpayPayment,
  owner: { userId: string; subscriptionId: number },
): Promise<void> {
  if (payment.currency !== "INR" && payment.currency !== "USD") return;
  await db
    .insert(payments)
    .values({
      userId: owner.userId,
      subscriptionId: owner.subscriptionId,
      razorpayPaymentId: payment.id,
      amountMinor: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method ?? null,
      capturedAt:
        payment.status === "captured" ? toDate(payment.created_at) : null,
    })
    .onConflictDoNothing({ target: payments.razorpayPaymentId });
}
