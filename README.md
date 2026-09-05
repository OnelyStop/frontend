# onelystop

Frontend for onelystop — mocks under sectional timing, drills, daily current affairs, descriptive marking and a doubts community for IBPS, SBI and RBI exam prep.

## Stack

- Next.js App Router + React + TypeScript
- Supabase for auth, Postgres via Drizzle
- Razorpay subscriptions
- Tailwind and an in-repo design system

## Where things are written down

|                                                                |                                 |
| -------------------------------------------------------------- | ------------------------------- |
| [`AGENTS.md`](AGENTS.md)                                       | the gates a change goes through |
| [`STANDARDS.md`](STANDARDS.md)                                 | how code is written here        |
| [`DESIGN.md`](DESIGN.md)                                       | the design system               |
| [`docs/quality-gates.md`](docs/quality-gates.md)               | what CI checks, and why those   |
| [`docs/rendering.md`](docs/rendering.md)                       | server and client rendering     |
| [`src/migrations/README.md`](src/migrations/README.md)         | migrations                      |
| [`gazette-migrations/README.md`](gazette-migrations/README.md) | local Gazette migrations        |

## Local development

```bash
bun install
bun run dev
```

Build:

```bash
bun run build
bun run start
```

## Git hooks

Husky installs them on `bun install` — there is nothing to run by hand.

| Hook         | What it does                                                              | Cost    |
| ------------ | ------------------------------------------------------------------------- | ------- |
| `pre-commit` | formats the files you staged, then the source guards and the layout check | ~1.5s   |
| `pre-push`   | types and tests, and refuses a direct push to `main`                      | ~15s    |
| `commit-msg` | strips AI co-author trailers                                              | instant |

The split is deliberate: anything slower than a second or two in `pre-commit`
gets bypassed with `--no-verify`, and a hook people skip is worse than none
because it looks like cover.

None of them is enforcement — `--no-verify` skips all three, and CI plus the
`protect-main` ruleset are what gate a merge. They exist to save the round trip.

Run the same checks by hand:

```bash
bun run format        # write
bun run format:check  # CI's version
bun run check:layout
bun run check:source
```

## Deploy

Vercel, framework preset **Next.js**. The build output is `.next` — Next.js
does not produce a `dist` directory.

If a deploy fails with _"The Next.js output directory `dist` was not found"_,
the project still has Vite's build settings saved in the dashboard. Fix at
**Settings → Build and Deployment**:

| Setting          | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Framework Preset | Next.js                                                    |
| Build Command    | `bun run build` (or default)                               |
| Output Directory | **clear the override** — leave it as the framework default |
| Install Command  | default (`bun.lock` is detected)                           |

Required environment variables — note the `NEXT_PUBLIC_` prefix, not `VITE_`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

These are inlined at build time, so **changing them requires a redeploy**.
`DATABASE_URL` is only needed for migrations, not at runtime.

Supabase → Authentication → URL Configuration → Redirect URLs must include
both of these, or sign-in silently writes no cookie and password resets land
on Site URL:

```
https://<your-domain>/auth/callback
https://<your-domain>/reset-password
```

Email links only work on any device if the templates (Confirm signup, Reset
password, Magic link, Invite) point at the token-hash route instead of the
default PKCE callback:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
```

with `type` set to `recovery`, `magiclink` or `invite` in the other templates.
`/auth/callback` stays for Google sign-in.

## Feature routes

| Route                                  | Feature                                              |
| -------------------------------------- | ---------------------------------------------------- |
| `/`, `/privacy`, `/terms`              | Public pages, server-rendered for SEO                |
| `/login`, `/signup`, `/reset-password` | Auth; `/auth/callback` (OAuth) and `/auth/confirm`   |
| `/home`                                | Today — every section against its cutoff             |
| `/attempt-map`                         | Accuracy against pace: what to bank and what to skip |
| `/mocks`, `/drills`                    | Full papers under sectional timing; short timed sets |
| `/study`                               | Knowledge base                                       |
| `/current-affairs`                     | One grounded question per story, daily               |
| `/flashcards`, `/notes`                | Recall                                               |
| `/progress`, `/descriptive`            | Progress; letter and essay marking                   |
| `/community`                           | Doubts ranked by how many are stuck                  |
| `/profile`, `/settings`, `/upgrade`    | Account and billing                                  |
| `/admin`                               | Role-gated via `requireRole()`                       |
