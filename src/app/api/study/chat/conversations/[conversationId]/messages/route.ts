import { NextResponse } from "next/server";
import { requireUser, jsonError, readJson } from "@/features/study/api.server";
import { listMessages } from "@/features/study/queries.server";
import { answerInConversation } from "@/features/study/tutor.server";
import { rateLimit } from "@/features/study/rate-limit";

const MAX_QUESTION = 1_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { conversationId } = await params;
  const messages = await listMessages(auth.userId, conversationId);
  if (messages === null) return jsonError("not_found", 404);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`chat-msg:${auth.userId}`, 15, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const { conversationId } = await params;
  const body = await readJson<{
    question?: string;
    selectedBlockKey?: string | null;
    includeMyNotes?: boolean;
  }>(request);
  if (!body || typeof body.question !== "string" || !body.question.trim())
    return jsonError("question_required", 400);

  const result = await answerInConversation(auth.userId, conversationId, {
    question: body.question.slice(0, MAX_QUESTION),
    selectedBlockKey:
      typeof body.selectedBlockKey === "string" ? body.selectedBlockKey : null,
    includeMyNotes: body.includeMyNotes === true,
  });

  if ("error" in result) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "rate_limited"
          ? 429
          : result.error === "bad_request"
            ? 400
            : result.error === "unauthorized"
              ? 503
              : 502;
    return jsonError(result.error, status);
  }
  return NextResponse.json(result);
}
