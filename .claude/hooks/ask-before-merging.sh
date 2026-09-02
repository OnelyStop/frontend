#!/bin/bash
# PreToolUse(Bash) gate: merging is always the human's call.
#
# The permission allow-list lets the whole branch-to-PR loop run unattended, so
# the one remaining checkpoint has to hold on its own. This asks rather than
# denies -- when the answer is "merge it", approving the prompt is the yes.
#
# Fails OPEN on anything that is not a clear match, so it can never wedge an
# unrelated command.

export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""') || exit 0

# Split on separators and strip leading whitespace, env assignments and shell
# keywords before anchoring, so this does not fire on a command that merely
# mentions the string. `gh api` is here because -X PUT on a /merge endpoint
# merges a PR without ever spelling the word "merge" as a subcommand.
printf '%s' "$COMMAND" \
  | tr ';|&' '\n' \
  | sed -E 's/^[[:space:]]*//; s/^([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]+[[:space:]]+)+//; s/^(if|then|elif|else|do|while|until|!)[[:space:]]+//' \
  | grep -qE '^(gh[[:space:]]+pr[[:space:]]+merge|git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?merge|gh[[:space:]]+api[[:space:]].*/merge)([[:space:]]|$)' \
  || exit 0

jq -n --arg r "Merging needs an explicit go-ahead.

Opening the PR is autonomous; merging it is not. Approve this only if you have
just said to merge -- otherwise reject, and the PR stays open for review." \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
