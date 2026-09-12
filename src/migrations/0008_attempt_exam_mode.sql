ALTER TABLE "attempts" ADD COLUMN "exam_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "flag_count" integer DEFAULT 0 NOT NULL;