import { isAuthorizedCron } from "@/lib/cron";
import { json } from "@/lib/api";
import { captureError } from "@/lib/observability.server";
import { runIngest } from "@/features/current-affairs/pipeline/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
