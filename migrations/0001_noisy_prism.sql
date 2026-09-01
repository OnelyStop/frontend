ALTER TYPE "public"."article_status" ADD VALUE 'skipped';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "skip_reason" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "topic" text;