import { and, inArray, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { applySubscription } from "@/features/billing/entitlements.server";
import { fetchSubscription } from "@/features/billing/razorpay.server";
import { isAuthorizedCron } from "@/lib/gazette/auth";
import { json } from "@/lib/gazette/http";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const STALE_MS = 15 * 60_000;
const BATCH = 50;

// Sweeps what the status route's per-user reconcile cannot reach: customers
// who paid and never came back, and renewals whose webhook was lost. Schedule
// hourly on a Pro plan; Hobby's two-cron limit is already spent on the news.
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return json({ error: "unauthorized" }, 401);

  const now = new Date();
  const rows = await db
    .select({ id: subscriptions.razorpaySubscriptionId })
    .from(subscriptions)
    .where(
      or(
        and(
          inArray(subscriptions.status, [
            "created",
            "authenticated",
            "pending",
            "halted",
          ]),
          lt(subscriptions.updatedAt, new Date(now.getTime() - STALE_MS)),
        ),
        and(
          inArray(subscriptions.status, ["active"]),
          lt(subscriptions.currentPeriodEnd, now),
        ),
      ),
    )
    .limit(BATCH);

  let updated = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const sub = await fetchSubscription(row.id);
      if (
        (await applySubscription(db, sub, { observedAt: new Date() })) ===
        "updated"
      )
        updated++;
    } catch (err) {
      failed++;
      log.warn("billing.reconcile.failed", {
        subscription: row.id,
        error: (err as Error).message,
      });
    }
  }

  log.info("billing.reconcile", { checked: rows.length, updated, failed });
  return json({ ok: true, checked: rows.length, updated, failed });
}

export const POST = GET;
