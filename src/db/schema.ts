import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
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
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";
export * from "../lib/gazette/db/schema";

export const appRole = pgEnum("app_role", ["admin", "editor"]);

export const appPermission = pgEnum("app_permission", [
  "questions.create",
  "questions.update",
  "questions.delete",
  "papers.import",
  "users.read",
]);

// Roles are stored here rather than in user_metadata, which the user can write
// to and could use to make themselves an admin.
export const userRoles = pgTable(
  "user_roles",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    role: appRole("role").notNull(),
  },
  (t) => [
    unique("user_roles_user_id_role_key").on(t.userId, t.role),

    // Paired with a SELECT grant in the migration — Postgres checks grants
    // before RLS, so the policy is inert without it.
    pgPolicy("signed-in users can read their own role", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),

    // No insert/update/delete policy on purpose: granting a role is a
    // service-role operation, so no signed-in user can escalate their own.
  ],
).enableRLS();

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    role: appRole("role").notNull(),
    permission: appPermission("permission").notNull(),
  },
  (t) => [
    unique("role_permissions_role_permission_key").on(t.role, t.permission),

    pgPolicy("signed-in users can read permissions", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

// Access is one column: entitlements.access_until. Everything below is the
// audit trail explaining how that timestamp got its value, never the check.

export const billingInterval = pgEnum("billing_interval", [
  "monthly",
  "yearly",
]);

// One plan object exists in Razorpay per currency, because Razorpay fixes the
// currency on the plan itself -- so .in and .com are different plan ids for the
// same product.
export const currencyCode = pgEnum("currency_code", ["INR", "USD"]);

// Razorpay's own subscription states, mirrored exactly. Inventing our own
// vocabulary here would mean translating on every webhook, and a mistranslation
// is invisible until a renewal silently stops granting access.
export const subscriptionStatus = pgEnum("subscription_status", [
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "cancelled",
  "completed",
  "expired",
]);

// What the user is paying for. Kept apart from Razorpay's plan id so a price
// change, a promo, or a second provider does not need a new product.
export const planKey = pgEnum("plan_key", ["pro", "school"]);

// The price source of truth. The client never sends an amount or a currency:
// currency comes from the request host (.in -> INR, .com -> USD) and the amount
// is read from here, or a caller could buy Pro for one paisa.
export const paymentPlans = pgTable(
  "payment_plans",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    plan: planKey("plan").notNull(),
    interval: billingInterval("interval").notNull(),
    currency: currencyCode("currency").notNull(),
    // Razorpay's plan id, created once per (plan, interval, currency).
    razorpayPlanId: text("razorpay_plan_id").notNull(),
    // Minor units -- paise, cents. Never a float: 7.99 * 100 is 798.9999… in
    // float64, and a rounding error in an amount is a real charge.
    amountMinor: integer("amount_minor").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Partial, not a plain unique: Razorpay plan objects are immutable, so
    // changing a price means creating a new one and retiring the old. Existing
    // subscribers keep billing against the plan they signed up to, which is the
    // behaviour we want -- so a slot may hold many retired rows and exactly one
    // live one.
    uniqueIndex("payment_plans_active_slot_key")
      .on(t.plan, t.interval, t.currency)
      .where(sql`${t.active}`),
    unique("payment_plans_razorpay_plan_id_key").on(t.razorpayPlanId),

    // Prices are public -- the marketing page renders them to signed-out
    // visitors. Readable by anyone, writable by nobody but the service role.
    pgPolicy("anyone can read plan prices", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ],
).enableRLS();

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    razorpaySubscriptionId: text("razorpay_subscription_id").notNull(),
    planId: bigint("plan_id", { mode: "number" }).notNull(),
    status: subscriptionStatus("status").notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("subscriptions_razorpay_subscription_id_key").on(
      t.razorpaySubscriptionId,
    ),
    index("subscriptions_user_id_idx").on(t.userId),

    pgPolicy("signed-in users can read their own subscriptions", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    // No write policy: only the webhook, running as the service role, may move
    // a subscription's state.
  ],
).enableRLS();

export const payments = pgTable(
  "payments",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    subscriptionId: bigint("subscription_id", { mode: "number" }),
    razorpayPaymentId: text("razorpay_payment_id").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: currencyCode("currency").notNull(),
    status: text("status").notNull(),
    method: text("method"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Razorpay may deliver the same payment on more than one event. This is
    // what makes recording it twice impossible rather than merely unlikely.
    unique("payments_razorpay_payment_id_key").on(t.razorpayPaymentId),
    index("payments_user_id_idx").on(t.userId),
    index("payments_subscription_id_idx").on(t.subscriptionId),

    pgPolicy("signed-in users can read their own payments", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

// Every webhook Razorpay delivers, recorded before it is acted on. The unique
// event id is the idempotency key: Razorpay says plainly that the same event
// can arrive more than once, so a redelivery must conflict here and roll the
// whole transaction back rather than grant a second month.
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("payment_events_event_id_key").on(t.eventId),
    index("payment_events_event_type_idx").on(t.eventType),

    // Deliberately no read policy: the payload is the raw provider event and
    // has no reason to reach a browser.
  ],
).enableRLS();

// What the app actually reads. Separate from `subscriptions` on purpose --
// access has to survive a provider change, a support grant, or a refund
// argument without a feature ever learning what Razorpay is.
export const entitlements = pgTable(
  "entitlements",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    plan: planKey("plan").notNull(),
    // The single access check: access_until > now(). One comparison, in one
    // place, so no feature can invent its own idea of "still paid".
    accessUntil: timestamp("access_until", { withTimezone: true }).notNull(),
    // Informational -- why access_until says what it does. Never the check.
    status: subscriptionStatus("status").notNull(),
    subscriptionId: bigint("subscription_id", { mode: "number" }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One live entitlement per user. Renewals move access_until forward on
    // this row rather than adding another, so "which one wins" never arises.
    unique("entitlements_user_id_key").on(t.userId),

    pgPolicy("signed-in users can read their own entitlement", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    displayName: text("display_name"),
    bio: text("bio"),
    // Never used for pricing -- currency comes from the request host.
    country: char("country", { length: 2 }).notNull().default("IN"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    pgPolicy("signed-in users can read their own profile", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.id}`,
    }),
    pgPolicy("signed-in users can update their own profile", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.id}`,
      withCheck: sql`(select auth.uid()) = ${t.id}`,
    }),
    // No insert or delete policy: the signup trigger and the cascade own those.
  ],
).enableRLS();

// Question bank: imported from OnelyStop/question-bank's classified JSON
// (import-question-bank.ts), never written by hand. papers/directions/questions
// are a closed graph a re-import replaces wholesale, which is why they carry
// real foreign keys with cascade -- the billing tables above deliberately
// don't, because those mirror an external provider and are written by a
// webhook instead.
//
// attempts/attempt_answers/user_topic_stats exist so the schema doesn't need
// a second migration once scoring lands, but nothing writes them yet: 0% of
// questions have an `answer` today (pipeline step 4 hasn't run), so there is
// nothing to score against.

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
// table already claims that name (src/lib/gazette/db/schema.ts).
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

// Study module (knowledge base). Topic JSON under content/ is the Git-managed
// authoring source; scripts/study-import.ts projects it into these tables. The
// importer connects as the database owner and bypasses RLS, so the policies
// below are the backstop — the app's own queries additionally filter by the
// authenticated user id in the route handler (see src/features/study). A
// standalone Postgres has no auth.uid(); docker/postgres/init.sql shims it for
// local dev.

export const contentStatus = pgEnum("content_status", [
  "draft",
  "in_review",
  "published",
  "retired",
]);

export const noteVisibility = pgEnum("note_visibility", [
  "private",
  "unlisted",
  "public",
]);

export const moderationStatus = pgEnum("moderation_status", [
  "not_required",
  "pending",
  "approved",
  "rejected",
]);

export const flashcardStatus = pgEnum("flashcard_status", [
  "draft",
  "approved",
  "rejected",
]);

// Content read to any signed-in learner. Publication is enforced by the route
// handler (status = 'published'), not the policy — the policy only keeps the
// anon key from reading the table at all.
const contentReadable = (name: string) =>
  pgPolicy(name, { for: "select", to: authenticatedRole, using: sql`true` });

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    position: integer("position").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  () => [contentReadable("signed-in users can read subjects")],
).enableRLS();

export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    position: integer("position").notNull(),
  },
  (t) => [
    unique("chapters_subject_id_slug_key").on(t.subjectId, t.slug),
    index("chapters_subject_id_idx").on(t.subjectId),
    contentReadable("signed-in users can read chapters"),
  ],
).enableRLS();

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id),
    slug: text("slug").notNull(),
    position: integer("position").notNull().default(0),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    difficulty: text("difficulty").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    examTags: text("exam_tags")
      .array()
      .notNull()
      .default(sql`'{}'`),
    prerequisiteTopicSlugs: text("prerequisite_topic_slugs")
      .array()
      .notNull()
      .default(sql`'{}'`),
    learningObjectives: jsonb("learning_objectives")
      .$type<string[]>()
      .notNull()
      .default([]),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'`),
    status: contentStatus("status").notNull().default("draft"),
    currentVersion: integer("current_version").notNull().default(1),
    reviewCadenceDays: integer("review_cadence_days").notNull().default(365),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    unique("topics_chapter_id_slug_key").on(t.chapterId, t.slug),
    index("topics_chapter_id_idx").on(t.chapterId),
    index("topics_slug_idx").on(t.slug),
    check(
      "topics_difficulty_check",
      sql`${t.difficulty} in ('beginner','intermediate','advanced')`,
    ),
    check("topics_estimated_minutes_check", sql`${t.estimatedMinutes} > 0`),
    contentReadable("signed-in users can read topics"),
  ],
).enableRLS();

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id),
    version: integer("version").notNull(),
    sourceHash: text("source_hash").notNull(),
    authoredBy: text("authored_by"),
    reviewedBy: text("reviewed_by"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("content_versions_topic_id_version_key").on(t.topicId, t.version),
    contentReadable("signed-in users can read content versions"),
  ],
).enableRLS();

export const contentBlocks = pgTable(
  "content_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentVersionId: uuid("content_version_id")
      .notNull()
      .references(() => contentVersions.id, { onDelete: "cascade" }),
    stableKey: text("stable_key").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    bodyMarkdown: text("body_markdown").notNull(),
    searchKeywords: text("search_keywords")
      .array()
      .notNull()
      .default(sql`'{}'`),
    position: integer("position").notNull(),
  },
  (t) => [
    unique("content_blocks_content_version_id_stable_key_key").on(
      t.contentVersionId,
      t.stableKey,
    ),
    index("content_blocks_content_version_id_idx").on(t.contentVersionId),
    contentReadable("signed-in users can read content blocks"),
  ],
).enableRLS();

export const contentSources = pgTable(
  "content_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registryKey: text("registry_key"),
    url: text("url").notNull(),
    title: text("title").notNull(),
    publisher: text("publisher").notNull(),
    usageMode: text("usage_mode").notNull(),
    license: text("license"),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    contentHash: text("content_hash"),
    notes: text("notes"),
  },
  (t) => [
    unique("content_sources_url_retrieved_at_key").on(t.url, t.retrievedAt),
    contentReadable("signed-in users can read content sources"),
  ],
).enableRLS();

export const contentBlockSources = pgTable(
  "content_block_sources",
  {
    blockId: uuid("block_id")
      .notNull()
      .references(() => contentBlocks.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => contentSources.id),
  },
  (t) => [
    primaryKey({ columns: [t.blockId, t.sourceId] }),
    contentReadable("signed-in users can read content block sources"),
  ],
).enableRLS();

export const flashcards = pgTable(
  "flashcards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    contentVersion: integer("content_version").notNull(),
    stableKey: text("stable_key").notNull(),
    front: text("front").notNull(),
    back: text("back").notNull(),
    explanation: text("explanation"),
    difficulty: text("difficulty").notNull(),
    sourceBlockKeys: text("source_block_keys")
      .array()
      .notNull()
      .default(sql`'{}'`),
    status: flashcardStatus("status").notNull().default("draft"),
    position: integer("position").notNull(),
    generatedBy: text("generated_by"),
    reviewedBy: text("reviewed_by"),
  },
  (t) => [
    unique("flashcards_topic_id_content_version_stable_key_key").on(
      t.topicId,
      t.contentVersion,
      t.stableKey,
    ),
    index("flashcards_topic_id_idx").on(t.topicId),
    check("flashcards_front_len_check", sql`char_length(${t.front}) <= 240`),
    check("flashcards_back_len_check", sql`char_length(${t.back}) <= 800`),
    check(
      "flashcards_difficulty_check",
      sql`${t.difficulty} in ('easy','medium','hard')`,
    ),
    contentReadable("signed-in users can read flashcards"),
  ],
).enableRLS();

export const userNotes = pgTable(
  "user_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    blockStableKey: text("block_stable_key"),
    contentVersion: integer("content_version"),
    selectedText: text("selected_text"),
    textBefore: text("text_before"),
    textAfter: text("text_after"),
    bodyMarkdown: text("body_markdown").notNull(),
    color: text("color").notNull().default("yellow"),
    visibility: noteVisibility("visibility").notNull().default("private"),
    moderation: moderationStatus("moderation")
      .notNull()
      .default("not_required"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("user_notes_owner_topic_idx").on(t.userId, t.topicId),
    check(
      "user_notes_body_len_check",
      sql`char_length(${t.bodyMarkdown}) <= 10000`,
    ),
    pgPolicy("owners read their own notes", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("owners create their own notes", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("owners update their own notes", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("owners delete their own notes", {
      for: "delete",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

export const studyProgress = pgTable(
  "study_progress",
  {
    userId: uuid("user_id").notNull(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    progressPercent: integer("progress_percent").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.topicId] }),
    check(
      "study_progress_percent_check",
      sql`${t.progressPercent} between 0 and 100`,
    ),
    pgPolicy("owners read their own progress", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("owners upsert their own progress", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("owners update their own progress", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id),
    contentVersion: integer("content_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("chat_conversations_owner_idx").on(t.userId, t.topicId),
    pgPolicy("owners read their own conversations", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("owners create their own conversations", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
    pgPolicy("owners update their own conversations", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
      withCheck: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    body: text("body").notNull(),
    citedBlockKeys: text("cited_block_keys")
      .array()
      .notNull()
      .default(sql`'{}'`),
    tokenCount: integer("token_count"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("chat_messages_conversation_idx").on(t.conversationId),
    check("chat_messages_role_check", sql`${t.role} in ('user','assistant')`),
    // No user_id column: ownership is the parent conversation's.
    pgPolicy("owners read messages in their conversations", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = (select user_id from chat_conversations c where c.id = ${t.conversationId})`,
    }),
    pgPolicy("owners add messages to their conversations", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = (select user_id from chat_conversations c where c.id = ${t.conversationId})`,
    }),
  ],
).enableRLS();

// Schema-only for the MVP: no binary assets are stored yet (see spec §3.2).
// Present so a later PDF/image/audio feature is a migration, not a redesign.
export const contentAssets = pgTable(
  "content_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id").references(() => topics.id),
    objectKey: text("object_key").notNull().unique(),
    bucket: text("bucket").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }).notNull(),
    sha256: text("sha256").notNull(),
    altText: text("alt_text"),
    license: text("license"),
    attribution: text("attribution"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("content_assets_byte_size_check", sql`${t.byteSize} >= 0`),
    contentReadable("signed-in users can read content assets"),
  ],
).enableRLS();
