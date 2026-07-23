#!/usr/bin/env bash
# Scrub Replit's package proxy URLs out of package-lock.json.
# Replit's package firewall rewrites resolved URLs to
# http://package-firewall.replit.local/npm/..., which breaks installs/builds
# outside Replit. Run after every npm install: npm run lockfile:scrub
set -euo pipefail

LOCKFILE="$(dirname "$0")/../package-lock.json"

sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' "$LOCKFILE"

REMAINING=$(grep -c "package-firewall.replit.local" "$LOCKFILE" || true)
if [ "$REMAINING" != "0" ]; then
  echo "ERROR: $REMAINING contaminated URL(s) remain in package-lock.json" >&2
  exit 1
fi
echo "package-lock.json clean: no package-firewall.replit.local URLs remain."
