import { NextResponse } from "next/server";
import { jsonError, readJson, requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/db";
import { submitFeedback } from "@/features/feedback/feedback.server";
import { feedbackInput } from "@/features/feedback/types";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const limit = rateLimit(`feedback:${auth.userId}`, 5, 60_000);
  if (!limit.ok) return jsonError("rate_limited", 429);

  const parsed = feedbackInput.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("invalid_body", 400);

  const outcome = await submitFeedback(db, auth.userId, parsed.data);
  if (!outcome.ok) return jsonError(outcome.reason, 429);

  return NextResponse.json({ id: outcome.id }, { status: 201 });
}
