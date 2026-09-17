import { revalidateTag } from "next/cache";
import { isAuthorizedCron } from "@/lib/cron";
import { json } from "@/lib/api";
import { GAZETTE_TAG } from "@/features/current-affairs/queries.server";

export const dynamic = "force-dynamic";

// The pipeline writes from a CI runner, so nothing in this process knows a day changed.
export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) return json({ error: "unauthorized" }, 401);
  // expire: 0, not "max": serving a day stale is exactly the bug — it was cached empty before the questions existed.
  revalidateTag(GAZETTE_TAG, { expire: 0 });
  return json({ ok: true, tag: GAZETTE_TAG });
}

export const GET = POST;
