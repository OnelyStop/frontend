-- Reverses 0006_community.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- DESTRUCTIVE: drops every doubt and every stuck mark.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0006
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0006_community%';

DROP TABLE IF EXISTS "doubt_stuck";
DROP TABLE IF EXISTS "doubts";
