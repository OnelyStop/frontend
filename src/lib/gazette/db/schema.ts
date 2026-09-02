import { sql } from "drizzle-orm";
import {
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const articleSource = pgEnum("article_source", [
  "newsdata_io",
  "rbi_rss",
  "pib_rss",
  "sebi_rss",
]);

export const articleScope = pgEnum("article_scope", [
  "national",
  "international",
]);

export const articleStatus = pgEnum("article_status", [
  "new",
  "duplicate",
  "used",
  // decided against generating from it (thin text, non-English, off-topic) —
  // distinct from `used`, which means a question was produced
  "skipped",
]);

// Reserved for dedup stage 2 (MinHash/LSH), not populated in the MVP.
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType: () => "bytea",
});

// Every non-duplicate article, held until Generate has drafted a question from
// it. One table — no separate source registry or audit log.
export const articles = pgTable(
  "articles",
  {
    articleId: uuid("article_id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    source: articleSource("source").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    url: text("url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    scope: articleScope("scope").notNull(),
    // sha256 of the normalized title+summary — exact-duplicate gate, checked
    // first. Unique so a re-fetched wire copy can't be inserted twice even if
    // the dedup check races.
    contentHash: text("content_hash").notNull().unique(),
    minhashSignature: bytea("minhash_signature"),
    status: articleStatus("status").notNull().default("new"),
    // why a `skipped` article was skipped: thin_source | non_english |
    // irrelevant:prefilter | irrelevant:model
    skipReason: text("skip_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("articles_status_published_at_idx").on(t.status, t.publishedAt),
    index("articles_published_at_idx").on(t.publishedAt),
    pgPolicy("signed-in users can read Gazette articles", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

// Only grounded questions land here. Everything a learner reads comes from this
// one table. No FK back to articles: by the time Generate runs, the article's
// event is already known-unique, and a question is either written or discarded.
export const questions = pgTable(
  "questions",
  {
    questionId: uuid("question_id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    articleId: uuid("article_id"),
    // The day the underlying news happened (articles.published_at truncated to
    // a date) — not the day it was generated.
    extractedDay: date("extracted_day").notNull(),
    questionText: text("question_text").notNull(),
    options: jsonb("options")
      .$type<Record<"A" | "B" | "C" | "D", string>>()
      .notNull(),
    answer: text("answer").notNull(),
    explanation: text("explanation").notNull(),
    // exam topic the model assigned, from activeProfile.topics
    topic: text("topic"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("questions_extracted_day_idx").on(t.extractedDay),
    uniqueIndex("questions_article_id_unique_idx").on(t.articleId),
    pgPolicy("signed-in users can read Gazette questions", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

// One row per generate run (a `plan` job). The per-article jobs increment its
// counters, so "what did last night's run do / is it stuck" is one SELECT.
export const generateRuns = pgTable(
  "generate_runs",
  {
    runId: uuid("run_id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    day: date("day"),
    planned: integer("planned").notNull().default(0),
    published: integer("published").notNull().default(0),
    bodiesFetched: integer("bodies_fetched").notNull().default(0),
    skippedThin: integer("skipped_thin").notNull().default(0),
    skippedNonEnglish: integer("skipped_non_english").notNull().default(0),
    skippedIrrelevant: integer("skipped_irrelevant").notNull().default(0),
    rejectedIrrelevant: integer("rejected_irrelevant").notNull().default(0),
    rejectedGrounding: integer("rejected_grounding").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull().default("running"), // running | done | failed
  },
  (t) => [index("generate_runs_started_at_idx").on(t.startedAt)],
).enableRLS();

export type ArticleRow = typeof articles.$inferSelect;
export type QuestionRow = typeof questions.$inferSelect;
export type GenerateRunRow = typeof generateRuns.$inferSelect;

/** The per-run counter columns the article jobs increment. */
export type RunCounter =
  | "published"
  | "bodiesFetched"
  | "skippedThin"
  | "skippedNonEnglish"
  | "skippedIrrelevant"
  | "rejectedIrrelevant"
  | "rejectedGrounding"
  | "errors";
