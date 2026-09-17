import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bankQuestions, questionReports } from "@/db/schema";
import type { ReportReason } from "./reports";

export type ReportedQuestion = {
  qId: string;
  paperId: string;
  qNum: number | null;
  stem: string;
  section: string | null;
  reports: number;
  reasons: ReportReason[];
  notes: string[];
  lastAt: string;
};

/** Grouped by question, not listed by report: three learners on one question is one thing to fix, not three. */
export async function listReportedQuestions(
  limit = 50,
): Promise<ReportedQuestion[]> {
  const rows = await db
    .select({
      qId: questionReports.qId,
      paperId: bankQuestions.paperId,
      qNum: bankQuestions.qNum,
      stem: bankQuestions.stem,
      section: bankQuestions.section,
      reports: sql<number>`count(*)::int`,
      reasons: sql<
        ReportReason[]
      >`array_agg(distinct ${questionReports.reason})`,
      notes: sql<
        string[]
      >`array_remove(array_agg(${questionReports.note}), null)`,
      lastAt: sql<string>`max(${questionReports.createdAt})`,
    })
    .from(questionReports)
    .innerJoin(bankQuestions, eq(bankQuestions.qId, questionReports.qId))
    .where(eq(questionReports.status, "open"))
    .groupBy(
      questionReports.qId,
      bankQuestions.paperId,
      bankQuestions.qNum,
      bankQuestions.stem,
      bankQuestions.section,
    )
    .orderBy(desc(sql`count(*)`), desc(sql`max(${questionReports.createdAt})`))
    .limit(limit);

  return rows.map((r) => ({ ...r, lastAt: new Date(r.lastAt).toISOString() }));
}
