import { Queue } from "bullmq";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/gazette/db";
import { generateRuns } from "@/lib/gazette/db/schema";
import { isAuthorizedCron } from "@/lib/gazette/auth";
import { json } from "@/lib/gazette/http";
import { GENERATE_QUEUE, createRedis } from "@/lib/gazette/queue/generate";

export const dynamic = "force-dynamic";

// GET /internal/status — "what did the last few runs do, and is the queue stuck?"
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return json({ error: "unauthorized" }, 401);

  const db = await getDb();
  const runs = await db
    .select()
    .from(generateRuns)
    .orderBy(desc(generateRuns.startedAt))
    .limit(10);

  let queue: unknown;
  try {
    const connection = createRedis();
    const q = new Queue(GENERATE_QUEUE, { connection });
    try {
      queue = await q.getJobCounts();
    } finally {
      await q.close();
      connection.disconnect();
    }
  } catch (err) {
    queue = { error: (err as Error).message };
  }

  return json({ runs, queue });
}
