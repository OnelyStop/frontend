import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { doubts, doubtStuck } from "@/db/schema";
import { monthlyPostCount } from "./queries.server";
import { POST_QUOTA, type PlanTier } from "./quota";
import type { DoubtCreate } from "./types";

export type StuckResult = { stuckCount: number; stuckByMe: boolean };

// The count column and the membership row have to move together, or the feed
// ordering drifts away from the rows that actually back it.
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

    // No row moved: either already marked or already cleared. Read the current
    // count back so a double click still returns the truth.
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
  // The view shows a remaining count, but that is display only — the quota is
  // decided here, against rows, where the client cannot reach it.
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
