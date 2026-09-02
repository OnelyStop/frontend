import { NextResponse } from "next/server";
import { requireUser, jsonError, readJson } from "@/features/study/api.server";
import {
  canPreview,
  createConversation,
} from "@/features/study/queries.server";
import { rateLimit } from "@/features/study/rate-limit";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`chat-new:${auth.userId}`, 20, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const body = await readJson<{ topicSlug?: string; topicId?: string }>(
    request,
  );
  const ref = body?.topicSlug ?? body?.topicId;
  if (!ref) return jsonError("topic_required", 400);

  const preview = await canPreview();
  const conversation = await createConversation(auth.userId, ref, { preview });
  if (!conversation) return jsonError("not_found", 404);
  return NextResponse.json({ conversation }, { status: 201 });
}
