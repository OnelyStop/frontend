-- Hand-written: drizzle emits ADD COLUMN ... NOT NULL with no default, which fails on a
-- table that already holds rows. The default exists only to backfill and is dropped again,
-- so every future row has to say which mode it belongs to.
--
-- All eight existing ids resolve under the test key and none under the live one, so 'test'
-- is the truthful backfill rather than a convenient one.
CREATE TYPE "public"."razorpay_mode" AS ENUM('test', 'live');--> statement-breakpoint
DROP INDEX "payment_plans_active_slot_key";--> statement-breakpoint
ALTER TABLE "payment_plans" ADD COLUMN "razorpay_mode" "razorpay_mode" NOT NULL DEFAULT 'test';--> statement-breakpoint
ALTER TABLE "payment_plans" ALTER COLUMN "razorpay_mode" DROP DEFAULT;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plans_active_slot_key" ON "payment_plans" USING btree ("plan","interval","currency","razorpay_mode") WHERE "payment_plans"."active";
