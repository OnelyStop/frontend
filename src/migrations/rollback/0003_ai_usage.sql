-- Reverses 0003_ai_usage.sql. Drizzle is forward-only; this is hand-written.
--
-- DESTRUCTIVE: this is the only record of what each user's AI calls cost.
-- Afterwards delete the row from drizzle.__drizzle_migrations or 0003 still
-- counts as applied.

DROP TABLE IF EXISTS public.ai_usage;

SELECT count(*) AS leftover FROM information_schema.tables
WHERE table_schema='public' AND table_name='ai_usage';
