import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
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
