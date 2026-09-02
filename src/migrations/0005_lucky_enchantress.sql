ALTER TABLE "notes" ADD COLUMN "topic_title" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "topic_order" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "subtopic_order" integer NOT NULL DEFAULT 0;