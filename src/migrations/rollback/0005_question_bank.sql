-- Down migration for 0005_question_bank.sql. Drops in dependency order; the
-- enum goes last because attempts references it.
--
-- Also delete the matching row from drizzle.__drizzle_migrations, or Drizzle
-- will still consider 0005 applied and skip it on the next db:migrate.
DROP TABLE IF EXISTS public.user_topic_stats;
DROP TABLE IF EXISTS public.attempt_answers;
DROP TABLE IF EXISTS public.attempts;
DROP TABLE IF EXISTS public.bank_questions;
DROP TABLE IF EXISTS public.directions;
DROP TABLE IF EXISTS public.papers;

DROP TYPE IF EXISTS public.attempt_mode;
