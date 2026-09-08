import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { doubtReplies, doubts, doubtStuck } from "@/db/schema";
import { monthlyPostCount } from "./queries.server";
import {
  limitsFor,
  withinLimit,
  type PlanTier,
} from "@/features/billing/limits";
import type { DoubtCreate } from "./types";

export type StuckResult = { stuckCount: number; stuckByMe: boolean };

// Count column and membership row must move together or the feed ordering drifts.
export async function setStuck(
  userId: string,
  doubtId: string,
  stuck: boolean,
): Promise<StuckResult | null> {
  return db.transaction(async (tx) => {
    const changed = stuck
      ? await tx
          .insert(doubtStuck)
          .values({ doubtId, userId })
          .onConflictDoNothing()
          .returning({ doubtId: doubtStuck.doubtId })
      : await tx
          .delete(doubtStuck)
          .where(
            and(eq(doubtStuck.doubtId, doubtId), eq(doubtStuck.userId, userId)),
          )
          .returning({ doubtId: doubtStuck.doubtId });

    // No row moved — already marked or cleared; read the count back regardless.
    if (changed.length === 0) {
      const [row] = await tx
        .select({ stuckCount: doubts.stuckCount })
        .from(doubts)
        .where(eq(doubts.id, doubtId))
        .limit(1);
      return row ? { stuckCount: row.stuckCount, stuckByMe: stuck } : null;
    }

    const [row] = await tx
      .update(doubts)
      .set({ stuckCount: sql`${doubts.stuckCount} + ${stuck ? 1 : -1}` })
      .where(eq(doubts.id, doubtId))
      .returning({ stuckCount: doubts.stuckCount });

    return row ? { stuckCount: row.stuckCount, stuckByMe: stuck } : null;
  });
}

export type PostOutcome =
  | { ok: true; doubtId: string }
  | { ok: false; reason: "quota_exceeded"; used: number; limit: number | null };

export async function postDoubt(
  userId: string,
  plan: PlanTier,
  input: DoubtCreate,
): Promise<PostOutcome> {
  // The view's remaining count is display only; the quota is decided here.
  const limit = limitsFor(plan).communityDoubtsPerMonth;
  const used = await monthlyPostCount(userId);
  if (!withinLimit(limit, used))
    return { ok: false, reason: "quota_exceeded", used, limit };

  const [row] = await db
    .insert(doubts)
    .values({ ...input, authorId: userId })
    .returning({ id: doubts.id });

  return { ok: true, doubtId: row.id };
}

/** A reply is not metered: the quota is on starting a thread, not on helping in one. */
export async function postReply(
  userId: string,
  doubtId: string,
  body: string,
): Promise<{ ok: true; replyId: string } | { ok: false }> {
  const thread = await db.query.doubts.findFirst({
    where: eq(doubts.id, doubtId),
    columns: { id: true },
  });
  if (!thread) return { ok: false };

  const [row] = await db
    .insert(doubtReplies)
    .values({ doubtId, authorId: userId, body })
    .returning({ id: doubtReplies.id });

  return { ok: true, replyId: row.id };
}
