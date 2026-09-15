<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Working agreements

These three gates apply to every task in this repo. They exist because the
default failure mode is writing plausible code fast, not correct code that
survives production.

## Gate 0 — Triage, then an issue if it earns one

### 0.1 Search first

Never open an issue without looking for it. Duplicates split the argument across
two threads and both rot.

```
gh issue list --state all --search "<3-4 keywords from the symptom>" --limit 20
```

Search the **symptom**, not your phrasing of the fix — "checkout 502", not "add
a mode column". Search closed too: a closed issue happening again is a reopen
with a comment, never a new number.

### 0.2 Give it a priority

The priority decides whether there is an issue at all, and whether there is a
new PR. Decide it before opening either.

| Label | Test                                                        | Issue | PR                      |
| ----- | ----------------------------------------------------------- | ----- | ----------------------- |
| `P0`  | Production is broken **now** — users see it                 | Yes   | Its own, immediately    |
| `P1`  | Money, auth, schema, a third party, or a real design choice | Yes   | Its own                 |
| `P2`  | Normal feature or fix worth its own review                  | Yes   | Its own if none is open |
| `P3`  | Small: a guard, a rename, a copy fix, a one-file change     | No    | **Onto the open PR**    |
| `P4`  | Trivial: typo, comment sweep, stale default, revert         | No    | **Onto the open PR**    |

Two tests settle most cases:

- **Could this reasonably be built two different ways?** Yes → P1 or P2, and the
  issue is where that argument happens.
- **Would writing it up restate what was already decided in conversation?**
  Yes → P3 or P4.

When in doubt, go lower. A P3 that turns out to deserve an issue can have one
opened afterwards; an unnecessary issue is never reclaimed.

Every PR carries exactly one priority label. Nothing can check that for you —
there is no PR yet when the hooks run — so it is on the author.

### 0.3 One open PR

```
gh pr list --state open
```

**If a PR is open and the work is P3 or P4, it commits onto that branch.** Not a
new one, and not because it is a different topic. `.husky/pre-push` refuses to
push a brand-new branch while a PR is open, which is the last moment this is
still cheap to obey — `SHIP_NEW_PR=1` overrides it for genuinely large work.

A second PR is for P0, P1, or a P2 large enough that adding it would bury the
review already open.

### 0.4 The issue, for P0–P2

Open it first, and put the Gate 1 output in it — prior art, the security review,
the production plan. The issue is where a change is argued; the PR is where it
is read.

Link them so the issue closes on merge, and give **each** issue its own
keyword:

```
Closes #12, closes #13
```

`Closes #12, #13` looks equivalent and is not — it closes #12 and leaves #13
open, silently. Check with
`gh pr view <n> --json closingIssuesReferences` rather than trusting the text.

A P3 or P4 PR carries the `no-issue` label instead, added when the PR is
created — CI checks the closing reference before anything else runs, so adding
it afterwards means a red run first.

## Gate 1 — Research before building

No feature starts as code. Work these steps in order and write the output into
the plan **before** the first line of implementation. If a step turns up
nothing useful, say so explicitly rather than skipping it silently.

### 1.1 Prior art — how do production systems actually do this?

Find at least two real implementations before designing your own. In order of
usefulness:

- **Read the source.** Open-source products in the same space beat blog posts.
- **Read the provider's own docs**, not your memory of them. APIs change.
- **Name the trade-off they made and why.** "Stripe uses a hosted checkout
  page" is an observation; "because a redirect removes PCI scope from your
  app" is the reason you can reason with.

Write down what you're copying and what you're deliberately doing differently.
"We're not doing X because we have no multi-tenant requirement" is a valid and
useful conclusion.

### 1.2 Security review — OWASP first

Check the feature against the relevant OWASP material before designing it:

| Feature touches                 | Read                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anything user-facing            | [OWASP Top 10](https://owasp.org/www-project-top-ten/)                                                                                                 |
| Login, sessions, password reset | Authentication + Session Management cheat sheets                                                                                                       |
| Roles, admin, permissions       | Authorization + Access Control cheat sheets                                                                                                            |
| Forms, uploads, imports         | Input Validation + File Upload cheat sheets                                                                                                            |
| Payments, webhooks              | Verify signatures; never trust client-reported amounts                                                                                                 |
| LLM calls                       | [OWASP Top 10 for LLM Apps](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — prompt injection, output handling, cost/DoS |

Stack-specific rules that have already bitten this codebase:

- **Anything in a `NEXT_PUBLIC_*` var is public.** It ships in the bundle. API
  keys, provider secrets, and service-role keys never go there.
- **Never authorize from `user_metadata`** — it is user-writable, so a user can
  promote themselves. Roles live in `app_metadata` or a table behind RLS.
- **Client-side limits are display only.** Quotas, plan gating, and rate limits
  are enforced server-side or they are not enforced.
- **RLS is the backstop, not the check.** Write the policy even when the route
  already filters.

### 1.3 Production plan

State these before building. Any you can't answer is a design hole:

- What breaks at 10× the expected load, and what's the first thing to fail?
- What does this cost per user per month, and what caps that?
- What happens when the third party is down or returns an error?
- What is logged when it fails, and how would we notice at 3am?
- What is the rollback if this ships broken?

### 1.4 Only then build

Implement against the plan. If reality contradicts the plan, update the plan
and say so — don't quietly diverge.

## Gate 2 — The comment audit

Before finishing any task, reread every comment you wrote and delete the ones
that don't earn their place. Comment density is not a quality signal; a wrong
or redundant comment is worse than none, because it will be trusted.

**Keep a comment only if it survives this test — would a competent engineer
reading the code be surprised, or waste time, without it?** Not "could this be
useful". Only comments you cannot do without.

The repo has a number. Comment lines as a share of non-blank lines:

| Density     | Meaning                                              |
| ----------- | ---------------------------------------------------- |
| **1.5%**    | The target                                           |
| 1.7–1.8%    | Fine, no action                                      |
| **over 2%** | Hard ceiling. Stop and delete until it is back under |

```
git ls-files -z 'src/*.ts' 'src/*.tsx' 'scripts/*.ts' | xargs -0 cat > /tmp/a.txt
awk -v c="$(grep -cE '^\s*(//|/\*|\*/|\* )' /tmp/a.txt)" \
    -v t="$(grep -cvE '^\s*$' /tmp/a.txt)" 'BEGIN{printf "%.2f%%\n", c*100/t}'
```

It reads 1.65% today. That is the band to hold, not a budget to spend up to — a
file that needs none is the normal case.

**The bar for a comment you are adding is higher than the repo average.** A diff
sits under review, where every line is read; the default for a new comment is
delete, and it survives only by naming something the reader would otherwise get
wrong. "Could be useful" is a deletion.

Keep:

- **Why**, when the reason isn't visible in the code — a workaround, a
  constraint imposed elsewhere, a deliberate trade-off.
- **Non-obvious failure modes** — "hash fragments never reach the server, so
  this has to run client-side".
- **Ordering or timing that looks arbitrary but isn't.**
- `TODO:`/`FIXME:` **with a ticket reference.** Without one it's noise.

Delete:

- Anything restating the code (`// set loading to true`).
- Section banners and decorative dividers.
- Commented-out code — git already has it.
- Comments explaining language or framework basics.
- Anything that has drifted out of sync with the code beneath it.

**Match the density of the surrounding file.** A file with no comments is
telling you its conventions.
