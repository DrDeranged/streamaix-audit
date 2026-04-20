#!/usr/bin/env bash
set -euo pipefail

echo "[post-merge] installing dependencies..."
npm install --no-audit --no-fund --prefer-offline

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[post-merge] syncing database schema..."
  npm run db:push -- --force || npm run db:push || true
else
  echo "[post-merge] DATABASE_URL not set, skipping db:push"
fi

echo "[post-merge] done."
