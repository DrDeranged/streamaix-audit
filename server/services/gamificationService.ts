import { db } from '../db';
import { 
  dailyQuests, userDailyQuests, weeklyMissions, userWeeklyMissions,
  userLevels, xpTransactions, seasonPasses, userSeasonPasses,
  userStreaks, gamificationEvents, userEventParticipation,
  gamificationNotifications, users
} from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

interface XPGainResult {
  xpEarned: number;
  newTotal: number;
  leveledUp: boolean;
  newLevel?: number;
  multiplierApplied: number;
}

interface QuestProgress {
  questId: string;
  name: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
  xpReward: number;
  streamReward: number;
  expiresAt: Date;
}

interface MissionProgress {
  missionId: string;
  name: string;
  description: string;
  objectives: Array<{
    id: string;
    description: string;
    current: number;
    target: number;
    completed: boolean;
  }>;
  overallProgress: number;
  completed: boolean;
  xpReward: number;
  streamReward: number;
  weekEnd: Date;
}

interface LevelInfo {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  progress: number;
  totalXpEarned: number;
  prestigeLevel: number;
}

interface SeasonPassInfo {
  seasonId: string;
  seasonName: string;
  currentTier: number;
  maxTier: number;
  currentXp: number;
  xpPerTier: number;
  tierProgress: number;
  hasPremium: boolean;
  unclaimedFreeRewards: number[];
  unclaimedPremiumRewards: number[];
  daysRemaining: number;
}

interface StreakInfo {
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date | null;
  nextMilestone: number;
  graceAvailable: boolean;
}

class GamificationService {
  private readonly XP_PER_LEVEL_BASE = 1000;
  private readonly XP_SCALING_FACTOR = 1.15;
  private readonly STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

  async getUserLevel(userId: string): Promise<LevelInfo> {
    let userLevel = await db.query.userLevels.findFirst({
      where: eq(userLevels.userId, userId)
    });

    if (!userLevel) {
      const [newLevel] = await db.insert(userLevels).values({
        userId,
        currentLevel: 1,
        currentXp: 0,
        totalXpEarned: 0,
        xpToNextLevel: this.XP_PER_LEVEL_BASE,
        levelProgress: 0
      }).returning();
      userLevel = newLevel;
    }

    return {
      currentLevel: userLevel.currentLevel || 1,
      currentXp: userLevel.currentXp || 0,
      xpToNextLevel: userLevel.xpToNextLevel || this.XP_PER_LEVEL_BASE,
      progress: userLevel.levelProgress || 0,
      totalXpEarned: userLevel.totalXpEarned || 0,
      prestigeLevel: userLevel.prestigeLevel || 0
    };
  }

  calculateXpForLevel(level: number): number {
    return Math.floor(this.XP_PER_LEVEL_BASE * Math.pow(this.XP_SCALING_FACTOR, level - 1));
  }

  async awardXP(
    userId: string, 
    xpAmount: number, 
    xpType: string, 
    source: string, 
    sourceId?: string,
    description?: string
  ): Promise<XPGainResult> {
    const levelInfo = await this.getUserLevel(userId);
    
    let multiplier = 1.0;
    if (levelInfo.prestigeLevel > 0) {
      multiplier += levelInfo.prestigeLevel * 0.1;
    }
    
    const activeEvent = await this.getActiveXPEvent();
    if (activeEvent?.xpMultiplier) {
      multiplier *= activeEvent.xpMultiplier;
    }

    const finalXp = Math.floor(xpAmount * multiplier);
    let newXp = levelInfo.currentXp + finalXp;
    let newLevel = levelInfo.currentLevel;
    let leveledUp = false;
    let xpToNext = levelInfo.xpToNextLevel;

    while (newXp >= xpToNext) {
      newXp -= xpToNext;
      newLevel++;
      leveledUp = true;
      xpToNext = this.calculateXpForLevel(newLevel);
    }

    await db.update(userLevels)
      .set({
        currentLevel: newLevel,
        currentXp: newXp,
        totalXpEarned: levelInfo.totalXpEarned + finalXp,
        xpToNextLevel: xpToNext,
        levelProgress: (newXp / xpToNext) * 100,
        lastLevelUp: leveledUp ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(userLevels.userId, userId));

    await db.insert(xpTransactions).values({
      userId,
      xpAmount: finalXp,
      xpType,
      source,
      sourceId,
      description,
      multiplierApplied: multiplier,
      levelAtTime: newLevel,
      causedLevelUp: leveledUp
    });

    if (leveledUp) {
      await this.createNotification(userId, 'level_up', 
        'Level Up!', 
        `Congratulations! You've reached Level ${newLevel}!`
      );
    }

    return {
      xpEarned: finalXp,
      newTotal: levelInfo.totalXpEarned + finalXp,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      multiplierApplied: multiplier
    };
  }

  async getDailyQuests(userId: string): Promise<QuestProgress[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userQuests = await db.query.userDailyQuests.findMany({
      where: and(
        eq(userDailyQuests.userId, userId),
        gte(userDailyQuests.questDate, today),
        lte(userDailyQuests.questDate, tomorrow)
      ),
      with: {
        quest: true
      }
    }) as any[];

    if (userQuests.length === 0) {
      await this.assignDailyQuests(userId);
      return this.getDailyQuests(userId);
    }

    return userQuests.map((uq: any) => ({
      questId: uq.questId,
      name: uq.quest?.name || 'Unknown Quest',
      description: uq.quest?.description || '',
      current: uq.currentProgress || 0,
      target: uq.quest?.targetCount || 1,
      completed: uq.isCompleted || false,
      xpReward: uq.quest?.xpReward || 100,
      streamReward: uq.quest?.streamReward || 0,
      expiresAt: uq.expiresAt
    }));
  }

  async assignDailyQuests(userId: string): Promise<void> {
    const levelInfo = await this.getUserLevel(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const availableQuests = await db.query.dailyQuests.findMany({
      where: and(
        eq(dailyQuests.isActive, true),
        lte(dailyQuests.requiresLevel, levelInfo.currentLevel)
      )
    });

    if (availableQuests.length === 0) {
      return;
    }

    const shuffled = availableQuests.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(3, shuffled.length));

    for (const quest of selected) {
      await db.insert(userDailyQuests).values({
        userId,
        questId: quest.id,
        questDate: today,
        expiresAt: tomorrow,
        currentProgress: 0,
        isCompleted: false
      }).onConflictDoNothing();
    }
  }

  async updateQuestProgress(
    userId: string, 
    actionType: string, 
    count: number = 1
  ): Promise<{ questsCompleted: string[], xpEarned: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeQuests = await db.query.userDailyQuests.findMany({
      where: and(
        eq(userDailyQuests.userId, userId),
        eq(userDailyQuests.isCompleted, false),
        gte(userDailyQuests.questDate, today)
      ),
      with: {
        quest: true
      }
    }) as any[];

    const completedQuests: string[] = [];
    let totalXpEarned = 0;

    for (const uq of activeQuests) {
      if (uq.quest?.actionRequired === actionType) {
        const newProgress = (uq.currentProgress || 0) + count;
        const isComplete = newProgress >= (uq.quest?.targetCount || 1);

        await db.update(userDailyQuests)
          .set({
            currentProgress: newProgress,
            isCompleted: isComplete,
            completedAt: isComplete ? new Date() : undefined,
            updatedAt: new Date()
          })
          .where(eq(userDailyQuests.id, uq.id));

        if (isComplete && !uq.isCompleted) {
          completedQuests.push(uq.quest?.name || 'Quest');
          const xpResult = await this.awardXP(
            userId,
            uq.quest?.xpReward || 100,
            'quest',
            'daily_quest',
            uq.id,
            `Completed daily quest: ${uq.quest?.name}`
          );
          totalXpEarned += xpResult.xpEarned;

          await this.createNotification(userId, 'quest_complete',
            'Quest Complete!',
            `You completed "${uq.quest?.name}" and earned ${xpResult.xpEarned} XP!`
          );
        }
      }
    }

    return { questsCompleted: completedQuests, xpEarned: totalXpEarned };
  }

  async getWeeklyMissions(userId: string): Promise<MissionProgress[]> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const userMissions = await db.query.userWeeklyMissions.findMany({
      where: and(
        eq(userWeeklyMissions.userId, userId),
        gte(userWeeklyMissions.weekStart, weekStart),
        lte(userWeeklyMissions.weekEnd, weekEnd)
      ),
      with: {
        mission: true
      }
    }) as any[];

    return userMissions.map((um: any) => ({
      missionId: um.missionId,
      name: um.mission?.name || 'Unknown Mission',
      description: um.mission?.description || '',
      objectives: (um.objectivesProgress as any[]) || [],
      overallProgress: um.overallProgress || 0,
      completed: um.isCompleted || false,
      xpReward: um.mission?.xpReward || 500,
      streamReward: um.mission?.streamReward || 0,
      weekEnd
    }));
  }

  async updateStreak(userId: string, streakType: string): Promise<StreakInfo> {
    let streak = await db.query.userStreaks.findFirst({
      where: and(
        eq(userStreaks.userId, userId),
        eq(userStreaks.streakType, streakType)
      )
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      const [newStreak] = await db.insert(userStreaks).values({
        userId,
        streakType,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        streakStartDate: today,
        milestonesReached: []
      }).returning();
      streak = newStreak;
    } else {
      const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
      const daysSinceActivity = lastActivity 
        ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let newStreak = streak.currentStreak || 0;
      let streakBroken = false;

      if (daysSinceActivity === 0) {
      } else if (daysSinceActivity === 1) {
        newStreak++;
      } else if (daysSinceActivity === 2 && !streak.graceUsedToday) {
        newStreak++;
        await db.update(userStreaks)
          .set({ graceUsedToday: true, totalGracesUsed: (streak.totalGracesUsed || 0) + 1 })
          .where(eq(userStreaks.id, streak.id));
      } else {
        newStreak = 1;
        streakBroken = true;
      }

      const milestonesReached = (streak.milestonesReached as number[]) || [];
      const newMilestones = this.STREAK_MILESTONES.filter(
        m => newStreak >= m && !milestonesReached.includes(m)
      );

      await db.update(userStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: Math.max(streak.longestStreak || 0, newStreak),
          lastActivityDate: today,
          streakStartDate: streakBroken ? today : streak.streakStartDate,
          milestonesReached: [...milestonesReached, ...newMilestones],
          updatedAt: new Date()
        })
        .where(eq(userStreaks.id, streak.id));

      for (const milestone of newMilestones) {
        await this.awardXP(userId, milestone * 10, 'streak', `streak_milestone_${milestone}`, undefined,
          `Reached ${milestone}-day ${streakType} streak!`
        );
      }
    }

    const updatedStreak = await db.query.userStreaks.findFirst({
      where: and(
        eq(userStreaks.userId, userId),
        eq(userStreaks.streakType, streakType)
      )
    });

    const nextMilestone = this.STREAK_MILESTONES.find(m => m > (updatedStreak?.currentStreak || 0)) || 365;

    return {
      streakType,
      currentStreak: updatedStreak?.currentStreak || 1,
      longestStreak: updatedStreak?.longestStreak || 1,
      lastActivity: updatedStreak?.lastActivityDate || null,
      nextMilestone,
      graceAvailable: !updatedStreak?.graceUsedToday
    };
  }

  async getAllStreaks(userId: string): Promise<StreakInfo[]> {
    const streaks = await db.query.userStreaks.findMany({
      where: eq(userStreaks.userId, userId)
    });

    return streaks.map(s => ({
      streakType: s.streakType,
      currentStreak: s.currentStreak || 0,
      longestStreak: s.longestStreak || 0,
      lastActivity: s.lastActivityDate,
      nextMilestone: this.STREAK_MILESTONES.find(m => m > (s.currentStreak || 0)) || 365,
      graceAvailable: !s.graceUsedToday
    }));
  }

  async getSeasonPassProgress(userId: string): Promise<SeasonPassInfo | null> {
    const now = new Date();
    const activeSeason = await db.query.seasonPasses.findFirst({
      where: and(
        eq(seasonPasses.status, 'active'),
        lte(seasonPasses.startDate, now),
        gte(seasonPasses.endDate, now)
      )
    });

    if (!activeSeason) return null;

    let userProgress = await db.query.userSeasonPasses.findFirst({
      where: and(
        eq(userSeasonPasses.userId, userId),
        eq(userSeasonPasses.seasonId, activeSeason.id)
      )
    });

    if (!userProgress) {
      const [newProgress] = await db.insert(userSeasonPasses).values({
        userId,
        seasonId: activeSeason.id,
        currentTier: 1,
        currentXp: 0,
        totalSeasonXp: 0,
        hasPremium: false,
        freeRewardsClaimed: [],
        premiumRewardsClaimed: []
      }).returning();
      userProgress = newProgress;
    }

    const xpPerTier = activeSeason.xpPerTier || 1000;
    const tierProgress = ((userProgress.currentXp || 0) / xpPerTier) * 100;
    const daysRemaining = Math.ceil((new Date(activeSeason.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const freeRewards = (activeSeason.freeRewards as any[]) || [];
    const premiumRewards = (activeSeason.premiumRewards as any[]) || [];
    const claimedFree = (userProgress.freeRewardsClaimed as number[]) || [];
    const claimedPremium = (userProgress.premiumRewardsClaimed as number[]) || [];

    const unclaimedFree = freeRewards
      .filter((r: any) => r.tier <= (userProgress?.currentTier || 1) && !claimedFree.includes(r.tier))
      .map((r: any) => r.tier);
    
    const unclaimedPremium = userProgress.hasPremium
      ? premiumRewards
          .filter((r: any) => r.tier <= (userProgress?.currentTier || 1) && !claimedPremium.includes(r.tier))
          .map((r: any) => r.tier)
      : [];

    return {
      seasonId: activeSeason.id,
      seasonName: activeSeason.name,
      currentTier: userProgress.currentTier || 1,
      maxTier: activeSeason.maxTier || 100,
      currentXp: userProgress.currentXp || 0,
      xpPerTier,
      tierProgress,
      hasPremium: userProgress.hasPremium || false,
      unclaimedFreeRewards: unclaimedFree,
      unclaimedPremiumRewards: unclaimedPremium,
      daysRemaining
    };
  }

  async getActiveXPEvent(): Promise<{ xpMultiplier: number } | null> {
    const now = new Date();
    const event = await db.query.gamificationEvents.findFirst({
      where: and(
        eq(gamificationEvents.status, 'active'),
        eq(gamificationEvents.eventType, 'double_xp'),
        lte(gamificationEvents.startDate, now),
        gte(gamificationEvents.endDate, now)
      )
    });

    return event ? { xpMultiplier: event.xpMultiplier || 1.0 } : null;
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedType?: string,
    relatedId?: string,
    pendingReward?: any
  ): Promise<void> {
    await db.insert(gamificationNotifications).values({
      userId,
      notificationType: type,
      title,
      message,
      relatedType,
      relatedId,
      pendingReward,
      isRead: false,
      isClaimed: !pendingReward
    });
  }

  async getUnreadNotifications(userId: string): Promise<any[]> {
    return db.query.gamificationNotifications.findMany({
      where: and(
        eq(gamificationNotifications.userId, userId),
        eq(gamificationNotifications.isRead, false)
      ),
      orderBy: desc(gamificationNotifications.createdAt),
      limit: 20
    });
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await db.update(gamificationNotifications)
      .set({ isRead: true })
      .where(eq(gamificationNotifications.id, notificationId));
  }

  async getGamificationDashboard(userId: string): Promise<{
    level: LevelInfo;
    dailyQuests: QuestProgress[];
    weeklyMissions: MissionProgress[];
    streaks: StreakInfo[];
    seasonPass: SeasonPassInfo | null;
    activeEvent: { xpMultiplier: number } | null;
    recentXP: any[];
    notifications: any[];
  }> {
    const [level, dailyQuests, weeklyMissions, streaks, seasonPass, activeEvent, notifications] = await Promise.all([
      this.getUserLevel(userId),
      this.getDailyQuests(userId),
      this.getWeeklyMissions(userId),
      this.getAllStreaks(userId),
      this.getSeasonPassProgress(userId),
      this.getActiveXPEvent(),
      this.getUnreadNotifications(userId)
    ]);

    const recentXP = await db.query.xpTransactions.findMany({
      where: eq(xpTransactions.userId, userId),
      orderBy: desc(xpTransactions.createdAt),
      limit: 10
    });

    return {
      level,
      dailyQuests,
      weeklyMissions,
      streaks,
      seasonPass,
      activeEvent,
      recentXP,
      notifications
    };
  }
}

export const gamificationService = new GamificationService();