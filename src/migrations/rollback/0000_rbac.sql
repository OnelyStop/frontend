-- Reverses 0000_rbac.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- Also delete the matching row from drizzle.__drizzle_migrations afterwards,
-- or Drizzle will still consider the migration applied:
--   delete from drizzle.__drizzle_migrations;

DROP FUNCTION IF EXISTS public.authorize(public.app_permission);
DROP FUNCTION IF EXISTS public.is_admin();

DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.user_roles;

DROP TYPE IF EXISTS public.app_permission;
DROP TYPE IF EXISTS public.app_role;

-- Both should report 0.
SELECT count(*) AS leftover_tables FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('user_roles','role_permissions');
SELECT count(*) AS leftover_types FROM pg_type
WHERE typname IN ('app_role','app_permission');
