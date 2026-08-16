-- DESTRUCTIVE schema drops awaiting explicit human sign-off. DO NOT APPLY without approval.
-- Reconciled 2026-08-16 (supersedes docs/schema-drift-pending-approval.sql):
--   * All DROP CONSTRAINT churn was resolved non-destructively: DB constraint names were
--     renamed to drizzle's expected names (migrations/manual/2026-08-16-constraint-renames.sql)
--     and missing composite uniques were added to shared/schema.ts.
--   * Every DROP COLUMN below was audited: NO live code reads any of these columns.
--     (client stream-replays reads `recording.title` but no server query ever selects it —
--     the UI already falls back to 'Stream Recording'.)
--
-- Dead columns (verified unreferenced in server/, client/, shared/):
ALTER TABLE "ai_trading_setups" DROP COLUMN "stop_loss_price";       -- superseded by stop_loss (proposed ADD)
ALTER TABLE "ai_trading_setups" DROP COLUMN "position_size_percent"; -- superseded by position_size
ALTER TABLE "ai_trading_setups" DROP COLUMN "max_risk_percent";      -- superseded by max_risk
ALTER TABLE "ai_trading_setups" DROP COLUMN "exit_conditions";
ALTER TABLE "ai_trading_setups" DROP COLUMN "invalidation_triggers";
ALTER TABLE "ai_trading_setups" DROP COLUMN "supporting_signals";
ALTER TABLE "ai_trading_setups" DROP COLUMN "confluence_score";
ALTER TABLE "ai_trading_setups" DROP COLUMN "closed_at";
ALTER TABLE "ai_trading_setups" DROP COLUMN "pnl_percent";
ALTER TABLE "ai_trading_setups" DROP COLUMN "generated_by";
ALTER TABLE "scheduled_debates" DROP COLUMN "created_by_user_id";    -- schema uses created_by
ALTER TABLE "stream_predictions" DROP COLUMN "created_market_id";    -- schema uses market_id (proposed ADD)
ALTER TABLE "knowledge_avatars" DROP COLUMN "sharpe_ratio";          -- 52 rows of legacy data
ALTER TABLE "knowledge_avatars" DROP COLUMN "alpha_generated";
ALTER TABLE "knowledge_avatars" DROP COLUMN "total_investments";
ALTER TABLE "knowledge_avatars" DROP COLUMN "successful_exits";
ALTER TABLE "knowledge_avatars" DROP COLUMN "active_projects";
ALTER TABLE "avatar_insights" DROP COLUMN "updated_at";
ALTER TABLE "bounties" DROP COLUMN "view_count";                     -- 12,800 rows of legacy data
ALTER TABLE "bounties" DROP COLUMN "like_count";
ALTER TABLE "bounties" DROP COLUMN "share_count";
ALTER TABLE "stream_recordings" DROP COLUMN "format";
ALTER TABLE "stream_recordings" DROP COLUMN "quality";
ALTER TABLE "stream_recordings" DROP COLUMN "title";
ALTER TABLE "stream_recordings" DROP COLUMN "view_count";
ALTER TABLE "stream_recordings" DROP COLUMN "processed_at";
-- Orphan table not in schema.ts (reported 2026-08-15, still present):
DROP TABLE "achievement_definitions" CASCADE;
