import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { applySubscription } from "@/features/billing/entitlements.server";
import { cancelSubscription } from "@/features/billing/razorpay.server";
import { log } from "@/lib/log";
import { deleteAccount } from "./mutations.server";

type SubscriptionStatus = (typeof subscriptions.$inferSelect)["status"];

// The states in which Razorpay still holds a mandate it can charge. `created`
// has no mandate yet, the terminal states never charge again, and one already
// winding down at the cycle end has no charge left either.
const CHARGEABLE: SubscriptionStatus[] = [
  "authenticated",
  "active",
  "pending",
  "halted",
];

export type CloseOutcome =
  { ok: true; deleted: boolean } | { ok: false; reason: "billing_unavailable" };

// Cancels before it deletes, and stops if it cannot: a deleted account that
// keeps being charged is worse than asking the user to try again.
export async function closeAccount(userId: string): Promise<CloseOutcome> {
  const live = await db
    .select({ razorpaySubscriptionId: subscriptions.razorpaySubscriptionId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, CHARGEABLE),
        isNull(subscriptions.cancelledAt),
      ),
    );

  for (const { razorpaySubscriptionId } of live) {
    const cancelled = await cancelSubscription(razorpaySubscriptionId, {
      atCycleEnd: false,
    }).catch((err: unknown) => {
      log.error("account.close_cancel_failed", {
        userId,
        subscription: razorpaySubscriptionId,
        error: (err as Error).message,
      });
      return null;
    });
    if (!cancelled) return { ok: false, reason: "billing_unavailable" };
    // Recorded now so a retry after a later failure does not cancel it twice.
    await applySubscription(db, cancelled, { observedAt: new Date() });
  }

  const { deleted } = await deleteAccount(db, userId);
  log.info("account.closed", { userId, deleted, cancelled: live.length });
  return { ok: true, deleted };
}
