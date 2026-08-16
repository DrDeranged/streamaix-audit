-- HUMAN-APPROVED destructive drops (verdicts 2026-08-16). Archive-then-drop.
-- Backups are plain tables named <table>_drift_backup_20260816.
BEGIN;

CREATE SCHEMA IF NOT EXISTS drift_backup;

-- 1. ai_trading_setups v1 columns (superseded by v2 fields)
CREATE TABLE IF NOT EXISTS drift_backup.ai_trading_setups_drift_backup_20260816 AS
  SELECT id, closed_at, confluence_score, exit_conditions, generated_by, invalidation_triggers,
         max_risk_percent, pnl_percent, position_size_percent, stop_loss_price, supporting_signals
  FROM ai_trading_setups;
ALTER TABLE ai_trading_setups
  DROP COLUMN IF EXISTS closed_at, DROP COLUMN IF EXISTS confluence_score,
  DROP COLUMN IF EXISTS exit_conditions, DROP COLUMN IF EXISTS generated_by,
  DROP COLUMN IF EXISTS invalidation_triggers, DROP COLUMN IF EXISTS max_risk_percent,
  DROP COLUMN IF EXISTS pnl_percent, DROP COLUMN IF EXISTS position_size_percent,
  DROP COLUMN IF EXISTS stop_loss_price, DROP COLUMN IF EXISTS supporting_signals;

-- 2. bounties engagement counters (verified: no live read/write path)
CREATE TABLE IF NOT EXISTS drift_backup.bounties_drift_backup_20260816 AS
  SELECT id, view_count, like_count, share_count FROM bounties;
ALTER TABLE bounties
  DROP COLUMN IF EXISTS view_count, DROP COLUMN IF EXISTS like_count, DROP COLUMN IF EXISTS share_count;

-- 3. stream_recordings legacy metadata (no server query selects them)
CREATE TABLE IF NOT EXISTS drift_backup.stream_recordings_drift_backup_20260816 AS
  SELECT id, format, processed_at, quality, title, view_count FROM stream_recordings;
ALTER TABLE stream_recordings
  DROP COLUMN IF EXISTS format, DROP COLUMN IF EXISTS processed_at,
  DROP COLUMN IF EXISTS quality, DROP COLUMN IF EXISTS title, DROP COLUMN IF EXISTS view_count;

-- 4. avatar_insights.updated_at (silently-ignored column)
CREATE TABLE IF NOT EXISTS drift_backup.avatar_insights_drift_backup_20260816 AS
  SELECT id, updated_at FROM avatar_insights;
ALTER TABLE avatar_insights DROP COLUMN IF EXISTS updated_at;

-- 5. legacy id columns (verified: no raw-SQL reads)
CREATE TABLE IF NOT EXISTS drift_backup.scheduled_debates_drift_backup_20260816 AS
  SELECT id, created_by_user_id FROM scheduled_debates;
ALTER TABLE scheduled_debates DROP COLUMN IF EXISTS created_by_user_id;
CREATE TABLE IF NOT EXISTS drift_backup.stream_predictions_drift_backup_20260816 AS
  SELECT id, created_market_id FROM stream_predictions;
ALTER TABLE stream_predictions DROP COLUMN IF EXISTS created_market_id;

-- 6. orphan table (0 rows; full backup anyway)
CREATE TABLE IF NOT EXISTS drift_backup.achievement_definitions_drift_backup_20260816 AS
  SELECT * FROM achievement_definitions;
DROP TABLE IF EXISTS achievement_definitions;

COMMIT;
