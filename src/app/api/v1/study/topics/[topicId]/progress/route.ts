import { NextResponse } from "next/server";
import {
  topicIdFromSlug,
  upsertProgress,
} from "@/features/study/queries.server";
import { progressUpdate } from "@/features/study/types";
import { jsonError, readJson, requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`progress:${auth.userId}`, 60, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const parsed = progressUpdate.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid_body", 400);

  const { topicId: ref } = await params;
  const topicId = /^[0-9a-f-]{36}$/i.test(ref)
    ? ref
    : await topicIdFromSlug(ref);
  if (!topicId) return jsonError("not_found", 404);

  const result = await upsertProgress(
    auth.userId,
    topicId,
    parsed.data.progressPercent,
  );
  if ("error" in result) return jsonError(result.error, 404);
  return NextResponse.json(result);
}
