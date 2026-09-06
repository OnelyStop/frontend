import "server-only";

import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { SECTION_DB } from "@/data/navigation";
import { db } from "@/db";
import { bankQuestions, directions } from "@/db/schema";
import type { DrillQuestion } from "./types";

const SECTIONS_DB = Object.values(SECTION_DB);

/**
 * A random pool of active questions per section, for the drills view to
 * filter and slice client-side. Five small per-section queries beat one
 * window-function query — at ~15k rows `order by random()` is milliseconds,
 * and the page caches the result (see drills/page.tsx's `revalidate`).
 */
export async function listDrillPool(perSection = 40): Promise<DrillQuestion[]> {
  const bySections = await Promise.all(
    SECTIONS_DB.map((section) =>
      db
        .select({
          qId: bankQuestions.qId,
          section: bankQuestions.section,
          topic: bankQuestions.topic,
          stem: bankQuestions.stem,
          options: bankQuestions.options,
          direction: directions.body,
        })
        .from(bankQuestions)
        // Both columns, always — direction_id is only unique within a paper
        // (see schema.ts's comment on `directions`), so joining on
        // direction_id alone would attach the wrong passage to a question.
        .leftJoin(
          directions,
          and(
            eq(directions.paperId, bankQuestions.paperId),
            eq(directions.directionId, bankQuestions.directionId),
          ),
        )
        .where(
          and(
            eq(bankQuestions.isActive, true),
            eq(bankQuestions.section, section),
            isNotNull(bankQuestions.answer),
          ),
        )
        .orderBy(sql`random()`)
        .limit(perSection),
    ),
  );

  return bySections.flat().map((r) => ({
    qId: r.qId,
    section: r.section ?? "",
    topic: r.topic,
    stem: r.stem,
    direction: r.direction,
    options: Object.entries(r.options as Record<string, string>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, text]) => ({ key, text })),
  }));
}

/**
 * A paper's answerable questions, in `q_num` order — the exact shape a live
 * mock exam serves. Unanswerable questions are excluded here (not filtered
 * client-side) so `MocksView`'s question count and `qs`/section splits from
 * `listMockPapers()` describe the same set the exam actually runs.
 */
export async function listPaperQuestions(
  paperId: string,
): Promise<DrillQuestion[]> {
  const rows = await db
    .select({
      qId: bankQuestions.qId,
      section: bankQuestions.section,
      topic: bankQuestions.topic,
      stem: bankQuestions.stem,
      options: bankQuestions.options,
      direction: directions.body,
    })
    .from(bankQuestions)
    .leftJoin(
      directions,
      and(
        eq(directions.paperId, bankQuestions.paperId),
        eq(directions.directionId, bankQuestions.directionId),
      ),
    )
    .where(
      and(
        eq(bankQuestions.paperId, paperId),
        eq(bankQuestions.isActive, true),
        isNotNull(bankQuestions.answer),
        // Matches listDrillPool's implicit behavior (it only ever queries
        // these 5 values) — a row with a null/unrecognized section would
        // otherwise be invisible in every mocks section group (groupBySection
        // filters on the same 5 values) while still being sent to
        // submitAttempt and graded as a blank, making a perfect score on
        // that paper structurally impossible with no visible reason why.
        inArray(bankQuestions.section, SECTIONS_DB),
      ),
    )
    .orderBy(asc(bankQuestions.qNum));

  return rows.map((r) => ({
    qId: r.qId,
    section: r.section ?? "",
    topic: r.topic,
    stem: r.stem,
    direction: r.direction,
    options: Object.entries(r.options as Record<string, string>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, text]) => ({ key, text })),
  }));
}
