import { db } from "../db";
import { bountyHunters, bounties, bountyQualityScores } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import type { BountyHunter, InsertBountyHunter } from "@shared/schema";

// Badge definitions
const BADGES = {
  FIRST_BOUNTY: 'first_bounty',
  SPEED_DEMON: 'speed_demon', // Complete bounty in <6 hours
  QUALITY_MASTER: 'quality_master', // 3 bounties with 90+ score
  STREAK_5: 'streak_5',
  STREAK_10: 'streak_10',
  BIG_EARNER: 'big_earner', // Earned 10,000+ tokens
  SPECIALIST_DEFI: 'specialist_defi', // 5+ DeFi bounties
  SPECIALIST_NFT: 'specialist_nft',
  SPECIALIST_LAYER2: 'specialist_layer2',
  CENTURY_CLUB: 'century_club', // 100 completed bounties
  REPUTATION_1000: 'reputation_1000'
};

// Level thresholds (reputation needed for each level)
const LEVEL_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  500,  // Level 4
  1000, // Level 5
  2000, // Level 6
  4000, // Level 7
  7000, // Level 8
  10000,// Level 9
  15000 // Level 10
];

export class BountyHunterService {
  // Create or get hunter profile
  async getOrCreateHunter(userId: string, walletAddress: string, displayName?: string): Promise<BountyHunter> {
    const [existing] = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.userId, userId))
      .limit(1);

    if (existing) {
      return existing;
    }

    // Create new hunter
    const [newHunter] = await db
      .insert(bountyHunters)
      .values({
        userId,
        walletAddress,
        displayName: displayName || `Hunter ${walletAddress.slice(0, 6)}`,
        level: 1,
        reputation: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalEarned: 0,
        totalBounties: 0,
        completedBounties: 0,
        completionRate: 0,
        averageQuality: 0,
        badges: [],
        specializations: [],
        isActive: true
      })
      .returning();

    console.log(`🎯 Created new bounty hunter profile for user ${userId}`);
    return newHunter;
  }

  // Update hunter stats after bounty completion
  async updateHunterAfterCompletion(
    hunterId: string,
    bountyData: {
      reward: number;
      category?: string;
      completionTimeHours: number;
      qualityScore?: number;
    }
  ): Promise<BountyHunter> {
    const [hunter] = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.id, hunterId))
      .limit(1);

    if (!hunter) {
      throw new Error('Hunter not found');
    }

    // Calculate new stats
    const newCompletedBounties = hunter.completedBounties + 1;
    const newTotalEarned = hunter.totalEarned + bountyData.reward;
    const newCompletionRate = ((newCompletedBounties / (hunter.totalBounties + 1)) * 100);

    // Calculate average quality if score provided
    let newAverageQuality = hunter.averageQuality;
    if (bountyData.qualityScore) {
      newAverageQuality = ((hunter.averageQuality * hunter.completedBounties) + bountyData.qualityScore) / newCompletedBounties;
    }

    // Calculate average completion time
    const newAvgCompletionTime = hunter.averageCompletionTime
      ? ((hunter.averageCompletionTime * hunter.completedBounties) + bountyData.completionTimeHours) / newCompletedBounties
      : bountyData.completionTimeHours;

    // Update streak
    const now = new Date();
    const lastCompleted = hunter.lastCompletedAt;
    let newCurrentStreak = hunter.currentStreak;
    let newLongestStreak = hunter.longestStreak;

    if (lastCompleted) {
      const hoursSinceLastCompletion = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastCompletion <= 48) { // Within 48 hours = streak continues
        newCurrentStreak += 1;
      } else {
        newCurrentStreak = 1; // Streak broken, restart
      }
    } else {
      newCurrentStreak = 1;
    }

    newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);

    // Calculate reputation points
    const reputationGain = this.calculateReputationGain({
      qualityScore: bountyData.qualityScore || 70,
      completionTimeHours: bountyData.completionTimeHours,
      streak: newCurrentStreak
    });

    const newReputation = hunter.reputation + reputationGain;
    const newLevel = this.calculateLevel(newReputation);

    // Track specializations
    const newSpecializations = hunter.specializations || [];
    if (bountyData.category && !newSpecializations.includes(bountyData.category)) {
      // Add specialization if completed 3+ bounties in this category
      const categoryCount = await this.getCategoryCompletionCount(hunterId, bountyData.category);
      if (categoryCount >= 2) { // Will be 3 after this one
        newSpecializations.push(bountyData.category);
      }
    }

    // Check for new badges
    const newBadges = await this.checkAndAwardBadges(hunter, {
      completedBounties: newCompletedBounties,
      qualityScore: bountyData.qualityScore,
      completionTimeHours: bountyData.completionTimeHours,
      currentStreak: newCurrentStreak,
      totalEarned: newTotalEarned,
      reputation: newReputation,
      specializations: newSpecializations
    });

    // Update hunter
    const [updatedHunter] = await db
      .update(bountyHunters)
      .set({
        completedBounties: newCompletedBounties,
        totalBounties: hunter.totalBounties + 1,
        totalEarned: newTotalEarned,
        completionRate: newCompletionRate,
        averageQuality: newAverageQuality,
        averageCompletionTime: Math.round(newAvgCompletionTime),
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        reputation: newReputation,
        level: newLevel,
        specializations: newSpecializations,
        badges: newBadges,
        lastCompletedAt: now,
        updatedAt: now
      })
      .where(eq(bountyHunters.id, hunterId))
      .returning();

    console.log(`✨ Hunter ${hunterId} stats updated: +${reputationGain} reputation, Level ${newLevel}, Streak ${newCurrentStreak}`);
    
    return updatedHunter;
  }

  // Calculate reputation gain
  private calculateReputationGain(data: {
    qualityScore: number;
    completionTimeHours: number;
    streak: number;
  }): number {
    let points = 10; // Base points

    // Quality bonus (0-40 points)
    if (data.qualityScore >= 90) points += 40;
    else if (data.qualityScore >= 80) points += 30;
    else if (data.qualityScore >= 70) points += 20;
    else if (data.qualityScore >= 60) points += 10;

    // Speed bonus (0-30 points)
    if (data.completionTimeHours <= 6) points += 30;
    else if (data.completionTimeHours <= 12) points += 20;
    else if (data.completionTimeHours <= 24) points += 10;

    // Streak bonus (0-30 points)
    if (data.streak >= 10) points += 30;
    else if (data.streak >= 5) points += 20;
    else if (data.streak >= 3) points += 10;

    return points;
  }

  // Calculate level from reputation
  private calculateLevel(reputation: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (reputation >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // Get category completion count for hunter
  private async getCategoryCompletionCount(hunterId: string, category: string): Promise<number> {
    const hunter = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.id, hunterId))
      .limit(1);

    if (!hunter[0]) return 0;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(bounties)
      .where(
        and(
          eq(bounties.assigneeId, hunter[0].userId),
          eq(bounties.status, 'completed'),
          eq(bounties.category, category)
        )
      );

    return Number(result[0]?.count || 0);
  }

  // Check and award badges
  private async checkAndAwardBadges(
    hunter: BountyHunter,
    newStats: {
      completedBounties: number;
      qualityScore?: number;
      completionTimeHours: number;
      currentStreak: number;
      totalEarned: number;
      reputation: number;
      specializations: string[];
    }
  ): Promise<string[]> {
    const currentBadges = hunter.badges || [];
    const newBadges = [...currentBadges];

    // First bounty
    if (newStats.completedBounties === 1 && !currentBadges.includes(BADGES.FIRST_BOUNTY)) {
      newBadges.push(BADGES.FIRST_BOUNTY);
      console.log(`🎖️ Badge earned: First Bounty`);
    }

    // Speed demon (complete in <6 hours)
    if (newStats.completionTimeHours <= 6 && !currentBadges.includes(BADGES.SPEED_DEMON)) {
      newBadges.push(BADGES.SPEED_DEMON);
      console.log(`🎖️ Badge earned: Speed Demon`);
    }

    // Quality master (3+ bounties with 90+ score)
    if (newStats.qualityScore && newStats.qualityScore >= 90) {
      const highQualityCount = await this.getHighQualityBountyCount(hunter.id);
      if (highQualityCount >= 3 && !currentBadges.includes(BADGES.QUALITY_MASTER)) {
        newBadges.push(BADGES.QUALITY_MASTER);
        console.log(`🎖️ Badge earned: Quality Master`);
      }
    }

    // Streak badges
    if (newStats.currentStreak >= 5 && !currentBadges.includes(BADGES.STREAK_5)) {
      newBadges.push(BADGES.STREAK_5);
      console.log(`🎖️ Badge earned: 5-Day Streak`);
    }
    if (newStats.currentStreak >= 10 && !currentBadges.includes(BADGES.STREAK_10)) {
      newBadges.push(BADGES.STREAK_10);
      console.log(`🎖️ Badge earned: 10-Day Streak`);
    }

    // Big earner
    if (newStats.totalEarned >= 10000000000000000000000 && !currentBadges.includes(BADGES.BIG_EARNER)) { // 10k tokens in wei
      newBadges.push(BADGES.BIG_EARNER);
      console.log(`🎖️ Badge earned: Big Earner`);
    }

    // Specialist badges
    if (newStats.specializations.includes('DeFi') && !currentBadges.includes(BADGES.SPECIALIST_DEFI)) {
      newBadges.push(BADGES.SPECIALIST_DEFI);
      console.log(`🎖️ Badge earned: DeFi Specialist`);
    }
    if (newStats.specializations.includes('NFT') && !currentBadges.includes(BADGES.SPECIALIST_NFT)) {
      newBadges.push(BADGES.SPECIALIST_NFT);
      console.log(`🎖️ Badge earned: NFT Specialist`);
    }
    if (newStats.specializations.includes('Layer2') && !currentBadges.includes(BADGES.SPECIALIST_LAYER2)) {
      newBadges.push(BADGES.SPECIALIST_LAYER2);
      console.log(`🎖️ Badge earned: Layer 2 Specialist`);
    }

    // Century club
    if (newStats.completedBounties >= 100 && !currentBadges.includes(BADGES.CENTURY_CLUB)) {
      newBadges.push(BADGES.CENTURY_CLUB);
      console.log(`🎖️ Badge earned: Century Club`);
    }

    // Reputation milestone
    if (newStats.reputation >= 1000 && !currentBadges.includes(BADGES.REPUTATION_1000)) {
      newBadges.push(BADGES.REPUTATION_1000);
      console.log(`🎖️ Badge earned: 1000 Reputation`);
    }

    return newBadges;
  }

  // Get count of high quality bounties (90+ score)
  private async getHighQualityBountyCount(hunterId: string): Promise<number> {
    const hunter = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.id, hunterId))
      .limit(1);

    if (!hunter[0]) return 0;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(bountyQualityScores)
      .innerJoin(bounties, eq(bountyQualityScores.bountyId, bounties.id))
      .where(
        and(
          eq(bounties.assigneeId, hunter[0].userId),
          gte(bountyQualityScores.overallScore, 90)
        )
      );

    return Number(result[0]?.count || 0);
  }

  // Get leaderboard
  async getLeaderboard(sortBy: 'reputation' | 'totalEarned' | 'completionRate' | 'averageQuality' = 'reputation', limit: number = 10): Promise<BountyHunter[]> {
    const hunters = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.isActive, true))
      .orderBy(desc(bountyHunters[sortBy]))
      .limit(limit);

    return hunters;
  }

  // Get hunter stats
  async getHunterStats(hunterId: string): Promise<any> {
    const [hunter] = await db
      .select()
      .from(bountyHunters)
      .where(eq(bountyHunters.id, hunterId))
      .limit(1);

    if (!hunter) {
      throw new Error('Hunter not found');
    }

    // Get recent completions
    const recentBounties = await db
      .select()
      .from(bounties)
      .where(
        and(
          eq(bounties.assigneeId, hunter.userId),
          eq(bounties.status, 'completed')
        )
      )
      .orderBy(desc(bounties.completedAt))
      .limit(10);

    // Calculate next level progress
    const currentLevelThreshold = LEVEL_THRESHOLDS[hunter.level - 1] || 0;
    const nextLevelThreshold = LEVEL_THRESHOLDS[hunter.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const progressToNextLevel = ((hunter.reputation - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;

    return {
      ...hunter,
      recentBounties,
      nextLevelProgress: Math.min(Math.round(progressToNextLevel), 100),
      nextLevelThreshold,
      badgeCount: hunter.badges?.length || 0
    };
  }

  // Increment claimed bounty count
  async incrementClaimedBounties(hunterId: string): Promise<void> {
    await db
      .update(bountyHunters)
      .set({
        totalBounties: sql`${bountyHunters.totalBounties} + 1`,
        updatedAt: new Date()
      })
      .where(eq(bountyHunters.id, hunterId));
  }
}

export const bountyHunterService = new BountyHunterService();
