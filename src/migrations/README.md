# Migrations

Managed by [Drizzle](https://orm.drizzle.team). The schema lives in
[`src/db/schema/`](../db/schema/) — edit those files, not the SQL.

```
src/migrations/
  0000_schema.sql                 types, tables, indexes, RLS and policies
  0001_functions_and_grants.sql   everything drizzle cannot emit
  meta/                           Drizzle's state — never edit by hand
  rollback/                       hand-written down migrations
```

## What drizzle cannot emit

`db:generate` reads `src/db/schema/` and writes tables, indexes, `ENABLE ROW
LEVEL SECURITY` and policies. It never writes:

- **GRANT or REVOKE.** Postgres checks grants before RLS, so a policy without a
  grant returns zero rows — which reads as "this user has no data", not as a
  denial. Supabase also grants `ALL` on every new public table to `anon` and
  `authenticated` by default, so a migration that says nothing is not neutral.
- **Foreign keys into `auth.users`.** That schema is not in the drizzle model.
  Without them, deleting a user leaves their rows behind and closing an account
  stops erasing anything.
- **Functions and triggers** — `is_admin`, `authorize`, `handle_new_user`,
  `touch_updated_at`.

All of it lives in `0001`. **Regenerating drops it silently**: `db:generate`
rewrites the SQL from the schema alone, so check `git diff` before committing
and keep the hand-written file.

## Everyday flow

```bash
# 1. edit src/db/schema/*.ts
bun run db:generate    # writes the SQL for you
bun run db:migrate     # applies pending migrations
```

Add the new file to `rollback/` by hand in the same commit. `db:migrate` uses
`DIRECT_URL` when set — the pooler cannot run DDL.

## Privileges

Nothing in this app reaches Postgres as `anon` or `authenticated` except two
RBAC lookups through supabase-js; everything else runs as the `DATABASE_URL`
role. So the only grants are `SELECT` on `user_roles` and `role_permissions`,
plus `EXECUTE` on the two authorization functions.

RLS is still enabled on every table, as a backstop rather than as the check.
`policy-grants.test.ts` holds that line: it fails on any grant to `anon`, any
grant to `authenticated` outside those two tables, and any write grant at all.

## Rollbacks

Hand-written, one per forward migration, and not run by anything automatically.
A rollback that destroys data says `DESTRUCTIVE` at the top and what is lost;
the test enforces that marker on any file containing a drop or delete.

They are a recovery aid, not a plan. For a migration that ships broken against
real data, the plan is a Supabase point-in-time restore.

After running one, delete its row or drizzle still counts the migration as
applied:

```sql
delete from drizzle.__drizzle_migrations where hash like '%0001_functions_and_grants%';
```
