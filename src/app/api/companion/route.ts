import { NextResponse, type NextRequest } from "next/server";
import { AiError, type Turn } from "@/lib/openrouter-client/openrouter-types";
import { openrouter } from "@/lib/openrouter-client/openrouter";
import {
  COMPANION_SYSTEM,
  companionUserPrompt,
} from "@/features/companion/system-prompt";
import { createClient } from "@/lib/supabase-server";

// Caps double as cost control: the endpoint spends real money per call, so
// nothing client-supplied is passed through unbounded.
const MAX_SELECTION = 4000;
const MAX_QUESTION = 1000;
const MAX_HISTORY_TURNS = 12;

const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { selection, question, history } = (body ?? {}) as {
    selection?: unknown;
    question?: unknown;
    history?: unknown;
  };

  if (typeof selection !== "string" || !selection.trim()) {
    return NextResponse.json({ error: "selection_required" }, { status: 400 });
  }
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "question_required" }, { status: 400 });
  }

  const turns: Turn[] = Array.isArray(history)
    ? history
        .filter(
          (t): t is Turn =>
            !!t &&
            typeof t === "object" &&
            ((t as Turn).role === "user" || (t as Turn).role === "assistant") &&
            typeof (t as Turn).content === "string",
        )
        .slice(-MAX_HISTORY_TURNS)
        .map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }))
    : [];

  try {
    const answer = await openrouter.ask({
      system: COMPANION_SYSTEM,
      history: turns,
      prompt: companionUserPrompt(
        selection.slice(0, MAX_SELECTION),
        question.slice(0, MAX_QUESTION),
      ),
    });
    return NextResponse.json({ text: answer.text });
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
      return NextResponse.json({ error: error.kind }, { status });
    }
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
