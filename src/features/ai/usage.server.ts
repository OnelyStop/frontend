import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { aiConfig } from "@/config/env";
import type { ChatResponse } from "@/lib/llm";

import type { FeatureKey } from "./profiles";

function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type Budget = { allowed: boolean; spentMicros: number; capMicros: number };

/** Server-side because a limit the client enforces is not a limit. */
export async function withinBudget(userId: string, now = new Date()): Promise<Budget> {
  const [row] = await db
    .select({ spent: sql<string>`coalesce(sum(${aiUsage.costMicros}), 0)` })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, monthStart(now))));

  const spentMicros = Number(row?.spent ?? 0);
  return {
    allowed: spentMicros < aiConfig.limits.monthlySpendMicros,
    spentMicros,
    capMicros: aiConfig.limits.monthlySpendMicros,
  };
}

/** Stores no prompt and no completion: they do not belong in a billing table. */
export async function record(
  userId: string,
  feature: FeatureKey,
  completion: ChatResponse,
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
