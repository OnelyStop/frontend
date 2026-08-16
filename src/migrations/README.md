# Migrations

Managed by [Drizzle](https://orm.drizzle.team). The schema lives in
[`src/db/schema.ts`](../db/schema.ts) — edit that, not the SQL.

```
src/migrations/
  0000_*.sql          generated from schema.ts
  0001_*.sql          --custom: plpgsql, grants, seeds
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

| Var | Port | Used by | Why |
|---|---|---|---|
| `DATABASE_URL` | 6543 | the app at runtime | Transaction pooler — serverless exhausts direct connections |
| `DIRECT_URL` | 5432 | `drizzle-kit` | The pooler rejects some DDL |

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

## Dashboard step after 0001

**Authentication → Hooks → Customize Access Token → `public.custom_access_token_hook`**

Until this is set, no token carries a `user_role` claim and every admin check
fails closed. Sign out and back in afterwards — the hook only runs when a token
is issued.

Verify:

```sql
select u.email, r.role
from public.user_roles r
join auth.users u on u.id = r.user_id;
```

Expect one row: `onelystop@gmail.com | admin`. Zero means that account hasn't
signed up yet — create it, then re-run the INSERT at the bottom of `0001`.

## Rolling back

Drizzle is **forward-only** — it generates no down migrations. `rollback/` is
hand-maintained. Read the header of the file before running it; some need a
dashboard change first, and you must also delete the matching rows from
`drizzle.__drizzle_migrations` or Drizzle will still consider them applied.
