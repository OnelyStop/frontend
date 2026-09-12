"use server";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  attemptAnswers,
  attempts,
  bankQuestions,
  papers,
  userTopicStats,
} from "@/db/schema";
import { currentUserId } from "@/lib/auth.server";
import { checkQuota } from "@/features/billing/usage.server";
import { SECTIONS, SECTION_DB, type Subject } from "@/data/navigation";
import {
  listDrillPool,
  listPaperQuestions,
} from "@/features/question-bank/questions.server";
import type { DrillQuestion } from "@/features/question-bank/types";
import { type GradedAnswer, isCorrect, scoreTotals } from "./scoring";
import type { AttemptMode, ResumeState, SubmittedAnswer } from "./types";

/** First SECTIONS entry with a served question — the section a fresh mock attempt opens on. */
function firstSectionOf(questions: { section: string }[]): Subject | null {
  return (
    SECTIONS.find((subject) =>
      questions.some((q) => q.section === SECTION_DB[subject]),
    ) ?? null
  );
}

/** A blunt ceiling, not a per-section duration: cheap to compute and still rules out a client claiming hours of section time it was never served. */
async function maxSectionMs(paperId: string | null): Promise<number> {
  if (!paperId) return Number.MAX_SAFE_INTEGER;
  const [paper] = await db
    .select({ durationMin: papers.durationMin, examType: papers.examType })
    .from(papers)
    .where(eq(papers.paperId, paperId))
    .limit(1);
  const mins = paper?.durationMin ?? (paper?.examType === "Mains" ? 180 : 60);
  return mins * 60 * 1000;
}

const GENERIC_ERROR = { error: "Something went wrong. Try again." } as const;
const ALREADY_SUBMITTED = "Attempt already submitted.";

/** The server picks the questions and records them on the row; `submitAttempt` never grades outside that set. */
export async function startAttempt(
  mode: AttemptMode,
  paperId: string | null,
): Promise<
  { attemptId: number; questions: DrillQuestion[] } | { error: string }
> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to start an attempt." };

    // `mode` is client-supplied, so it picks the cap — a paper is not a drill.
    const isMock = mode === "paper";
    const quota = await checkQuota(
      db,
      userId,
      isMock ? "mocksPerMonth" : "drillsPerDay",
    );
    if (!quota.ok)
      return {
        error: isMock
          ? `That is ${quota.used} of ${quota.limit} mocks this month. Upgrade for unlimited sittings.`
          : `That is ${quota.used} of ${quota.limit} drills today. Upgrade for unlimited practice.`,
      };

    if (isMock && !paperId) return { error: "Pick a paper to sit." };
    const questions = paperId
      ? await listPaperQuestions(paperId)
      : await listDrillPool();
    if (questions.length === 0)
      return { error: "There are no answerable questions to sit right now." };

    const [row] = await db
      .insert(attempts)
      .values({
        userId,
        mode,
        paperId,
        servedQIds: questions.map((q) => q.qId),
      })
      .returning({ id: attempts.id });
    return { attemptId: row!.id, questions };
  } catch {
    return GENERIC_ERROR;
  }
}

export async function startMockAttempt(paperId: string): Promise<
  | {
      attemptId: number;
      questions: DrillQuestion[];
      resume: ResumeState | null;
    }
  | { error: string }
> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to start a mock." };

    // An unsubmitted attempt on this paper picks up where it left off — for free, since it already paid its quota.
    const [open] = await db
      .select({
        id: attempts.id,
        currentSection: attempts.currentSection,
        lockedSections: attempts.lockedSections,
        sectionRemainingMs: attempts.sectionRemainingMs,
      })
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, userId),
          eq(attempts.paperId, paperId),
          eq(attempts.mode, "paper"),
          isNull(attempts.submittedAt),
        ),
      )
      .orderBy(desc(attempts.startedAt))
      .limit(1);

    const questions = await listPaperQuestions(paperId);
    if (questions.length === 0)
      return { error: "This paper has no answerable questions." };

    if (open) {
      const saved = await db
        .select({
          qId: attemptAnswers.qId,
          chosen: attemptAnswers.chosen,
          timeMs: attemptAnswers.timeMs,
        })
        .from(attemptAnswers)
        .where(eq(attemptAnswers.attemptId, open.id));

      return {
        attemptId: open.id,
        questions,
        resume: {
          answers: Object.fromEntries(
            saved.map((a) => [
              a.qId,
              { chosen: a.chosen, timeMs: a.timeMs ?? 0 },
            ]),
          ),
          currentSection: open.currentSection,
          lockedSections: open.lockedSections,
          sectionRemainingMs: open.sectionRemainingMs,
        },
      };
    }

    const quota = await checkQuota(db, userId, "mocksPerMonth");
    if (!quota.ok)
      return {
        error: `That is ${quota.used} of ${quota.limit} mocks this month. Upgrade for unlimited sittings.`,
      };

    const [row] = await db
      .insert(attempts)
      .values({
        userId,
        mode: "paper",
        paperId,
        servedQIds: questions.map((q) => q.qId),
        currentSection: firstSectionOf(questions),
      })
      .returning({ id: attempts.id });
    return { attemptId: row!.id, questions, resume: null };
  } catch {
    return GENERIC_ERROR;
  }
}

/** The explicit "start over" — wipes a paused attempt's answers and section state rather than resuming them. */
export async function restartMockAttempt(
  paperId: string,
): Promise<
  | { attemptId: number; questions: DrillQuestion[]; resume: null }
  | { error: string }
> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to start a mock." };

    const questions = await listPaperQuestions(paperId);
    if (questions.length === 0)
      return { error: "This paper has no answerable questions." };

    const [open] = await db
      .select({ id: attempts.id })
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, userId),
          eq(attempts.paperId, paperId),
          eq(attempts.mode, "paper"),
          isNull(attempts.submittedAt),
        ),
      )
      .orderBy(desc(attempts.startedAt))
      .limit(1);

    // Resets the same row instead of inserting a new one — it already paid its quota, and a second open row would confuse "is this paper in progress" everywhere else.
    if (open) {
      await db.transaction(async (tx) => {
        await tx
          .delete(attemptAnswers)
          .where(eq(attemptAnswers.attemptId, open.id));
        await tx
          .update(attempts)
          .set({
            servedQIds: questions.map((q) => q.qId),
            currentSection: firstSectionOf(questions),
            lockedSections: [],
            sectionRemainingMs: null,
          })
          .where(eq(attempts.id, open.id));
      });
      return { attemptId: open.id, questions, resume: null };
    }

    const quota = await checkQuota(db, userId, "mocksPerMonth");
    if (!quota.ok)
      return {
        error: `That is ${quota.used} of ${quota.limit} mocks this month. Upgrade for unlimited sittings.`,
      };

    const [row] = await db
      .insert(attempts)
      .values({
        userId,
        mode: "paper",
        paperId,
        servedQIds: questions.map((q) => q.qId),
        currentSection: firstSectionOf(questions),
      })
      .returning({ id: attempts.id });
    return { attemptId: row!.id, questions, resume: null };
  } catch {
    return GENERIC_ERROR;
  }
}

/** Upserted, not inserted: an answer changed after autosave still overwrites cleanly on the next save. */
export async function saveAnswer(
  attemptId: number,
  qId: string,
  chosen: string | null,
  timeMs: number | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to save progress." };

    const [attempt] = await db
      .select({ id: attempts.id, servedQIds: attempts.servedQIds })
      .from(attempts)
      .where(
        and(
          eq(attempts.id, attemptId),
          eq(attempts.userId, userId),
          isNull(attempts.submittedAt),
        ),
      )
      .limit(1);
    if (!attempt) return { error: "Attempt not found." };
    if (!attempt.servedQIds.includes(qId))
      return { error: "Question not served for this attempt." };

    await db
      .insert(attemptAnswers)
      .values({ attemptId, qId, chosen, timeMs })
      .onConflictDoUpdate({
        target: [attemptAnswers.attemptId, attemptAnswers.qId],
        set: { chosen: sql`excluded.chosen`, timeMs: sql`excluded.time_ms` },
      });
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

/** Called on leaving mid-section (Esc, tab close) — the clock pauses here rather than running out in the background. */
export async function checkpointSectionTime(
  attemptId: number,
  remainingMs: number,
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to save progress." };

    const [attempt] = await db
      .select({ id: attempts.id, paperId: attempts.paperId })
      .from(attempts)
      .where(
        and(
          eq(attempts.id, attemptId),
          eq(attempts.userId, userId),
          isNull(attempts.submittedAt),
        ),
      )
      .limit(1);
    if (!attempt) return { error: "Attempt not found." };

    const cap = await maxSectionMs(attempt.paperId);
    const clamped = Math.max(0, Math.min(Math.round(remainingMs), cap));

    await db
      .update(attempts)
      .set({ sectionRemainingMs: clamped })
      .where(eq(attempts.id, attemptId));
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

/** Called when a section is submitted, by the user or its own clock — sections lock forward-only, same as the hall. */
export async function advanceSection(
  attemptId: number,
  finishedSection: string,
  nextSection: string | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to save progress." };
    if (!SECTIONS.includes(finishedSection as Subject))
      return { error: "Unknown section." };
    if (nextSection !== null && !SECTIONS.includes(nextSection as Subject))
      return { error: "Unknown section." };

    const [row] = await db
      .update(attempts)
      .set({
        lockedSections: sql`array_append(${attempts.lockedSections}, ${finishedSection})`,
        currentSection: nextSection,
        sectionRemainingMs: null,
      })
      .where(
        and(
          eq(attempts.id, attemptId),
          eq(attempts.userId, userId),
          isNull(attempts.submittedAt),
        ),
      )
      .returning({ id: attempts.id });
    if (!row) return { error: "Attempt not found." };
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}

/** Grades from `bank_questions.answer`, never from the caller: a tampered request can misreport a pick but cannot grade its own paper. */
export async function submitAttempt(
  attemptId: number,
  submitted: SubmittedAnswer[],
): Promise<{ ok: true; attemptId: number } | { error: string }> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to submit an attempt." };
    if (submitted.length === 0) return { error: "No questions to submit." };

    const [attempt] = await db
      .select({
        id: attempts.id,
        paperId: attempts.paperId,
        submittedAt: attempts.submittedAt,
        servedQIds: attempts.servedQIds,
      })
      .from(attempts)
      .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
      .limit(1);
    if (!attempt) return { error: "Attempt not found." };
    if (attempt.submittedAt) return { error: ALREADY_SUBMITTED };

    if (submitted.length > attempt.servedQIds.length)
      return { error: "That is more answers than this attempt was served." };

    // Grading only inside the served set: a drill has no paper to filter on, so an unfiltered qId list would read the whole answer key back off /results.
    const served = new Set(attempt.servedQIds);
    const answers = [
      ...new Map(submitted.map((a) => [a.qId, a])).values(),
    ].filter((a) => served.has(a.qId));
    if (answers.length === 0)
      return { error: "None of these questions were served for this attempt." };

    const qIds = answers.map((a) => a.qId);
    const questions = await db
      .select({
        qId: bankQuestions.qId,
        section: bankQuestions.section,
        topic: bankQuestions.topic,
        answer: bankQuestions.answer,
        marks: bankQuestions.marks,
        negativeMarks: bankQuestions.negativeMarks,
      })
      .from(bankQuestions)
      .where(
        attempt.paperId
          ? and(
              inArray(bankQuestions.qId, qIds),
              eq(bankQuestions.paperId, attempt.paperId),
            )
          : inArray(bankQuestions.qId, qIds),
      );
    const byId = new Map(questions.map((q) => [q.qId, q]));

    // A question with no answer key or from a different paper shouldn't have been served — skip it, not fail the batch.
    const graded: GradedAnswer[] = [];
    for (const a of answers) {
      const q = byId.get(a.qId);
      if (!q || q.answer === null) continue;
      graded.push({
        qId: a.qId,
        section: q.section ?? "",
        topic: q.topic,
        chosen: a.chosen,
        correct: q.answer,
        marks: Number(q.marks),
        negativeMarks: Number(q.negativeMarks),
        timeMs: a.timeMs,
      });
    }
    if (graded.length === 0)
      return { error: "None of these questions can be graded yet." };

    const totals = scoreTotals(graded);

    // Claiming the row before inserting answers is what makes a double submit safe: the loser's UPDATE matches nothing instead of tripping `attempt_answers`' unique constraint mid-transaction.
    const claimed = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(attempts)
        .set({ score: totals.score.toString(), submittedAt: new Date() })
        .where(
          and(
            eq(attempts.id, attemptId),
            eq(attempts.userId, userId),
            isNull(attempts.submittedAt),
          ),
        )
        .returning({ id: attempts.id });
      if (!row) return false;

      // Upserted, not inserted: autosave during the attempt may already have written a row for this (attemptId, qId).
      await tx
        .insert(attemptAnswers)
        .values(
          graded.map((g) => ({
            attemptId,
            qId: g.qId,
            chosen: g.chosen,
            isCorrect:
              g.chosen === null ? null : isCorrect(g.chosen, g.correct),
            timeMs: g.timeMs,
          })),
        )
        .onConflictDoUpdate({
          target: [attemptAnswers.attemptId, attemptAnswers.qId],
          set: {
            chosen: sql`excluded.chosen`,
            isCorrect: sql`excluded.is_correct`,
            timeMs: sql`excluded.time_ms`,
          },
        });

      await upsertTopicStats(tx, userId, graded);
      return true;
    });
    if (!claimed) return { error: ALREADY_SUBMITTED };

    revalidatePath("/mocks");
    revalidatePath("/drills");
    revalidatePath(`/results/${attemptId}`);
    return { ok: true, attemptId };
  } catch {
    return GENERIC_ERROR;
  }
}

/** One statement for every topic, not one per topic: a full paper touches 20-30, and serial round trips hold the row lock `submitAttempt` just took for all of them. */
async function upsertTopicStats(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  graded: GradedAnswer[],
): Promise<void> {
  const byTopic = new Map<string, { attempted: number; correct: number }>();
  for (const g of graded) {
    if (!g.topic || g.chosen === null) continue;
    const cur = byTopic.get(g.topic) ?? { attempted: 0, correct: 0 };
    cur.attempted++;
    if (isCorrect(g.chosen, g.correct)) cur.correct++;
    byTopic.set(g.topic, cur);
  }
  if (byTopic.size === 0) return;

  const lastSeenAt = new Date();
  await tx
    .insert(userTopicStats)
    .values(
      [...byTopic].map(([topic, { attempted, correct }]) => ({
        userId,
        topic,
        attempted,
        correct,
        lastSeenAt,
      })),
    )
    .onConflictDoUpdate({
      target: [userTopicStats.userId, userTopicStats.topic],
      set: {
        attempted: sql`${userTopicStats.attempted} + excluded.attempted`,
        correct: sql`${userTopicStats.correct} + excluded.correct`,
        lastSeenAt: sql`excluded.last_seen_at`,
      },
    });
}
