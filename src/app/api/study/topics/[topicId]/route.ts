import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/features/study/api.server";
import { canPreview, getTopicOutline } from "@/features/study/queries.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { topicId } = await params;
  const preview = await canPreview();
  const outline = await getTopicOutline(topicId, { preview });
  if (!outline) return jsonError("not_found", 404);
  return NextResponse.json({ topic: outline, preview });
}
