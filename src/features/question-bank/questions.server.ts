import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { SECTION_DB } from "@/data/navigation";
import { db } from "@/db";
import { directions, questions } from "@/db/schema";
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
          qId: questions.qId,
          section: questions.section,
          topic: questions.topic,
          stem: questions.stem,
          options: questions.options,
          direction: directions.body,
        })
        .from(questions)
        // Both columns, always — direction_id is only unique within a paper
        // (see schema.ts's comment on `directions`), so joining on
        // direction_id alone would attach the wrong passage to a question.
        .leftJoin(
          directions,
          and(eq(directions.paperId, questions.paperId), eq(directions.directionId, questions.directionId)),
        )
        .where(and(eq(questions.isActive, true), eq(questions.section, section)))
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
