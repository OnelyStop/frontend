import { isAuthorizedCron } from "@/lib/gazette/auth";
import { json } from "@/lib/gazette/http";
import { captureError } from "@/lib/gazette/log";
import { runIngest } from "@/lib/gazette/pipeline/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /internal/ingest — cron (06:00 & 18:00 IST) or manual re-run.
export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) return json({ error: "unauthorized" }, 401);

  const started = Date.now();
  try {
    const summary = await runIngest();
    return json({ ok: true, ms: Date.now() - started, ...summary });
  } catch (err) {
    captureError(err, { route: "/internal/ingest" });
    return json({ ok: false, error: (err as Error).message }, 500);
  }
}

// Vercel Cron issues GET; accept it too.
export const GET = POST;
