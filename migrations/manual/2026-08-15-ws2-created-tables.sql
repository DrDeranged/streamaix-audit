-- Manual provisioning DDL: 20 live-verdict tables created during WS2 schema
-- reconciliation (2026-08-15). Idempotent; run once per environment.
-- Note: the trailing ALTER TABLE ... ADD CONSTRAINT statements are not idempotent;
-- re-running against an already-provisioned DB will error on those (harmless).
CREATE TABLE IF NOT EXISTS "bounty_collaborators" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" text NOT NULL,
	"reward_share" real NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"invited_by" varchar,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "collaboration_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" varchar NOT NULL,
	"active_users" jsonb,
	"content_snapshot" text,
	"last_activity" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "copy_trading_positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"copier_id" varchar NOT NULL,
	"trader_id" varchar NOT NULL,
	"signal_id" varchar,
	"asset" text NOT NULL,
	"pair" text NOT NULL,
	"direction" text NOT NULL,
	"entry_price" real NOT NULL,
	"position_size" real NOT NULL,
	"leverage" integer DEFAULT 1,
	"current_price" real,
	"exit_price" real,
	"stop_loss" real,
	"take_profit" real,
	"unrealized_pnl" real,
	"realized_pnl" real,
	"pnl_percentage" real,
	"fees" real DEFAULT 0,
	"status" text DEFAULT 'open' NOT NULL,
	"initial_risk" real,
	"max_drawdown" real,
	"opened_at" timestamp DEFAULT now(),
	"closed_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "daily_quests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"quest_type" text NOT NULL,
	"action_required" text NOT NULL,
	"target_count" integer DEFAULT 1 NOT NULL,
	"xp_reward" integer DEFAULT 100 NOT NULL,
	"stream_reward" integer DEFAULT 0,
	"bonus_multiplier" real DEFAULT 1,
	"difficulty" text DEFAULT 'easy',
	"category" text DEFAULT 'general',
	"is_active" boolean DEFAULT true,
	"requires_level" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "gamification_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"event_type" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"config" jsonb,
	"objectives" jsonb,
	"rewards" jsonb,
	"xp_multiplier" real DEFAULT 1,
	"max_participants" integer,
	"current_participants" integer DEFAULT 0,
	"status" text DEFAULT 'upcoming',
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "gamification_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"notification_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_type" text,
	"related_id" varchar,
	"pending_reward" jsonb,
	"is_read" boolean DEFAULT false,
	"is_claimed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "pattern_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_type" text NOT NULL,
	"alert_category" text NOT NULL,
	"severity" text NOT NULL,
	"priority" text NOT NULL,
	"pattern_id" varchar,
	"trend_id" varchar,
	"cycle_id" varchar,
	"symbol" text NOT NULL,
	"asset_type" text NOT NULL,
	"current_price" real NOT NULL,
	"price_change" real,
	"price_change_percent" real,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"detailed_description" text,
	"technical_analysis" text,
	"recommendations" jsonb NOT NULL,
	"trading_signals" jsonb,
	"risk_factors" text[],
	"key_levels" jsonb,
	"timeframe" text NOT NULL,
	"expires_at" timestamp,
	"urgency" text NOT NULL,
	"optimal_entry_window" jsonb,
	"confidence" real NOT NULL,
	"signal_strength" real NOT NULL,
	"historical_accuracy" real,
	"market_environment" jsonb,
	"correlated_alerts" text[],
	"sector_impact" text,
	"is_viewed" boolean DEFAULT false,
	"is_acknowledged" boolean DEFAULT false,
	"user_notes" text,
	"user_rating" integer,
	"user_actions" jsonb,
	"delivery_channels" text[],
	"delivered_at" jsonb,
	"delivery_status" jsonb,
	"is_triggered" boolean DEFAULT true,
	"triggered_at" timestamp DEFAULT now(),
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"outcome" text,
	"actual_result" text,
	"parent_alert_id" varchar,
	"child_alerts" text[],
	"alert_sequence" integer DEFAULT 1,
	"generated_by" text DEFAULT 'pattern_ai',
	"algorithm_version" text DEFAULT 'v1.0',
	"data_source" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tags" text[]
);
CREATE TABLE IF NOT EXISTS "season_passes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"max_tier" integer DEFAULT 100,
	"xp_per_tier" integer DEFAULT 1000,
	"free_rewards" jsonb NOT NULL,
	"premium_rewards" jsonb NOT NULL,
	"premium_cost" integer DEFAULT 5000,
	"total_participants" integer DEFAULT 0,
	"premium_purchases" integer DEFAULT 0,
	"status" text DEFAULT 'upcoming',
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "trader_performance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trader_id" varchar NOT NULL,
	"period" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"trades" integer DEFAULT 0,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"win_rate" real DEFAULT 0,
	"total_pnl" real DEFAULT 0,
	"total_volume" real DEFAULT 0,
	"roi" real DEFAULT 0,
	"sharpe_ratio" real,
	"max_drawdown" real,
	"avg_risk_per_trade" real,
	"volatility" real,
	"new_followers" integer DEFAULT 0,
	"new_copiers" integer DEFAULT 0,
	"total_followers" integer DEFAULT 0,
	"total_copiers" integer DEFAULT 0,
	"signals_posted" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"total_likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "traders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"wallet_address" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text,
	"bio" text,
	"is_verified" boolean DEFAULT false,
	"trading_style" text,
	"total_trades" integer DEFAULT 0,
	"win_rate" real DEFAULT 0,
	"total_pnl" real DEFAULT 0,
	"roi" real DEFAULT 0,
	"sharpe_ratio" real,
	"max_drawdown" real,
	"avg_hold_time" integer,
	"avg_position_size" real,
	"total_volume" real DEFAULT 0,
	"followers" integer DEFAULT 0,
	"copiers" integer DEFAULT 0,
	"total_copied" integer DEFAULT 0,
	"reputation" integer DEFAULT 50,
	"is_public" boolean DEFAULT true,
	"allow_copy_trading" boolean DEFAULT true,
	"min_copy_amount" real DEFAULT 100,
	"max_copiers" integer DEFAULT 1000,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"preferred_assets" text[],
	"trading_pairs" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_trade_at" timestamp,
	CONSTRAINT "traders_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "traders_wallet_address_unique" UNIQUE("wallet_address")
);
CREATE TABLE IF NOT EXISTS "trading_signals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trader_id" varchar NOT NULL,
	"asset" text NOT NULL,
	"pair" text NOT NULL,
	"direction" text NOT NULL,
	"signal_type" text NOT NULL,
	"entry_price" real NOT NULL,
	"target_price" real,
	"stop_loss" real,
	"current_price" real,
	"leverage" integer DEFAULT 1,
	"position_size" real,
	"confidence" integer DEFAULT 75,
	"timeframe" text NOT NULL,
	"reasoning" text,
	"technical_indicators" jsonb,
	"tags" text[],
	"status" text DEFAULT 'active' NOT NULL,
	"pnl" real,
	"pnl_percentage" real,
	"close_price" real,
	"closed_at" timestamp,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"copies" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
CREATE TABLE IF NOT EXISTS "user_daily_quests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"quest_id" varchar NOT NULL,
	"current_progress" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"xp_earned" integer DEFAULT 0,
	"stream_earned" integer DEFAULT 0,
	"reward_claimed" boolean DEFAULT false,
	"quest_date" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "user_event_participation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"event_id" varchar NOT NULL,
	"score" integer DEFAULT 0,
	"progress" jsonb,
	"current_rank" integer,
	"final_rank" integer,
	"rewards_earned" jsonb,
	"rewards_claimed" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "user_follows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" varchar NOT NULL,
	"following_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "user_levels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"current_level" integer DEFAULT 1,
	"current_xp" integer DEFAULT 0,
	"total_xp_earned" integer DEFAULT 0,
	"xp_to_next_level" integer DEFAULT 1000,
	"level_progress" real DEFAULT 0,
	"prestige_level" integer DEFAULT 0,
	"prestige_multiplier" real DEFAULT 1,
	"level_ups_this_week" integer DEFAULT 0,
	"level_ups_this_month" integer DEFAULT 0,
	"last_level_up" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_levels_user_id_unique" UNIQUE("user_id")
);
CREATE TABLE IF NOT EXISTS "user_season_passes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"season_id" varchar NOT NULL,
	"current_tier" integer DEFAULT 1,
	"current_xp" integer DEFAULT 0,
	"total_season_xp" integer DEFAULT 0,
	"has_premium" boolean DEFAULT false,
	"premium_purchased_at" timestamp,
	"free_rewards_claimed" jsonb,
	"premium_rewards_claimed" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "user_streaks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"streak_type" text NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" timestamp,
	"streak_start_date" timestamp,
	"milestones_reached" jsonb,
	"grace_used_today" boolean DEFAULT false,
	"total_graces_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "user_weekly_missions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"mission_id" varchar NOT NULL,
	"objectives_progress" jsonb,
	"overall_progress" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"xp_earned" integer DEFAULT 0,
	"stream_earned" integer DEFAULT 0,
	"reward_claimed" boolean DEFAULT false,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "weekly_missions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"mission_type" text NOT NULL,
	"objectives" jsonb NOT NULL,
	"xp_reward" integer DEFAULT 500 NOT NULL,
	"stream_reward" integer DEFAULT 0,
	"badge_reward" text,
	"title_reward" text,
	"difficulty" text DEFAULT 'medium',
	"category" text DEFAULT 'general',
	"is_active" boolean DEFAULT true,
	"requires_level" integer DEFAULT 1,
	"week_number" integer,
	"year" integer,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "xp_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"xp_amount" integer NOT NULL,
	"xp_type" text NOT NULL,
	"source" text NOT NULL,
	"source_id" varchar,
	"description" text,
	"multiplier_applied" real DEFAULT 1,
	"level_at_time" integer,
	"caused_level_up" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
ALTER TABLE "bounty_collaborators" ADD CONSTRAINT "bounty_collaborators_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bounty_collaborators" ADD CONSTRAINT "bounty_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bounty_collaborators" ADD CONSTRAINT "bounty_collaborators_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "copy_trading_positions" ADD CONSTRAINT "copy_trading_positions_copier_id_users_id_fk" FOREIGN KEY ("copier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "copy_trading_positions" ADD CONSTRAINT "copy_trading_positions_trader_id_traders_id_fk" FOREIGN KEY ("trader_id") REFERENCES "public"."traders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "copy_trading_positions" ADD CONSTRAINT "copy_trading_positions_signal_id_trading_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."trading_signals"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "gamification_notifications" ADD CONSTRAINT "gamification_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pattern_alerts" ADD CONSTRAINT "pattern_alerts_parent_alert_id_pattern_alerts_id_fk" FOREIGN KEY ("parent_alert_id") REFERENCES "public"."pattern_alerts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "trader_performance" ADD CONSTRAINT "trader_performance_trader_id_traders_id_fk" FOREIGN KEY ("trader_id") REFERENCES "public"."traders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "traders" ADD CONSTRAINT "traders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "trading_signals" ADD CONSTRAINT "trading_signals_trader_id_traders_id_fk" FOREIGN KEY ("trader_id") REFERENCES "public"."traders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_daily_quests" ADD CONSTRAINT "user_daily_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_daily_quests" ADD CONSTRAINT "user_daily_quests_quest_id_daily_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."daily_quests"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_event_participation" ADD CONSTRAINT "user_event_participation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_event_participation" ADD CONSTRAINT "user_event_participation_event_id_gamification_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."gamification_events"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_levels" ADD CONSTRAINT "user_levels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_season_passes" ADD CONSTRAINT "user_season_passes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_season_passes" ADD CONSTRAINT "user_season_passes_season_id_season_passes_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season_passes"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_weekly_missions" ADD CONSTRAINT "user_weekly_missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_weekly_missions" ADD CONSTRAINT "user_weekly_missions_mission_id_weekly_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."weekly_missions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;