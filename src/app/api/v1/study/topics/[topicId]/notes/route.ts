import { NextResponse } from "next/server";
import {
  createNote,
  listNotes,
  topicIdFromSlug,
} from "@/features/study/queries.server";
import { noteCreate } from "@/features/study/types";
import { jsonError, readJson, requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

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

  const parsed = noteCreate.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid_body", 400);

  const result = await createNote(auth.userId, topicId, parsed.data);
  if ("error" in result) return jsonError(result.error, 404);
  return NextResponse.json({ note: result }, { status: 201 });
}
