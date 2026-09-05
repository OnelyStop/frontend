-- Reverses 0009_topics_slug_unique.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0009
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0009_topics_slug_unique%';

DROP INDEX IF EXISTS "topics_slug_key";
CREATE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
