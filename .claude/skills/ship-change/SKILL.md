---
name: ship-change
description: Take a change in this repo from triage to merged, verified PR — the gates in AGENTS.md, the checks that actually run here, and the traps this repo has already hit. Use whenever asked to build, fix, add or ship anything in onelystop/frontend, whether an issue number is named or the work arrives as conversation.
---

# Shipping a change in onelystop/frontend

State the checklist in your first response, before any code, and report each
item as it completes with the evidence. An unshown check reads the same as a
skipped one.

**Load this skill before touching the repo, every time.** Not only when an issue
number is named — a one-line fix asked for mid-conversation runs the same
checklist. If you are already editing files and have not stated the checklist,
you skipped step one; stop and state it.

## The checklist

| #   | Step                                           | Done when                                                               |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| 0   | Search for an existing issue                   | Searched open **and** closed; reopened or linked rather than duplicated |
| 1   | Triage to a priority                           | P0–P4 decided, and it decides steps 2 and 3                             |
| 2   | Issue only if major, labelled                  | P0–P2: issue open, labelled, linked. P3–P4: no issue, `no-issue` label  |
| 3   | One open PR — ride it unless the work is large | P3–P4 always commit onto the open PR                                    |
| 4   | Build against the plan                         | Scope stays inside what was asked                                       |
| 5   | Comment audit on the full diff                 | Every added or touched comment listed, justified or deleted             |
| 6   | Screenshots, if a pixel moved                  | Dropped in local `screenshots/`, then **stop** — Tushar looks first     |
| 7   | Verify every gate, naming real files           | `format:check`, `check:layout`, `check:source`, `tsc`, `test`, `build`  |
| 8   | Prove each new check can go red                | Violation planted, check fails, restored, check passes                  |
| 9   | Commit, push, PR, watch CI                     | Only when asked. CI green, `closingIssuesReferences` verified           |
| 10  | Land it: migrations, then production           | Migration applied, change observed live — not "CI passed"               |

## Step detail

### 0. Search before you file

Never open an issue without looking first. Duplicates split the argument across
two threads and both rot.

```bash
gh issue list --state all --search "<3-4 keywords from the symptom>" --limit 20
gh pr list --state all --search "<same>" --limit 10
```

Search the **symptom**, not your phrasing of the fix — "checkout 502", not
"add a mode column". Search closed too: a closed issue that is happening again
is a reopen with a comment, never a new number.

If one exists: comment the new evidence on it and work to that number.

### 1. Triage to a priority

The priority decides everything after it, so decide it out loud before opening
anything.

| Label | Test                                                                     | Issue?     | PR                      |
| ----- | ------------------------------------------------------------------------ | ---------- | ----------------------- |
| `P0`  | Production is broken **now** — users see it                              | Yes, first | Its own, immediately    |
| `P1`  | Significant: money, auth, schema, a third party, or a real design choice | Yes        | Its own                 |
| `P2`  | Normal feature or fix worth its own review                               | Yes        | Its own if none is open |
| `P3`  | Small: a guard, a rename, a copy fix, a one-file change                  | No         | **Onto the open PR**    |
| `P4`  | Trivial: typo, comment sweep, stale default, revert                      | No         | **Onto the open PR**    |

Two tests that settle most cases:

- **Could this reasonably be built two different ways?** Yes → P1 or P2, and the
  issue is where that argument happens.
- **Would writing it up restate Tushar's own words back at him?** Yes → P3 or P4.
  A fix he named in conversation is already decided.

When in doubt, go lower. A P3 that turns out to deserve an issue can have one
opened afterwards; an unnecessary issue is never reclaimed.

### 2. The issue, for P0–P2 only

Carries the Gate 1 output from `AGENTS.md`: prior art, security review,
production plan. Label **and assign** it on creation — an unassigned issue is
nobody's, and the priority is not a comment:

```bash
gh issue create --title "..." --body-file <file> --label P1 --assignee Tushar98644
```

Every issue is assigned to Tushar. He reassigns if it is going to someone else;
that is his call to make, not a blank field to leave.

Give each issue its own keyword — `Closes #12, closes #13`, never
`Closes #12, #13`, which closes one and leaves the other open silently.
**A closing reference only registers when the PR's base is the default branch.**
A stacked PR shows `closingIssuesReferences: []`, so verify it:

```bash
gh pr view <n> --json closingIssuesReferences
```

CI fails a PR that closes no issue before anything else runs, so a P3/P4 PR
needs the `no-issue` label at creation, not after CI goes red:

```bash
gh pr create --title "..." --body-file <file> --label no-issue
```

### 3. One open PR at a time

Check before you branch, always:

```bash
gh pr list --state open
```

`.husky/pre-push` refuses a brand-new branch while a PR is open and prints the
cherry-pick that moves the work across. `SHIP_NEW_PR=1 git push` overrides it —
use that only for P0, P1, or a large P2.

**If a PR is open and the work is P3 or P4, it commits onto that branch.** Not a
new one. Not "it's a different topic". A fix, a guard, a rename, a second thing
Tushar mentions while the first is in review — all of it rides along.

Open a second PR only for P0, P1, or a P2 large enough that adding it would bury
the review already in flight — a feature, a migration, a sweep across the repo.

Before committing onto an open PR, confirm it is still open; Tushar merges
mid-session. Re-run `gh pr list --state open` rather than trusting what you saw
ten minutes ago.

A stack of small PRs is the failure mode here. It has happened repeatedly, and
every one costs a review cycle on work that could have ridden along.

When you do branch, branch off `origin/main` explicitly — never a stale local
one, or the PR carries that branch's unmerged commits:

```bash
git fetch origin && git checkout -b <area>/<what> origin/main
```

`main` is protected: squash-only, one approving review, strict status checks.

A worktree is the right tool when the working tree holds someone else's
uncommitted work — `git worktree add -q /tmp/x --detach origin/<branch>`, then
symlink `node_modules` to run anything. Remove it afterwards.

### 4. Build only what was asked

Extra layers, tables and abstractions get rejected here, and rightly. If a
guard, a table or an interface seems needed but was not named, say it belongs in
its own issue and leave it out.

### 5. Comment audit

Run `git diff origin/main...HEAD`, list every comment added **or touched**, and
for each ask whether its absence would let someone make a mistake that fails
silently. Not "could this be useful" — only the ones you cannot do without. If
it restates the code, explains what rather than why, or defends an ordinary
choice, delete it. One line where one line does. Match the density of the file
you are in — a file with no comments is telling you its convention.

The repo holds **1.5%** of non-blank lines as comments, 1.7–1.8% is fine, and
**2% is the ceiling** — past it, stop and delete. It reads 1.65% today; the
measuring command is in `AGENTS.md` Gate 2.

**The bar for a comment in your diff is higher than that average.** Default to
deleting it. A new comment survives only by naming something the reader would
otherwise get wrong — not because it might help. Most PRs here should add none.

Run it as its own pass. The comment that felt necessary mid-edit almost never
survives being read back: two passes in this repo cut 86 comment lines to 22,
then 21 to 10, and both files read better after.

Diff the deletions too. A pre-existing comment removed by accident is invisible
in a green test run:

```bash
git diff origin/main...HEAD | grep -E "^-" | grep -E "//|/\*"
```

### 6. A UI change stops for Tushar's eyes

This is a gate, not a deliverable. The order is:

1. Empty `screenshots/` at the root of his working directory — that folder, and
   not a worktree he cannot see.
   ```bash
   rm -rf screenshots/* && mkdir -p screenshots
   ```
2. Shoot before and after at 1440x900 and 390x844, `deviceScaleFactor: 2`.
3. Tell him they are there and **stop**. No commit, no push, no PR.
4. Only when he says it is good does the work get committed.

`screenshots/` is gitignored and always has been — that is the point. It is the
folder he opens, and it is the only one: screenshots are never committed, so a
PR body describes the change in words rather than linking an image.

Putting the shots anywhere he has not checked out is the same as not showing
him: his working tree is usually on another branch entirely.

Screenshot the page and look at it yourself first. Never judge a layout from the
classes you just wrote, and never describe it to him instead of showing it.

**At most one white card per page, and prefer none.** A page built out of white
rectangles is the generic template the product is trying not to look like. Count
`<Card>` on any page you touch: more than one plain white card is a bug, not a
judgement call. Reach for, in order:

- **Nothing.** Rows on the stage, separated by a hairline — `Divider`, a
  `border-b`, a `Spine`. Most lists and settings need no surface at all.
- **Identity tint.** `IndexCard` / `EventCard` in the subject's own colour.
  Tint is identity, never a container, never a state.
- **A recessed panel.** `inset-panel` for a plot or a table.
- **The black card.** `Card tone="ink"`, for the one sentence that closes a
  page. Still counts as the page's one card.

Never rebuild a card by hand — `card`, `card-lift`, `inset-panel` and `ruled`
are `@utility` rules in `theme.css`. A white box assembled from
`border-line rounded-card border p-6` is the previous language.

A grid of tinted cards walks the palette by loop index, never by hash: `tintFor`
hashes, which put the same tint in the same column twice running on `/mocks`.

### 7. Verify

From the repo root:

```bash
bun run format:check
bun run check:layout
bun run check:source
bunx tsc --noEmit      # type-checks only; it does not build
bun run test
bun run build
```

If the output does not name your files, it checked nothing.

**ESLint cannot run in this repo.** `eslint-config-next` loads typescript-eslint,
which refuses TypeScript 7 outright — even `next/core-web-vitals` alone fails.
SonarQube hits the same wall (SonarJS caps at TS 5.9.3). The tsc strictness flags
and the greps in `scripts/check-source.sh` stand in for it. Do not spend time
trying to make either run.

If the schema changed, `bun run db:generate` must report **no drift** before you
open the PR.

### 8. A green check proves nothing until it can go red

Every check written here has to be run against a planted violation, then
restored. This repo has shipped four checks that reported success while testing
nothing:

- a grep using `\b` under `git grep -E`, where POSIX ERE has no word boundary,
  so every pattern matched zero lines and reported clean
- a test-count guard that matched `Tests  68 passed` locally and nothing in CI,
  because vitest colours that line only there
- a migration check comparing which _filenames_ a PR touched, which failed on a
  PR that only reformatted `schema.ts`
- `policy-grants.test.ts`, which reads migration _text_: a `USING` clause
  comparing the wrong column passes it

Assert the premise too — if the parser stops matching, every assertion below it
passes vacuously. A drizzle insert that violates a constraint throws
`Failed query`, which any broken insert produces; assert on `error.cause`, which
carries the constraint name.

### 9. Ship only when asked

Do not run `git commit` or `git push` because the work is finished. Questions
are questions.

Never `git reset --hard` with uncommitted work in the tree — it discards changes
to every tracked file, and none of it is in the reflog because none of it was
ever staged. Use `--soft`, or a worktree.

Commit messages carry no `Co-Authored-By` or generated-with line;
`.husky/commit-msg` strips them and a `.claude` hook refuses the command.

### 10. Merging is not landing

CI green means the code compiles, not that the change works. Two things are
outstanding at merge, and skipping them has already broken production:

**Migrations do not run on deploy.** Nothing in CI or `vercel.json` calls
`db:migrate`. A merged PR whose code reads a new column, against a database that
does not have it, breaks every query the moment Vercel deploys — silently, since
`listPlans` catches and returns `[]`. Apply the migration before or with the
merge, then confirm:

```bash
psql -c "select column_name from information_schema.columns where table_name='<t>'"
```

**Then check production, not `.next/`.** The local build lacks Vercel's own env
vars and will lie about what users see.

```bash
vercel logs https://www.onelystop.in --json | grep -oE '"requestPath":"[^"]*","responseStatusCode":[0-9]*'
curl -s https://www.onelystop.in/<path>
```

For anything in the browser bundle, grep the deployed chunks rather than the
HTML — `NEXT_PUBLIC_` values are inlined into JS, not the document. A variable
listed in the Vercel dashboard is not proof it reached the build.

## What this repo protects

Read `AGENTS.md` before designing. The gates that have actually caught things:

- **Money is integer minor units.** `7.99 * 100` is `798.9999…` in float64.
- **Amount and currency come from the server.** Currency from the request host,
  amount from `payment_plans`. Never from the request body.
- **Access is one column**: `entitlements.access_until > now()`. Not a
  subscription status, not a payment row.
- **Postgres checks GRANTs before RLS.** A policy without a grant returns zero
  rows, which reads as "this user has no data" rather than as a denial.
- **A table with no RLS is readable by anyone with the anon key**, which is
  public by design. Nothing errors.
- **`NEXT_PUBLIC_` ships in the browser bundle.**
- **Never authorize from `user_metadata`** — it is user-writable.
- **Test and live are separate worlds at any payment provider.** A plan id from
  one does not exist in the other, and no key switch translates it.
- **A script that prints a warning has not prevented anything.** Make it refuse.

## Never

Merge by disabling the `protect-main` ruleset without backing it up first and
diffing the restore against the backup afterwards. Push to a PR carrying an
approving review. Commit `tsconfig.tsbuildinfo` or anything else generated.
