-- Local-dev shim. The migrations in src/migrations were written for Supabase and
-- reference auth.users, auth.uid(), and the authenticated / anon / service_role
-- roles. Supabase provisions those; a bare Postgres does not, so a plain
-- `docker run postgres` cannot apply this repo's migrations. This file recreates
-- just enough of that surface for local development and the content importer.
--
-- It is NOT a security model. auth.uid() reads an unverified GUC. Production runs
-- against the real managed database where these objects already exist.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END
$$;

GRANT anon, authenticated, service_role TO postgres;

CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON auth.users TO authenticated, service_role;

-- Supabase resolves the current user from the request JWT. Locally there is no
-- JWT, so this reads a GUC a caller can set with
--   SET LOCAL request.jwt.claims = '{"sub":"<uuid>"}';
-- Returns NULL when unset, which is the signed-out case.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'role',
    'anon'
  );
$$;

-- A local test/dev user so the importer and a signed-in session have something
-- to hang foreign keys off. Harmless if it already exists.
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@onelystop.local',
  '{"full_name":"Dev User"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
