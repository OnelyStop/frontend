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
ALTER TABLE "questions" ADD COLUMN "article_id" uuid;--> statement-breakpoint
CREATE INDEX "generate_runs_started_at_idx" ON "generate_runs" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_article_id_unique_idx" ON "questions" USING btree ("article_id");