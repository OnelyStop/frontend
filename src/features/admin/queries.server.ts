import "server-only";
import { desc, sql } from "drizzle-orm";
import { SECTION_DB } from "@/data/navigation";
import { db } from "@/db";
import { generateRuns } from "@/db/schema";
import {
  SERVABLE_MIN_QS,
  SERVABLE_STAGES,
} from "@/features/question-bank/papers.server";
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

// The predicates come from listMockPapers' own constants rather than being retyped, because a count that quietly disagrees with what /mocks serves is worse than no count.
export async function getBankStats(): Promise<BankStats> {
  const sections = Object.values(SECTION_DB);
  const [row] = await db.execute<{
    papers_total: number;
    papers_servable: number;
    questions_total: number;
    questions_servable: number;
    exam_keys_collapsed: number;
  }>(sql`
    with servable as (
      select p.paper_id, count(q.q_id) as qs
      from papers p
      join bank_questions q
        on q.paper_id = p.paper_id
       and q.is_active
       and q.answer is not null
       and q.section = any(${sections})
      where p.is_active
        and p.exam_type = any(${[...SERVABLE_STAGES]})
      group by p.paper_id
      having count(q.q_id) >= ${SERVABLE_MIN_QS}
    )
    select
      (select count(*) from papers)::int as papers_total,
      (select count(*) from servable)::int as papers_servable,
      (select count(*) from bank_questions)::int as questions_total,
      (select coalesce(sum(qs), 0) from servable)::int as questions_servable,
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
