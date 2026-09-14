---
name: ship-change
description: Take a change in this repo from issue to merged PR — the gates in AGENTS.md, the checks that actually run here, and the traps this repo has already hit. Use whenever asked to build, fix, add or ship anything in onelystop/frontend, whether an issue number is named or the work arrives as conversation.
---

# Shipping a change in onelystop/frontend

State the checklist in your first response, before any code, and report each
item as it completes with the evidence. An unshown check reads the same as a
skipped one.

This exists because the gates get skipped when work arrives as conversation
("can we also…", "just fix it") rather than as an obvious task boundary. There
is no boundary to notice. Run them anyway.

**Load this skill before touching the repo, every time.** Not only when an issue
number is named — a one-line fix asked for mid-conversation runs the same
checklist. If you are already editing files and have not stated the checklist,
you skipped step one; stop and state it.

## The checklist

| #   | Step                                      | Done when                                                                 |
| --- | ----------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Issue only if the work is major           | Major: issue open and linked. Minor: straight to the PR, `no-issue` label |
| 2   | Branch off `origin/main`                  | `git fetch origin && git checkout -b <area>/<what> origin/main`           |
| 3   | Build against the plan                    | Scope stays inside what was asked                                         |
| 4   | Production comments pass on the full diff | Every added or touched comment listed, justified or deleted               |
| 5   | Verify every gate, naming real files      | `format:check`, `check:layout`, `check:source`, `tsc`, `vitest`, `build`  |
| 6   | Prove each new check can go red           | Violation planted, check fails, restored, check passes                    |
| 7   | Commit, push, PR, watch CI                | Only when asked. PR open, CI reported, `closingIssuesReferences` verified |

## Step detail

**1. An issue is for major work only.** Not for everything. An issue costs a
read, and a backlog of them for one-line fixes is noise that buries the ones
worth arguing.

Open an issue when the change is worth arguing before it is built — a feature, a
schema change, anything touching money, auth or a third party, anything whose
design could reasonably go two ways, or work large enough that the Gate 1 output
(prior art, security review, production plan) would actually change what gets
built.

**Do not open one for anything Tushar points out in conversation.** A fix he
names is already decided; writing it up as an issue restates his own words back
at him and slows the thing down. It goes straight onto a PR — the open one if
there is one, a new branch if there is not — with the `no-issue` label so CI's
closes-an-issue gate passes. Same for a typo, a revert, a stale default, a
comment sweep, or a fix for something already broken on `main`.

When in doubt, no issue. A PR that turns out to deserve one can have it opened
and linked afterwards; an unnecessary issue is never reclaimed.

`AGENTS.md` Gate 0 still holds for the major case. Give each issue its own keyword —
`Closes #12, closes #13`, never `Closes #12, #13`, which closes one and leaves
the other open silently. **A closing reference only registers when the PR's base
is the default branch.** A stacked PR shows `closingIssuesReferences: []`, so
check it with `gh pr view <n> --json closingIssuesReferences` rather than
trusting the text, and say so in the PR body if it will not link until retarget.

CI enforces this: a PR closing no issue fails before anything else runs, so a
minor PR needs the label or it cannot merge. Add it as the PR is opened, not
after CI has already gone red:

```bash
gh pr create --title "..." --body-file <file> --label no-issue
```

**2. Branch.** Off `origin/main`, never a stale local one. `main` is protected:
squash-only, one approving review, strict status checks.

A worktree is the right tool when the working tree holds someone else's
uncommitted work — `git worktree add -q /tmp/x --detach origin/<branch>`, then
symlink `node_modules` to run anything. Remove it afterwards.

**3. Build only what was asked.** Extra layers, tables and abstractions get
rejected here, and rightly. If a guard, a table or an interface seems needed
but was not named, say it belongs in its own issue and leave it out.

**4. Production comments.** Run `git diff origin/main...HEAD`, list every
comment added or touched, and for each ask whether its absence would let
someone make a mistake that fails silently. If it restates the code, explains
what rather than why, or defends an ordinary choice, delete it. One line where
one line does; a multi-line block has to earn every line. Match the density of
the file you are in — a file with no comments is telling you its convention.

Run it as its own pass. The comment that felt necessary mid-edit almost never
survives being read back: two passes in this repo cut 86 comment lines to 22,
then 21 to 10, and both files read better after.

**5. Verify.** From the repo root:

```bash
bun run format:check
bun run check:layout
bun run check:source
bunx tsc --noEmit
bun run test
bun run build          # tsc type-checks; it does not build
```

If the output does not name your files, it checked nothing.

**ESLint cannot run in this repo.** `eslint-config-next` loads
typescript-eslint, which refuses TypeScript 7 outright — even
`next/core-web-vitals` alone fails. SonarQube hits the same wall (SonarJS caps
at TS 5.9.3). The tsc strictness flags and the greps in `scripts/check-source.sh`
stand in for it. Do not spend time trying to make either run.

**6. A green check proves nothing until it can go red.** Every check written
here has to be run against a planted violation, then restored. This repo has
shipped four checks that reported success while testing nothing:

- a grep using `\b` under `git grep -E`, where POSIX ERE has no word boundary,
  so every pattern matched zero lines and reported clean
- a test-count guard that matched `Tests  68 passed` locally and nothing in CI,
  because vitest colours that line only there
- a migration check comparing which _filenames_ a PR touched, which failed on a
  PR that only reformatted `schema.ts`
- `policy-grants.test.ts`, which reads migration _text_: a `USING` clause
  comparing the wrong column passes it

Assert the premise too — if the parser stops matching, every assertion below it
passes vacuously.

**7. Ship only when asked.** Do not run `git commit` or `git push` because the
work is finished. Questions are questions. `.claude/settings.json` puts both
behind an `ask` rule for this reason.

Never `git reset --hard` with uncommitted work in the tree — it discards
changes to every tracked file, not just the commit, and none of it is in the
reflog because none of it was ever staged. Use `--soft`, or a worktree.

Commit messages carry no `Co-Authored-By` or generated-with line;
`.husky/commit-msg` strips them and a `.claude` hook refuses the command.

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

## Never

Merge by disabling the `protect-main` ruleset without backing it up first and
diffing the restore against the backup afterwards. Push to a PR carrying an
approving review. Commit `tsconfig.tsbuildinfo` or anything else generated.
