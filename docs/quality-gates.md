# Quality gates

What runs, where, and what each one is for. `STANDARDS.md` is the rules;
this is their enforcement.

## What runs where

| | pre-commit ~1.5s | pre-push ~15s | CI |
| --- | --- | --- | --- |
| PR closes an issue | | | ✓ |
| Prettier | staged files | | whole repo |
| Layout | ✓ | | ✓ |
| Source guards (12) | ✓ | | ✓ |
| Types | | ✓ | ✓ |
| Tests | | ✓ | ✓ |
| Build | | | ✓ |
| Dependency advisories | | | ✓ |
| Schema ↔ migrations | | | ✓ |
| No direct push to `main` | | ✓ | ruleset |
| Attribution trailers | commit-msg | | |

Husky installs the hooks from `prepare`, which bun runs. There is no
"remember to run this once" step, because that is the step that does not
happen.

The split is a budget. Anything slower than a second or two in `pre-commit`
gets bypassed with `--no-verify`, and a hook people skip is worse than none
because it looks like cover. Hooks are a convenience — CI and the
`protect-main` ruleset are the enforcement.

## Why these, and not a linter

**ESLint cannot run in this repo.** `eslint-config-next` loads
typescript-eslint, which refuses TypeScript 7 outright
([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940));
even `next/core-web-vitals` alone fails, so it is not a config problem.
**SonarQube hits the same wall** — SonarJS supports TypeScript "up to 5.9.3".

Nothing here requires TS 7 (Next's own minimum is 5.1), so this is a choice
that currently costs the whole static-analysis ecosystem. Until it is
revisited, `tsc` strictness and the greps in `scripts/check-source.sh` stand
in for it. Do not spend time trying to make either tool run.

## The gates

**PR closes an issue.** `AGENTS.md` Gate 0, enforced. Runs before install, so
a PR missing its issue fails in seconds. The exceptions Gate 0 names — a typo,
a revert, a fix for something already broken on `main` — carry the `no-issue`
label. Note GitHub registers a closing reference only when the base is the
default branch, so a stacked PR shows none.

**Types.** `strict`, plus `noUnusedLocals`, `noUnusedParameters`,
`noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`. Each
was measured before being enabled. Not on: `noUncheckedIndexedAccess` (61
errors, its own piece of work) and `exactOptionalPropertyTypes` (2, both
friction with Next's `Link` and `fetch` overloads).

**Tests, and the count.** A suite that runs nothing exits 0, so the number is
checked too. The ANSI strip in that step is load-bearing — vitest colours the
summary in CI but not through a local pipe, so a pattern that works on a laptop
matches nothing in Actions.

**Build.** `tsc` type-checks; it does not build. A bad import, a route that
fails to compile, a server/client boundary violation — all pass types and break
on deploy, where finding out costs a Vercel round trip.

**Layout.** `scripts/check-layout.mjs`. No file outside the folder that owns
it, no invented `src/` layer, no `.tsx` under `lib/`, `db/`, `config/` or
`data/`.

**Schema and migrations agree.** Asks drizzle by running `db:generate` and
failing if it produces anything, rather than comparing which filenames a PR
touched — the filename version failed on a PR that only reformatted
`schema.ts`.

**Source guards.** Twelve greps in `scripts/check-source.sh`, shared by CI and
the hook so two copies cannot disagree: focused or skipped tests, `debugger`,
`console.log`, commented-out code, banner comments, `@ts-ignore`, a
`NEXT_PUBLIC_` secret, a stray `NEXT_PUBLIC_` key, a live key or connection
string, a secret assigned a literal, a decimal amount, `parseFloat` on money,
and a TODO with no ticket.

The highest-value one is `.only`: it narrows a run to a single test and still
exits 0, so CI goes green having stopped checking almost everything.

**Dependencies.** `scripts/check-deps.mjs` fails on a high or critical
advisory and reports the rest. The threshold is deliberate: the tree carries a
moderate dev-only advisory today, and a gate that is red the day it lands gets
bypassed rather than fixed.

**In the test suite.** A table created without RLS, and a migration with no
rollback.

## Outside CI

GitHub's own features are on for both repos, and they are free because the
repos are public:

- **Secret scanning with push protection.** This blocks a push carrying a
  recognised credential, against GitHub's catalogue of hundreds of provider
  formats. `check-source.sh` knows four patterns that we wrote; this is the
  wider net, and it stops the push rather than reporting after.
- **Dependabot security updates and vulnerability alerts.**

History was scanned once when these were turned on: no credential has ever
been committed, and `.env.local` has never been tracked.

## Adding a gate

**A green check proves nothing until it can go red.** Plant a violation, watch
it fail, restore it, watch it pass. Assert the premise too — if the parser
stops matching, every assertion below it passes vacuously.

This repo has shipped four checks that reported success while testing nothing:

- a grep using `\b` under `git grep -E`, where POSIX ERE has no word boundary,
  so every pattern matched zero lines and reported clean
- a test-count guard that matched locally and never in CI, because vitest
  colours that line only there
- a migration check comparing filenames, which failed on a PR that only
  reformatted `schema.ts`
- `policy-grants.test.ts`, which reads migration *text*: a `USING` clause
  comparing the wrong column passes it

Put a grep in `scripts/check-source.sh` so the hook gets it too. Put anything
needing real logic in a test.

## Known gaps

**No real database in CI.** The RLS tests read migration *text*. Only querying
a real Postgres as a real user proves a policy does what it says. This is the
biggest hole.

**Nothing checks React.** 59 files under `app/` and no rule reads them —
`react-hooks/exhaustive-deps` alone would catch a class of bug. That is the
cost of the TypeScript 7 choice.

**No spend cap on AI calls.** One user can run up the bill.

**Secret-scanning validity checks** stayed disabled — it did not take through
the API. It tells you whether a detected credential is still live, which is
worth turning on by hand in Settings → Code security.
