/**
 * Import classified question-bank JSON into Postgres.
 *
 *     bun run scripts/import-question-bank.ts            # counts only
 *     bun run scripts/import-question-bank.ts --apply     # actually write
 *
 * Source: $QUESTION_BANK_DATA_DIR (default ../question-bank/data), a sibling
 * checkout of OnelyStop/question-bank after `pipeline/2-classify/
 * run_classify.py` has run — see that repo's PR for the batch/paper counts
 * this should match.
 *
 * Idempotent via onConflictDoUpdate, not onConflictDoNothing like
 * seed-billing-plans.ts: re-running after a fresh classify (and later, once
 * step 4 fills in answers) must overwrite existing rows, not skip them.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

import { sql } from "drizzle-orm";

import { db } from "../src/db";
import { directions, papers, questions } from "../src/db/schema";
import {
  contentHash,
  directionsOf,
  examKey,
  isActive,
  type RawPaper,
} from "../src/features/question-bank/import-rules";

const DATA_DIR = process.env.QUESTION_BANK_DATA_DIR ?? "../question-bank/data";

// Reports and metadata living next to the papers, not papers themselves --
// mirrors pipeline/lib/corpus.py's SKIP_JSON, plus load_paper's own
// paper_id+questions presence check as the real gate below.
const SKIP_FILES = new Set([
  "index.json",
  "gap_report.json",
  "review_queue.json",
  "classify_report.json",
]);

function findPaperFiles(dataDir: string): string[] {
  const out: string[] = [];
  for (const batch of readdirSync(dataDir, { withFileTypes: true })) {
    if (!batch.isDirectory() || !batch.name.startsWith("batch")) continue;
    const batchDir = join(dataDir, batch.name);
    for (const f of readdirSync(batchDir)) {
      if (!f.endsWith(".json") || f.endsWith(".meta.json") || SKIP_FILES.has(f)) continue;
      out.push(join(batchDir, f));
    }
  }
  return out.sort();
}

function loadPaper(path: string): RawPaper | null {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
  if (
    typeof data !== "object" ||
    data === null ||
    !("paper_id" in data) ||
    !("questions" in data)
  ) {
    return null;
  }
  return data as RawPaper;
}

/**
 * Within an exam_key, the paper with the most active questions is canonical.
 * Ties break on the lowest paper_id, so the result is deterministic across
 * reruns rather than depending on file read order.
 */
function computeCanonical(loaded: { paper: RawPaper; activeCount: number }[]): Set<string> {
  const byExamKey = new Map<string, { paper: RawPaper; activeCount: number }[]>();
  for (const row of loaded) {
    const key = examKey(row.paper);
    const bucket = byExamKey.get(key) ?? [];
    bucket.push(row);
    byExamKey.set(key, bucket);
  }
  const canonical = new Set<string>();
  for (const bucket of byExamKey.values()) {
    const winner = [...bucket].sort((a, b) => {
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      return a.paper.paper_id < b.paper.paper_id ? -1 : 1;
    })[0];
    canonical.add(winner.paper.paper_id);
  }
  return canonical;
}

// postgres.js's bound-parameter cap (65,535) divided generously across
// `questions`' 15 columns.
const CHUNK = 500;
function chunk<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const files = findPaperFiles(DATA_DIR);
  if (files.length === 0) {
    throw new Error(`No batch*/*.json files under ${DATA_DIR} — check QUESTION_BANK_DATA_DIR`);
  }

  const loaded: { paper: RawPaper; activeCount: number }[] = [];
  let skippedFiles = 0;
  for (const path of files) {
    const paper = loadPaper(path);
    if (!paper) {
      skippedFiles++;
      continue;
    }
    const activeCount = paper.questions.filter(isActive).length;
    loaded.push({ paper, activeCount });
  }

  const canonicalIds = computeCanonical(loaded);

  let totalQuestions = 0;
  let totalActive = 0;
  let totalDirections = 0;
  let totalSectioned = 0;
  let totalTopiced = 0;
  const directionPairs = new Set<string>();

  for (const { paper } of loaded) {
    totalQuestions += paper.questions.length;
    for (const q of paper.questions) {
      if (isActive(q)) totalActive++;
      if (q.section) totalSectioned++;
      if (q.topic) totalTopiced++;
    }
    for (const d of directionsOf(paper)) {
      totalDirections++;
      directionPairs.add(`${d.paperId}::${d.directionId}`);
    }
  }

  console.log(`  papers found        ${loaded.length}  (${skippedFiles} non-paper files skipped)`);
  console.log(`  questions           ${totalQuestions}`);
  console.log(`  active questions    ${totalActive}`);
  console.log(`  section filled      ${totalSectioned} (${((totalSectioned / totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`  topic filled        ${totalTopiced} (${((totalTopiced / totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`  direction pairs     ${directionPairs.size}`);
  console.log(`  canonical papers    ${canonicalIds.size} of ${loaded.length}`);

  if (!apply) {
    console.log("\n  dry run — pass --apply to write these for real");
    return;
  }

  let papersWritten = 0;
  let directionsWritten = 0;
  let questionsWritten = 0;

  for (const { paper } of loaded) {
    await db.transaction(async (tx) => {
      await tx
        .insert(papers)
        .values({
          paperId: paper.paper_id,
          bank: paper.bank ?? null,
          role: paper.role ?? null,
          examType: paper.exam_type ?? null,
          year: paper.year ?? null,
          shift: paper.shift ?? null,
          memoryBased: paper.memory_based ?? false,
          examKey: examKey(paper),
          isCanonical: canonicalIds.has(paper.paper_id),
          sourcePdf: paper.source_pdf ?? null,
        })
        .onConflictDoUpdate({
          target: papers.paperId,
          set: {
            bank: paper.bank ?? null,
            role: paper.role ?? null,
            examType: paper.exam_type ?? null,
            year: paper.year ?? null,
            shift: paper.shift ?? null,
            memoryBased: paper.memory_based ?? false,
            examKey: examKey(paper),
            isCanonical: canonicalIds.has(paper.paper_id),
            sourcePdf: paper.source_pdf ?? null,
          },
        });
      papersWritten++;

      const dirRows = directionsOf(paper);
      if (dirRows.length > 0) {
        await tx
          .insert(directions)
          .values(dirRows.map((d) => ({ paperId: d.paperId, directionId: d.directionId, body: d.body })))
          .onConflictDoUpdate({
            target: [directions.paperId, directions.directionId],
            set: { body: sql`excluded.body` },
          });
        directionsWritten += dirRows.length;
      }
      const resolvedDirectionIds = new Set(dirRows.map((d) => d.directionId));

      const qRows = paper.questions.map((q) => {
        // A question can carry a direction_id with no direction_text anywhere
        // in the paper (a real, rare extraction gap — confirmed: 1 of 15,399
        // questions in the current bank). questions' FK into directions is on
        // the (paper_id, direction_id) pair, so importing that id unresolved
        // would violate it. Treat the question as standalone instead of
        // failing the whole paper's import over one missing passage.
        let directionId = q.direction_id ?? null;
        if (directionId && !resolvedDirectionIds.has(directionId)) {
          console.warn(
            `[import-question-bank] ${q.q_id}: direction_id "${directionId}" has no ` +
              `direction_text anywhere in this paper — importing as standalone.`,
          );
          directionId = null;
        }
        return {
          qId: q.q_id,
          paperId: q.paper_id,
          qNum: q.q_num,
          stem: q.stem ?? "",
          options: q.options ?? {},
          answer: q.answer ?? null,
          explanation: q.explanation ?? null,
          section: q.section ?? null,
          topic: q.topic ?? null,
          difficulty: q.difficulty ?? null,
          directionId,
          contentHash: contentHash(q),
          isActive: isActive(q),
        };
      });

      for (const batch of chunk(qRows, CHUNK)) {
        await tx
          .insert(questions)
          .values(batch)
          .onConflictDoUpdate({
            target: questions.qId,
            set: {
              stem: sql`excluded.stem`,
              options: sql`excluded.options`,
              answer: sql`excluded.answer`,
              explanation: sql`excluded.explanation`,
              section: sql`excluded.section`,
              topic: sql`excluded.topic`,
              difficulty: sql`excluded.difficulty`,
              contentHash: sql`excluded.content_hash`,
              isActive: sql`excluded.is_active`,
            },
          });
        questionsWritten += batch.length;
      }
    });
  }

  console.log(
    `\n  wrote  ${papersWritten} papers, ${directionsWritten} directions, ${questionsWritten} questions`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
