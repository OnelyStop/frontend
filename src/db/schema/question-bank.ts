import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const attemptMode = pgEnum("attempt_mode", ["bank", "mix", "paper"]);

export const papers = pgTable(
  "papers",
  {
    paperId: text("paper_id").primaryKey(),
    bank: text("bank"),
    role: text("role"),
    examType: text("exam_type"),
    year: integer("year"),
    shift: text("shift"),
    memoryBased: boolean("memory_based").notNull().default(false),
    examKey: text("exam_key").notNull(),
    isCanonical: boolean("is_canonical").notNull().default(true),
    durationMin: integer("duration_min"),
    totalMarks: integer("total_marks"),
    sectionTiming: jsonb("section_timing"),
    sourcePdf: text("source_pdf"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    index("papers_exam_key_idx").on(t.examKey),
    index("papers_filter_idx").on(t.bank, t.role, t.examType, t.year),

    pgPolicy("signed-in users can read papers", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

export const directions = pgTable(
  "directions",
  {
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.paperId, { onDelete: "cascade" }),
    directionId: text("direction_id").notNull(),
    body: text("body").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.paperId, t.directionId] }),

    pgPolicy("signed-in users can read directions", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

// Named bank_questions, not questions — the Gazette engine's current-affairs table already claims that name.
export const bankQuestions = pgTable(
  "bank_questions",
  {
    qId: text("q_id").primaryKey(),
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.paperId, { onDelete: "cascade" }),
    qNum: integer("q_num").notNull(),
    stem: text("stem").notNull(),
    options: jsonb("options").$type<Record<string, string>>().notNull(),
    // Null on every row today — pipeline step 4 (answer) has never run; the column exists for when it does.
    answer: char("answer", { length: 1 }),
    explanation: text("explanation"),
    section: text("section"),
    topic: text("topic"),
    difficulty: integer("difficulty"),
    directionId: text("direction_id"),
    marks: numeric("marks", { precision: 4, scale: 2 }).notNull().default("1"),
    negativeMarks: numeric("negative_marks", { precision: 4, scale: 2 })
      .notNull()
      .default("0.25"),
    contentHash: text("content_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    unique("bank_questions_paper_id_q_num_key").on(t.paperId, t.qNum),
    index("bank_questions_paper_id_direction_id_idx").on(
      t.paperId,
      t.directionId,
    ),
    index("bank_questions_section_topic_idx").on(t.section, t.topic),
    index("bank_questions_content_hash_idx").on(t.contentHash),

    // Nullable on directionId, so the ~29% of standalone questions skip this check without a sentinel row.
    foreignKey({
      columns: [t.paperId, t.directionId],
      foreignColumns: [directions.paperId, directions.directionId],
    }),

    // No policy and no grant on purpose: `answer` is the key to a paper being sat, so PostgREST must return nothing.
  ],
).enableRLS();

export const attempts = pgTable(
  "attempts",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    mode: attemptMode("mode").notNull(),
    paperId: text("paper_id").references(() => papers.paperId),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    score: numeric("score", { precision: 6, scale: 2 }),
    servedQIds: text("served_q_ids")
      .array()
      .notNull()
      .default(sql`'{}'`),
    currentSection: text("current_section"),
    lockedSections: text("locked_sections")
      .array()
      .notNull()
      .default(sql`'{}'`),
    sectionRemainingMs: integer("section_remaining_ms"),
    examMode: boolean("exam_mode").notNull().default(false),
    flagCount: integer("flag_count").notNull().default(0),
  },
  (t) => [
    index("attempts_user_id_idx").on(t.userId),
    index("attempts_user_started_idx").on(t.userId, t.startedAt.desc()),

    // Read-only to PostgREST: a client that could write here could set its own `score`.
    pgPolicy("signed-in users can read their own attempts", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    attemptId: bigint("attempt_id", { mode: "number" })
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    qId: text("q_id")
      .notNull()
      .references(() => bankQuestions.qId),
    chosen: char("chosen", { length: 1 }),
    isCorrect: boolean("is_correct"),
    timeMs: integer("time_ms"),
  },
  (t) => [
    unique("attempt_answers_attempt_id_q_id_key").on(t.attemptId, t.qId),
    index("attempt_answers_attempt_id_idx").on(t.attemptId),

    pgPolicy("signed-in users can read their own attempt answers", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from attempts a where a.id = ${t.attemptId} and a.user_id = (select auth.uid()))`,
    }),
  ],
).enableRLS();

export const userTopicStats = pgTable(
  "user_topic_stats",
  {
    userId: uuid("user_id").notNull(),
    topic: text("topic").notNull(),
    attempted: integer("attempted").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.topic] }),

    pgPolicy("signed-in users can read their own topic stats", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

export const notes = pgTable(
  "notes",
  {
    noteId: text("note_id").primaryKey(),
    section: text("section").notNull(),
    topic: text("topic").notNull(),
    subtopic: text("subtopic"),
    topicTitle: text("topic_title").notNull(),
    topicOrder: integer("topic_order").notNull(),
    subtopicOrder: integer("subtopic_order").notNull(),
    aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
    examRelevance: jsonb("exam_relevance")
      .$type<{ exams: string[]; stage: string[] }>()
      .notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    concept: text("concept").notNull(),
    formulas: jsonb("formulas")
      .$type<{ name: string; expression: string; notes: string | null }[]>()
      .notNull()
      .default([]),
    tricks: jsonb("tricks")
      .$type<
        {
          name: string;
          description: string;
          whenToUse: string;
          example: string | null;
        }[]
      >()
      .notNull()
      .default([]),
    commonMistakes: jsonb("common_mistakes")
      .$type<string[]>()
      .notNull()
      .default([]),
    workedExamples: jsonb("worked_examples")
      .$type<{ problem: string; steps: string[]; answer: string }[]>()
      .notNull()
      .default([]),
    relatedQuestionIds: jsonb("related_question_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
    difficulty: text("difficulty"),
    sources: jsonb("sources")
      .$type<
        {
          name: string;
          url: string;
          tier: number;
          contribution: string;
          accessed: string;
        }[]
      >()
      .notNull()
      .default([]),
    confirmations: integer("confirmations"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    // draft | reviewed | verified — every note today is "verified"; listNotes() hides "draft".
    status: text("status").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    unique("notes_section_topic_subtopic_key").on(
      t.section,
      t.topic,
      t.subtopic,
    ),
    index("notes_section_topic_idx").on(t.section, t.topic),

    // No policy and no grant on purpose: paid theory content, served only through the route handlers that gate it.
  ],
).enableRLS();

export const reportReason = pgEnum("report_reason", [
  "answer_wrong",
  "wrong_section",
  "text_broken",
  "options_wrong",
  "other",
]);

export const reportStatus = pgEnum("report_status", [
  "open",
  "fixed",
  "rejected",
]);

// A report is an opinion, never an input to scoring: nothing reads this to decide whether a question is right.
export const questionReports = pgTable(
  "question_reports",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    qId: text("q_id")
      .notNull()
      .references(() => bankQuestions.qId, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    reason: reportReason("reason").notNull(),
    note: text("note"),
    status: reportStatus("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // A second click is the same opinion, so it updates rather than inflating the count.
    unique("question_reports_q_id_user_id_key").on(t.qId, t.userId),
    index("question_reports_status_created_idx").on(t.status, t.createdAt),

    pgPolicy("signed-in users can read their own reports", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();
