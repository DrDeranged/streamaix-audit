---
name: Vitest testing setup
description: How the offline vitest safety-net tests are structured and the traps to avoid when extending them.
---

- Tests live in `__tests__/` folders under `server/`; run with `npm test` (vitest run). `vitest.config.ts` provides the `@shared` alias — vite.config.ts is untouched.
- **Why offline mocks matter:** tests must pass with no DB/network. `pointsService` imports the db and a websocket broadcaster at module load — both must be `vi.mock`ed before import. `server/auth.ts` imports `./storage` (db chain) — mock it.
- **JWT secret is cached at first use** in `server/auth.ts`; set `process.env.JWT_SECRET` BEFORE importing the module in tests.
- **Rate limiter buckets are module-level state** shared across tests; use unique IPs/user ids per test. The factory is private — test via exported limiter instances.
- **AMM price impact never reaches exactly 100** (floored output keeps post-trade price above zero); assert bounds, not equality.
- The package installer tool puts packages in `dependencies` even with the dev flag in this repo; move test tooling to `devDependencies` with `npm pkg delete/set` (bash can't run `npm install`, but pkg edits are fine).
- `npm run check` currently fails on pre-existing broken JSX in `client/src/pages/governance.tsx` — unrelated to tests.
