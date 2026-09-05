import "server-only";

import { and, count, desc, eq, inArray } from "drizzle-orm";

import { CUTOFF_LADDER } from "@/data/navigation";
import { db } from "@/db";
import { bankQuestions, papers } from "@/db/schema";
import type { Mock } from "./types";

// A recall's own bank/role/year won't necessarily match its cutoff exactly,
// and no per-paper cutoff is anywhere in the source data (the spec doc lists
// it as "Need"). Rather than invent a number, this reuses the app's own
// definition of "at cutoff" from CUTOFF_LADDER (55% — data/navigation.ts) as
// a placeholder scaled to the paper's question count. Replace with a real
// per-paper cutoff once papers.total_marks/cutoff data exists.
const AT_CUTOFF_PCT =
  CUTOFF_LADDER.find((b) => b.band === "At cutoff")!.threshold / 100;

/**
 * Every canonical paper with enough active questions to sit as a mock, most
 * recent year first — the exact shape `MocksView` renders (`score` is always
 * null here; nothing writes an attempt yet).
 */
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

  return (
    rows
      // A handful of active questions is not a mock paper.
      .filter((r) => r.qs >= 20)
      .map((r) => {
        const stage = r.examType as Mock["stage"];
        const mins = r.durationMin ?? (stage === "Mains" ? 180 : 60);
        return {
          id: r.paperId,
          name: `${r.bank ?? "Unknown"} ${r.role ?? ""}`.trim(),
          year: r.year ?? 0,
          stage,
          qs: r.qs,
          mins,
          score: null,
          cutoff: Math.round(r.qs * AT_CUTOFF_PCT),
        };
      })
  );
}
