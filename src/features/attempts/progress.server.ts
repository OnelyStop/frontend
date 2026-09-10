import "server-only";
import { and, count, desc, eq, gte, isNotNull, max, sql } from "drizzle-orm";
import { CUTOFF_LADDER, NEGATIVE_MARK } from "@/data/navigation";
import type { Db } from "@/db";
import { attemptAnswers, attempts, bankQuestions, papers } from "@/db/schema";
import { dayBack, istDayKey } from "@/lib/ist";
import { isCorrect, round2 } from "./scoring";

const WINDOW_DAYS = 30;

// Accuracy on one or two questions is noise, and /attempt-map turns it into a verdict.
const MIN_TOPIC_ATTEMPTS = 3;

export type SectionProgress = {
  section: string;
  attempted: number;
  correct: number;
  /** Averaged over answers that recorded a time; null when none did. */
  avgSec: number | null;
};

export type DayCount = {
  /** IST calendar date, `YYYY-MM-DD` — the view labels from this, never from its own clock. */
  date: string;
  count: number;
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
  /** Averaged over answers that recorded a time; 0 when none did, never a pace. */
  avgSec: number;
  marksLost: number;
};

export type Progress = {
  attempted: number;
  correct: number;
  wrong: number;
  avgSec: number | null;
  sections: SectionProgress[];
  /** The last seven IST days, oldest first — today is the last entry. */
  week: DayCount[];
};

export type RecentAttempt = {
  id: number;
  mode: "paper" | "bank" | "mix";
  /** "IBPS PO 2025 · Prelims" for a paper; null for a drill. */
  paper: string | null;
  questions: number;
  score: number | null;
  /** 55% of the questions served — the same benchmark /mocks scores against; null for a drill. */
  target: number | null;
  /** ISO. */
  submittedAt: string;
};

const TARGET_PCT =
  CUTOFF_LADDER.find((b) => b.band === "At cutoff")!.threshold / 100;

const WEEK_DAYS = 7;

const emptyWeek = (now: Date): DayCount[] => {
  const today = istDayKey(now);
  return Array.from({ length: WEEK_DAYS }, (_, i) => ({
    date: dayBack(today, WEEK_DAYS - 1 - i),
    count: 0,
  }));
};

// Graded from the stored key on read, never from anything the client sent.
export async function getProgress(
  db: Db,
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

  const week = emptyWeek(now);
  const weekIndex = new Map(week.map((d, i) => [d.date, i]));
  if (graded.length === 0) {
    return {
      attempted: 0,
      correct: 0,
      wrong: 0,
      avgSec: null,
      sections: [],
      week,
    };
  }

  const bySection = new Map<
    string,
    { a: number; c: number; ms: number; timed: number }
  >();
  let correct = 0;
  let totalMs = 0;
  let timed = 0;

  for (const r of graded) {
    const key = r.section ?? "Unsectioned";
    const s = bySection.get(key) ?? { a: 0, c: 0, ms: 0, timed: 0 };
    s.a += 1;
    const right = isCorrect(r.chosen, r.answer);
    if (right) {
      s.c += 1;
      correct += 1;
    }
    if (r.timeMs !== null) {
      s.ms += r.timeMs;
      s.timed += 1;
      totalMs += r.timeMs;
      timed += 1;
    }
    bySection.set(key, s);

    // Bucketed by IST calendar day so the bar always sits under its own date.
    const i = weekIndex.get(istDayKey(r.startedAt));
    if (i !== undefined) week[i]!.count += 1;
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
        // Over timed answers only — dividing by every attempt reads an untimed one as instant.
        avgSec: s.timed > 0 ? Math.round(s.ms / s.timed / 1000) : null,
      }))
      .sort((x, y) => y.attempted - x.attempted),
    week,
  };
}

/** Topics under `MIN_TOPIC_ATTEMPTS` are dropped rather than shown at 0% or 100%: /attempt-map reads a row as "bank this" or "skip this", and a verdict off one question is worse than none. */
export async function getTopicMap(
  db: Db,
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

/** The last few submitted sittings, newest first — what the spine on /today, /mocks and /progress is built from. */
export async function listRecentAttempts(
  db: Db,
  userId: string,
  limit = 5,
  now = new Date(),
): Promise<RecentAttempt[]> {
  // The same window as getProgress, so the spine never lists a sitting the figures beside it exclude.
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);
  const rows = await db
    .select({
      id: attempts.id,
      mode: attempts.mode,
      score: attempts.score,
      submittedAt: attempts.submittedAt,
      questions: sql<number>`cardinality(${attempts.servedQIds})`,
      bank: papers.bank,
      role: papers.role,
      examType: papers.examType,
      year: papers.year,
    })
    .from(attempts)
    .leftJoin(papers, eq(papers.paperId, attempts.paperId))
    .where(
      and(
        eq(attempts.userId, userId),
        isNotNull(attempts.submittedAt),
        gte(attempts.submittedAt, since),
      ),
    )
    .orderBy(desc(attempts.submittedAt))
    .limit(limit);

  return rows.flatMap((r) => {
    if (!r.submittedAt) return [];
    const isPaper = r.mode === "paper";
    const paper = isPaper
      ? `${r.bank ?? "Unknown"} ${r.role ?? ""} ${r.year ?? ""}`.trim() +
        (r.examType ? ` · ${r.examType}` : "")
      : null;
    const questions = Number(r.questions);
    return [
      {
        id: r.id,
        mode: r.mode,
        paper,
        questions,
        // score is numeric, so the driver hands it back as a string.
        score: r.score === null ? null : Number(r.score),
        target: isPaper ? Math.round(questions * TARGET_PCT) : null,
        submittedAt: r.submittedAt.toISOString(),
      },
    ];
  });
}

// One aggregate row per mode — "bank" and "mix" both count as drills.
export async function getProfileStats(
  db: Db,
  userId: string,
): Promise<ProfileStats> {
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
