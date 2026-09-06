-- Everything drizzle cannot emit: auth is a schema it does not model, and
-- privileges are not in its model at all.

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey"
  FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "descriptive_markings" ADD CONSTRAINT "descriptive_markings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "doubts" ADD CONSTRAINT "doubts_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "doubt_stuck" ADD CONSTRAINT "doubt_stuck_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_topic_stats" ADD CONSTRAINT "user_topic_stats_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint

ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_amount_minor_positive"
  CHECK ("amount_minor" > 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_minor_positive"
  CHECK ("amount_minor" > 0);--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.authorize(requested_permission public.app_permission)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = (SELECT auth.uid())
      AND rp.permission = requested_permission
  );
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name',
                         NEW.raw_user_meta_data ->> 'name', '')), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();--> statement-breakpoint

INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin',  'questions.create'),
  ('admin',  'questions.update'),
  ('admin',  'questions.delete'),
  ('admin',  'papers.import'),
  ('admin',  'users.read'),
  ('editor', 'questions.create'),
  ('editor', 'questions.update')
ON CONFLICT (role, permission) DO NOTHING;--> statement-breakpoint

-- Inserts nothing until that account exists; re-run this statement after signup.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'onelystop@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;--> statement-breakpoint

-- Nothing reaches Postgres as anon or authenticated except the two lookups
-- below; everything else runs as the DATABASE_URL role. Supabase grants ALL on
-- every new public table to both, so this has to be taken back explicitly.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;--> statement-breakpoint
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;--> statement-breakpoint

GRANT SELECT ON public.user_roles TO authenticated;--> statement-breakpoint
GRANT SELECT ON public.role_permissions TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.authorize(public.app_permission) TO authenticated;
