import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { paymentEvents, subscriptions } from "@/db/schema";
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

// The only thing that grants access. One transaction: the event row is the
// idempotency key, so a redelivery conflicts on insert and changes nothing.
export async function handleWebhook(
  db: Db,
  input: WebhookInput,
): Promise<WebhookOutcome> {
  if (
    !input.signature ||
    !verifyWebhookSignature(input.rawBody, input.signature)
  )
    return "invalid_signature";

  let json: unknown;
  try {
    json = JSON.parse(input.rawBody);
  } catch {
    return "malformed";
  }
  const parsed = webhookEvent.safeParse(json);
  if (!parsed.success) return "malformed";

  const { event, created_at, payload } = parsed.data;
  const sub = payload.subscription?.entity;
  const pay = payload.payment?.entity;
  // Razorpay always sends the header; the fallback keeps local replays honest.
  const eventId =
    input.eventId ?? `${event}:${created_at}:${sub?.id ?? pay?.id ?? "none"}`;
  const observedAt = new Date(created_at * 1000);

  return db.transaction(async (tx) => {
    const stored = await tx
      .insert(paymentEvents)
      .values({ eventId, eventType: event, payload: parsed.data })
      .onConflictDoNothing({ target: paymentEvents.eventId })
      .returning({ id: paymentEvents.id });
    if (stored.length === 0) return "duplicate";

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

    return outcome;
  });
}
