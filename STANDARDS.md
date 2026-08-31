# Standards

How code is written in this repo. `AGENTS.md` is the process a change goes
through, `DESIGN.md` is the visual system, this is the code itself, and
`docs/quality-gates.md` is what CI checks.

Every rule here is enforced, load-bearing, or both. Where a check exists it is
named, because a rule nothing checks is a preference.

## Where code goes

```
src/app/            routes — Next.js owns these filenames
src/features/       one product area: tutor, billing, auth
src/components/     React shared across features
src/design-system/  the primitives — one entry point, see DESIGN.md
src/lib/            shared infrastructure a feature calls
src/config/         values, no behaviour
src/db/             schema and the client
src/data/           static data
src/context/        React context
src/migrations/     generated SQL and hand-written rollbacks
src/styles/         global CSS and tokens
```

`scripts/check-layout.mjs` rejects a file outside the folder that owns it, a
new top-level folder, and a `.tsx` under `lib/`, `db/`, `config/` or `data/` —
those layers must be callable from anywhere, so a component landing in one is
drift a diff will not show.

**The distinction that matters most:** `lib/` is infrastructure a feature
calls; `features/` is one product area. OpenRouter is in `lib/` because tutor,
marker and interview all use it. Razorpay is in `features/billing/` because
only billing does. When unsure, ask how many features will import it.

**Never invent a folder.** This repo already had an `src/infrastructure/`
duplicating `src/lib/`, caught only by a human reading the tree.

## Server and client

A route is two files:

```tsx
// app/(app)/mocks/page.tsx — server component
import type { Metadata } from "next";
import { MocksView } from "./mocks-view";

export const metadata: Metadata = { title: "Mocks" };
export default function Page() {
  return <MocksView />;
}
```

```tsx
// app/(app)/mocks/mocks-view.tsx — the client component
"use client";
```

`page.tsx` stays a server component so it can export `metadata` and fetch. The
`*-view.tsx` beside it carries `"use client"` and the interactivity. Do not put
`"use client"` on `page.tsx` — you lose metadata and server data fetching for
the whole route.

A module that must never reach the browser imports `server-only` at the top.
That turns a client import into a build error rather than a runtime surprise.
Name it `*.server.ts` so the boundary is visible in the file tree too.

## Writing an API surface

Every external service — Razorpay, OpenRouter, Supabase — follows the same
shape, because the same three things go wrong otherwise.

**Read credentials at call time, never at module load.**

```ts
function credentials() {
  const key = process.env.RAZORPAY_KEY_SECRET;
  if (!key) throw new Error("RAZORPAY_KEY_SECRET is not set");
  return key;
}
```

Reading at import means any route that merely shares a bundle with the file
crashes when the var is absent. That has taken this site down once.

**Keep secrets out of the config object.** `src/config/*.ts` holds values that
are safe to log. The key is read where it is used, so `console.log(config)`
while debugging cannot leak it.

**Return a domain shape, not the provider's.** `ask()` returns
`{ text, model, promptTokens, costMicros }`, not the raw response — the caller
should not unwrap `choices[0].message.content` and should not learn what
OpenRouter is.

**Typed failures, and never the provider's words.** Classify the error into a
small union the caller can branch on, keep the provider's message for the logs,
and write the user-facing copy yourself.

**Settings resolve call → instance → config.** A feature states its defaults
once when it constructs its client; a call names only what differs; anything
neither names comes from config. That is what makes a class worth having here —
two features configured differently at the same time.

## Money

Integer minor units — paise, cents. `7.99 * 100` is `798.9999…` in float64, and
a rounding error on a charge reads as ordinary code. `check:source` rejects a
decimal assigned to `amountMinor` and `parseFloat` on an amount.

Amount and currency come from the server: currency from the request host,
amount from `payment_plans`. Never from the request body, or a caller buys Pro
for one paisa.

## The database

**Every table gets RLS, a policy, and a grant.** Postgres checks GRANTs before
RLS, so a policy without a matching grant never runs — the query returns zero
rows, which reads as "this user has no data" rather than as a denial. A table
with no RLS at all is readable by anyone holding the anon key, which is public
by design.

Both are tested in `src/db/policy-grants.test.ts`.

**Never authorize from `user_metadata`** — it is user-writable, so a user can
promote themselves. Roles live in `user_roles`, access in
`entitlements.access_until`.

**Access is one column.** `access_until > now()`, nothing else. Not a
subscription status, not a payment row. Two sources of truth drift, and the
drift is invisible until someone gets Pro for free.

**Edit `schema.ts`, then run `bun run db:generate`.** Rollbacks are
hand-written because drizzle is forward-only; CI rejects a migration without
one, and asks drizzle whether the schema and migrations still agree.

## Styling

Tailwind for layout and one-offs. A colocated `.css` file when a component has
real structure — `MarketingLayout.css` beside `MarketingLayout.tsx`. Tokens in
`src/styles/tokens.css` and `src/design-system/styles/theme.css`.

Prefer a built-in utility to an arbitrary value: `size-8` over `h-[32px]
w-[32px]`, `max-w-full` over `max-w-[100%]`. Arbitrary values are for genuine
one-offs like `w-[calc(100%-2rem)]`.

Import primitives from the single entry point:

```ts
import { Button, Card, Stat } from "@/design-system";
```

See `DESIGN.md` before adding a component.

## Errors and logging

`src/lib/log.ts` writes one JSON object per line. Use it rather than
`console.log`, which `check:source` rejects outside tests.

**Log what happened, never what was said.** Model, duration, tokens, cost,
status. Never a prompt, a completion, or a student's answer — an operations log
is not a transcript, and there is a test asserting it.

## Tests

Colocated: `openrouter.test.ts` beside `openrouter.ts`.

Test behaviour that can fail silently, not that a library works. The tests
worth having here read migration SQL and assert a policy has its grant, or stub
`fetch` and assert a retry did not happen on a bad key.

**A green test proves nothing until it can go red.** Plant the violation, watch
it fail, restore, watch it pass. Assert the premise too — if a parser stops
matching, every assertion below it passes vacuously.

`fetch` stubs must return a **fresh** `Response` per call. A body reads once,
so sharing one across retries fails in a way real `fetch` never would.

Never commit `.only` or `.skip` — `.only` narrows the suite to one test and
still exits 0. `check:source` rejects both.

## Comments

Keep a comment only where its absence would let someone make a mistake that
fails **silently**. Delete anything that restates the code, explains what
rather than why, or defends an ordinary choice.

The ones that earn their place in this repo all mark a silent failure: a
spelling that joins to no questions, a missing grant that reads as missing
data, `costMicros` that looks like dollars, `408` that must stay retryable.

Density is not a quality signal. Section banners and commented-out code are
rejected by `check:source`.
