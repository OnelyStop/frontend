CREATE TYPE "public"."article_scope" AS ENUM('national', 'international');--> statement-breakpoint
CREATE TYPE "public"."article_source" AS ENUM('newsdata_io', 'rbi_rss', 'pib_rss', 'sebi_rss');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('new', 'duplicate', 'used', 'skipped');--> statement-breakpoint
CREATE TABLE "articles" (
	"article_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "article_source" NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"scope" "article_scope" NOT NULL,
	"content_hash" text NOT NULL,
	"minhash_signature" "bytea",
	"status" "article_status" DEFAULT 'new' NOT NULL,
	"skip_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid,
	"extracted_day" date NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"answer" text NOT NULL,
	"explanation" text NOT NULL,
	"topic" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generate_runs" (
	"run_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date,
	"planned" integer DEFAULT 0 NOT NULL,
	"published" integer DEFAULT 0 NOT NULL,
	"bodies_fetched" integer DEFAULT 0 NOT NULL,
	"skipped_thin" integer DEFAULT 0 NOT NULL,
	"skipped_non_english" integer DEFAULT 0 NOT NULL,
	"skipped_irrelevant" integer DEFAULT 0 NOT NULL,
	"rejected_irrelevant" integer DEFAULT 0 NOT NULL,
	"rejected_grounding" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "articles_status_published_at_idx" ON "articles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "questions_extracted_day_idx" ON "questions" USING btree ("extracted_day");--> statement-breakpoint
CREATE INDEX "generate_runs_started_at_idx" ON "generate_runs" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_article_id_unique_idx" ON "questions" USING btree ("article_id");
--> statement-breakpoint
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "generate_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "signed-in users can read Gazette articles" ON "articles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can read Gazette questions" ON "questions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
GRANT SELECT ON public.articles TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.questions TO authenticated;
