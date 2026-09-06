import "server-only";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { attemptAnswers, attempts, bankQuestions } from "@/db/schema";
import { isCorrect } from "./scoring";

const WINDOW_DAYS = 30;

export type SectionProgress = {
  section: string;
  attempted: number;
  correct: number;
  avgSec: number;
};

export type Progress = {
  attempted: number;
  correct: number;
  wrong: number;
  avgSec: number | null;
  sections: SectionProgress[];
  /** Questions attempted per day, oldest first, one entry per day of the week. */
  week: number[];
};

const EMPTY: Progress = {
  attempted: 0,
  correct: 0,
  wrong: 0,
  avgSec: null,
  sections: [],
  week: [0, 0, 0, 0, 0, 0, 0],
};

// Graded from the stored key on read, never from anything the client sent.
export async function getProgress(
  userId: string,
  now = new Date(),
): Promise<Progress> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);

  const rows = await db
    .select({
      section: bankQuestions.section,
      answer: bankQuestions.answer,
      chosen: attemptAnswers.chosen,
      timeMs: attemptAnswers.timeMs,
      startedAt: attempts.startedAt,
    })
    .from(attemptAnswers)
    .innerJoin(attempts, eq(attempts.id, attemptAnswers.attemptId))
    .innerJoin(bankQuestions, eq(bankQuestions.qId, attemptAnswers.qId))
    .where(
      and(
        eq(attempts.userId, userId),
        isNotNull(attempts.submittedAt),
        gte(attempts.startedAt, since),
        isNotNull(bankQuestions.answer),
        sql`${attemptAnswers.chosen} is not null`,
      ),
    );

  // isNotNull guarantees this at runtime but does not narrow the select type.
  const graded = rows.filter(
    (r): r is typeof r & { answer: string } => r.answer !== null,
  );
  if (graded.length === 0) return EMPTY;

  const bySection = new Map<string, { a: number; c: number; ms: number }>();
  const week = [0, 0, 0, 0, 0, 0, 0];
  let correct = 0;
  let totalMs = 0;
  let timed = 0;

  for (const r of graded) {
    const key = r.section ?? "Unsectioned";
    const s = bySection.get(key) ?? { a: 0, c: 0, ms: 0 };
    s.a += 1;
    const right = isCorrect(r.chosen, r.answer);
    if (right) {
      s.c += 1;
      correct += 1;
    }
    if (r.timeMs !== null) {
      s.ms += r.timeMs;
      totalMs += r.timeMs;
      timed += 1;
    }
    bySection.set(key, s);

    // Monday-first, matching the labels the view renders.
    const day = (r.startedAt.getUTCDay() + 6) % 7;
    week[day] += 1;
  }

  return {
    attempted: graded.length,
    correct,
    wrong: graded.length - correct,
    avgSec: timed > 0 ? Math.round(totalMs / timed / 1000) : null,
    sections: [...bySection.entries()]
      .map(([section, s]) => ({
        section,
        attempted: s.a,
        correct: s.c,
        avgSec: s.a > 0 ? Math.round(s.ms / s.a / 1000) : 0,
      }))
      .sort((x, y) => y.attempted - x.attempted),
    week,
  };
}
