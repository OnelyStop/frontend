import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { CUTOFF_LADDER } from "@/data/navigation";
import { db } from "@/db";
import {
  attemptAnswers,
  attempts,
  bankQuestions,
  directions,
  notes,
  papers,
} from "@/db/schema";
import { currentUserId } from "@/lib/auth.server";
import {
  type GradedAnswer,
  isCorrect,
  scoreBySection,
  scoreByTopic,
  scoreTimeline,
  scoreTotals,
  round2,
} from "./scoring";
import type { Scorecard, ScoredQuestion, TopicTheory } from "./types";

const TARGET_PCT =
  CUTOFF_LADDER.find((b) => b.band === "At cutoff")!.threshold / 100;

// How many topics "Revise these topics" leads with — each card is already ~150-300 words of reading.
const REVISE_TOPIC_COUNT = 3;
// A couple of entries per block, not the note's whole list (tricks run 3-7 per note, mistakes 2-4).
const TRICKS_SHOWN = 2;
const MISTAKES_SHOWN = 2;

/** Null covers missing, unsubmitted and someone else's alike, so `/results/<id>` cannot be probed for which attempts exist. */
export async function getScorecard(
  attemptId: number,
): Promise<Scorecard | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const [attempt] = await db
    .select({
      id: attempts.id,
      mode: attempts.mode,
      paperId: attempts.paperId,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
    })
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .limit(1);
  if (!attempt || !attempt.submittedAt) return null;

  const rows = await db
    .select({
      qId: bankQuestions.qId,
      qNum: bankQuestions.qNum,
      section: bankQuestions.section,
      topic: bankQuestions.topic,
      stem: bankQuestions.stem,
      options: bankQuestions.options,
      answer: bankQuestions.answer,
      explanation: bankQuestions.explanation,
      marks: bankQuestions.marks,
      negativeMarks: bankQuestions.negativeMarks,
      direction: directions.body,
      chosen: attemptAnswers.chosen,
      timeMs: attemptAnswers.timeMs,
    })
    .from(attemptAnswers)
    .innerJoin(bankQuestions, eq(bankQuestions.qId, attemptAnswers.qId))
    .leftJoin(
      directions,
      and(
        eq(directions.paperId, bankQuestions.paperId),
        eq(directions.directionId, bankQuestions.directionId),
      ),
    )
    .where(eq(attemptAnswers.attemptId, attemptId))
    .orderBy(attemptAnswers.id);
  if (rows.length === 0) return null;

  // A null `answer` shouldn't reach an attempt, but a re-import removing one after the fact is a real, rare case.
  const answerable = rows.filter(
    (r): r is typeof r & { answer: string } => r.answer !== null,
  );

  const graded: GradedAnswer[] = answerable.map((r) => ({
    qId: r.qId,
    section: r.section ?? "",
    topic: r.topic,
    chosen: r.chosen,
    correct: r.answer,
    marks: Number(r.marks),
    negativeMarks: Number(r.negativeMarks),
    timeMs: r.timeMs,
  }));

  const totals = scoreTotals(graded);
  const bySection = scoreBySection(graded);
  const byTopic = scoreByTopic(graded);
  const timeline = scoreTimeline(graded);

  const topics = [
    ...new Set(
      answerable.map((r) => r.topic).filter((t): t is string => t !== null),
    ),
  ];
  const theoryByTopic = await topicTheoryLookup(topics);

  const questions: ScoredQuestion[] = answerable.map((r) => {
    const theory = r.topic ? theoryByTopic.get(r.topic) : undefined;
    return {
      qId: r.qId,
      qNum: r.qNum,
      section: r.section ?? "",
      topic: r.topic,
      stem: r.stem,
      direction: r.direction,
      options: Object.entries(r.options as Record<string, string>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, text]) => ({ key, text })),
      chosen: r.chosen,
      correct: r.answer,
      isCorrect: isCorrect(r.chosen, r.answer),
      explanation: r.explanation,
      timeMs: r.timeMs,
      marks: Number(r.marks),
      negativeMarks: Number(r.negativeMarks),
      noteId: theory?.primaryNoteId ?? null,
      noteTitle: theory?.topicTitle ?? null,
      noteSummary: theory?.summary ?? null,
    };
  });

  let paperName: string | null = null;
  let target: number | null = null;
  if (attempt.paperId) {
    const [paper] = await db
      .select({ bank: papers.bank, role: papers.role, year: papers.year })
      .from(papers)
      .where(eq(papers.paperId, attempt.paperId))
      .limit(1);
    if (paper) {
      paperName =
        `${paper.bank ?? "Unknown"} ${paper.role ?? ""} ${paper.year ?? ""}`.trim();
      // Question-count basis, matching papers.server.ts's Mock.target — scaling by maxScore would diverge on mixed-mark papers.
      target = Math.round(graded.length * TARGET_PCT);
    }
  }

  const durationSec =
    attempt.submittedAt && attempt.startedAt
      ? Math.round(
          (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000,
        )
      : null;

  const topicResults = [...byTopic.entries()].map(([key, t]) => ({
    section: t.section,
    topic: key.split("::")[1] ?? key,
    attempted: t.attempted,
    correct: t.correct,
    accuracy:
      t.attempted > 0 ? Math.round((t.correct / t.attempted) * 10000) / 100 : 0,
    avgTimeSec: t.avgTimeSec,
    marksLost: t.marksLost,
  }));

  // Worst topics by marks lost, capped — a topic with no note (~13% have none) is silently absent, never a broken card.
  const theory: TopicTheory[] = topicResults
    .filter((t) => t.marksLost > 0)
    .sort((a, b) => b.marksLost - a.marksLost)
    .map((t) => theoryByTopic.get(t.topic))
    .filter((t) => t !== undefined)
    .slice(0, REVISE_TOPIC_COUNT)
    .map(({ primaryNoteId: _primaryNoteId, ...rest }) => rest);

  return {
    attemptId: attempt.id,
    mode: attempt.mode,
    paperName,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt.toISOString(),
    durationSec,
    totalQuestions: graded.length,
    ...totals,
    target,
    sections: [...bySection.entries()].map(([section, s]) => {
      // IBPS and SBI clear section by section, so each section gets its own target.
      const sectionTarget =
        target === null ? null : round2(s.questions * TARGET_PCT);
      return {
        section,
        ...s,
        target: sectionTarget,
        cleared: sectionTarget === null || s.net >= sectionTarget,
      };
    }),
    topics: topicResults,
    theory,
    timeline,
    questions,
  };
}

/** Keyed on topic alone, not `(section, topic)`: the classifier files some correctly-named topics under the wrong section, and topic names are globally unique in the notes corpus. */
async function topicTheoryLookup(
  topics: string[],
): Promise<Map<string, TopicTheory & { primaryNoteId: string }>> {
  if (topics.length === 0) return new Map();

  const rows = await db
    .select({
      section: notes.section,
      topic: notes.topic,
      topicTitle: notes.topicTitle,
      subtopic: notes.subtopic,
      subtopicOrder: notes.subtopicOrder,
      title: notes.title,
      noteId: notes.noteId,
      summary: notes.summary,
      tricks: notes.tricks,
      commonMistakes: notes.commonMistakes,
    })
    .from(notes)
    .where(and(inArray(notes.topic, topics), eq(notes.isActive, true)))
    .orderBy(notes.subtopicOrder);

  const byTopic = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byTopic.get(r.topic) ?? [];
    list.push(r);
    byTopic.set(r.topic, list);
  }

  const out = new Map<string, TopicTheory & { primaryNoteId: string }>();
  for (const [topic, list] of byTopic) {
    const primary = list.find((r) => r.subtopic === null) ?? list[0]!;
    out.set(topic, {
      topic,
      topicTitle: primary.topicTitle,
      section: primary.section,
      summary: primary.summary,
      tricks: primary.tricks
        .slice(0, TRICKS_SHOWN)
        .map((t) => ({ name: t.name, description: t.description })),
      commonMistakes: primary.commonMistakes.slice(0, MISTAKES_SHOWN),
      subtopics: list.map((r) => ({
        noteId: r.noteId,
        title: r.title,
      })),
      primaryNoteId: primary.noteId,
    });
  }
  return out;
}
