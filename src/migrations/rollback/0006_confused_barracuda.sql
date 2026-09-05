-- Down migration for 0006_confused_barracuda.sql.
--
-- Also delete the matching row from drizzle.__drizzle_migrations, or Drizzle
-- will still consider 0006 applied and skip it on the next db:migrate.
REVOKE SELECT ON public.notes FROM anon, authenticated;
DROP TABLE IF EXISTS public.notes;
