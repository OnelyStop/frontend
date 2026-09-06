import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
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
import { authenticatedRole } from "drizzle-orm/supabase";
import { contentReadable } from "./shared";

// scripts/study-import.ts loads content as the database owner, bypassing RLS.
// Routes filter by the authenticated user id themselves; the policies here are
// the backstop, not the check.

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
    // The reader resolves a topic by slug alone; the subject and chapter in
    // the URL are presentation.
    uniqueIndex("topics_slug_key").on(t.slug),
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

// Unpopulated for now; present so a later PDF/image feature is a migration,
// not a redesign.
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
