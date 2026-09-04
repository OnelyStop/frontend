import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { json, serializeQuestion } from "@/lib/gazette/http";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

// GET /v1/questions/{question_id}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  if (!AUTH_DISABLED) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const { questionId } = await params;
  if (!UUID_RE.test(questionId)) {
    return json({ error: "invalid question_id" }, 400);
  }

  const [row] = await db
    .select()
    .from(questions)
    .where(eq(questions.questionId, questionId))
    .limit(1);

  if (!row) return json({ error: "not found" }, 404);
  return json(serializeQuestion(row));
}
