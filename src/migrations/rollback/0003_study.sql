-- Reverses 0003_study.sql. Drizzle is forward-only, so this is hand-maintained.
--
-- DESTRUCTIVE: drops the entire study module — all imported content, plus every
-- user's notes, progress and tutor conversations. The content is re-importable
-- from content/*.topic.json; the user rows are not.
--
-- Afterwards delete the matching row from drizzle.__drizzle_migrations or 0003
-- still counts as applied:
--   delete from drizzle.__drizzle_migrations where hash like '%0003_study%';

-- Children before parents; CASCADE mops up the foreign keys into auth.users and
-- between the content tables.
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.study_progress CASCADE;
DROP TABLE IF EXISTS public.user_notes CASCADE;
DROP TABLE IF EXISTS public.content_assets CASCADE;
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.content_block_sources CASCADE;
DROP TABLE IF EXISTS public.content_blocks CASCADE;
DROP TABLE IF EXISTS public.content_sources CASCADE;
DROP TABLE IF EXISTS public.content_versions CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.chapters CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;

DROP TYPE IF EXISTS public.flashcard_status;
DROP TYPE IF EXISTS public.moderation_status;
DROP TYPE IF EXISTS public.note_visibility;
DROP TYPE IF EXISTS public.content_status;

-- Both should report 0.
SELECT count(*) AS leftover_tables FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'subjects','chapters','topics','content_versions','content_blocks',
    'content_sources','content_block_sources','flashcards','user_notes',
    'study_progress','chat_conversations','chat_messages','content_assets'
  );
SELECT count(*) AS leftover_types FROM pg_type
WHERE typname IN (
  'content_status','note_visibility','moderation_status','flashcard_status'
);
