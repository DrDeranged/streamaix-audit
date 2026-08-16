-- Cluster 9 (2026-08-16 drift verdict): 78 ALTER COLUMN statements.
-- Lossy ones verified by sampling; see commit message. UTC pinned for timestamptz->timestamp.
SET timezone = 'UTC';
BEGIN;
ALTER TABLE "achievements" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "achievements" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "ai_trading_setups" ALTER COLUMN "entry_conditions" SET DATA TYPE text[] USING translate(entry_conditions::text, '[]"', '{}')::text[]; -- 0 non-null rows
ALTER TABLE "ai_trading_setups" ALTER COLUMN "status" SET DEFAULT 'active';
ALTER TABLE "avatar_content_interactions" ALTER COLUMN "content_id" SET NOT NULL;
ALTER TABLE "avatar_content_interactions" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "avatar_content_interactions" ALTER COLUMN "interaction_type" SET DATA TYPE text;
ALTER TABLE "avatar_follows" ALTER COLUMN "followed_at" DROP NOT NULL;
ALTER TABLE "avatar_follows" ALTER COLUMN "notifications_enabled" DROP NOT NULL;
ALTER TABLE "avatar_insights" ALTER COLUMN "category" DROP NOT NULL;
ALTER TABLE "avatar_insights" ALTER COLUMN "category" SET DATA TYPE text;
-- Guarded rescale: only 0-1 scale values are multiplied; any value outside
-- [0,1] (other than NULL) aborts because it indicates mixed scales in prod.
DO $$
DECLARE bad int;
BEGIN
  SELECT count(*) INTO bad FROM avatar_insights WHERE confidence IS NOT NULL AND (confidence < 0 OR confidence > 1) AND confidence <> round(confidence);
  IF bad > 0 THEN RAISE EXCEPTION 'avatar_insights.confidence has % rows with fractional values outside [0,1] - resolve scale manually', bad; END IF;
END $$;
UPDATE avatar_insights SET confidence = round(confidence * 100) WHERE confidence IS NOT NULL AND confidence >= 0 AND confidence <= 1;
ALTER TABLE "avatar_insights" ALTER COLUMN "confidence" SET DATA TYPE integer USING round(confidence)::integer;
ALTER TABLE "avatar_insights" ALTER COLUMN "confidence" SET DEFAULT 50;
ALTER TABLE "avatar_insights" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "avatar_insights" ALTER COLUMN "insight_type" DROP DEFAULT;
ALTER TABLE "avatar_insights" ALTER COLUMN "published_at" DROP NOT NULL;
ALTER TABLE "avatar_insights" ALTER COLUMN "title" SET DATA TYPE text;
ALTER TABLE "bounties" ALTER COLUMN "bounty_type" SET NOT NULL;
ALTER TABLE "bounties" ALTER COLUMN "creator_wallet" SET NOT NULL;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "created_at" DROP NOT NULL;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "decision_bias" SET DATA TYPE text;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "expertise" SET DATA TYPE text;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "follower_count" DROP NOT NULL;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "following_count" DROP NOT NULL;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "handle" SET DATA TYPE text;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "is_active" DROP NOT NULL;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "max_position_pct" SET DATA TYPE real;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "name" SET DATA TYPE text;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "risk_tolerance" SET DATA TYPE text;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "trading_frequency" SET DATA TYPE text;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "trading_style" SET DATA TYPE text;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "twitter_handle" SET DATA TYPE text;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "updated_at" DROP NOT NULL;
ALTER TABLE "knowledge_avatars" ALTER COLUMN "verification_status" SET DATA TYPE text;
ALTER TABLE "live_streams" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "live_streams" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "market_price_history" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "market_price_history" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "portfolio_assets" ALTER COLUMN "annual_growth_rate" SET DATA TYPE real;
ALTER TABLE "portfolio_assets" ALTER COLUMN "contribution_amount" SET DATA TYPE real;
ALTER TABLE "scheduled_debates" ALTER COLUMN "actual_start_time" SET DATA TYPE timestamp;
ALTER TABLE "scheduled_debates" ALTER COLUMN "category" SET DATA TYPE text;
ALTER TABLE "scheduled_debates" ALTER COLUMN "created_at" SET DATA TYPE timestamp;
ALTER TABLE "scheduled_debates" ALTER COLUMN "end_time" SET DATA TYPE timestamp;
ALTER TABLE "scheduled_debates" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "scheduled_debates" ALTER COLUMN "scheduled_start_time" SET DATA TYPE timestamp;
ALTER TABLE "scheduled_debates" ALTER COLUMN "status" SET DATA TYPE text;
ALTER TABLE "scheduled_debates" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "stream_messages" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "stream_messages" ALTER COLUMN "deleted_by" SET DATA TYPE varchar USING deleted_by::varchar; -- 0 non-null rows
ALTER TABLE "stream_messages" ALTER COLUMN "message_type" SET NOT NULL;
ALTER TABLE "stream_participants" ALTER COLUMN "joined_at" SET DEFAULT now();
ALTER TABLE "stream_participants" ALTER COLUMN "participant_type" SET NOT NULL;
ALTER TABLE "stream_participants" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "stream_predictions" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "stream_predictions" ALTER COLUMN "timestamp" SET DATA TYPE integer USING "timestamp"::integer; -- 0 non-null rows
ALTER TABLE "stream_recordings" ALTER COLUMN "duration_seconds" DROP DEFAULT;
ALTER TABLE "stream_recordings" ALTER COLUMN "duration_seconds" DROP NOT NULL;
ALTER TABLE "stream_recordings" ALTER COLUMN "file_size_bytes" SET DATA TYPE integer;
ALTER TABLE "stream_recordings" ALTER COLUMN "id" SET DATA TYPE varchar;
ALTER TABLE "stream_recordings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "stream_recordings" ALTER COLUMN "parent_recording_id" SET DATA TYPE varchar;
ALTER TABLE "stream_recordings" ALTER COLUMN "recording_url" DROP NOT NULL;
ALTER TABLE "stream_recordings" ALTER COLUMN "status" SET DATA TYPE text;
ALTER TABLE "stream_recordings" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "stream_recordings" ALTER COLUMN "stream_id" SET DATA TYPE varchar;
ALTER TABLE "stream_tips" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "tip_contributions" ALTER COLUMN "token_type" SET NOT NULL;
ALTER TABLE "user_achievements" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "user_achievements" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "user_achievements" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "users" ALTER COLUMN "auth_provider" SET DATA TYPE text;
ALTER TABLE "users" ALTER COLUMN "twitter_display_name" SET DATA TYPE text;
ALTER TABLE "users" ALTER COLUMN "twitter_id" SET DATA TYPE text;
ALTER TABLE "users" ALTER COLUMN "twitter_username" SET DATA TYPE text;
ALTER TABLE "user_trading_stats" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "user_trading_stats" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "user_trading_stats" ALTER COLUMN "updated_at" SET DEFAULT now();
COMMIT;
