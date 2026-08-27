-- Reverses 0002_profiles.sql. Drizzle is forward-only; this is hand-written.
--
-- DESTRUCTIVE: bio, country and every exam target exist only here. Afterwards
-- delete the row from drizzle.__drizzle_migrations or 0002 still counts applied.

-- Before the function it calls, or signup raises on a missing function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.touch_updated_at();

-- Targets first: exam_id is ON DELETE RESTRICT.
DROP TABLE IF EXISTS public.user_exam_targets;
DROP TABLE IF EXISTS public.exams;
DROP TABLE IF EXISTS public.profiles;

-- Both must report 0; a leftover trigger on auth.users breaks every signup.
SELECT count(*) AS leftover_tables FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('profiles','exams','user_exam_targets');

SELECT count(*) AS leftover_triggers FROM pg_trigger
WHERE tgname IN ('on_auth_user_created','profiles_touch_updated_at')
  AND NOT tgisinternal;
