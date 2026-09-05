import { NextResponse } from "next/server";
import { requireUser } from "@/features/study/api.server";
import { canPreview, listFlashcards } from "@/features/study/queries.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { topicId } = await params;
  const preview = await canPreview();
  const flashcards = await listFlashcards(topicId, { preview });
  return NextResponse.json({ flashcards });
}
