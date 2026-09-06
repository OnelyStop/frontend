-- Reverses 0000_schema.sql. Drizzle is forward-only, so this is hand-maintained.
-- Afterwards: delete from drizzle.__drizzle_migrations where hash like '%0000_schema%';
--
-- DESTRUCTIVE: this is the whole database. Every sitting, every payment, every
-- marking, the article corpus and the imported question bank. Papers, questions
-- and notes can be re-imported; nothing else can.

DROP SCHEMA IF EXISTS public CASCADE;--> statement-breakpoint
CREATE SCHEMA public;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
