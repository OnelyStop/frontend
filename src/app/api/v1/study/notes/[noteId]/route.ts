import { NextResponse } from "next/server";
import { deleteNote, updateNote } from "@/features/study/queries.server";
import { noteUpdate } from "@/features/study/types";
import { jsonError, readJson, requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`note-write:${auth.userId}`, 60, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const parsed = noteUpdate.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid_body", 400);

  const { noteId } = await params;
  const result = await updateNote(auth.userId, noteId, parsed.data);
  if ("error" in result)
    return jsonError(result.error, result.error === "conflict" ? 409 : 404);
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
