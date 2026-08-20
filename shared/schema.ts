import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, real, doublePrecision, uniqueIndex, unique, index, foreignKey, type AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password"), // Make password optional for social logins
  email: text("email"),
  walletAddress: text("wallet_address"),
  ensName: text("ens_name"),
  avatar: text("avatar"),
  bio: text("bio"),
  // Twitter OAuth fields
  twitterId: text("twitter_id").unique(),
  twitterUsername: text("twitter_username"),
  twitterDisplayName: text("twitter_display_name"),
  twitterVerified: boolean("twitter_verified").default(false),
  // Auth provider tracking
  authProvider: text("auth_provider").default("local"), // local, twitter, wallet
  // AI Agent fields
  isAiAgent: boolean("is_ai_agent").default(false),
  agentPersonality: jsonb("agent_personality"), // { riskTolerance, activityLevel, expertise, tradingStyle, contentFocus }
  agentMetadata: jsonb("agent_metadata"), // { timezone, sleepSchedule, skillLevel, behaviorPatterns }
  streamPoints: integer("stream_points").default(0), // Points balance for future airdrop
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  usernameIdx: index("idx_users_username").on(table.username),
  walletAddressIdx: index("idx_users_wallet_address").on(table.walletAddress),
}));

export const summaries = pgTable("summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  originalUrl: text("original_url").notNull(),
  originalDuration: integer("original_duration"), // in seconds
  contentType: text("content_type").notNull(), // podcast, video, livestream
  platform: text("platform").notNull(), // youtube, spotify, twitch, etc
  transcript: text("transcript"),
  summary: text("summary"),
  tldrSummary: text("tldr_summary"),
  blogPost: text("blog_post"),
  marketAnalysis: text("market_analysis"),
  rawData: jsonb("raw_data"),
  keyInsights: jsonb("key_insights"), // array of insight objects
  chapters: jsonb("chapters"), // array of chapter objects
  tags: text("tags").array(),
  creatorId: varchar("creator_id").references(() => users.id),
  isPublic: boolean("is_public").default(true),
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  accuracy: integer("accuracy"), // percentage
  // Content intelligence fields
  trends: jsonb("trends"), // trending topics and patterns
  narratives: jsonb("narratives"), // main storylines and themes
  executiveSummary: text("executive_summary"), // concise 2-3 sentence summary
  bulletPoints: jsonb("bullet_points"), // key points array
  timeline: jsonb("timeline"), // content progression timeline
  keyQuotes: jsonb("key_quotes"), // notable quotes with timestamps
  actionItems: jsonb("action_items"), // actionable insights
  entities: jsonb("entities"), // people, companies, technologies mentioned
  themes: jsonb("themes"), // central themes and topics
  marketSentiment: text("market_sentiment"), // sentiment analysis result
  expertCredibility: integer("expert_credibility"), // credibility score 0-100
  conflictingViews: jsonb("conflicting_views"), // opposing viewpoints
  sourceCredibility: text("source_credibility"), // source rating A+ to D
  confidenceLevel: real("confidence_level"), // AI confidence 0-1
  marketOutlook: text("market_outlook"), // overall outlook assessment
  arweaveId: text("arweave_id"), // decentralized storage reference
  ipfsHash: text("ipfs_hash"), // alternative decentralized storage
  nftTokenId: text("nft_token_id"), // NFT token ID if minted
  nftTxHash: text("nft_tx_hash"), // NFT minting transaction hash
  
  // AI-generated prediction markets from content
  suggestedMarkets: jsonb("suggested_markets"), // AI extracted predictions: [{ question, description, category, deadline, confidence, tags }]
  submitterPredictions: jsonb("submitter_predictions"), // Bounty claimer's predictions: [{ question, prediction: "yes" | "no", confidence, rationale }]
  analysisAnswers: jsonb("analysis_answers"), // Answers to bounty analysis questions: [{ questionId, answer }]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_summaries_created_at").on(table.createdAt),
  creatorIdIdx: index("idx_summaries_creator_id").on(table.creatorId),
}));

export const bounties = pgTable("bounties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contentUrl: text("content_url").notNull(),
  bountyType: text("bounty_type").notNull().default("content"), // content (YouTube/podcast) or knowledge_question (AI-verified Q&A)
  expectedAnswer: text("expected_answer"), // For knowledge_question: AI-generated expected answer criteria
  verificationCriteria: jsonb("verification_criteria"), // For knowledge_question: criteria for AI to verify answer correctness
  reward: integer("reward").notNull(), // reward amount in smallest unit
  tokenType: text("token_type").notNull().default("STREAM"), // STREAM, ETH, USDC
  tokenAddress: text("token_address"), // contract address for the token
  tipPool: integer("tip_pool").default(0), // additional tips from community
  deadline: timestamp("deadline"),
  difficulty: text("difficulty").default("medium"), // easy, medium, hard, expert
  category: text("category"), // DeFi, NFT, Layer2, etc
  tags: text("tags").array(),
  creatorId: varchar("creator_id").references(() => users.id),
  creatorWallet: text("creator_wallet").notNull(), // blockchain wallet address
  assigneeId: varchar("assignee_id").references(() => users.id),
  claimerWallet: text("claimer_wallet"), // blockchain wallet of claimer
  summaryId: varchar("summary_id").references(() => summaries.id),
  status: text("status").notNull().default("open"), // open, claimed, in_progress, completed, expired, cancelled
  contractBountyId: integer("contract_bounty_id"), // on-chain bounty ID from smart contract
  blockchainTxHash: text("blockchain_tx_hash"), // transaction hash for bounty creation
  completionTxHash: text("completion_tx_hash"), // transaction hash for bounty completion
  claimedAt: timestamp("claimed_at"),
  completedAt: timestamp("completed_at"),
  
  // Engagement tier system
  engagementTier: text("engagement_tier").default("basic"), // basic, analysis, prediction
  analysisQuestions: jsonb("analysis_questions"), // [{ id, question, type: "text" | "choice" }]
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_bounties_created_at").on(table.createdAt),
  creatorIdIdx: index("idx_bounties_creator_id").on(table.creatorId),
  statusIdx: index("idx_bounties_status").on(table.status),
}));

export const tipContributions = pgTable("tip_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bountyId: varchar("bounty_id").references(() => bounties.id).notNull(),
  tipperId: varchar("tipper_id").references(() => users.id),
  tipperWallet: text("tipper_wallet").notNull(),
  amount: integer("amount").notNull(), // tip amount in smallest unit
  tokenType: text("token_type").notNull().default("STREAM"), // STREAM, ETH, USDC
  blockchainTxHash: text("blockchain_tx_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bountyHunters = pgTable("bounty_hunters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  walletAddress: text("wallet_address").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  level: integer("level").default(1), // 1-10 levels
  reputation: integer("reputation").default(0), // 0-1000 points
  currentStreak: integer("current_streak").default(0), // consecutive completions
  longestStreak: integer("longest_streak").default(0),
  totalEarned: integer("total_earned").default(0), // total rewards in wei
  totalBounties: integer("total_bounties").default(0),
  completedBounties: integer("completed_bounties").default(0),
  completionRate: real("completion_rate").default(0), // 0-100%
  averageQuality: real("average_quality").default(0), // 0-100
  averageCompletionTime: integer("average_completion_time"), // in hours
  badges: text("badges").array(), // ["speed_demon", "quality_master", "first_bounty"]
  specializations: text("specializations").array(), // ["DeFi", "NFT", "Layer2"]
  isActive: boolean("is_active").default(true),
  lastCompletedAt: timestamp("last_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bountyQualityScores = pgTable("bounty_quality_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bountyId: varchar("bounty_id").references(() => bounties.id).notNull().unique(),
  summaryId: varchar("summary_id").references(() => summaries.id),
  aiScore: integer("ai_score"), // 0-100 from GPT-4o analysis
  humanScore: integer("human_score"), // 0-100 from community voting (future)
  plagiarismScore: integer("plagiarism_score"), // 0-100, higher = more unique
  accuracyScore: integer("accuracy_score"), // 0-100 content accuracy
  completenessScore: integer("completeness_score"), // 0-100 how complete
  readabilityScore: integer("readability_score"), // 0-100 ease of reading
  overallScore: integer("overall_score"), // weighted average
  feedback: text("feedback"), // AI-generated feedback
  metadata: jsonb("metadata"), // additional scoring details
  scoredAt: timestamp("scored_at").defaultNow(),
});

export const bountyEngagements = pgTable("bounty_engagements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bountyId: varchar("bounty_id").references(() => bounties.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  engagementType: text("engagement_type").notNull(), // view, share, comment, like, bookmark
  metadata: jsonb("metadata"), // platform for share, comment text, etc
  ipAddress: text("ip_address"), // for anonymous tracking
  createdAt: timestamp("created_at").defaultNow(),
});

export const userInteractions = pgTable("user_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  summaryId: varchar("summary_id").references(() => summaries.id),
  interactionType: text("interaction_type").notNull(), // like, bookmark, share, view, sector_click, story_click, filter_change, time_spent
  targetType: text("target_type"), // summary, sector, story, filter
  targetId: text("target_id"), // ID of the target (sector name, story ID, etc.)
  metadata: jsonb("metadata"), // additional interaction data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_user_interactions_created_at").on(table.createdAt),
  userIdIdx: index("idx_user_interactions_user_id").on(table.userId),
  targetTypeIdx: index("idx_user_interactions_target_type").on(table.targetType),
}));

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  interests: jsonb("interests"), // { sectors: {DeFi: 0.8, "Layer 1": 0.6}, contentTypes: {social: 0.9, news: 0.7}, topics: [...] }
  timePreference: text("time_preference").default("24h"), // 1h, 6h, 24h, 7d
  contentPriority: text("content_priority").default("engagement"), // engagement, recency, relevance
  notificationSettings: jsonb("notification_settings"), // { major_trends: true, sector_alerts: true, price_movements: false }
  filterPreferences: jsonb("filter_preferences"), // saved filter combinations
  feedCustomization: jsonb("feed_customization"), // layout preferences, section priorities
  isOnboarded: boolean("is_onboarded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeStacks = pgTable("knowledge_stacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  summaryIds: text("summary_ids").array(), // array of summary IDs
  isPublic: boolean("is_public").default(true),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userNotes = pgTable("user_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  summaryId: varchar("summary_id").notNull(), // Removed FK constraint to allow journal entries
  noteText: text("note_text").notNull(),
  noteType: text("note_type").notNull().default("footnote"), // footnote, analysis, insight
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Unified Commenting & Discussion System
// Used for both standalone discussions and embedded comments on bounties, markets, summaries, etc.
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"), // optional image attachment
  tags: text("tags").array(), // crypto topics: ["Bitcoin", "DeFi", "Layer2"]
  
  // Thread support for nested replies
  parentId: varchar("parent_id").references((): AnyPgColumn => conversations.id), // for comment threading
  
  // Optional relationships to entities (null = standalone post)
  linkedSummaryId: varchar("linked_summary_id").references(() => summaries.id),
  linkedMarketId: varchar("linked_market_id").references(() => predictionMarkets.id),
  linkedBountyId: varchar("linked_bounty_id").references(() => bounties.id),
  
  // Engagement metrics
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0), // reply count
  sharesCount: integer("shares_count").default(0),
  viewsCount: integer("views_count").default(0),
  
  // Trending & relevance
  trendingScore: real("trending_score").default(0), // calculated from engagement velocity
  engagementRate: real("engagement_rate").default(0), // engagement / views
  
  // Visibility
  isPublic: boolean("is_public").default(true),
  isPinned: boolean("is_pinned").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog posts for crypto news/stories

export const conversationLikes = pgTable("conversation_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // One like per user per conversation (name matches existing DB constraint)
  uniqueConversationUser: unique("conversation_likes_conversation_id_user_id_key").on(table.conversationId, table.userId),
}));

export const conversationComments = pgTable("conversation_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentCommentId: varchar("parent_comment_id"), // for nested replies (self-FK declared below with explicit name)
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Name matches the DB constraint (Postgres truncates identifiers to 63 chars)
  parentCommentFk: foreignKey({ columns: [table.parentCommentId], foreignColumns: [table.id], name: "conversation_comments_parent_comment_id_conversation_comments_i" }),
}));

export const conversationShares = pgTable("conversation_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platform: text("platform"), // 'twitter', 'lens', 'farcaster', 'internal'
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  metadata: jsonb("metadata"), // optional context data (e.g., market data referenced, bounties discussed)
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral System
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  code: text("code").notNull().unique(),
  totalSignups: integer("total_signups").default(0),
  totalRewardsEarned: real("total_rewards_earned").default(0), // STREAM tokens
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralSignups = pgTable("referral_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralCodeId: varchar("referral_code_id").references(() => referralCodes.id).notNull(),
  referrerId: varchar("referrer_id").references(() => users.id).notNull(),
  referredUserId: varchar("referred_user_id").references(() => users.id).notNull(),
  rewardAmount: real("reward_amount").default(100), // 100 STREAM per signup
  rewardClaimed: boolean("reward_claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social Features
export const userFollows = pgTable("user_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id).notNull(),
  followingId: varchar("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Category Follows - Users can follow bounty categories for personalized feed
export const categoryFollows = pgTable("category_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(), // DeFi, NFT, Layer2, Gaming, etc.
  createdAt: timestamp("created_at").defaultNow(),
});



// Real-time Collaboration

export const bountyCollaborators = pgTable("bounty_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bountyId: varchar("bounty_id").references(() => bounties.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // 'owner', 'collaborator'
  rewardShare: real("reward_share").notNull(), // percentage (0-100)
  status: text("status").notNull().default("active"), // 'active', 'pending', 'removed'
  invitedBy: varchar("invited_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBountyCollaboratorSchema = createInsertSchema(bountyCollaborators).pick({
  bountyId: true,
  userId: true,
  role: true,
  rewardShare: true,
  status: true,
  invitedBy: true,
});

export type InsertBountyCollaborator = z.infer<typeof insertBountyCollaboratorSchema>;

export type BountyCollaborator = typeof bountyCollaborators.$inferSelect;

export const collaborationSessions = pgTable("collaboration_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bountyId: varchar("bounty_id").references(() => bounties.id).notNull(),
  activeUsers: jsonb("active_users"), // array of {userId, cursor, lastSeen}
  contentSnapshot: text("content_snapshot"), // current working content
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});





// Knowledge Avatars System - Enhanced with Deep Alpha Intelligence
export const knowledgeAvatars = pgTable("knowledge_avatars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  bio: text("bio"),
  expertise: text("expertise"),
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  twitterHandle: text("twitter_handle"),
  linkedinUrl: text("linkedin_url"),
  isActive: boolean("is_active").default(true),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  verificationStatus: text("verification_status").default("unverified"),
  primaryInterests: text("primary_interests").array(),
  investmentFocus: text("investment_focus").array(),
  notableInvestments: text("notable_investments").array(),
  philosophicalViews: text("philosophical_views").array(),
  recentThoughts: text("recent_thoughts").array(),
  netWorth: text("net_worth"),
  portfolioRoi: real("portfolio_roi"),
  // Legacy performance stats (kept per 2026-08-16 drift verdict; seeded by auto-seed)
  sharpeRatio: real("sharpe_ratio"),
  alphaGenerated: real("alpha_generated"),
  totalInvestments: integer("total_investments"),
  successfulExits: integer("successful_exits"),
  activeProjects: integer("active_projects"),
  accuracyPercentage: real("accuracy_percentage"),
  influenceScore: real("influence_score"),
  investmentCount: integer("investment_count"),
  // Deep Alpha Intelligence Fields
  investmentThesis: text("investment_thesis"), // core investment philosophy
  bestCalls: jsonb("best_calls"), // [{name, date, entry, exit, roi, outcome}]
  worstCalls: jsonb("worst_calls"), // [{name, date, entry, exit, roi, outcome}]
  investmentHistory: jsonb("investment_history"), // comprehensive timeline
  recentActivity: jsonb("recent_activity"), // latest moves [{date, action, details}]
  category: text("category"), // DeFi, L1/L2, VC, Trading, Infrastructure
  riskScore: real("risk_score"), // portfolio risk profile 0-100
  volatility: real("volatility"), // portfolio volatility percentage
  performanceHistory: jsonb("performance_history"), // [{year, roi, highlights}]
  marketOutlook: text("market_outlook"), // current market view/thesis
  // Learning & Educational Content
  podcastAppearances: jsonb("podcast_appearances"), // [{name, episode, url, date, duration, keyTopics: []}]
  recommendedBooks: jsonb("recommended_books"), // [{title, author, reason, category, url}]
  mentors: jsonb("mentors"), // [{name, relationship, influence, active: boolean}]
  // Autonomous Trading Persona Fields
  tradingStyle: text("trading_style"), // swing_trader, dip_buyer, momentum, contrarian, value, growth
  expertiseDomains: text("expertise_domains").array(), // defi, l1, l2, ai_tokens, memecoins, infrastructure, payments
  riskTolerance: text("risk_tolerance"), // conservative, moderate, aggressive
  maxPositionPct: real("max_position_pct").default(10), // max % of balance per trade
  decisionBias: text("decision_bias"), // technical, fundamental, sentiment, news_driven
  tradingFrequency: text("trading_frequency"), // daily, weekly, opportunistic
  streamBalance: integer("stream_balance").default(100000), // STREAM points for trading
  totalTrades: integer("total_trades").default(0),
  winRate: real("win_rate").default(0),
  avgTradeRoi: real("avg_trade_roi").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Avatar Conversations - Chat history between users and knowledge avatars
export const avatarConversations = pgTable("avatar_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id).notNull(),
  messages: jsonb("messages").default([]).notNull(), // [{role: 'user'|'assistant', content: string, timestamp: string}]
  title: text("title"), // Auto-generated conversation title
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Avatar Following System
export const avatarFollows = pgTable("avatar_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id, { onDelete: "cascade" }).notNull(),
  followedAt: timestamp("followed_at").defaultNow(),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  // Ensure unique user-avatar pairs (name matches existing DB constraint)
}, (table) => ({
  uniqueUserAvatar: unique("avatar_follows_user_id_avatar_id_key").on(table.userId, table.avatarId),
}));

// Avatar Content Interactions
export const avatarContentInteractions = pgTable("avatar_content_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id, { onDelete: "cascade" }).notNull(),
  contentId: text("content_id").notNull(), // ID of specific content piece
  interactionType: text("interaction_type").notNull(), // like, bookmark, share, comment
  metadata: jsonb("metadata"), // Additional interaction data
  createdAt: timestamp("created_at").defaultNow(),
});

// Avatar Insights & Analytics
export const avatarInsights = pgTable("avatar_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id, { onDelete: "cascade" }).notNull(),
  insightType: text("insight_type").notNull(), // thought, prediction, analysis, recommendation
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"), // investing, technology, philosophy, etc.
  tags: text("tags").array(),
  sourceUrl: text("source_url"), // Original source if from external content
  confidence: integer("confidence").default(50), // 0-100 confidence in insight
  isHighlighted: boolean("is_highlighted").default(false), // Featured insight
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Entrepreneur predictions tracking table

// ====================
// SOCIAL TRADING PLATFORM TABLES
// ====================

// Trader Profiles - Extended user data for trading platform
export const traders = pgTable("traders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  walletAddress: text("wallet_address").notNull().unique(),
  
  // Trader Identity
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  isVerified: boolean("is_verified").default(false),
  tradingStyle: text("trading_style"), // swing, day, scalp, position, algorithmic
  
  // Performance Metrics
  totalTrades: integer("total_trades").default(0),
  winRate: real("win_rate").default(0), // 0-100
  totalPnl: real("total_pnl").default(0), // Total profit/loss in USD
  roi: real("roi").default(0), // Return on investment percentage
  sharpeRatio: real("sharpe_ratio"), // Risk-adjusted return
  maxDrawdown: real("max_drawdown"), // Maximum drawdown percentage
  
  // Trading Activity
  avgHoldTime: integer("avg_hold_time"), // Average position hold time in hours
  avgPositionSize: real("avg_position_size"), // Average position size in USD
  totalVolume: real("total_volume").default(0), // Total trading volume in USD
  
  // Social Metrics
  followers: integer("followers").default(0),
  copiers: integer("copiers").default(0), // Active copy traders
  totalCopied: integer("total_copied").default(0), // Lifetime copy count
  reputation: integer("reputation").default(50), // 0-100 reputation score
  
  // Trader Settings
  isPublic: boolean("is_public").default(true), // Public or private profile
  allowCopyTrading: boolean("allow_copy_trading").default(true),
  minCopyAmount: real("min_copy_amount").default(100), // Minimum USD to copy
  maxCopiers: integer("max_copiers").default(1000), // Max simultaneous copiers
  
  // Risk Profile
  riskLevel: text("risk_level").notNull().default("medium"), // low, medium, high, extreme
  preferredAssets: text("preferred_assets").array(), // BTC, ETH, SOL, etc.
  tradingPairs: text("trading_pairs").array(), // BTC/USD, ETH/USD, etc.
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastTradeAt: timestamp("last_trade_at"),
});

// Bounty Templates - Pre-made bounty templates for quick creation
export const bountyTemplates = pgTable("bounty_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // DeFi, NFT, Layer2, Gaming, Infrastructure
  difficulty: text("difficulty").notNull().default("medium"), // easy, medium, hard, expert
  suggestedReward: integer("suggested_reward"), // suggested reward amount
  suggestedTokenType: text("suggested_token_type").default("STREAM"), // STREAM, ETH, USDC
  tags: text("tags").array(),
  contentType: text("content_type"), // podcast, video, livestream, article
  platform: text("platform"), // youtube, spotify, twitch, etc
  requirements: jsonb("requirements"), // array of requirement strings
  deliverables: jsonb("deliverables"), // array of deliverable strings
  exampleUrls: text("example_urls").array(), // example content URLs
  isPublic: boolean("is_public").default(true),
  usageCount: integer("usage_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading Signals - Individual signals posted by traders

export const tradingSignals = pgTable("trading_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  traderId: varchar("trader_id").references(() => traders.id).notNull(),
  
  // Signal Details
  asset: text("asset").notNull(), // BTC, ETH, SOL
  pair: text("pair").notNull(), // BTC/USD, ETH/USD
  direction: text("direction").notNull(), // long, short
  signalType: text("signal_type").notNull(), // entry, exit, take_profit, stop_loss
  
  // Price Targets
  entryPrice: real("entry_price").notNull(),
  targetPrice: real("target_price"),
  stopLoss: real("stop_loss"),
  currentPrice: real("current_price"),
  
  // Position Details
  leverage: integer("leverage").default(1), // 1x, 5x, 10x, etc.
  positionSize: real("position_size"), // USD value
  confidence: integer("confidence").default(75), // 0-100
  timeframe: text("timeframe").notNull(), // 5m, 15m, 1h, 4h, 1d, 1w
  
  // Analysis
  reasoning: text("reasoning"), // Why this signal
  technicalIndicators: jsonb("technical_indicators"), // RSI, MACD, etc.
  tags: text("tags").array(), // breakout, reversal, trend_continuation
  
  // Performance Tracking
  status: text("status").notNull().default("active"), // active, closed, stopped_out, target_hit
  pnl: real("pnl"), // Actual profit/loss when closed
  pnlPercentage: real("pnl_percentage"), // P/L as percentage
  closePrice: real("close_price"),
  closedAt: timestamp("closed_at"),
  
  // Social Engagement
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  copies: integer("copies").default(0), // How many copied this signal
  comments: integer("comments").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Signal expiration time
});

export const insertTradingSignalSchema = createInsertSchema(tradingSignals).pick({
  traderId: true,
  asset: true,
  pair: true,
  direction: true,
  signalType: true,
  entryPrice: true,
  targetPrice: true,
  stopLoss: true,
  currentPrice: true,
  leverage: true,
  positionSize: true,
  confidence: true,
  timeframe: true,
  reasoning: true,
  technicalIndicators: true,
  tags: true,
  expiresAt: true,
});

export type InsertTradingSignal = z.infer<typeof insertTradingSignalSchema>;
export type DbTradingSignal = typeof tradingSignals.$inferSelect;

export type TradingSignal = {
  id: string;
  eventId?: string;
  predictionId?: string;
  
  // Signal Details
  signalType: 'entry' | 'exit' | 'hedge' | 'risk_management' | 'position_sizing';
  action: 'buy' | 'sell' | 'hold' | 'reduce' | 'increase';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Asset Information
  symbol: string;
  assetType: 'crypto' | 'stock' | 'commodity' | 'currency';
  currentPrice: number;
  
  // Signal Specifics
  direction: 'long' | 'short' | 'neutral';
  strength: number; // 0-100 signal strength
  conviction: number; // 0-100 conviction level
  
  // Entry/Exit Levels
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  riskRewardRatio?: number;
  
  // Position Sizing
  recommendedAllocation?: number; // percentage of portfolio
  maxRisk?: number; // maximum risk percentage
  positionSize?: number; // suggested position size
  
  // Timing
  timeframe: '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | 'long_term';
  validUntil: string;
  urgency: 'immediate' | 'within_1h' | 'within_24h' | 'within_week';
  
  // Rationale and Context
  reasoning: string[];
  catalysts: string[]; // What's driving this signal
  risks: string[]; // Potential risks to consider
  marketContext: string;
  
  // Performance Tracking
  isExecuted?: boolean;
  executedAt?: string;
  executionPrice?: number;
  outcome?: 'profitable' | 'loss' | 'breakeven' | 'pending';
  realizedPnL?: number;
  
  // Metadata
  confidence: number; // 0-100 confidence in signal
  source: 'model_prediction' | 'manual_analysis' | 'hybrid' | 'risk_management';
  createdAt: string;
  lastUpdated: string;
};

// Copy Trading Positions - Active copy trading relationships
export const copyTradingPositions = pgTable("copy_trading_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Participants
  copierId: varchar("copier_id").references(() => users.id).notNull(),
  traderId: varchar("trader_id").references(() => traders.id).notNull(),
  signalId: varchar("signal_id").references(() => tradingSignals.id),
  
  // Position Details
  asset: text("asset").notNull(),
  pair: text("pair").notNull(),
  direction: text("direction").notNull(), // long, short
  
  // Entry Information
  entryPrice: real("entry_price").notNull(),
  positionSize: real("position_size").notNull(), // USD value
  leverage: integer("leverage").default(1),
  
  // Exit Information
  currentPrice: real("current_price"),
  exitPrice: real("exit_price"),
  stopLoss: real("stop_loss"),
  takeProfit: real("take_profit"),
  
  // Performance
  unrealizedPnl: real("unrealized_pnl"),
  realizedPnl: real("realized_pnl"),
  pnlPercentage: real("pnl_percentage"),
  fees: real("fees").default(0),
  
  // Status
  status: text("status").notNull().default("open"), // open, closed, liquidated
  
  // Risk Management
  initialRisk: real("initial_risk"), // % of portfolio risked
  maxDrawdown: real("max_drawdown"),
  
  // Timestamps
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trader Performance History - Time-series performance data
export const traderPerformance = pgTable("trader_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  traderId: varchar("trader_id").references(() => traders.id).notNull(),
  
  // Time Period
  period: text("period").notNull(), // daily, weekly, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Performance Metrics
  trades: integer("trades").default(0),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  winRate: real("win_rate").default(0),
  
  // Financial Metrics
  totalPnl: real("total_pnl").default(0),
  totalVolume: real("total_volume").default(0),
  roi: real("roi").default(0),
  sharpeRatio: real("sharpe_ratio"),
  
  // Risk Metrics
  maxDrawdown: real("max_drawdown"),
  avgRiskPerTrade: real("avg_risk_per_trade"),
  volatility: real("volatility"),
  
  // Social Metrics
  newFollowers: integer("new_followers").default(0),
  newCopiers: integer("new_copiers").default(0),
  totalFollowers: integer("total_followers").default(0),
  totalCopiers: integer("total_copiers").default(0),
  
  // Engagement
  signalsPosted: integer("signals_posted").default(0),
  totalViews: integer("total_views").default(0),
  totalLikes: integer("total_likes").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Trading Alerts - User alert configurations

// Push Notification Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Push subscription data from browser
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // Public key
  auth: text("auth").notNull(), // Auth secret
  
  // Notification preferences
  marketResolutions: boolean("market_resolutions").default(true),
  priceAlerts: boolean("price_alerts").default(true),
  bountyUpdates: boolean("bounty_updates").default(true),
  tradeConfirmations: boolean("trade_confirmations").default(true),
  aiAgentActivity: boolean("ai_agent_activity").default(false),
  weeklyDigest: boolean("weekly_digest").default(true),
  
  // Market Intelligence notifications
  morningBriefing: boolean("morning_briefing").default(true),
  eveningRecap: boolean("evening_recap").default(true),
  marketMovers: boolean("market_movers").default(true),
  macroAlerts: boolean("macro_alerts").default(true),
  breakingNews: boolean("breaking_news").default(true),
  
  // CoinDesk & News notifications
  coindeskNews: boolean("coindesk_news").default(true),
  
  // Trading Metrics notifications
  tradingMetrics: boolean("trading_metrics").default(true),
  whaleAlerts: boolean("whale_alerts").default(true),
  liquidationAlerts: boolean("liquidation_alerts").default(true),
  fundingRateAlerts: boolean("funding_rate_alerts").default(true),
  volumeSpikes: boolean("volume_spikes").default(true),
  weeklyPreview: boolean("weekly_preview").default(true),
  
  // Streaming notifications
  streamLive: boolean("stream_live").default(true), // When someone you follow goes live
  streamTips: boolean("stream_tips").default(true), // When you receive tips as a host
  streamMilestones: boolean("stream_milestones").default(true), // Viewer milestones (100, 500, 1K)
  streamReminders: boolean("stream_reminders").default(true), // Scheduled stream reminders
  
  // Metadata
  deviceInfo: text("device_info"), // Browser/device info
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
});
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  summaries: many(summaries),
  bounties: many(bounties),
  knowledgeStacks: many(knowledgeStacks),
  interactions: many(userInteractions),
  notes: many(userNotes),
  referralCodes: many(referralCodes),
  referredBy: many(referralSignups, { relationName: "referredUser" }),
  referrals: many(referralSignups, { relationName: "referrer" }),
  followers: many(userFollows, { relationName: "following" }),
  following: many(userFollows, { relationName: "follower" }),
}));

export const summariesRelations = relations(summaries, ({ one, many }) => ({
  creator: one(users, {
    fields: [summaries.creatorId],
    references: [users.id],
  }),
  bounty: one(bounties, {
    fields: [summaries.id],
    references: [bounties.summaryId],
  }),
  interactions: many(userInteractions),
  notes: many(userNotes),
}));

export const bountiesRelations = relations(bounties, ({ one }) => ({
  creator: one(users, {
    fields: [bounties.creatorId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [bounties.assigneeId],
    references: [users.id],
  }),
  summary: one(summaries, {
    fields: [bounties.summaryId],
    references: [summaries.id],
  }),
}));

export const userInteractionsRelations = relations(userInteractions, ({ one }) => ({
  user: one(users, {
    fields: [userInteractions.userId],
    references: [users.id],
  }),
  summary: one(summaries, {
    fields: [userInteractions.summaryId],
    references: [summaries.id],
  }),
}));

export const knowledgeStacksRelations = relations(knowledgeStacks, ({ one }) => ({
  creator: one(users, {
    fields: [knowledgeStacks.creatorId],
    references: [users.id],
  }),
}));

export const userNotesRelations = relations(userNotes, ({ one }) => ({
  user: one(users, {
    fields: [userNotes.userId],
    references: [users.id],
  }),
  // Removed summary relation since summaryId can now be journal entries
}));




// Knowledge Avatar Relations
export const knowledgeAvatarsRelations = relations(knowledgeAvatars, ({ many }) => ({
  followers: many(avatarFollows),
  contentInteractions: many(avatarContentInteractions),
  insights: many(avatarInsights),
}));

export const avatarFollowsRelations = relations(avatarFollows, ({ one }) => ({
  user: one(users, {
    fields: [avatarFollows.userId],
    references: [users.id],
  }),
  avatar: one(knowledgeAvatars, {
    fields: [avatarFollows.avatarId],
    references: [knowledgeAvatars.id],
  }),
}));

export const avatarContentInteractionsRelations = relations(avatarContentInteractions, ({ one }) => ({
  user: one(users, {
    fields: [avatarContentInteractions.userId],
    references: [users.id],
  }),
  avatar: one(knowledgeAvatars, {
    fields: [avatarContentInteractions.avatarId],
    references: [knowledgeAvatars.id],
  }),
}));

export const avatarInsightsRelations = relations(avatarInsights, ({ one }) => ({
  avatar: one(knowledgeAvatars, {
    fields: [avatarInsights.avatarId],
    references: [knowledgeAvatars.id],
  }),
}));

// Pattern Recognition Relations will be defined after table definitions

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  walletAddress: true,
  ensName: true,
  avatar: true,
  bio: true,
  twitterId: true,
  twitterUsername: true,
  twitterDisplayName: true,
  twitterVerified: true,
  authProvider: true,
});

export const insertSummarySchema = createInsertSchema(summaries).pick({
  title: true,
  description: true,
  originalUrl: true,
  originalDuration: true,
  contentType: true,
  platform: true,
  transcript: true,
  summary: true,
  keyInsights: true,
  chapters: true,
  tags: true,
  creatorId: true,
  isPublic: true,
  processingStatus: true,
  accuracy: true,
  arweaveId: true,
  ipfsHash: true,
});

export const insertBountySchema = createInsertSchema(bounties).pick({
  title: true,
  description: true,
  contentUrl: true,
  reward: true,
  tokenType: true,
  tokenAddress: true,
  deadline: true,
  difficulty: true,
  category: true,
  tags: true,
  creatorId: true,
  creatorWallet: true,
  contractBountyId: true,
  blockchainTxHash: true,
});

export const insertTipContributionSchema = createInsertSchema(tipContributions).pick({
  bountyId: true,
  tipperId: true,
  tipperWallet: true,
  amount: true,
  tokenType: true,
  blockchainTxHash: true,
});

export const insertBountyHunterSchema = createInsertSchema(bountyHunters).pick({
  userId: true,
  walletAddress: true,
  displayName: true,
  bio: true,
  level: true,
  reputation: true,
  specializations: true,
});

export const insertBountyQualityScoreSchema = createInsertSchema(bountyQualityScores).pick({
  bountyId: true,
  summaryId: true,
  aiScore: true,
  humanScore: true,
  plagiarismScore: true,
  accuracyScore: true,
  completenessScore: true,
  readabilityScore: true,
  overallScore: true,
  feedback: true,
  metadata: true,
});

export const insertBountyEngagementSchema = createInsertSchema(bountyEngagements).pick({
  bountyId: true,
  userId: true,
  engagementType: true,
  metadata: true,
  ipAddress: true,
});

export const insertBountyTemplateSchema = createInsertSchema(bountyTemplates).pick({
  name: true,
  description: true,
  category: true,
  difficulty: true,
  suggestedReward: true,
  suggestedTokenType: true,
  tags: true,
  contentType: true,
  platform: true,
  requirements: true,
  deliverables: true,
  exampleUrls: true,
  isPublic: true,
  createdBy: true,
});

export const insertUserInteractionSchema = createInsertSchema(userInteractions).pick({
  userId: true,
  summaryId: true,
  interactionType: true,
  targetType: true,
  targetId: true,
  metadata: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  interests: true,
  timePreference: true,
  contentPriority: true,
  notificationSettings: true,
  filterPreferences: true,
  feedCustomization: true,
  isOnboarded: true,
});

export const insertKnowledgeStackSchema = createInsertSchema(knowledgeStacks).pick({
  title: true,
  description: true,
  creatorId: true,
  summaryIds: true,
  isPublic: true,
  tags: true,
});

export const insertUserNoteSchema = createInsertSchema(userNotes).pick({
  userId: true,
  summaryId: true,
  noteText: true,
  noteType: true,
  isPrivate: true,
});

// Social Conversations Schemas
export const insertConversationSchema = createInsertSchema(conversations).pick({
  authorId: true,
  content: true,
  imageUrl: true,
  tags: true,
  linkedSummaryId: true,
  linkedMarketId: true,
  isPublic: true,
  isPinned: true,
});

export const insertConversationLikeSchema = createInsertSchema(conversationLikes).pick({
  conversationId: true,
  userId: true,
});

export const insertConversationCommentSchema = createInsertSchema(conversationComments).pick({
  conversationId: true,
  userId: true,
  content: true,
  parentCommentId: true,
});

export const insertConversationShareSchema = createInsertSchema(conversationShares).pick({
  conversationId: true,
  userId: true,
  platform: true,
});

// Blog Posts Schemas


export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Referral System Schemas
export const insertReferralCodeSchema = createInsertSchema(referralCodes).pick({
  userId: true,
  code: true,
});

export const insertReferralSignupSchema = createInsertSchema(referralSignups).pick({
  referralCodeId: true,
  referrerId: true,
  referredUserId: true,
  rewardAmount: true,
});

// Social Features Schemas
export const insertUserFollowSchema = createInsertSchema(userFollows).pick({
  followerId: true,
  followingId: true,
});

export const insertCategoryFollowSchema = createInsertSchema(categoryFollows).pick({
  userId: true,
  category: true,
});



// Collaboration Schemas

export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions).pick({
  bountyId: true,
  activeUsers: true,
  contentSnapshot: true,
});





export const insertKnowledgeAvatarSchema = createInsertSchema(knowledgeAvatars).pick({
  name: true,
  handle: true,
  bio: true,
  expertise: true,
  imageUrl: true,
  websiteUrl: true,
  twitterHandle: true,
  linkedinUrl: true,
  isActive: true,
  followerCount: true,
  followingCount: true,
  verificationStatus: true,
  primaryInterests: true,
  investmentFocus: true,
  notableInvestments: true,
  philosophicalViews: true,
  recentThoughts: true,
});

export const insertAvatarConversationSchema = createInsertSchema(avatarConversations).pick({
  userId: true,
  avatarId: true,
  messages: true,
  title: true,
});

export const insertAvatarFollowSchema = createInsertSchema(avatarFollows).pick({
  userId: true,
  avatarId: true,
  notificationsEnabled: true,
});

export const insertAvatarContentInteractionSchema = createInsertSchema(avatarContentInteractions).pick({
  userId: true,
  avatarId: true,
  contentId: true,
  interactionType: true,
  metadata: true,
});

export const insertAvatarInsightSchema = createInsertSchema(avatarInsights).pick({
  avatarId: true,
  insightType: true,
  title: true,
  content: true,
  category: true,
  tags: true,
  sourceUrl: true,
  confidence: true,
  isHighlighted: true,
  publishedAt: true,
});


// Social Trading Insert Schemas
export const insertTraderSchema = createInsertSchema(traders).pick({
  userId: true,
  walletAddress: true,
  displayName: true,
  avatar: true,
  bio: true,
  tradingStyle: true,
  isPublic: true,
  allowCopyTrading: true,
  minCopyAmount: true,
  maxCopiers: true,
  riskLevel: true,
  preferredAssets: true,
  tradingPairs: true,
});


export const insertCopyTradingPositionSchema = createInsertSchema(copyTradingPositions).pick({
  copierId: true,
  traderId: true,
  signalId: true,
  asset: true,
  pair: true,
  direction: true,
  entryPrice: true,
  positionSize: true,
  leverage: true,
  stopLoss: true,
  takeProfit: true,
  initialRisk: true,
});


// Pattern Recognition Insert Schemas moved after table definitions

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summaries.$inferSelect;

export type InsertBounty = z.infer<typeof insertBountySchema>;
export type Bounty = typeof bounties.$inferSelect;

export type InsertTipContribution = z.infer<typeof insertTipContributionSchema>;
export type TipContribution = typeof tipContributions.$inferSelect;

export type InsertBountyHunter = z.infer<typeof insertBountyHunterSchema>;
export type BountyHunter = typeof bountyHunters.$inferSelect;

export type InsertBountyQualityScore = z.infer<typeof insertBountyQualityScoreSchema>;
export type BountyQualityScore = typeof bountyQualityScores.$inferSelect;

export type InsertBountyEngagement = z.infer<typeof insertBountyEngagementSchema>;
export type BountyEngagement = typeof bountyEngagements.$inferSelect;

export type InsertBountyTemplate = z.infer<typeof insertBountyTemplateSchema>;
export type BountyTemplate = typeof bountyTemplates.$inferSelect;

export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type InsertKnowledgeStack = z.infer<typeof insertKnowledgeStackSchema>;
export type KnowledgeStack = typeof knowledgeStacks.$inferSelect;

export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type UserNote = typeof userNotes.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertConversationLike = z.infer<typeof insertConversationLikeSchema>;
export type ConversationLike = typeof conversationLikes.$inferSelect;

export type InsertConversationComment = z.infer<typeof insertConversationCommentSchema>;
export type ConversationComment = typeof conversationComments.$inferSelect;

export type InsertConversationShare = z.infer<typeof insertConversationShareSchema>;
export type ConversationShare = typeof conversationShares.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;

export type InsertReferralSignup = z.infer<typeof insertReferralSignupSchema>;
export type ReferralSignup = typeof referralSignups.$inferSelect;

export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type UserFollow = typeof userFollows.$inferSelect;

export type InsertCategoryFollow = z.infer<typeof insertCategoryFollowSchema>;
export type CategoryFollow = typeof categoryFollows.$inferSelect;




export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;
export type CollaborationSession = typeof collaborationSessions.$inferSelect;





export type InsertKnowledgeAvatar = z.infer<typeof insertKnowledgeAvatarSchema>;
export type KnowledgeAvatar = typeof knowledgeAvatars.$inferSelect;

export type InsertAvatarConversation = z.infer<typeof insertAvatarConversationSchema>;
export type AvatarConversation = typeof avatarConversations.$inferSelect;

export type InsertAvatarFollow = z.infer<typeof insertAvatarFollowSchema>;
export type AvatarFollow = typeof avatarFollows.$inferSelect;

export type InsertAvatarContentInteraction = z.infer<typeof insertAvatarContentInteractionSchema>;
export type AvatarContentInteraction = typeof avatarContentInteractions.$inferSelect;

export type InsertAvatarInsight = z.infer<typeof insertAvatarInsightSchema>;
export type AvatarInsight = typeof avatarInsights.$inferSelect;


export type InsertTrader = z.infer<typeof insertTraderSchema>;
export type Trader = typeof traders.$inferSelect;


export type InsertCopyTradingPosition = z.infer<typeof insertCopyTradingPositionSchema>;
export type CopyTradingPosition = typeof copyTradingPositions.$inferSelect;

export type InsertTraderPerformance = typeof traderPerformance.$inferSelect;
export type TraderPerformance = typeof traderPerformance.$inferSelect;


// Cross-Market Signal Generation Types - Phase 3 Final Feature
export type CrossMarketSignal = {
  id: string;
  signalType: 'unified_trade_signal' | 'cross_market_alert' | 'regime_shift_signal' | 'correlation_break_signal' | 'composite_risk_signal';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Core signal information
  title: string;
  description: string;
  summary: string;
  
  // Unified scoring from all AI services
  compositeScore: {
    overall: number; // 0-100 overall signal strength
    confidence: number; // 0-100 confidence level
    components: {
      eventModelingScore: number; // Contribution from market event modeling
      patternRecognitionScore: number; // Contribution from pattern recognition
      volatilityForecastScore: number; // Contribution from volatility forecasting
      correlationAnalysisScore: number; // Contribution from correlation analysis
    };
    weightedAverage: number; // Weighted composite of all components
  };
  
  // Multi-asset signal generation
  affectedAssets: Array<{
    symbol: string;
    assetType: 'crypto' | 'stock' | 'commodity' | 'currency';
    signalStrength: number; // 0-100
    direction: 'bullish' | 'bearish' | 'neutral';
    expectedMove: number; // percentage price movement expected
    timeframe: '1h' | '4h' | '1d' | '1w' | '1m';
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  }>;
  
  // Cross-market correlations and relationships
  marketRelationships: Array<{
    asset1: string;
    asset2: string;
    correlationType: 'direct' | 'inverse' | 'leading' | 'lagging';
    strength: number; // 0-1 correlation strength
    breakdownProbability: number; // 0-100 probability correlation breaks
    timeDelay: number; // minutes/hours of delay
  }>;
  
  // Comprehensive trading recommendations
  tradingRecommendations: {
    primaryAction: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' | 'hedge';
    positionSizing: {
      recommendedAllocation: number; // percentage of portfolio
      maxRisk: number; // maximum risk percentage
      diversificationAdvice: string;
    };
    entryStrategy: {
      preferredEntry: number; // price level
      entryRange: { min: number; max: number };
      timingAdvice: string;
    };
    riskManagement: {
      stopLoss: number;
      takeProfit: number[];
      hedgingStrategy?: string;
      maxDrawdown: number;
    };
    timeHorizon: 'scalp' | 'day_trade' | 'swing' | 'position' | 'long_term';
  };
  
  // Advanced algorithm outputs
  algorithmicInsights: {
    eventDrivenFactors: Array<{
      eventType: string;
      impact: number; // 0-100 impact score
      probability: number; // 0-100 probability
      timeToEvent: number; // hours/days
    }>;
    patternMatchedSignals: Array<{
      patternType: string;
      confidence: number;
      successRate: number;
      averageMove: number;
    }>;
    volatilityPredictions: Array<{
      horizon: string;
      predictedVol: number;
      regime: 'low' | 'normal' | 'high' | 'extreme';
      riskMetrics: { var95: number; var99: number };
    }>;
    correlationShifts: Array<{
      assetPair: string;
      currentCorr: number;
      expectedCorr: number;
      timeframe: string;
    }>;
  };
  
  // Real-time monitoring and alerts
  alertConfiguration: {
    priceAlerts: Array<{
      symbol: string;
      triggerType: 'above' | 'below' | 'cross';
      triggerValue: number;
      isActive: boolean;
    }>;
    volatilityAlerts: Array<{
      symbol: string;
      volThreshold: number;
      timeframe: string;
      isActive: boolean;
    }>;
    correlationAlerts: Array<{
      assetPair: string;
      breakdownThreshold: number;
      isActive: boolean;
    }>;
  };
  
  // Performance tracking and validation
  performanceMetrics: {
    backtestResults: {
      winRate: number;
      averageReturn: number;
      sharpeRatio: number;
      maxDrawdown: number;
      totalTrades: number;
    };
    livePerformance?: {
      signalsGenerated: number;
      successRate: number;
      avgPerformance: number;
      lastUpdated: string;
    };
    predictionAccuracy: {
      shortTerm: number; // 1-24h accuracy
      mediumTerm: number; // 1-7d accuracy
      longTerm: number; // 1m+ accuracy
    };
  };
  
  // Metadata and lifecycle
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  validUntil: string;
  createdBy: 'ai_system' | 'hybrid_analysis' | 'user_triggered';
  lastEvaluated: string;
  nextEvaluation: string;
};

export type UnifiedSignalAlert = {
  id: string;
  signalId: string;
  alertType: 'signal_strength_change' | 'new_opportunity' | 'risk_increase' | 'correlation_breakdown' | 'regime_shift' | 'execution_urgent';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  
  title: string;
  message: string;
  details: string;
  
  // Alert specifics
  triggerConditions: Array<{
    condition: string;
    currentValue: number;
    thresholdValue: number;
    isTriggered: boolean;
  }>;
  
  affectedAssets: string[];
  expectedImpact: {
    direction: 'positive' | 'negative' | 'neutral';
    magnitude: number; // 0-100
    timeframe: string;
  };
  
  // Actionable recommendations
  urgentActions: Array<{
    action: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    reasoning: string;
    estimatedImpact: string;
  }>;
  
  // Alert lifecycle
  isActive: boolean;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  autoResolved?: boolean;
  
  // Integration data
  relatedAlerts: string[]; // IDs of related alerts
  escalationLevel: number; // 1-5 escalation level
  requiresAction: boolean;
};

export type SignalDashboardData = {
  // Overview metrics
  overviewMetrics: {
    totalActiveSignals: number;
    highPriorityAlerts: number;
    avgConfidenceScore: number;
    successRateToday: number;
    portfolioImpactScore: number;
  };
  
  // Top signals by strength
  topSignals: CrossMarketSignal[];
  
  // Active alerts requiring attention
  criticalAlerts: UnifiedSignalAlert[];
  
  // Market regime and correlation status
  marketStatus: {
    currentRegime: string;
    regimeConfidence: number;
    overallCorrelation: number;
    stressLevel: number;
    volatilityEnvironment: string;
  };
  
  // Performance summary
  performanceSummary: {
    todayPerformance: number;
    weekPerformance: number;
    monthPerformance: number;
    bestPerformingSignal: string;
    worstPerformingSignal: string;
  };
  
  // Real-time market data for context
  marketContext: {
    majorAssetPrices: Array<{
      symbol: string;
      price: number;
      change24h: number;
      volume: number;
    }>;
    keyIndicators: Array<{
      name: string;
      value: number;
      change: number;
      significance: string;
    }>;
  };
  
  lastUpdated: string;
};

export type CrossMarketCorrelationData = {
  // Real-time correlation matrix
  correlationMatrix: Array<{
    asset1: string;
    asset2: string;
    correlation: number; // -1 to 1
    strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
    change24h: number;
    breakdownRisk: number; // 0-100 probability of breakdown
    timeframe: '1h' | '4h' | '1d' | '1w';
  }>;
  
  // Regime analysis
  correlationRegime: {
    current: 'normal' | 'elevated' | 'extreme' | 'breakdown';
    confidence: number;
    duration: number; // days in current regime
    historicalPercentile: number;
  };
  
  // Notable changes and alerts
  significantChanges: Array<{
    assetPair: string;
    oldCorrelation: number;
    newCorrelation: number;
    changePercent: number;
    significance: 'minor' | 'moderate' | 'major' | 'critical';
    timeDetected: string;
  }>;
  
  // Cross-market flow analysis
  marketFlows: Array<{
    fromAsset: string;
    toAsset: string;
    flowStrength: number; // 0-100
    flowType: 'rotation' | 'flight_to_safety' | 'risk_on' | 'risk_off';
    netFlow: number; // estimated dollar flow
  }>;
  
  lastUpdated: string;
};

// Pattern Recognition Types (moved to avoid duplicates)

// Educational response types
export type LeaderEducationData = {
  profile: Record<string, any>; // (legacy: crypto_leaders table pruned)
  notableCasts: Record<string, any>[]; // (legacy: curated_casts table pruned)
  resources: Record<string, any>[]; // (legacy: learning_resources table pruned)
  topics: Record<string, any>[]; // (legacy: topic_tags table pruned)
  engagement: {
    avgLikes: number;
    avgRecasts: number;
    totalEngagement: number;
  };
};

// Economic Calendar Types
export type EconomicEvent = {
  id: string;
  title: string;
  description?: string;
  eventType: 'fomc' | 'cpi' | 'gdp' | 'employment' | 'inflation' | 'retail_sales' | 'pmi' | 'housing' | 'earnings';
  scheduledDate: string;
  actualDate?: string;
  impact: 'high' | 'medium' | 'low';
  country: string;
  currency: string;
  actual?: number;
  forecast?: number;
  previous?: number;
  unit?: string;
  source: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'irregular';
  category: 'monetary_policy' | 'inflation' | 'employment' | 'growth' | 'consumption' | 'manufacturing' | 'housing' | 'earnings';
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  marketRelevance: number; // 0-100 score
  timeToEvent?: number; // milliseconds until event
  isCompleted: boolean;
  tags?: string[];
  relatedSymbols?: string[]; // stocks/crypto that might be affected
  lastUpdated: string;
};

export type EconomicCalendarFilter = {
  timeRange: '1d' | '7d' | '30d' | '90d';
  impact?: ('high' | 'medium' | 'low')[];
  eventTypes?: string[];
  countries?: string[];
  onlyUpcoming?: boolean;
};

// Federal Reserve Communication Types
export type FedOfficial = {
  id: string;
  name: string;
  title: string;
  isMember: boolean; // FOMC member
  isVotingMember: boolean; // Current voting member
  bank?: string; // Reserve Bank (for regional presidents)
  termStart?: string;
  termEnd?: string;
  bio?: string;
  avatar?: string;
  isActive: boolean;
  lastSpeech?: string;
  speechCount?: number;
  avgSentiment?: number; // Average hawkish/dovish sentiment (-1 to 1)
};

export type FedCommunication = {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: 'speech' | 'statement' | 'minutes' | 'press_release' | 'testimony' | 'interview' | 'beige_book';
  officialId?: string; // Reference to FedOfficial
  officialName: string;
  date: string;
  url: string;
  source: string; // 'fed.gov', 'reuters', 'bloomberg', etc.
  venue?: string; // Where the speech was given
  audience?: string; // Who it was targeted at
  
  // Sentiment Analysis
  sentiment: {
    score: number; // -1 (dovish) to 1 (hawkish)
    confidence: number; // 0-1 confidence level
    stance: 'hawkish' | 'dovish' | 'neutral';
    reasoning: string[]; // Key phrases that indicate sentiment
  };
  
  // Policy Analysis
  policySignals: {
    rateDirection: 'raise' | 'cut' | 'hold' | 'unclear';
    confidence: number; // How clear the signal is
    timeline?: string; // When changes might occur
    conditions?: string[]; // What conditions need to be met
  };
  
  // Content Analysis
  keyTopics: string[]; // Main topics discussed
  keyPhrases: string[]; // Important quotes/phrases
  marketRelevance: number; // 0-100 score of market impact
  surpriseFactor: number; // 0-100 how unexpected this communication was
  
  // Market Impact Assessment
  marketImpact?: {
    immediate: 'positive' | 'negative' | 'neutral';
    expectedVolatility: 'high' | 'medium' | 'low';
    affectedAssets: string[]; // Which assets might be affected
    timeframe: 'immediate' | 'short_term' | 'long_term';
  };
  
  isHighImpact: boolean;
  tags: string[];
  lastUpdated: string;
};

export type FedPolicyAlert = {
  id: string;
  title: string;
  description: string;
  alertType: 'rate_signal' | 'policy_shift' | 'stance_change' | 'emergency_action' | 'guidance_update';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Related communication
  communicationId: string;
  officialName: string;
  
  // Alert details
  previousStance?: string;
  newStance: string;
  confidenceLevel: number; // How confident we are in this alert
  
  // Market implications
  expectedImpact: {
    stocks: 'bullish' | 'bearish' | 'neutral';
    bonds: 'bullish' | 'bearish' | 'neutral';
    dollar: 'bullish' | 'bearish' | 'neutral';
    crypto: 'bullish' | 'bearish' | 'neutral';
  };
  
  dateCreated: string;
  isActive: boolean;
  tags: string[];
};

export type FedCalendarEvent = {
  id: string;
  title: string;
  description?: string;
  eventType: 'fomc_meeting' | 'fed_speech' | 'testimony' | 'data_release' | 'press_conference';
  scheduledDate: string;
  actualDate?: string;
  officialName?: string; // For speeches/testimony
  venue?: string;
  isCompleted: boolean;
  hasTranscript: boolean;
  hasStatement: boolean;
  
  // Pre-event expectations
  expectations?: {
    rateAction: 'raise' | 'cut' | 'hold';
    rateProbability: number; // Market-implied probability
    keyQuestions: string[];
  };
  
  // Post-event analysis
  outcome?: {
    actualAction?: string;
    surpriseFactor: number;
    marketReaction: 'positive' | 'negative' | 'muted';
    keyTakeaways: string[];
  };
  
  timeToEvent?: number; // milliseconds until event
  marketRelevance: number; // 0-100 score
  lastUpdated: string;
};

export type FedSentimentTrend = {
  date: string;
  overallSentiment: number; // Average sentiment across all communications
  communicationCount: number;
  hawkishSignals: number;
  dovishSignals: number;
  neutralSignals: number;
  
  // Breakdown by official type
  memberSentiment: number; // FOMC voting members
  nonMemberSentiment: number; // Non-voting officials
  
  // Topic-based sentiment
  topicSentiments: {
    inflation: number;
    employment: number;
    growth: number;
    financial_stability: number;
  };
  
  confidenceLevel: number; // Overall confidence in sentiment analysis
};

export type FedAnalyticsSummary = {
  timeframe: '1d' | '7d' | '30d' | '90d';
  totalCommunications: number;
  highImpactCommunications: number;
  
  sentimentTrend: {
    direction: 'increasingly_hawkish' | 'increasingly_dovish' | 'stable' | 'mixed';
    strength: number; // 0-100 how strong the trend is
    consistency: number; // 0-100 how consistent officials are
  };
  
  upcomingEvents: FedCalendarEvent[];
  recentHighlights: FedCommunication[];
  activeAlerts: FedPolicyAlert[];
  
  marketImplications: {
    shortTerm: string[]; // Key short-term implications
    longTerm: string[]; // Key long-term implications
    watchList: string[]; // Things to watch for
  };
  
  lastUpdated: string;
};

// Institutional Flow Tracking Types
export type InstitutionalWallet = {
  address: string;
  type: 'exchange' | 'fund' | 'corporate' | 'mining_pool' | 'dao' | 'defi_protocol';
  name: string;
  category: 'tier_1' | 'tier_2' | 'tier_3'; // Based on size and influence
  aum?: number; // Assets under management in USD
  verified: boolean;
  tags: string[];
  lastActivity: string;
  riskLevel: 'low' | 'medium' | 'high';
};

export type SmartMoneyTransaction = {
  hash: string;
  from: string;
  to: string;
  value: number; // USD value
  asset: string;
  timestamp: string;
  type: 'accumulation' | 'distribution' | 'transfer' | 'arbitrage';
  confidence: number; // 0-100 confidence score
  impact: 'low' | 'medium' | 'high' | 'critical';
  fromType?: string;
  toType?: string;
  strategy?: string;
  marketContext?: {
    preBTC: number;
    postBTC: number;
    priceImpact: number;
    volumeContext: string;
  };
};

export type InstitutionalFundFlow = {
  id: string;
  sourceExchange: string;
  destinationExchange: string;
  asset: string;
  amount: number;
  value: number; // USD value
  timestamp: string;
  flowType: 'inflow' | 'outflow' | 'internal_transfer';
  institutionalScore: number; // How likely this is institutional
  significance: 'minor' | 'moderate' | 'major' | 'critical';
  marketTiming: 'pre_pump' | 'during_pump' | 'post_pump' | 'accumulation' | 'distribution';
};

export type InstitutionalSentiment = {
  overall: number; // -1 to 1 scale
  confidence: number; // 0-100
  trend: 'increasingly_bullish' | 'increasingly_bearish' | 'stable' | 'mixed';
  indicators: {
    accumulation_score: number;
    distribution_score: number;
    exchange_flows: number;
    whale_activity: number;
    corporate_adoption: number;
  };
  timeframe: '1d' | '7d' | '30d';
  lastUpdated: string;
};

export type InstitutionalPositioning = {
  asset: string;
  netFlow: number; // Positive = accumulation, Negative = distribution
  flow24h: number;
  flow7d: number;
  flow30d: number;
  largestHolders: {
    address: string;
    name?: string;
    holdings: number;
    percentage: number;
    change24h: number;
  }[];
  concentration: number; // 0-100, higher = more concentrated
  sentiment: 'accumulating' | 'distributing' | 'holding' | 'mixed';
  strength: number; // 0-100 strength of the signal
};

export type InstitutionalAnalytics = {
  smartMoneyMovements: SmartMoneyTransaction[];
  fundFlows: InstitutionalFundFlow[];
  sentiment: InstitutionalSentiment;
  positioning: InstitutionalPositioning[];
  walletAnalysis: {
    totalWallets: number;
    categorized: number;
    categories: { [key: string]: number };
    recentActivity: InstitutionalWallet[];
    suspicious: InstitutionalWallet[];
  };
  lastUpdated: string;
};

// Chart Configuration Tables




// Chart Relations



// Chart Insert Schemas



// Chart Types




// Chart API Response Types
export type ChartApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    timeframe: string;
    lastUpdated: string;
    dataPoints: number;
    symbols: string[];
  };
};

export type MultiAssetChartResponse = {
  primary: {
    symbol: string;
    assetType: string;
    data: Array<{
      timestamp: number;
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    indicators: {
      rsi?: number[];
      macd?: {
        macd: number[];
        signal: number[];
        histogram: number[];
      };
      movingAverages?: {
        sma20: number[];
        sma50: number[];
        sma200: number[];
        ema12: number[];
        ema26: number[];
      };
      bollingerBands?: {
        upper: number[];
        middle: number[];
        lower: number[];
      };
      volumeIndicators?: {
        volumeMA: number[];
        volumeRatio: number[];
        onBalanceVolume: number[];
      };
    };
  };
  comparison?: Array<{
    symbol: string;
    assetType: string;
    data: Array<{
      timestamp: number;
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    normalizedData: number[];
  }>;
  correlations?: { [symbol: string]: number };
  metadata: {
    timeframe: string;
    lastUpdated: string;
    dataPoints: number;
  };
};

// Risk Assessment and Portfolio Analysis Types
export type PortfolioPosition = {
  symbol: string;
  assetType: 'crypto' | 'stock' | 'commodity' | 'currency';
  allocation: number; // percentage of portfolio (0-100)
  currentPrice: number;
  quantity: number;
  value: number; // current market value
  costBasis?: number; // average purchase price
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
};

export type PortfolioMetrics = {
  totalValue: number;
  totalAllocated: number; // percentage allocated (should be <= 100)
  availableCash: number;
  positions: PortfolioPosition[];
  lastUpdated: string;
};

export type RiskMetrics = {
  // Value at Risk (VaR) calculations
  var95_1d: number; // 1-day VaR at 95% confidence
  var99_1d: number; // 1-day VaR at 99% confidence
  var95_7d: number; // 7-day VaR at 95% confidence
  var99_7d: number; // 7-day VaR at 99% confidence
  
  // Portfolio volatility and correlation
  portfolioVolatility: number; // annualized volatility
  sharpeRatio: number; // risk-adjusted return metric
  maxDrawdown: number; // maximum historical drawdown percentage
  maxDrawdownDays: number; // days in max drawdown period
  
  // Concentration and diversification
  concentrationRisk: number; // 0-100, higher = more concentrated
  diversificationScore: number; // 0-100, higher = more diversified
  largestPositionPercent: number; // largest single position percentage
  topThreePositionsPercent: number; // top 3 positions combined percentage
  
  // Asset class breakdown
  assetClassExposure: {
    crypto: number;
    stocks: number;
    commodities: number;
    cash: number;
  };
  
  // Risk-adjusted metrics
  calmarRatio: number; // return/max drawdown
  sortinoRatio: number; // downside deviation adjusted return
  beta: number; // portfolio beta vs market
  alpha: number; // portfolio alpha vs market
  
  calculatedAt: string;
};

// StressTestScenario type is defined later from schema inference

export type StressTestResult = {
  scenario: Record<string, any>; // (legacy: stress_test_scenarios table pruned)
  portfolioImpact: {
    totalLoss: number; // absolute loss amount
    totalLossPercent: number; // percentage loss
    timeToRecover: number; // estimated days to break even
    worstDayLoss: number; // worst single day loss
    positionImpacts: Array<{
      symbol: string;
      currentValue: number;
      stressedValue: number;
      lossAmount: number;
      lossPercent: number;
    }>;
  };
  riskMetrics: {
    stressedVaR: number; // VaR under stress conditions
    stressedVolatility: number;
    liquidityRisk: number; // 0-100 difficulty of exiting positions
    correlationRisk: number; // 0-100 correlation breakdown risk
  };
  actionableInsights: string[];
  calculatedAt: string;
};

export type PositionSizingRecommendation = {
  symbol: string;
  assetType: 'crypto' | 'stock' | 'commodity';
  currentAllocation: number;
  recommendedAllocation: number;
  rationale: string;
  riskScore: number; // 0-100, higher = riskier
  expectedReturn: number; // annualized expected return
  maxDrawdownExpectation: number;
  
  sizingMethod: 'kelly_criterion' | 'equal_weight' | 'risk_parity' | 'momentum_based' | 'mean_reversion';
  confidence: number; // 0-100 confidence in recommendation
  timeHorizon: '1w' | '1m' | '3m' | '6m' | '1y';
};

export type RiskAlert = {
  id: string;
  alertType: 'concentration_risk' | 'var_breach' | 'correlation_spike' | 'volatility_spike' | 'drawdown_limit' | 'rebalancing_needed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedPositions: string[];
  
  threshold: {
    metric: string;
    currentValue: number;
    thresholdValue: number;
    breachPercent: number;
  };
  
  recommendedActions: string[];
  estimatedImpact: string;
  createdAt: string;
  isActive: boolean;
  acknowledgedAt?: string;
};

export type PortfolioComposition = {
  assetAllocation: {
    crypto: { allocation: number; value: number; positions: number; };
    stocks: { allocation: number; value: number; positions: number; };
    commodities: { allocation: number; value: number; positions: number; };
    cash: { allocation: number; value: number; };
  };
  
  sectorExposure: Array<{
    sector: string;
    allocation: number;
    value: number;
    riskScore: number;
    topSymbols: string[];
  }>;
  
  geographicExposure: Array<{
    region: string;
    allocation: number;
    value: number;
    symbols: string[];
  }>;
  
  rebalancingNeeds: Array<{
    position: string;
    currentWeight: number;
    targetWeight: number;
    deviation: number;
    action: 'buy' | 'sell' | 'hold';
    urgency: 'low' | 'medium' | 'high';
  }>;
  
  lastRebalanced: string;
  nextRebalancingDate: string;
};

export type RiskDashboardResponse = {
  portfolio: PortfolioMetrics;
  riskMetrics: RiskMetrics;
  stressTests: StressTestResult[];
  positionSizing: PositionSizingRecommendation[];
  riskAlerts: RiskAlert[];
  composition: PortfolioComposition;
};

// Market Event Impact Modeling and Prediction Types - Phase 3 Feature
export type MarketEvent = {
  id: string;
  title: string;
  description?: string;
  eventType: 'fomc_meeting' | 'fed_speech' | 'cpi_release' | 'nfp_release' | 'gdp_release' | 'inflation_data' | 
            'earnings_release' | 'regulatory_announcement' | 'geopolitical_event' | 'crypto_upgrade' | 'hack' | 
            'whale_movement' | 'institutional_adoption' | 'defi_launch' | 'protocol_update' | 'exchange_listing' |
            'delisting' | 'halving' | 'merge' | 'hard_fork' | 'soft_fork' | 'governance_proposal' | 'audit_release';
  
  // Event timing and scheduling
  scheduledDate: string;
  actualDate?: string;
  isCompleted: boolean;
  timeToEvent?: number; // milliseconds until event
  
  // Event classification and importance
  category: 'monetary_policy' | 'economic_data' | 'corporate_earnings' | 'regulatory' | 'technical' | 'market_structure' | 'geopolitical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  volatilityExpected: 'low' | 'medium' | 'high' | 'extreme';
  marketRelevance: number; // 0-100 score
  
  // Asset scope
  affectedAssets: string[]; // Which assets this event might impact
  primaryAsset?: string; // Main asset affected
  assetTypes: ('crypto' | 'stock' | 'commodity' | 'currency' | 'bond')[];
  
  // Event details
  source: string;
  url?: string;
  venue?: string;
  officialName?: string; // For speeches, testimonies
  expectedAnnouncement?: string; // What's expected to be announced
  marketConsensus?: {
    forecast?: number;
    range?: { min: number; max: number };
    unit?: string;
  };
  
  // Historical context
  previousValues?: number[];
  historicalAverageImpact?: number; // Average price movement percentage
  lastSimilarEvent?: {
    date: string;
    outcome: string;
    marketReaction: number;
  };
  
  tags: string[];
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular';
  lastUpdated: string;
};

export type EventImpactPrediction = {
  id: string;
  eventId: string;
  predictionType: 'price_movement' | 'volatility_spike' | 'volume_surge' | 'correlation_shift' | 'sentiment_change';
  
  // ML Model Information
  modelVersion: string;
  algorithm: 'random_forest' | 'gradient_boosting' | 'neural_network' | 'ensemble' | 'linear_regression' | 'svm';
  trainingDataSize: number;
  featureCount: number;
  lastTrainedAt: string;
  
  // Prediction Details
  predictedDirection: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  magnitude: {
    expectedMove: number; // percentage price move
    range: { min: number; max: number };
    volatilityIncrease: number; // expected volatility spike
  };
  
  // Confidence and Uncertainty
  confidence: number; // 0-100 overall prediction confidence
  uncertaintyFactors: string[]; // What makes this prediction uncertain
  reliabilityScore: number; // 0-100 based on historical accuracy
  
  // Timing Predictions
  impactTiming: {
    immediate: number; // 0-100 probability of immediate impact
    shortTerm: number; // 0-100 probability of 1-24h impact
    mediumTerm: number; // 0-100 probability of 1-7d impact
    longTerm: number; // 0-100 probability of 1m+ impact
  };
  
  // Asset-Specific Predictions
  assetPredictions: Array<{
    symbol: string;
    assetType: 'crypto' | 'stock' | 'commodity' | 'currency';
    predictedMove: number; // percentage
    confidence: number;
    reasoning: string[];
  }>;
  
  // Market Regime Context
  marketRegime: 'bull' | 'bear' | 'sideways' | 'volatile';
  regimeImpact: number; // How current regime affects prediction
  
  createdAt: string;
  expiresAt: string;
};

export type EventImpactModel = {
  id: string;
  name: string;
  description: string;
  modelType: 'classification' | 'regression' | 'time_series' | 'hybrid';
  
  // Model Configuration
  algorithm: string;
  hyperparameters: { [key: string]: any };
  features: string[];
  targetVariable: string;
  
  // Training Information
  trainingPeriod: { start: string; end: string };
  validationMethod: 'holdout' | 'cross_validation' | 'time_series_split';
  trainAccuracy: number;
  validationAccuracy: number;
  testAccuracy?: number;
  
  // Performance Metrics
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    meanAbsoluteError?: number;
    rootMeanSquareError?: number;
    sharpeRatio?: number; // For trading-focused models
  };
  
  // Model Behavior
  eventTypes: string[]; // Which event types this model handles
  assetTypes: string[]; // Which asset types it works with
  timeHorizons: string[]; // Prediction time horizons
  
  // Production Status
  isActive: boolean;
  productionSince?: string;
  lastRetrained: string;
  retrainingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  
  // Monitoring
  driftDetection: {
    lastCheck: string;
    driftScore: number; // 0-1, higher = more drift
    alertThreshold: number;
    isAlerting: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
};


export type HistoricalImpactAnalysis = {
  id: string;
  eventType: string;
  analysisType: 'individual_event' | 'event_category' | 'cross_asset' | 'regime_comparison';
  
  // Time Period
  analysisWindow: {
    start: string;
    end: string;
    eventCount: number;
  };
  
  // Statistical Analysis
  averageImpact: {
    immediate: number; // Average immediate price reaction (%)
    oneHour: number;
    oneDay: number;
    oneWeek: number;
    oneMonth: number;
  };
  
  volatilityAnalysis: {
    averageVolSpike: number; // Average volatility increase
    maxVolSpike: number;
    volatilityDuration: number; // Days until vol normalizes
  };
  
  // Distribution Analysis
  outcomesDistribution: {
    bullish: number; // Percentage of bullish outcomes
    bearish: number;
    neutral: number;
    highVolatility: number; // Percentage leading to high vol
  };
  
  // Notable Events
  significantEvents: Array<{
    date: string;
    eventTitle: string;
    impact: number;
    reason: string;
    uniqueFactors: string[];
  }>;
  
  // Pattern Recognition
  patterns: Array<{
    pattern: string;
    frequency: number;
    reliability: number;
    description: string;
    examples: string[];
  }>;
  
  // Predictive Insights
  predictiveFactors: Array<{
    factor: string;
    correlation: number;
    significance: number;
    description: string;
  }>;
  
  // Market Regime Analysis
  regimeAnalysis: {
    bullMarket: { averageImpact: number; volatility: number; sampleSize: number };
    bearMarket: { averageImpact: number; volatility: number; sampleSize: number };
    sidewaysMarket: { averageImpact: number; volatility: number; sampleSize: number };
  };
  
  // Cross-Asset Correlations
  crossAssetImpacts: Array<{
    primaryAsset: string;
    correlatedAsset: string;
    correlation: number;
    lagDays: number;
    strength: 'weak' | 'moderate' | 'strong';
  }>;
  
  // Methodology
  dataSource: string[];
  statisticalMethods: string[];
  confidenceLevel: number;
  sampleSize: number;
  
  createdAt: string;
  lastUpdated: string;
};

export type MarketEventAlert = {
  id: string;
  eventId?: string;
  predictionId?: string;
  
  // Alert Classification
  alertType: 'event_detected' | 'prediction_update' | 'impact_threshold' | 'anomaly_detected' | 'model_drift' | 'signal_generated';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Alert Content
  title: string;
  message: string;
  description?: string;
  
  // Event/Market Context
  affectedAssets: string[];
  expectedImpact: 'positive' | 'negative' | 'neutral' | 'mixed';
  impactMagnitude: number; // 0-100
  timeframe: string;
  
  // Actionable Information
  recommendations: string[];
  suggestedActions: Array<{
    action: string;
    urgency: 'immediate' | 'within_1h' | 'within_24h' | 'monitor';
    reasoning: string;
  }>;
  
  // Alert Lifecycle
  isActive: boolean;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  expiresAt?: string;
  
  // Delivery Status
  deliveryChannels: ('email' | 'sms' | 'push' | 'dashboard')[];
  deliveredAt?: { [channel: string]: string };
  
  // Metadata
  source: string;
  confidence: number;
  tags: string[];
  lastUpdated: string;
};

export type EventImpactSummary = {
  timeframe: '1d' | '7d' | '30d' | '90d';
  
  // Upcoming Events
  upcomingHighImpact: MarketEvent[];
  upcomingMediumImpact: MarketEvent[];
  nearTermCatalysts: Array<{
    event: MarketEvent;
    prediction: EventImpactPrediction;
    signal?: TradingSignal;
  }>;
  
  // Current Predictions
  activePredictions: EventImpactPrediction[];
  recentSignals: TradingSignal[];
  activeAlerts: MarketEventAlert[];
  
  // Historical Performance
  modelPerformance: {
    totalPredictions: number;
    accurateDirectional: number;
    accurateMagnitude: number;
    averageError: number;
    winRate: number;
    profitability?: number;
  };
  
  // Market Outlook
  marketOutlook: {
    overall: 'bullish' | 'bearish' | 'neutral' | 'uncertain';
    confidence: number;
    keyDrivers: string[];
    riskFactors: string[];
    timeHorizon: string;
  };
  
  // Risk Assessment
  eventRisk: {
    nextWeekRisk: number; // 0-100
    nextMonthRisk: number;
    volatilityExpected: number;
    blackSwanProbability: number;
  };
  
  lastUpdated: string;
};

export type EventModelingDashboard = {
  summary: EventImpactSummary;
  upcomingEvents: MarketEvent[];
  activePredictions: EventImpactPrediction[];
  tradingSignals: TradingSignal[];
  historicalAnalysis: HistoricalImpactAnalysis[];
  alerts: MarketEventAlert[];
  modelStatus: {
    activeModels: number;
    modelAccuracy: number;
    lastRetrained: string;
    predictionQueue: number;
  };
};

// Pattern Recognition Service Types - Phase 3 Feature
export type PatternRecognitionConfig = {
  enableMLPatternDetection: boolean;
  enableTrendAnalysis: boolean;
  enableCycleDetection: boolean;
  enableAlertGeneration: boolean;
  confidenceThreshold: number; // 0-100
  minPatternDuration: number; // minutes
  maxPatternAge: number; // hours
  alertCooldownPeriod: number; // minutes between similar alerts
  supportedTimeframes: string[];
  supportedAssetTypes: string[];
};

export type PatternDetectionResult = {
  patterns: Record<string, any>[]; // (legacy: chart_patterns table pruned)
  trendAnalysis: Record<string, any>[]; // (legacy: trend_analysis table pruned)
  marketCycles: Record<string, any>[]; // (legacy: market_cycles table pruned)
  confidence: number;
  processingTime: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendedActions: string[];
  riskFactors: string[];
  marketContext: {
    overallTrend: 'bullish' | 'bearish' | 'sideways';
    volatilityEnvironment: 'low' | 'normal' | 'high' | 'extreme';
    marketRegime: 'bull' | 'bear' | 'transition' | 'ranging';
  };
};

export type PatternBacktestResults = {
  patternType: string;
  symbol: string;
  timeframe: string;
  totalPatterns: number;
  successfulPatterns: number;
  successRate: number;
  averageReturn: number;
  averageHoldTime: number; // in days
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  monthlyReturns: Array<{
    month: string;
    returns: number;
    patterns: number;
  }>;
  performanceByMarketRegime: {
    bull: { successRate: number; avgReturn: number; count: number };
    bear: { successRate: number; avgReturn: number; count: number };
    sideways: { successRate: number; avgReturn: number; count: number };
  };
};

export type PatternScreenerFilter = {
  symbols?: string[];
  assetTypes?: ('crypto' | 'stock' | 'commodity')[];
  patternTypes?: string[];
  timeframes?: string[];
  minConfidence?: number;
  maxAge?: number; // hours
  patternStatus?: ('forming' | 'complete' | 'confirmed' | 'failed')[];
  trendAlignment?: boolean;
  volumeConfirmation?: boolean;
  riskRewardRatio?: { min: number; max: number };
  marketRegimes?: string[];
  sortBy?: 'confidence' | 'age' | 'riskReward' | 'strength';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
};

export type PatternScreenerResult = {
  patterns: Array<{
    id: string;
    symbol: string;
    patternType: string;
    confidence: number;
    age: number; // hours since detection
    riskRewardRatio: number;
    targetPrice: number;
    currentPrice: number;
    potentialReturn: number;
    timeToTarget: number; // estimated days
    keyLevels: {
      support: number[];
      resistance: number[];
    };
    strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
    recommendation: 'buy' | 'sell' | 'hold' | 'watch';
  }>;
  summary: {
    totalPatterns: number;
    highConfidencePatterns: number;
    bullishPatterns: number;
    bearishPatterns: number;
    averageConfidence: number;
    topPerformingPattern: string;
  };
  marketOverview: {
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    patternDistribution: { [patternType: string]: number };
    sectorStrength: { [sector: string]: number };
    timeframeAnalysis: { [timeframe: string]: number };
  };
};

export type TrendAnalysisResult = {
  symbol: string;
  timeframe: string;
  primaryTrend: {
    direction: 'bullish' | 'bearish' | 'sideways';
    strength: number; // 0-100
    duration: number; // days
    confidence: number; // 0-100
    momentum: number; // -100 to 100
  };
  trendLevels: {
    support: Array<{ price: number; strength: number; tests: number }>;
    resistance: Array<{ price: number; strength: number; tests: number }>;
    trendLine: { slope: number; rSquared: number; equation: string };
  };
  technicalIndicators: {
    movingAverages: {
      sma20: { value: number; slope: number; pricePosition: 'above' | 'below' };
      sma50: { value: number; slope: number; pricePosition: 'above' | 'below' };
      ema12: { value: number; slope: number; pricePosition: 'above' | 'below' };
    };
    momentum: {
      rsi: number;
      macd: { value: number; signal: number; histogram: number };
      stochastic: { k: number; d: number };
      adx: number;
    };
    volume: {
      average: number;
      trend: 'increasing' | 'decreasing' | 'flat';
      onBalanceVolume: number;
      volumeRatio: number; // current vs average
    };
  };
  predictions: {
    nextMove: 'up' | 'down' | 'sideways';
    probability: number;
    targetLevel: number;
    timeHorizon: string;
    keyRisks: string[];
  };
  signals: Array<{
    type: 'entry' | 'exit' | 'stop_adjust';
    action: 'buy' | 'sell' | 'hold';
    strength: number;
    reasoning: string;
    level: number;
  }>;
};

export type MarketCycleAnalysis = {
  symbol: string;
  currentCycle: {
    type: 'bull_market' | 'bear_market' | 'accumulation' | 'distribution';
    phase: 'early' | 'mid' | 'late' | 'transition';
    stage: 'emerging' | 'developing' | 'mature' | 'ending';
    strength: number; // 0-100
    daysSinceStart: number;
    estimatedDaysRemaining: number;
    confidence: number; // 0-100
  };
  historicalComparisons: Array<{
    cycleName: string;
    similarity: number; // 0-100
    duration: number;
    maxGain: number;
    maxDrawdown: number;
    keyCharacteristics: string[];
  }>;
  cycleMetrics: {
    priceGainFromStart: number;
    maxDrawdownInCycle: number;
    volatilityProfile: number;
    participationRate: number;
    institutionalFlow: 'accumulating' | 'distributing' | 'neutral';
    retailSentiment: 'euphoric' | 'optimistic' | 'neutral' | 'fearful' | 'despair';
  };
  phaseTransitionProbabilities: {
    nextPhase: string;
    probability: number;
    timeframe: string;
    triggerEvents: string[];
  };
  tradingImplications: {
    optimalStrategy: string;
    expectedVolatility: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
    positionSizing: 'conservative' | 'moderate' | 'aggressive';
    recommendations: string[];
  };
};

export type PatternAlertSummary = {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  recentAlerts: (typeof patternAlerts.$inferSelect)[];
  alertsByType: { [type: string]: number };
  alertsBySeverity: { [severity: string]: number };
  averageAccuracy: number;
  topPerformingAlertTypes: Array<{
    type: string;
    accuracy: number;
    count: number;
  }>;
};

export type PatternRecognitionDashboard = {
  overview: {
    totalPatterns: number;
    activePatterns: number;
    completedPatterns: number;
    successRate: number;
    averageConfidence: number;
  };
  recentPatterns: Record<string, any>[]; // (legacy: chart_patterns table pruned)
  topAlerts: (typeof patternAlerts.$inferSelect)[];
  trendAnalysis: TrendAnalysisResult[];
  marketCycles: MarketCycleAnalysis[];
  tradingSetups: (typeof aiTradingSetups.$inferSelect)[];
  performance: {
    dailySuccess: Array<{ date: string; rate: number }>;
    monthlyReturns: Array<{ month: string; returns: number }>;
    patternPerformance: Array<{
      pattern: string;
      successRate: number;
      avgReturn: number;
      count: number;
    }>;
  };
  alerts: PatternAlertSummary;
  systemStatus: {
    modelsActive: number;
    lastUpdate: string;
    dataQuality: string;
    processingLatency: number;
  };
};

// Pattern Recognition and Technical Analysis Tables - Phase 3 Feature



export const patternAlerts = pgTable("pattern_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Alert Classification
  alertType: text("alert_type").notNull(), // pattern_detected, pattern_completion, breakout, breakdown, trend_change
  alertCategory: text("alert_category").notNull(), // technical_analysis, pattern_recognition, trend_analysis, cycle_analysis
  severity: text("severity").notNull(), // low, medium, high, critical
  priority: text("priority").notNull(), // low, normal, high, urgent
  
  // Related Entities
  patternId: varchar("pattern_id"), // (legacy: referenced chart_patterns, pruned)
  trendId: varchar("trend_id"), // (legacy: referenced trend_analysis, pruned)
  cycleId: varchar("cycle_id"), // (legacy: referenced market_cycles, pruned)
  
  // Asset Information
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(),
  currentPrice: real("current_price").notNull(),
  priceChange: real("price_change"),
  priceChangePercent: real("price_change_percent"),
  
  // Alert Content
  title: text("title").notNull(),
  message: text("message").notNull(),
  detailedDescription: text("detailed_description"),
  technicalAnalysis: text("technical_analysis"), // Detailed technical reasoning
  
  // Actionable Information
  recommendations: jsonb("recommendations").notNull(), // Array of recommended actions
  tradingSignals: jsonb("trading_signals"), // Specific trading recommendations
  riskFactors: text("risk_factors").array(), // Risks to consider
  keyLevels: jsonb("key_levels"), // Important support/resistance levels
  
  // Timing and Urgency
  timeframe: text("timeframe").notNull(), // How long alert is relevant
  expiresAt: timestamp("expires_at"), // When alert expires
  urgency: text("urgency").notNull(), // immediate, within_1h, within_24h, monitor
  optimalEntryWindow: jsonb("optimal_entry_window"), // Best time window for action
  
  // Confidence and Quality
  confidence: real("confidence").notNull(), // 0-1 confidence in alert
  signalStrength: real("signal_strength").notNull(), // 0-1 strength of underlying signal
  historicalAccuracy: real("historical_accuracy"), // Historical accuracy for similar alerts
  
  // Market Context
  marketEnvironment: jsonb("market_environment"), // Current market conditions
  correlatedAlerts: text("correlated_alerts").array(), // Related alerts for other assets
  sectorImpact: text("sector_impact"), // Broader sector implications
  
  // User Interaction
  isViewed: boolean("is_viewed").default(false),
  isAcknowledged: boolean("is_acknowledged").default(false),
  userNotes: text("user_notes"), // User's notes on alert
  userRating: integer("user_rating"), // User feedback 1-5
  userActions: jsonb("user_actions"), // Actions taken by user
  
  // Delivery and Notification
  deliveryChannels: text("delivery_channels").array(), // email, sms, push, dashboard
  deliveredAt: jsonb("delivered_at"), // Delivery timestamps per channel
  deliveryStatus: jsonb("delivery_status"), // Delivery status per channel
  
  // Performance Tracking
  isTriggered: boolean("is_triggered").default(true),
  triggeredAt: timestamp("triggered_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  outcome: text("outcome"), // successful, false_positive, partial, pending
  actualResult: text("actual_result"), // What actually happened
  
  // Follow-up Alerts
  parentAlertId: varchar("parent_alert_id").references((): AnyPgColumn => patternAlerts.id), // Original alert this follows up
  childAlerts: text("child_alerts").array(), // Follow-up alert IDs
  alertSequence: integer("alert_sequence").default(1), // Position in alert sequence
  
  // Metadata
  generatedBy: text("generated_by").default("pattern_ai"), // AI system that generated alert
  algorithmVersion: text("algorithm_version").default("v1.0"),
  dataSource: text("data_source").array(), // Sources of data used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tags: text("tags").array(),
});

export const aiTradingSetups = pgTable("ai_trading_setups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Setup Classification
  setupType: text("setup_type").notNull(), // pattern_breakout, trend_continuation, reversal, momentum, mean_reversion
  setupCategory: text("setup_category").notNull(), // scalp, swing, position, long_term
  riskProfile: text("risk_profile").notNull(), // conservative, moderate, aggressive, speculative
  
  // Related Analysis
  patternId: varchar("pattern_id"), // (legacy: referenced chart_patterns, pruned)
  trendId: varchar("trend_id"), // (legacy: referenced trend_analysis, pruned)
  cycleId: varchar("cycle_id"), // (legacy: referenced market_cycles, pruned)
  alertId: varchar("alert_id").references(() => patternAlerts.id),
  
  // Asset Information
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(),
  currentPrice: real("current_price").notNull(),
  
  // Trading Strategy
  direction: text("direction").notNull(), // long, short
  strategy: text("strategy").notNull(), // breakout, pullback, bounce, reversal, momentum
  timeframe: text("timeframe").notNull(), // 5m, 15m, 1h, 4h, 1d, 1w
  holdingPeriod: text("holding_period").notNull(), // minutes, hours, days, weeks, months
  
  // Entry Strategy
  entryType: text("entry_type").notNull(), // market, limit, stop_limit, conditional
  entryPrice: real("entry_price").notNull(),
  entryZone: jsonb("entry_zone"), // {min: number, max: number, optimal: number}
  entryConditions: text("entry_conditions").array(), // Conditions that must be met
  entryTiming: text("entry_timing"), // immediate, on_breakout, on_pullback, on_confirmation
  
  // Exit Strategy
  targetPrice: real("target_price").notNull(),
  targetZone: jsonb("target_zone"), // Multiple target levels
  stopLoss: real("stop_loss").notNull(),
  stopType: text("stop_type").default("fixed"), // fixed, trailing, dynamic, time_based
  trailingStopDistance: real("trailing_stop_distance"), // For trailing stops
  
  // Risk Management
  riskRewardRatio: real("risk_reward_ratio").notNull(),
  maxRisk: real("max_risk").notNull(), // Maximum risk percentage
  positionSize: real("position_size"), // Recommended position size percentage
  maxDrawdown: real("max_drawdown"), // Maximum acceptable drawdown
  
  // Probability Analysis
  successProbability: real("success_probability").notNull(), // 0-1 probability of success
  probabilityMethod: text("probability_method"), // historical, ml_model, hybrid
  expectedValue: real("expected_value"), // Expected value of trade
  kellyPercentage: real("kelly_percentage"), // Kelly criterion position size
  
  // Setup Quality Metrics
  setupStrength: real("setup_strength").notNull(), // 0-1 overall setup strength
  patternQuality: real("pattern_quality"), // Quality of underlying pattern
  trendAlignment: real("trend_alignment"), // Alignment with broader trend
  volumeConfirmation: real("volume_confirmation"), // Volume support for setup
  confluenceFactors: integer("confluence_factors"), // Number of supporting factors
  
  // Technical Confluence
  supportingIndicators: jsonb("supporting_indicators"), // Technical indicators supporting setup
  resistanceLevels: jsonb("resistance_levels"), // Key resistance levels
  supportLevels: jsonb("support_levels"), // Key support levels
  fibonacciLevels: jsonb("fibonacci_levels"), // Relevant fibonacci levels
  
  // Market Context
  marketConditions: jsonb("market_conditions"), // Current market environment
  sectorStrength: real("sector_strength"), // Sector momentum
  correlationAnalysis: jsonb("correlation_analysis"), // Correlation with market/sector
  newsAnalysis: jsonb("news_analysis"), // Relevant news and events
  
  // Execution Details
  optimalExecution: jsonb("optimal_execution"), // Best execution approach
  slippageExpectation: real("slippage_expectation"), // Expected slippage
  liquidityAssessment: text("liquidity_assessment"), // high, medium, low
  tradingHours: text("trading_hours"), // optimal trading hours
  
  // Performance Expectations
  expectedReturn: real("expected_return"), // Expected return percentage
  expectedTimeToTarget: integer("expected_time_to_target"), // Days to reach target
  volatilityExpectation: real("volatility_expectation"), // Expected volatility
  drawdownExpectation: real("drawdown_expectation"), // Expected max drawdown
  
  // Historical Context
  historicalPerformance: jsonb("historical_performance"), // Similar setup performance
  backtestResults: jsonb("backtest_results"), // Backtest statistics
  similarSetups: text("similar_setups").array(), // IDs of similar historical setups
  seasonalityBias: real("seasonality_bias"), // Seasonal performance bias
  
  // AI Model Information
  modelVersion: text("model_version").default("v1.0"),
  modelConfidence: real("model_confidence").notNull(), // AI model confidence
  featureImportance: jsonb("feature_importance"), // Most important features for setup
  alternativeSetups: jsonb("alternative_setups"), // Alternative setup suggestions
  
  // Status and Lifecycle
  status: text("status").default("active"), // active, expired, triggered, completed, cancelled
  isTriggered: boolean("is_triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  entryExecuted: boolean("entry_executed").default(false),
  exitExecuted: boolean("exit_executed").default(false),
  
  // Performance Tracking
  actualEntry: real("actual_entry"), // Actual entry price
  actualExit: real("actual_exit"), // Actual exit price
  actualReturn: real("actual_return"), // Actual return percentage
  actualHoldTime: integer("actual_hold_time"), // Actual holding time in minutes
  outcome: text("outcome"), // success, failure, partial, stopped_out
  
  // User Interaction
  userRating: integer("user_rating"), // 1-5 user rating
  userNotes: text("user_notes"),
  isBookmarked: boolean("is_bookmarked").default(false),
  sharingLevel: text("sharing_level").default("private"), // private, followers, public
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // When setup expires
  lastValidated: timestamp("last_validated").defaultNow(),
  tags: text("tags").array(),
  notes: text("notes"), // Internal notes for setup
});

// =============================================================================
// PATTERN RECOGNITION RELATIONS - Added after table definitions
// =============================================================================




export const patternAlertsRelations = relations(patternAlerts, ({ one, many }) => ({
  parentAlert: one(patternAlerts, {
    fields: [patternAlerts.parentAlertId],
    references: [patternAlerts.id],
  }),
  childAlerts: many(patternAlerts),
  tradingSetups: many(aiTradingSetups),
}));

export const aiTradingSetupsRelations = relations(aiTradingSetups, ({ one }) => ({
  alert: one(patternAlerts, {
    fields: [aiTradingSetups.alertId],
    references: [patternAlerts.id],
  }),
}));

// =============================================================================
// PATTERN RECOGNITION INSERT SCHEMAS - Added after table definitions
// =============================================================================




export const insertPatternAlertSchema = createInsertSchema(patternAlerts).pick({
  alertType: true,
  alertCategory: true,
  severity: true,
  priority: true,
  patternId: true,
  trendId: true,
  cycleId: true,
  symbol: true,
  assetType: true,
  currentPrice: true,
  priceChange: true,
  priceChangePercent: true,
  title: true,
  message: true,
  detailedDescription: true,
  technicalAnalysis: true,
  recommendations: true,
  tradingSignals: true,
  riskFactors: true,
  keyLevels: true,
  timeframe: true,
  expiresAt: true,
  urgency: true,
  optimalEntryWindow: true,
  confidence: true,
  signalStrength: true,
  historicalAccuracy: true,
  marketEnvironment: true,
  correlatedAlerts: true,
  sectorImpact: true,
  deliveryChannels: true,
  parentAlertId: true,
  childAlerts: true,
  alertSequence: true,
  generatedBy: true,
  algorithmVersion: true,
  dataSource: true,
  tags: true,
});

export const insertAiTradingSetupSchema = createInsertSchema(aiTradingSetups).pick({
  setupType: true,
  setupCategory: true,
  riskProfile: true,
  patternId: true,
  trendId: true,
  cycleId: true,
  alertId: true,
  symbol: true,
  assetType: true,
  currentPrice: true,
  direction: true,
  strategy: true,
  timeframe: true,
  holdingPeriod: true,
  entryType: true,
  entryPrice: true,
  entryZone: true,
  entryConditions: true,
  entryTiming: true,
  targetPrice: true,
  targetZone: true,
  stopLoss: true,
  stopType: true,
  trailingStopDistance: true,
  riskRewardRatio: true,
  maxRisk: true,
  positionSize: true,
  maxDrawdown: true,
  successProbability: true,
  probabilityMethod: true,
  expectedValue: true,
  kellyPercentage: true,
  setupStrength: true,
  patternQuality: true,
  trendAlignment: true,
  volumeConfirmation: true,
  confluenceFactors: true,
  supportingIndicators: true,
  resistanceLevels: true,
  supportLevels: true,
  fibonacciLevels: true,
  marketConditions: true,
  sectorStrength: true,
  correlationAnalysis: true,
  newsAnalysis: true,
  optimalExecution: true,
  slippageExpectation: true,
  liquidityAssessment: true,
  tradingHours: true,
  expectedReturn: true,
  expectedTimeToTarget: true,
  volatilityExpectation: true,
  drawdownExpectation: true,
  historicalPerformance: true,
  backtestResults: true,
  similarSetups: true,
  seasonalityBias: true,
  modelVersion: true,
  modelConfidence: true,
  featureImportance: true,
  alternativeSetups: true,
  expiresAt: true,
  sharingLevel: true,
  tags: true,
  notes: true,
});

// Pattern Recognition Types



export type InsertPatternAlert = z.infer<typeof insertPatternAlertSchema>;
export type PatternAlertData = typeof patternAlerts.$inferSelect;

export type InsertAiTradingSetup = z.infer<typeof insertAiTradingSetupSchema>;
export type AiTradingSetupData = typeof aiTradingSetups.$inferSelect;

// =============================================================================
// VOLATILITY FORECASTING AND STRESS INDICATORS TABLES - Phase 3 Feature
// =============================================================================










// =============================================================================
// VOLATILITY FORECASTING RELATIONS
// =============================================================================









// =============================================================================
// VOLATILITY FORECASTING INSERT SCHEMAS
// =============================================================================










// =============================================================================
// VOLATILITY FORECASTING TYPES
// =============================================================================










// =============================================================================
// VOLATILITY FORECASTING DASHBOARD TYPES
// =============================================================================

export type VolatilityForecastingDashboard = {
  summary: {
    overallStressLevel: number; // 0-100
    activeRegime: string;
    regimeConfidence: number;
    highestCrisisProbability: number;
    activeAlerts: number;
    totalForecasts: number;
  };
  
  volatilityForecasts: Record<string, any>[]; // (legacy: volatility_forecasts table pruned)
  stressIndicators: Record<string, any>[]; // (legacy: stress_indicators table pruned)
  riskRegime: Record<string, any>; // (legacy: risk_regimes table pruned)
  crisisIndicators: Record<string, any>[]; // (legacy: crisis_indicators table pruned)
  activeAlerts: Record<string, any>[]; // (legacy: volatility_alerts table pruned)
  
  marketContext: {
    overallVolatility: number;
    correlationLevel: number;
    liquidityConditions: string;
    sentimentScore: number;
  };
  
  recommendations: {
    positionSizing: string;
    hedgingStrategy: string;
    monitoringPriorities: string[];
    riskManagement: string[];
  };
  
  lastUpdated: string;
};

// =============================================================================
// PREDICTION MARKETS
// =============================================================================

export const predictionMarkets = pgTable("prediction_markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractMarketId: integer("contract_market_id").unique(), // Nullable for AI-generated markets without on-chain contracts
  question: text("question").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  assetClass: text("asset_class").default("crypto"), // crypto, tech_stock, macro, mixed
  ticker: text("ticker"), // Stock/crypto ticker symbol (AAPL, NVDA, BTC, ETH)
  creatorId: varchar("creator_id").references(() => users.id),
  creatorWallet: text("creator_wallet"),
  deadline: timestamp("deadline").notNull(),
  resolutionSource: text("resolution_source"),
  sourceContentId: varchar("source_content_id").references(() => summaries.id),
  status: text("status").notNull().default("active"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  totalVolume: integer("total_volume").default(0),
  totalTrades: integer("total_trades").default(0),
  yesPrice: integer("yes_price").default(5000),
  noPrice: integer("no_price").default(5000),
  yesLiquidity: integer("yes_liquidity").default(0),
  noLiquidity: integer("no_liquidity").default(0),
  initialLiquidity: integer("initial_liquidity").notNull(),
  blockchainTxHash: text("blockchain_tx_hash"),
  resolutionTxHash: text("resolution_tx_hash"),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  aiProbability: integer("ai_probability"),
  aiReasoning: text("ai_reasoning"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_prediction_markets_created_at").on(table.createdAt),
  statusIdx: index("idx_prediction_markets_status").on(table.status),
}));

export const marketPositions = pgTable("market_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  userWallet: text("user_wallet").notNull(),
  outcome: text("outcome").notNull(),
  shares: integer("shares").notNull(),
  averagePrice: integer("average_price").notNull(),
  totalInvested: integer("total_invested").notNull(),
  currentValue: integer("current_value").default(0),
  realizedPnl: integer("realized_pnl").default(0),
  unrealizedPnl: integer("unrealized_pnl").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketTrades = pgTable("market_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  userWallet: text("user_wallet").notNull(),
  tradeType: text("trade_type").notNull(),
  outcome: text("outcome").notNull(),
  shares: integer("shares").notNull(),
  price: integer("price").notNull(),
  streamAmount: integer("stream_amount").notNull(),
  fee: integer("fee").notNull(),
  blockchainTxHash: text("blockchain_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_market_trades_created_at").on(table.createdAt),
  marketIdIdx: index("idx_market_trades_market_id").on(table.marketId),
}));

export const marketResolutions = pgTable("market_resolutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  resolution: text("resolution").notNull(),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolutionSource: text("resolution_source").notNull(),
  resolutionData: jsonb("resolution_data"),
  disputePeriodEnd: timestamp("dispute_period_end"),
  disputeCount: integer("dispute_count").default(0),
  blockchainTxHash: text("blockchain_tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketResolutionsAudit = pgTable("market_resolutions_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  resolution: text("resolution").notNull(),
  confidence: real("confidence"),
  evidence: jsonb("evidence"),
  reasoning: text("reasoning"),
  resolvedBy: text("resolved_by").notNull(),
  autoResolved: boolean("auto_resolved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentSuspensions = pgTable("agent_suspensions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => aiAgents.id).notNull(),
  reason: text("reason").notNull(),
  detail: jsonb("detail"),
  suspendedUntil: timestamp("suspended_until").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  agentIdx: index("idx_agent_suspensions_agent").on(table.agentId, table.suspendedUntil),
}));

export const insertAgentSuspensionSchema = createInsertSchema(agentSuspensions).omit({
  id: true,
  createdAt: true,
});
export type InsertAgentSuspension = z.infer<typeof insertAgentSuspensionSchema>;
export type AgentSuspension = typeof agentSuspensions.$inferSelect;

export const riskEvents = pgTable("risk_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  agentId: varchar("agent_id"),
  marketId: varchar("market_id"),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_risk_events_created_at").on(table.createdAt),
}));

export const insertRiskEventSchema = createInsertSchema(riskEvents).omit({
  id: true,
  createdAt: true,
});
export type InsertRiskEvent = z.infer<typeof insertRiskEventSchema>;
export type RiskEvent = typeof riskEvents.$inferSelect;

// Audit log of every attempted on-chain write (success or failure).
export const onchainActions = pgTable("onchain_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  args: jsonb("args"),
  txHash: text("tx_hash"),
  gasUsed: text("gas_used"),
  status: text("status").notNull(), // 'success' | 'failed'
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOnchainActionSchema = createInsertSchema(onchainActions).omit({
  id: true,
  createdAt: true,
});
export type InsertOnchainAction = z.infer<typeof insertOnchainActionSchema>;
export type OnchainAction = typeof onchainActions.$inferSelect;

// Points-to-token bridge withdrawal requests. Feature is DORMANT BY DESIGN
// (BRIDGE_ENABLED=false); see replit.md "TOKEN BRIDGE" section.
export const bridgeRequests = pgTable("bridge_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  points: integer("points").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'minted' | 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  decidedBy: varchar("decided_by"),
  txHash: text("tx_hash"),
});

export const insertBridgeRequestSchema = createInsertSchema(bridgeRequests).omit({
  id: true,
  createdAt: true,
  decidedBy: true,
  txHash: true,
});
export type InsertBridgeRequest = z.infer<typeof insertBridgeRequestSchema>;
export type BridgeRequest = typeof bridgeRequests.$inferSelect;

export const liquidityProviders = pgTable("liquidity_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  userWallet: text("user_wallet").notNull(),
  shares: integer("shares").notNull(),
  streamProvided: integer("stream_provided").notNull(),
  feesEarned: integer("fees_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketPredictors = pgTable("market_predictors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  walletAddress: text("wallet_address").notNull(),
  totalPredictions: integer("total_predictions").default(0),
  correctPredictions: integer("correct_predictions").default(0),
  accuracyRate: real("accuracy_rate").default(0),
  totalVolume: integer("total_volume").default(0),
  totalProfit: integer("total_profit").default(0),
  totalLoss: integer("total_loss").default(0),
  netProfit: integer("net_profit").default(0),
  roi: real("roi").default(0),
  rank: integer("rank"),
  badges: jsonb("badges"),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =============================================================================
// AVATAR MARKET TRADING SYSTEM
// =============================================================================

export const avatarTrades = pgTable("avatar_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id).notNull(),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  tradeType: text("trade_type").notNull(), // BUY, SELL
  outcome: text("outcome").notNull(), // YES, NO
  shares: integer("shares").notNull(),
  price: integer("price").notNull(), // price per share in basis points
  streamAmount: integer("stream_amount").notNull(), // total STREAM spent/received
  reasoning: text("reasoning"), // AI-generated reasoning for the trade
  tradingStyle: text("trading_style"), // avatar's trading style at time of trade
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  avatarIdx: index("idx_avatar_trades_avatar").on(table.avatarId),
  marketIdx: index("idx_avatar_trades_market").on(table.marketId),
}));

export const avatarPositions = pgTable("avatar_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id).notNull(),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  outcome: text("outcome").notNull(), // YES, NO
  shares: integer("shares").notNull().default(0),
  averagePrice: integer("average_price").notNull().default(5000), // basis points
  totalInvested: integer("total_invested").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  marketIdx: index("idx_avatar_positions_market").on(table.marketId),
  avatarIdx: index("idx_avatar_positions_avatar").on(table.avatarId),
}));

export type AvatarTrade = typeof avatarTrades.$inferSelect;
export type InsertAvatarTrade = typeof avatarTrades.$inferInsert;
export type AvatarPosition = typeof avatarPositions.$inferSelect;
export type InsertAvatarPosition = typeof avatarPositions.$inferInsert;

export const avatarPosts = pgTable("avatar_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id).notNull(),
  marketId: varchar("market_id").references(() => predictionMarkets.id),
  tradeId: varchar("trade_id").references(() => avatarTrades.id),
  action: text("action").notNull(),
  outcome: text("outcome"),
  asset: text("asset"),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  likeCount: integer("like_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  parentPostId: varchar("parent_post_id"),
  authorUserId: varchar("author_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  parentIdx: index("idx_avatar_posts_parent").on(table.parentPostId),
  createdAtIdx: index("idx_avatar_posts_created_at").on(table.createdAt.desc()),
  avatarIdx: index("idx_avatar_posts_avatar").on(table.avatarId),
}));

export const avatarPostReactions = pgTable("avatar_post_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => avatarPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reactionType: text("reaction_type").notNull().default("like"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // One reaction of each type per user per post (name matches existing DB constraint)
  uniquePostUserReaction: unique("avatar_post_reactions_post_id_user_id_reaction_type_key").on(table.postId, table.userId, table.reactionType),
}));

export type AvatarPost = typeof avatarPosts.$inferSelect;
export type InsertAvatarPost = typeof avatarPosts.$inferInsert;
export type AvatarPostReaction = typeof avatarPostReactions.$inferSelect;

// =============================================================================
// AI AGENT TRADING SYSTEM
// =============================================================================

export const aiAgents = pgTable("ai_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  personality: text("personality").notNull(),
  description: text("description").notNull(),
  avatar: text("avatar"),
  strategy: text("strategy").notNull(),
  riskTolerance: text("risk_tolerance").notNull(),
  confidenceThreshold: real("confidence_threshold").notNull(),
  totalPredictions: integer("total_predictions").default(0),
  correctPredictions: integer("correct_predictions").default(0),
  accuracyRate: real("accuracy_rate").default(0),
  totalVolume: integer("total_volume").default(0),
  totalProfit: integer("total_profit").default(0),
  totalLoss: integer("total_loss").default(0),
  netProfit: integer("net_profit").default(0),
  roi: real("roi").default(0),
  rank: integer("rank"),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  isActiveIdx: index("idx_ai_agents_is_active").on(table.isActive),
}));

export const aiPredictions = pgTable("ai_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  agentId: varchar("agent_id").references(() => aiAgents.id).notNull(),
  prediction: text("prediction").notNull(),
  confidence: real("confidence").notNull(),
  reasoning: text("reasoning").notNull(),
  analysisData: jsonb("analysis_data"),
  marketDataSnapshot: jsonb("market_data_snapshot"),
  outcome: text("outcome"),
  isCorrect: boolean("is_correct"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiPositions = pgTable("ai_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  agentId: varchar("agent_id").references(() => aiAgents.id).notNull(),
  predictionId: varchar("prediction_id").references(() => aiPredictions.id),
  outcome: text("outcome").notNull(),
  shares: integer("shares").notNull(),
  averagePrice: integer("average_price").notNull(),
  totalInvested: integer("total_invested").notNull(),
  currentValue: integer("current_value").default(0),
  realizedPnl: integer("realized_pnl").default(0),
  unrealizedPnl: integer("unrealized_pnl").default(0),
  status: text("status").notNull().default("open"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiTrades = pgTable("ai_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  agentId: varchar("agent_id").references(() => aiAgents.id).notNull(),
  positionId: varchar("position_id").references(() => aiPositions.id),
  tradeType: text("trade_type").notNull(),
  outcome: text("outcome").notNull(),
  shares: integer("shares").notNull(),
  price: integer("price").notNull(),
  streamAmount: integer("stream_amount").notNull(),
  fee: integer("fee").notNull(),
  reasoning: text("reasoning"),
  probability: real("probability"), // AI confidence score 0-100
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("idx_ai_trades_created_at").on(table.createdAt),
  agentIdIdx: index("idx_ai_trades_agent_id").on(table.agentId),
  marketIdIdx: index("idx_ai_trades_market_id").on(table.marketId),
}));

export const agentMemory = pgTable("agent_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => aiAgents.id).notNull(),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  decision: text("decision").notNull(), // YES | NO
  confidence: real("confidence").notNull(), // 0-1
  stake: integer("stake").notNull(),
  outcome: text("outcome").notNull().default("open"), // open | won | lost
  pnl: integer("pnl").default(0),
  reasoningSummary: varchar("reasoning_summary", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => ({
  agentIdx: index("idx_agent_memory_agent").on(table.agentId, table.createdAt.desc()),
  marketOpenIdx: index("idx_agent_memory_market_open").on(table.marketId).where(sql`outcome = 'open'`),
}));

export const insertAgentMemorySchema = createInsertSchema(agentMemory).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});
export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type AgentMemory = typeof agentMemory.$inferSelect;

export const insertPredictionMarketSchema = createInsertSchema(predictionMarkets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketPositionSchema = createInsertSchema(marketPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketTradeSchema = createInsertSchema(marketTrades).omit({
  id: true,
  createdAt: true,
});

export const insertMarketResolutionSchema = createInsertSchema(marketResolutions).omit({
  id: true,
  createdAt: true,
});

export const insertMarketResolutionAuditSchema = createInsertSchema(marketResolutionsAudit).omit({
  id: true,
  createdAt: true,
});

export const insertLiquidityProviderSchema = createInsertSchema(liquidityProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketPredictorSchema = createInsertSchema(marketPredictors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiPredictionSchema = createInsertSchema(aiPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiPositionSchema = createInsertSchema(aiPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiTradeSchema = createInsertSchema(aiTrades).omit({
  id: true,
  createdAt: true,
});

// Waitlist table for email collection
export const waitlist = pgTable("waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  referralSource: text("referral_source"), // landing_page, twitter, direct, etc.
  unsubscribed: boolean("unsubscribed").default(false),
  unsubscribeToken: text("unsubscribe_token").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
});

export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;

// Newsletter tracking table.
// Sends are claim-then-send: a 'sending' claim row is inserted FIRST, keyed
// by (edition_date, edition) with a UNIQUE constraint so a slot can never be
// sent twice regardless of scheduler bugs. Slot math is America/New_York.
export const newsletters = pgTable(
  "newsletters",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    subject: text("subject").notNull(),
    content: text("content").notNull(), // HTML content
    marketData: jsonb("market_data"), // Cached market data used in newsletter
    sentAt: timestamp("sent_at").defaultNow(),
    recipientCount: integer("recipient_count").default(0),
    scheduledFor: timestamp("scheduled_for"),
    status: text("status").notNull().default("draft"), // draft, scheduled, sending, sent, failed
    editionDate: text("edition_date"), // YYYY-MM-DD in America/New_York
    edition: text("edition"), // 'morning' | 'market_close'
    sentBy: text("sent_by"), // 'cron' | 'catch-up' | 'manual'
  },
  (t) => [uniqueIndex("newsletters_edition_date_edition_idx").on(t.editionDate, t.edition)],
);

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  sentAt: true,
});

export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Newsletter = typeof newsletters.$inferSelect;

// ---------------------------------------------------------------------------
// Phase 1 data-repair framework.
//
// `repair_runs` records every preflight and run of a named repair operation so
// they are auditable and idempotent (a successful run is refused a second time
// unless force=true). `newsletters_dedup_backup` archives the exact rows a
// destructive newsletter dedup deletes, so a repair is always reversible.
//
// NOTE: these tables are declared here for `db push` at deploy time only. The
// repair endpoints run DML only (INSERT/UPDATE/DELETE) inside a transaction —
// they never emit CREATE/ALTER at runtime.
// ---------------------------------------------------------------------------
export const repairRuns = pgTable("repair_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairId: text("repair_id").notNull(), // 'repair-001' | 'repair-002' | 'repair-003'
  phase: text("phase").notNull(), // 'preflight' | 'run'
  status: text("status").notNull(), // 'not_needed' | 'ok' | 'refused' | 'error'
  preflight: jsonb("preflight"), // preflight report captured for this operation
  result: jsonb("result"), // run result (counts, affected ids, etc.)
  runBy: text("run_by"), // authenticated admin username
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRepairRunSchema = createInsertSchema(repairRuns).omit({
  id: true,
  createdAt: true,
});
export type InsertRepairRun = z.infer<typeof insertRepairRunSchema>;
export type RepairRun = typeof repairRuns.$inferSelect;

// Full newsletters shape (mirrors `newsletters`) plus backup metadata so a
// dedup delete can be inspected and, if ever necessary, hand-restored.
export const newslettersDedupBackup = pgTable("newsletters_dedup_backup", {
  // Backup row identity (distinct from the original newsletter id).
  backupId: varchar("backup_id").primaryKey().default(sql`gen_random_uuid()`),
  // --- exact newsletters shape -------------------------------------------
  id: varchar("id").notNull(), // original newsletters.id
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  marketData: jsonb("market_data"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count"),
  scheduledFor: timestamp("scheduled_for"),
  status: text("status").notNull(),
  editionDate: text("edition_date"),
  edition: text("edition"),
  sentBy: text("sent_by"),
  // --- backup metadata ----------------------------------------------------
  source: text("source").notNull().default("repair-001"), // which repair archived it
  backedUpBy: text("backed_up_by"), // admin username who ran the repair
  backedUpAt: timestamp("backed_up_at").defaultNow().notNull(),
});

export type NewsletterDedupBackup = typeof newslettersDedupBackup.$inferSelect;

export type InsertPredictionMarket = z.infer<typeof insertPredictionMarketSchema>;
export type PredictionMarket = typeof predictionMarkets.$inferSelect;

export type InsertMarketPosition = z.infer<typeof insertMarketPositionSchema>;
export type MarketPosition = typeof marketPositions.$inferSelect;

export type InsertMarketTrade = z.infer<typeof insertMarketTradeSchema>;
export type MarketTrade = typeof marketTrades.$inferSelect;

export type InsertMarketResolution = z.infer<typeof insertMarketResolutionSchema>;
export type InsertMarketResolutionAudit = z.infer<typeof insertMarketResolutionAuditSchema>;
export type MarketResolutionAudit = typeof marketResolutionsAudit.$inferSelect;
export type MarketResolution = typeof marketResolutions.$inferSelect;

export type InsertLiquidityProvider = z.infer<typeof insertLiquidityProviderSchema>;
export type LiquidityProvider = typeof liquidityProviders.$inferSelect;

export type InsertMarketPredictor = z.infer<typeof insertMarketPredictorSchema>;
export type MarketPredictor = typeof marketPredictors.$inferSelect;

export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type AiAgent = typeof aiAgents.$inferSelect;

export type InsertAiPrediction = z.infer<typeof insertAiPredictionSchema>;
export type AiPrediction = typeof aiPredictions.$inferSelect;

export type InsertAiPosition = z.infer<typeof insertAiPositionSchema>;
export type AiPosition = typeof aiPositions.$inferSelect;

export type InsertAiTrade = z.infer<typeof insertAiTradeSchema>;
export type AiTrade = typeof aiTrades.$inferSelect;

// Autonomous AI System Activity Tracking
export const autonomousSystemLogs = pgTable("autonomous_system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  systemName: text("system_name").notNull(), // market_resolver, liquidity_provider, trend_spotter, etc.
  actionType: text("action_type").notNull(), // market_created, market_resolved, liquidity_added, content_moderated, etc.
  status: text("status").notNull(), // success, failed, partial
  targetId: text("target_id"), // ID of affected entity (market ID, summary ID, etc.)
  metadata: jsonb("metadata"), // detailed action data
  reasoning: text("reasoning"), // GPT-4 reasoning for the action
  errorMessage: text("error_message"),
  executionTimeMs: integer("execution_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAutonomousSystemLogSchema = createInsertSchema(autonomousSystemLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAutonomousSystemLog = z.infer<typeof insertAutonomousSystemLogSchema>;
export type AutonomousSystemLog = typeof autonomousSystemLogs.$inferSelect;

// =============================================================================
// PREDICTION MARKET ENHANCEMENTS - ACHIEVEMENTS & ANALYTICS
// =============================================================================

// Market price history for charting
export const marketPriceHistory = pgTable("market_price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").references(() => predictionMarkets.id).notNull(),
  yesPrice: integer("yes_price").notNull(),
  noPrice: integer("no_price").notNull(),
  yesLiquidity: integer("yes_liquidity").notNull(),
  noLiquidity: integer("no_liquidity").notNull(),
  totalVolume: integer("total_volume").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievement definitions
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // first_trade, prophet_100, whale, win_streak_5, etc
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // trading, prediction, social, milestone
  tier: text("tier").notNull(), // bronze, silver, gold, platinum
  iconUrl: text("icon_url"),
  requirement: jsonb("requirement").notNull(), // { type: 'trade_count', value: 1 } or { type: 'win_streak', value: 5 }
  reward: integer("reward").default(0), // STREAM token reward
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements unlocked
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: varchar("achievement_id").references(() => achievements.id).notNull(),
  progress: integer("progress").default(0), // for progressive achievements
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // One row per user per achievement (name matches existing DB constraint)
  uniqueUserAchievement: unique("user_achievements_user_achievement_unique").on(table.userId, table.achievementId),
}));

// Enhanced user trading stats for leaderboards
export const userTradingStats = pgTable("user_trading_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Overall stats
  totalTrades: integer("total_trades").default(0),
  totalVolume: integer("total_volume").default(0),
  totalProfit: integer("total_profit").default(0),
  totalLoss: integer("total_loss").default(0),
  netProfit: integer("net_profit").default(0),
  
  // Win/Loss tracking
  winningTrades: integer("winning_trades").default(0),
  losingTrades: integer("losing_trades").default(0),
  winRate: real("win_rate").default(0), // percentage
  
  // Streaks
  currentWinStreak: integer("current_win_streak").default(0),
  longestWinStreak: integer("longest_win_streak").default(0),
  
  // ROI & Performance
  roi: real("roi").default(0), // return on investment percentage
  sharpeRatio: real("sharpe_ratio").default(0), // risk-adjusted returns
  
  // Market activity
  activePositions: integer("active_positions").default(0),
  marketsTraded: integer("markets_traded").default(0),
  
  // Rankings
  profitRank: integer("profit_rank"),
  volumeRank: integer("volume_rank"),
  winRateRank: integer("win_rate_rank"),
  roiRank: integer("roi_rank"),
  overallRank: integer("overall_rank"),
  
  // Time-based stats
  weeklyProfit: integer("weekly_profit").default(0),
  monthlyProfit: integer("monthly_profit").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leaderboard snapshots for historical tracking

export const insertMarketPriceHistorySchema = createInsertSchema(marketPriceHistory).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserTradingStatsSchema = createInsertSchema(userTradingStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export type InsertMarketPriceHistory = z.infer<typeof insertMarketPriceHistorySchema>;
export type MarketPriceHistory = typeof marketPriceHistory.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertUserTradingStats = z.infer<typeof insertUserTradingStatsSchema>;
export type UserTradingStats = typeof userTradingStats.$inferSelect;


// =============================================================================
// PREDICTION LEAGUES - COMPETITIVE TRADING COMPETITIONS
// =============================================================================

export const predictionLeagues = pgTable("prediction_leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  
  // League timing
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Entry requirements
  entryFee: integer("entry_fee").default(0), // STREAM points to join (0 = free)
  maxParticipants: integer("max_participants"), // null = unlimited
  minTrades: integer("min_trades").default(1), // minimum trades to qualify for prizes
  
  // Prize pool
  prizePool: integer("prize_pool").default(0), // total STREAM to distribute
  prizeDistribution: jsonb("prize_distribution"), // [{ rank: 1, percentage: 50 }, { rank: 2, percentage: 30 }, ...]
  
  // League type
  leagueType: text("league_type").notNull().default("weekly"), // weekly, monthly, special
  isRecurring: boolean("is_recurring").default(false), // auto-create next league when this ends
  
  // Status
  status: text("status").notNull().default("upcoming"), // upcoming, active, completed, cancelled
  
  // Stats
  totalParticipants: integer("total_participants").default(0),
  totalVolume: integer("total_volume").default(0),
  
  // Creator info
  creatorId: varchar("creator_id").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leagueParticipants = pgTable("league_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").references(() => predictionLeagues.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Entry tracking
  entryFeePaid: integer("entry_fee_paid").default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
  
  // Performance during league
  totalTrades: integer("total_trades").default(0),
  totalVolume: integer("total_volume").default(0),
  totalProfit: integer("total_profit").default(0),
  totalLoss: integer("total_loss").default(0),
  netProfit: integer("net_profit").default(0),
  winningTrades: integer("winning_trades").default(0),
  losingTrades: integer("losing_trades").default(0),
  winRate: real("win_rate").default(0),
  roi: real("roi").default(0),
  
  // Current rank (updated as league progresses)
  currentRank: integer("current_rank"),
  
  // Prize info (set when league ends)
  finalRank: integer("final_rank"),
  prizeWon: integer("prize_won").default(0),
  prizeClaimed: boolean("prize_claimed").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leagueTrades = pgTable("league_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: varchar("league_id").references(() => predictionLeagues.id).notNull(),
  participantId: varchar("participant_id").references(() => leagueParticipants.id).notNull(),
  marketTradeId: varchar("market_trade_id").references(() => marketTrades.id).notNull(),
  
  // Trade snapshot for scoring
  streamAmount: integer("stream_amount").notNull(),
  outcome: text("outcome").notNull(), // YES or NO
  price: integer("price").notNull(),
  
  // Result (set when market resolves)
  profitLoss: integer("profit_loss"),
  isWin: boolean("is_win"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPredictionLeagueSchema = createInsertSchema(predictionLeagues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeagueParticipantSchema = createInsertSchema(leagueParticipants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeagueTradeSchema = createInsertSchema(leagueTrades).omit({
  id: true,
  createdAt: true,
});

export type InsertPredictionLeague = z.infer<typeof insertPredictionLeagueSchema>;
export type PredictionLeague = typeof predictionLeagues.$inferSelect;

export type InsertLeagueParticipant = z.infer<typeof insertLeagueParticipantSchema>;
export type LeagueParticipant = typeof leagueParticipants.$inferSelect;

export type InsertLeagueTrade = z.infer<typeof insertLeagueTradeSchema>;
export type LeagueTrade = typeof leagueTrades.$inferSelect;

// ==================== GOVERNANCE SYSTEM ====================

export const governanceProposals = pgTable("governance_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proposerId: varchar("proposer_id").references(() => users.id).notNull(),
  proposerAddress: text("proposer_address"),
  category: text("category").notNull().default("COMMUNITY"), // PROTOCOL, TREASURY, GOVERNANCE, COMMUNITY, TECHNICAL
  status: text("status").notNull().default("ACTIVE"), // DRAFT, ACTIVE, SUCCEEDED, FAILED, EXECUTED, CANCELLED
  
  // Voting stats (updated on each vote)
  votesFor: integer("votes_for").default(0),
  votesAgainst: integer("votes_against").default(0),
  votesAbstain: integer("votes_abstain").default(0),
  quorumRequired: integer("quorum_required").default(10000), // Minimum votes needed
  
  // Execution details (for on-chain proposals)
  targets: text("targets").array(),
  values: text("values").array(),
  signatures: text("signatures").array(),
  calldatas: text("calldatas").array(),
  executionTxHash: text("execution_tx_hash"),
  
  // Timing
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  executedAt: timestamp("executed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const governanceVotes = pgTable("governance_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").references(() => governanceProposals.id).notNull(),
  voterId: varchar("voter_id").references(() => users.id).notNull(),
  voterAddress: text("voter_address"),
  
  support: text("support").notNull(), // FOR, AGAINST, ABSTAIN
  votingPower: integer("voting_power").notNull().default(1), // Based on STREAM points
  reason: text("reason"),
  
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGovernanceProposalSchema = createInsertSchema(governanceProposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGovernanceVoteSchema = createInsertSchema(governanceVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertGovernanceProposal = z.infer<typeof insertGovernanceProposalSchema>;
export type GovernanceProposal = typeof governanceProposals.$inferSelect;

export type InsertGovernanceVote = z.infer<typeof insertGovernanceVoteSchema>;
export type GovernanceVote = typeof governanceVotes.$inferSelect;

// ==================== LIVE STREAMING SYSTEM ====================

export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Stream basics
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  
  // Stream type (maps to the 4 terminal modes)
  streamType: text("stream_type").notNull().default("broadcast"), // broadcast, trading_room, audio_space, live_bounty
  
  // Host information
  // PARKED: legacy rows store knowledge_avatars.id here. Do not restore the
  // users FK until the Phase 3 split in docs/schema-drift-final-parked-2026-08-16.md.
  hostId: varchar("host_id").notNull(),
  hostAvatarId: varchar("host_avatar_id").references(() => knowledgeAvatars.id), // If Knowledge Avatar is hosting
  
  // Stream state
  status: text("status").notNull().default("scheduled"), // scheduled, live, ended, cancelled
  isRecording: boolean("is_recording").default(false),
  
  // Audience settings
  maxViewers: integer("max_viewers").default(1000),
  isPrivate: boolean("is_private").default(false),
  requiresTicket: boolean("requires_ticket").default(false),
  ticketPrice: integer("ticket_price").default(0), // STREAM points
  
  // Platform integrations
  linkedBountyId: varchar("linked_bounty_id").references(() => bounties.id), // For live_bounty type
  linkedMarketId: varchar("linked_market_id").references(() => predictionMarkets.id), // For trading_room type
  
  // Categories and tags
  category: text("category"), // crypto, trading, defi, nft, education, ama
  tags: text("tags").array(),
  
  // WebRTC/Streaming details
  roomId: text("room_id").unique(), // WebRTC room identifier
  streamKey: text("stream_key"), // For RTMP streaming (future)
  
  // Stats (updated in real-time)
  currentViewers: integer("current_viewers").default(0),
  peakViewers: integer("peak_viewers").default(0),
  totalViews: integer("total_views").default(0),
  totalTipsReceived: integer("total_tips_received").default(0),
  totalMessages: integer("total_messages").default(0),
  
  // Scheduling
  scheduledStart: timestamp("scheduled_start"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  durationSeconds: integer("duration_seconds"),
  
  // AI-generated content (after stream ends)
  transcription: text("transcription"),
  aiSummary: text("ai_summary"),
  keyMoments: jsonb("key_moments"), // [{ timestamp, description, type }]
  extractedPredictions: jsonb("extracted_predictions"), // AI-detected predictions for market creation
  
  // Generated summary (links to summaries table if auto-generated)
  generatedSummaryId: varchar("generated_summary_id").references(() => summaries.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const streamParticipants = pgTable("stream_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id),
  
  // Role in stream
  role: text("role").notNull().default("viewer"), // host, co_host, speaker, viewer, moderator
  participantType: text("participant_type").notNull().default("user"), // user, avatar
  
  // Participation state
  isActive: boolean("is_active").default(true),
  isMuted: boolean("is_muted").default(false),
  isVideoOn: boolean("is_video_on").default(false),
  isScreenSharing: boolean("is_screen_sharing").default(false),
  handRaised: boolean("hand_raised").default(false),
  
  // Real-time conversation audio settings
  audioPreference: text("audio_preference").default("text_only"), // microphone, tts, text_only
  speakingStatus: text("speaking_status").default("idle"), // idle, speaking, requested, queued
  speakerQueuePosition: integer("speaker_queue_position"),
  lastAudioActivity: timestamp("last_audio_activity"),
  
  // For audio spaces - speaking request queue
  speakRequestedAt: timestamp("speak_requested_at"),
  speakApprovedAt: timestamp("speak_approved_at"),
  
  // Engagement tracking
  totalWatchTime: integer("total_watch_time").default(0), // seconds
  messagesCount: integer("messages_count").default(0),
  tipsGiven: integer("tips_given").default(0),
  reactionsGiven: integer("reactions_given").default(0),
  
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

// Stream Conversation Transcripts - Real-time spoken messages (TTS/audio)
export const streamConversationMessages = pgTable("stream_conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  participantId: varchar("participant_id").notNull(), // FK declared below with explicit (truncated) name
  
  // Speaker info (denormalized for quick access)
  speakerType: text("speaker_type").notNull(), // user, avatar
  speakerUserId: varchar("speaker_user_id").references(() => users.id),
  speakerAvatarId: varchar("speaker_avatar_id"), // FK declared below with explicit (truncated) name
  speakerName: text("speaker_name").notNull(),
  
  // Message content
  textContent: text("text_content").notNull(), // The spoken/typed message
  audioUrl: text("audio_url"), // TTS-generated audio URL (if applicable)
  audioDurationMs: integer("audio_duration_ms"),
  
  // Source of the message
  sourceType: text("source_type").notNull(), // microphone_transcription, tts_generated, text_input
  
  // For AI avatar responses
  promptContext: text("prompt_context"), // The context that generated this response
  replyToMessageId: varchar("reply_to_message_id"),
  
  // Moderation
  isDeleted: boolean("is_deleted").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Names match the DB constraints (Postgres truncates identifiers to 63 chars)
  participantFk: foreignKey({ columns: [table.participantId], foreignColumns: [streamParticipants.id], name: "stream_conversation_messages_participant_id_stream_participants" }),
  speakerAvatarFk: foreignKey({ columns: [table.speakerAvatarId], foreignColumns: [knowledgeAvatars.id], name: "stream_conversation_messages_speaker_avatar_id_knowledge_avatar" }),
}));

export const streamTips = pgTable("stream_tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  tipperId: varchar("tipper_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(), // Usually the host
  
  amount: integer("amount").notNull(), // STREAM points
  message: text("message"), // Optional tip message
  
  // Display settings
  isHighlighted: boolean("is_highlighted").default(false), // Super chat style highlight
  highlightColor: text("highlight_color"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamMessages = pgTable("stream_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  // PARKED: legacy rows store knowledge_avatars.id here. Do not restore the
  // users FK until the Phase 3 split in docs/schema-drift-final-parked-2026-08-16.md.
  userId: varchar("user_id").notNull(),
  
  // Message content
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("chat"), // chat, prediction, question, poll, announcement, tip_message
  
  // For predictions/polls
  metadata: jsonb("metadata"), // { prediction: "BTC > 100k", pollOptions: [...], etc }
  
  // Moderation
  isDeleted: boolean("is_deleted").default(false),
  deletedBy: varchar("deleted_by").references(() => users.id),
  isPinned: boolean("is_pinned").default(false),
  
  // Reactions aggregation
  reactions: jsonb("reactions").default({}), // { "🚀": 5, "💎": 3 }
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamRecordings = pgTable("stream_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  
  // Recording details
  recordingUrl: text("recording_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: integer("duration_seconds"),
  fileSizeBytes: integer("file_size_bytes"),
  
  // TTS Audio for replay (base64 encoded)
  audioData: text("audio_data"),
  
  // Processing status
  status: text("status").notNull().default("processing"), // processing, ready, failed, deleted
  
  // Decentralized storage
  ipfsHash: text("ipfs_hash"),
  arweaveId: text("arweave_id"),
  
  // Clips/highlights
  isClip: boolean("is_clip").default(false),
  clipStartTime: integer("clip_start_time"), // seconds from start
  clipEndTime: integer("clip_end_time"),
  parentRecordingId: varchar("parent_recording_id").references((): AnyPgColumn => streamRecordings.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream-to-Market pipeline: Create prediction markets from live stream predictions
export const streamPredictions = pgTable("stream_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  predictorId: varchar("predictor_id").references(() => users.id).notNull(),
  
  // The prediction made during stream
  predictionText: text("prediction_text").notNull(),
  confidence: integer("confidence"), // 0-100
  timestamp: integer("timestamp"), // seconds into stream when made
  
  // Status of market creation
  marketCreated: boolean("market_created").default(false),
  marketId: varchar("market_id").references(() => predictionMarkets.id),
  
  // Community interest (used to decide whether to create market)
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStreamParticipantSchema = createInsertSchema(streamParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertStreamConversationMessageSchema = createInsertSchema(streamConversationMessages).omit({
  id: true,
  createdAt: true,
});

export const insertStreamTipSchema = createInsertSchema(streamTips).omit({
  id: true,
  createdAt: true,
});

export const insertStreamMessageSchema = createInsertSchema(streamMessages).omit({
  id: true,
  createdAt: true,
});

export const insertStreamRecordingSchema = createInsertSchema(streamRecordings).omit({
  id: true,
  createdAt: true,
});

export const insertStreamPredictionSchema = createInsertSchema(streamPredictions).omit({
  id: true,
  createdAt: true,
});

// Streamer Subscriptions - Support creators with monthly subscriptions
export const streamerSubscriptions = pgTable("streamer_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamerId: varchar("streamer_id").references(() => users.id).notNull(),
  subscriberId: varchar("subscriber_id").references(() => users.id).notNull(),
  
  tier: text("tier").notNull().default("supporter"), // supporter, vip, whale
  monthlyPrice: integer("monthly_price").notNull(), // STREAM points per month
  
  status: text("status").notNull().default("active"), // active, cancelled, expired, paused
  
  benefits: jsonb("benefits").default({}), // { subscriberBadge: true, emotes: [], noAds: true }
  
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  renewsAt: timestamp("renews_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  totalPaid: integer("total_paid").default(0),
  monthsSubscribed: integer("months_subscribed").default(0),
  
  autoRenew: boolean("auto_renew").default(true),
  giftedBy: varchar("gifted_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Streamer Subscription Tiers - Define what each tier offers
export const streamerSubscriptionTiers = pgTable("streamer_subscription_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamerId: varchar("streamer_id").references(() => users.id).notNull(),
  
  tierName: text("tier_name").notNull(), // supporter, vip, whale
  monthlyPrice: integer("monthly_price").notNull(),
  
  benefits: jsonb("benefits").default({}),
  emotes: text("emotes").array(), // Custom emotes unlocked at this tier
  badgeUrl: text("badge_url"),
  
  subscriberOnlyChat: boolean("subscriber_only_chat").default(false),
  noAds: boolean("no_ads").default(false),
  prioritySupport: boolean("priority_support").default(false),
  exclusiveContent: boolean("exclusive_content").default(false),
  
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Super Chats - Premium highlighted messages
export const superChats = pgTable("super_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  
  amount: integer("amount").notNull(), // STREAM points
  message: text("message"),
  
  tier: text("tier").notNull().default("basic"), // basic, super, mega
  highlightColor: text("highlight_color"),
  durationSeconds: integer("duration_seconds").default(5), // How long to display
  
  enableTTS: boolean("enable_tts").default(false), // Text-to-speech
  isRead: boolean("is_read").default(false), // Has the streamer acknowledged
  isPinned: boolean("is_pinned").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Raids - Send viewers to other streams
export const streamRaids = pgTable("stream_raids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromStreamId: varchar("from_stream_id").references(() => liveStreams.id).notNull(),
  toStreamId: varchar("to_stream_id").references(() => liveStreams.id).notNull(),
  
  raiderId: varchar("raider_id").references(() => users.id).notNull(), // Who initiated the raid
  
  viewersTransferred: integer("viewers_transferred").default(0),
  
  status: text("status").notNull().default("pending"), // pending, accepted, declined, completed
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Stream Clips - User-created highlights
export const streamClips = pgTable("stream_clips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  
  title: text("title").notNull(),
  description: text("description"),
  
  startTime: integer("start_time").notNull(), // seconds from stream start
  endTime: integer("end_time").notNull(),
  durationSeconds: integer("duration_seconds"),
  
  clipUrl: text("clip_url"),
  thumbnailUrl: text("thumbnail_url"),
  
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  
  isFeatured: boolean("is_featured").default(false),
  isDeleted: boolean("is_deleted").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertStreamerSubscriptionSchema = createInsertSchema(streamerSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertStreamerSubscriptionTierSchema = createInsertSchema(streamerSubscriptionTiers).omit({
  id: true,
  createdAt: true,
});

export const insertSuperChatSchema = createInsertSchema(superChats).omit({
  id: true,
  createdAt: true,
});

export const insertStreamRaidSchema = createInsertSchema(streamRaids).omit({
  id: true,
  createdAt: true,
});

export const insertStreamClipSchema = createInsertSchema(streamClips).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;

export type InsertStreamParticipant = z.infer<typeof insertStreamParticipantSchema>;
export type StreamParticipant = typeof streamParticipants.$inferSelect;

export type InsertStreamConversationMessage = z.infer<typeof insertStreamConversationMessageSchema>;
export type StreamConversationMessage = typeof streamConversationMessages.$inferSelect;

export type InsertStreamTip = z.infer<typeof insertStreamTipSchema>;
export type StreamTip = typeof streamTips.$inferSelect;

export type InsertStreamMessage = z.infer<typeof insertStreamMessageSchema>;
export type StreamMessage = typeof streamMessages.$inferSelect;

export type InsertStreamRecording = z.infer<typeof insertStreamRecordingSchema>;
export type StreamRecording = typeof streamRecordings.$inferSelect;

export type InsertStreamPrediction = z.infer<typeof insertStreamPredictionSchema>;
export type StreamPrediction = typeof streamPredictions.$inferSelect;

export type InsertStreamerSubscription = z.infer<typeof insertStreamerSubscriptionSchema>;
export type StreamerSubscription = typeof streamerSubscriptions.$inferSelect;

export type InsertStreamerSubscriptionTier = z.infer<typeof insertStreamerSubscriptionTierSchema>;
export type StreamerSubscriptionTier = typeof streamerSubscriptionTiers.$inferSelect;

export type InsertSuperChat = z.infer<typeof insertSuperChatSchema>;
export type SuperChat = typeof superChats.$inferSelect;

export type InsertStreamRaid = z.infer<typeof insertStreamRaidSchema>;
export type StreamRaid = typeof streamRaids.$inferSelect;

export type InsertStreamClip = z.infer<typeof insertStreamClipSchema>;
export type StreamClip = typeof streamClips.$inferSelect;

// =============================================================================
// ENHANCED STREAMING SYSTEM - Q&A, DEBATES, VOTING, ON-DEMAND TTS
// =============================================================================

// Stream Q&A Queue - Questions from viewers awaiting answers
export const streamQuestions = pgTable("stream_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  askerId: varchar("asker_id").references(() => users.id).notNull(),
  
  question: text("question").notNull(),
  status: text("status").notNull().default("pending"), // pending, answered, skipped, pinned
  
  upvotes: integer("upvotes").default(0),
  isAnonymous: boolean("is_anonymous").default(false),
  tipAmount: integer("tip_amount").default(0), // Tip to boost question priority
  
  answeredAt: timestamp("answered_at"),
  answerText: text("answer_text"), // Text response stored
  answerAudioId: varchar("answer_audio_id"), // Reference to audio segment
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Debates - User vs User or User vs Avatar debates
export const streamDebates = pgTable("stream_debates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  
  topic: text("topic").notNull(),
  description: text("description"),
  
  // Participants (can be user or avatar)
  participant1Id: varchar("participant1_id").references(() => users.id),
  participant1AvatarId: varchar("participant1_avatar_id").references(() => knowledgeAvatars.id),
  participant1Position: text("participant1_position").notNull(), // Their stance/side
  
  participant2Id: varchar("participant2_id").references(() => users.id),
  participant2AvatarId: varchar("participant2_avatar_id").references(() => knowledgeAvatars.id),
  participant2Position: text("participant2_position").notNull(),
  
  // Debate state
  status: text("status").notNull().default("pending"), // pending, invited, active, voting, completed
  currentTurn: integer("current_turn").default(1), // Which participant's turn (1 or 2)
  turnTimeLimit: integer("turn_time_limit").default(120), // Seconds per turn
  maxRounds: integer("max_rounds").default(3),
  currentRound: integer("current_round").default(1),
  
  // Voting
  participant1Votes: integer("participant1_votes").default(0),
  participant2Votes: integer("participant2_votes").default(0),
  winnerId: varchar("winner_id").references(() => users.id),
  winnerAvatarId: varchar("winner_avatar_id").references(() => knowledgeAvatars.id),
  
  // Rewards
  stakeAmount: integer("stake_amount").default(0), // STREAM points at stake
  winnerReward: integer("winner_reward").default(0),
  
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Debate Votes - Track individual votes
export const debateVotes = pgTable("debate_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  debateId: varchar("debate_id").references(() => streamDebates.id).notNull(),
  voterId: varchar("voter_id").references(() => users.id).notNull(),
  
  votedFor: integer("voted_for").notNull(), // 1 or 2 (participant number)
  voteWeight: integer("vote_weight").default(1), // Can be weighted by stake
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Invitations - For co-streaming and debates
export const streamInvitations = pgTable("stream_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  debateId: varchar("debate_id").references(() => streamDebates.id),
  
  inviterId: varchar("inviter_id").references(() => users.id).notNull(),
  inviteeId: varchar("invitee_id").references(() => users.id),
  inviteeAvatarId: varchar("invitee_avatar_id").references(() => knowledgeAvatars.id),
  
  invitationType: text("invitation_type").notNull(), // debate, co_host, speaker
  message: text("message"),
  
  status: text("status").notNull().default("pending"), // pending, accepted, declined, expired
  expiresAt: timestamp("expires_at"),
  respondedAt: timestamp("responded_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Scheduled Streams - For stream discovery and alerts
export const scheduledStreams = pgTable("scheduled_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id),
  
  hostId: varchar("host_id").references(() => users.id),
  hostAvatarId: varchar("host_avatar_id").references(() => knowledgeAvatars.id),
  
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  tags: text("tags").array(),
  
  scheduledAt: timestamp("scheduled_at").notNull(),
  estimatedDuration: integer("estimated_duration").default(60), // Minutes
  
  // For recurring streams
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"), // daily, weekly, custom
  recurringDays: text("recurring_days").array(), // ['monday', 'wednesday', 'friday']
  
  // Notifications
  remindersSent: boolean("reminders_sent").default(false),
  subscribersNotified: boolean("subscribers_notified").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Alerts/Subscriptions - Users subscribing to stream notifications
export const streamAlerts = pgTable("stream_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // What they're subscribing to (user or avatar)
  streamerId: varchar("streamer_id").references(() => users.id),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id),
  
  // Alert preferences
  alertOnLive: boolean("alert_on_live").default(true),
  alertOnScheduled: boolean("alert_on_scheduled").default(true),
  alertOnDebate: boolean("alert_on_debate").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// User Stream Settings - Voice preferences for user streams
export const userStreamSettings = pgTable("user_stream_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Voice options for user streams
  voiceMode: text("voice_mode").notNull().default("text"), // tts, mic, text
  ttsVoice: text("tts_voice").default("alloy"), // OpenAI voice selection
  ttsSpeed: real("tts_speed").default(1.0),
  
  // Default stream settings
  defaultCategory: text("default_category"),
  defaultTags: text("default_tags").array(),
  defaultStreamType: text("default_stream_type").default("broadcast"),
  
  // Permissions
  allowDebateInvites: boolean("allow_debate_invites").default(true),
  allowCoHostInvites: boolean("allow_co_host_invites").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cached Audio Phrases - Pre-generated common audio segments
export const cachedAudioPhrases = pgTable("cached_audio_phrases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  phrase: text("phrase").notNull(),
  phraseType: text("phrase_type").notNull(), // intro, outro, transition, greeting, thanks
  
  voice: text("voice").notNull(), // OpenAI voice name
  speed: real("speed").default(1.0),
  
  audioBase64: text("audio_base64").notNull(),
  durationMs: integer("duration_ms").notNull(),
  
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for enhanced streaming
export const insertStreamQuestionSchema = createInsertSchema(streamQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertStreamDebateSchema = createInsertSchema(streamDebates).omit({
  id: true,
  createdAt: true,
});

export const insertDebateVoteSchema = createInsertSchema(debateVotes).omit({
  id: true,
  createdAt: true,
});

export const insertStreamInvitationSchema = createInsertSchema(streamInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledStreamSchema = createInsertSchema(scheduledStreams).omit({
  id: true,
  createdAt: true,
});

export const insertStreamAlertSchema = createInsertSchema(streamAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertUserStreamSettingsSchema = createInsertSchema(userStreamSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCachedAudioPhraseSchema = createInsertSchema(cachedAudioPhrases).omit({
  id: true,
  createdAt: true,
});

// Types for enhanced streaming
export type InsertStreamQuestion = z.infer<typeof insertStreamQuestionSchema>;
export type StreamQuestion = typeof streamQuestions.$inferSelect;

export type InsertStreamDebate = z.infer<typeof insertStreamDebateSchema>;
export type StreamDebate = typeof streamDebates.$inferSelect;

export type InsertDebateVote = z.infer<typeof insertDebateVoteSchema>;
export type DebateVote = typeof debateVotes.$inferSelect;

export type InsertStreamInvitation = z.infer<typeof insertStreamInvitationSchema>;
export type StreamInvitation = typeof streamInvitations.$inferSelect;

export type InsertScheduledStream = z.infer<typeof insertScheduledStreamSchema>;
export type ScheduledStream = typeof scheduledStreams.$inferSelect;

export type InsertStreamAlert = z.infer<typeof insertStreamAlertSchema>;
export type StreamAlert = typeof streamAlerts.$inferSelect;

export type InsertUserStreamSettings = z.infer<typeof insertUserStreamSettingsSchema>;
export type UserStreamSettings = typeof userStreamSettings.$inferSelect;

export type InsertCachedAudioPhrase = z.infer<typeof insertCachedAudioPhraseSchema>;
export type CachedAudioPhrase = typeof cachedAudioPhrases.$inferSelect;

// =============================================================================
// ENHANCED GAMIFICATION SYSTEM - DAILY QUESTS, MISSIONS, XP, SEASON PASS
// =============================================================================

// Daily Quests - Rotating daily challenges
export const dailyQuests = pgTable("daily_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  // Quest type and requirements
  questType: text("quest_type").notNull(), // trade, predict, social, content, streak
  actionRequired: text("action_required").notNull(), // make_trade, create_prediction, comment, etc
  targetCount: integer("target_count").notNull().default(1),
  
  // Rewards
  xpReward: integer("xp_reward").notNull().default(100),
  streamReward: integer("stream_reward").default(0),
  bonusMultiplier: real("bonus_multiplier").default(1.0), // multiplier for streak bonuses
  
  // Quest settings
  difficulty: text("difficulty").default("easy"), // easy, medium, hard, legendary
  category: text("category").default("general"), // trading, prediction, social, exploration
  
  // Availability
  isActive: boolean("is_active").default(true),
  requiresLevel: integer("requires_level").default(1),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// User Daily Quest Progress
export const userDailyQuests = pgTable("user_daily_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  questId: varchar("quest_id").references(() => dailyQuests.id).notNull(),
  
  // Progress
  currentProgress: integer("current_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Rewards
  xpEarned: integer("xp_earned").default(0),
  streamEarned: integer("stream_earned").default(0),
  rewardClaimed: boolean("reward_claimed").default(false),
  
  // Date tracking
  questDate: timestamp("quest_date").notNull(), // The day this quest was assigned
  expiresAt: timestamp("expires_at").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly Missions - Bigger challenges with bigger rewards
export const weeklyMissions = pgTable("weekly_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  // Mission structure
  missionType: text("mission_type").notNull(), // multi_step, cumulative, challenge
  objectives: jsonb("objectives").notNull(), // [{ id, description, actionType, target, progress }]
  
  // Rewards
  xpReward: integer("xp_reward").notNull().default(500),
  streamReward: integer("stream_reward").default(0),
  badgeReward: text("badge_reward"), // Badge ID if completing unlocks a badge
  titleReward: text("title_reward"), // Special title like "Weekly Champion"
  
  // Settings
  difficulty: text("difficulty").default("medium"),
  category: text("category").default("general"),
  isActive: boolean("is_active").default(true),
  requiresLevel: integer("requires_level").default(1),
  
  // Week tracking
  weekNumber: integer("week_number"), // Week of year
  year: integer("year"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// User Weekly Mission Progress
export const userWeeklyMissions = pgTable("user_weekly_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  missionId: varchar("mission_id").references(() => weeklyMissions.id).notNull(),
  
  // Progress
  objectivesProgress: jsonb("objectives_progress"), // [{ objectiveId, current, target, completed }]
  overallProgress: integer("overall_progress").default(0), // percentage 0-100
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Rewards
  xpEarned: integer("xp_earned").default(0),
  streamEarned: integer("stream_earned").default(0),
  rewardClaimed: boolean("reward_claimed").default(false),
  
  // Week tracking
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User XP and Leveling System
export const userLevels = pgTable("user_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Current level and XP
  currentLevel: integer("current_level").default(1),
  currentXp: integer("current_xp").default(0),
  totalXpEarned: integer("total_xp_earned").default(0),
  
  // Level progress
  xpToNextLevel: integer("xp_to_next_level").default(1000),
  levelProgress: real("level_progress").default(0), // percentage 0-100
  
  // Prestige system (optional reset for rewards)
  prestigeLevel: integer("prestige_level").default(0),
  prestigeMultiplier: real("prestige_multiplier").default(1.0),
  
  // Stats
  levelUpsThisWeek: integer("level_ups_this_week").default(0),
  levelUpsThisMonth: integer("level_ups_this_month").default(0),
  lastLevelUp: timestamp("last_level_up"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// XP Transactions - Track all XP gains/losses
export const xpTransactions = pgTable("xp_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // XP details
  xpAmount: integer("xp_amount").notNull(), // positive = gain, negative = loss
  xpType: text("xp_type").notNull(), // quest, mission, trade, achievement, bonus, penalty
  source: text("source").notNull(), // daily_quest, weekly_mission, trade_win, etc
  sourceId: varchar("source_id"), // ID of the quest/mission/trade that gave XP
  
  // Context
  description: text("description"),
  multiplierApplied: real("multiplier_applied").default(1.0),
  
  // Level info at time of transaction
  levelAtTime: integer("level_at_time"),
  causedLevelUp: boolean("caused_level_up").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Season Pass System
export const seasonPasses = pgTable("season_passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Season 1: Genesis", "Season 2: DeFi Summer"
  description: text("description"),
  
  // Season timing
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Tier structure
  maxTier: integer("max_tier").default(100),
  xpPerTier: integer("xp_per_tier").default(1000),
  
  // Rewards by tier (stored as JSON for flexibility)
  freeRewards: jsonb("free_rewards").notNull(), // [{ tier, reward: { type, amount, item } }]
  premiumRewards: jsonb("premium_rewards").notNull(), // [{ tier, reward: { type, amount, item } }]
  
  // Premium pass cost
  premiumCost: integer("premium_cost").default(5000), // STREAM tokens
  
  // Stats
  totalParticipants: integer("total_participants").default(0),
  premiumPurchases: integer("premium_purchases").default(0),
  
  // Status
  status: text("status").default("upcoming"), // upcoming, active, ended
  
  createdAt: timestamp("created_at").defaultNow(),
});

// User Season Pass Progress
export const userSeasonPasses = pgTable("user_season_passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  seasonId: varchar("season_id").references(() => seasonPasses.id).notNull(),
  
  // Progress
  currentTier: integer("current_tier").default(1),
  currentXp: integer("current_xp").default(0),
  totalSeasonXp: integer("total_season_xp").default(0),
  
  // Premium status
  hasPremium: boolean("has_premium").default(false),
  premiumPurchasedAt: timestamp("premium_purchased_at"),
  
  // Claimed rewards
  freeRewardsClaimed: jsonb("free_rewards_claimed"), // [tier1, tier5, tier10, ...]
  premiumRewardsClaimed: jsonb("premium_rewards_claimed"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Streaks - Track various streak types
export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Streak type
  streakType: text("streak_type").notNull(), // login, trading, prediction, content
  
  // Current streak
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  
  // Tracking
  lastActivityDate: timestamp("last_activity_date"),
  streakStartDate: timestamp("streak_start_date"),
  
  // Milestones reached
  milestonesReached: jsonb("milestones_reached"), // [3, 7, 14, 30, ...]
  
  // Grace period (allows 1-day miss without breaking streak)
  graceUsedToday: boolean("grace_used_today").default(false),
  totalGracesUsed: integer("total_graces_used").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Special Events / Tournaments
export const gamificationEvents = pgTable("gamification_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  
  // Event type
  eventType: text("event_type").notNull(), // tournament, double_xp, special_quest, community_goal
  
  // Timing
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Event configuration
  config: jsonb("config"), // Event-specific settings
  objectives: jsonb("objectives"), // For community goals: [{ description, target, current }]
  
  // Rewards
  rewards: jsonb("rewards"), // [{ rank/tier, reward }]
  xpMultiplier: real("xp_multiplier").default(1.0),
  
  // Participation
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  
  // Status
  status: text("status").default("upcoming"), // upcoming, active, ended
  
  createdAt: timestamp("created_at").defaultNow(),
});

// User Event Participation
export const userEventParticipation = pgTable("user_event_participation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  eventId: varchar("event_id").references(() => gamificationEvents.id).notNull(),
  
  // Progress
  score: integer("score").default(0),
  progress: jsonb("progress"), // Event-specific progress tracking
  
  // Rankings
  currentRank: integer("current_rank"),
  finalRank: integer("final_rank"),
  
  // Rewards
  rewardsEarned: jsonb("rewards_earned"),
  rewardsClaimed: boolean("rewards_claimed").default(false),
  
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gamification Notifications
export const gamificationNotifications = pgTable("gamification_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Notification content
  notificationType: text("notification_type").notNull(), // level_up, quest_complete, achievement, reward
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  // Related entity
  relatedType: text("related_type"), // quest, mission, achievement, event
  relatedId: varchar("related_id"),
  
  // Rewards to claim (if any)
  pendingReward: jsonb("pending_reward"), // { xp, stream, badge, title }
  
  // Status
  isRead: boolean("is_read").default(false),
  isClaimed: boolean("is_claimed").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for gamification
export const insertDailyQuestSchema = createInsertSchema(dailyQuests).omit({
  id: true,
  createdAt: true,
});

export const insertUserDailyQuestSchema = createInsertSchema(userDailyQuests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyMissionSchema = createInsertSchema(weeklyMissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserWeeklyMissionSchema = createInsertSchema(userWeeklyMissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserLevelSchema = createInsertSchema(userLevels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertXpTransactionSchema = createInsertSchema(xpTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertSeasonPassSchema = createInsertSchema(seasonPasses).omit({
  id: true,
  createdAt: true,
});

export const insertUserSeasonPassSchema = createInsertSchema(userSeasonPasses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserStreakSchema = createInsertSchema(userStreaks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGamificationEventSchema = createInsertSchema(gamificationEvents).omit({
  id: true,
  createdAt: true,
});

export const insertUserEventParticipationSchema = createInsertSchema(userEventParticipation).omit({
  id: true,
  joinedAt: true,
  updatedAt: true,
});

export const insertGamificationNotificationSchema = createInsertSchema(gamificationNotifications).omit({
  id: true,
  createdAt: true,
});

// Types for gamification
export type InsertDailyQuest = z.infer<typeof insertDailyQuestSchema>;
export type DailyQuest = typeof dailyQuests.$inferSelect;

export type InsertUserDailyQuest = z.infer<typeof insertUserDailyQuestSchema>;
export type UserDailyQuest = typeof userDailyQuests.$inferSelect;

export type InsertWeeklyMission = z.infer<typeof insertWeeklyMissionSchema>;
export type WeeklyMission = typeof weeklyMissions.$inferSelect;

export type InsertUserWeeklyMission = z.infer<typeof insertUserWeeklyMissionSchema>;
export type UserWeeklyMission = typeof userWeeklyMissions.$inferSelect;

export type InsertUserLevel = z.infer<typeof insertUserLevelSchema>;
export type UserLevel = typeof userLevels.$inferSelect;

export type InsertXpTransaction = z.infer<typeof insertXpTransactionSchema>;
export type XpTransaction = typeof xpTransactions.$inferSelect;

export type InsertSeasonPass = z.infer<typeof insertSeasonPassSchema>;
export type SeasonPass = typeof seasonPasses.$inferSelect;

export type InsertUserSeasonPass = z.infer<typeof insertUserSeasonPassSchema>;
export type UserSeasonPass = typeof userSeasonPasses.$inferSelect;

export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;
export type UserStreak = typeof userStreaks.$inferSelect;

export type InsertGamificationEvent = z.infer<typeof insertGamificationEventSchema>;
export type GamificationEvent = typeof gamificationEvents.$inferSelect;

export type InsertUserEventParticipation = z.infer<typeof insertUserEventParticipationSchema>;
export type UserEventParticipation = typeof userEventParticipation.$inferSelect;

export type InsertGamificationNotification = z.infer<typeof insertGamificationNotificationSchema>;
export type GamificationNotification = typeof gamificationNotifications.$inferSelect;

// =============================================================================
// ENHANCED STREAMING FEATURES - POLLS, REACTIONS, COMMANDS, ACHIEVEMENTS
// =============================================================================

// Live Polls - Real-time voting during streams
export const streamPolls = pgTable("stream_polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // [{ id, text, votes: 0 }]
  
  // Poll settings
  allowMultipleVotes: boolean("allow_multiple_votes").default(false),
  showResultsLive: boolean("show_results_live").default(true),
  duration: integer("duration").default(60), // seconds, null = until manually closed
  
  // Status
  status: text("status").notNull().default("active"), // active, closed, cancelled
  
  // Results
  totalVotes: integer("total_votes").default(0),
  winningOptionId: text("winning_option_id"),
  
  startsAt: timestamp("starts_at").defaultNow(),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Poll Votes
export const streamPollVotes = pgTable("stream_poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").references(() => streamPolls.id).notNull(),
  voterId: varchar("voter_id").references(() => users.id).notNull(),
  optionId: text("option_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Floating Reactions - Animated reactions that float across screen
export const streamReactions = pgTable("stream_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  emoji: text("emoji").notNull(), // 🚀, 💎, 🔥, 📈, 💰, etc
  animationType: text("animation_type").default("float"), // float, burst, rain, pulse
  
  // Position for rendering
  startX: integer("start_x"), // percentage 0-100
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Schedule Reminders
export const streamScheduleReminders = pgTable("stream_schedule_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Notification preferences
  notifyBefore: integer("notify_before").default(15), // minutes before stream
  notifyViaEmail: boolean("notify_via_email").default(false),
  notifyViaPush: boolean("notify_via_push").default(true),
  
  notificationSent: boolean("notification_sent").default(false),
  sentAt: timestamp("sent_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Commands Definition
export const streamChatCommands = pgTable("stream_chat_commands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  command: text("command").notNull().unique(), // !price, !alpha, !market, !portfolio
  description: text("description").notNull(),
  
  // Command type determines how it's handled
  commandType: text("command_type").notNull(), // price_check, ai_query, market_info, user_stats
  
  // For AI commands, the prompt template
  promptTemplate: text("prompt_template"),
  
  // Rate limiting
  cooldownSeconds: integer("cooldown_seconds").default(5),
  
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Command Usage Logs
export const streamChatCommandLogs = pgTable("stream_chat_command_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commandId: varchar("command_id").references(() => streamChatCommands.id).notNull(),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  input: text("input"), // e.g., "BTC" for !price BTC
  response: text("response"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Achievements - Viewer achievements for engagement
export const streamAchievements = pgTable("stream_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji or icon name
  
  // Achievement criteria
  achievementType: text("achievement_type").notNull(), // watch_time, tips_given, messages_sent, streams_watched, early_bird, alpha_hunter
  targetValue: integer("target_value").notNull(), // e.g., 100 hours watched
  
  // Rewards
  xpReward: integer("xp_reward").default(0),
  streamReward: integer("stream_reward").default(0),
  badgeId: text("badge_id"), // Special badge unlock
  
  // Rarity
  rarity: text("rarity").default("common"), // common, uncommon, rare, epic, legendary
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Stream Achievements
export const userStreamAchievements = pgTable("user_stream_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: varchar("achievement_id").notNull(), // FK declared below with explicit (truncated) name
  
  // Progress tracking
  currentProgress: integer("current_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Rewards claimed
  rewardsClaimed: boolean("rewards_claimed").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Name matches the DB constraint (Postgres truncates identifiers to 63 chars)
  achievementFk: foreignKey({ columns: [table.achievementId], foreignColumns: [streamAchievements.id], name: "user_stream_achievements_achievement_id_stream_achievements_id_" }),
}));

// Viewer Watch Rewards - Earn STREAM for watching
export const viewerWatchRewards = pgTable("viewer_watch_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  
  // Watch time tracking
  watchTimeMinutes: integer("watch_time_minutes").default(0),
  lastHeartbeat: timestamp("last_heartbeat"),
  
  // Rewards earned this session
  streamPointsEarned: integer("stream_points_earned").default(0),
  xpEarned: integer("xp_earned").default(0),
  
  // Bonus multipliers
  consecutiveMinutesBonus: real("consecutive_minutes_bonus").default(1.0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Multi-Stream Sessions - Track users watching multiple streams
export const multiStreamSessions = pgTable("multi_stream_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Streams being watched (max 4)
  streamIds: text("stream_ids").array().notNull(),
  layout: text("layout").default("2x2"), // 1x1, 1x2, 2x1, 2x2, 1x3, 1x4
  
  // Active stream for audio
  primaryStreamId: varchar("primary_stream_id").references(() => liveStreams.id),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Co-Stream Sessions - Multiple avatars streaming together
export const coStreamSessions = pgTable("co_stream_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  title: text("title").notNull(),
  description: text("description"),
  
  // Primary host
  primaryStreamId: varchar("primary_stream_id").references(() => liveStreams.id).notNull(),
  primaryHostId: varchar("primary_host_id").references(() => users.id).notNull(),
  
  // Co-hosts (avatar IDs)
  coHostAvatarIds: text("co_host_avatar_ids").array(),
  
  // Session settings
  layout: text("layout").default("split"), // split, picture_in_picture, carousel
  
  status: text("status").notNull().default("active"), // active, ended
  
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Viewer Leaderboard - Track chat activity for rankings
export const streamViewerLeaderboard = pgTable("stream_viewer_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Activity metrics
  messagesCount: integer("messages_count").default(0),
  reactionsCount: integer("reactions_count").default(0),
  tipsAmount: integer("tips_amount").default(0),
  pollsVoted: integer("polls_voted").default(0),
  watchTimeMinutes: integer("watch_time_minutes").default(0),
  
  // Calculated score
  activityScore: integer("activity_score").default(0),
  rank: integer("rank"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for enhanced streaming features
export const insertStreamPollSchema = createInsertSchema(streamPolls).omit({
  id: true,
  createdAt: true,
});

export const insertStreamPollVoteSchema = createInsertSchema(streamPollVotes).omit({
  id: true,
  createdAt: true,
});

export const insertStreamReactionSchema = createInsertSchema(streamReactions).omit({
  id: true,
  createdAt: true,
});

export const insertStreamScheduleReminderSchema = createInsertSchema(streamScheduleReminders).omit({
  id: true,
  createdAt: true,
});

export const insertStreamChatCommandSchema = createInsertSchema(streamChatCommands).omit({
  id: true,
  createdAt: true,
});

export const insertStreamChatCommandLogSchema = createInsertSchema(streamChatCommandLogs).omit({
  id: true,
  createdAt: true,
});

export const insertStreamAchievementSchema = createInsertSchema(streamAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserStreamAchievementSchema = createInsertSchema(userStreamAchievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertViewerWatchRewardSchema = createInsertSchema(viewerWatchRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMultiStreamSessionSchema = createInsertSchema(multiStreamSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoStreamSessionSchema = createInsertSchema(coStreamSessions).omit({
  id: true,
  createdAt: true,
});

export const insertStreamViewerLeaderboardSchema = createInsertSchema(streamViewerLeaderboard).omit({
  id: true,
  updatedAt: true,
});

// Types for enhanced streaming
export type InsertStreamPoll = z.infer<typeof insertStreamPollSchema>;
export type StreamPoll = typeof streamPolls.$inferSelect;

export type InsertStreamPollVote = z.infer<typeof insertStreamPollVoteSchema>;
export type StreamPollVote = typeof streamPollVotes.$inferSelect;

export type InsertStreamReaction = z.infer<typeof insertStreamReactionSchema>;
export type StreamReaction = typeof streamReactions.$inferSelect;

export type InsertStreamScheduleReminder = z.infer<typeof insertStreamScheduleReminderSchema>;
export type StreamScheduleReminder = typeof streamScheduleReminders.$inferSelect;

export type InsertStreamChatCommand = z.infer<typeof insertStreamChatCommandSchema>;
export type StreamChatCommand = typeof streamChatCommands.$inferSelect;

export type InsertStreamChatCommandLog = z.infer<typeof insertStreamChatCommandLogSchema>;
export type StreamChatCommandLog = typeof streamChatCommandLogs.$inferSelect;

export type InsertStreamAchievement = z.infer<typeof insertStreamAchievementSchema>;
export type StreamAchievement = typeof streamAchievements.$inferSelect;

export type InsertUserStreamAchievement = z.infer<typeof insertUserStreamAchievementSchema>;
export type UserStreamAchievement = typeof userStreamAchievements.$inferSelect;

export type InsertViewerWatchReward = z.infer<typeof insertViewerWatchRewardSchema>;
export type ViewerWatchReward = typeof viewerWatchRewards.$inferSelect;

export type InsertMultiStreamSession = z.infer<typeof insertMultiStreamSessionSchema>;
export type MultiStreamSession = typeof multiStreamSessions.$inferSelect;

export type InsertCoStreamSession = z.infer<typeof insertCoStreamSessionSchema>;
export type CoStreamSession = typeof coStreamSessions.$inferSelect;

export type InsertStreamViewerLeaderboard = z.infer<typeof insertStreamViewerLeaderboardSchema>;
export type StreamViewerLeaderboard = typeof streamViewerLeaderboard.$inferSelect;

// ==========================================
// STREAM POINTS ECONOMY
// ==========================================

export const pointsTransactions = pgTable("points_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Transaction details
  amount: integer("amount").notNull(), // Positive for earn, negative for spend
  type: text("type").notNull(), // 'earn' | 'spend' | 'bonus' | 'refund' | 'adjustment'
  
  // Source of points (what activity triggered this)
  source: text("source").notNull(), // 'signup', 'daily_login', 'bounty_submit', 'bounty_accepted', 'prediction_win', 'stream_watch', 'voice_conversation', 'referral', 'profile_complete', 'tip_sent', 'tip_received', 'market_trade', 'league_entry', 'subscription', 'admin_adjustment'
  
  // Reference to related entity (optional)
  referenceId: varchar("reference_id"), // bountyId, marketId, streamId, etc.
  referenceType: text("reference_type"), // 'bounty', 'market', 'stream', 'user', etc.
  
  // Balance tracking
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  
  // Metadata
  description: text("description"), // Human-readable description
  metadata: jsonb("metadata"), // Additional context: { multiplier, streak, quality_score, etc. }
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily login tracking for streak bonuses
export const dailyLoginStreak = pgTable("daily_login_streak", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastLoginDate: timestamp("last_login_date"), // Date of last login (for streak calculation)
  
  // Total stats
  totalLogins: integer("total_logins").default(0),
  totalPointsFromLogins: integer("total_points_from_logins").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Points configuration (for easy tuning)
export const pointsConfig = pgTable("points_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // 'signup_bonus', 'daily_login_base', 'bounty_submit', etc.
  value: integer("value").notNull(), // Points amount
  description: text("description"),
  multiplierEnabled: boolean("multiplier_enabled").default(false),
  maxDaily: integer("max_daily"), // Optional daily cap
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==========================================
// SCHEDULED AVATAR DEBATES
// ==========================================

export const scheduledDebates = pgTable("scheduled_debates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Debate participants
  avatar1Id: varchar("avatar1_id").references(() => knowledgeAvatars.id).notNull(),
  avatar2Id: varchar("avatar2_id").references(() => knowledgeAvatars.id).notNull(),
  
  // Debate details
  topic: text("topic").notNull(),
  description: text("description"),
  category: text("category").default("crypto"), // crypto, defi, trading, macro, technology
  
  // Scheduling
  scheduledStartTime: timestamp("scheduled_start_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  endTime: timestamp("end_time"),
  
  // Debate configuration
  maxRounds: integer("max_rounds").default(6), // Total exchanges (3 per avatar)
  turnDurationSeconds: integer("turn_duration_seconds").default(45), // Time between turns
  enableVoice: boolean("enable_voice").default(true), // TTS enabled
  
  // Status
  status: text("status").notNull().default("scheduled"), // scheduled, live, completed, cancelled
  currentRound: integer("current_round").default(0),
  currentSpeaker: integer("current_speaker").default(1), // 1 or 2
  
  // Associated stream
  streamId: varchar("stream_id").references(() => liveStreams.id),
  
  // Results
  exchanges: jsonb("exchanges").default([]), // [{speakerId, speakerName, content, audioBase64?, timestamp}]
  viewerVotes: jsonb("viewer_votes").default({ avatar1: 0, avatar2: 0 }), // Who won votes
  totalViewers: integer("total_viewers").default(0),
  
  // Creator
  createdBy: varchar("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports
export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertDailyLoginStreakSchema = createInsertSchema(dailyLoginStreak).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPointsConfigSchema = createInsertSchema(pointsConfig).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;
export type PointsTransaction = typeof pointsTransactions.$inferSelect;

export type InsertDailyLoginStreak = z.infer<typeof insertDailyLoginStreakSchema>;
export type DailyLoginStreak = typeof dailyLoginStreak.$inferSelect;

export type InsertPointsConfig = z.infer<typeof insertPointsConfigSchema>;
export type PointsConfig = typeof pointsConfig.$inferSelect;

// Scheduled Debates schema and types
export const insertScheduledDebateSchema = createInsertSchema(scheduledDebates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScheduledDebate = z.infer<typeof insertScheduledDebateSchema>;
export type ScheduledDebate = typeof scheduledDebates.$inferSelect;

// ==========================================
// AI TRADING INTELLIGENCE
// ==========================================

export const tradingSignalHistory = pgTable("trading_signal_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  assetName: text("asset_name").notNull(),
  assetType: text("asset_type").notNull(),
  signalType: text("signal_type").notNull(),
  direction: text("direction").notNull(),
  confidence: integer("confidence").notNull(),
  entryLow: real("entry_low").notNull(),
  entryHigh: real("entry_high").notNull(),
  stopLoss: real("stop_loss").notNull(),
  target1: real("target_1"),
  target2: real("target_2"),
  target3: real("target_3"),
  priceAtSignal: real("price_at_signal").notNull(),
  confluenceScore: integer("confluence_score"),
  technicalScore: integer("technical_score"),
  onChainScore: integer("on_chain_score"),
  sentimentScore: integer("sentiment_score"),
  marketRegime: text("market_regime"),
  reasoning: text("reasoning"),
  timeframe: text("timeframe"),
  alertPriority: text("alert_priority"),
  outcome: text("outcome"),
  pnlPercent: real("pnl_percent"),
  hitTarget: integer("hit_target"),
  hitStopLoss: boolean("hit_stop_loss"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tradingWatchlist = pgTable("trading_watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  assetName: text("asset_name").notNull(),
  assetType: text("asset_type").notNull(),
  coingeckoId: text("coingecko_id"),
  notes: text("notes"),
  alertEnabled: boolean("alert_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiTradingAlerts = pgTable("ai_trading_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  alertType: text("alert_type").notNull(),
  condition: text("condition").notNull(),
  targetPrice: real("target_price"),
  percentChange: real("percent_change"),
  isActive: boolean("is_active").default(true),
  triggered: boolean("triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paperTrades = pgTable("paper_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  signalId: varchar("signal_id").references(() => tradingSignalHistory.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),
  entryPrice: real("entry_price").notNull(),
  quantity: real("quantity").notNull(),
  stopLoss: real("stop_loss"),
  takeProfit: real("take_profit"),
  currentPrice: real("current_price"),
  pnl: real("pnl"),
  pnlPercent: real("pnl_percent"),
  status: text("status").notNull().default("open"),
  closedPrice: real("closed_price"),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userTradingProfile = pgTable("user_trading_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  riskTolerance: text("risk_tolerance").default("moderate"),
  preferredTimeframe: text("preferred_timeframe").default("4H"),
  portfolioSize: real("portfolio_size"),
  maxPositionSize: real("max_position_size").default(5),
  defaultStopLossPercent: real("default_stop_loss_percent").default(3),
  paperBalance: real("paper_balance").default(100000),
  totalPaperTrades: integer("total_paper_trades").default(0),
  winningTrades: integer("winning_trades").default(0),
  losingTrades: integer("losing_trades").default(0),
  totalPnl: real("total_pnl").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTradingSignalHistorySchema = createInsertSchema(tradingSignalHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTradingWatchlistSchema = createInsertSchema(tradingWatchlist).omit({
  id: true,
  createdAt: true,
});

export const MAX_WATCHLIST_ITEMS = 5;

export const insertAiTradingAlertSchema = createInsertSchema(aiTradingAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertPaperTradeSchema = createInsertSchema(paperTrades).omit({
  id: true,
  createdAt: true,
});

export const insertUserTradingProfileSchema = createInsertSchema(userTradingProfile).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTradingSignalHistory = z.infer<typeof insertTradingSignalHistorySchema>;
export type TradingSignalHistory = typeof tradingSignalHistory.$inferSelect;

export type InsertTradingWatchlist = z.infer<typeof insertTradingWatchlistSchema>;
export type TradingWatchlist = typeof tradingWatchlist.$inferSelect;

export type InsertAiTradingAlert = z.infer<typeof insertAiTradingAlertSchema>;
export type AiTradingAlert = typeof aiTradingAlerts.$inferSelect;

export type InsertPaperTrade = z.infer<typeof insertPaperTradeSchema>;
export type PaperTrade = typeof paperTrades.$inferSelect;

export type InsertUserTradingProfile = z.infer<typeof insertUserTradingProfileSchema>;
export type UserTradingProfile = typeof userTradingProfile.$inferSelect;

// ==========================================
// GAMIFIED LEARNING MODULES
// ==========================================

// Learning modules (courses)
export const learningModules = pgTable("learning_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // web3_basics, defi, ai_trading, prediction_markets, advanced_crypto, macro_economics
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced, expert
  imageUrl: text("image_url"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  xpReward: integer("xp_reward").notNull().default(500),
  streamReward: integer("stream_reward").default(100),
  badgeReward: text("badge_reward"), // Badge key for completion
  prerequisiteModuleId: varchar("prerequisite_module_id"),
  lessonCount: integer("lesson_count").default(0),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual lessons within modules
export const learningLessons = pgTable("learning_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").references(() => learningModules.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown content
  lessonType: text("lesson_type").notNull().default("reading"), // reading, interactive, video, quiz
  videoUrl: text("video_url"),
  interactiveComponent: text("interactive_component"), // Component key for interactive lessons
  estimatedMinutes: integer("estimated_minutes").notNull().default(5),
  xpReward: integer("xp_reward").notNull().default(50),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz questions for lessons
export const learningQuizzes = pgTable("learning_quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => learningLessons.id).notNull(),
  question: text("question").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"), // multiple_choice, true_false, fill_blank
  options: jsonb("options").notNull(), // [{ id, text, isCorrect }]
  explanation: text("explanation"), // Shown after answering
  xpReward: integer("xp_reward").notNull().default(25),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress on modules
export const userLearningProgress = pgTable("user_learning_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  moduleId: varchar("module_id").references(() => learningModules.id).notNull(),
  currentLessonId: varchar("current_lesson_id").references(() => learningLessons.id),
  lessonsCompleted: integer("lessons_completed").default(0),
  quizzesCompleted: integer("quizzes_completed").default(0),
  quizzesPassed: integer("quizzes_passed").default(0),
  progressPercent: integer("progress_percent").default(0),
  xpEarned: integer("xp_earned").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// Track individual lesson completions
export const userLessonCompletions = pgTable("user_lesson_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  lessonId: varchar("lesson_id").references(() => learningLessons.id).notNull(),
  moduleId: varchar("module_id").references(() => learningModules.id).notNull(),
  xpEarned: integer("xp_earned").default(0),
  timeSpentSeconds: integer("time_spent_seconds").default(0),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Track quiz attempts
export const userQuizAttempts = pgTable("user_quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quizId: varchar("quiz_id").references(() => learningQuizzes.id).notNull(),
  lessonId: varchar("lesson_id").references(() => learningLessons.id).notNull(),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  xpEarned: integer("xp_earned").default(0),
  attemptNumber: integer("attempt_number").default(1),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

// Insert schemas
export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningLessonSchema = createInsertSchema(learningLessons).omit({
  id: true,
  createdAt: true,
});

export const insertLearningQuizSchema = createInsertSchema(learningQuizzes).omit({
  id: true,
  createdAt: true,
});

export const insertUserLearningProgressSchema = createInsertSchema(userLearningProgress).omit({
  id: true,
  startedAt: true,
  lastAccessedAt: true,
});

// Types
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type LearningModule = typeof learningModules.$inferSelect;

export type InsertLearningLesson = z.infer<typeof insertLearningLessonSchema>;
export type LearningLesson = typeof learningLessons.$inferSelect;

export type InsertLearningQuiz = z.infer<typeof insertLearningQuizSchema>;
export type LearningQuiz = typeof learningQuizzes.$inferSelect;

export type InsertUserLearningProgress = z.infer<typeof insertUserLearningProgressSchema>;
export type UserLearningProgress = typeof userLearningProgress.$inferSelect;

export type UserLessonCompletion = typeof userLessonCompletions.$inferSelect;
export type UserQuizAttempt = typeof userQuizAttempts.$inferSelect;

// ==========================================
// AI PORTFOLIO COMMAND CENTER
// ==========================================

// User portfolios - encrypted container for all assets
export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull().default("My Portfolio"),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  totalValue: real("total_value").default(0), // Cached total USD value
  totalCostBasis: real("total_cost_basis").default(0), // Total invested
  totalPnl: real("total_pnl").default(0), // Profit/Loss in USD
  totalPnlPercent: real("total_pnl_percent").default(0), // P&L percentage
  lastSyncedAt: timestamp("last_synced_at"),
  // AI Analysis
  healthScore: integer("health_score"), // 0-100 portfolio health
  riskLevel: text("risk_level"), // conservative, moderate, aggressive, extreme
  diversificationScore: integer("diversification_score"), // 0-100
  aiRecommendations: jsonb("ai_recommendations"), // [{ type, message, priority, action }]
  aiAnalysisAt: timestamp("ai_analysis_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual assets in a portfolio
export const portfolioAssets = pgTable("portfolio_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  // Asset identification
  assetType: text("asset_type").notNull(), // crypto, stock, etf, bond, retirement, cash, stablecoin, real_estate, commodity, other
  symbol: text("symbol").notNull(), // BTC, AAPL, SPY, USD, etc
  name: text("name").notNull(), // Bitcoin, Apple Inc, S&P 500 ETF
  // Holdings
  quantity: real("quantity").notNull().default(0),
  averageCostBasis: real("average_cost_basis").default(0), // Average price paid per unit
  totalCostBasis: real("total_cost_basis").default(0), // quantity * averageCostBasis
  // Current value
  currentPrice: real("current_price").default(0),
  currentValue: real("current_value").default(0), // quantity * currentPrice
  priceChange24h: real("price_change_24h").default(0), // 24h price change percentage
  priceChange7d: real("price_change_7d").default(0), // 7d price change percentage
  priceLastUpdated: timestamp("price_last_updated"),
  // P&L
  unrealizedPnl: real("unrealized_pnl").default(0), // currentValue - totalCostBasis
  unrealizedPnlPercent: real("unrealized_pnl_percent").default(0),
  realizedPnl: real("realized_pnl").default(0), // From sales
  // Allocation
  allocationPercent: real("allocation_percent").default(0), // % of total portfolio
  targetAllocation: real("target_allocation"), // Desired % allocation
  // Metadata
  accountName: text("account_name"), // "Coinbase", "Fidelity 401k", "Bank of America", etc
  accountType: text("account_type"), // wallet, brokerage, retirement, bank, manual
  walletAddress: text("wallet_address"), // For crypto - public address only
  notes: text("notes"),
  // Growth tracking (for retirement accounts, savings, etc.)
  annualGrowthRate: real("annual_growth_rate"), // Expected annual growth % (e.g., 7 for 7%)
  contributionAmount: real("contribution_amount"), // Regular contribution amount
  contributionFrequency: text("contribution_frequency"), // monthly, biweekly, weekly, yearly
  lastGrowthCalculation: timestamp("last_growth_calculation"), // When growth was last applied
  // Display
  logoUrl: text("logo_url"),
  color: text("color"), // For charts
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction history for assets
export const portfolioTransactions = pgTable("portfolio_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id).notNull(),
  assetId: varchar("asset_id").references(() => portfolioAssets.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  // Transaction details
  transactionType: text("transaction_type").notNull(), // buy, sell, transfer_in, transfer_out, dividend, interest, fee, airdrop, stake, unstake
  symbol: text("symbol").notNull(),
  quantity: real("quantity").notNull(),
  pricePerUnit: real("price_per_unit").notNull(),
  totalValue: real("total_value").notNull(), // quantity * pricePerUnit
  fees: real("fees").default(0),
  // Additional context
  exchangeOrBroker: text("exchange_or_broker"),
  txHash: text("tx_hash"), // Blockchain transaction hash if applicable
  notes: text("notes"),
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Portfolio Insights - stored analysis results
export const portfolioInsights = pgTable("portfolio_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  insightType: text("insight_type").notNull(), // rebalance, risk_alert, opportunity, tax_loss, correlation, macro_impact
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  title: text("title").notNull(),
  message: text("message").notNull(),
  details: jsonb("details"), // Structured data for the insight
  actionItems: jsonb("action_items"), // [{ action, description, impact }]
  relatedAssets: text("related_assets").array(), // Array of symbols
  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio snapshots for historical tracking
export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  totalValue: real("total_value").notNull(),
  totalCostBasis: real("total_cost_basis").notNull(),
  totalPnl: real("total_pnl").notNull(),
  assetBreakdown: jsonb("asset_breakdown").notNull(), // [{ symbol, value, allocation }]
  healthScore: integer("health_score"),
  snapshotDate: timestamp("snapshot_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for portfolio tables
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioAssetSchema = createInsertSchema(portfolioAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioTransactionSchema = createInsertSchema(portfolioTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioInsightSchema = createInsertSchema(portfolioInsights).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioSnapshotSchema = createInsertSchema(portfolioSnapshots).omit({
  id: true,
  createdAt: true,
});

// Price Alerts - user-configurable price notifications
export const priceAlerts = pgTable("price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // crypto, stock, etf
  alertType: text("alert_type").notNull(), // above, below, percent_change
  targetPrice: real("target_price"), // For above/below alerts
  percentChange: real("percent_change"), // For percent_change alerts
  currentPriceAtCreation: real("current_price_at_creation").notNull(),
  isTriggered: boolean("is_triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  triggeredPrice: real("triggered_price"),
  isActive: boolean("is_active").default(true),
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_price_alerts_user_id").on(table.userId),
}));

// Watchlist - track assets without owning them
export const watchlistItems = pgTable("watchlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // crypto, stock, etf
  addedPrice: real("added_price").notNull(), // Price when added to watchlist
  currentPrice: real("current_price").default(0),
  priceChange24h: real("price_change_24h").default(0),
  priceChangeSinceAdded: real("price_change_since_added").default(0),
  priceLastUpdated: timestamp("price_last_updated"),
  notes: text("notes"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_watchlist_items_user_id").on(table.userId),
}));

// Portfolio Goals - user financial goals
export const portfolioGoals = pgTable("portfolio_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id),
  name: text("name").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").default(0),
  deadline: timestamp("deadline"),
  goalType: text("goal_type").notNull(), // net_worth, savings, investment_return, asset_target
  targetSymbol: text("target_symbol"), // For asset_target goals (e.g., "own 1 BTC")
  targetQuantity: real("target_quantity"), // For asset_target goals
  monthlyContribution: real("monthly_contribution").default(0),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("active"), // active, completed, paused, cancelled
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_portfolio_goals_user_id").on(table.userId),
}));

// Asset Price History - for sparklines and performance charts
export const assetPriceHistory = pgTable("asset_price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(),
  price: real("price").notNull(),
  volume: real("volume"),
  marketCap: real("market_cap"),
  recordedAt: timestamp("recorded_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioGoalSchema = createInsertSchema(portfolioGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssetPriceHistorySchema = createInsertSchema(assetPriceHistory).omit({
  id: true,
  createdAt: true,
});

// Types for portfolio system
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

export type InsertPortfolioAsset = z.infer<typeof insertPortfolioAssetSchema>;
export type PortfolioAsset = typeof portfolioAssets.$inferSelect;

export type InsertPortfolioTransaction = z.infer<typeof insertPortfolioTransactionSchema>;
export type PortfolioTransaction = typeof portfolioTransactions.$inferSelect;

export type InsertPortfolioInsight = z.infer<typeof insertPortfolioInsightSchema>;
export type PortfolioInsight = typeof portfolioInsights.$inferSelect;

export type InsertPortfolioSnapshot = z.infer<typeof insertPortfolioSnapshotSchema>;
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;

export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;
export type PriceAlert = typeof priceAlerts.$inferSelect;

export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type WatchlistItem = typeof watchlistItems.$inferSelect;

export type InsertPortfolioGoal = z.infer<typeof insertPortfolioGoalSchema>;
export type PortfolioGoal = typeof portfolioGoals.$inferSelect;

export type InsertAssetPriceHistory = z.infer<typeof insertAssetPriceHistorySchema>;
export type AssetPriceHistory = typeof assetPriceHistory.$inferSelect;

// =============================================================================
// BOT TRADING SIMULATOR
// =============================================================================

export const botStakes = pgTable("bot_stakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  agentId: varchar("agent_id").references(() => aiAgents.id),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id),
  amount: integer("amount").notNull(),
  currentValue: integer("current_value").notNull(),
  totalPnl: integer("total_pnl").default(0),
  totalPnlPercent: real("total_pnl_percent").default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("idx_bot_stakes_status").on(table.status),
  userIdIdx: index("idx_bot_stakes_user_id").on(table.userId),
}));

export const botSimTrades = pgTable("bot_sim_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => aiAgents.id),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id),
  asset: text("asset").notNull(),
  assetType: text("asset_type").notNull(),
  direction: text("direction").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  quantity: real("quantity").notNull(),
  pnl: real("pnl").default(0),
  pnlPercent: real("pnl_percent").default(0),
  status: text("status").notNull().default("open"),
  reasoning: text("reasoning"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  statusIdx: index("idx_bot_sim_trades_status").on(table.status),
}));

export const botPerformanceSnapshots = pgTable("bot_performance_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => aiAgents.id),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id),
  totalValue: real("total_value").notNull(),
  dailyPnl: real("daily_pnl").default(0),
  dailyPnlPercent: real("daily_pnl_percent").default(0),
  cumulativeRoi: real("cumulative_roi").default(0),
  totalTrades: integer("total_trades").default(0),
  winRate: real("win_rate").default(0),
  snapshotDate: timestamp("snapshot_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBotStakeSchema = createInsertSchema(botStakes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertBotSimTradeSchema = createInsertSchema(botSimTrades).omit({
  id: true,
  createdAt: true,
});
export const insertBotPerformanceSnapshotSchema = createInsertSchema(botPerformanceSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertBotStake = z.infer<typeof insertBotStakeSchema>;
export type BotStake = typeof botStakes.$inferSelect;
export type InsertBotSimTrade = z.infer<typeof insertBotSimTradeSchema>;
export type BotSimTrade = typeof botSimTrades.$inferSelect;
export type InsertBotPerformanceSnapshot = z.infer<typeof insertBotPerformanceSnapshotSchema>;
export type BotPerformanceSnapshot = typeof botPerformanceSnapshots.$inferSelect;

// ============ Job Scheduler (Phase 1) ============
export const jobRuns = pgTable("job_runs", {
  name: text("name").primaryKey(),
  lastStartedAt: timestamp("last_started_at"),
  lastFinishedAt: timestamp("last_finished_at"),
  lastStatus: text("last_status"),
  lastError: text("last_error"),
  runCount: integer("run_count").default(0).notNull(),
  consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
});

export const insertJobRunSchema = createInsertSchema(jobRuns);
export type InsertJobRun = z.infer<typeof insertJobRunSchema>;
export type JobRun = typeof jobRuns.$inferSelect;

// ---------------------------------------------------------------------------
// Phase 1 production visibility — durable server error recorder.
//
// Every unexpected server error (Express error handler, uncaughtException,
// unhandledRejection, background jobs) is deduplicated by
// (stackHash + hourBucket) and increment-counted here. This gives an admin a
// grouped, low-cardinality view of what is actually failing in production
// without unbounded row growth.
//
// NOTE: declared here for `db push` at deploy time ONLY. The recorder writes
// DML only (INSERT ... ON CONFLICT DO UPDATE) at runtime — it NEVER emits
// CREATE/ALTER. A nightly prune deletes rows older than 14 days (DML).
// ---------------------------------------------------------------------------
export const serverErrors = pgTable(
  "server_errors",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    // Where the error came from: an Express route path, a job name, or a
    // process tag ("uncaughtException" | "unhandledRejection").
    tag: text("tag").notNull(),
    // "route" | "job" | "process"
    source: text("source").notNull().default("route"),
    message: text("message").notNull(),
    // SHA-256 of the normalized stack (dedup key within an hour bucket).
    stackHash: text("stack_hash").notNull(),
    stack: text("stack"),
    // UTC hour bucket, e.g. "2025-01-01T13" — deduplication window.
    hourBucket: text("hour_bucket").notNull(),
    count: integer("count").default(1).notNull(),
    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("server_errors_hash_hour_idx").on(t.stackHash, t.hourBucket),
    index("server_errors_last_seen_idx").on(t.lastSeenAt),
  ],
);

export type ServerError = typeof serverErrors.$inferSelect;

// Daily AI spend ledger (UTC days) — persists the budget meter across restarts.
export const apiSpendDaily = pgTable(
  "api_spend_daily",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    day: text("day").notNull(), // YYYY-MM-DD (UTC)
    service: text("service").notNull(), // anthropic | openai
    model: text("model").notNull(),
    costUsd: doublePrecision("cost_usd").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("api_spend_daily_day_service_model_idx").on(t.day, t.service, t.model)],
);

export type ApiSpendDaily = typeof apiSpendDaily.$inferSelect;

// Per-wallet daily swap quote volume (UTC days) — persists the riskEngine's
// swap soft-cap meter across restarts (mirrors api_spend_daily).
export const swapDailyVolume = pgTable(
  "swap_daily_volume",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    wallet: text("wallet").notNull(), // lowercase 0x address
    day: text("day").notNull(), // YYYY-MM-DD (UTC)
    volumeUsd: doublePrecision("volume_usd").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("swap_daily_volume_wallet_day_idx").on(t.wallet, t.day)],
);

export type SwapDailyVolume = typeof swapDailyVolume.$inferSelect;

// ---------------------------------------------------------------------------
// Non-custodial swap rail (Base). Dormant unless SWAPS_ENABLED=true.
// ---------------------------------------------------------------------------

// Server-side allowlist of tradeable tokens on Base. Quotes refuse anything
// off this list.
export const tradeableTokens = pgTable("tradeable_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  // "ETH" sentinel address 0xeeee..eeee for the native asset
  address: text("address").notNull().unique(),
  decimals: integer("decimals").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTradeableTokenSchema = createInsertSchema(tradeableTokens).omit({
  id: true,
  createdAt: true,
});
export type InsertTradeableToken = z.infer<typeof insertTradeableTokenSchema>;
export type TradeableToken = typeof tradeableTokens.$inferSelect;

// Record of every confirmed user swap (user's wallet signed & submitted).
export const userTrades = pgTable("user_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  sellToken: text("sell_token").notNull(),
  buyToken: text("buy_token").notNull(),
  sellAmount: text("sell_amount").notNull(), // base units, stringified bigint
  buyAmount: text("buy_amount").notNull(),
  txHash: text("tx_hash").notNull().unique(),
  feeCollected: text("fee_collected"),
  quotedPrice: text("quoted_price"),
  executedPrice: text("executed_price"),
  // Optional link back to the agent signal that motivated this user-signed trade
  signalId: varchar("signal_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserTradeSchema = createInsertSchema(userTrades).omit({
  id: true,
  createdAt: true,
});
export type InsertUserTrade = z.infer<typeof insertUserTradeSchema>;
export type UserTrade = typeof userTrades.$inferSelect;

// ============================================
// AGENT SIGNALS (dormant behind SIGNALS_ENABLED)
// Agents publish structured trade THESES on real assets. Never advice,
// never auto-executed — users trade only via the swap rail, wallet-signed.
// ============================================

export const agentSignals = pgTable("agent_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(), // knowledge_avatars.id
  token: text("token").notNull(), // allowlisted tradeable_tokens symbol
  direction: text("direction").notNull(), // accumulate | reduce | neutral
  thesis: text("thesis").notNull(), // <=80 words, observational framing
  confidence: real("confidence").notNull(), // 0-1
  keyEvidence: jsonb("key_evidence").notNull(), // string[]
  invalidation: text("invalidation").notNull(), // "this thesis is wrong if..."
  timeHorizon: text("time_horizon").notNull(), // 24h | 3d | 7d
  entryPrice: real("entry_price").notNull(), // real market price at publication
  status: text("status").notNull().default("open"), // open | resolved
  resolvePrice: real("resolve_price"),
  hypotheticalReturnPct: real("hypothetical_return_pct"),
  correct: boolean("correct"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentSignalSchema = createInsertSchema(agentSignals).omit({
  id: true,
  createdAt: true,
});
export type InsertAgentSignal = z.infer<typeof insertAgentSignalSchema>;
export type AgentSignal = typeof agentSignals.$inferSelect;
