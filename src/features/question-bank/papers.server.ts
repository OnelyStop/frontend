import "server-only";

import { and, count, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { CUTOFF_LADDER, SECTION_DB } from "@/data/navigation";
import { db } from "@/db";
import { attempts, bankQuestions, papers } from "@/db/schema";
import { currentUserId } from "@/lib/auth.server";
import type { Mock } from "./types";

const TARGET_PCT =
  CUTOFF_LADDER.find((b) => b.band === "At cutoff")!.threshold / 100;

/** Below this a paper is a fragment, not a sitting. Exported so the admin count reports the same set this serves, rather than drifting from it. */
export const SERVABLE_MIN_QS = 20;

export const SERVABLE_STAGES = ["Prelims", "Mains"] as const;

/** `qs` counts only questions carrying an `answer`, so it matches the exam `listPaperQuestions` actually serves. */
export async function listMockPapers(): Promise<Mock[]> {
  const rows = await db
    .select({
      paperId: papers.paperId,
      bank: papers.bank,
      role: papers.role,
      examType: papers.examType,
      year: papers.year,
      shift: papers.shift,
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
    // Not filtered on isCanonical: that keeps one paper per examKey, which hid 110 of 196 papers because different shifts of one exam share a key. The duplicates it was meant to catch are removed in the bank itself now; the flag stays for diagnostics.
    .where(
      and(
        eq(papers.isActive, true),
        inArray(papers.examType, [...SERVABLE_STAGES]),
      ),
    )
    .groupBy(
      papers.paperId,
      papers.bank,
      papers.role,
      papers.examType,
      papers.year,
      papers.shift,
      papers.durationMin,
    )
    .orderBy(desc(papers.year), papers.bank, papers.role);

  const servable = rows.filter((r) => r.qs >= SERVABLE_MIN_QS);
  const paperIds = servable.map((r) => r.paperId);
  const userId = await currentUserId();
  const [bestScores, openAttempts] = await Promise.all([
    bestScoreByPaper(userId, paperIds),
    openAttemptsByPaper(userId, paperIds),
  ]);

  return servable.map((r) => {
    const stage = r.examType as Mock["stage"];
    const mins = r.durationMin ?? (stage === "Mains" ? 180 : 60);
    return {
      id: r.paperId,
      name: `${r.bank ?? "Unknown"} ${r.role ?? ""}`.trim(),
      year: r.year ?? 0,
      sitting: r.shift,
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
