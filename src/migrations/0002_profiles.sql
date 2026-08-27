CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"bio" text,
	"country" char(2) DEFAULT 'IN' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "signed-in users can read their own profile" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "profiles"."id");--> statement-breakpoint
CREATE POLICY "signed-in users can update their own profile" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "profiles"."id") WITH CHECK ((select auth.uid()) = "profiles"."id");
-- Hand-written: drizzle-kit generates none of the below. Do not regenerate.

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_fkey"
  FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;
--> statement-breakpoint

-- Postgres checks GRANTs before RLS: without this the policies never run and
-- every lookup returns zero rows, reading as missing data rather than denial.
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
--> statement-breakpoint
REVOKE ALL ON public.profiles FROM anon;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
--> statement-breakpoint

-- display_name comes from user-writable metadata: fine for a name, and the
-- reason no column here is ever read to authorize.
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
$$;
--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint

INSERT INTO public.profiles (id, display_name)
SELECT id,
       NULLIF(TRIM(COALESCE(raw_user_meta_data ->> 'full_name',
                            raw_user_meta_data ->> 'name', '')), '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
