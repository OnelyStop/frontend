import "server-only";
import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import type { Db } from "@/db";
import { aiUsage, attempts } from "@/db/schema";
import { istDayKey, istMonthStartKey, startOfIstDay } from "@/lib/ist";
import { getEntitlement } from "./entitlements.server";
import { limitsFor, withinLimit, type PlanLimits } from "./limits";

export type AiFeature = "ask_onely" | "descriptive_marking";

export type Denial = { ok: false; used: number; limit: number };
export type Allowed = { ok: true; plan: ReturnType<typeof limitsFor> };

export type QuotaKey = keyof Pick<
  PlanLimits,
  | "mocksPerMonth"
  | "drillsPerDay"
  | "askOnelyPerMonth"
  | "descriptiveMarkingsPerMonth"
>;

// The AI features are metered in ai_usage; the attempt modes are counted from attempts.
const AI_FEATURE: Partial<Record<QuotaKey, AiFeature>> = {
  askOnelyPerMonth: "ask_onely",
  descriptiveMarkingsPerMonth: "descriptive_marking",
};

// Attempts on a full paper are mocks; bank and mix sets are drills.
const MOCK_MODE = "paper" as const;

async function attemptsSince(
  db: Db,
  userId: string,
  since: Date,
  isMock: boolean,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        gte(attempts.startedAt, since),
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
  const limit = limits[what];

  const feature = AI_FEATURE[what];
  let used = 0;
  if (feature) used = await aiCallsThisMonth(db, userId, feature, now);
  else if (what === "mocksPerMonth")
    used = await attemptsSince(
      db,
      userId,
      startOfIstDay(istMonthStartKey(now)),
      true,
    );
  else
    used = await attemptsSince(
      db,
      userId,
      startOfIstDay(istDayKey(now)),
      false,
    );

  if (!withinLimit(limit, used))
    return { ok: false, used, limit: limit as number };
  return { ok: true, plan: limits };
}

export async function aiCallsThisMonth(
  db: Db,
  userId: string,
  feature: AiFeature,
  now = new Date(),
): Promise<number> {
  const [row] = await db
    .select({ n: sum(aiUsage.calls) })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        eq(aiUsage.feature, feature),
        gte(aiUsage.day, istMonthStartKey(now)),
      ),
    );
  return Number(row?.n ?? 0);
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
