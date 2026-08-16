-- Repair: drizzle push (verbose pty mishap) dropped these before aborting on
-- the parked stream_messages FK. Recreated; DESC indexes use NULLS LAST to
-- match drizzle's declaration so the diff stays clean.
CREATE INDEX IF NOT EXISTS idx_avatar_trades_avatar ON avatar_trades (avatar_id);
CREATE INDEX IF NOT EXISTS idx_avatar_trades_market ON avatar_trades (market_id);
CREATE INDEX IF NOT EXISTS idx_avatar_posts_created_at ON avatar_posts (created_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory (agent_id, created_at DESC NULLS LAST);
