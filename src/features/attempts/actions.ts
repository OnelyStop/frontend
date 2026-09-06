"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  attemptAnswers,
  attempts,
  bankQuestions,
  userTopicStats,
} from "@/db/schema";
import { currentUserId } from "@/lib/auth.server";
import { listPaperQuestions } from "@/features/question-bank/questions.server";
import type { DrillQuestion } from "@/features/question-bank/types";
import { type GradedAnswer, isCorrect, scoreTotals } from "./scoring";
import type { AttemptMode, SubmittedAnswer } from "./types";

const GENERIC_ERROR = { error: "Something went wrong. Try again." } as const;

/** Opens an attempt so answers have somewhere to attach as the user goes,
 * rather than only existing once everything is typed and a submit succeeds —
 * a mid-paper crash still leaves a startedAt on record. */
export async function startAttempt(
  mode: AttemptMode,
  paperId: string | null,
): Promise<{ attemptId: number } | { error: string }> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to start an attempt." };

    const [row] = await db
      .insert(attempts)
      .values({ userId, mode, paperId })
      .returning({ id: attempts.id });
    return { attemptId: row!.id };
  } catch {
    return GENERIC_ERROR;
  }
}

/**
 * Starts a paper attempt and hands back its questions in one round trip —
 * `/mocks` doesn't fetch every paper's questions up front (most sittings
 * never happen), so the click that starts one is also the moment it needs
 * them. Combines what would otherwise be a read call plus `startAttempt`.
 */
export async function startMockAttempt(
  paperId: string,
): Promise<
  { attemptId: number; questions: DrillQuestion[] } | { error: string }
> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to start a mock." };

    const questions = await listPaperQuestions(paperId);
    if (questions.length === 0)
      return { error: "This paper has no answerable questions." };

    const [row] = await db
      .insert(attempts)
      .values({ userId, mode: "paper", paperId })
      .returning({ id: attempts.id });
    return { attemptId: row!.id, questions };
  } catch {
    return GENERIC_ERROR;
  }
}

/**
 * Grades a finished attempt and persists it — the only place this happens.
 * The client posts what was chosen and how long it took; `isCorrect` and the
 * score are computed here from `bank_questions.answer`, never accepted from
 * the caller, so a tampered client request can misreport a pick but cannot
 * grade its own paper.
 *
 * Two things a tampered request could still try, both closed here: posting
 * the same `qId` twice (deduped before grading — otherwise it both
 * double-counts the mark and trips `attempt_answers`' unique constraint,
 * which throws mid-insert and leaves the attempt permanently unsubmittable,
 * since every retry resends the same duplicate), and posting a `qId` from a
 * paper other than the one this attempt was started against (filtered out
 * by requiring `bank_questions.paper_id` to match `attempts.paper_id` when
 * the attempt has one — a `bank`/`mix` drill has no fixed paper to check
 * against, which is an accepted, lower-stakes gap: a drill has no cutoff to
 * fake, only the user's own practice stats to mislead).
 */
export async function submitAttempt(
  attemptId: number,
  submitted: SubmittedAnswer[],
): Promise<{ ok: true; attemptId: number } | { error: string }> {
  try {
    const userId = await currentUserId();
    if (!userId) return { error: "Sign in to submit an attempt." };
    if (submitted.length === 0) return { error: "No questions to submit." };

    const answers = [...new Map(submitted.map((a) => [a.qId, a])).values()];

    const [attempt] = await db
      .select({
        id: attempts.id,
        paperId: attempts.paperId,
        submittedAt: attempts.submittedAt,
      })
      .from(attempts)
      .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
      .limit(1);
    if (!attempt) return { error: "Attempt not found." };
    if (attempt.submittedAt) return { error: "Attempt already submitted." };

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

    // A question with no answer key shouldn't have been served, and (per the
    // paper filter above) neither should one from a different paper — skip
    // rather than fail the whole submission if one slipped through, the same
    // as if it were never answered.
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

    await db.transaction(async (tx) => {
      await tx.insert(attemptAnswers).values(
        graded.map((g) => ({
          attemptId,
          qId: g.qId,
          chosen: g.chosen,
          isCorrect: g.chosen === null ? null : isCorrect(g.chosen, g.correct),
          timeMs: g.timeMs,
        })),
      );

      await tx
        .update(attempts)
        .set({ score: totals.score.toString(), submittedAt: new Date() })
        .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)));

      await upsertTopicStats(tx, userId, graded);
    });

    revalidatePath("/mocks");
    revalidatePath("/drills");
    revalidatePath(`/results/${attemptId}`);
    return { ok: true, attemptId };
  } catch {
    return GENERIC_ERROR;
  }
}

/** One row per (user, topic), `attempted`/`correct` incremented rather than
 * overwritten — schema.ts's own comment on `userTopicStats` names this exact
 * statement shape. Blanks don't touch `topic_stats` at all: a topic you chose
 * not to risk isn't a data point about your accuracy on it. Takes the same
 * transaction handle `submitAttempt` uses, so a failure partway through
 * rolls back the whole submission instead of leaving some topics updated and
 * others not. */
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

  for (const [topic, { attempted, correct }] of byTopic) {
    await tx
      .insert(userTopicStats)
      .values({ userId, topic, attempted, correct, lastSeenAt: new Date() })
      .onConflictDoUpdate({
        target: [userTopicStats.userId, userTopicStats.topic],
        set: {
          attempted: sql`${userTopicStats.attempted} + ${attempted}`,
          correct: sql`${userTopicStats.correct} + ${correct}`,
          lastSeenAt: new Date(),
        },
      });
  }
}
