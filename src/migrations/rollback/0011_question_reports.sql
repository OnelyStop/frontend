-- DESTRUCTIVE: every report learners have filed is dropped with the table.
DROP TABLE IF EXISTS "question_reports";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."report_reason";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."report_status";
