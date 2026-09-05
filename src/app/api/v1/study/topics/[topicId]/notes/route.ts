import { NextResponse } from "next/server";
import { requireUser, jsonError, readJson } from "@/features/study/api.server";
import {
  createNote,
  listNotes,
  topicIdFromSlug,
} from "@/features/study/queries.server";
import { rateLimit } from "@/features/study/rate-limit";

async function resolve(ref: string) {
  return /^[0-9a-f-]{36}$/i.test(ref) ? ref : await topicIdFromSlug(ref);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const topicId = await resolve((await params).topicId);
  if (!topicId) return jsonError("not_found", 404);

  const notes = await listNotes(auth.userId, topicId);
  return NextResponse.json({ notes });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`note-write:${auth.userId}`, 40, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const topicId = await resolve((await params).topicId);
  if (!topicId) return jsonError("not_found", 404);

  const body = await readJson<{
    bodyMarkdown?: string;
    blockStableKey?: string | null;
    contentVersion?: number | null;
    color?: string;
    selectedText?: string | null;
    textBefore?: string | null;
    textAfter?: string | null;
  }>(request);
  if (
    !body ||
    typeof body.bodyMarkdown !== "string" ||
    !body.bodyMarkdown.trim()
  )
    return jsonError("bodyMarkdown_required", 400);

  const result = await createNote(auth.userId, topicId, {
    bodyMarkdown: body.bodyMarkdown,
    blockStableKey: body.blockStableKey ?? null,
    contentVersion: body.contentVersion ?? null,
    color: body.color,
    selectedText: body.selectedText ?? null,
    textBefore: body.textBefore ?? null,
    textAfter: body.textAfter ?? null,
  });
  if ("error" in result)
    return jsonError(result.error, result.error === "too_long" ? 400 : 404);
  return NextResponse.json({ note: result }, { status: 201 });
}
