-- Removes the Custom Access Token Hook and reads the role straight from
-- user_roles instead.
--
-- The hook only existed to keep the role in the JWT so RLS wouldn't have to
-- query for it. But an RLS policy already runs inside Postgres, so reading
-- user_roles there is a local indexed lookup, not a network round trip. The
-- claim bought nothing and cost a manual dashboard step.
--
-- No dashboard change is needed. If the hook was ever enabled, disable it at
-- Authentication → Hooks → Customize Access Token → None. Safe either way:
-- the function is dropped last, and nothing reads its claim any more.

-- authorize() now resolves the role itself. SECURITY DEFINER lets it read
-- user_roles without tripping that table's own RLS.
CREATE OR REPLACE FUNCTION public.authorize(requested_permission public.app_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = (SELECT auth.uid())
      AND rp.permission = requested_permission
  );
$$;
--> statement-breakpoint

-- Convenience wrapper for plain role checks, e.g. USING (is_admin())
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;
--> statement-breakpoint

-- Indexed so the lookup above stays a single index hit as the table grows.
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);
--> statement-breakpoint

-- The app reads its own role through this policy; SECURITY DEFINER functions
-- bypass it, so RLS on content tables still works for everyone.
DROP POLICY IF EXISTS "signed-in users can read their own role" ON public.user_roles;
--> statement-breakpoint
CREATE POLICY "signed-in users can read their own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
--> statement-breakpoint

-- Nothing references the hook now.
DROP POLICY IF EXISTS "auth admin can read user roles" ON public.user_roles;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM supabase_auth_admin;
--> statement-breakpoint
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);
--> statement-breakpoint
REVOKE ALL ON TABLE public.user_roles FROM supabase_auth_admin;
