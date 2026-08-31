# Migrations

Managed by [Drizzle](https://orm.drizzle.team). The schema lives in
[`src/db/schema.ts`](../db/schema.ts) — edit that, not the SQL.

```
src/migrations/
  0000_rbac.sql       the whole role setup, one file
  meta/               Drizzle's state — never edit by hand
  rollback/           hand-written down migrations
```

## Everyday flow

```bash
# 1. edit src/db/schema.ts
bun run db:generate    # writes the SQL for you
bun run db:migrate     # applies pending migrations
```

`db:generate` needs no database. `db:migrate` does.

## Environment

Two connection strings, from Supabase → Settings → Database:

| Var            | Port | Used by            | Why                                                         |
| -------------- | ---- | ------------------ | ----------------------------------------------------------- |
| `DATABASE_URL` | 6543 | the app at runtime | Transaction pooler — serverless exhausts direct connections |
| `DIRECT_URL`   | 5432 | `drizzle-kit`      | The pooler rejects some DDL                                 |

`postgres.js` is configured with `prepare: false`, which the transaction pooler
requires.

## What Drizzle can't generate

Anything in `0001_*` was written by hand via `drizzle-kit generate --custom`:

- the plpgsql `custom_access_token_hook`
- `authorize()` — `security definer` with a pinned `search_path`
- grants and revokes to `supabase_auth_admin`
- the foreign key into `auth.users` (Supabase-managed schema)
- seed rows

Keep writing those as custom migrations so they stay in the same pipeline.

## No dashboard steps

Migration 0002 removed the Custom Access Token Hook. The role is read straight
from `user_roles` — by RLS inside Postgres (a local index lookup), and by the
app on admin screens only. Nothing to enable in the dashboard.

Grant a role with SQL:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'someone@example.com'
on conflict (user_id, role) do nothing;
```

## Rolling back

Drizzle is **forward-only** — it generates no down migrations. `rollback/` is
hand-maintained. Read the header of the file before running it; some need a
dashboard change first, and you must also delete the matching rows from
`drizzle.__drizzle_migrations` or Drizzle will still consider them applied.

## Supabase URL configuration

Auth cookies are per-origin, so every origin you sign in from must be listed at
**Authentication → URL Configuration → Redirect URLs**:

```
http://localhost:3000/auth/callback     # local dev
https://<your-domain>/auth/callback     # production
```

Miss one and sign-in appears to work but no cookie is written for that origin —
the server then sees no session, and every protected route redirects to /login.
That looks exactly like a broken permission check, so verify the session before
touching grants or RLS.
