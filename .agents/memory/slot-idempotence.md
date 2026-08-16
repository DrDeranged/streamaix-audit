---
name: Scheduled-send slot idempotence
description: Rule for deduplicating scheduled side effects (newsletter etc.) — claim rows keyed on explicit slot identity, never timestamp windows.
---

- Dedup for scheduled side effects must key on an explicit slot identity written by the sender (edition_date + edition, UNIQUE constraint, claim-then-send with status sending→sent/failed), never on inferring the slot from the record's timestamp.
- **Why:** the newsletter duplicated because the guard inferred edition from sentAt's ET-hour window; a catch-up "Morning" send dispatched after noon landed in the market-close window and was neither blocked nor blocking.
- **How to apply:** any new cron+catch-up side effect (emails, pushes, streams) should insert a 'sending' claim BEFORE doing the work; unique-violation aborts silently; 'failed' is terminal (never reclaimed); only crashed 'sending' rows >1h are reclaimable; slot dates computed explicitly in America/New_York. DB unreachable → fail closed (skip send).
- Production DB must get the `migrations/manual/` DDL before the next deploy (edition columns + unique index).
