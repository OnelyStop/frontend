import { NextResponse } from "next/server";
import { db } from "@/db";
import { questionReports } from "@/db/schema";
import { reportCreate } from "@/features/question-bank/reports";
import { jsonError, readJson, requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ qId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!rateLimit(`question-report:${auth.userId}`, 20, 60_000).ok)
    return jsonError("rate_limited", 429);

  const parsed = reportCreate.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid_body", 400);

  const { qId } = await params;

  try {
    await db
      .insert(questionReports)
      .values({
        qId,
        userId: auth.userId,
        reason: parsed.data.reason,
        note: parsed.data.note || null,
      })
      // A second look at the same question is the same opinion, not a second vote.
      .onConflictDoUpdate({
        target: [questionReports.qId, questionReports.userId],
        set: {
          reason: parsed.data.reason,
          note: parsed.data.note || null,
          status: "open",
        },
      });
  } catch {
    // The only way the insert fails on a valid body is a q_id that is not in the bank.
    return jsonError("unknown_question", 404);
  }

  // Nothing about the question comes back: `answer` has no grant for a reason.
  return NextResponse.json({ ok: true }, { status: 201 });
}
