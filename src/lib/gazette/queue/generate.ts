import { Queue } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/gazette/db";
import { generateRuns } from "@/lib/gazette/db/schema";
import { log } from "@/lib/gazette/log";
import {
  incrRun,
  processArticle,
  selectNewArticles,
  type ArticleOutcome,
} from "@/lib/gazette/pipeline/generate";

export const GENERATE_QUEUE = "current-affairs-generate";

export type PlanJob = { day?: string };
export type ArticleJob = { articleId: string; runId: string };

// A fresh ioredis connection. Reads process.env directly — a missing news/LLM
// key must not stop the queue erroring clearly about Redis. maxRetriesPerRequest
// null is BullMQ's requirement for blocking commands.
export function createRedis(opts?: RedisOptions): IORedis {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required for the generate queue");
  return new IORedis(url, { maxRetriesPerRequest: null, ...opts });
}

/**
 * Enqueue a `plan` job. `jobId: plan:<day>` collapses a double-fired cron
 * (BullMQ rejects a duplicate id while the job is waiting/active); removed on
 * completion so a later manual re-run of the same day still goes through.
 */
export async function enqueuePlan(day?: string) {
  const connection = createRedis();
  const queue = new Queue<PlanJob>(GENERATE_QUEUE, { connection });
  try {
    return await queue.add(
      "plan",
      { day },
      {
        jobId: `plan:${day ?? "all"}`,
        removeOnComplete: true,
        removeOnFail: { age: 604_800, count: 100 },
        attempts: 2,
        backoff: { type: "exponential", delay: 10_000 },
      },
    );
  } finally {
    await queue.close();
    connection.disconnect();
  }
}

export const ARTICLE_JOB_OPTS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: { age: 86_400, count: 500 },
  removeOnFail: { age: 604_800, count: 1000 },
};

/**
 * `plan` job body: open a run row, then fan one `article` job per pending
 * article. `addArticleJob` is injected so this is testable without Redis.
 */
export async function planHandler(
  { day }: PlanJob,
  addArticleJob: (data: ArticleJob) => Promise<unknown>,
): Promise<{ runId: string; planned: number }> {
  const db = await getDb();
  const rows = await selectNewArticles(day);

  const [run] = await db
    .insert(generateRuns)
    .values({ day: day ?? null, planned: rows.length, status: "running" })
    .returning();

  log("info", "generate run planned", { runId: run.runId, planned: rows.length, day: day ?? null });

  if (rows.length === 0) {
    await db
      .update(generateRuns)
      .set({ finishedAt: new Date(), status: "done" })
      .where(eq(generateRuns.runId, run.runId));
    return { runId: run.runId, planned: 0 };
  }

  for (const a of rows) {
    await addArticleJob({ articleId: a.articleId, runId: run.runId });
  }
  return { runId: run.runId, planned: rows.length };
}

/** Marks a run done once every planned article has reached a terminal outcome. */
export async function maybeFinalizeRun(runId: string): Promise<void> {
  const db = await getDb();
  const done = sql`(${generateRuns.published} + ${generateRuns.skippedThin} + ${generateRuns.skippedNonEnglish} + ${generateRuns.skippedIrrelevant} + ${generateRuns.rejectedIrrelevant} + ${generateRuns.rejectedGrounding} + ${generateRuns.errors}) >= ${generateRuns.planned}`;
  await db
    .update(generateRuns)
    .set({ finishedAt: new Date(), status: "done" })
    .where(and(eq(generateRuns.runId, runId), isNull(generateRuns.finishedAt), done));
}

/**
 * `article` job body. Returns the outcome on any terminal result; throws on a
 * transient error so BullMQ retries — and only counts the error / finalizes the
 * run on the final attempt.
 */
export async function articleHandler(
  data: ArticleJob,
  isFinalAttempt: boolean,
): Promise<ArticleOutcome> {
  const out = await processArticle(data.articleId, { runId: data.runId });

  if (out.kind === "error") {
    if (isFinalAttempt) {
      await incrRun(data.runId, "errors");
      await maybeFinalizeRun(data.runId);
    }
    throw new Error(out.message);
  }

  await maybeFinalizeRun(data.runId);
  return out;
}
