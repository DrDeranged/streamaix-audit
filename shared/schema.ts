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
