import { isAuthorizedCron } from "@/lib/gazette/auth";
import { DAY_RE, json } from "@/lib/gazette/http";
import { captureError } from "@/lib/gazette/log";
import { runGenerate } from "@/lib/gazette/pipeline/generate";
import { enqueuePlan } from "@/lib/gazette/queue/generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // only used by the no-Redis inline fallback

// POST /internal/generate?day=YYYY-MM-DD — cron (19:00 IST) or manual re-run.
// With REDIS_URL set: enqueue a `plan` job, the worker fans out per-article jobs
// (return 202). Without it (local dev, no queue): run the batch inline in this
// same process — which shares the PGlite lock with `next dev` — and return 200.
export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) return json({ error: "unauthorized" }, 401);

  const day = new URL(request.url).searchParams.get("day") ?? undefined;
  if (day && !DAY_RE.test(day)) {
    return json({ error: "day must be YYYY-MM-DD" }, 400);
  }

  try {
    if (process.env.REDIS_URL) {
      const job = await enqueuePlan(day);
      return json(
        { ok: true, queued: true, jobId: job.id, day: day ?? null },
        202,
      );
    }
    const run = await runGenerate(day);
    return json({ ok: true, queued: false, ...run }, 200);
  } catch (err) {
    captureError(err, { route: "/internal/generate" });
    return json({ ok: false, error: (err as Error).message }, 500);
  }
}

export const GET = POST;
