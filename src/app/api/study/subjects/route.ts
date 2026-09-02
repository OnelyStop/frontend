import { NextResponse } from "next/server";
import { requireUser } from "@/features/study/api.server";
import { canPreview, listSubjects } from "@/features/study/queries.server";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const preview = await canPreview();
  const subjects = await listSubjects({ preview });
  return NextResponse.json({ subjects, preview });
}
