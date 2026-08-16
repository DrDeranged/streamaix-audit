---
name: drizzle-kit push interactivity & drift safety
description: How to preview drizzle-kit push SQL non-interactively and the destructive-drift approval workflow.
---

- `drizzle-kit push` prompts are a TUI needing a real TTY; piping newlines or `script -qec` does NOT advance them. Working recipe: Python `pty.fork()` driving the process, sending `\r` when the ❯ selector or "created or renamed" appears; Enter picks the highlighted first option (create / "No, abort" at the final approval).
- **Why:** with `--strict --verbose` the full proposed SQL prints before the final approval prompt; pressing Enter there aborts safely, so you can capture every statement without applying anything.
- **How to apply:** capture output, strip ANSI, split statements into safe CREATE TABLE + new-table FK ALTERs (apply via psql) vs column-level drift (data-loss type changes / DROP COLUMN — never apply without human approval; see docs/schema-drift-pending-approval.sql). Large column drift on existing tables remains outstanding in this project.
- Manual provisioning DDL for tables created outside migrations lives in `migrations/manual/` — new environments must run those (drizzle journal is empty; project uses push, not migrate).

## 2026-08-16 reconciliation status
- Constraint-name drift (_key/_fkey vs drizzle _unique/_fk) is RESOLVED: 206 idempotent, table-scoped renames in `migrations/manual/2026-08-16-constraint-renames.sql` (applied to dev; MUST run on prod with other manual migrations before any prod drizzle push).
- Missing composite uniques were added to schema.ts *named to match existing DB constraint names* — naming schema constraints after the live DB name is the zero-churn trick.
- Permanent residual churn: 4 FK names >63 chars — Postgres truncates, drizzle-kit compares untruncated → it will forever propose drop/add for these. Harmless; ignore.
- Destructive remainder awaiting human sign-off: `docs/schema-drops-approved-pending.sql` (audited-dead columns + orphan achievement_definitions table); full residual diff snapshot in `docs/schema-drift-remaining-2026-08-16.sql`.
- pty recipe hazard: the "created or renamed" prompt handler blindly sends Enter, which *selects* rename mappings (e.g. generated_by › holding_period) in the previewed SQL — fine for preview-then-abort, NEVER reuse the script to actually apply.

## CRITICAL hazard (2026-08-16)
- `drizzle-kit push` only prompts when it detects DESTRUCTIVE statements. If the
  pending diff is non-destructive (index churn, ADD CONSTRAINT), push applies
  IMMEDIATELY with no prompt — the pty preview-then-abort recipe silently becomes
  apply. `--verbose` prints statements but ALSO applies. The only safe preview of
  a non-destructive diff is `push --strict` (prompts before ALL statements; first
  option "No, abort"). Incident: a preview run dropped 4 live indexes and half-applied
  FKs before erroring; repaired via migrations/manual/2026-08-16-index-repair.sql.
- 63-char FK truncation churn is RESOLVED: declare table-level foreignKey({name})
  with the exact Postgres-truncated name (not permanent churn as noted earlier).
- Backup/archive tables must live outside `public` (e.g. schema drift_backup) or
  push proposes dropping them.
