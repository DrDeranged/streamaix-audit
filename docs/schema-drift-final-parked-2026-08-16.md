# Schema drift — final parked list (2026-08-16)

All human-approved verdicts executed. `drizzle-kit push` now proposes exactly
**two statements**, both parked pending a data-cleanup decision:

```sql
ALTER TABLE "stream_messages" ADD CONSTRAINT "stream_messages_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_host_id_users_id_fk"
  FOREIGN KEY ("host_id") REFERENCES "public"."users"("id");
```

## Why parked: orphan rows (avatar ids stored in user columns)

| FK | orphan rows | distinct ids | of which knowledge_avatar ids |
|---|---|---|---|
| stream_messages.user_id → users.id | 12,390 | 57 | 31 |
| live_streams.host_id → users.id | 145 | 31 | 31 (all) |

AI avatars post messages / host streams with their `knowledge_avatars.id`
written into the user-id column. Options (human decision):
1. Split the columns (add `avatar_id`, null out `user_id` for avatar rows), or
2. Change the FK target / drop the FK declarations from schema.ts, or
3. Create shadow user rows for avatars.
No rows were deleted or modified.

## Everything else resolved

- Clusters 1–6: archived to `drift_backup.<table>_drift_backup_20260816`
  (moved out of `public` so drizzle ignores them), then dropped.
- Cluster 7: knowledge_avatars legacy stats re-declared + backfilled (17 avatars).
- Cluster 8: 35 indexes declared in schema.ts; 8 orphans dropped
  (incl. idx_users_twitter_id, superseded by users_twitter_id_unique).
- Cluster 9: 78 ALTER COLUMNs applied (UTC-pinned timestamptz→timestamp;
  avatar_insights.confidence rescaled 0–1 → 0–100 to match schema/UI).
- Cluster 10: 19 zero-orphan FKs + users_twitter_id_unique applied;
  60 additive columns applied.

## Prod reminder

`migrations/manual/*.sql` (constraint renames, approved drops, alter-columns,
additive columns/constraints, index drops/repair) must run on production
before any prod drizzle push.
