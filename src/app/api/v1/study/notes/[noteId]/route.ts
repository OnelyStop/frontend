import { NextResponse } from "next/server";
import { requireUser, jsonError, readJson } from "@/features/study/api.server";
import { deleteNote, updateNote } from "@/features/study/queries.server";
import { rateLimit } from "@/features/study/rate-limit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`note-write:${auth.userId}`, 60, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const { noteId } = await params;
  const body = await readJson<{
    bodyMarkdown?: string;
    color?: string;
    expectedUpdatedAt?: string;
  }>(request);
  if (!body) return jsonError("invalid_json", 400);
  if (body.bodyMarkdown === undefined && body.color === undefined)
    return jsonError("nothing_to_update", 400);

  const result = await updateNote(auth.userId, noteId, body);
  if ("error" in result) {
    const status =
      result.error === "too_long"
        ? 400
        : result.error === "conflict"
          ? 409
          : 404;
    return jsonError(result.error, status);
  }
  return NextResponse.json({ note: result });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { noteId } = await params;
  const ok = await deleteNote(auth.userId, noteId);
  if (!ok) return jsonError("not_found", 404);
  return new NextResponse(null, { status: 204 });
}
