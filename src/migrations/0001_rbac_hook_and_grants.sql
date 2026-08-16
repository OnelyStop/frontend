-- Everything drizzle-kit can't generate from schema.ts: the plpgsql auth hook,
-- the authorize() helper, grants to Supabase-managed roles, the FK into the
-- auth schema, and seed rows.
--
-- After applying, enable the hook in the dashboard:
--   Authentication → Hooks → Customize Access Token → public.custom_access_token_hook
-- Until that is set, no token carries a role and every admin check fails closed.

-- Drizzle can't model a reference into the auth schema, so the FK is added here.
ALTER TABLE "user_roles"
  ADD CONSTRAINT "user_roles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;
--> statement-breakpoint

-- Copies the role into every access token as a `user_role` claim.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
  declare
    claims jsonb;
    user_role public.app_role;
  begin
    select role into user_role
    from public.user_roles
    where user_id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;

    event := jsonb_set(event, '{claims}', claims);
    return event;
  end;
$$;
--> statement-breakpoint

GRANT usage ON SCHEMA public TO supabase_auth_admin;
--> statement-breakpoint
GRANT execute ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
--> statement-breakpoint
REVOKE execute ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
--> statement-breakpoint
GRANT all ON TABLE public.user_roles TO supabase_auth_admin;
--> statement-breakpoint
REVOKE all ON TABLE public.user_roles FROM authenticated, anon, public;
--> statement-breakpoint

-- Called from RLS policies on content tables, e.g.
--   USING ((select authorize('questions.delete')))
CREATE OR REPLACE FUNCTION public.authorize(requested_permission public.app_permission)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
declare
  bind_permissions int;
  user_role public.app_role;
begin
  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;

  if user_role is null then
    return false;
  end if;

  select count(*)
  into bind_permissions
  from public.role_permissions
  where role_permissions.permission = requested_permission
    and role_permissions.role = user_role;

  return bind_permissions > 0;
end;
$$;
--> statement-breakpoint

INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin',  'questions.create'),
  ('admin',  'questions.update'),
  ('admin',  'questions.delete'),
  ('admin',  'papers.import'),
  ('admin',  'users.read'),
  ('editor', 'questions.create'),
  ('editor', 'questions.update')
ON CONFLICT (role, permission) DO NOTHING;
--> statement-breakpoint

-- Grants the first admin by email. Silently inserts nothing if that account
-- has not signed up yet — verify with the SELECT in the README.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'onelystop@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
