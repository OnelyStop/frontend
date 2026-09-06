ALTER TYPE "public"."plan_key" ADD VALUE 'pro_plus' BEFORE 'school';--> statement-breakpoint
ALTER TABLE "payment_plans" ADD COLUMN "list_amount_minor" integer;