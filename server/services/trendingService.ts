import { db } from "../db";
import { bounties, bountyEngagements, tipContributions } from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import type { Bounty } from "@shared/schema";

export class TrendingService {
  // Calculate trending score for a bounty
  async calculateTrendingScore(bountyId: string): Promise<number> {
    const [bounty] = await db
      .select()
      .from(bounties)
      .where(eq(bounties.id, bountyId))
      .limit(1);

    if (!bounty || bounty.status !== 'open') {
      return 0;
    }

    // Get recent views (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEngagements = await db
      .select({ count: sql<number>`count(*)` })
      .from(bountyEngagements)
      .where(
        and(
          eq(bountyEngagements.bountyId, bountyId),
          gte(bountyEngagements.createdAt, twentyFourHoursAgo)
        )
      );

    const recentViews = Number(recentEngagements[0]?.count || 0);

    // Get total tip amount
    const tips = await db
      .select()
      .from(tipContributions)
      .where(eq(tipContributions.bountyId, bountyId));

    const totalTips = tips.reduce((sum, tip) => sum + tip.amount, 0);

    // Calculate time urgency (higher score for deadlines approaching)
    const timeRemaining = bounty.deadline ? bounty.deadline.getTime() - Date.now() : Infinity;
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    
    let urgencyScore = 0;
    if (hoursRemaining < 6) urgencyScore = 100;
    else if (hoursRemaining < 12) urgencyScore = 80;
    else if (hoursRemaining < 24) urgencyScore = 60;
    else if (hoursRemaining < 48) urgencyScore = 40;
    else if (hoursRemaining < 72) urgencyScore = 20;

    // Normalize reward amount (higher rewards = more trending)
    const rewardScore = Math.min(bounty.reward / 1000, 100); // Cap at 100

    // Weighted trending score calculation
    // Recent views: 30%, Total tips: 40%, Time urgency: 20%, Reward: 10%
    const trendingScore = 
      (recentViews * 0.3) +
      (Math.min(totalTips / 100, 100) * 0.4) +
      (urgencyScore * 0.2) +
      (rewardScore * 0.1);

    return Math.round(trendingScore);
  }

  // Get trending bounties
  async getTrendingBounties(limit: number = 10): Promise<Array<Bounty & { trendingScore: number }>> {
    // Get all open bounties
    const openBounties = await db
      .select()
      .from(bounties)
      .where(eq(bounties.status, 'open'));

    const now = new Date();

    // Filter out expired bounties (deadline has passed)
    const activeBounties = openBounties.filter(bounty => {
      if (!bounty.deadline) return true; // No deadline = still active
      return new Date(bounty.deadline) > now;
    });

    // Calculate trending score for each
    const bountiesWithScores = await Promise.all(
      activeBounties.map(async (bounty) => {
        const score = await this.calculateTrendingScore(bounty.id);
        return {
          ...bounty,
          trendingScore: score
        };
      })
    );

    // Sort by trending score and return top N
    return bountiesWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }

  // Get hot bounties (combination of recent + high reward)
  async getHotBounties(limit: number = 5): Promise<Bounty[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const hotBounties = await db
      .select()
      .from(bounties)
      .where(
        and(
          eq(bounties.status, 'open'),
          gte(bounties.createdAt, twentyFourHoursAgo)
        )
      )
      .orderBy(desc(bounties.reward))
      .limit(limit);

    return hotBounties;
  }

  // Get urgent bounties (deadline < 24 hours)
  async getUrgentBounties(limit: number = 5): Promise<Bounty[]> {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const urgentBounties = await db
      .select()
      .from(bounties)
      .where(eq(bounties.status, 'open'))
      .orderBy(bounties.deadline)
      .limit(50); // Get more to filter

    // Filter for deadlines within 24 hours
    const filtered = urgentBounties.filter(b => 
      b.deadline && 
      b.deadline > now && 
      b.deadline <= twentyFourHoursLater
    );

    return filtered.slice(0, limit);
  }

  // Track engagement
  async trackEngagement(
    bountyId: string,
    userId: string | null,
    engagementType: 'view' | 'share' | 'comment' | 'like' | 'bookmark',
    metadata?: any,
    ipAddress?: string
  ): Promise<void> {
    await db
      .insert(bountyEngagements)
      .values({
        bountyId,
        userId,
        engagementType,
        metadata,
        ipAddress
      });

    console.log(`📊 Tracked ${engagementType} for bounty ${bountyId}`);
  }

  // Get engagement stats for a bounty
  async getEngagementStats(bountyId: string): Promise<any> {
    const allEngagements = await db
      .select()
      .from(bountyEngagements)
      .where(eq(bountyEngagements.bountyId, bountyId));

    const views = allEngagements.filter(e => e.engagementType === 'view').length;
    const shares = allEngagements.filter(e => e.engagementType === 'share').length;
    const likes = allEngagements.filter(e => e.engagementType === 'like').length;
    const bookmarks = allEngagements.filter(e => e.engagementType === 'bookmark').length;
    const comments = allEngagements.filter(e => e.engagementType === 'comment').length;

    // Get unique viewers
    const uniqueViewers = new Set(
      allEngagements
        .filter(e => e.engagementType === 'view' && e.userId)
        .map(e => e.userId)
    ).size;

    return {
      totalViews: views,
      uniqueViewers,
      shares,
      likes,
      bookmarks,
      comments,
      totalEngagements: allEngagements.length
    };
  }

  // Get trending categories
  async getTrendingCategories(limit: number = 5): Promise<Array<{ category: string; count: number; totalReward: number }>> {
    const openBounties = await db
      .select()
      .from(bounties)
      .where(eq(bounties.status, 'open'));

    // Group by category
    const categoryMap = new Map<string, { count: number; totalReward: number }>();

    for (const bounty of openBounties) {
      const category = bounty.category || 'Uncategorized';
      const current = categoryMap.get(category) || { count: 0, totalReward: 0 };
      categoryMap.set(category, {
        count: current.count + 1,
        totalReward: current.totalReward + bounty.reward
      });
    }

    // Convert to array and sort by count
    const categories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        ...data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return categories;
  }

  // Get trending tokens (most used for bounties)
  async getTrendingTokens(): Promise<Array<{ tokenType: string; count: number; totalValue: number }>> {
    const allBounties = await db
      .select()
      .from(bounties)
      .where(eq(bounties.status, 'open'));

    // Group by token type
    const tokenMap = new Map<string, { count: number; totalValue: number }>();

    for (const bounty of allBounties) {
      const token = bounty.tokenType || 'STREAM';
      const current = tokenMap.get(token) || { count: 0, totalValue: 0 };
      tokenMap.set(token, {
        count: current.count + 1,
        totalValue: current.totalValue + bounty.reward
      });
    }

    return Array.from(tokenMap.entries())
      .map(([tokenType, data]) => ({
        tokenType,
        ...data
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }
}

export const trendingService = new TrendingService();
