import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import type { Db } from "@/db";
import { feedback } from "@/db/schema";
import type { FeedbackInput, SubmitOutcome } from "./types";

// Counted in the database, not in memory: the in-memory limiter is per serverless instance, so it slows a burst but cannot cap a day.
export const DAILY_LIMIT = 20;

export async function submitFeedback(
  db: Db,
  userId: string,
  input: FeedbackInput,
  now = new Date(),
): Promise<SubmitOutcome> {
  const since = new Date(now.getTime() - 86_400_000);
  const [{ sent }] = await db
    .select({ sent: count() })
    .from(feedback)
    .where(and(eq(feedback.userId, userId), gte(feedback.createdAt, since)));
  if (sent >= DAILY_LIMIT) return { ok: false, reason: "daily_limit" };

  const [inserted] = await db
    .insert(feedback)
    .values({
      userId,
      subject: input.subject,
      message: input.message,
      pagePath: input.pagePath ?? null,
      createdAt: now,
    })
    .returning({ id: feedback.id });
  return { ok: true, id: inserted.id };
}
