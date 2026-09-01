import { eq } from "drizzle-orm";
import { getDb } from "@/lib/gazette/db";
import { questions } from "@/lib/gazette/db/schema";
import { json, serializeQuestion } from "@/lib/gazette/http";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /v1/questions/{question_id}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const { questionId } = await params;
  if (!UUID_RE.test(questionId)) {
    return json({ error: "invalid question_id" }, 400);
  }

  const db = await getDb();
  const [row] = await db
    .select()
    .from(questions)
    .where(eq(questions.questionId, questionId))
    .limit(1);

  if (!row) return json({ error: "not found" }, 404);
  return json(serializeQuestion(row));
}
