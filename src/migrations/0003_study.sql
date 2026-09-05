CREATE TYPE "public"."content_status" AS ENUM('draft', 'in_review', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."flashcard_status" AS ENUM('draft', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('not_required', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."note_visibility" AS ENUM('private', 'unlisted', 'public');--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer NOT NULL,
	CONSTRAINT "chapters_subject_id_slug_key" UNIQUE("subject_id","slug")
);
--> statement-breakpoint
ALTER TABLE "chapters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"content_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"body" text NOT NULL,
	"cited_block_keys" text[] DEFAULT '{}' NOT NULL,
	"token_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_messages_role_check" CHECK ("chat_messages"."role" in ('user','assistant'))
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid,
	"object_key" text NOT NULL,
	"bucket" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"sha256" text NOT NULL,
	"alt_text" text,
	"license" text,
	"attribution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_assets_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "content_assets_byte_size_check" CHECK ("content_assets"."byte_size" >= 0)
);
--> statement-breakpoint
ALTER TABLE "content_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_block_sources" (
	"block_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	CONSTRAINT "content_block_sources_block_id_source_id_pk" PRIMARY KEY("block_id","source_id")
);
--> statement-breakpoint
ALTER TABLE "content_block_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_version_id" uuid NOT NULL,
	"stable_key" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body_markdown" text NOT NULL,
	"search_keywords" text[] DEFAULT '{}' NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "content_blocks_content_version_id_stable_key_key" UNIQUE("content_version_id","stable_key")
);
--> statement-breakpoint
ALTER TABLE "content_blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registry_key" text,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"publisher" text NOT NULL,
	"usage_mode" text NOT NULL,
	"license" text,
	"retrieved_at" timestamp with time zone NOT NULL,
	"source_updated_at" timestamp with time zone,
	"content_hash" text,
	"notes" text,
	CONSTRAINT "content_sources_url_retrieved_at_key" UNIQUE("url","retrieved_at")
);
--> statement-breakpoint
ALTER TABLE "content_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"source_hash" text NOT NULL,
	"authored_by" text,
	"reviewed_by" text,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_versions_topic_id_version_key" UNIQUE("topic_id","version")
);
--> statement-breakpoint
ALTER TABLE "content_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"content_version" integer NOT NULL,
	"stable_key" text NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"explanation" text,
	"difficulty" text NOT NULL,
	"source_block_keys" text[] DEFAULT '{}' NOT NULL,
	"status" "flashcard_status" DEFAULT 'draft' NOT NULL,
	"position" integer NOT NULL,
	"generated_by" text,
	"reviewed_by" text,
	CONSTRAINT "flashcards_topic_id_content_version_stable_key_key" UNIQUE("topic_id","content_version","stable_key"),
	CONSTRAINT "flashcards_front_len_check" CHECK (char_length("flashcards"."front") <= 240),
	CONSTRAINT "flashcards_back_len_check" CHECK (char_length("flashcards"."back") <= 800),
	CONSTRAINT "flashcards_difficulty_check" CHECK ("flashcards"."difficulty" in ('easy','medium','hard'))
);
--> statement-breakpoint
ALTER TABLE "flashcards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "study_progress" (
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"last_opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_progress_user_id_topic_id_pk" PRIMARY KEY("user_id","topic_id"),
	CONSTRAINT "study_progress_percent_check" CHECK ("study_progress"."progress_percent" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "study_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "subjects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"difficulty" text NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"exam_tags" text[] DEFAULT '{}' NOT NULL,
	"prerequisite_topic_slugs" text[] DEFAULT '{}' NOT NULL,
	"learning_objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"review_cadence_days" integer DEFAULT 365 NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	CONSTRAINT "topics_chapter_id_slug_key" UNIQUE("chapter_id","slug"),
	CONSTRAINT "topics_difficulty_check" CHECK ("topics"."difficulty" in ('beginner','intermediate','advanced')),
	CONSTRAINT "topics_estimated_minutes_check" CHECK ("topics"."estimated_minutes" > 0)
);
--> statement-breakpoint
ALTER TABLE "topics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"block_stable_key" text,
	"content_version" integer,
	"selected_text" text,
	"text_before" text,
	"text_after" text,
	"body_markdown" text NOT NULL,
	"color" text DEFAULT 'yellow' NOT NULL,
	"visibility" "note_visibility" DEFAULT 'private' NOT NULL,
	"moderation" "moderation_status" DEFAULT 'not_required' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_notes_body_len_check" CHECK (char_length("user_notes"."body_markdown") <= 10000)
);
--> statement-breakpoint
ALTER TABLE "user_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_block_sources" ADD CONSTRAINT "content_block_sources_block_id_content_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."content_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_block_sources" ADD CONSTRAINT "content_block_sources_source_id_content_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."content_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_content_version_id_content_versions_id_fk" FOREIGN KEY ("content_version_id") REFERENCES "public"."content_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_progress" ADD CONSTRAINT "study_progress_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chapters_subject_id_idx" ON "chapters" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "chat_conversations_owner_idx" ON "chat_conversations" USING btree ("user_id","topic_id");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "content_blocks_content_version_id_idx" ON "content_blocks" USING btree ("content_version_id");--> statement-breakpoint
CREATE INDEX "flashcards_topic_id_idx" ON "flashcards" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "topics_chapter_id_idx" ON "topics" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "user_notes_owner_topic_idx" ON "user_notes" USING btree ("user_id","topic_id");--> statement-breakpoint
CREATE POLICY "signed-in users can read chapters" ON "chapters" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "owners read their own conversations" ON "chat_conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "chat_conversations"."user_id");--> statement-breakpoint
CREATE POLICY "owners create their own conversations" ON "chat_conversations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "chat_conversations"."user_id");--> statement-breakpoint
CREATE POLICY "owners update their own conversations" ON "chat_conversations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "chat_conversations"."user_id") WITH CHECK ((select auth.uid()) = "chat_conversations"."user_id");--> statement-breakpoint
CREATE POLICY "owners read messages in their conversations" ON "chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = (select user_id from chat_conversations c where c.id = "chat_messages"."conversation_id"));--> statement-breakpoint
CREATE POLICY "owners add messages to their conversations" ON "chat_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = (select user_id from chat_conversations c where c.id = "chat_messages"."conversation_id"));--> statement-breakpoint
CREATE POLICY "signed-in users can read content assets" ON "content_assets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can read content block sources" ON "content_block_sources" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can read content blocks" ON "content_blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can read content sources" ON "content_sources" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can read content versions" ON "content_versions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can read flashcards" ON "flashcards" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "owners read their own progress" ON "study_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "study_progress"."user_id");--> statement-breakpoint
CREATE POLICY "owners upsert their own progress" ON "study_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "study_progress"."user_id");--> statement-breakpoint
CREATE POLICY "owners update their own progress" ON "study_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "study_progress"."user_id") WITH CHECK ((select auth.uid()) = "study_progress"."user_id");--> statement-breakpoint
CREATE POLICY "signed-in users can read subjects" ON "subjects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can read topics" ON "topics" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "owners read their own notes" ON "user_notes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "user_notes"."user_id");--> statement-breakpoint
CREATE POLICY "owners create their own notes" ON "user_notes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "user_notes"."user_id");--> statement-breakpoint
CREATE POLICY "owners update their own notes" ON "user_notes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "user_notes"."user_id") WITH CHECK ((select auth.uid()) = "user_notes"."user_id");--> statement-breakpoint
CREATE POLICY "owners delete their own notes" ON "user_notes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "user_notes"."user_id");
-- ---------------------------------------------------------------------------
-- Hand-written: drizzle-kit generates none of the below, and re-running
-- `db:generate` will not touch it (it is not represented in schema.ts).
--
--   * table GRANTs — Postgres checks these before RLS, so a policy without a
--     matching grant silently returns zero rows (STANDARDS.md "The database")
--   * foreign keys into auth.users, which drizzle cannot model
--   * the full-text search_vector column and its GIN index (spec §7)
--
-- One GRANT per table on purpose: the RLS test parses single-table grants.
-- ---------------------------------------------------------------------------

-- Content is world-readable to any signed-in learner; publication is enforced
-- by the route handler, never by the policy. The importer connects as the
-- table owner and bypasses RLS, so no INSERT/UPDATE grant is given here.
GRANT SELECT ON public.subjects TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.chapters TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.topics TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.content_versions TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.content_blocks TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.content_sources TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.content_block_sources TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.flashcards TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.content_assets TO authenticated;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.study_progress TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.chat_conversations TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;--> statement-breakpoint

REVOKE ALL ON public.subjects FROM anon;--> statement-breakpoint
REVOKE ALL ON public.chapters FROM anon;--> statement-breakpoint
REVOKE ALL ON public.topics FROM anon;--> statement-breakpoint
REVOKE ALL ON public.content_versions FROM anon;--> statement-breakpoint
REVOKE ALL ON public.content_blocks FROM anon;--> statement-breakpoint
REVOKE ALL ON public.content_sources FROM anon;--> statement-breakpoint
REVOKE ALL ON public.content_block_sources FROM anon;--> statement-breakpoint
REVOKE ALL ON public.flashcards FROM anon;--> statement-breakpoint
REVOKE ALL ON public.content_assets FROM anon;--> statement-breakpoint
REVOKE ALL ON public.user_notes FROM anon;--> statement-breakpoint
REVOKE ALL ON public.study_progress FROM anon;--> statement-breakpoint
REVOKE ALL ON public.chat_conversations FROM anon;--> statement-breakpoint
REVOKE ALL ON public.chat_messages FROM anon;--> statement-breakpoint

ALTER TABLE "user_notes"
  ADD CONSTRAINT "user_notes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "study_progress"
  ADD CONSTRAINT "study_progress_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chat_conversations"
  ADD CONSTRAINT "chat_conversations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint

-- Topic-scoped full-text search for the tutor's block retrieval (spec §10.5).
-- Generated + stored so a write keeps it in sync and a read is a plain index scan.
ALTER TABLE "content_blocks"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("body_markdown", '')), 'B')
  ) STORED;--> statement-breakpoint
CREATE INDEX "content_blocks_search_idx" ON "content_blocks" USING gin ("search_vector");
