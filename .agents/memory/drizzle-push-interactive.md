---
name: drizzle-kit push interactivity & drift safety
description: How to preview drizzle-kit push SQL non-interactively and the destructive-drift approval workflow.
---

- `drizzle-kit push` prompts are a TUI needing a real TTY; piping newlines or `script -qec` does NOT advance them. Working recipe: Python `pty.fork()` driving the process, sending `\r` when the ❯ selector or "created or renamed" appears; Enter picks the highlighted first option (create / "No, abort" at the final approval).
- **Why:** with `--strict --verbose` the full proposed SQL prints before the final approval prompt; pressing Enter there aborts safely, so you can capture every statement without applying anything.
- **How to apply:** capture output, strip ANSI, split statements into safe CREATE TABLE + new-table FK ALTERs (apply via psql) vs column-level drift (data-loss type changes / DROP COLUMN — never apply without human approval; see docs/schema-drift-pending-approval.sql). Large column drift on existing tables remains outstanding in this project.
- Manual provisioning DDL for tables created outside migrations lives in `migrations/manual/` — new environments must run those (drizzle journal is empty; project uses push, not migrate).
