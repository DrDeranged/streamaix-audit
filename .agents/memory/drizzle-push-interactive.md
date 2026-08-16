---
name: drizzle-kit push interactivity & drift safety
description: How to preview drizzle-kit push SQL safely and the drift-resolution conventions for this project.
---

## Push safety (CRITICAL)
- `drizzle-kit push` prompts ONLY when it detects destructive statements. A
  non-destructive pending diff (index churn, ADD CONSTRAINT, ADD COLUMN) is
  applied IMMEDIATELY with no prompt — any "preview" run silently becomes apply.
  `--verbose` prints statements but ALSO applies.
- **The only safe preview is `push --strict`** — it prompts before ALL
  statements; the highlighted first option is "No, abort".
- **Why:** an unguarded preview run once dropped 4 live indexes and
  half-applied FKs before erroring on an orphaned FK.
- **How to apply:** prompts are a TUI needing a real TTY (pipes/`script -qec`
  don't advance them). Use Python `pty.fork()`, send `\r` at the ❯ selector to
  pick the highlighted "No, abort". Never blind-Enter at "created or renamed"
  prompts when applying — it selects rename mappings.

## Drift conventions (durable)
- Zero-churn trick: name schema.ts constraints/indexes after the exact live DB
  names (`unique("<db_name>").on(...)`, `index("<db_name>")`).
- FK names >63 chars: declare table-level `foreignKey({ name })` with the exact
  Postgres-truncated 63-char name — kills permanent drop/add churn.
- DESC indexes: drizzle emits `DESC NULLS LAST`; create DB indexes that way or
  push churns them.
- Same-name FK drop/add pairs in a diff are often NOT renames — compare
  `ON DELETE` behavior in pg_constraint; declare `onDelete` to match the DB.
- Archive/backup tables must live outside `public` (this project uses schema
  `drift_backup`) or push proposes dropping them.
- Manual DDL lives in `migrations/manual/` (drizzle journal empty; project uses
  push, not migrate). Production has NOT run any of them — they must be applied
  in filename order before any prod push (tracked as a project task).
- Residual parked items live in `docs/schema-drift-final-parked-2026-08-16.md`
  (2 FKs blocked by avatar-ids stored in user columns).
