import type { QuestionRow } from "@/lib/gazette/db/schema";

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in IST as YYYY-MM-DD — the default question window. */
export function todayIst(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function serializeQuestion(q: QuestionRow) {
  return {
    question_id: q.questionId,
    extracted_day: q.extractedDay,
    topic: q.topic,
    question_text: q.questionText,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      // Read-only public API — safe to allow cross-origin GETs. The frontend
      // still calls it through a same-origin proxy so the URL stays private.
      "cache-control": "no-store",
    },
  });
}
