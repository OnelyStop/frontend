import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { paymentEvents, paymentPlans, subscriptions } from "@/db/schema";
import { applySubscription, recordPayment } from "./entitlements.server";
import { verifyWebhookSignature } from "./razorpay.server";

const unix = z.number().int();

const webhookEvent = z.object({
  event: z.string(),
  created_at: unix,
  payload: z
    .object({
      subscription: z
        .object({
          entity: z
            .object({
              id: z.string(),
              plan_id: z.string(),
              status: z.string(),
              current_start: unix.nullish(),
              current_end: unix.nullish(),
              charge_at: unix.nullish(),
              notes: z.record(z.string(), z.string()).nullish(),
            })
            .passthrough(),
        })
        .optional(),
      payment: z
        .object({
          entity: z
            .object({
              id: z.string(),
              amount: unix,
              currency: z.string(),
              status: z.string(),
              method: z.string().nullish(),
              created_at: unix,
            })
            .passthrough(),
        })
        .optional(),
    })
    .passthrough(),
});

type WebhookEvent = z.infer<typeof webhookEvent>;

/** Razorpay's entities carry the payer's email, phone, UPI VPA and card metadata, and `.passthrough()` kept every one of them; this is the audit row, so it whitelists what reconciliation and disputes actually need. */
function auditPayload(data: WebhookEvent) {
  const sub = data.payload.subscription?.entity;
  const pay = data.payload.payment?.entity;
  return {
    event: data.event,
    created_at: data.created_at,
    subscription: sub
      ? {
          id: sub.id,
          plan_id: sub.plan_id,
          status: sub.status,
          current_start: sub.current_start ?? null,
          current_end: sub.current_end ?? null,
          charge_at: sub.charge_at ?? null,
          notes: sub.notes ?? null,
        }
      : null,
    payment: pay
      ? {
          id: pay.id,
          amount: pay.amount,
          currency: pay.currency,
          status: pay.status,
          method: pay.method ?? null,
          created_at: pay.created_at,
          order_id: pay.order_id ?? null,
          invoice_id: pay.invoice_id ?? null,
          amount_refunded: pay.amount_refunded ?? null,
          refund_status: pay.refund_status ?? null,
          error_code: pay.error_code ?? null,
          error_description: pay.error_description ?? null,
        }
      : null,
  };
}

export type WebhookOutcome =
  | "invalid_signature"
  | "malformed"
  | "duplicate"
  | "processed"
  | "stale"
  | "unknown_subscription";

export type WebhookInput = {
  rawBody: string;
  signature: string | null;
  eventId: string | null;
};

export type WebhookResult = {
  outcome: WebhookOutcome;
  /** Set only by the delivery that first activated a subscription, so the funnel's paid step is counted from the server and exactly once. */
  activated: { userId: string; plan: string; interval: string } | null;
};

// One transaction: the event row is the idempotency key, so a redelivery is a no-op.
export async function handleWebhook(
  db: Db,
  input: WebhookInput,
): Promise<WebhookResult> {
  const refused = (outcome: WebhookOutcome): WebhookResult => ({
    outcome,
    activated: null,
  });

  if (
    !input.signature ||
    !verifyWebhookSignature(input.rawBody, input.signature)
  )
    return refused("invalid_signature");

  let json: unknown;
  try {
    json = JSON.parse(input.rawBody);
  } catch {
    return refused("malformed");
  }
  const parsed = webhookEvent.safeParse(json);
  if (!parsed.success) return refused("malformed");

  const { event, created_at, payload } = parsed.data;
  const sub = payload.subscription?.entity;
  const pay = payload.payment?.entity;
  const eventId =
    input.eventId ?? `${event}:${created_at}:${sub?.id ?? pay?.id ?? "none"}`;
  const observedAt = new Date(created_at * 1000);

  return db.transaction(async (tx) => {
    const stored = await tx
      .insert(paymentEvents)
      .values({ eventId, eventType: event, payload: auditPayload(parsed.data) })
      .onConflictDoNothing({ target: paymentEvents.eventId })
      .returning({ id: paymentEvents.id });
    if (stored.length === 0) return refused("duplicate");

    let outcome: WebhookOutcome = "processed";
    if (sub) {
      const applied = await applySubscription(
        tx,
        {
          id: sub.id,
          plan_id: sub.plan_id,
          status: sub.status,
          current_start: sub.current_start ?? null,
          current_end: sub.current_end ?? null,
          charge_at: sub.charge_at ?? null,
          notes: sub.notes ?? undefined,
        },
        { observedAt, userId: sub.notes?.user_id },
      );
      if (applied === "unknown") outcome = "unknown_subscription";
      if (applied === "stale") outcome = "stale";
    }

    if (pay && sub && outcome !== "unknown_subscription") {
      const [owner] = await tx
        .select({ id: subscriptions.id, userId: subscriptions.userId })
        .from(subscriptions)
        .where(eq(subscriptions.razorpaySubscriptionId, sub.id))
        .limit(1);
      if (owner)
        await recordPayment(
          tx,
          { ...pay, method: pay.method ?? null },
          { userId: owner.userId, subscriptionId: owner.id },
        );
    }

    // Razorpay fires this once per mandate; subscription.charged repeats on every renewal, which would count the same sale again.
    if (!sub || outcome !== "processed" || event !== "subscription.activated")
      return { outcome, activated: null };

    const [granted] = await tx
      .select({
        userId: subscriptions.userId,
        plan: paymentPlans.plan,
        interval: paymentPlans.interval,
      })
      .from(subscriptions)
      .innerJoin(paymentPlans, eq(paymentPlans.id, subscriptions.planId))
      .where(eq(subscriptions.razorpaySubscriptionId, sub.id))
      .limit(1);

    return { outcome, activated: granted ?? null };
  });
}
