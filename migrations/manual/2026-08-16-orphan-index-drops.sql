-- Cluster 8 (2026-08-16 drift verdict): orphan indexes — no live query filters/
-- sorts/joins on these columns (verified: zero drizzle refs, zero raw SQL).
DROP INDEX IF EXISTS idx_asset_price_history_symbol;
DROP INDEX IF EXISTS idx_asset_price_history_recorded_at;
DROP INDEX IF EXISTS idx_bot_performance_snapshots_agent_id;
DROP INDEX IF EXISTS idx_bot_sim_trades_agent_id;
DROP INDEX IF EXISTS idx_bot_stakes_agent_id;
DROP INDEX IF EXISTS idx_price_alerts_active;
DROP INDEX IF EXISTS idx_price_alerts_symbol;
-- redundant once users_twitter_id_unique exists (cluster 10)
DROP INDEX IF EXISTS idx_users_twitter_id;
