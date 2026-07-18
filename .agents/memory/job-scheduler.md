---
name: Job scheduler conventions
description: Phase 1 JobScheduler rules for background work and gotchas found during migration
---

# Rule
All background work must go through `jobScheduler` (`server/jobs/scheduler.ts`): `register` for interval jobs, `registerCron` for time-of-day jobs. Never raw setInterval/while-loops for business jobs (local housekeeping like cacheService is exempt).

**Why:** Phase 1 consolidated ~15 self-scheduling engines to fix restart herds and give one status surface (`GET /api/admin/jobs`, admin-only). State persists in `job_runs`; on DB read failure at boot the scheduler treats jobs as recently-run (fails safe against the herd).

**How to apply:** New jobs pick a unique kebab-case name; runOnStart only fires if last_started_at is older than the interval (or `freshForMs` for crons). 5 consecutive failures → 4x interval backoff. Engines' stop() should call `jobScheduler.cancel(name)`.

# Gotchas
- `npm run db:push` hangs on an interactive rename prompt due to pre-existing `blog_posts` drift; `--force` doesn't bypass it. Applied `CREATE TABLE` via executeSql instead — keep schema.ts and SQL in sync manually until drift is resolved.
- To verify admin-guarded endpoints in dev: boot a throwaway server with `PORT=... ADMIN_RESEED_SECRET=... ENABLE_ADMIN_SECRET_OVERRIDE=true` and use the `x-admin-secret` header.
- `npm run check` fails on pre-existing `client/src/pages/governance.tsx` JSX errors — unrelated to server work; filter it out when typechecking.
