import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { MONTHLY_SPEND_CAP_MICROS, type FeatureKey } from "./models";
import type { Completion } from "./openrouter.server";

function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type Budget = { allowed: boolean; spentMicros: number; capMicros: number };

/**
 * Must be consulted before `complete()`. Server-side because a limit the client
 * enforces is not a limit, and a heavy user on a fixed price costs more than
 * they pay.
 */
export async function withinBudget(userId: string, now = new Date()): Promise<Budget> {
  const [row] = await db
    .select({ spent: sql<string>`coalesce(sum(${aiUsage.costMicros}), 0)` })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, monthStart(now))));

  const spentMicros = Number(row?.spent ?? 0);
  return {
    allowed: spentMicros < MONTHLY_SPEND_CAP_MICROS,
    spentMicros,
    capMicros: MONTHLY_SPEND_CAP_MICROS,
  };
}

/**
 * Stores no prompt and no completion: a student's answers have no reason to sit
 * in a billing table.
 */
export async function record(
  userId: string,
  feature: FeatureKey,
  completion: Completion,
): Promise<void> {
  await db.insert(aiUsage).values({
    userId,
    feature,
    model: completion.model,
    promptTokens: completion.promptTokens,
    completionTokens: completion.completionTokens,
    costMicros: completion.costMicros,
  });
}
