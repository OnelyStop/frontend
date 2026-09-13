import "server-only";
import { desc, max } from "drizzle-orm";
import type { Db } from "@/db";
import { articles, currentAffairsQuestions, generateRuns } from "@/db/schema";

/** A cron that throws pages itself; a cron the scheduler never fires looks exactly like a quiet success, so freshness is read from what the pipeline left behind. */
export type Stage = {
  stage: "ingest" | "generate";
  lastAt: string | null;
  ageHours: number | null;
  stale: boolean;
};

export type Health = {
  ok: boolean;
  stages: Stage[];
  lastRun: { status: string; day: string | null; errors: number } | null;
};

// Ingest runs 12:30 UTC and generate 13:30; this check runs at 03:00, so one missed cycle trips it and a late run does not.
const STALE_HOURS = 26;

const hoursSince = (at: Date | null, now: Date) =>
  at === null ? null : (now.getTime() - at.getTime()) / 3_600_000;

export async function pipelineHealth(
  db: Db,
  now = new Date(),
): Promise<Health> {
  const [[article], [question], [run]] = await Promise.all([
    // drizzle's max(), not a raw sql`max(...)`: the raw form skips the column's mapper and hands back a string.
    db.select({ at: max(articles.createdAt) }).from(articles),
    db
      .select({ at: max(currentAffairsQuestions.createdAt) })
      .from(currentAffairsQuestions),
    db
      .select({
        status: generateRuns.status,
        day: generateRuns.day,
        errors: generateRuns.errors,
      })
      .from(generateRuns)
      .orderBy(desc(generateRuns.startedAt))
      .limit(1),
  ]);

  const stage = (name: Stage["stage"], at: Date | null): Stage => {
    const ageHours = hoursSince(at, now);
    return {
      stage: name,
      lastAt: at?.toISOString() ?? null,
      ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
      // A table with no rows at all has never run, which is just as worth knowing.
      stale: ageHours === null || ageHours > STALE_HOURS,
    };
  };

  const stages = [
    stage("ingest", article?.at ?? null),
    stage("generate", question?.at ?? null),
  ];

  return {
    ok: !stages.some((s) => s.stale) && run?.status !== "failed",
    stages,
    lastRun: run
      ? { status: run.status, day: run.day, errors: run.errors }
      : null,
  };
}
