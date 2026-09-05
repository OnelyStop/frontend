import { desc, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { generateRuns } from "@/db/schema";
import { json } from "@/lib/gazette/http";

export const dynamic = "force-dynamic";

const STALE_HOURS = 48;

// For an external uptime monitor: a failed pipeline is otherwise invisible —
// questions just stop. Returns 503 so the monitor alerts on status alone.
export async function GET() {
  const [last] = await db
    .select()
    .from(generateRuns)
    .where(isNotNull(generateRuns.finishedAt))
    .orderBy(desc(generateRuns.finishedAt))
    .limit(1);

  const lastTwo = await db
    .select()
    .from(generateRuns)
    .orderBy(desc(generateRuns.startedAt))
    .limit(2);

  const lastRunAt = last?.finishedAt ?? null;
  const staleHours = lastRunAt
    ? (Date.now() - new Date(lastRunAt).getTime()) / 3_600_000
    : null;

  const stale = staleHours === null || staleHours > STALE_HOURS;
  const twoConsecutiveZeroPublished =
    lastTwo.length === 2 &&
    lastTwo.every((r) => r.status === "done" && r.published === 0);
  const ok = !stale && !twoConsecutiveZeroPublished;

  return json(
    {
      ok,
      lastRunAt,
      staleHours: staleHours === null ? null : Math.round(staleHours * 10) / 10,
      lastPublished: last?.published ?? null,
      reasons: { stale, twoConsecutiveZeroPublished },
    },
    ok ? 200 : 503,
  );
}
