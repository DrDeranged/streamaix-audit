import { 
  type User, 
  type InsertUser, 
  type Summary, 
  type InsertSummary,
  type Bounty, 
  type InsertBounty,
  type TipContribution,
  type InsertTipContribution,
  type BountyHunter,
  type InsertBountyHunter,
  type BountyQualityScore,
  type InsertBountyQualityScore,
  type BountyEngagement,
  type InsertBountyEngagement,
  type UserInteraction,
  type InsertUserInteraction,
  type KnowledgeStack,
  type InsertKnowledgeStack,
  type UserNote,
  type InsertUserNote,
  type ChatMessage,
  type InsertChatMessage,
  type CryptoLeader,
  type InsertCryptoLeader,
  type CuratedCast,
  type InsertCuratedCast,
  type TopicTag,
  type InsertTopicTag,
  type LearningResource,
  type InsertLearningResource,
  type UserPreferences,
  type InsertUserPreferences,
  type LeaderEducationData,
  // Knowledge Avatar Types
  type KnowledgeAvatar,
  type InsertKnowledgeAvatar,
  type AvatarFollow,
  type InsertAvatarFollow,
  type AvatarContentInteraction,
  type InsertAvatarContentInteraction,
  type AvatarInsight,
  type InsertAvatarInsight,
  // Entrepreneur Predictions Types
  type EntrepreneurPrediction,
  type InsertEntrepreneurPrediction,
  // Pattern Recognition Types
  type ChartPattern,
  type InsertChartPattern,
  type TrendAnalysis,
  type InsertTrendAnalysis,
  type MarketCycle,
  type InsertMarketCycle,
  type PatternAlert,
  type InsertPatternAlert,
  type AiTradingSetup,
  type InsertAiTradingSetup,
  // Referral System Types
  type ReferralCode,
  type InsertReferralCode,
  type ReferralSignup,
  type InsertReferralSignup,
  users,
  summaries,
  bounties,
  tipContributions,
  bountyHunters,
  bountyQualityScores,
  bountyEngagements,
  userInteractions,
  knowledgeStacks,
  userNotes,
  chatMessages,
  cryptoLeaders,
  curatedCasts,
  topicTags,
  learningResources,
  userPreferences,
  // Knowledge Avatar Tables
  knowledgeAvatars,
  avatarFollows,
  avatarContentInteractions,
  avatarInsights,
  // Entrepreneur Predictions Tables
  entrepreneurPredictions,
  // Pattern Recognition Tables
  chartPatterns,
  trendAnalysis,
  marketCycles,
  patternAlerts,
  aiTradingSetups,
  // Referral System Tables
  referralCodes,
  referralSignups,
  // Collaboration Tables
  bountyCollaborators,
  collaborationSessions,
  // Bounty Templates
  bountyTemplates,
  type BountyTemplate,
  type InsertBountyTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, gte } from "drizzle-orm";
import { customAlphabet } from 'nanoid';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress?(walletAddress: string): Promise<User | undefined>;
  getUserByTwitterId?(twitterId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Summary operations
  getSummary(id: string): Promise<Summary | undefined>;
  getSummaries(limit?: number, offset?: number): Promise<Summary[]>;
  getAllSummaries(): Promise<Summary[]>;
  getSummariesByUser(userId: string): Promise<Summary[]>;
  createSummary(summary: InsertSummary): Promise<Summary>;
  updateSummary(id: string, updates: any): Promise<Summary | undefined>;
  deleteSummary(id: string): Promise<boolean>;

  // Bounty operations
  getBounty(id: string): Promise<Bounty | undefined>;
  getBounties(limit?: number, offset?: number): Promise<Bounty[]>;
  getBountiesByUser(userId: string): Promise<Bounty[]>;
  createBounty(bounty: InsertBounty): Promise<Bounty>;
  updateBounty(id: string, updates: Partial<InsertBounty>): Promise<Bounty | undefined>;
  deleteBounty(id: string): Promise<boolean>;

  // Tip contribution operations
  createTipContribution(tip: InsertTipContribution): Promise<TipContribution>;
  getTipContributionsByBounty(bountyId: string): Promise<TipContribution[]>;

  // Bounty hunter operations
  getBountyHunter(id: string): Promise<BountyHunter | undefined>;
  getBountyHunterByUserId(userId: string): Promise<BountyHunter | undefined>;
  getBountyHunterByWallet(walletAddress: string): Promise<BountyHunter | undefined>;
  createBountyHunter(hunter: InsertBountyHunter): Promise<BountyHunter>;
  updateBountyHunter(id: string, updates: Partial<InsertBountyHunter>): Promise<BountyHunter | undefined>;
  getAllBountyHunters(limit?: number, offset?: number): Promise<BountyHunter[]>;

  // Bounty quality score operations
  getBountyQualityScore(bountyId: string): Promise<BountyQualityScore | undefined>;
  createBountyQualityScore(score: InsertBountyQualityScore): Promise<BountyQualityScore>;
  updateBountyQualityScore(bountyId: string, updates: Partial<InsertBountyQualityScore>): Promise<BountyQualityScore | undefined>;

  // Bounty engagement operations
  createBountyEngagement(engagement: InsertBountyEngagement): Promise<BountyEngagement>;
  getBountyEngagements(bountyId: string): Promise<BountyEngagement[]>;
  getBountyEngagementStats(bountyId: string): Promise<{ views: number; shares: number; likes: number; comments: number }>;

  // User interaction operations
  getUserInteractions(userId: string, options?: { summaryId?: string; limit?: number; targetType?: string; since?: Date }): Promise<UserInteraction[]>;
  createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction>;
  deleteUserInteraction(userId: string, summaryId: string, interactionType: string): Promise<boolean>;

  // Knowledge stack operations
  getKnowledgeStack(id: string): Promise<KnowledgeStack | undefined>;
  getKnowledgeStacks(limit?: number, offset?: number): Promise<KnowledgeStack[]>;
  getKnowledgeStacksByUser(userId: string): Promise<KnowledgeStack[]>;
  createKnowledgeStack(stack: InsertKnowledgeStack): Promise<KnowledgeStack>;
  updateKnowledgeStack(id: string, updates: Partial<InsertKnowledgeStack>): Promise<KnowledgeStack | undefined>;
  deleteKnowledgeStack(id: string): Promise<boolean>;

  // User notes operations
  getUserNote(id: string): Promise<UserNote | undefined>;
  getUserNotes(userId: string, summaryId?: string): Promise<UserNote[]>;
  getUserNotesBySummary(summaryId: string): Promise<UserNote[]>;
  createUserNote(note: InsertUserNote): Promise<UserNote>;
  updateUserNote(id: string, updates: Partial<InsertUserNote>): Promise<UserNote | undefined>;
  deleteUserNote(id: string): Promise<boolean>;

  // Chat message operations
  getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Analytics and search
  getTrendingSummaries(limit?: number): Promise<Summary[]>;
  searchSummaries(query: string, limit?: number): Promise<Summary[]>;
  getUserStats(userId: string): Promise<{
    summariesCount: number;
    bountiesCount: number;
    interactionsCount: number;
    stacksCount: number;
  }>;

  // Knowledge Avatar operations
  getKnowledgeAvatar(id: string): Promise<KnowledgeAvatar | undefined>;
  getKnowledgeAvatarByHandle(handle: string): Promise<KnowledgeAvatar | undefined>;
  getKnowledgeAvatars(limit?: number, offset?: number): Promise<KnowledgeAvatar[]>;
  createKnowledgeAvatar(avatar: InsertKnowledgeAvatar): Promise<KnowledgeAvatar>;
  updateKnowledgeAvatar(id: string, updates: Partial<InsertKnowledgeAvatar>): Promise<KnowledgeAvatar | undefined>;
  deleteKnowledgeAvatar(id: string): Promise<boolean>;

  // Avatar Following operations
  followAvatar(userId: string, avatarId: string): Promise<AvatarFollow>;
  unfollowAvatar(userId: string, avatarId: string): Promise<boolean>;
  getAvatarFollowsByUserId(userId: string): Promise<AvatarFollow[]>;
  getUserFollowedAvatars(userId: string): Promise<(AvatarFollow & { avatar: KnowledgeAvatar })[]>;
  getAvatarFollowers(avatarId: string): Promise<(AvatarFollow & { user: User })[]>;
  isFollowingAvatar(userId: string, avatarId: string): Promise<boolean>;

  // Avatar Content & Interactions
  createAvatarContentInteraction(interaction: InsertAvatarContentInteraction): Promise<AvatarContentInteraction>;
  getAvatarContentInteractions(avatarId: string, limit?: number): Promise<AvatarContentInteraction[]>;
  getUserAvatarInteractions(userId: string, limit?: number): Promise<AvatarContentInteraction[]>;

  // Avatar Insights operations
  getAvatarInsight(id: string): Promise<AvatarInsight | undefined>;
  getAvatarInsights(avatarId: string, category?: string): Promise<AvatarInsight[]>;
  createAvatarInsight(insight: InsertAvatarInsight): Promise<AvatarInsight>;
  updateAvatarInsight(id: string, updates: Partial<InsertAvatarInsight>): Promise<AvatarInsight | undefined>;
  deleteAvatarInsight(id: string): Promise<boolean>;

  // Educational content operations
  getCryptoLeader(id: string): Promise<CryptoLeader | undefined>;
  getCryptoLeaderByFid(fid: number): Promise<CryptoLeader | undefined>;
  getCryptoLeaders(limit?: number): Promise<CryptoLeader[]>;
  createCryptoLeader(leader: InsertCryptoLeader): Promise<CryptoLeader>;
  updateCryptoLeader(id: string, updates: Partial<InsertCryptoLeader>): Promise<CryptoLeader | undefined>;
  
  getCuratedCast(id: string): Promise<CuratedCast | undefined>;
  getCuratedCastsByLeader(leaderId: string): Promise<CuratedCast[]>;
  createCuratedCast(cast: InsertCuratedCast): Promise<CuratedCast>;
  
  getTopicTag(id: string): Promise<TopicTag | undefined>;
  getTopicTags(category?: string): Promise<TopicTag[]>;
  createTopicTag(tag: InsertTopicTag): Promise<TopicTag>;
  
  getLearningResource(id: string): Promise<LearningResource | undefined>;
  getLearningResourcesByLeader(leaderId: string): Promise<LearningResource[]>;
  createLearningResource(resource: InsertLearningResource): Promise<LearningResource>;
  
  getLeaderEducationData(leaderId: string): Promise<LeaderEducationData | undefined>;

  // Pattern Recognition operations
  
  // Chart Pattern operations
  getChartPattern(id: string): Promise<ChartPattern | undefined>;
  getChartPatterns(options?: {
    symbol?: string;
    assetType?: string;
    patternType?: string;
    timeframe?: string;
    minConfidence?: number;
    isComplete?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ChartPattern[]>;
  getChartPatternsBySymbol(symbol: string, timeframe?: string): Promise<ChartPattern[]>;
  createChartPattern(pattern: InsertChartPattern): Promise<ChartPattern>;
  updateChartPattern(id: string, updates: Partial<InsertChartPattern>): Promise<ChartPattern | undefined>;
  deleteChartPattern(id: string): Promise<boolean>;

  // Trend Analysis operations
  getTrendAnalysis(id: string): Promise<TrendAnalysis | undefined>;
  getTrendAnalysesBySymbol(symbol: string, timeframe?: string): Promise<TrendAnalysis[]>;
  getLatestTrendAnalysis(symbol: string, timeframe?: string): Promise<TrendAnalysis | undefined>;
  createTrendAnalysis(analysis: InsertTrendAnalysis): Promise<TrendAnalysis>;
  updateTrendAnalysis(id: string, updates: Partial<InsertTrendAnalysis>): Promise<TrendAnalysis | undefined>;
  deleteTrendAnalysis(id: string): Promise<boolean>;

  // Market Cycle operations
  getMarketCycle(id: string): Promise<MarketCycle | undefined>;
  getMarketCycles(options?: {
    symbol?: string;
    assetType?: string;
    cycleType?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<MarketCycle[]>;
  getMarketCyclesBySymbol(symbol: string): Promise<MarketCycle[]>;
  getActiveMarketCycles(): Promise<MarketCycle[]>;
  createMarketCycle(cycle: InsertMarketCycle): Promise<MarketCycle>;
  updateMarketCycle(id: string, updates: Partial<InsertMarketCycle>): Promise<MarketCycle | undefined>;
  deleteMarketCycle(id: string): Promise<boolean>;

  // Pattern Alert operations
  getPatternAlert(id: string): Promise<PatternAlert | undefined>;
  getPatternAlerts(options?: {
    symbol?: string;
    assetType?: string;
    alertType?: string;
    severity?: string;
    isActive?: boolean;
    isAcknowledged?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PatternAlert[]>;
  getActivePatternAlerts(symbol?: string): Promise<PatternAlert[]>;
  getPatternAlertsByPattern(patternId: string): Promise<PatternAlert[]>;
  createPatternAlert(alert: InsertPatternAlert): Promise<PatternAlert>;
  updatePatternAlert(id: string, updates: Partial<InsertPatternAlert>): Promise<PatternAlert | undefined>;
  acknowledgePatternAlert(id: string): Promise<PatternAlert | undefined>;
  deletePatternAlert(id: string): Promise<boolean>;

  // AI Trading Setup operations
  getAiTradingSetup(id: string): Promise<AiTradingSetup | undefined>;
  getAiTradingSetups(options?: {
    symbol?: string;
    assetType?: string;
    setupType?: string;
    setupCategory?: string;
    riskProfile?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AiTradingSetup[]>;
  getAiTradingSetupsBySymbol(symbol: string): Promise<AiTradingSetup[]>;
  getActiveAiTradingSetups(): Promise<AiTradingSetup[]>;
  createAiTradingSetup(setup: InsertAiTradingSetup): Promise<AiTradingSetup>;
  updateAiTradingSetup(id: string, updates: Partial<InsertAiTradingSetup>): Promise<AiTradingSetup | undefined>;
  deleteAiTradingSetup(id: string): Promise<boolean>;

  // Entrepreneur prediction operations
  getEntrepreneurPrediction(id: string): Promise<EntrepreneurPrediction | undefined>;
  getEntrepreneurPredictions(options?: {
    entrepreneurName?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<EntrepreneurPrediction[]>;
  getActivePredictions(entrepreneurName?: string): Promise<EntrepreneurPrediction[]>;
  getPredictionsByTimeframe(timeframe: string): Promise<EntrepreneurPrediction[]>;
  createEntrepreneurPrediction(prediction: InsertEntrepreneurPrediction): Promise<EntrepreneurPrediction>;
  updateEntrepreneurPrediction(id: string, updates: Partial<EntrepreneurPrediction>): Promise<EntrepreneurPrediction | undefined>;
  evaluatePrediction(id: string, outcome: string, accuracyScore: number): Promise<EntrepreneurPrediction | undefined>;
  getEntrepreneurAccuracyStats(entrepreneurName: string): Promise<{
    totalPredictions: number;
    evaluatedPredictions: number;
    averageAccuracy: number;
    accuracyByCategory: Record<string, number>;
    recentAccuracy: number;
  }>;

  // Referral System operations
  generateUniqueReferralCode(): Promise<string>;
  createReferralCode(code: InsertReferralCode): Promise<ReferralCode>;
  getReferralCode(code: string): Promise<ReferralCode | undefined>;
  getReferralCodesByUser(userId: string): Promise<ReferralCode[]>;
  updateReferralCode(id: string, updates: Partial<ReferralCode>): Promise<ReferralCode | undefined>;
  
  createReferralSignup(signup: InsertReferralSignup): Promise<ReferralSignup>;
  getReferralSignups(referrerId: string): Promise<ReferralSignup[]>;
  claimReferralReward(signupId: string): Promise<ReferralSignup | undefined>;
  getReferralLeaderboard(limit?: number): Promise<Array<{ userId: string; username: string; totalRewardsEarned: number; totalSignups: number }>>;

  // Collaboration operations
  addCollaborator(data: { bountyId: string; userId: string; role: string; rewardShare: number; status: string; invitedBy: string }): Promise<any>;
  updateCollaboratorShare(bountyId: string, userId: string, rewardShare: number): Promise<any>;
  updateCollaborationSession(data: { bountyId: string; activeUsers: any[]; contentSnapshot: string; lastActivity: Date }): Promise<any>;
  getCollaborationSession(bountyId: string): Promise<any>;
  getCollaborators(bountyId: string): Promise<any[]>;

  // Bounty Template operations
  getBountyTemplate(id: string): Promise<BountyTemplate | undefined>;
  getBountyTemplates(options?: { category?: string; difficulty?: string; limit?: number }): Promise<BountyTemplate[]>;
  createBountyTemplate(template: InsertBountyTemplate): Promise<BountyTemplate>;
  updateBountyTemplate(id: string, updates: Partial<InsertBountyTemplate>): Promise<BountyTemplate | undefined>;
  deleteBountyTemplate(id: string): Promise<boolean>;
  incrementTemplateUsage(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async getUserByTwitterId(twitterId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.twitterId, twitterId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Summary operations
  async getSummary(id: string): Promise<Summary | undefined> {
    const [summary] = await db.select().from(summaries).where(eq(summaries.id, id));
    return summary || undefined;
  }

  async getSummaries(limit = 50, offset = 0): Promise<Summary[]> {
    return await db
      .select()
      .from(summaries)
      .where(eq(summaries.isPublic, true))
      .orderBy(desc(summaries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAllSummaries(): Promise<Summary[]> {
    return await db
      .select()
      .from(summaries)
      .orderBy(desc(summaries.createdAt));
  }

  async getSummariesByUser(userId: string): Promise<Summary[]> {
    return await db
      .select()
      .from(summaries)
      .where(eq(summaries.creatorId, userId))
      .orderBy(desc(summaries.createdAt));
  }

  async createSummary(insertSummary: InsertSummary): Promise<Summary> {
    const [summary] = await db
      .insert(summaries)
      .values(insertSummary)
      .returning();
    return summary;
  }

  async createSummaryDirect(summaryData: any): Promise<Summary> {
    console.log('API: Creating summary directly with data:', summaryData);
    const [summary] = await db
      .insert(summaries)
      .values({
        ...summaryData,
        creatorId: null // Bypass foreign key for demo
      })
      .returning();
    return summary;
  }

  async updateSummary(id: string, updates: any): Promise<Summary | undefined> {
    const [summary] = await db
      .update(summaries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(summaries.id, id))
      .returning();
    return summary || undefined;
  }

  async deleteSummary(id: string): Promise<boolean> {
    const result = await db.delete(summaries).where(eq(summaries.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Bounty operations
  async getBounty(id: string): Promise<Bounty | undefined> {
    const [bounty] = await db.select().from(bounties).where(eq(bounties.id, id));
    return bounty || undefined;
  }

  async getBounties(limit = 50, offset = 0): Promise<Bounty[]> {
    return await db
      .select()
      .from(bounties)
      .orderBy(desc(bounties.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getBountiesByUser(userId: string): Promise<Bounty[]> {
    return await db
      .select()
      .from(bounties)
      .where(eq(bounties.creatorId, userId))
      .orderBy(desc(bounties.createdAt));
  }

  async createBounty(insertBounty: InsertBounty): Promise<Bounty> {
    const [bounty] = await db
      .insert(bounties)
      .values(insertBounty)
      .returning();
    return bounty;
  }

  async updateBounty(id: string, updates: Partial<InsertBounty>): Promise<Bounty | undefined> {
    const [bounty] = await db
      .update(bounties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bounties.id, id))
      .returning();
    return bounty || undefined;
  }

  async deleteBounty(id: string): Promise<boolean> {
    const result = await db.delete(bounties).where(eq(bounties.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Tip contribution operations
  async createTipContribution(insertTip: InsertTipContribution): Promise<TipContribution> {
    const [tip] = await db
      .insert(tipContributions)
      .values(insertTip)
      .returning();
    return tip;
  }

  async getTipContributionsByBounty(bountyId: string): Promise<TipContribution[]> {
    return await db
      .select()
      .from(tipContributions)
      .where(eq(tipContributions.bountyId, bountyId))
      .orderBy(desc(tipContributions.createdAt));
  }

  // Bounty hunter operations
  async getBountyHunter(id: string): Promise<BountyHunter | undefined> {
    const [hunter] = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.id, id));
    return hunter || undefined;
  }

  async getBountyHunterByUserId(userId: string): Promise<BountyHunter | undefined> {
    const [hunter] = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.userId, userId));
    return hunter || undefined;
  }

  async getBountyHunterByWallet(walletAddress: string): Promise<BountyHunter | undefined> {
    const [hunter] = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.walletAddress, walletAddress));
    return hunter || undefined;
  }

  async createBountyHunter(hunter: InsertBountyHunter): Promise<BountyHunter> {
    const [newHunter] = await db
      .insert(bountyHunters)
      .values(hunter)
      .returning();
    return newHunter;
  }

  async updateBountyHunter(id: string, updates: Partial<InsertBountyHunter>): Promise<BountyHunter | undefined> {
    const [hunter] = await db
      .update(bountyHunters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bountyHunters.id, id))
      .returning();
    return hunter || undefined;
  }

  async getAllBountyHunters(limit: number = 100, offset: number = 0): Promise<BountyHunter[]> {
    return await db
      .select()
      .from(bountyHunters)
      .orderBy(desc(bountyHunters.reputation))
      .limit(limit)
      .offset(offset);
  }

  // Bounty quality score operations
  async getBountyQualityScore(bountyId: string): Promise<BountyQualityScore | undefined> {
    const [score] = await db
      .select()
      .from(bountyQualityScores)
      .where(eq(bountyQualityScores.bountyId, bountyId));
    return score || undefined;
  }

  async createBountyQualityScore(score: InsertBountyQualityScore): Promise<BountyQualityScore> {
    const [newScore] = await db
      .insert(bountyQualityScores)
      .values(score)
      .returning();
    return newScore;
  }

  async updateBountyQualityScore(bountyId: string, updates: Partial<InsertBountyQualityScore>): Promise<BountyQualityScore | undefined> {
    const [score] = await db
      .update(bountyQualityScores)
      .set(updates)
      .where(eq(bountyQualityScores.bountyId, bountyId))
      .returning();
    return score || undefined;
  }

  // Bounty engagement operations
  async createBountyEngagement(engagement: InsertBountyEngagement): Promise<BountyEngagement> {
    const [newEngagement] = await db
      .insert(bountyEngagements)
      .values(engagement)
      .returning();
    return newEngagement;
  }

  async getBountyEngagements(bountyId: string): Promise<BountyEngagement[]> {
    return await db
      .select()
      .from(bountyEngagements)
      .where(eq(bountyEngagements.bountyId, bountyId))
      .orderBy(desc(bountyEngagements.createdAt));
  }

  async getBountyEngagementStats(bountyId: string): Promise<{ views: number; shares: number; likes: number; comments: number }> {
    const engagements = await this.getBountyEngagements(bountyId);
    
    return {
      views: engagements.filter(e => e.engagementType === 'view').length,
      shares: engagements.filter(e => e.engagementType === 'share').length,
      likes: engagements.filter(e => e.engagementType === 'like').length,
      comments: engagements.filter(e => e.engagementType === 'comment').length,
    };
  }

  // User interaction operations
  async getUserInteractions(
    userId: string, 
    options?: { summaryId?: string; limit?: number; targetType?: string; since?: Date }
  ): Promise<UserInteraction[]> {
    const conditions = [eq(userInteractions.userId, userId)];
    
    if (options?.summaryId) {
      conditions.push(eq(userInteractions.summaryId, options.summaryId));
    }
    if (options?.targetType) {
      conditions.push(eq(userInteractions.targetType, options.targetType));
    }
    if (options?.since) {
      conditions.push(gte(userInteractions.createdAt, options.since));
    }
    
    let query = db
      .select()
      .from(userInteractions)
      .where(and(...conditions))
      .orderBy(desc(userInteractions.createdAt));
      
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  async createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction> {
    const [userInteraction] = await db
      .insert(userInteractions)
      .values(interaction)
      .returning();
    return userInteraction;
  }

  async deleteUserInteraction(userId: string, summaryId: string, interactionType: string): Promise<boolean> {
    const result = await db
      .delete(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.summaryId, summaryId),
          eq(userInteractions.interactionType, interactionType)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async updateUserPreferences(userId: string, updates: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    // Upsert pattern: try update first, if no rows affected, insert
    const [existing] = await db
      .update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (existing) {
      return existing;
    }

    // If no existing record, create new one
    const [newPreferences] = await db
      .insert(userPreferences)
      .values({ ...updates, userId })
      .returning();
    return newPreferences;
  }

  // Knowledge stack operations
  async getKnowledgeStack(id: string): Promise<KnowledgeStack | undefined> {
    const [stack] = await db.select().from(knowledgeStacks).where(eq(knowledgeStacks.id, id));
    return stack || undefined;
  }

  async getKnowledgeStacks(limit = 50, offset = 0): Promise<KnowledgeStack[]> {
    return await db
      .select()
      .from(knowledgeStacks)
      .where(eq(knowledgeStacks.isPublic, true))
      .orderBy(desc(knowledgeStacks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getKnowledgeStacksByUser(userId: string): Promise<KnowledgeStack[]> {
    return await db
      .select()
      .from(knowledgeStacks)
      .where(eq(knowledgeStacks.creatorId, userId))
      .orderBy(desc(knowledgeStacks.createdAt));
  }

  async createKnowledgeStack(insertStack: InsertKnowledgeStack): Promise<KnowledgeStack> {
    const [stack] = await db
      .insert(knowledgeStacks)
      .values(insertStack)
      .returning();
    return stack;
  }

  async updateKnowledgeStack(id: string, updates: Partial<InsertKnowledgeStack>): Promise<KnowledgeStack | undefined> {
    const [stack] = await db
      .update(knowledgeStacks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(knowledgeStacks.id, id))
      .returning();
    return stack || undefined;
  }

  async deleteKnowledgeStack(id: string): Promise<boolean> {
    const result = await db.delete(knowledgeStacks).where(eq(knowledgeStacks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Analytics and search
  async getTrendingSummaries(limit = 10): Promise<Summary[]> {
    // Get summaries with most interactions in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingIds = await db
      .select({
        summaryId: userInteractions.summaryId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(userInteractions)
      .where(sql`${userInteractions.createdAt} >= ${sevenDaysAgo}`)
      .groupBy(userInteractions.summaryId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    if (trendingIds.length === 0) {
      return this.getSummaries(limit, 0);
    }

    return await db
      .select()
      .from(summaries)
      .where(inArray(summaries.id, trendingIds.map(t => t.summaryId)))
      .orderBy(desc(summaries.createdAt));
  }

  async searchSummaries(query: string, limit = 20): Promise<Summary[]> {
    return await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.isPublic, true),
          sql`(
            ${summaries.title} ILIKE ${`%${query}%`} OR 
            ${summaries.description} ILIKE ${`%${query}%`} OR 
            ${summaries.summary} ILIKE ${`%${query}%`}
          )`
        )
      )
      .orderBy(desc(summaries.createdAt))
      .limit(limit);
  }

  async getUserStats(userId: string): Promise<{
    summariesCount: number;
    bountiesCount: number;
    interactionsCount: number;
    stacksCount: number;
  }> {
    const [stats] = await db
      .select({
        summariesCount: sql<number>`count(distinct ${summaries.id})`.as('summariesCount'),
        bountiesCount: sql<number>`count(distinct ${bounties.id})`.as('bountiesCount'),
        interactionsCount: sql<number>`count(distinct ${userInteractions.id})`.as('interactionsCount'),
        stacksCount: sql<number>`count(distinct ${knowledgeStacks.id})`.as('stacksCount'),
      })
      .from(users)
      .leftJoin(summaries, eq(summaries.creatorId, users.id))
      .leftJoin(bounties, eq(bounties.creatorId, users.id))
      .leftJoin(userInteractions, eq(userInteractions.userId, users.id))
      .leftJoin(knowledgeStacks, eq(knowledgeStacks.creatorId, users.id))
      .where(eq(users.id, userId));

    return {
      summariesCount: stats?.summariesCount || 0,
      bountiesCount: stats?.bountiesCount || 0,
      interactionsCount: stats?.interactionsCount || 0,
      stacksCount: stats?.stacksCount || 0,
    };
  }

  // User notes operations
  async getUserNote(id: string): Promise<UserNote | undefined> {
    const [note] = await db.select().from(userNotes).where(eq(userNotes.id, id));
    return note || undefined;
  }

  async getUserNotes(userId: string, summaryId?: string): Promise<UserNote[]> {
    const conditions = [eq(userNotes.userId, userId)];
    if (summaryId) {
      conditions.push(eq(userNotes.summaryId, summaryId));
    }

    return await db
      .select()
      .from(userNotes)
      .where(and(...conditions))
      .orderBy(desc(userNotes.createdAt));
  }

  async getUserNotesBySummary(summaryId: string): Promise<UserNote[]> {
    return await db
      .select()
      .from(userNotes)
      .where(eq(userNotes.summaryId, summaryId))
      .orderBy(desc(userNotes.createdAt));
  }

  async createUserNote(note: InsertUserNote): Promise<UserNote> {
    const [userNote] = await db
      .insert(userNotes)
      .values(note)
      .returning();
    return userNote;
  }

  async updateUserNote(id: string, updates: Partial<InsertUserNote>): Promise<UserNote | undefined> {
    const [note] = await db
      .update(userNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userNotes.id, id))
      .returning();
    return note || undefined;
  }

  async deleteUserNote(id: string): Promise<boolean> {
    const result = await db.delete(userNotes).where(eq(userNotes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Chat message operations
  async getChatMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return chatMessage;
  }

  // Educational content operations
  async getCryptoLeader(id: string): Promise<CryptoLeader | undefined> {
    const [leader] = await db.select().from(cryptoLeaders).where(eq(cryptoLeaders.id, id));
    return leader || undefined;
  }

  async getCryptoLeaderByFid(fid: number): Promise<CryptoLeader | undefined> {
    const [leader] = await db.select().from(cryptoLeaders).where(eq(cryptoLeaders.fid, fid));
    return leader || undefined;
  }

  async getCryptoLeaders(limit = 50): Promise<CryptoLeader[]> {
    return await db
      .select()
      .from(cryptoLeaders)
      .where(eq(cryptoLeaders.isActive, true))
      .orderBy(desc(cryptoLeaders.followerCount))
      .limit(limit);
  }

  async createCryptoLeader(insertLeader: InsertCryptoLeader): Promise<CryptoLeader> {
    const [leader] = await db
      .insert(cryptoLeaders)
      .values(insertLeader)
      .returning();
    return leader;
  }

  async updateCryptoLeader(id: string, updates: Partial<InsertCryptoLeader>): Promise<CryptoLeader | undefined> {
    const [leader] = await db
      .update(cryptoLeaders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cryptoLeaders.id, id))
      .returning();
    return leader || undefined;
  }

  async getCuratedCast(id: string): Promise<CuratedCast | undefined> {
    const [cast] = await db.select().from(curatedCasts).where(eq(curatedCasts.id, id));
    return cast || undefined;
  }

  async getCuratedCastsByLeader(leaderId: string): Promise<CuratedCast[]> {
    return await db
      .select()
      .from(curatedCasts)
      .where(eq(curatedCasts.leaderId, leaderId))
      .orderBy(desc(curatedCasts.priority), desc(curatedCasts.publishedAt))
      .limit(10);
  }

  async createCuratedCast(insertCast: InsertCuratedCast): Promise<CuratedCast> {
    const [cast] = await db
      .insert(curatedCasts)
      .values(insertCast)
      .returning();
    return cast;
  }

  async getTopicTag(id: string): Promise<TopicTag | undefined> {
    const [tag] = await db.select().from(topicTags).where(eq(topicTags.id, id));
    return tag || undefined;
  }

  async getTopicTags(category?: string): Promise<TopicTag[]> {
    const conditions = category ? [eq(topicTags.category, category)] : [];
    return await db
      .select()
      .from(topicTags)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(topicTags.name);
  }

  async createTopicTag(insertTag: InsertTopicTag): Promise<TopicTag> {
    const [tag] = await db
      .insert(topicTags)
      .values(insertTag)
      .returning();
    return tag;
  }

  async getLearningResource(id: string): Promise<LearningResource | undefined> {
    const [resource] = await db.select().from(learningResources).where(eq(learningResources.id, id));
    return resource || undefined;
  }

  async getLearningResourcesByLeader(leaderId: string): Promise<LearningResource[]> {
    return await db
      .select()
      .from(learningResources)
      .where(eq(learningResources.leaderId, leaderId))
      .orderBy(desc(learningResources.priority), learningResources.title)
      .limit(10);
  }

  async createLearningResource(insertResource: InsertLearningResource): Promise<LearningResource> {
    const [resource] = await db
      .insert(learningResources)
      .values(insertResource)
      .returning();
    return resource;
  }

  async getLeaderEducationData(leaderId: string): Promise<LeaderEducationData | undefined> {
    const leader = await this.getCryptoLeader(leaderId);
    if (!leader) return undefined;

    const [notableCasts, resources] = await Promise.all([
      this.getCuratedCastsByLeader(leaderId),
      this.getLearningResourcesByLeader(leaderId)
    ]);

    // Get topic tags related to this leader
    const relatedTopics = await db
      .select()
      .from(topicTags)
      .where(sql`${topicTags.relatedLeaderIds} @> ${JSON.stringify([leaderId])}`);

    // Calculate engagement metrics
    const engagement = {
      avgLikes: notableCasts.length > 0 ? Math.round(notableCasts.reduce((sum, cast) => sum + (cast.likesCount || 0), 0) / notableCasts.length) : 0,
      avgRecasts: notableCasts.length > 0 ? Math.round(notableCasts.reduce((sum, cast) => sum + (cast.recastsCount || 0), 0) / notableCasts.length) : 0,
      totalEngagement: notableCasts.reduce((sum, cast) => sum + (cast.likesCount || 0) + (cast.recastsCount || 0) + (cast.repliesCount || 0), 0)
    };

    return {
      profile: leader,
      notableCasts,
      resources,
      topics: relatedTopics,
      engagement
    };
  }

  // Knowledge Avatar implementations
  async getKnowledgeAvatar(id: string): Promise<KnowledgeAvatar | undefined> {
    const [avatar] = await db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, id));
    return avatar || undefined;
  }

  async getKnowledgeAvatarByHandle(handle: string): Promise<KnowledgeAvatar | undefined> {
    const [avatar] = await db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.handle, handle));
    return avatar || undefined;
  }

  async getKnowledgeAvatars(limit = 50, offset = 0): Promise<KnowledgeAvatar[]> {
    return await db
      .select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.isActive, true))
      .orderBy(desc(knowledgeAvatars.followerCount))
      .limit(limit)
      .offset(offset);
  }

  async createKnowledgeAvatar(insertAvatar: InsertKnowledgeAvatar): Promise<KnowledgeAvatar> {
    const [avatar] = await db
      .insert(knowledgeAvatars)
      .values(insertAvatar)
      .returning();
    return avatar;
  }

  async updateKnowledgeAvatar(id: string, updates: Partial<InsertKnowledgeAvatar>): Promise<KnowledgeAvatar | undefined> {
    const [avatar] = await db
      .update(knowledgeAvatars)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(knowledgeAvatars.id, id))
      .returning();
    return avatar || undefined;
  }

  async deleteKnowledgeAvatar(id: string): Promise<boolean> {
    const result = await db.delete(knowledgeAvatars).where(eq(knowledgeAvatars.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Avatar Following implementations
  async followAvatar(userId: string, avatarId: string): Promise<AvatarFollow> {
    const [follow] = await db
      .insert(avatarFollows)
      .values({
        id: sql`gen_random_uuid()`,
        userId,
        avatarId,
        notificationsEnabled: true,
        followedAt: new Date()
      })
      .returning();
    return follow;
  }

  async unfollowAvatar(userId: string, avatarId: string): Promise<boolean> {
    const result = await db
      .delete(avatarFollows)
      .where(and(
        eq(avatarFollows.userId, userId),
        eq(avatarFollows.avatarId, avatarId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAvatarFollowsByUserId(userId: string): Promise<AvatarFollow[]> {
    return await db
      .select()
      .from(avatarFollows)
      .where(eq(avatarFollows.userId, userId))
      .orderBy(desc(avatarFollows.followedAt));
  }

  async getUserFollowedAvatars(userId: string): Promise<(AvatarFollow & { avatar: KnowledgeAvatar })[]> {
    return await db
      .select({
        id: avatarFollows.id,
        userId: avatarFollows.userId,
        avatarId: avatarFollows.avatarId,
        notificationsEnabled: avatarFollows.notificationsEnabled,
        followedAt: avatarFollows.followedAt,
        avatar: knowledgeAvatars
      })
      .from(avatarFollows)
      .innerJoin(knowledgeAvatars, eq(avatarFollows.avatarId, knowledgeAvatars.id))
      .where(eq(avatarFollows.userId, userId))
      .orderBy(desc(avatarFollows.followedAt));
  }

  async getAvatarFollowers(avatarId: string): Promise<(AvatarFollow & { user: User })[]> {
    return await db
      .select({
        id: avatarFollows.id,
        userId: avatarFollows.userId,
        avatarId: avatarFollows.avatarId,
        notificationsEnabled: avatarFollows.notificationsEnabled,
        followedAt: avatarFollows.followedAt,
        user: users
      })
      .from(avatarFollows)
      .innerJoin(users, eq(avatarFollows.userId, users.id))
      .where(eq(avatarFollows.avatarId, avatarId))
      .orderBy(desc(avatarFollows.followedAt));
  }

  async isFollowingAvatar(userId: string, avatarId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(avatarFollows)
      .where(and(
        eq(avatarFollows.userId, userId),
        eq(avatarFollows.avatarId, avatarId)
      ))
      .limit(1);
    return !!follow;
  }

  // Avatar Content & Interactions implementations
  async createAvatarContentInteraction(interaction: InsertAvatarContentInteraction): Promise<AvatarContentInteraction> {
    const [created] = await db
      .insert(avatarContentInteractions)
      .values(interaction)
      .returning();
    return created;
  }

  async getAvatarContentInteractions(avatarId: string, limit = 50): Promise<AvatarContentInteraction[]> {
    return await db
      .select()
      .from(avatarContentInteractions)
      .where(eq(avatarContentInteractions.avatarId, avatarId))
      .orderBy(desc(avatarContentInteractions.createdAt))
      .limit(limit);
  }

  async getUserAvatarInteractions(userId: string, limit = 50): Promise<AvatarContentInteraction[]> {
    return await db
      .select()
      .from(avatarContentInteractions)
      .where(eq(avatarContentInteractions.userId, userId))
      .orderBy(desc(avatarContentInteractions.createdAt))
      .limit(limit);
  }

  // Avatar Insights implementations
  async getAvatarInsight(id: string): Promise<AvatarInsight | undefined> {
    const [insight] = await db.select().from(avatarInsights).where(eq(avatarInsights.id, id));
    return insight || undefined;
  }

  async getAvatarInsights(avatarId: string, category?: string): Promise<AvatarInsight[]> {
    const conditions = [eq(avatarInsights.avatarId, avatarId)];
    if (category) {
      conditions.push(eq(avatarInsights.category, category));
    }

    return await db
      .select()
      .from(avatarInsights)
      .where(and(...conditions))
      .orderBy(desc(avatarInsights.publishedAt), desc(avatarInsights.confidence))
      .limit(100);
  }

  async createAvatarInsight(insight: InsertAvatarInsight): Promise<AvatarInsight> {
    const [created] = await db
      .insert(avatarInsights)
      .values(insight)
      .returning();
    return created;
  }

  async updateAvatarInsight(id: string, updates: Partial<InsertAvatarInsight>): Promise<AvatarInsight | undefined> {
    const [insight] = await db
      .update(avatarInsights)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(avatarInsights.id, id))
      .returning();
    return insight || undefined;
  }

  async deleteAvatarInsight(id: string): Promise<boolean> {
    const result = await db.delete(avatarInsights).where(eq(avatarInsights.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Pattern Recognition implementations

  // Chart Pattern operations
  async getChartPattern(id: string): Promise<ChartPattern | undefined> {
    const [pattern] = await db.select().from(chartPatterns).where(eq(chartPatterns.id, id));
    return pattern || undefined;
  }

  async getChartPatterns(options?: {
    symbol?: string;
    assetType?: string;
    patternType?: string;
    timeframe?: string;
    minConfidence?: number;
    isComplete?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ChartPattern[]> {
    const conditions = [];
    
    if (options?.symbol) {
      conditions.push(eq(chartPatterns.symbol, options.symbol));
    }
    if (options?.assetType) {
      conditions.push(eq(chartPatterns.assetType, options.assetType));
    }
    if (options?.patternType) {
      conditions.push(eq(chartPatterns.patternType, options.patternType));
    }
    if (options?.timeframe) {
      conditions.push(eq(chartPatterns.timeframe, options.timeframe));
    }
    if (options?.minConfidence) {
      conditions.push(sql`${chartPatterns.confidence} >= ${options.minConfidence}`);
    }
    if (options?.isComplete !== undefined) {
      conditions.push(eq(chartPatterns.isComplete, options.isComplete));
    }

    let query = db
      .select()
      .from(chartPatterns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(chartPatterns.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async getChartPatternsBySymbol(symbol: string, timeframe?: string): Promise<ChartPattern[]> {
    const conditions = [eq(chartPatterns.symbol, symbol)];
    
    if (timeframe) {
      conditions.push(eq(chartPatterns.timeframe, timeframe));
    }

    return await db
      .select()
      .from(chartPatterns)
      .where(and(...conditions))
      .orderBy(desc(chartPatterns.createdAt))
      .limit(20);
  }

  async createChartPattern(insertPattern: InsertChartPattern): Promise<ChartPattern> {
    const [pattern] = await db
      .insert(chartPatterns)
      .values(insertPattern)
      .returning();
    return pattern;
  }

  async updateChartPattern(id: string, updates: Partial<InsertChartPattern>): Promise<ChartPattern | undefined> {
    const [pattern] = await db
      .update(chartPatterns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chartPatterns.id, id))
      .returning();
    return pattern || undefined;
  }

  async deleteChartPattern(id: string): Promise<boolean> {
    const result = await db.delete(chartPatterns).where(eq(chartPatterns.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Trend Analysis operations
  async getTrendAnalysis(id: string): Promise<TrendAnalysis | undefined> {
    const [analysis] = await db.select().from(trendAnalysis).where(eq(trendAnalysis.id, id));
    return analysis || undefined;
  }

  async getTrendAnalysesBySymbol(symbol: string, timeframe?: string): Promise<TrendAnalysis[]> {
    const conditions = [eq(trendAnalysis.symbol, symbol)];
    
    if (timeframe) {
      conditions.push(eq(trendAnalysis.timeframe, timeframe));
    }

    return await db
      .select()
      .from(trendAnalysis)
      .where(and(...conditions))
      .orderBy(desc(trendAnalysis.createdAt))
      .limit(10);
  }

  async getLatestTrendAnalysis(symbol: string, timeframe?: string): Promise<TrendAnalysis | undefined> {
    const conditions = [eq(trendAnalysis.symbol, symbol)];
    
    if (timeframe) {
      conditions.push(eq(trendAnalysis.timeframe, timeframe));
    }

    const [latest] = await db
      .select()
      .from(trendAnalysis)
      .where(and(...conditions))
      .orderBy(desc(trendAnalysis.analysisTime))
      .limit(1);

    return latest || undefined;
  }

  async createTrendAnalysis(insertAnalysis: InsertTrendAnalysis): Promise<TrendAnalysis> {
    const [analysis] = await db
      .insert(trendAnalysis)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async updateTrendAnalysis(id: string, updates: Partial<InsertTrendAnalysis>): Promise<TrendAnalysis | undefined> {
    const [analysis] = await db
      .update(trendAnalysis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trendAnalysis.id, id))
      .returning();
    return analysis || undefined;
  }

  async deleteTrendAnalysis(id: string): Promise<boolean> {
    const result = await db.delete(trendAnalysis).where(eq(trendAnalysis.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Market Cycle operations
  async getMarketCycle(id: string): Promise<MarketCycle | undefined> {
    const [cycle] = await db.select().from(marketCycles).where(eq(marketCycles.id, id));
    return cycle || undefined;
  }

  async getMarketCycles(options?: {
    symbol?: string;
    assetType?: string;
    cycleType?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<MarketCycle[]> {
    const conditions = [];
    
    if (options?.symbol) {
      conditions.push(eq(marketCycles.symbol, options.symbol));
    }
    if (options?.assetType) {
      conditions.push(eq(marketCycles.assetType, options.assetType));
    }
    if (options?.cycleType) {
      conditions.push(eq(marketCycles.cycleType, options.cycleType));
    }
    if (options?.isActive !== undefined) {
      if (options.isActive) {
        conditions.push(sql`${marketCycles.cycleEnd} IS NULL`);
      } else {
        conditions.push(sql`${marketCycles.cycleEnd} IS NOT NULL`);
      }
    }

    let query = db
      .select()
      .from(marketCycles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(marketCycles.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async getMarketCyclesBySymbol(symbol: string): Promise<MarketCycle[]> {
    return await db
      .select()
      .from(marketCycles)
      .where(eq(marketCycles.symbol, symbol))
      .orderBy(desc(marketCycles.cycleStart))
      .limit(10);
  }

  async getActiveMarketCycles(): Promise<MarketCycle[]> {
    return await db
      .select()
      .from(marketCycles)
      .where(sql`${marketCycles.cycleEnd} IS NULL`)
      .orderBy(desc(marketCycles.cycleStart));
  }

  async createMarketCycle(insertCycle: InsertMarketCycle): Promise<MarketCycle> {
    const [cycle] = await db
      .insert(marketCycles)
      .values(insertCycle)
      .returning();
    return cycle;
  }

  async updateMarketCycle(id: string, updates: Partial<InsertMarketCycle>): Promise<MarketCycle | undefined> {
    const [cycle] = await db
      .update(marketCycles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketCycles.id, id))
      .returning();
    return cycle || undefined;
  }

  async deleteMarketCycle(id: string): Promise<boolean> {
    const result = await db.delete(marketCycles).where(eq(marketCycles.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Pattern Alert operations
  async getPatternAlert(id: string): Promise<PatternAlert | undefined> {
    const [alert] = await db.select().from(patternAlerts).where(eq(patternAlerts.id, id));
    return alert || undefined;
  }

  async getPatternAlerts(options?: {
    symbol?: string;
    assetType?: string;
    alertType?: string;
    severity?: string;
    isActive?: boolean;
    isAcknowledged?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PatternAlert[]> {
    const conditions = [];
    
    if (options?.symbol) {
      conditions.push(eq(patternAlerts.symbol, options.symbol));
    }
    if (options?.assetType) {
      conditions.push(eq(patternAlerts.assetType, options.assetType));
    }
    if (options?.alertType) {
      conditions.push(eq(patternAlerts.alertType, options.alertType));
    }
    if (options?.severity) {
      conditions.push(eq(patternAlerts.severity, options.severity));
    }
    if (options?.isActive !== undefined) {
      if (options.isActive) {
        conditions.push(sql`${patternAlerts.resolvedAt} IS NULL`);
      } else {
        conditions.push(sql`${patternAlerts.resolvedAt} IS NOT NULL`);
      }
    }
    if (options?.isAcknowledged !== undefined) {
      conditions.push(eq(patternAlerts.isAcknowledged, options.isAcknowledged));
    }

    let query = db
      .select()
      .from(patternAlerts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(patternAlerts.triggeredAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async getActivePatternAlerts(symbol?: string): Promise<PatternAlert[]> {
    const conditions = [sql`${patternAlerts.resolvedAt} IS NULL`];
    
    if (symbol) {
      conditions.push(eq(patternAlerts.symbol, symbol));
    }

    return await db
      .select()
      .from(patternAlerts)
      .where(and(...conditions))
      .orderBy(desc(patternAlerts.triggeredAt))
      .limit(50);
  }

  async getPatternAlertsByPattern(patternId: string): Promise<PatternAlert[]> {
    return await db
      .select()
      .from(patternAlerts)
      .where(eq(patternAlerts.patternId, patternId))
      .orderBy(desc(patternAlerts.triggeredAt));
  }

  async createPatternAlert(insertAlert: InsertPatternAlert): Promise<PatternAlert> {
    const [alert] = await db
      .insert(patternAlerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async updatePatternAlert(id: string, updates: Partial<InsertPatternAlert>): Promise<PatternAlert | undefined> {
    const [alert] = await db
      .update(patternAlerts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patternAlerts.id, id))
      .returning();
    return alert || undefined;
  }

  async acknowledgePatternAlert(id: string): Promise<PatternAlert | undefined> {
    const [alert] = await db
      .update(patternAlerts)
      .set({ 
        isAcknowledged: true, 
        acknowledgedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(patternAlerts.id, id))
      .returning();
    return alert || undefined;
  }

  async deletePatternAlert(id: string): Promise<boolean> {
    const result = await db.delete(patternAlerts).where(eq(patternAlerts.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // AI Trading Setup operations
  async getAiTradingSetup(id: string): Promise<AiTradingSetup | undefined> {
    const [setup] = await db.select().from(aiTradingSetups).where(eq(aiTradingSetups.id, id));
    return setup || undefined;
  }

  async getAiTradingSetups(options?: {
    symbol?: string;
    assetType?: string;
    setupType?: string;
    setupCategory?: string;
    riskProfile?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AiTradingSetup[]> {
    const conditions = [];
    
    if (options?.symbol) {
      conditions.push(eq(aiTradingSetups.symbol, options.symbol));
    }
    if (options?.assetType) {
      conditions.push(eq(aiTradingSetups.assetType, options.assetType));
    }
    if (options?.setupType) {
      conditions.push(eq(aiTradingSetups.setupType, options.setupType));
    }
    if (options?.setupCategory) {
      conditions.push(eq(aiTradingSetups.setupCategory, options.setupCategory));
    }
    if (options?.riskProfile) {
      conditions.push(eq(aiTradingSetups.riskProfile, options.riskProfile));
    }
    if (options?.status) {
      conditions.push(eq(aiTradingSetups.status, options.status));
    }

    let query = db
      .select()
      .from(aiTradingSetups)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(aiTradingSetups.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async getAiTradingSetupsBySymbol(symbol: string): Promise<AiTradingSetup[]> {
    return await db
      .select()
      .from(aiTradingSetups)
      .where(eq(aiTradingSetups.symbol, symbol))
      .orderBy(desc(aiTradingSetups.createdAt))
      .limit(10);
  }

  async getActiveAiTradingSetups(): Promise<AiTradingSetup[]> {
    return await db
      .select()
      .from(aiTradingSetups)
      .where(eq(aiTradingSetups.status, 'active'))
      .orderBy(desc(aiTradingSetups.createdAt));
  }

  async createAiTradingSetup(insertSetup: InsertAiTradingSetup): Promise<AiTradingSetup> {
    const [setup] = await db
      .insert(aiTradingSetups)
      .values(insertSetup)
      .returning();
    return setup;
  }

  async updateAiTradingSetup(id: string, updates: Partial<InsertAiTradingSetup>): Promise<AiTradingSetup | undefined> {
    const [setup] = await db
      .update(aiTradingSetups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiTradingSetups.id, id))
      .returning();
    return setup || undefined;
  }

  async deleteAiTradingSetup(id: string): Promise<boolean> {
    const result = await db.delete(aiTradingSetups).where(eq(aiTradingSetups.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Entrepreneur prediction operations
  async getEntrepreneurPrediction(id: string): Promise<EntrepreneurPrediction | undefined> {
    const [prediction] = await db.select().from(entrepreneurPredictions).where(eq(entrepreneurPredictions.id, id));
    return prediction || undefined;
  }

  async getEntrepreneurPredictions(options?: {
    entrepreneurName?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<EntrepreneurPrediction[]> {
    const conditions = [];
    
    if (options?.entrepreneurName) {
      conditions.push(eq(entrepreneurPredictions.entrepreneurName, options.entrepreneurName));
    }
    if (options?.status) {
      conditions.push(eq(entrepreneurPredictions.status, options.status));
    }
    if (options?.category) {
      conditions.push(eq(entrepreneurPredictions.category, options.category));
    }
    
    let query = db
      .select()
      .from(entrepreneurPredictions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(entrepreneurPredictions.predictionMadeAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  async getActivePredictions(entrepreneurName?: string): Promise<EntrepreneurPrediction[]> {
    const conditions = [eq(entrepreneurPredictions.status, 'active')];
    
    if (entrepreneurName) {
      conditions.push(eq(entrepreneurPredictions.entrepreneurName, entrepreneurName));
    }
    
    return await db.select().from(entrepreneurPredictions)
      .where(and(...conditions))
      .orderBy(desc(entrepreneurPredictions.predictionMadeAt));
  }

  async getPredictionsByTimeframe(timeframe: string): Promise<EntrepreneurPrediction[]> {
    return await db.select().from(entrepreneurPredictions)
      .where(eq(entrepreneurPredictions.targetTimeframe, timeframe))
      .orderBy(desc(entrepreneurPredictions.predictionMadeAt));
  }

  async createEntrepreneurPrediction(prediction: InsertEntrepreneurPrediction): Promise<EntrepreneurPrediction> {
    const [newPrediction] = await db.insert(entrepreneurPredictions).values(prediction).returning();
    return newPrediction;
  }

  async updateEntrepreneurPrediction(id: string, updates: Partial<EntrepreneurPrediction>): Promise<EntrepreneurPrediction | undefined> {
    const [updated] = await db.update(entrepreneurPredictions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(entrepreneurPredictions.id, id))
      .returning();
    return updated || undefined;
  }

  async evaluatePrediction(id: string, outcome: string, accuracyScore: number): Promise<EntrepreneurPrediction | undefined> {
    const [updated] = await db.update(entrepreneurPredictions)
      .set({
        status: 'evaluated',
        actualOutcome: outcome,
        accuracyScore: accuracyScore,
        evaluatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(entrepreneurPredictions.id, id))
      .returning();
    return updated || undefined;
  }

  async getEntrepreneurAccuracyStats(entrepreneurName: string): Promise<{
    totalPredictions: number;
    evaluatedPredictions: number;
    averageAccuracy: number;
    accuracyByCategory: Record<string, number>;
    recentAccuracy: number;
  }> {
    // Get all predictions for this entrepreneur
    const allPredictions = await db.select().from(entrepreneurPredictions)
      .where(eq(entrepreneurPredictions.entrepreneurName, entrepreneurName));
    
    const evaluatedPredictions = allPredictions.filter(p => p.status === 'evaluated' && p.accuracyScore !== null);
    
    // Calculate average accuracy
    const averageAccuracy = evaluatedPredictions.length > 0 
      ? evaluatedPredictions.reduce((sum, p) => sum + (p.accuracyScore || 0), 0) / evaluatedPredictions.length
      : 0;
    
    // Calculate accuracy by category
    const accuracyByCategory: Record<string, number> = {};
    const categorizedPredictions = evaluatedPredictions.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {} as Record<string, typeof evaluatedPredictions>);
    
    for (const [category, predictions] of Object.entries(categorizedPredictions)) {
      accuracyByCategory[category] = predictions.reduce((sum, p) => sum + (p.accuracyScore || 0), 0) / predictions.length;
    }
    
    // Calculate recent accuracy (last 10 evaluated predictions)
    const recentPredictions = evaluatedPredictions
      .sort((a, b) => new Date(b.evaluatedAt!).getTime() - new Date(a.evaluatedAt!).getTime())
      .slice(0, 10);
    
    const recentAccuracy = recentPredictions.length > 0
      ? recentPredictions.reduce((sum, p) => sum + (p.accuracyScore || 0), 0) / recentPredictions.length
      : 0;
    
    return {
      totalPredictions: allPredictions.length,
      evaluatedPredictions: evaluatedPredictions.length,
      averageAccuracy: Math.round(averageAccuracy),
      accuracyByCategory: Object.fromEntries(
        Object.entries(accuracyByCategory).map(([k, v]) => [k, Math.round(v)])
      ),
      recentAccuracy: Math.round(recentAccuracy)
    };
  }

  // Referral System operations
  async generateUniqueReferralCode(): Promise<string> {
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
    let code: string;
    let exists = true;

    while (exists) {
      code = `STREAM${nanoid()}`;
      const existing = await this.getReferralCode(code);
      exists = !!existing;
    }

    return code!;
  }

  async createReferralCode(referralCode: InsertReferralCode): Promise<ReferralCode> {
    const [newCode] = await db.insert(referralCodes).values(referralCode).returning();
    return newCode;
  }

  async getReferralCode(code: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db.select().from(referralCodes).where(eq(referralCodes.code, code));
    return referralCode || undefined;
  }

  async getReferralCodesByUser(userId: string): Promise<ReferralCode[]> {
    return await db.select().from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .orderBy(desc(referralCodes.createdAt));
  }

  async updateReferralCode(id: string, updates: Partial<ReferralCode>): Promise<ReferralCode | undefined> {
    const [updated] = await db.update(referralCodes)
      .set(updates as any)
      .where(eq(referralCodes.id, id))
      .returning();
    return updated || undefined;
  }

  async createReferralSignup(signup: InsertReferralSignup): Promise<ReferralSignup> {
    const [newSignup] = await db.insert(referralSignups).values(signup).returning();
    return newSignup;
  }

  async getReferralSignups(referrerId: string): Promise<ReferralSignup[]> {
    return await db.select().from(referralSignups)
      .where(eq(referralSignups.referrerId, referrerId))
      .orderBy(desc(referralSignups.createdAt));
  }

  async claimReferralReward(signupId: string): Promise<ReferralSignup | undefined> {
    const [updated] = await db.update(referralSignups)
      .set({ rewardClaimed: true })
      .where(and(
        eq(referralSignups.id, signupId),
        eq(referralSignups.rewardClaimed, false)
      ))
      .returning();
    return updated || undefined;
  }

  async getReferralLeaderboard(limit: number = 10): Promise<Array<{ userId: string; username: string; totalRewardsEarned: number; totalSignups: number }>> {
    const leaderboard = await db.select({
      userId: referralCodes.userId,
      username: users.username,
      totalRewardsEarned: referralCodes.totalRewardsEarned,
      totalSignups: referralCodes.totalSignups
    })
    .from(referralCodes)
    .innerJoin(users, eq(referralCodes.userId, users.id))
    .orderBy(desc(referralCodes.totalRewardsEarned))
    .limit(limit);

    return leaderboard.map(row => ({
      userId: row.userId,
      username: row.username,
      totalRewardsEarned: row.totalRewardsEarned || 0,
      totalSignups: row.totalSignups || 0
    }));
  }

  // Collaboration operations
  async addCollaborator(data: { bountyId: string; userId: string; role: string; rewardShare: number; status: string; invitedBy: string }) {
    const [collaborator] = await db.insert(bountyCollaborators)
      .values(data as any)
      .returning();
    return collaborator;
  }

  async updateCollaboratorShare(bountyId: string, userId: string, rewardShare: number) {
    const [updated] = await db.update(bountyCollaborators)
      .set({ rewardShare })
      .where(and(
        eq(bountyCollaborators.bountyId, bountyId),
        eq(bountyCollaborators.userId, userId)
      ))
      .returning();
    return updated;
  }

  async updateCollaborationSession(data: { bountyId: string; activeUsers: any[]; contentSnapshot: string; lastActivity: Date }) {
    const existing = await this.getCollaborationSession(data.bountyId);
    
    if (existing) {
      const [updated] = await db.update(collaborationSessions)
        .set({
          activeUsers: data.activeUsers as any,
          contentSnapshot: data.contentSnapshot,
          lastActivity: data.lastActivity
        })
        .where(eq(collaborationSessions.bountyId, data.bountyId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(collaborationSessions)
        .values({
          bountyId: data.bountyId,
          activeUsers: data.activeUsers as any,
          contentSnapshot: data.contentSnapshot,
          lastActivity: data.lastActivity
        })
        .returning();
      return created;
    }
  }

  async getCollaborationSession(bountyId: string) {
    const [session] = await db.select()
      .from(collaborationSessions)
      .where(eq(collaborationSessions.bountyId, bountyId));
    return session || undefined;
  }

  async getCollaborators(bountyId: string) {
    return await db.select()
      .from(bountyCollaborators)
      .where(eq(bountyCollaborators.bountyId, bountyId));
  }

  // Bounty Template operations
  async getBountyTemplate(id: string): Promise<BountyTemplate | undefined> {
    const [template] = await db.select()
      .from(bountyTemplates)
      .where(eq(bountyTemplates.id, id));
    return template || undefined;
  }

  async getBountyTemplates(options?: { category?: string; difficulty?: string; limit?: number }): Promise<BountyTemplate[]> {
    let query = db.select().from(bountyTemplates).where(eq(bountyTemplates.isPublic, true));

    const conditions = [];
    if (options?.category) {
      conditions.push(eq(bountyTemplates.category, options.category));
    }
    if (options?.difficulty) {
      conditions.push(eq(bountyTemplates.difficulty, options.difficulty));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(bountyTemplates.usageCount)) as any;

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    return await query;
  }

  async createBountyTemplate(template: InsertBountyTemplate): Promise<BountyTemplate> {
    const [newTemplate] = await db.insert(bountyTemplates)
      .values(template as any)
      .returning();
    return newTemplate;
  }

  async updateBountyTemplate(id: string, updates: Partial<InsertBountyTemplate>): Promise<BountyTemplate | undefined> {
    const [updated] = await db.update(bountyTemplates)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(bountyTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBountyTemplate(id: string): Promise<boolean> {
    const result = await db.delete(bountyTemplates)
      .where(eq(bountyTemplates.id, id));
    return (result as any).rowCount > 0;
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    await db.update(bountyTemplates)
      .set({ usageCount: sql`${bountyTemplates.usageCount} + 1` })
      .where(eq(bountyTemplates.id, id));
  }
}

export const storage = new DatabaseStorage();
