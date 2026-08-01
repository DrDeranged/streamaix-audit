#!/usr/bin/env bash
# Design-system lint guard — see DESIGN.md.
# Greps migrated files (scripts/design-migrated.txt) for banned classes and
# exits 1 if any are found. Files not yet migrated are not enforced.
set -uo pipefail

cd "$(dirname "$0")/.."

MIGRATED_LIST="scripts/design-migrated.txt"

# Banned class patterns (word-prefixed to avoid false positives inside longer tokens)
BANNED='(^|[^-[:alnum:]])(bg-slate-|bg-gray-|bg-zinc-|bg-purple-|bg-violet-|bg-indigo-|text-gray-|rounded-lg([^-]|$)|rounded-3xl|from-[[:alnum:]]|to-[[:alnum:]])'

if [[ ! -f "$MIGRATED_LIST" ]]; then
  echo "design:lint — no $MIGRATED_LIST found; nothing to enforce."
  exit 0
fi

violations=0
while IFS= read -r file; do
  # skip blanks and comments
  [[ -z "$file" || "$file" == \#* ]] && continue
  if [[ ! -f "$file" ]]; then
    echo "design:lint — WARNING: listed file not found: $file"
    continue
  fi
  matches=$(grep -nE "$BANNED" "$file" || true)
  if [[ -n "$matches" ]]; then
    while IFS= read -r line; do
      echo "$file:$line"
    done <<< "$matches"
    violations=1
  fi
done < "$MIGRATED_LIST"

if [[ "$violations" -eq 1 ]]; then
  echo ""
  echo "design:lint FAILED — banned classes found (see DESIGN.md)."
  exit 1
fi

echo "design:lint passed."
