import { Queue } from "bullmq";
import { desc, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { generateRuns } from "@/db/schema";
import { json } from "@/lib/gazette/http";
import { GENERATE_QUEUE, createRedis } from "@/lib/gazette/queue/generate";

export const dynamic = "force-dynamic";

const STALE_HOURS = 48;
const QUEUE_DEPTH_ALARM = 200;

/**
 * Public silent-stop check — point an external uptime monitor at it. The
 * pipeline failing is invisible otherwise: no error, questions just stop.
 * Returns 503 when not ok so the monitor alerts on status alone.
 */
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

  let queueDepth: number | null = null;
  try {
    const connection = createRedis();
    const q = new Queue(GENERATE_QUEUE, { connection });
    try {
      const c = await q.getJobCounts("waiting", "active", "delayed");
      queueDepth = (c.waiting ?? 0) + (c.active ?? 0) + (c.delayed ?? 0);
    } finally {
      await q.close();
      connection.disconnect();
    }
  } catch {
    // Redis not configured in this environment — not a health failure here.
  }

  const stale = staleHours === null || staleHours > STALE_HOURS;
  const twoConsecutiveZeroPublished =
    lastTwo.length === 2 &&
    lastTwo.every((r) => r.status === "done" && r.published === 0);
  const queueBackedUp = queueDepth !== null && queueDepth > QUEUE_DEPTH_ALARM;
  const ok = !stale && !twoConsecutiveZeroPublished && !queueBackedUp;

  return json(
    {
      ok,
      lastRunAt,
      staleHours: staleHours === null ? null : Math.round(staleHours * 10) / 10,
      lastPublished: last?.published ?? null,
      queueDepth,
      reasons: { stale, twoConsecutiveZeroPublished, queueBackedUp },
    },
    ok ? 200 : 503,
  );
}
