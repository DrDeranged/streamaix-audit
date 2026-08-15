#!/usr/bin/env bash
# Design-system lint guard — see DESIGN.md.
# Globally enforced: greps ALL of client/src for banned classes and exits 1
# if any are found. There is no allowlist — every file must comply.
set -uo pipefail

cd "$(dirname "$0")/.."

# Directory to lint — overridable for fixture tests (default: client/src).
LINT_DIR="${1:-client/src}"

# Banned class patterns (word-prefixed to avoid false positives inside longer
# tokens; '=' excluded from the boundary class so radix selectors like
# data-[motion=from-end] are not flagged).
BANNED='(^|[^-=[:alnum:]])(bg-slate-|bg-gray-|bg-zinc-|bg-purple-|bg-violet-|bg-indigo-|bg-blue-|text-gray-|text-slate-|text-zinc-|text-purple-|text-red-|text-rose-|text-green-|text-emerald-|text-lime-|text-amber-|text-yellow-|text-orange-|text-cyan-|text-blue-|text-sky-|text-teal-|text-fuchsia-|text-pink-|bg-red-|bg-rose-|bg-green-|bg-emerald-|bg-lime-|bg-amber-|bg-yellow-|bg-orange-|bg-cyan-|bg-sky-|bg-teal-|bg-fuchsia-|bg-pink-|border-red-|border-rose-|border-green-|border-emerald-|border-lime-|border-amber-|border-yellow-|border-orange-|border-cyan-|border-blue-|border-sky-|border-teal-|border-fuchsia-|border-pink-|border-slate-|border-gray-|border-purple-|ring-slate-|ring-gray-|ring-zinc-|ring-purple-|ring-violet-|ring-indigo-|ring-blue-|ring-red-|ring-rose-|ring-green-|ring-emerald-|ring-lime-|ring-amber-|ring-yellow-|ring-orange-|ring-cyan-|ring-sky-|ring-teal-|ring-fuchsia-|ring-pink-|shadow-slate-|shadow-gray-|shadow-zinc-|shadow-purple-|shadow-violet-|shadow-indigo-|shadow-blue-|shadow-red-|shadow-rose-|shadow-green-|shadow-emerald-|shadow-lime-|shadow-amber-|shadow-yellow-|shadow-orange-|shadow-cyan-|shadow-sky-|shadow-teal-|shadow-fuchsia-|shadow-pink-|rounded-lg([^-]|$)|rounded-3xl|from-[[:alnum:]]|to-[[:alnum:]]|(via|fill|stroke|divide|outline|decoration|caret|placeholder|ring-offset|accent)-(red|rose|green|emerald|lime|amber|yellow|orange|cyan|sky|teal|blue|indigo|violet|purple|fuchsia|pink|slate|gray|zinc)-|(text|bg|border|ring|shadow|fill|stroke|via|from|to|divide|outline|decoration|caret|placeholder|ring-offset|accent)-\[(#|rgb|hsl|oklch|color:))|-(core|bright|deep|gain|loss|warn|page|surface|raised|edge|divider)/[0-9]{3}/[0-9]|(^|[^-[:alnum:]])(gain|loss|warn)/[0-9]{3}/[0-9]|hover:hover:|hover:( |")|data-\[state=[a-z]+\]:( |")'

matches=$(grep -rnE "$BANNED" "$LINT_DIR" --include='*.tsx' --include='*.ts' || true)

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
ALLOWED="^$LINT_DIR/(components/landing/|components/ds/AmbientBackground\\.tsx|pages/landing\\.tsx|pages/auth\\.tsx)"
scope=$(grep -rlE "$EXPRESSIVE" "$LINT_DIR" --include='*.tsx' --include='*.ts' | grep -vE "$ALLOWED" || true)

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
