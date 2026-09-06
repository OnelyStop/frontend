-- Reverses 0010_pro_plus_tier.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0010
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0010_pro_plus_tier%';
--
-- Postgres cannot drop a value from an enum, so removing 'pro_plus' means
-- rebuilding the type. Anyone already on Pro+ has to land somewhere first, and
-- 'pro' is the only honest answer — they keep paid access at the lower
-- ceiling rather than losing it.

ALTER TABLE "payment_plans" DROP COLUMN IF EXISTS "list_amount_minor";--> statement-breakpoint

UPDATE "entitlements" SET "plan" = 'pro' WHERE "plan" = 'pro_plus';--> statement-breakpoint
UPDATE "payment_plans" SET "active" = false WHERE "plan" = 'pro_plus';--> statement-breakpoint

ALTER TYPE "public"."plan_key" RENAME TO "plan_key_old";--> statement-breakpoint
CREATE TYPE "public"."plan_key" AS ENUM('pro', 'school');--> statement-breakpoint

-- The default has to go before the cast and come back after: Postgres will not
-- re-parse an existing default against the new type.
ALTER TABLE "payment_plans"
  ALTER COLUMN "plan" TYPE "public"."plan_key"
  USING "plan"::text::"public"."plan_key";--> statement-breakpoint
ALTER TABLE "entitlements"
  ALTER COLUMN "plan" TYPE "public"."plan_key"
  USING "plan"::text::"public"."plan_key";--> statement-breakpoint

DROP TYPE "public"."plan_key_old";
