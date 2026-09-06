# Working conventions

Rules Tushar has given more than once. `AGENTS.md` covers the code; this covers
how work arrives.

## One PR, not five

Do not open a PR per small change. A typo fix, a comment sweep, a follow-up to
a review — these go onto a branch that is already open, as another commit. Ask
which one only if none obviously fits.

Why: five PRs of four lines each cost five reviews, five CI runs and five merge
decisions to deliver one change worth reviewing once.

## Push when the gates are green

When `format:check`, `check:layout`, `check:source`, `tsc`, `test` and `build`
all pass, commit and push. Do not stop to ask whether to ship — that question
has been answered standing.

The exception is a branch carrying an approving review: pushing dismisses it.
Check `gh pr view <n> --json reviewDecision,state` first, and check the PR is
still open — a squash-merged PR's branch will happily accept a push that goes
nowhere.

## One line of comment, at most

Never two consecutive `//` lines. If a comment needs a paragraph, the thing it
describes needs a better name or a test. `.env.example` carries no prose at
all — just keys.

`scripts/check-source.sh` enforces this; it is not a style preference to
negotiate with.

## Edit files with the editor

Use Edit and Write. Not `sed`, not `perl`, not a Python script. A regex that
half-matches leaves a file that still compiles and no longer means what it
said.

## No AI attribution

No `Co-Authored-By:` trailer, no "Generated with Claude" line, in any commit or
PR body. `.husky/commit-msg` strips it and `.claude/hooks/no-attribution-trailer.sh`
refuses the command, but neither should ever have to fire.
