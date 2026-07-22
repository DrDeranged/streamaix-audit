---
name: Typecheck incremental cache trap
description: npm run check can falsely report "clean" because tsc incremental cache suppresses errors in unchanged files
---

The rule: never trust `npm run check` (plain `tsc` with `incremental: true`) as proof the codebase typechecks. Delete `node_modules/typescript/tsbuildinfo` first for an authoritative run.

**Why:** During pre-deployment cleanup (July 2026) a "clean" check turned out to be cache-masked — a fresh run surfaced ~458 pre-existing errors across ~50 server files (strict-mode nulls, missing downlevelIteration Set/Map spreads, drizzle type drift, storage.ts interface gaps). None were caused by the changes at hand; they had been accumulating silently.

**How to apply:** Before declaring typecheck status (especially before deploys or when the user's spec requires "tsc exits clean"), clear the tsbuildinfo cache and re-run. Report pre-existing errors rather than fixing service logic uninvited.
