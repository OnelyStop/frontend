import { db } from "@/db";
import { pipelineHealth } from "@/features/current-affairs/health.server";
import { isAuthorizedCron } from "@/lib/cron";
import { json } from "@/lib/api";
import { captureError } from "@/lib/observability.server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) return json({ error: "unauthorized" }, 401);

  const health = await pipelineHealth(db);
  if (!health.ok) {
    const stale = health.stages.filter((s) => s.stale).map((s) => s.stage);
    captureError(
      new Error(
        `Current-affairs pipeline is stale: ${stale.join(", ") || "last run failed"}`,
      ),
      {
        area: "admin",
        route: "/internal/health",
        stale: stale.join(",") || "none",
        lastRun: health.lastRun?.status ?? "none",
      },
    );
  }

  // 200 either way: Vercel retries a failed cron, and a retry cannot make the pipeline fresher.
  return json(health);
}

export const GET = POST;
