import "server-only";
import { and, count, eq, gte, isNotNull, max, sql } from "drizzle-orm";
import { NEGATIVE_MARK } from "@/data/navigation";
import { db } from "@/db";
import { attemptAnswers, attempts, bankQuestions } from "@/db/schema";
import { isCorrect, round2 } from "./scoring";

const WINDOW_DAYS = 30;

// Accuracy on one or two questions is noise, and /attempt-map turns it into a verdict.
const MIN_TOPIC_ATTEMPTS = 3;

export type SectionProgress = {
  section: string;
  attempted: number;
  correct: number;
  avgSec: number;
};

export type ProfileStats = {
  mocksSat: number;
  drillsSat: number;
  bestScore: number | null;
  /** ISO, the most recent submitted attempt of any mode. */
  lastSatAt: string | null;
};

export type TopicMapRow = {
  topic: string;
  section: string;
  attempted: number;
  correct: number;
  /** Percent, 0-100, against attempted — a blank is never counted here. */
  accuracy: number;
  avgSec: number;
  marksLost: number;
};

export type Progress = {
  attempted: number;
  correct: number;
  wrong: number;
  avgSec: number | null;
  sections: SectionProgress[];
  /** The last seven days, oldest first — today is the last entry. */
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

    // Days back from today, index 6 being today — never a weekday bucket.
    const back = Math.floor(
      (now.getTime() - r.startedAt.getTime()) / 86_400_000,
    );
    if (back >= 0 && back < 7) week[6 - back] += 1;
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

/**
 * One row per topic over the same 30-day window as `getProgress`, graded the
 * same way — from `bank_questions.answer`, never from anything a client sent.
 *
 * Topics under `MIN_TOPIC_ATTEMPTS` are dropped rather than shown at 0% or
 * 100%: /attempt-map reads a row as "bank this" or "skip this", and a verdict
 * off one question is worse than no verdict at all.
 */
export async function getTopicMap(
  userId: string,
  now = new Date(),
): Promise<TopicMapRow[]> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);

  const rows = await db
    .select({
      topic: bankQuestions.topic,
      section: bankQuestions.section,
      answer: bankQuestions.answer,
      chosen: attemptAnswers.chosen,
      timeMs: attemptAnswers.timeMs,
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
        isNotNull(bankQuestions.topic),
        sql`${attemptAnswers.chosen} is not null`,
      ),
    );

  // isNotNull guarantees both at runtime but does not narrow the select type.
  const graded = rows.filter(
    (r): r is typeof r & { answer: string; topic: string } =>
      r.answer !== null && r.topic !== null,
  );
  if (graded.length === 0) return [];

  type Bucket = {
    topic: string;
    section: string;
    attempted: number;
    correct: number;
    ms: number;
    timed: number;
  };
  const byTopic = new Map<string, Bucket>();

  for (const r of graded) {
    const section = r.section ?? "Unsectioned";
    // The same topic name can appear under two sections, so the key carries both.
    const key = `${section}::${r.topic}`;
    const b = byTopic.get(key) ?? {
      topic: r.topic,
      section,
      attempted: 0,
      correct: 0,
      ms: 0,
      timed: 0,
    };
    b.attempted += 1;
    if (isCorrect(r.chosen, r.answer)) b.correct += 1;
    if (r.timeMs !== null) {
      b.ms += r.timeMs;
      b.timed += 1;
    }
    byTopic.set(key, b);
  }

  return [...byTopic.values()]
    .filter((b) => b.attempted >= MIN_TOPIC_ATTEMPTS)
    .map((b) => ({
      topic: b.topic,
      section: b.section,
      attempted: b.attempted,
      correct: b.correct,
      accuracy: round2((b.correct / b.attempted) * 100),
      // Averaged over the timed answers only, so untimed rows don't read as instant.
      avgSec: b.timed > 0 ? Math.round(b.ms / b.timed / 1000) : 0,
      marksLost: round2((b.attempted - b.correct) * NEGATIVE_MARK),
    }))
    .sort(
      (x, y) => y.attempted - x.attempted || x.topic.localeCompare(y.topic),
    );
}

// One aggregate row per mode — "bank" and "mix" both count as drills.
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const rows = await db
    .select({
      mode: attempts.mode,
      sat: count(),
      bestScore: max(attempts.score),
      lastSatAt: max(attempts.submittedAt),
    })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), isNotNull(attempts.submittedAt)))
    .groupBy(attempts.mode);

  let mocksSat = 0;
  let drillsSat = 0;
  let bestScore: number | null = null;
  let lastSatAt: Date | null = null;

  for (const r of rows) {
    if (r.mode === "paper") {
      mocksSat = r.sat;
      // score is numeric, so the driver hands it back as a string.
      if (r.bestScore !== null) bestScore = Number(r.bestScore);
    } else {
      drillsSat += r.sat;
    }
    if (r.lastSatAt && (lastSatAt === null || r.lastSatAt > lastSatAt)) {
      lastSatAt = r.lastSatAt;
    }
  }

  return {
    mocksSat,
    drillsSat,
    bestScore,
    lastSatAt: lastSatAt?.toISOString() ?? null,
  };
}
