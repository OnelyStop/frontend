import "server-only";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { generateRuns } from "@/db/schema";
import type { AdminStatus, BankStats, GenerateRun } from "./types";

const RUN_LIMIT = 10;

export async function getAdminStatus(): Promise<AdminStatus> {
  const rows = await db
    .select()
    .from(generateRuns)
    .orderBy(desc(generateRuns.startedAt))
    .limit(RUN_LIMIT);

  const runs: GenerateRun[] = rows.map((r) => ({
    runId: r.runId,
    day: r.day,
    planned: r.planned,
    published: r.published,
    errors: r.errors,
    status: r.status,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
  }));

  return { runs };
}

// Mirrors the filters in question-bank/papers.server.ts and questions.server.ts — if those change, this number stops being the truth.
export async function getBankStats(): Promise<BankStats> {
  const [row] = await db.execute<{
    papers_total: number;
    papers_servable: number;
    questions_total: number;
    questions_servable: number;
    exam_keys_collapsed: number;
  }>(sql`
    select
      (select count(*) from papers)::int as papers_total,
      (select count(*) from papers where is_active and is_canonical)::int as papers_servable,
      (select count(*) from bank_questions)::int as questions_total,
      (select count(*) from bank_questions q
         join papers p on p.paper_id = q.paper_id
        where q.is_active and q.answer is not null
          and p.is_active and p.is_canonical)::int as questions_servable,
      (select count(*) from (
         select exam_key from papers group by exam_key having count(*) > 1
       ) x)::int as exam_keys_collapsed
  `);

  return {
    papersTotal: row.papers_total,
    papersServable: row.papers_servable,
    questionsTotal: row.questions_total,
    questionsServable: row.questions_servable,
    examKeysCollapsed: row.exam_keys_collapsed,
  };
}
