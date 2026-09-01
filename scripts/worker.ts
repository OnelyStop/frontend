// Long-lived BullMQ worker for the current-affairs generator. Runs off Vercel —
// on a small always-on host (Railway / Fly / Render background worker). Bun
// auto-loads .env.local.
import { Queue, Worker, UnrecoverableError } from "bullmq";
import { activeProfile } from "@/lib/gazette/config/profile";
import { log } from "@/lib/gazette/log";
import {
  ARTICLE_JOB_OPTS,
  GENERATE_QUEUE,
  articleHandler,
  createRedis,
  planHandler,
  type ArticleJob,
  type PlanJob,
} from "@/lib/gazette/queue/generate";

const connection = createRedis();
const queue = new Queue(GENERATE_QUEUE, { connection: createRedis() });

// Pattern matches how a rate-limited LLM reports "wait N ms".
const RETRY_DELAY = /retry(?:_?delay|-?after)[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*(m?s)?/i;

const worker = new Worker(
  GENERATE_QUEUE,
  async (job) => {
    if (job.name === "plan") {
      return planHandler(job.data as PlanJob, (data) =>
        queue.add("article", data, ARTICLE_JOB_OPTS),
      );
    }
    if (job.name === "article") {
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      try {
        return await articleHandler(job.data as ArticleJob, isFinalAttempt);
      } catch (err) {
        const msg = (err as Error).message;
        // Honour an explicit provider back-off: pause the whole queue, don't
        // burn an attempt.
        const m = RETRY_DELAY.exec(msg);
        if (m) {
          const ms = m[2] === "s" ? Number(m[1]) * 1000 : Number(m[1]);
          await queue.rateLimit(Math.min(ms || 30_000, 5 * 60_000));
          throw Worker.RateLimitError();
        }
        throw err;
      }
    }
    throw new UnrecoverableError(`unknown job name: ${job.name}`);
  },
  {
    connection,
    concurrency: 4,
    // Queue-global: at most llmMaxRpm article jobs (≈ LLM calls) per minute.
    limiter: { max: activeProfile.llmMaxRpm, duration: 60_000 },
  },
);

worker.on("completed", (job, result) =>
  log("info", "job completed", { jobId: job.id, name: job.name, result }),
);
worker.on("failed", (job, err) =>
  log("error", "job failed", {
    jobId: job?.id,
    name: job?.name,
    attemptsMade: job?.attemptsMade,
    error: err.message,
  }),
);

log("info", "worker started", { queue: GENERATE_QUEUE, rpm: activeProfile.llmMaxRpm });

async function shutdown() {
  log("info", "worker shutting down");
  await worker.close();
  await queue.close();
  connection.disconnect();
  process.exit(0);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
