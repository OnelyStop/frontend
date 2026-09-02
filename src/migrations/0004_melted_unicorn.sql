CREATE TABLE "notes" (
	"note_id" text PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"topic" text NOT NULL,
	"subtopic" text,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exam_relevance" jsonb NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"concept" text NOT NULL,
	"formulas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tricks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"common_mistakes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"worked_examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_question_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confirmations" integer,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "notes_section_topic_subtopic_key" UNIQUE("section","topic","subtopic")
);
--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "notes_section_topic_idx" ON "notes" USING btree ("section","topic");--> statement-breakpoint
CREATE POLICY "anyone can read notes" ON "notes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

-- Hand-written: drizzle-kit generates none of the below. Do not regenerate.
--
-- Postgres checks table GRANTs before RLS, so without this the SELECT policy
-- above never runs and every query silently returns zero rows instead of the
-- RLS-scoped result the policy intends. Same pattern as 0003_question_bank.sql.
GRANT SELECT ON public.notes TO anon, authenticated;