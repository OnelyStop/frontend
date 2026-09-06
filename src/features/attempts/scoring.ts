/**
 * Pure scoring math — no DB, no `server-only`. Kept separate from
 * attempts.server.ts so the negative-marking, accuracy, and rollup logic is
 * unit-testable without a database, and so a client component could import
 * it for a live running-score readout without pulling in `db`.
 */

export type GradedAnswer = {
  qId: string;
  section: string;
  topic: string | null;
  chosen: string | null;
  correct: string;
  marks: number;
  negativeMarks: number;
  timeMs: number | null;
};

export type ScoreTotals = {
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  maxScore: number;
  accuracy: number;
};

/** `chosen === null` is a blank, not a wrong answer — it costs nothing under
 * negative marking. Comparison is case-insensitive: `bank_questions.answer`
 * and `attempt_answers.chosen` are both single option-key characters, but
 * nothing upstream guarantees the same case. */
export function isCorrect(chosen: string | null, correct: string): boolean {
  return chosen !== null && chosen.toLowerCase() === correct.toLowerCase();
}

export function scoreTotals(answers: GradedAnswer[]): ScoreTotals {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let score = 0;
  let maxScore = 0;

  for (const a of answers) {
    maxScore += a.marks;
    if (a.chosen === null) {
      skipped++;
      continue;
    }
    if (isCorrect(a.chosen, a.correct)) {
      correct++;
      score += a.marks;
    } else {
      wrong++;
      score -= a.negativeMarks;
    }
  }

  const attempted = correct + wrong;
  return {
    attempted,
    correct,
    wrong,
    skipped,
    // Score can go negative under negative marking; never clamp it to 0 — that's the honest number IBPS/SBI reports.
    score: round2(score),
    maxScore: round2(maxScore),
    // Accuracy is against *attempted*, not the full paper — a blank is a choice not to risk the mark, not a miss.
    accuracy: attempted > 0 ? round2((correct / attempted) * 100) : 0,
  };
}

export function scoreBySection(answers: GradedAnswer[]): Map<
  string,
  {
    attempted: number;
    correct: number;
    wrong: number;
    skipped: number;
    marksEarned: number;
    marksLost: number;
  }
> {
  const bySection = new Map<string, GradedAnswer[]>();
  for (const a of answers) {
    const list = bySection.get(a.section) ?? [];
    list.push(a);
    bySection.set(a.section, list);
  }

  const out = new Map<
    string,
    {
      attempted: number;
      correct: number;
      wrong: number;
      skipped: number;
      marksEarned: number;
      marksLost: number;
    }
  >();
  for (const [section, list] of bySection) {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let marksEarned = 0;
    let marksLost = 0;
    for (const a of list) {
      if (a.chosen === null) {
        skipped++;
      } else if (isCorrect(a.chosen, a.correct)) {
        correct++;
        marksEarned += a.marks;
      } else {
        wrong++;
        marksLost += a.negativeMarks;
      }
    }
    out.set(section, {
      attempted: correct + wrong,
      correct,
      wrong,
      skipped,
      marksEarned: round2(marksEarned),
      marksLost: round2(marksLost),
    });
  }
  return out;
}

export function scoreByTopic(answers: GradedAnswer[]): Map<
  string,
  {
    section: string;
    attempted: number;
    correct: number;
    avgTimeSec: number;
    marksLost: number;
  }
> {
  const byTopic = new Map<string, GradedAnswer[]>();
  for (const a of answers) {
    if (!a.topic) continue;
    const key = `${a.section}::${a.topic}`;
    const list = byTopic.get(key) ?? [];
    list.push(a);
    byTopic.set(key, list);
  }

  const out = new Map<
    string,
    {
      section: string;
      attempted: number;
      correct: number;
      avgTimeSec: number;
      marksLost: number;
    }
  >();
  for (const [key, list] of byTopic) {
    const attemptedList = list.filter((a) => a.chosen !== null);
    const correct = attemptedList.filter((a) =>
      isCorrect(a.chosen, a.correct),
    ).length;
    const timed = list.filter((a) => a.timeMs !== null);
    const avgTimeSec =
      timed.length > 0
        ? round2(
            timed.reduce((sum, a) => sum + (a.timeMs ?? 0), 0) /
              timed.length /
              1000,
          )
        : 0;
    // What "Revise these topics" ranks by — mark plus penalty per wrong answer, so high-value misses outrank low-value ones.
    const marksLost = round2(
      attemptedList
        .filter((a) => !isCorrect(a.chosen, a.correct))
        .reduce((sum, a) => sum + a.marks + a.negativeMarks, 0),
    );
    out.set(key, {
      section: list[0]!.section,
      attempted: attemptedList.length,
      correct,
      avgTimeSec,
      marksLost,
    });
  }
  return out;
}

/** Cumulative score after each answered question, in the order given — the
 * shape the "score over elapsed time" chart plots. Blanks don't move the
 * line; they still advance `elapsedSec`. */
export function scoreTimeline(
  answers: GradedAnswer[],
): { index: number; elapsedSec: number; cumulativeScore: number }[] {
  let elapsedMs = 0;
  let cumulative = 0;
  return answers.map((a, i) => {
    elapsedMs += a.timeMs ?? 0;
    if (a.chosen !== null) {
      cumulative += isCorrect(a.chosen, a.correct) ? a.marks : -a.negativeMarks;
    }
    return {
      index: i + 1,
      elapsedSec: Math.round(elapsedMs / 1000),
      cumulativeScore: round2(cumulative),
    };
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
