/**
 * Import the hand-authored notes knowledge base into Postgres.
 *
 *     bun run scripts/import-notes.ts            # counts only
 *     bun run scripts/import-notes.ts --apply     # actually write
 *
 * Source: $NOTES_DATA_DIR (default ../bank_exam/notes), a sibling checkout of the bank_exam
 * repo. v2 layout: one file per TOPIC at {Section}/{Topic}.json, with a nested `subtopics[]`
 * array — this script flattens each subtopic into its own DB row (one row per subtopic, same
 * granularity the /notes list and /notes/[noteId] detail page render), already validated by
 * bank_exam's own validate_notes.py (taxonomy consistency, no tier-3 sources, no duplicate
 * subtopics). This script trusts that gate and does not re-check it.
 *
 * Idempotent via onConflictDoUpdate, same reasoning as import-question-bank.ts: re-running
 * after an edited note must overwrite the existing row, not skip it.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

import { notInArray, sql } from "drizzle-orm";

import { db } from "../src/db";
import { notes } from "../src/db/schema";

const DATA_DIR = process.env.NOTES_DATA_DIR ?? "../bank_exam/notes";
const TAXONOMY_PATH =
  process.env.TOPIC_TAXONOMY_PATH ?? join(DATA_DIR, "..", "topic_taxonomy.json");

// Generated files that live alongside the topic files, not topics themselves.
const SKIP_FILES = new Set(["notes_report.json"]);

type RawSource = { name: string; url: string; tier: number; contribution: string; accessed: string };
type RawTrick = { name: string; description: string; when_to_use: string; example: string | null };
type RawWorkedExample = { problem: string; solution_steps: string[]; answer: string };
type RawExamRelevance = { exams: string[]; stage: string[] };

type RawSubtopic = {
  subtopic_key: string;
  subtopic: string | null;
  aliases?: string[];
  confirmations?: number | null;
  summary: string;
  concept: string;
  formulas?: { name: string; expression: string; notes: string | null }[];
  tricks?: RawTrick[];
  common_mistakes?: string[];
  worked_examples?: RawWorkedExample[];
  related_question_ids?: string[];
  difficulty?: string | null;
  exam_relevance?: RawExamRelevance;
  sources?: RawSource[];
};

type RawTopicNote = {
  note_id: string;
  section: string;
  topic: string;
  title: string;
  overview: string;
  exam_relevance: RawExamRelevance;
  subtopics: RawSubtopic[];
  sources: RawSource[];
  status: string;
};

function findTopicFiles(dataDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (entry.endsWith(".json") && !SKIP_FILES.has(entry)) {
        out.push(path);
      }
    }
  };
  walk(dataDir);
  return out.sort();
}

const REQUIRED_FIELDS: (keyof RawTopicNote)[] = [
  "note_id",
  "section",
  "topic",
  "title",
  "overview",
  "exam_relevance",
  "subtopics",
  "sources",
  "status",
];

function loadTopicNote(path: string): RawTopicNote | null {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) return null;
  }
  return data as RawTopicNote;
}

/** De-dupe by source name, subtopic-specific citations first (they're more precise). */
function mergeSources(subtopicSources: RawSource[], topicSources: RawSource[]): RawSource[] {
  const seen = new Set<string>();
  const merged: RawSource[] = [];
  for (const s of [...subtopicSources, ...topicSources]) {
    if (seen.has(s.name)) continue;
    seen.add(s.name);
    merged.push(s);
  }
  return merged;
}

type TopicTaxonomy = { sections: Record<string, string[]> };

async function main() {
  const apply = process.argv.includes("--apply");

  const taxonomy: TopicTaxonomy = JSON.parse(readFileSync(TAXONOMY_PATH, "utf-8"));

  const files = findTopicFiles(DATA_DIR);
  if (files.length === 0) {
    throw new Error(`No topic *.json files under ${DATA_DIR} — check NOTES_DATA_DIR`);
  }

  const loaded: RawTopicNote[] = [];
  let skippedFiles = 0;
  for (const path of files) {
    const topicNote = loadTopicNote(path);
    if (!topicNote) {
      skippedFiles++;
      console.warn(`[import-notes] skipping ${path} — missing a required field`);
      continue;
    }
    loaded.push(topicNote);
  }

  const bySection = new Map<string, number>();
  let totalSubtopics = 0;
  for (const t of loaded) {
    bySection.set(t.section, (bySection.get(t.section) ?? 0) + t.subtopics.length);
    totalSubtopics += t.subtopics.length;
  }

  console.log(`  topics found        ${loaded.length}  (${skippedFiles} file(s) skipped)`);
  console.log(`  subtopics (rows)    ${totalSubtopics}`);
  for (const [section, count] of [...bySection.entries()].sort()) {
    console.log(`    ${section.padEnd(14)} ${count}`);
  }

  if (!apply) {
    console.log("\n  dry run — pass --apply to write these for real");
    return;
  }

  const rows = loaded.flatMap((t) => {
    const topicOrder = taxonomy.sections[t.section]?.indexOf(t.topic) ?? -1;
    if (topicOrder === -1) {
      throw new Error(
        `${t.section}/${t.topic} not found in topic_taxonomy.json's "${t.section}" list — taxonomy drift, fix before importing`,
      );
    }
    return t.subtopics.map((sub, subtopicOrder) => ({
      noteId: `${t.section}::${t.topic}::${sub.subtopic_key}`,
      section: t.section,
      topic: t.topic,
      subtopic: sub.subtopic ?? null,
      topicTitle: t.title,
      topicOrder,
      subtopicOrder,
      title: sub.subtopic ?? t.title,
      summary: sub.summary,
      difficulty: sub.difficulty ?? null,
      tags: [] as string[],
      aliases: sub.aliases ?? [],
      examRelevance: sub.exam_relevance ?? t.exam_relevance,
      concept: sub.concept,
      formulas: sub.formulas ?? [],
      tricks: (sub.tricks ?? []).map((tr) => ({
        name: tr.name,
        description: tr.description,
        whenToUse: tr.when_to_use,
        example: tr.example ?? null,
      })),
      commonMistakes: sub.common_mistakes ?? [],
      workedExamples: (sub.worked_examples ?? []).map((w) => ({
        problem: w.problem,
        steps: w.solution_steps,
        answer: w.answer,
      })),
      relatedQuestionIds: sub.related_question_ids ?? [],
      sources: mergeSources(sub.sources ?? [], t.sources),
      confirmations: sub.confirmations ?? null,
      status: t.status,
    }));
  });

  // Chunked (not one big insert): v2 subtopics carry far more content (multi-paragraph
  // concept, several worked examples) than v1's, and one oversized insert previously wedged
  // the local pglite-socket dev database outright — small batches show steady progress and
  // stay well clear of whatever limit that was.
  const CHUNK = 5;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    await db
      .insert(notes)
      .values(batch)
      .onConflictDoUpdate({
        target: notes.noteId,
        set: {
          section: sql`excluded.section`,
          topic: sql`excluded.topic`,
          subtopic: sql`excluded.subtopic`,
          topicTitle: sql`excluded.topic_title`,
          topicOrder: sql`excluded.topic_order`,
          subtopicOrder: sql`excluded.subtopic_order`,
          aliases: sql`excluded.aliases`,
          examRelevance: sql`excluded.exam_relevance`,
          title: sql`excluded.title`,
          summary: sql`excluded.summary`,
          concept: sql`excluded.concept`,
          formulas: sql`excluded.formulas`,
          tricks: sql`excluded.tricks`,
          commonMistakes: sql`excluded.common_mistakes`,
          workedExamples: sql`excluded.worked_examples`,
          relatedQuestionIds: sql`excluded.related_question_ids`,
          difficulty: sql`excluded.difficulty`,
          sources: sql`excluded.sources`,
          confirmations: sql`excluded.confirmations`,
          tags: sql`excluded.tags`,
          status: sql`excluded.status`,
        },
      });
    written += batch.length;
    console.log(`  wrote ${written}/${rows.length}`);
  }

  console.log(`\n  wrote  ${written} notes`);

  // Full one-way sync: a subtopic renamed/consolidated/removed in source (e.g. a topic that
  // used to have named subtopics later merged into a single "_topic" note) leaves its old row
  // behind forever otherwise — onConflictDoUpdate only touches noteIds still present in `rows`.
  const currentIds = rows.map((r) => r.noteId);
  const removed = await db
    .delete(notes)
    .where(notInArray(notes.noteId, currentIds))
    .returning({ noteId: notes.noteId });
  if (removed.length > 0) {
    console.log(`\n  removed ${removed.length} orphaned row(s) no longer in source:`);
    for (const r of removed) console.log(`    ${r.noteId}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
