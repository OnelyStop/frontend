import "server-only";

import { and, count, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { CUTOFF_LADDER, SECTION_DB } from "@/data/navigation";
import { db } from "@/db";
import { attempts, bankQuestions, papers } from "@/db/schema";
import { currentUserId } from "@/lib/auth.server";
import type { Mock } from "./types";

// The source data carries no published cutoff, so papers are scored against CUTOFF_LADDER's 55% band scaled to question count.
const TARGET_PCT =
  CUTOFF_LADDER.find((b) => b.band === "At cutoff")!.threshold / 100;

/** `qs` counts only questions carrying an `answer`, so it matches the exam `listPaperQuestions` actually serves. */
export async function listMockPapers(): Promise<Mock[]> {
  const rows = await db
    .select({
      paperId: papers.paperId,
      bank: papers.bank,
      role: papers.role,
      examType: papers.examType,
      year: papers.year,
      durationMin: papers.durationMin,
      qs: count(bankQuestions.qId),
    })
    .from(papers)
    .innerJoin(
      bankQuestions,
      and(
        eq(bankQuestions.paperId, papers.paperId),
        eq(bankQuestions.isActive, true),
        isNotNull(bankQuestions.answer),
        inArray(bankQuestions.section, Object.values(SECTION_DB)),
      ),
    )
    .where(
      and(
        eq(papers.isActive, true),
        eq(papers.isCanonical, true),
        inArray(papers.examType, ["Prelims", "Mains"]),
      ),
    )
    .groupBy(
      papers.paperId,
      papers.bank,
      papers.role,
      papers.examType,
      papers.year,
      papers.durationMin,
    )
    .orderBy(desc(papers.year), papers.bank, papers.role);

  const canonical = rows.filter((r) => r.qs >= 20);
  const paperIds = canonical.map((r) => r.paperId);
  const userId = await currentUserId();
  const [bestScores, openAttempts] = await Promise.all([
    bestScoreByPaper(userId, paperIds),
    openAttemptsByPaper(userId, paperIds),
  ]);

  return canonical.map((r) => {
    const stage = r.examType as Mock["stage"];
    const mins = r.durationMin ?? (stage === "Mains" ? 180 : 60);
    return {
      id: r.paperId,
      name: `${r.bank ?? "Unknown"} ${r.role ?? ""}`.trim(),
      year: r.year ?? 0,
      stage,
      qs: r.qs,
      mins,
      score: bestScores.get(r.paperId) ?? null,
      inProgress: openAttempts.has(r.paperId),
      // Resuming has to request full screen before, not after, its own server call — the client needs this up front.
      examMode: openAttempts.get(r.paperId) ?? false,
      target: Math.round(r.qs * TARGET_PCT),
    };
  });
}

/** A retaken mock reports the best sitting, not the most recent one; empty rather than an error when signed out. */
async function bestScoreByPaper(
  userId: string | null,
  paperIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (paperIds.length === 0 || !userId) return out;

  const rows = await db
    .select({ paperId: attempts.paperId, score: attempts.score })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        eq(attempts.mode, "paper"),
        inArray(attempts.paperId, paperIds),
        isNotNull(attempts.submittedAt),
      ),
    );

  for (const r of rows) {
    if (!r.paperId || r.score === null) continue;
    const score = Number(r.score);
    const best = out.get(r.paperId);
    if (best === undefined || score > best) out.set(r.paperId, score);
  }
  return out;
}

/** A paper with an unsubmitted attempt resumes on Start instead of sitting fresh — the map's value is that attempt's exam mode. */
async function openAttemptsByPaper(
  userId: string | null,
  paperIds: string[],
): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>();
  if (paperIds.length === 0 || !userId) return out;

  const rows = await db
    .select({ paperId: attempts.paperId, examMode: attempts.examMode })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        eq(attempts.mode, "paper"),
        inArray(attempts.paperId, paperIds),
        isNull(attempts.submittedAt),
      ),
    );

  for (const r of rows) if (r.paperId) out.set(r.paperId, r.examMode);
  return out;
}
