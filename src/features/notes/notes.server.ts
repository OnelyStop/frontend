import "server-only";

import { and, asc, eq, ne } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { notes } from "@/db/schema";
import type { NoteDetail, NoteSummary } from "./types";

/**
 * Every non-draft note, grouped by section/topic — the exact shape
 * `NotesView` filters and renders. "draft" is hidden so a note mid-authoring
 * can be imported without showing up half-written; every note today is
 * "verified".
 */
export async function listNotes(): Promise<NoteSummary[]> {
  const rows = await db
    .select({
      noteId: notes.noteId,
      section: notes.section,
      topic: notes.topic,
      subtopic: notes.subtopic,
      topicTitle: notes.topicTitle,
      topicOrder: notes.topicOrder,
      subtopicOrder: notes.subtopicOrder,
      title: notes.title,
      summary: notes.summary,
      difficulty: notes.difficulty,
      tags: notes.tags,
    })
    .from(notes)
    .where(and(eq(notes.isActive, true), ne(notes.status, "draft")))
    .orderBy(
      asc(notes.section),
      asc(notes.topicOrder),
      asc(notes.subtopicOrder),
    );

  return rows;
}

/**
 * One note's full content. Wrapped in React's cache() because a detail page
 * calls this once for generateMetadata and once for the page body — cache()
 * dedupes both into a single query per request rather than two.
 */
export const getNote = cache(
  async (noteId: string): Promise<NoteDetail | null> => {
    const [row] = await db
      .select()
      .from(notes)
      .where(eq(notes.noteId, noteId))
      .limit(1);
    if (!row || !row.isActive || row.status === "draft") return null;

    return {
      noteId: row.noteId,
      section: row.section,
      topic: row.topic,
      subtopic: row.subtopic,
      topicTitle: row.topicTitle,
      topicOrder: row.topicOrder,
      subtopicOrder: row.subtopicOrder,
      title: row.title,
      summary: row.summary,
      difficulty: row.difficulty,
      tags: row.tags,
      aliases: row.aliases,
      examRelevance: row.examRelevance,
      concept: row.concept,
      formulas: row.formulas,
      tricks: row.tricks,
      commonMistakes: row.commonMistakes,
      workedExamples: row.workedExamples,
      relatedQuestionIds: row.relatedQuestionIds,
      sources: row.sources,
      confirmations: row.confirmations,
    };
  },
);
