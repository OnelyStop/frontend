#!/bin/bash
# The source guards, in one place so CI and the pre-commit hook cannot drift.
#
# Every one of these is a defect that reads as ordinary code: a focused test
# that turns the suite green while running one case, a secret named so it ships
# in the browser bundle, an amount written as a float. They are greps rather
# than lint rules because ESLint cannot run here at all — eslint-config-next
# loads typescript-eslint, which refuses TypeScript 7 (typescript-eslint#10940).
#
#     scripts/check-source.sh
#
# Exits non-zero on the first failing guard, listing what it found.

set -uo pipefail

failed=0

# guard <name> <message> <pattern> [pathspec...]
guard() {
  local name="$1" message="$2" pattern="$3"
  shift 3
  if git grep -nIE "$pattern" -- "$@"; then
    echo "::error::$message"
    printf '  FAIL  %s\n' "$name" >&2
    failed=1
  else
    printf '  ok    %s\n' "$name"
  fi
}

guard "no focused or skipped tests" \
  "a focused or skipped test — the suite reports green while running less than it claims" \
  '(^|[^A-Za-z0-9_.])(it|test|describe)\.(only|skip)\(|(^|[^A-Za-z0-9_.])(xit|xdescribe)\(' \
  src

guard "no debugger or stray console output" \
  "debugger or console.log left in shipped code — use lib/log.ts" \
  '^[[:space:]]*debugger[[:space:]]*;?[[:space:]]*$|console\.(log|debug)\(' \
  src ':!*.test.ts' ':!*.test.tsx'

guard "no commented-out code" \
  "commented-out code — delete it, git has the history" \
  '^[[:space:]]*//[[:space:]]*(const|let|var)[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*=|^[[:space:]]*//[[:space:]]*(if|for|while|switch)[[:space:]]*\(|^[[:space:]]*//[[:space:]]*(import|export)[[:space:]]+[A-Za-z_${]' \
  src

guard "no banner comments" \
  "a decorative divider comment — say it in a sentence instead" \
  '^[[:space:]]*(//|\*|#)[[:space:]]*[-=_~*]{6,}[[:space:]]*$' \
  src '.github/workflows/*.yml'

guard "no @ts-ignore" \
  "use @ts-expect-error, which errors when it is no longer needed" \
  '@ts-ignore' \
  src

# A NEXT_PUBLIC_ var is compiled into the browser bundle. Naming a secret one is
# not a leak that shows up in review -- it looks like every other env var until
# it is already public. The anon key is the exception: it is designed to be
# public, and RLS is what protects the data behind it.
guard "no secret is named NEXT_PUBLIC_" \
  "a NEXT_PUBLIC_ var is carrying a secret — it ships in the bundle" \
  'NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE|PRIVATE|TOKEN|PASSWORD)' \
  . ':!.github/workflows/' ':!scripts/'

if git grep -nIE 'NEXT_PUBLIC_[A-Z0-9_]*KEY' -- . ':!.github/workflows/' ':!scripts/' \
     | grep -v 'NEXT_PUBLIC_SUPABASE_ANON_KEY'; then
  echo "::error::a NEXT_PUBLIC_ key var that is not the anon key"
  printf '  FAIL  no stray NEXT_PUBLIC_ key\n' >&2
  failed=1
else
  printf '  ok    no stray NEXT_PUBLIC_ key\n'
fi

# A live key is a leak wherever it appears, tests included.
guard "no live key or connection string" \
  "a live key, connection string or JWT is committed" \
  '(sk-[A-Za-z0-9]{20,}|rzp_live_[A-Za-z0-9]+|postgres(ql)?://[^ ]*:[^ @]+@|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.)' \
  . ':!*.md' ':!.github/workflows/' ':!scripts/'

# `NAME = value` is only a leak when the value is a quoted literal: a test
# assigning a fixture is not one, and matching it trained us to ignore this.
guard "no secret assigned a literal" \
  "a secret env var is assigned a literal value in source" \
  '(SUPABASE_SERVICE_ROLE_KEY|RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|DATABASE_URL|DIRECT_URL) *[:=] *["'"'"'][^"'"'"']' \
  . ':!*.md' ':!.github/workflows/' ':!scripts/' ':!*.test.ts'

# Money is stored in minor units as integers. A float amount is a rounding error
# on a real charge -- 7.99 * 100 is 798.9999… in float64 -- and it reads as
# perfectly ordinary code.
guard "amounts are integers" \
  "a minor-unit amount was written as a decimal" \
  '(amountMinor|amount_minor)[^=]*[=:] *[0-9]+\.[0-9]' \
  src scripts

guard "no parseFloat on money" \
  "parseFloat on an amount — use integer minor units" \
  'parseFloat\([^)]*(amount|price)' \
  src scripts

# A TODO with no ticket is never found again.
if git grep -nIE '(TODO|FIXME|XXX|HACK)' -- src | grep -vE '#[0-9]+'; then
  echo "::error::a TODO/FIXME with no ticket reference — write TODO(#123)"
  printf '  FAIL  every TODO carries a ticket\n' >&2
  failed=1
else
  printf '  ok    every TODO carries a ticket\n'
fi

exit "$failed"
