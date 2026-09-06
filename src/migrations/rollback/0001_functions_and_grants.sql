-- Reverses 0001_functions_and_grants.sql. Drizzle is forward-only, so this is hand-maintained.
-- Afterwards: delete from drizzle.__drizzle_migrations where hash like '%0001_functions_and_grants%';
--
-- DESTRUCTIVE: dropping the auth.users foreign keys leaves rows behind when a
-- user is deleted, and closing an account then stops erasing their data.
--
-- The wide grants are deliberately not restored. They were the defect: a signed
-- in user could POST straight to PostgREST and skip the plan quota. If some
-- future change genuinely needs PostgREST on a table, grant that one table.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint
DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;--> statement-breakpoint

DROP FUNCTION IF EXISTS public.handle_new_user();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.touch_updated_at();--> statement-breakpoint
DROP FUNCTION IF EXISTS public.authorize(public.app_permission);--> statement-breakpoint
DROP FUNCTION IF EXISTS public.is_admin();--> statement-breakpoint

ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_amount_minor_positive";--> statement-breakpoint
ALTER TABLE "payment_plans" DROP CONSTRAINT IF EXISTS "payment_plans_amount_minor_positive";--> statement-breakpoint

ALTER TABLE "user_topic_stats" DROP CONSTRAINT IF EXISTS "user_topic_stats_user_id_fkey";--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT IF EXISTS "attempts_user_id_fkey";--> statement-breakpoint
ALTER TABLE "doubt_stuck" DROP CONSTRAINT IF EXISTS "doubt_stuck_user_id_fkey";--> statement-breakpoint
ALTER TABLE "doubts" DROP CONSTRAINT IF EXISTS "doubts_author_id_fkey";--> statement-breakpoint
ALTER TABLE "study_progress" DROP CONSTRAINT IF EXISTS "study_progress_user_id_fkey";--> statement-breakpoint
ALTER TABLE "user_notes" DROP CONSTRAINT IF EXISTS "user_notes_user_id_fkey";--> statement-breakpoint
ALTER TABLE "descriptive_markings" DROP CONSTRAINT IF EXISTS "descriptive_markings_user_id_fkey";--> statement-breakpoint
ALTER TABLE "ai_usage" DROP CONSTRAINT IF EXISTS "ai_usage_user_id_fkey";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_user_id_fkey";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_user_id_fkey";--> statement-breakpoint
ALTER TABLE "entitlements" DROP CONSTRAINT IF EXISTS "entitlements_user_id_fkey";--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_user_id_fkey";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_id_fkey";
