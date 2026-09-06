import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { checkQuota, recordAiCall } from "@/features/billing/usage.server";
import { markAnswer, saveMarking } from "@/features/descriptive/marking.server";
import { taskById, wordCount } from "@/features/descriptive/tasks";
import { currentUserId } from "@/lib/auth.server";
import { AiError } from "@/lib/openrouter-client/openrouter-types";
import { captureError } from "@/lib/observability.server";
import { rateLimit } from "@/lib/rate-limit";

// Cost control: the endpoint spends real money, so nothing client-supplied is unbounded.
const MAX_ANSWER = 8000;
const MIN_WORDS = 20;

export async function POST(request: NextRequest) {
  // The proxy only guards page routes, so the API authenticates itself.
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limit = rateLimit(`descriptive:${userId}`, 6, 60_000);
  if (!limit.ok)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { taskId, answer } = (body ?? {}) as {
    taskId?: unknown;
    answer?: unknown;
  };

  // Looked up by id, never taken from the body: a client must not set the brief or the marks.
  const task = typeof taskId === "string" ? taskById(taskId) : undefined;
  if (!task)
    return NextResponse.json({ error: "unknown_task" }, { status: 400 });

  if (typeof answer !== "string")
    return NextResponse.json({ error: "answer_required" }, { status: 400 });

  const trimmed = answer.slice(0, MAX_ANSWER);
  if (wordCount(trimmed) < MIN_WORDS)
    return NextResponse.json(
      { error: "answer_too_short", minWords: MIN_WORDS },
      { status: 400 },
    );

  const quota = await checkQuota(db, userId, "descriptiveMarkingsPerMonth");
  if (!quota.ok)
    return NextResponse.json(
      { error: "quota_exceeded", used: quota.used, limit: quota.limit },
      { status: 429 },
    );

  try {
    const { marking, model, words } = await markAnswer(task, trimmed);
    const id = await saveMarking(db, userId, {
      taskId: task.id,
      answer: trimmed,
      words,
      marking,
      model,
    });
    await recordAiCall(db, userId, "descriptive_marking");
    return NextResponse.json({ id, marking });
  } catch (error) {
    if (error instanceof AiError) {
      const status =
        error.kind === "unauthorized"
          ? 503 // our key, not the user's problem — surface as "unavailable"
          : error.kind === "rate_limited"
            ? 429
            : error.kind === "bad_request"
              ? 400
              : 502;
      // A bad provider key must not read as the user's expired session.
      const code =
        error.kind === "unauthorized" ? "not_configured" : error.kind;
      return NextResponse.json({ error: code }, { status });
    }
    // A reply that parses as JSON but not as a marking would otherwise be silent.
    captureError(error, { route: "descriptive", taskId: task.id });
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
