import { 
  type User, 
  type InsertUser, 
  type Summary, 
  type InsertSummary,
  type Bounty, 
  type InsertBounty,
  type UserInteraction,
  type InsertUserInteraction,
  type KnowledgeStack,
  type InsertKnowledgeStack,
  type UserNote,
  type InsertUserNote,
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
  users,
  summaries,
  bounties,
  userInteractions,
  knowledgeStacks,
  userNotes,
  cryptoLeaders,
  curatedCasts,
  topicTags,
  learningResources,
  userPreferences
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, gte } from "drizzle-orm";

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

  // Analytics and search
  getTrendingSummaries(limit?: number): Promise<Summary[]>;
  searchSummaries(query: string, limit?: number): Promise<Summary[]>;
  getUserStats(userId: string): Promise<{
    summariesCount: number;
    bountiesCount: number;
    interactionsCount: number;
    stacksCount: number;
  }>;

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
}

export const storage = new DatabaseStorage();
