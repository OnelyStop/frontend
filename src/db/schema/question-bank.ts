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
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

export const attemptMode = pgEnum("attempt_mode", ["bank", "mix", "paper"]);

// paper_id is the source data's own natural key (stable, externally given),
// so it's the primary key here too -- a surrogate bigint would need every
// question row to carry a resolve-the-id lookup pass during import for no
// benefit, since nothing joins on anything but this id anyway.
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
    // [bank, role, examType, year, shift].map(v => v ?? "unknown").join("|"),
    // lowercased -- groups every recall of the same real exam sitting
    // together so `isCanonical` has something to pick a winner within.
    examKey: text("exam_key").notNull(),
    // The one paper of its examKey that mocks/past-papers should offer;
    // computed at import time from active-question count, not stored intent.
    isCanonical: boolean("is_canonical").notNull().default(true),
    // Not in the source JSON -- "Need" per the app's own spec doc. Left null
    // rather than invented; a mock falls back to a duration heuristic.
    durationMin: integer("duration_min"),
    totalMarks: integer("total_marks"),
    sectionTiming: jsonb("section_timing"),
    sourcePdf: text("source_pdf"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    index("papers_exam_key_idx").on(t.examKey),
    index("papers_filter_idx").on(t.bank, t.role, t.examType, t.year),

    pgPolicy("anyone can read papers", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

// direction_id (d001..d030) is only unique *within* a paper -- it's reused
// across every paper in the corpus. The primary key is the pair, and every
// join anywhere in this schema (see questions' foreign key below) goes
// through both columns together. Joining on direction_id alone silently
// merges unrelated passages from different papers into one.
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

    pgPolicy("anyone can read directions", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

// Named bank_questions, not questions -- the Gazette engine's current-affairs
// table already claims that name (src/db/schema/gazette.ts).
export const bankQuestions = pgTable(
  "bank_questions",
  {
    qId: text("q_id").primaryKey(),
    paperId: text("paper_id")
      .notNull()
      .references(() => papers.paperId, { onDelete: "cascade" }),
    qNum: integer("q_num").notNull(),
    stem: text("stem").notNull(),
    // Keyed a-e, not an array -- `answer` stores the matching key, so a
    // 4-option paper and a 5-option paper need no branching anywhere reading
    // this column.
    options: jsonb("options").$type<Record<string, string>>().notNull(),
    // Null on every row today -- pipeline step 4 (answer) has never run. The
    // column exists so nothing here needs a migration when it does.
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
    // Computed at import time (pipeline/6-generate/generate.py::content_key,
    // ported in import-rules.ts) until question-bank's own step 3 (dedupe)
    // writes a real one. Indexed, not unique -- a unique constraint would
    // silently drop the second copy of a genuinely repeated question, and a
    // mock has to render every q_num of its paper regardless.
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

    // Nullable on directionId, so the ~29% of standalone questions (no
    // passage) skip this check entirely rather than needing a sentinel row.
    foreignKey({
      columns: [t.paperId, t.directionId],
      foreignColumns: [directions.paperId, directions.directionId],
    }),

    pgPolicy("anyone can read bank questions", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
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
  },
  (t) => [
    index("attempts_user_id_idx").on(t.userId),

    pgPolicy("signed-in users can read their own attempts", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("signed-in users can start their own attempts", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("signed-in users can update their own attempts", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
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

    // Ownership isn't a column here -- it's read off the parent attempt, so
    // there is exactly one place that decides whose row this is.
    pgPolicy("signed-in users can read their own attempt answers", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from attempts a where a.id = ${t.attemptId} and a.user_id = (select auth.uid()))`,
    }),
    pgPolicy("signed-in users can write their own attempt answers", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (select 1 from attempts a where a.id = ${t.attemptId} and a.user_id = (select auth.uid()))`,
    }),
  ],
).enableRLS();

// Natural key, not a surrogate one -- the eventual upsert
// ("attempted += 1, correct += correct?1:0") is one statement against one
// row per (user, topic) rather than a select-then-branch.
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
    // No stored `accuracy` column despite the spec listing one --
    // correct::numeric / nullif(attempted, 0) in the query is exact and
    // cannot drift from the two counters it's computed from.

    pgPolicy("signed-in users can read their own topic stats", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("signed-in users can write their own topic stats", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("signed-in users can update their own topic stats", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

// Notes (knowledge base), imported from bank_exam/notes's hand-authored JSON
// (import-notes.ts), never written by hand. One row per (section, topic,
// subtopic) -- the source repo's own validate_notes.py already enforces that
// uniqueness before anything here ever sees a file, so the unique constraint
// below is a second, cheap guarantee, not the primary one -- Postgres treats
// NULL subtopic as distinct from itself, so it would not actually catch two
// general notes for the same topic colliding; the source's own check is what
// really prevents that. section/topic use the same one-word vocabulary as
// questions.section/topic (topic_taxonomy.json) -- see SECTION_DB in
// data/navigation.ts for the mapping from a Subject's full name, same join
// key as the question bank.
export const notes = pgTable(
  "notes",
  {
    // The source's own natural key ("Section::Topic::subtopic_key"), stable
    // across re-imports -- same reasoning as papers.paperId above.
    noteId: text("note_id").primaryKey(),
    section: text("section").notNull(),
    topic: text("topic").notNull(),
    subtopic: text("subtopic"),
    // Curriculum order, imported one-way from bank_exam's topic_taxonomy.json (topicOrder) and
    // each topic file's own subtopics[] array (subtopicOrder) — not user-editable, see
    // scripts/import-notes.ts. Lets the notes list group by topic and sort subtopics in
    // build-up order instead of alphabetically.
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
    // Points at questions.qId, not a real FK -- notes and questions import
    // from two separate repos on two separate schedules, and a dangling
    // reference here should never block a notes import.
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
    // draft | reviewed | verified -- see notes/SCHEMA.md in bank_exam. Every
    // note today is "verified"; listNotes() hides "draft" so an in-progress
    // note can be imported without showing up half-written.
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

    pgPolicy("anyone can read notes", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();
