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

## The checklist

| #   | Step                                      | Done when                                                                 |
| --- | ----------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Issue first, with the Gate 1 output in it | Issue open and linked; CI blocks a PR that closes nothing                 |
| 2   | Branch off `origin/main`                  | `git fetch origin && git checkout -b <area>/<what> origin/main`           |
| 3   | Build against the plan                    | Scope stays inside what was asked                                         |
| 4   | Production comments pass on the full diff | Every added or touched comment listed, justified or deleted               |
| 5   | Verify every gate, naming real files      | `format:check`, `check:layout`, `check:source`, `tsc`, `vitest`, `build`  |
| 6   | Prove each new check can go red           | Violation planted, check fails, restored, check passes                    |
| 7   | Commit, push, PR, watch CI                | Only when asked. PR open, CI reported, `closingIssuesReferences` verified |

## Step detail

**1. Issue before PR.** `AGENTS.md` Gate 0. Give each issue its own keyword —
`Closes #12, closes #13`, never `Closes #12, #13`, which closes one and leaves
the other open silently. **A closing reference only registers when the PR's base
is the default branch.** A stacked PR shows `closingIssuesReferences: []`, so
check it with `gh pr view <n> --json closingIssuesReferences` rather than
trusting the text, and say so in the PR body if it will not link until retarget.

CI enforces this: a PR closing no issue fails before anything else runs. The
exceptions `AGENTS.md` names — a typo, a revert, a fix for something already
broken on `main` — carry the `no-issue` label instead.

**2. Branch.** Off `origin/main`, never a stale local one. `main` is protected:
squash-only, one approving review, strict status checks.

A worktree is the right tool when the working tree holds someone else's
uncommitted work — `git worktree add -q /tmp/x --detach origin/<branch>`, then
symlink `node_modules` to run anything. Remove it afterwards.

**3. Build only what was asked.** Extra layers, tables and abstractions get
rejected here, and rightly. If a guard, a table or an interface seems needed
but was not named, say it belongs in its own issue and leave it out.

**4. Production comments pass.** Run `git diff origin/main...HEAD`, list every
comment added or touched, and justify or delete each one. Do this as a pass of
its own, not while writing — the comment that felt necessary mid-edit almost
never survives being read back.

Keep one only where its absence lets someone make a mistake that fails
**silently**. The ones earning their place in this repo all mark that: a
spelling that joins to no questions, a missing grant that reads as missing
data, `costMicros` that looks like dollars, `408` that must stay retryable, an
API key read outside the config object so logging cannot leak it.

Delete anything that restates the code, defends an ordinary choice, explains a
language or framework basic, or has drifted out of sync. Section banners and
decorative dividers go without argument — `check:source` rejects those and
commented-out code, but it cannot tell you a comment is merely useless.

One line where one line does. A multi-line block above a function has to earn
every line of it. Match the density of the file you are in: a file with no
comments is telling you its convention.

Density is not a quality signal. Two rewrites in this repo cut 86 comment lines
to 22, then 21 to 10, and both files read better afterwards.

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
