ALTER TABLE "attempts" ADD COLUMN "current_section" text;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "locked_sections" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "section_remaining_ms" integer;