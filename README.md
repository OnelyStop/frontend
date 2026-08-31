# onelystopp

Frontend for the onelystopp revision platform — question bank, PYQ mixes, AI exams, answer marking, diagrams, interview practice, and progress tools.

## Stack

- Vite + React + TypeScript
- React Router
- Design system matched to the Uxcel-inspired reference in `public/inspiration-uxcel.png`

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

Supabase → Authentication → URL Configuration → Redirect URLs must include the
deployed callback, or sign-in silently writes no cookie:

```
https://<your-domain>/auth/callback
```

## Feature routes

| Route            | Feature                             |
| ---------------- | ----------------------------------- |
| `/`              | Home study path                     |
| `/question-bank` | Question bank                       |
| `/past-papers`   | Past paper finder                   |
| `/pyq-mix`       | PYQ mix generator                   |
| `/ai-exams`      | AI-curated exams                    |
| `/theory`        | Theory & tricks                     |
| `/revision`      | Revision guide                      |
| `/marker`        | Answer / Essay / Long Answer Marker |
| `/diagrams`      | Diagram generator                   |
| `/interview`     | AI Interview                        |
| `/tutor`         | AI tutor                            |
| `/progress`      | Progress tracker                    |
| `/memory`        | A* memory                           |
| `/notes`         | Sticky notes                        |
