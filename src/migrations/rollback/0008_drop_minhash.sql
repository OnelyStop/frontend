-- Reverses 0008_drop_minhash.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0008
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0008_drop_minhash%';

ALTER TABLE "articles" ADD COLUMN "minhash_signature" bytea;
