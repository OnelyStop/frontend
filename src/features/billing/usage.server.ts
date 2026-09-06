import "server-only";
import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import type { Db } from "@/db";
import { aiUsage, attempts } from "@/db/schema";
import { getEntitlement } from "./entitlements.server";
import { limitsFor, withinLimit, type PlanLimits } from "./limits";

export type AiFeature = "ask_onely" | "descriptive_marking";

export type Denial = { ok: false; used: number; limit: number };
export type Allowed = { ok: true; plan: ReturnType<typeof limitsFor> };

// IST, because every cutoff and every exam day in this product is IST.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const istDay = (at: Date) =>
  new Date(at.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const istMonthStart = (at: Date) => {
  const d = new Date(at.getTime() + IST_OFFSET_MS);
  return `${d.toISOString().slice(0, 7)}-01`;
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

const startOfIstDay = (at: Date) => new Date(`${istDay(at)}T00:00:00+05:30`);
const startOfIstMonth = (at: Date) =>
  new Date(`${istMonthStart(at)}T00:00:00+05:30`);

// The one place a plan limit turns into an answer, and always server-side.
export async function checkQuota(
  db: Db,
  userId: string,
  what: keyof Pick<
    PlanLimits,
    "mocksPerMonth" | "drillsPerDay" | "askOnelyPerMonth"
  >,
  now = new Date(),
): Promise<Allowed | Denial> {
  const { plan } = await getEntitlement(db, userId, now);
  const limits = limitsFor(plan);
  const limit = limits[what];

  let used = 0;
  if (what === "mocksPerMonth")
    used = await attemptsSince(db, userId, startOfIstMonth(now), true);
  else if (what === "drillsPerDay")
    used = await attemptsSince(db, userId, startOfIstDay(now), false);
  else used = await aiCallsThisMonth(db, userId, "ask_onely", now);

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
        gte(aiUsage.day, istMonthStart(now)),
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
    .values({ userId, feature, day: istDay(now), calls: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.feature, aiUsage.day],
      set: { calls: sql`${aiUsage.calls} + 1` },
    });
}
