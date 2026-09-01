import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/gazette/db";
import { questions } from "@/lib/gazette/db/schema";
import { DAY_RE, json, serializeQuestion, todayIst } from "@/lib/gazette/http";

export const dynamic = "force-dynamic";

// GET /v1/questions/daily?extracted_day=YYYY-MM-DD&limit=50
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const day = searchParams.get("extracted_day") ?? todayIst();
  if (!DAY_RE.test(day)) {
    return json({ error: "extracted_day must be YYYY-MM-DD" }, 400);
  }

  const limitRaw = Number(searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.trunc(limitRaw)))
    : 50;

  const db = await getDb();
  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.extractedDay, day))
    .orderBy(desc(questions.createdAt))
    .limit(limit);

  return json({
    extracted_day: day,
    count: rows.length,
    questions: rows.map(serializeQuestion),
  });
}
