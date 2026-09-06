import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { doubts, doubtStuck } from "@/db/schema";
import { monthlyPostCount } from "./queries.server";
import { POST_QUOTA, type PlanTier } from "./quota";
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
  | { ok: false; reason: "quota_exceeded"; used: number; limit: number };

export async function postDoubt(
  userId: string,
  plan: PlanTier,
  input: DoubtCreate,
): Promise<PostOutcome> {
  // The view's remaining count is display only; the quota is decided here.
  const limit = POST_QUOTA[plan];
  const used = await monthlyPostCount(userId);
  if (used >= limit)
    return { ok: false, reason: "quota_exceeded", used, limit };

  const [row] = await db
    .insert(doubts)
    .values({ ...input, authorId: userId })
    .returning({ id: doubts.id });

  return { ok: true, doubtId: row.id };
}
