import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/features/study/api.server";
import {
  canPreview,
  getSubjectChapters,
} from "@/features/study/queries.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subjectSlug: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { subjectSlug } = await params;
  const preview = await canPreview();
  const result = await getSubjectChapters(subjectSlug, { preview });
  if (!result) return jsonError("not_found", 404);
  return NextResponse.json(result);
}
