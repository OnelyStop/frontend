-- DESTRUCTIVE: the whole database. Only papers, questions and notes are re-importable.
-- Afterwards: delete from drizzle.__drizzle_migrations where hash like '%0000_schema%';

DROP SCHEMA IF EXISTS public CASCADE;--> statement-breakpoint
CREATE SCHEMA public;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
