-- Fixes /admin redirecting an actual admin back to /home.
--
-- Migration 0001 revoked all privileges on user_roles from `authenticated`,
-- which was right while only the auth hook read the table. Once the app started
-- querying it directly that became a bug: Postgres checks table GRANTs before
-- RLS, so with no SELECT grant the "read your own role" policy never ran and
-- every lookup came back empty — indistinguishable from "not an admin".
--
-- The grant is safe on its own. RLS still restricts each user to their own row.

GRANT SELECT ON public.user_roles TO authenticated;
--> statement-breakpoint

-- anon has no reason to read either table.
REVOKE ALL ON public.user_roles FROM anon;
--> statement-breakpoint
REVOKE ALL ON public.role_permissions FROM anon;
--> statement-breakpoint

-- Content-table policies call these; they're SECURITY DEFINER so they work
-- regardless of the caller's grants.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.authorize(public.app_permission) TO authenticated;
