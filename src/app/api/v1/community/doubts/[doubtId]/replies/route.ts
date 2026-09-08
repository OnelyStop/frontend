import { NextResponse } from "next/server";
import { getThread } from "@/features/community/queries.server";
import { postReply } from "@/features/community/mutations.server";
import { replyCreate } from "@/features/community/types";
import { jsonError, readJson, requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ doubtId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const thread = await getThread((await params).doubtId);
  if (!thread) return jsonError("not_found", 404);
  return NextResponse.json({ replies: thread.replies });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ doubtId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`reply:${auth.userId}`, 20, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const parsed = replyCreate.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid_body", 400);

  const result = await postReply(
    auth.userId,
    (await params).doubtId,
    parsed.data.body,
  );
  if (!result.ok) return jsonError("not_found", 404);
  return NextResponse.json({ replyId: result.replyId }, { status: 201 });
}
