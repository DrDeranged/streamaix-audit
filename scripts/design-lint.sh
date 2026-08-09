#!/usr/bin/env bash
# Design-system lint guard — see DESIGN.md.
# Globally enforced: greps ALL of client/src for banned classes and exits 1
# if any are found. There is no allowlist — every file must comply.
set -uo pipefail

cd "$(dirname "$0")/.."

# Banned class patterns (word-prefixed to avoid false positives inside longer
# tokens; '=' excluded from the boundary class so radix selectors like
# data-[motion=from-end] are not flagged).
BANNED='(^|[^-=[:alnum:]])(bg-slate-|bg-gray-|bg-zinc-|bg-purple-|bg-violet-|bg-indigo-|bg-blue-|text-gray-|text-slate-|text-zinc-|text-purple-|text-red-|text-rose-|text-green-|text-emerald-|text-lime-|text-amber-|text-yellow-|text-orange-|text-cyan-|text-blue-|text-sky-|text-teal-|text-fuchsia-|text-pink-|bg-red-|bg-rose-|bg-green-|bg-emerald-|bg-lime-|bg-amber-|bg-yellow-|bg-orange-|bg-cyan-|bg-sky-|bg-teal-|bg-fuchsia-|bg-pink-|border-red-|border-rose-|border-green-|border-emerald-|border-lime-|border-amber-|border-yellow-|border-orange-|border-cyan-|border-blue-|border-sky-|border-teal-|border-fuchsia-|border-pink-|border-slate-|border-gray-|border-purple-|rounded-lg([^-]|$)|rounded-3xl|from-[[:alnum:]]|to-[[:alnum:]])|-(core|bright|deep|gain|loss|warn|page|surface|raised|edge|divider)/[0-9]{3}/[0-9]|(^|[^-[:alnum:]])(gain|loss|warn)/[0-9]{3}/[0-9]|hover:hover:|hover:( |")|data-\[state=[a-z]+\]:( |")'

matches=$(grep -rnE "$BANNED" client/src --include='*.tsx' --include='*.ts' || true)

fail=0
if [[ -n "$matches" ]]; then
  echo "$matches"
  echo ""
  echo "design:lint FAILED — banned classes found (see DESIGN.md)."
  fail=1
fi

# Expressive-layer scope guard: orb/text-grad utilities and aurora tokens are
# allowed ONLY on landing/auth surfaces (see DESIGN.md "Expressive layer").
EXPRESSIVE='(^|[^-=[:alnum:]])(orb-(violet|cyan|magenta)|text-grad-(signal|stream)|glow-(cyan|magenta)|(text|bg|border|ring|shadow)-aurora-(cyan|magenta))'
ALLOWED='^client/src/(components/landing/|components/ds/AmbientBackground\.tsx|pages/landing\.tsx|pages/auth\.tsx)'
scope=$(grep -rlE "$EXPRESSIVE" client/src --include='*.tsx' --include='*.ts' | grep -vE "$ALLOWED" || true)

if [[ -n "$scope" ]]; then
  echo "$scope"
  echo ""
  echo "design:lint FAILED — expressive-layer classes used outside landing/auth (see DESIGN.md)."
  fail=1
fi

if [[ $fail -eq 1 ]]; then
  exit 1
fi

echo "design:lint passed."
