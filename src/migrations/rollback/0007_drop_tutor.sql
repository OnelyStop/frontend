-- Reverses 0007_drop_tutor.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- Recreates the tutor's chat tables empty (the rows went with 0007) and the
-- content_blocks search_vector column, which is a table rewrite.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0007
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0007_drop_tutor%';

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
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_conversations_owner_idx" ON "chat_conversations" USING btree ("user_id","topic_id");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE POLICY "owners read their own conversations" ON "chat_conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "chat_conversations"."user_id");--> statement-breakpoint
CREATE POLICY "owners create their own conversations" ON "chat_conversations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "chat_conversations"."user_id");--> statement-breakpoint
CREATE POLICY "owners update their own conversations" ON "chat_conversations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "chat_conversations"."user_id") WITH CHECK ((select auth.uid()) = "chat_conversations"."user_id");--> statement-breakpoint
CREATE POLICY "owners read messages in their conversations" ON "chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = (select user_id from chat_conversations c where c.id = "chat_messages"."conversation_id"));--> statement-breakpoint
CREATE POLICY "owners add messages to their conversations" ON "chat_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = (select user_id from chat_conversations c where c.id = "chat_messages"."conversation_id"));--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.chat_conversations TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;--> statement-breakpoint
REVOKE ALL ON public.chat_conversations FROM anon;--> statement-breakpoint
REVOKE ALL ON public.chat_messages FROM anon;--> statement-breakpoint
ALTER TABLE "content_blocks"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("body_markdown", '')), 'B')
  ) STORED;--> statement-breakpoint
CREATE INDEX "content_blocks_search_idx" ON "content_blocks" USING gin ("search_vector");
