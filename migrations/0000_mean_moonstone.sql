CREATE TYPE "public"."article_scope" AS ENUM('national', 'international');--> statement-breakpoint
CREATE TYPE "public"."article_source" AS ENUM('newsdata_io', 'rbi_rss', 'pib_rss', 'sebi_rss');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('new', 'duplicate', 'used');--> statement-breakpoint
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"extracted_day" date NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"answer" text NOT NULL,
	"explanation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "articles_status_published_at_idx" ON "articles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "questions_extracted_day_idx" ON "questions" USING btree ("extracted_day");