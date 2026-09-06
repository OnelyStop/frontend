-- Reverses 0012_ai_usage.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0012
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0012_ai_usage%';
--
-- Quota history is not recoverable: dropping this resets everyone's month.

DROP TABLE IF EXISTS public.ai_usage;
