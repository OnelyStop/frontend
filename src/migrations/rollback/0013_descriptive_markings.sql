-- Reverses 0013_descriptive_markings.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0013
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0013_descriptive_markings%';
--
-- Every marking a learner paid for is destroyed by this, and ai_usage still
-- counts the calls, so the allowance is not returned with them.

DROP TABLE IF EXISTS public.descriptive_markings;
