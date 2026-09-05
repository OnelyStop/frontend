CREATE TYPE "public"."exam_board" AS ENUM('IBPS PO', 'IBPS Clerk', 'SBI PO', 'SBI Clerk', 'RBI Grade B');--> statement-breakpoint
CREATE TYPE "public"."exam_section" AS ENUM('Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General Awareness', 'Computer Aptitude');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "school" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "target_year" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "exam_board" "exam_board" DEFAULT 'IBPS PO' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "default_section" "exam_section" DEFAULT 'Quantitative Aptitude' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_target_year_check" CHECK ("profiles"."target_year" is null or "profiles"."target_year" between 2000 and 2100);