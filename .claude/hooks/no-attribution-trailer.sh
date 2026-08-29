#!/bin/bash
# PreToolUse(Bash) gate: no commit or PR body may carry an AI-attribution line.
#
# The rule is in ~/.claude/CLAUDE.md and a commit-msg hook strips the trailer as
# a backstop, but the backstop only fires after the message is written and does
# nothing for a PR body. This refuses the command instead.
#
# Fails OPEN on anything that is not a clear match, so it can never wedge an
# unrelated command.

export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""') || exit 0

# Only commands that write a message somewhere durable. Split on separators and
# strip leading whitespace, env assignments and shell keywords before anchoring,
# so this does not fire on a command that merely mentions the string.
printf '%s' "$COMMAND" \
  | tr ';|&' '\n' \
  | sed -E 's/^[[:space:]]*//; s/^([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]+[[:space:]]+)+//; s/^(if|then|elif|else|do|while|until|!)[[:space:]]+//' \
  | grep -qE '^(git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?commit|gh[[:space:]]+(pr|issue)[[:space:]]+(create|edit|comment))([[:space:]]|$)' \
  || exit 0

# Anchored: a trailer is a line that STARTS with the key, or the harness's
# generated-with line. An unanchored match also fires on a message that merely
# describes the rule, which is a false positive that trains people to bypass it.
printf '%s' "$COMMAND" \
  | grep -qiE '^[[:space:]]*(co-authored-by|signed-off-by-claude)[[:space:]]*:|🤖[[:space:]]*generated with|generated with \[claude' \
  || exit 0

jq -n --arg r "Blocked: this carries an AI-attribution trailer.

~/.claude/CLAUDE.md forbids Co-Authored-By and 'Generated with Claude' lines in
commits and PR bodies, and that rule overrides the harness default that adds
one. Rewrite the message without it and run the command again." \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
