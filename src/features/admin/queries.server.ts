import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { generateRuns } from "@/db/schema";
import type { AdminStatus, GenerateRun } from "./types";

const RUN_LIMIT = 10;

export async function getAdminStatus(): Promise<AdminStatus> {
  const rows = await db
    .select()
    .from(generateRuns)
    .orderBy(desc(generateRuns.startedAt))
    .limit(RUN_LIMIT);

  const runs: GenerateRun[] = rows.map((r) => ({
    runId: r.runId,
    day: r.day,
    planned: r.planned,
    published: r.published,
    errors: r.errors,
    status: r.status,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
  }));

  return { runs };
}
