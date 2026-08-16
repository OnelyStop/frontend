-- Reverses 0000_* and 0001_* together.
--
-- ⚠️ DISABLE THE AUTH HOOK FIRST.
-- Authentication → Hooks → Customize Access Token → None.
--
-- Dropping custom_access_token_hook while the hook is still wired means GoTrue
-- calls a missing function on every token issue. Logins and refreshes fail and
-- nobody can sign in, including you.
--
-- Drizzle is forward-only, so this is hand-maintained. Also delete the matching
-- rows from the drizzle.__drizzle_migrations table, or Drizzle will think these
-- are still applied.

DROP FUNCTION IF EXISTS public.authorize(public.app_permission);

REVOKE execute ON FUNCTION public.custom_access_token_hook(jsonb) FROM supabase_auth_admin;
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

REVOKE all ON TABLE public.user_roles FROM supabase_auth_admin;

DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.user_roles;

DROP TYPE IF EXISTS public.app_permission;
DROP TYPE IF EXISTS public.app_role;

-- Both should report 0.
SELECT count(*) AS leftover_tables FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('user_roles','role_permissions');
SELECT count(*) AS leftover_types FROM pg_type
WHERE typname IN ('app_role','app_permission');
