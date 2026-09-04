import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { DAY_RE, json, serializeQuestion, todayIst } from "@/lib/gazette/http";

export const dynamic = "force-dynamic";

const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

// GET /v1/questions/daily?extracted_day=YYYY-MM-DD&limit=50
export async function GET(request: Request) {
  if (!AUTH_DISABLED) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);

  const day = searchParams.get("extracted_day") ?? todayIst();
  if (!DAY_RE.test(day)) {
    return json({ error: "extracted_day must be YYYY-MM-DD" }, 400);
  }

  const limitRaw = Number(searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.trunc(limitRaw)))
    : 50;

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
