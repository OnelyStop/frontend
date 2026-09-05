import { isAuthorizedCron } from "@/lib/gazette/auth";
import { DAY_RE } from "@/lib/gazette/day";
import { json } from "@/lib/gazette/http";
import { captureError } from "@/lib/gazette/log";
import { runGenerate } from "@/lib/gazette/pipeline/generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
// Same region as the database and the Indian news sources.
export const preferredRegion = "bom1";

const DEADLINE_MS = 240_000;

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) return json({ error: "unauthorized" }, 401);

  const day = new URL(request.url).searchParams.get("day") ?? undefined;
  if (day && !DAY_RE.test(day)) {
    return json({ error: "day must be YYYY-MM-DD" }, 400);
  }

  try {
    const run = await runGenerate(day, { deadlineMs: DEADLINE_MS });
    return json({ ok: true, ...run }, 200);
  } catch (err) {
    captureError(err, { route: "/internal/generate" });
    return json({ ok: false, error: (err as Error).message }, 500);
  }
}

export const GET = POST;
