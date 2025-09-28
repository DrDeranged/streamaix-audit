import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, real } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bounties = pgTable("bounties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contentUrl: text("content_url").notNull(),
  reward: integer("reward").notNull(), // in $STREAM tokens
  tipPool: integer("tip_pool").default(0), // additional tips in cents
  deadline: timestamp("deadline"),
  tags: text("tags").array(),
  creatorId: varchar("creator_id").references(() => users.id),
  assigneeId: varchar("assignee_id").references(() => users.id),
  summaryId: varchar("summary_id").references(() => summaries.id),
  status: text("status").notNull().default("open"), // open, claimed, in_progress, completed, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
});

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

export const cryptoLeaders = pgTable("crypto_leaders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fid: integer("fid").notNull().unique(), // Farcaster ID
  username: text("username").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  pfpUrl: text("pfp_url"),
  followerCount: integer("follower_count"),
  followingCount: integer("following_count"),
  powerBadge: boolean("power_badge").default(false),
  verifiedAddresses: jsonb("verified_addresses"), // ENS, onchain addresses
  ecosystem: text("ecosystem").array(), // ["ethereum", "base", "farcaster"]
  role: text("role"), // "Ethereum Founder", "Farcaster Co-founder", etc
  keyTakeaways: text("key_takeaways").array(), // Curated learning points
  expertise: text("expertise").array(), // ["L2 scaling", "social protocols"]
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const curatedCasts = pgTable("curated_casts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaderId: varchar("leader_id").references(() => cryptoLeaders.id).notNull(),
  castHash: text("cast_hash").notNull().unique(),
  castText: text("cast_text").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  likesCount: integer("likes_count").default(0),
  recastsCount: integer("recasts_count").default(0),
  repliesCount: integer("replies_count").default(0),
  whyItMatters: text("why_it_matters").notNull(), // Educational context
  concepts: text("concepts").array(), // Related learning concepts
  priority: integer("priority").default(1), // 1=highest, 5=lowest
  createdAt: timestamp("created_at").defaultNow(),
});

export const topicTags = pgTable("topic_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  definition: text("definition").notNull(),
  category: text("category").notNull(), // "technology", "market", "governance"
  relatedLeaderIds: text("related_leader_ids").array(), // Leaders who discuss this
  resourceLinks: jsonb("resource_links"), // Links to learn more
  difficulty: text("difficulty").default("beginner"), // beginner, intermediate, advanced
  createdAt: timestamp("created_at").defaultNow(),
});

export const learningResources = pgTable("learning_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leaderId: varchar("leader_id").references(() => cryptoLeaders.id).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull(), // "article", "talk", "thread", "website"
  difficulty: text("difficulty").default("beginner"),
  priority: integer("priority").default(3), // 1=must read, 5=optional
  topics: text("topics").array(), // Related topic tags
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Knowledge Avatars System
export const knowledgeAvatars = pgTable("knowledge_avatars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(), // @naval.eth, @vitalik.lens
  avatar: text("avatar").notNull(),
  banner: text("banner"), // Header banner image
  gradient: text("gradient").notNull(), // CSS gradient class
  bio: text("bio"),
  role: text("role"), // "Ethereum Founder", "Angel Investor", etc.
  
  // Core Interests & Expertise
  primaryFocus: text("primary_focus").array(), // ["Web3", "Investing", "Philosophy"]
  expertise: text("expertise").array(), // ["Blockchain", "Startups", "Philosophy"]
  interests: jsonb("interests"), // { topics: [], industries: [], technologies: [] }
  
  // Investment Philosophy & Portfolio
  investmentPhilosophy: text("investment_philosophy"),
  portfolioFocus: text("portfolio_focus").array(), // ["Early Stage", "Crypto", "AI"]
  publicInvestments: jsonb("public_investments"), // Array of investment objects
  investmentReturns: jsonb("investment_returns"), // Performance data
  
  // Mindset & Worldview
  coreBeliefs: text("core_beliefs").array(), // Key philosophical beliefs
  mentalModels: text("mental_models").array(), // Thinking frameworks
  decisionFramework: text("decision_framework"), // How they make decisions
  personalPrinciples: text("personal_principles").array(), // Life principles
  
  // Current Opinions & Takes
  currentOpinions: jsonb("current_opinions"), // Latest thoughts on topics
  controversialTakes: text("controversial_takes").array(), // Bold opinions
  predictions: jsonb("predictions"), // Future predictions with dates
  
  // Content & Activity
  recentContent: jsonb("recent_content"), // Latest tweets, posts, articles
  keyContent: jsonb("key_content"), // Essential content from this person
  bookRecommendations: jsonb("book_recommendations"), // Book recs with reasons
  
  // Social & Network
  followingCount: integer("following_count").default(0),
  followerCount: integer("follower_count").default(0),
  totalContent: integer("total_content").default(0),
  engagementRate: real("engagement_rate").default(0),
  
  // Verification & Credibility
  isVerified: boolean("is_verified").default(false),
  credibilityScore: integer("credibility_score").default(50), // 0-100
  expertise_level: text("expertise_level").default("expert"), // novice, intermediate, expert, guru
  
  // Platform presence
  twitterHandle: text("twitter_handle"),
  linkedinProfile: text("linkedin_profile"),
  personalWebsite: text("personal_website"),
  
  // Metadata
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Avatar Following System
export const avatarFollows = pgTable("avatar_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id).notNull(),
  followedAt: timestamp("followed_at").defaultNow(),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  // Ensure unique user-avatar pairs
}, (table) => ({
  uniqueUserAvatar: {
    name: "unique_user_avatar",
    columns: [table.userId, table.avatarId],
  },
}));

// Avatar Content Interactions
export const avatarContentInteractions = pgTable("avatar_content_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id).notNull(),
  contentId: text("content_id").notNull(), // ID of specific content piece
  interactionType: text("interaction_type").notNull(), // like, bookmark, share, comment
  metadata: jsonb("metadata"), // Additional interaction data
  createdAt: timestamp("created_at").defaultNow(),
});

// Avatar Insights & Analytics
export const avatarInsights = pgTable("avatar_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  avatarId: varchar("avatar_id").references(() => knowledgeAvatars.id).notNull(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  summaries: many(summaries),
  bounties: many(bounties),
  knowledgeStacks: many(knowledgeStacks),
  interactions: many(userInteractions),
  notes: many(userNotes),
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

export const cryptoLeadersRelations = relations(cryptoLeaders, ({ many }) => ({
  curatedCasts: many(curatedCasts),
  resources: many(learningResources),
}));

export const curatedCastsRelations = relations(curatedCasts, ({ one }) => ({
  leader: one(cryptoLeaders, {
    fields: [curatedCasts.leaderId],
    references: [cryptoLeaders.id],
  }),
}));

export const learningResourcesRelations = relations(learningResources, ({ one }) => ({
  leader: one(cryptoLeaders, {
    fields: [learningResources.leaderId],
    references: [cryptoLeaders.id],
  }),
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
  deadline: true,
  tags: true,
  creatorId: true,
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

export const insertCryptoLeaderSchema = createInsertSchema(cryptoLeaders).pick({
  fid: true,
  username: true,
  displayName: true,
  bio: true,
  pfpUrl: true,
  followerCount: true,
  followingCount: true,
  powerBadge: true,
  verifiedAddresses: true,
  ecosystem: true,
  role: true,
  keyTakeaways: true,
  expertise: true,
  isActive: true,
});

export const insertCuratedCastSchema = createInsertSchema(curatedCasts).pick({
  leaderId: true,
  castHash: true,
  castText: true,
  publishedAt: true,
  likesCount: true,
  recastsCount: true,
  repliesCount: true,
  whyItMatters: true,
  concepts: true,
  priority: true,
});

export const insertTopicTagSchema = createInsertSchema(topicTags).pick({
  name: true,
  definition: true,
  category: true,
  relatedLeaderIds: true,
  resourceLinks: true,
  difficulty: true,
});

export const insertLearningResourceSchema = createInsertSchema(learningResources).pick({
  leaderId: true,
  title: true,
  url: true,
  description: true,
  resourceType: true,
  difficulty: true,
  priority: true,
  topics: true,
});

export const insertKnowledgeAvatarSchema = createInsertSchema(knowledgeAvatars).pick({
  name: true,
  handle: true,
  avatar: true,
  banner: true,
  gradient: true,
  bio: true,
  role: true,
  primaryFocus: true,
  expertise: true,
  interests: true,
  investmentPhilosophy: true,
  portfolioFocus: true,
  publicInvestments: true,
  investmentReturns: true,
  coreBeliefs: true,
  mentalModels: true,
  decisionFramework: true,
  personalPrinciples: true,
  currentOpinions: true,
  controversialTakes: true,
  predictions: true,
  recentContent: true,
  keyContent: true,
  bookRecommendations: true,
  followingCount: true,
  followerCount: true,
  totalContent: true,
  engagementRate: true,
  isVerified: true,
  credibilityScore: true,
  expertise_level: true,
  twitterHandle: true,
  linkedinProfile: true,
  personalWebsite: true,
  isActive: true,
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

// Pattern Recognition Insert Schemas moved after table definitions

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summaries.$inferSelect;

export type InsertBounty = z.infer<typeof insertBountySchema>;
export type Bounty = typeof bounties.$inferSelect;

export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type InsertKnowledgeStack = z.infer<typeof insertKnowledgeStackSchema>;
export type KnowledgeStack = typeof knowledgeStacks.$inferSelect;

export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type UserNote = typeof userNotes.$inferSelect;

export type InsertCryptoLeader = z.infer<typeof insertCryptoLeaderSchema>;
export type CryptoLeader = typeof cryptoLeaders.$inferSelect;

export type InsertCuratedCast = z.infer<typeof insertCuratedCastSchema>;
export type CuratedCast = typeof curatedCasts.$inferSelect;

export type InsertTopicTag = z.infer<typeof insertTopicTagSchema>;
export type TopicTag = typeof topicTags.$inferSelect;

export type InsertLearningResource = z.infer<typeof insertLearningResourceSchema>;
export type LearningResource = typeof learningResources.$inferSelect;

export type InsertKnowledgeAvatar = z.infer<typeof insertKnowledgeAvatarSchema>;
export type KnowledgeAvatar = typeof knowledgeAvatars.$inferSelect;

export type InsertAvatarFollow = z.infer<typeof insertAvatarFollowSchema>;
export type AvatarFollow = typeof avatarFollows.$inferSelect;

export type InsertAvatarContentInteraction = z.infer<typeof insertAvatarContentInteractionSchema>;
export type AvatarContentInteraction = typeof avatarContentInteractions.$inferSelect;

export type InsertAvatarInsight = z.infer<typeof insertAvatarInsightSchema>;
export type AvatarInsight = typeof avatarInsights.$inferSelect;

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
  profile: CryptoLeader;
  notableCasts: CuratedCast[];
  resources: LearningResource[];
  topics: TopicTag[];
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
export const chartConfigurations = pgTable("chart_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(), // User-defined name for the chart layout
  symbols: text("symbols").array().notNull(), // Primary and comparison symbols
  assetTypes: jsonb("asset_types").notNull(), // { "BTC": "crypto", "AAPL": "stock" }
  timeframe: text("timeframe").notNull().default("1d"), // 1m, 5m, 15m, 1h, 4h, 1d, 1w
  indicators: text("indicators").array().default(sql`'{}'::text[]`), // Active indicators
  overlays: text("overlays").array().default(sql`'{}'::text[]`), // Chart overlays
  layout: jsonb("layout"), // Chart layout preferences (panels, sizes, positions)
  isDefault: boolean("is_default").default(false), // User's default chart
  isPublic: boolean("is_public").default(false), // Share with other users
  tags: text("tags").array(), // User tags for organization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chartWatchlists = pgTable("chart_watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(), // Watchlist name (e.g., "DeFi Tokens", "Tech Stocks")
  symbols: text("symbols").array().notNull(), // Array of symbols
  assetTypes: jsonb("asset_types").notNull(), // Asset type mapping for each symbol
  color: text("color"), // UI color theme for the watchlist
  isDefault: boolean("is_default").default(false),
  sortOrder: integer("sort_order").default(0), // User-defined ordering
  alertsEnabled: boolean("alerts_enabled").default(false), // Price alerts for watchlist
  alertConditions: jsonb("alert_conditions"), // Alert configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chartDataCache = pgTable("chart_data_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cacheKey: text("cache_key").notNull().unique(), // Composite key: symbol_timeframe_indicators
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(), // crypto, stock, bond, commodity, currency
  timeframe: text("timeframe").notNull(),
  indicators: text("indicators").array(),
  chartData: jsonb("chart_data").notNull(), // Cached ChartDataPoint[] and indicators
  dataPoints: integer("data_points").notNull(), // Number of data points
  lastPrice: real("last_price"), // Latest price for quick reference
  priceChange24h: real("price_change_24h"), // 24h price change percentage
  volume24h: real("volume_24h"), // 24h volume
  marketCap: real("market_cap"), // Market cap (if available)
  correlation: jsonb("correlation"), // Correlation data with other assets
  expiresAt: timestamp("expires_at").notNull(), // Cache expiration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chartUserPreferences = pgTable("chart_user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  defaultTimeframe: text("default_timeframe").default("1d"),
  defaultIndicators: text("default_indicators").array().default(sql`'{rsi,macd,movingAverages}'::text[]`),
  theme: text("theme").default("dark"), // dark, light, auto
  candlestickStyle: text("candlestick_style").default("candles"), // candles, bars, line
  volumeVisible: boolean("volume_visible").default(true),
  gridVisible: boolean("grid_visible").default(true),
  crosshairEnabled: boolean("crosshair_enabled").default(true),
  autoSync: boolean("auto_sync").default(true), // Auto-sync timeframes across charts
  realTimeUpdates: boolean("real_time_updates").default(true),
  alertsEnabled: boolean("alerts_enabled").default(true),
  layout: jsonb("layout"), // Panel layout preferences
  favoriteSymbols: text("favorite_symbols").array().default(sql`'{}'::text[]`), // Quick access symbols
  recentSymbols: text("recent_symbols").array().default(sql`'{}'::text[]`), // Recently viewed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chart Relations
export const chartConfigurationsRelations = relations(chartConfigurations, ({ one }) => ({
  user: one(users, {
    fields: [chartConfigurations.userId],
    references: [users.id],
  }),
}));

export const chartWatchlistsRelations = relations(chartWatchlists, ({ one }) => ({
  user: one(users, {
    fields: [chartWatchlists.userId],
    references: [users.id],
  }),
}));

export const chartUserPreferencesRelations = relations(chartUserPreferences, ({ one }) => ({
  user: one(users, {
    fields: [chartUserPreferences.userId],
    references: [users.id],
  }),
}));

// Chart Insert Schemas
export const insertChartConfigurationSchema = createInsertSchema(chartConfigurations).pick({
  userId: true,
  name: true,
  symbols: true,
  assetTypes: true,
  timeframe: true,
  indicators: true,
  overlays: true,
  layout: true,
  isDefault: true,
  isPublic: true,
  tags: true,
});

export const insertChartWatchlistSchema = createInsertSchema(chartWatchlists).pick({
  userId: true,
  name: true,
  symbols: true,
  assetTypes: true,
  color: true,
  isDefault: true,
  sortOrder: true,
  alertsEnabled: true,
  alertConditions: true,
});

export const insertChartUserPreferencesSchema = createInsertSchema(chartUserPreferences).pick({
  userId: true,
  defaultTimeframe: true,
  defaultIndicators: true,
  theme: true,
  candlestickStyle: true,
  volumeVisible: true,
  gridVisible: true,
  crosshairEnabled: true,
  autoSync: true,
  realTimeUpdates: true,
  alertsEnabled: true,
  layout: true,
  favoriteSymbols: true,
  recentSymbols: true,
});

// Chart Types
export type InsertChartConfiguration = z.infer<typeof insertChartConfigurationSchema>;
export type ChartConfiguration = typeof chartConfigurations.$inferSelect;

export type InsertChartWatchlist = z.infer<typeof insertChartWatchlistSchema>;
export type ChartWatchlist = typeof chartWatchlists.$inferSelect;

export type InsertChartUserPreferences = z.infer<typeof insertChartUserPreferencesSchema>;
export type ChartUserPreferences = typeof chartUserPreferences.$inferSelect;

export type ChartDataCache = typeof chartDataCache.$inferSelect;

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

export type StressTestScenario = {
  name: string;
  description: string;
  scenarioType: 'market_crash' | 'crypto_winter' | 'correlation_breakdown' | 'liquidity_crisis' | 'inflation_spike' | 'black_swan';
  severity: 'mild' | 'moderate' | 'severe' | 'extreme';
  
  // Asset-specific stress factors (multipliers applied to returns)
  stressFactors: {
    crypto: number; // e.g., -0.50 for 50% decline
    stocks: number;
    commodities: number;
    correlationMultiplier: number; // how correlations change during stress
  };
  
  // Expected timeline and recovery
  durationDays: number;
  recoveryMonths: number;
  historicalPrecedent?: string;
};

export type StressTestResult = {
  scenario: StressTestScenario;
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
  patterns: ChartPattern[];
  trendAnalysis: TrendAnalysis[];
  marketCycles: MarketCycle[];
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
  recentAlerts: PatternAlert[];
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
  recentPatterns: ChartPattern[];
  topAlerts: PatternAlert[];
  trendAnalysis: TrendAnalysisResult[];
  marketCycles: MarketCycleAnalysis[];
  tradingSetups: AiTradingSetup[];
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
export const chartPatterns = pgTable("chart_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(), // BTC, ETH, AAPL, etc.
  assetType: text("asset_type").notNull(), // crypto, stock, commodity
  
  // Pattern Classification
  patternType: text("pattern_type").notNull(), // triangle, head_shoulders, channel, flag, pennant, etc.
  patternSubtype: text("pattern_subtype"), // ascending_triangle, descending_triangle, symmetrical_triangle
  patternCategory: text("pattern_category").notNull(), // continuation, reversal, bilateral
  
  // Pattern Geometry and Detection
  detectionAlgorithm: text("detection_algorithm").notNull(), // ml_cnn, geometric_rules, hybrid
  confidence: real("confidence").notNull(), // 0-1 ML confidence score
  patternQuality: text("pattern_quality").notNull(), // excellent, good, fair, poor
  
  // Price Data and Levels
  startPrice: real("start_price").notNull(),
  endPrice: real("end_price").notNull(),
  highPrice: real("high_price").notNull(),
  lowPrice: real("low_price").notNull(),
  currentPrice: real("current_price").notNull(),
  
  // Support and Resistance Levels
  supportLevels: jsonb("support_levels").notNull(), // Array of {price: number, strength: number}
  resistanceLevels: jsonb("resistance_levels").notNull(),
  keyLevels: jsonb("key_levels"), // Additional significant levels
  
  // Time Analysis
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"), // Null if pattern is still forming
  timeframe: text("timeframe").notNull(), // 5m, 15m, 1h, 4h, 1d, 1w
  duration: integer("duration"), // Pattern duration in minutes
  
  // Pattern Dimensions
  height: real("height").notNull(), // Price range of pattern (high - low)
  width: integer("width").notNull(), // Time span of pattern in bars
  volume: real("volume"), // Average volume during pattern formation
  volumeProfile: jsonb("volume_profile"), // Volume analysis data
  
  // Prediction and Targets
  targetDirection: text("target_direction").notNull(), // bullish, bearish, neutral
  targetPrice: real("target_price"), // Projected target price
  stopLoss: real("stop_loss"), // Suggested stop loss level
  riskRewardRatio: real("risk_reward_ratio"),
  probabilitySuccess: real("probability_success"), // Historical success rate for this pattern type
  
  // Completion Status
  isComplete: boolean("is_complete").default(false),
  isConfirmed: boolean("is_confirmed").default(false), // Breakout confirmed
  breakoutDirection: text("breakout_direction"), // up, down, failed
  breakoutPrice: real("breakout_price"),
  breakoutTime: timestamp("breakout_time"),
  
  // Market Context
  marketRegime: text("market_regime"), // bull, bear, sideways, volatile
  trendAlignment: boolean("trend_alignment"), // Pattern aligned with broader trend
  volumeConfirmation: boolean("volume_confirmation"), // Volume supports pattern
  
  // Technical Indicators Context
  indicatorSignals: jsonb("indicator_signals"), // RSI, MACD, etc. at pattern formation
  movingAveragePosition: text("ma_position"), // above_all, below_all, mixed
  volatilityEnvironment: text("volatility_environment"), // low, normal, high, extreme
  
  // Performance Tracking
  actualOutcome: text("actual_outcome"), // success, failure, partial
  actualTargetReached: boolean("actual_target_reached"),
  maxFavorableExcursion: real("max_favorable_excursion"),
  maxAdverseExcursion: real("max_adverse_excursion"),
  finalPnL: real("final_pnl"), // If position was taken
  
  // Alert and Notification
  alertGenerated: boolean("alert_generated").default(false),
  alertSent: boolean("alert_sent").default(false),
  alertTime: timestamp("alert_time"),
  userInteractions: jsonb("user_interactions"), // User acknowledgments, notes, etc.
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastValidated: timestamp("last_validated").defaultNow(),
  tags: text("tags").array(),
});

export const trendAnalysis = pgTable("trend_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(),
  
  // Trend Classification
  primaryTrend: text("primary_trend").notNull(), // bullish, bearish, sideways
  secondaryTrend: text("secondary_trend"), // For multi-timeframe analysis
  trendStrength: real("trend_strength").notNull(), // 0-1 strength score
  trendQuality: text("trend_quality").notNull(), // strong, moderate, weak
  
  // Trend Metrics
  trendDuration: integer("trend_duration").notNull(), // Days in current trend
  trendAngle: real("trend_angle"), // Angle of trend line in degrees
  slopeCoefficient: real("slope_coefficient"), // Linear regression slope
  rSquared: real("r_squared"), // R² of trend line fit (0-1)
  
  // Price Momentum Analysis
  momentum: real("momentum").notNull(), // Current momentum score (-1 to 1)
  acceleration: real("acceleration"), // Rate of change in momentum
  momentumDivergence: boolean("momentum_divergence"), // Momentum vs price divergence
  
  // Technical Trend Indicators
  adx: real("adx"), // Average Directional Index (trend strength)
  adxTrend: text("adx_trend"), // strengthening, weakening, neutral
  pdi: real("pdi"), // Positive Directional Indicator
  ndi: real("ndi"), // Negative Directional Indicator
  
  // Moving Average Analysis
  maConfiguration: jsonb("ma_configuration").notNull(), // MA periods and types used
  maAlignment: text("ma_alignment").notNull(), // bullish, bearish, mixed
  priceVsMAs: jsonb("price_vs_mas"), // Price position relative to each MA
  maSlope: jsonb("ma_slope"), // Slope of each moving average
  maSpread: real("ma_spread"), // Spread between fast and slow MA
  
  // Trend Lines and Channels
  trendLines: jsonb("trend_lines").notNull(), // Support/resistance trend lines
  channelBounds: jsonb("channel_bounds"), // Upper and lower channel bounds
  channelWidth: real("channel_width"), // Current channel width
  channelPosition: real("channel_position"), // Price position in channel (0-1)
  
  // Volume Analysis
  volumeTrend: text("volume_trend").notNull(), // increasing, decreasing, flat
  volumeConfirmation: boolean("volume_confirmation"), // Volume confirms price trend
  onBalanceVolume: real("on_balance_volume"), // OBV indicator
  volumeMovingAverage: real("volume_moving_average"),
  
  // Volatility and Strength
  volatilityTrend: text("volatility_trend"), // expanding, contracting, stable
  atr: real("atr"), // Average True Range
  atrPercent: real("atr_percent"), // ATR as percentage of price
  volatilityRank: real("volatility_rank"), // Current vol vs historical (0-1)
  
  // Fibonacci Levels
  fibonacciLevels: jsonb("fibonacci_levels"), // Key fib retracement/extension levels
  currentFibLevel: text("current_fib_level"), // Which fib level price is at
  fibSupport: real("fib_support"), // Nearest fib support
  fibResistance: real("fib_resistance"), // Nearest fib resistance
  
  // Trend Signals and Predictions
  trendSignal: text("trend_signal").notNull(), // buy, sell, hold, wait
  signalStrength: real("signal_strength").notNull(), // 0-1 signal strength
  entryLevel: real("entry_level"), // Suggested entry level
  stopLoss: real("stop_loss"), // Suggested stop loss
  targetLevels: jsonb("target_levels"), // Array of profit target levels
  
  // Reversal Analysis
  reversalProbability: real("reversal_probability"), // 0-1 probability of trend reversal
  reversalSignals: jsonb("reversal_signals"), // Early reversal warning signals
  supportingPatterns: text("supporting_patterns").array(), // Chart patterns supporting trend
  
  // Time Analysis
  timeframe: text("timeframe").notNull(), // Analysis timeframe
  analysisTime: timestamp("analysis_time").notNull(),
  nextUpdate: timestamp("next_update"), // When analysis should be refreshed
  
  // Historical Context
  historicalTrendStats: jsonb("historical_trend_stats"), // Historical trend statistics
  similarPeriods: jsonb("similar_periods"), // Similar historical periods
  seasonalityFactor: real("seasonality_factor"), // Seasonal bias (-1 to 1)
  
  // Performance Tracking
  predictionAccuracy: real("prediction_accuracy"), // Historical accuracy for this asset
  lastPredictionResult: text("last_prediction_result"), // success, failure, partial
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  algorithmVersion: text("algorithm_version").default("v1.0"),
  dataQuality: text("data_quality").default("good"), // good, fair, poor
});

export const marketCycles = pgTable("market_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(),
  
  // Cycle Classification
  cycleType: text("cycle_type").notNull(), // bull_market, bear_market, accumulation, distribution
  cyclePhase: text("cycle_phase").notNull(), // early, mid, late, transition
  cycleStage: text("cycle_stage").notNull(), // emerging, developing, mature, ending
  
  // Cycle Timing
  cycleStart: timestamp("cycle_start").notNull(),
  cycleEnd: timestamp("cycle_end"), // Null if cycle is ongoing
  cycleDuration: integer("cycle_duration"), // Duration in days
  estimatedTimeRemaining: integer("estimated_time_remaining"), // Days until cycle end
  
  // Cycle Metrics
  cycleStrength: real("cycle_strength").notNull(), // 0-1 strength of current cycle
  cycleMomentum: real("cycle_momentum"), // Current momentum within cycle (-1 to 1)
  cycleConfidence: real("cycle_confidence").notNull(), // 0-1 confidence in cycle identification
  
  // Price Analysis
  startPrice: real("start_price").notNull(),
  currentPrice: real("current_price").notNull(),
  peakPrice: real("peak_price"), // Highest price in cycle
  troughPrice: real("trough_price"), // Lowest price in cycle
  priceChange: real("price_change"), // Total price change from cycle start
  priceChangePercent: real("price_change_percent"),
  
  // Cycle Characteristics
  volatilityProfile: jsonb("volatility_profile").notNull(), // Volatility across cycle phases
  volumeProfile: jsonb("volume_profile").notNull(), // Volume patterns across cycle
  participationRate: real("participation_rate"), // Market breadth/participation
  sentimentProfile: jsonb("sentiment_profile"), // Sentiment indicators across cycle
  
  // Technical Analysis
  supportLevels: jsonb("support_levels").notNull(),
  resistanceLevels: jsonb("resistance_levels").notNull(),
  keyLevels: jsonb("key_levels"), // Critical levels for cycle continuation/reversal
  trendStrength: real("trend_strength"), // Underlying trend strength
  
  // Market Structure
  marketStructure: text("market_structure").notNull(), // trending, ranging, breaking_out, breaking_down
  structureQuality: text("structure_quality"), // clean, messy, deteriorating
  structureShifts: jsonb("structure_shifts"), // Major structure changes in cycle
  
  // Institutional Activity
  institutionalFlow: text("institutional_flow"), // accumulating, distributing, neutral
  smartMoneyBehavior: text("smart_money_behavior"), // buying, selling, waiting
  retailSentiment: text("retail_sentiment"), // euphoric, fearful, neutral, FOMO
  
  // Cycle Predictions
  nextPhaseTarget: text("next_phase_target"), // What phase is coming next
  nextPhaseProbability: real("next_phase_probability"), // Probability of transition
  nextPhaseTimeframe: text("next_phase_timeframe"), // When transition might occur
  reversalRisk: real("reversal_risk"), // 0-1 risk of cycle reversal
  
  // Historical Context
  historicalComparisons: jsonb("historical_comparisons"), // Similar historical cycles
  cycleDevelopment: jsonb("cycle_development"), // How cycle has evolved
  anomalies: text("anomalies").array(), // Unusual aspects of this cycle
  
  // Economic Context
  macroEnvironment: jsonb("macro_environment"), // Macro conditions during cycle
  catalysts: text("catalysts").array(), // Key drivers of current cycle
  headwinds: text("headwinds").array(), // Factors working against cycle
  tailwinds: text("tailwinds").array(), // Factors supporting cycle
  
  // Cross-Asset Analysis
  correlatedAssets: jsonb("correlated_assets"), // Other assets in similar cycles
  sectorRotation: jsonb("sector_rotation"), // Sector performance patterns
  riskOnOff: text("risk_on_off"), // Risk-on or risk-off environment
  
  // Alert Thresholds
  alertTriggers: jsonb("alert_triggers"), // Conditions that trigger alerts
  warningSignals: jsonb("warning_signals"), // Early warning indicators
  confirmationSignals: jsonb("confirmation_signals"), // Signals that confirm cycle phase
  
  // Performance Metrics
  sharpeRatio: real("sharpe_ratio"), // Risk-adjusted return for cycle
  maxDrawdown: real("max_drawdown"), // Maximum drawdown in cycle
  winRate: real("win_rate"), // Success rate of cycle-based signals
  
  // Metadata
  detectionAlgorithm: text("detection_algorithm").default("hybrid_ml"),
  modelVersion: text("model_version").default("v1.0"),
  dataQuality: text("data_quality").default("good"),
  lastValidated: timestamp("last_validated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const patternAlerts = pgTable("pattern_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Alert Classification
  alertType: text("alert_type").notNull(), // pattern_detected, pattern_completion, breakout, breakdown, trend_change
  alertCategory: text("alert_category").notNull(), // technical_analysis, pattern_recognition, trend_analysis, cycle_analysis
  severity: text("severity").notNull(), // low, medium, high, critical
  priority: text("priority").notNull(), // low, normal, high, urgent
  
  // Related Entities
  patternId: varchar("pattern_id").references(() => chartPatterns.id),
  trendId: varchar("trend_id").references(() => trendAnalysis.id),
  cycleId: varchar("cycle_id").references(() => marketCycles.id),
  
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
  parentAlertId: varchar("parent_alert_id").references(() => patternAlerts.id), // Original alert this follows up
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
  patternId: varchar("pattern_id").references(() => chartPatterns.id),
  trendId: varchar("trend_id").references(() => trendAnalysis.id),
  cycleId: varchar("cycle_id").references(() => marketCycles.id),
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

export const chartPatternsRelations = relations(chartPatterns, ({ many }) => ({
  alerts: many(patternAlerts),
  tradingSetups: many(aiTradingSetups),
}));

export const trendAnalysisRelations = relations(trendAnalysis, ({ many }) => ({
  alerts: many(patternAlerts),
  tradingSetups: many(aiTradingSetups),
}));

export const marketCyclesRelations = relations(marketCycles, ({ many }) => ({
  alerts: many(patternAlerts),
  tradingSetups: many(aiTradingSetups),
}));

export const patternAlertsRelations = relations(patternAlerts, ({ one, many }) => ({
  pattern: one(chartPatterns, {
    fields: [patternAlerts.patternId],
    references: [chartPatterns.id],
  }),
  trend: one(trendAnalysis, {
    fields: [patternAlerts.trendId],
    references: [trendAnalysis.id],
  }),
  cycle: one(marketCycles, {
    fields: [patternAlerts.cycleId],
    references: [marketCycles.id],
  }),
  parentAlert: one(patternAlerts, {
    fields: [patternAlerts.parentAlertId],
    references: [patternAlerts.id],
  }),
  childAlerts: many(patternAlerts),
  tradingSetups: many(aiTradingSetups),
}));

export const aiTradingSetupsRelations = relations(aiTradingSetups, ({ one }) => ({
  pattern: one(chartPatterns, {
    fields: [aiTradingSetups.patternId],
    references: [chartPatterns.id],
  }),
  trend: one(trendAnalysis, {
    fields: [aiTradingSetups.trendId],
    references: [trendAnalysis.id],
  }),
  cycle: one(marketCycles, {
    fields: [aiTradingSetups.cycleId],
    references: [marketCycles.id],
  }),
  alert: one(patternAlerts, {
    fields: [aiTradingSetups.alertId],
    references: [patternAlerts.id],
  }),
}));

// =============================================================================
// PATTERN RECOGNITION INSERT SCHEMAS - Added after table definitions
// =============================================================================

export const insertChartPatternSchema = createInsertSchema(chartPatterns).pick({
  symbol: true,
  assetType: true,
  patternType: true,
  patternSubtype: true,
  patternCategory: true,
  detectionAlgorithm: true,
  confidence: true,
  patternQuality: true,
  startPrice: true,
  endPrice: true,
  highPrice: true,
  lowPrice: true,
  currentPrice: true,
  supportLevels: true,
  resistanceLevels: true,
  keyLevels: true,
  startTime: true,
  endTime: true,
  timeframe: true,
  duration: true,
  height: true,
  width: true,
  volume: true,
  volumeProfile: true,
  targetDirection: true,
  targetPrice: true,
  stopLoss: true,
  riskRewardRatio: true,
  probabilitySuccess: true,
  marketRegime: true,
  trendAlignment: true,
  volumeConfirmation: true,
  indicatorSignals: true,
  movingAveragePosition: true,
  volatilityEnvironment: true,
  tags: true,
});

export const insertTrendAnalysisSchema = createInsertSchema(trendAnalysis).pick({
  symbol: true,
  assetType: true,
  primaryTrend: true,
  secondaryTrend: true,
  trendStrength: true,
  trendQuality: true,
  trendDuration: true,
  trendAngle: true,
  slopeCoefficient: true,
  rSquared: true,
  momentum: true,
  acceleration: true,
  momentumDivergence: true,
  adx: true,
  adxTrend: true,
  pdi: true,
  ndi: true,
  maConfiguration: true,
  maAlignment: true,
  priceVsMAs: true,
  maSlope: true,
  maSpread: true,
  trendLines: true,
  channelBounds: true,
  channelWidth: true,
  channelPosition: true,
  volumeTrend: true,
  volumeConfirmation: true,
  onBalanceVolume: true,
  volumeMovingAverage: true,
  volatilityTrend: true,
  atr: true,
  atrPercent: true,
  volatilityRank: true,
  fibonacciLevels: true,
  currentFibLevel: true,
  fibSupport: true,
  fibResistance: true,
  trendSignal: true,
  signalStrength: true,
  entryLevel: true,
  stopLoss: true,
  targetLevels: true,
  reversalProbability: true,
  reversalSignals: true,
  supportingPatterns: true,
  timeframe: true,
  analysisTime: true,
  nextUpdate: true,
  historicalTrendStats: true,
  similarPeriods: true,
  seasonalityFactor: true,
  predictionAccuracy: true,
  lastPredictionResult: true,
  algorithmVersion: true,
  dataQuality: true,
});

export const insertMarketCycleSchema = createInsertSchema(marketCycles).pick({
  symbol: true,
  assetType: true,
  cycleType: true,
  cyclePhase: true,
  cycleStage: true,
  cycleStart: true,
  cycleEnd: true,
  cycleDuration: true,
  estimatedTimeRemaining: true,
  cycleStrength: true,
  cycleMomentum: true,
  cycleConfidence: true,
  startPrice: true,
  currentPrice: true,
  peakPrice: true,
  troughPrice: true,
  priceChange: true,
  priceChangePercent: true,
  volatilityProfile: true,
  volumeProfile: true,
  participationRate: true,
  sentimentProfile: true,
  supportLevels: true,
  resistanceLevels: true,
  keyLevels: true,
  trendStrength: true,
  marketStructure: true,
  structureQuality: true,
  structureShifts: true,
  institutionalFlow: true,
  smartMoneyBehavior: true,
  retailSentiment: true,
  nextPhaseTarget: true,
  nextPhaseProbability: true,
  nextPhaseTimeframe: true,
  reversalRisk: true,
  historicalComparisons: true,
  cycleDevelopment: true,
  anomalies: true,
  macroEnvironment: true,
  catalysts: true,
  headwinds: true,
  tailwinds: true,
  correlatedAssets: true,
  sectorRotation: true,
  riskOnOff: true,
  alertTriggers: true,
  warningSignals: true,
  confirmationSignals: true,
  sharpeRatio: true,
  maxDrawdown: true,
  winRate: true,
  detectionAlgorithm: true,
  modelVersion: true,
  dataQuality: true,
});

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
export type InsertChartPattern = z.infer<typeof insertChartPatternSchema>;
export type ChartPatternData = typeof chartPatterns.$inferSelect;

export type InsertTrendAnalysis = z.infer<typeof insertTrendAnalysisSchema>;
export type TrendAnalysisData = typeof trendAnalysis.$inferSelect;

export type InsertMarketCycle = z.infer<typeof insertMarketCycleSchema>;
export type MarketCycleData = typeof marketCycles.$inferSelect;

export type InsertPatternAlert = z.infer<typeof insertPatternAlertSchema>;
export type PatternAlertData = typeof patternAlerts.$inferSelect;

export type InsertAiTradingSetup = z.infer<typeof insertAiTradingSetupSchema>;
export type AiTradingSetupData = typeof aiTradingSetups.$inferSelect;

// =============================================================================
// VOLATILITY FORECASTING AND STRESS INDICATORS TABLES - Phase 3 Feature
// =============================================================================

export const volatilityForecasts = pgTable("volatility_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(), // crypto, stock, commodity, currency
  forecastType: text("forecast_type").notNull(), // garch, ml_ensemble, regime_switching, stochastic
  
  // Current volatility metrics
  currentVolatility: jsonb("current_volatility").notNull(), // { realized1d, realized7d, realized30d, impliedVolatility, percentile }
  
  // Volatility predictions
  predictions: jsonb("predictions").notNull(), // Array of prediction objects
  
  // Model performance metrics
  modelPerformance: jsonb("model_performance").notNull(), // { accuracy, mape, lastCalibrated, backtestPeriod }
  
  // Risk metrics
  riskMetrics: jsonb("risk_metrics").notNull(), // { var95, var99, expectedShortfall, maxDrawdownProbability }
  
  // Market context
  marketContext: jsonb("market_context").notNull(), // { stressLevel, regime, correlationEnvironment, liquidityConditions }
  
  confidence: integer("confidence").notNull(), // 0-100 overall forecast confidence
  accuracy: real("accuracy"), // Historical accuracy percentage
  
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  nextUpdate: timestamp("next_update").notNull(),
  
  // Metadata
  dataQuality: text("data_quality"), // excellent, good, fair, poor
  calibrationDate: timestamp("calibration_date"),
  expiresAt: timestamp("expires_at"),
});

export const stressIndicators = pgTable("stress_indicators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // market_stress, liquidity_stress, volatility_stress, correlation_stress
  
  currentValue: real("current_value").notNull(),
  normalizedValue: real("normalized_value").notNull(), // 0-100 scale
  
  // Stress level classification
  level: text("level").notNull(), // normal, elevated, high, extreme
  
  // Thresholds
  thresholds: jsonb("thresholds").notNull(), // { elevated, high, extreme }
  
  // Historical context
  percentile: real("percentile").notNull(), // Historical percentile
  zScore: real("z_score").notNull(), // Z-score from historical mean
  
  // Time series data (last 30 days)
  history: jsonb("history"), // Array of historical values
  
  // Impact assessment
  impact: jsonb("impact").notNull(), // { severity, affectedAssets, expectedDuration, previousOccurrences }
  
  description: text("description").notNull(),
  interpretation: text("interpretation").notNull(),
  actionableInsights: jsonb("actionable_insights"), // Array of insights
  
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  // Alert configuration
  alertEnabled: boolean("alert_enabled").default(true),
  alertThreshold: real("alert_threshold"),
  lastAlertAt: timestamp("last_alert_at"),
});

export const riskRegimes = pgTable("risk_regimes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  regime: text("regime").notNull(), // accumulation, risk_on, risk_off, distribution, crisis, recovery
  confidence: integer("confidence").notNull(), // 0-100 confidence in regime classification
  
  // Regime characteristics
  characteristics: jsonb("characteristics").notNull(), // { averageVolatility, correlationLevel, liquidityConditions, sentimentScore, momentumStrength }
  
  // Regime duration and transition
  duration: jsonb("duration").notNull(), // { current, typical, remaining }
  
  // Transition probabilities
  transitions: jsonb("transitions"), // Array of transition objects
  
  // Historical analysis
  historical: jsonb("historical").notNull(), // { frequency, averageDuration, returnCharacteristics }
  
  // Strategic implications
  implications: jsonb("implications").notNull(), // { recommendedAction, riskTolerance, assetAllocation, positionSizing }
  
  detectedAt: timestamp("detected_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  // Regime tracking
  isActive: boolean("is_active").default(true),
  previousRegime: text("previous_regime"),
  regimeStartDate: timestamp("regime_start_date"),
  expectedEndDate: timestamp("expected_end_date"),
});

export const crisisIndicators = pgTable("crisis_indicators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // market_crash, liquidity_crisis, correlation_breakdown, volatility_spike, systemic_risk
  
  // Crisis probability
  probability: real("probability").notNull(), // 0-100 probability of crisis
  timeframe: text("timeframe").notNull(), // 1d, 7d, 30d, 90d
  severity: text("severity").notNull(), // minor, moderate, major, systemic
  
  // Early warning signals
  signals: jsonb("signals").notNull(), // Array of signal objects
  
  // Crisis characteristics
  characteristics: jsonb("characteristics").notNull(), // { expectedDuration, expectedImpact, recoveryTime }
  
  // Historical precedents
  precedents: jsonb("precedents"), // Array of historical precedent objects
  
  // Mitigation strategies
  mitigation: jsonb("mitigation").notNull(), // { hedging, positioning, monitoring }
  
  confidence: integer("confidence").notNull(), // 0-100 confidence in indicator
  
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  // Crisis tracking
  isActive: boolean("is_active").default(true),
  triggeredAt: timestamp("triggered_at"),
  resolvedAt: timestamp("resolved_at"),
});

export const volatilitySurfaces = pgTable("volatility_surfaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull(), // crypto, stock
  
  // Surface data points
  surface: jsonb("surface").notNull(), // Array of surface points
  
  // Surface characteristics
  characteristics: jsonb("characteristics").notNull(), // { atmVolatility, skew, termStructure, smile }
  
  // Model fit metrics
  modelFit: jsonb("model_fit").notNull(), // { method, r_squared, rmse, parameters }
  
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  nextUpdate: timestamp("next_update").notNull(),
  
  // Data quality
  dataPoints: integer("data_points"),
  fitQuality: text("fit_quality"), // excellent, good, fair, poor
  lastCalibrated: timestamp("last_calibrated"),
});

export const stressTestScenarios = pgTable("stress_test_scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // historical, hypothetical, regulatory, extreme
  severity: text("severity").notNull(), // mild, moderate, severe, extreme
  
  // Scenario parameters
  parameters: jsonb("parameters").notNull(), // { marketShock, volatilityMultiplier, correlationIncrease, liquidityDryup, duration }
  
  // Asset-specific shocks
  assetShocks: jsonb("asset_shocks"), // Array of asset shock objects
  
  // Historical basis
  historicalBasis: jsonb("historical_basis"), // { date, event, actualImpact }
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used"),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  averageImpact: real("average_impact"),
});

export const tailRiskMetrics = pgTable("tail_risk_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metric: text("metric").notNull(), // expected_shortfall, tail_expectation, extreme_value, peak_over_threshold
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(), // 1d, 7d, 30d
  
  // Risk measurements
  value: real("value").notNull(),
  confidence: real("confidence").notNull(), // Confidence level (95%, 99%, etc.)
  
  // Tail characteristics
  tailShape: jsonb("tail_shape").notNull(), // { heaviness, asymmetry, extremeEvents }
  
  // Historical context
  historical: jsonb("historical").notNull(), // { average, maximum, percentile, exceedances }
  
  calculatedAt: timestamp("calculated_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  // Model parameters
  modelType: text("model_type"), // GPD, EVT, POT
  parameters: jsonb("parameters"),
  fitQuality: real("fit_quality"),
});

export const volatilityAlerts = pgTable("volatility_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertType: text("alert_type").notNull(), // volatility_spike, regime_change, stress_threshold, crisis_warning, model_drift
  severity: text("severity").notNull(), // low, medium, high, critical
  
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  // Alert details
  symbol: text("symbol"),
  metric: text("metric").notNull(),
  currentValue: real("current_value").notNull(),
  thresholdValue: real("threshold_value").notNull(),
  deviationPercent: real("deviation_percent").notNull(),
  
  // Context
  context: jsonb("context").notNull(), // { timeframe, historicalContext, implications }
  
  // Recommendations
  recommendations: jsonb("recommendations").notNull(), // { immediate, shortTerm, monitoring }
  
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  
  // Alert lifecycle
  isActive: boolean("is_active").default(true),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: text("acknowledged_by"),
  
  // Delivery tracking
  deliveryChannels: jsonb("delivery_channels"), // Array of delivery channels
  deliveredAt: jsonb("delivered_at"), // Delivery timestamps by channel
  
  // Alert classification
  priority: text("priority").default('medium'), // low, medium, high, urgent
  category: text("category"), // market, portfolio, technical, fundamental
  tags: text("tags").array(),
});

export const volatilityModelCalibrations = pgTable("volatility_model_calibrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: text("model_id").notNull(),
  modelType: text("model_type").notNull(), // garch, stochastic_vol, jump_diffusion, regime_switching
  symbol: text("symbol").notNull(),
  
  // Model parameters
  parameters: jsonb("parameters").notNull(),
  
  // Calibration metrics
  calibration: jsonb("calibration").notNull(), // { method, logLikelihood, aic, bic, convergence }
  
  // Performance metrics
  performance: jsonb("performance").notNull(), // { insampleR2, oosampleR2, forecastAccuracy, volatilityForecastMape }
  
  calibrationDate: timestamp("calibration_date").defaultNow(),
  validUntil: timestamp("valid_until").notNull(),
  
  // Model versioning
  version: text("version").notNull(),
  previousVersion: text("previous_version"),
  
  // Quality metrics
  dataQuality: real("data_quality"), // 0-100
  convergenceStatus: boolean("convergence_status"),
  outlierCount: integer("outlier_count"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// VOLATILITY FORECASTING RELATIONS
// =============================================================================

export const volatilityForecastsRelations = relations(volatilityForecasts, ({ many }) => ({
  alerts: many(volatilityAlerts),
  tailRiskMetrics: many(tailRiskMetrics),
}));

export const stressIndicatorsRelations = relations(stressIndicators, ({ many }) => ({
  alerts: many(volatilityAlerts),
}));

export const riskRegimesRelations = relations(riskRegimes, ({ many }) => ({
  alerts: many(volatilityAlerts),
}));

export const crisisIndicatorsRelations = relations(crisisIndicators, ({ many }) => ({
  alerts: many(volatilityAlerts),
}));

export const volatilitySurfacesRelations = relations(volatilitySurfaces, ({ one }) => ({
  forecast: one(volatilityForecasts, {
    fields: [volatilitySurfaces.symbol],
    references: [volatilityForecasts.symbol],
  }),
}));

export const tailRiskMetricsRelations = relations(tailRiskMetrics, ({ one }) => ({
  forecast: one(volatilityForecasts, {
    fields: [tailRiskMetrics.symbol],
    references: [volatilityForecasts.symbol],
  }),
}));

export const volatilityAlertsRelations = relations(volatilityAlerts, ({ one }) => ({
  forecast: one(volatilityForecasts, {
    fields: [volatilityAlerts.symbol],
    references: [volatilityForecasts.symbol],
  }),
  stressIndicator: one(stressIndicators),
  riskRegime: one(riskRegimes),
  crisisIndicator: one(crisisIndicators),
}));

export const volatilityModelCalibrationsRelations = relations(volatilityModelCalibrations, ({ one }) => ({
  forecast: one(volatilityForecasts, {
    fields: [volatilityModelCalibrations.symbol],
    references: [volatilityForecasts.symbol],
  }),
}));

// =============================================================================
// VOLATILITY FORECASTING INSERT SCHEMAS
// =============================================================================

export const insertVolatilityForecastSchema = createInsertSchema(volatilityForecasts).pick({
  symbol: true,
  assetType: true,
  forecastType: true,
  currentVolatility: true,
  predictions: true,
  modelPerformance: true,
  riskMetrics: true,
  marketContext: true,
  confidence: true,
  accuracy: true,
  nextUpdate: true,
  dataQuality: true,
  calibrationDate: true,
  expiresAt: true,
});

export const insertStressIndicatorSchema = createInsertSchema(stressIndicators).pick({
  name: true,
  category: true,
  currentValue: true,
  normalizedValue: true,
  level: true,
  thresholds: true,
  percentile: true,
  zScore: true,
  history: true,
  impact: true,
  description: true,
  interpretation: true,
  actionableInsights: true,
  alertEnabled: true,
  alertThreshold: true,
});

export const insertRiskRegimeSchema = createInsertSchema(riskRegimes).pick({
  regime: true,
  confidence: true,
  characteristics: true,
  duration: true,
  transitions: true,
  historical: true,
  implications: true,
  isActive: true,
  previousRegime: true,
  regimeStartDate: true,
  expectedEndDate: true,
});

export const insertCrisisIndicatorSchema = createInsertSchema(crisisIndicators).pick({
  name: true,
  type: true,
  probability: true,
  timeframe: true,
  severity: true,
  signals: true,
  characteristics: true,
  precedents: true,
  mitigation: true,
  confidence: true,
  isActive: true,
  triggeredAt: true,
});

export const insertVolatilitySurfaceSchema = createInsertSchema(volatilitySurfaces).pick({
  symbol: true,
  assetType: true,
  surface: true,
  characteristics: true,
  modelFit: true,
  nextUpdate: true,
  dataPoints: true,
  fitQuality: true,
  lastCalibrated: true,
});

export const insertStressTestScenarioSchema = createInsertSchema(stressTestScenarios).pick({
  name: true,
  description: true,
  category: true,
  severity: true,
  parameters: true,
  assetShocks: true,
  historicalBasis: true,
  isActive: true,
  usageCount: true,
  averageImpact: true,
});

export const insertTailRiskMetricSchema = createInsertSchema(tailRiskMetrics).pick({
  metric: true,
  symbol: true,
  timeframe: true,
  value: true,
  confidence: true,
  tailShape: true,
  historical: true,
  modelType: true,
  parameters: true,
  fitQuality: true,
});

export const insertVolatilityAlertSchema = createInsertSchema(volatilityAlerts).pick({
  alertType: true,
  severity: true,
  title: true,
  description: true,
  symbol: true,
  metric: true,
  currentValue: true,
  thresholdValue: true,
  deviationPercent: true,
  context: true,
  recommendations: true,
  expiresAt: true,
  acknowledgedBy: true,
  deliveryChannels: true,
  priority: true,
  category: true,
  tags: true,
});

export const insertVolatilityModelCalibrationSchema = createInsertSchema(volatilityModelCalibrations).pick({
  modelId: true,
  modelType: true,
  symbol: true,
  parameters: true,
  calibration: true,
  performance: true,
  validUntil: true,
  version: true,
  previousVersion: true,
  dataQuality: true,
  convergenceStatus: true,
  outlierCount: true,
  isActive: true,
});

// =============================================================================
// VOLATILITY FORECASTING TYPES
// =============================================================================

export type InsertVolatilityForecast = z.infer<typeof insertVolatilityForecastSchema>;
export type VolatilityForecast = typeof volatilityForecasts.$inferSelect;

export type InsertStressIndicator = z.infer<typeof insertStressIndicatorSchema>;
export type StressIndicator = typeof stressIndicators.$inferSelect;

export type InsertRiskRegime = z.infer<typeof insertRiskRegimeSchema>;
export type RiskRegime = typeof riskRegimes.$inferSelect;

export type InsertCrisisIndicator = z.infer<typeof insertCrisisIndicatorSchema>;
export type CrisisIndicator = typeof crisisIndicators.$inferSelect;

export type InsertVolatilitySurface = z.infer<typeof insertVolatilitySurfaceSchema>;
export type VolatilitySurface = typeof volatilitySurfaces.$inferSelect;

export type InsertStressTestScenario = z.infer<typeof insertStressTestScenarioSchema>;
export type StressTestScenario = typeof stressTestScenarios.$inferSelect;

export type InsertTailRiskMetric = z.infer<typeof insertTailRiskMetricSchema>;
export type TailRiskMetric = typeof tailRiskMetrics.$inferSelect;

export type InsertVolatilityAlert = z.infer<typeof insertVolatilityAlertSchema>;
export type VolatilityAlert = typeof volatilityAlerts.$inferSelect;

export type InsertVolatilityModelCalibration = z.infer<typeof insertVolatilityModelCalibrationSchema>;
export type VolatilityModelCalibration = typeof volatilityModelCalibrations.$inferSelect;

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
  
  volatilityForecasts: VolatilityForecast[];
  stressIndicators: StressIndicator[];
  riskRegime: RiskRegime;
  crisisIndicators: CrisisIndicator[];
  activeAlerts: VolatilityAlert[];
  
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
