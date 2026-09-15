-- DESTRUCTIVE: deactivates every live-mode plan row. The narrow index cannot be rebuilt
-- while a test row and a live row share a slot, so one set has to go, and 'test' is the
-- set that existed before 0010. The Razorpay live plans themselves survive and cannot be
-- deleted, so re-running the seeder with live keys adopts them rather than duplicating.
UPDATE "payment_plans" SET "active" = false WHERE "razorpay_mode" = 'live';--> statement-breakpoint
DROP INDEX "payment_plans_active_slot_key";--> statement-breakpoint
ALTER TABLE "payment_plans" DROP COLUMN "razorpay_mode";--> statement-breakpoint
DROP TYPE "public"."razorpay_mode";--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plans_active_slot_key" ON "payment_plans" USING btree ("plan","interval","currency") WHERE "payment_plans"."active";
