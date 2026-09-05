-- Reverses 0005_profile_fields.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- DESTRUCTIVE: drops school, target_year, exam_board and default_section from
-- every profile.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0005
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0005_profile_fields%';

ALTER TABLE "profiles" DROP CONSTRAINT "profiles_target_year_check";
ALTER TABLE "profiles" DROP COLUMN "default_section";
ALTER TABLE "profiles" DROP COLUMN "exam_board";
ALTER TABLE "profiles" DROP COLUMN "target_year";
ALTER TABLE "profiles" DROP COLUMN "school";
DROP TYPE "public"."exam_section";
DROP TYPE "public"."exam_board";
