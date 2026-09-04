import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { json, serializeQuestion, todayIst } from "@/lib/gazette/http";

// Current affairs questions endpoint — now integrated from Gazette Engine.
// Serves questions for a given day with auth guard for page proxy.
export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Local-only escape hatch for testing without an account.
// Refuses to engage in a production build, so it cannot be turned on by a stray
// env var on a deployed instance. Server-side only — never NEXT_PUBLIC_.
const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

export async function GET(request: Request) {
  // The proxy only guards page routes, so the API authenticates itself.
  if (!AUTH_DISABLED) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const incoming = new URL(request.url);
  const day = incoming.searchParams.get("extracted_day") ?? todayIst();
  const limit = incoming.searchParams.get("limit");

  if (!DAY_RE.test(day)) {
    return json({ error: "extracted_day must be YYYY-MM-DD" }, 400);
  }

  // Clamp limit to a reasonable range to prevent unbounded requests
  const parsedLimit = Number(limit) || DEFAULT_LIMIT;
  const clampedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.extractedDay, day))
    .orderBy(desc(questions.createdAt))
    .limit(clampedLimit);

  return json({
    extracted_day: day,
    count: rows.length,
    questions: rows.map(serializeQuestion),
  });
}
