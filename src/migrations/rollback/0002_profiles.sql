-- Reverses 0002_profiles.sql. Drizzle is forward-only, so this is hand-written.
--
-- This DESTROYS every user's profile and exam target. There is no other copy:
-- display_name can be rebuilt from auth.users, but bio, country and every exam
-- target only exist here. Dump the two tables before running this if the data
-- matters.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations, or
-- Drizzle will still consider the migration applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0002_profiles%';

-- The trigger lives on a Supabase-managed table, so drop it before the function
-- it calls -- otherwise signup raises on a missing function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.touch_updated_at();

-- Targets first: user_exam_targets.exam_id is ON DELETE RESTRICT, so exams
-- will not drop while any target references it.
DROP TABLE IF EXISTS public.user_exam_targets;
DROP TABLE IF EXISTS public.exams;
DROP TABLE IF EXISTS public.profiles;

-- Should report 0.
SELECT count(*) AS leftover_tables FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('profiles','exams','user_exam_targets');

-- Should report 0. A leftover trigger on auth.users breaks every future signup.
SELECT count(*) AS leftover_triggers FROM pg_trigger
WHERE tgname IN ('on_auth_user_created','profiles_touch_updated_at')
  AND NOT tgisinternal;
