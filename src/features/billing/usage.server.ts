import "server-only";
import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import type { Db } from "@/db";
import { aiUsage, attempts } from "@/db/schema";
import { istDayKey, istMonthStartKey, startOfIstDay } from "@/lib/ist";
import { getEntitlement } from "./entitlements.server";
import { limitsFor, withinLimit, type PlanLimits, type Period } from "./limits";

export type AiFeature = "ask_onely" | "descriptive_marking";

export type Denial = { ok: false; used: number; limit: number; per: Period };
export type Allowed = { ok: true; plan: ReturnType<typeof limitsFor> };

export type QuotaKey = keyof Pick<
  PlanLimits,
  "mocks" | "drills" | "askOnely" | "descriptiveMarkings"
>;

// The AI features are metered in ai_usage; the attempt modes are counted from attempts.
const AI_FEATURE: Partial<Record<QuotaKey, AiFeature>> = {
  askOnely: "ask_onely",
  descriptiveMarkings: "descriptive_marking",
};

// Attempts on a full paper are mocks; bank and mix sets are drills.
const MOCK_MODE = "paper" as const;

/** null for "account": a lifetime cap has no lower bound, and passing one is how it silently becomes monthly. */
function since(per: Period, now: Date): Date | null {
  if (per === "account") return null;
  return startOfIstDay(per === "day" ? istDayKey(now) : istMonthStartKey(now));
}

async function attemptsSince(
  db: Db,
  userId: string,
  from: Date | null,
  isMock: boolean,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        from ? gte(attempts.startedAt, from) : undefined,
        isMock
          ? eq(attempts.mode, MOCK_MODE)
          : sql`${attempts.mode} <> ${MOCK_MODE}`,
      ),
    );
  return row?.n ?? 0;
}

// The one place a plan limit turns into an answer, and always server-side.
export async function checkQuota(
  db: Db,
  userId: string,
  what: QuotaKey,
  now = new Date(),
): Promise<Allowed | Denial> {
  const { plan } = await getEntitlement(db, userId, now);
  const limits = limitsFor(plan);
  const { cap, per } = limits[what];
  const from = since(per, now);

  const feature = AI_FEATURE[what];
  const used = feature
    ? await aiCalls(db, userId, feature, from)
    : await attemptsSince(db, userId, from, what === "mocks");

  if (!withinLimit(cap, used))
    return { ok: false, used, limit: cap as number, per };
  return { ok: true, plan: limits };
}

export async function aiCalls(
  db: Db,
  userId: string,
  feature: AiFeature,
  from: Date | null,
): Promise<number> {
  const [row] = await db
    .select({ n: sum(aiUsage.calls) })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        eq(aiUsage.feature, feature),
        from ? gte(aiUsage.day, istDayKey(from)) : undefined,
      ),
    );
  return Number(row?.n ?? 0);
}

export type PeriodUsage = Record<QuotaKey, number>;

// Built on the same counters checkQuota enforces with, so what the profile shows cannot drift from what is allowed.
export async function usageThisPeriod(
  db: Db,
  userId: string,
  now = new Date(),
): Promise<PeriodUsage> {
  const { plan } = await getEntitlement(db, userId, now);
  const limits = limitsFor(plan);
  const at = (k: QuotaKey) => since(limits[k].per, now);

  const [mocks, drills, askOnely, descriptiveMarkings] = await Promise.all([
    attemptsSince(db, userId, at("mocks"), true),
    attemptsSince(db, userId, at("drills"), false),
    aiCalls(db, userId, "ask_onely", at("askOnely")),
    aiCalls(db, userId, "descriptive_marking", at("descriptiveMarkings")),
  ]);
  return { mocks, drills, askOnely, descriptiveMarkings };
}

// Only after the call succeeds: a failure the user never saw costs them nothing.
export async function recordAiCall(
  db: Db,
  userId: string,
  feature: AiFeature,
  now = new Date(),
): Promise<void> {
  await db
    .insert(aiUsage)
    .values({ userId, feature, day: istDayKey(now), calls: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.feature, aiUsage.day],
      set: { calls: sql`${aiUsage.calls} + 1` },
    });
}
