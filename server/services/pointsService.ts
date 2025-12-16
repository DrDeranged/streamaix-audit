import { db } from '../db';
import { 
  users, 
  pointsTransactions, 
  dailyLoginStreak,
  pointsConfig,
  type PointsTransaction,
  type DailyLoginStreak
} from '@shared/schema';
import { eq, desc, and, sql, gte } from 'drizzle-orm';

// Default points values (used if not in config table)
const DEFAULT_POINTS = {
  SIGNUP_BONUS: 2500,
  PROFILE_COMPLETE: 500,
  DAILY_LOGIN_BASE: 50,
  DAILY_LOGIN_STREAK_MULTIPLIER: 0.5, // +50% per day up to 3x
  DAILY_LOGIN_MAX_MULTIPLIER: 3,
  STREAM_WATCH_PER_5MIN: 10,
  STREAM_WATCH_DAILY_CAP: 200,
  BOUNTY_SUBMIT_BASE: 100,
  BOUNTY_SUBMIT_MAX: 500,
  BOUNTY_ACCEPTED: 1000,
  PREDICTION_WIN_MULTIPLIER: 1.5, // 1.5x the stake
  VOICE_CONVERSATION: 50,
  REFERRAL_BONUS: 500,
  STREAM_COMMENT_FIRST: 25,
  STREAM_TIP_SENT: 10, // Bonus for tipping others
};

export type PointsSource = 
  | 'signup'
  | 'daily_login'
  | 'bounty_submit'
  | 'bounty_accepted'
  | 'prediction_win'
  | 'prediction_loss'
  | 'stream_watch'
  | 'voice_conversation'
  | 'referral'
  | 'profile_complete'
  | 'tip_sent'
  | 'tip_received'
  | 'market_trade'
  | 'league_entry'
  | 'subscription'
  | 'stream_comment'
  | 'admin_adjustment';

export type PointsType = 'earn' | 'spend' | 'bonus' | 'refund' | 'adjustment';

interface AwardPointsParams {
  userId: string;
  amount: number;
  source: PointsSource;
  type?: PointsType;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, any>;
}

interface SpendPointsParams {
  userId: string;
  amount: number;
  source: PointsSource;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, any>;
}

class PointsService {
  private configCache: Map<string, number> = new Map();
  private configLoaded = false;

  async loadConfig() {
    if (this.configLoaded) return;
    
    try {
      const configs = await db.select().from(pointsConfig).where(eq(pointsConfig.isActive, true));
      configs.forEach(config => {
        this.configCache.set(config.key, config.value);
      });
      this.configLoaded = true;
    } catch (error) {
      console.log('[Points] Config table not ready, using defaults');
    }
  }

  getPointsValue(key: keyof typeof DEFAULT_POINTS): number {
    const configKey = key.toLowerCase();
    return this.configCache.get(configKey) ?? DEFAULT_POINTS[key];
  }

  async getBalance(userId: string): Promise<number> {
    const user = await db.select({ streamPoints: users.streamPoints })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user[0]?.streamPoints ?? 0;
  }

  async awardPoints(params: AwardPointsParams): Promise<PointsTransaction | null> {
    const { userId, amount, source, type = 'earn', description, referenceId, referenceType, metadata } = params;

    if (amount <= 0) {
      console.log(`[Points] Invalid award amount: ${amount}`);
      return null;
    }

    try {
      const currentBalance = await this.getBalance(userId);
      const newBalance = currentBalance + amount;

      // Update user balance
      await db.update(users)
        .set({ 
          streamPoints: newBalance,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Record transaction
      const [transaction] = await db.insert(pointsTransactions)
        .values({
          userId,
          amount,
          type,
          source,
          referenceId,
          referenceType,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: description ?? `Earned ${amount} STREAM points from ${source}`,
          metadata,
        })
        .returning();

      console.log(`[Points] Awarded ${amount} to user ${userId} for ${source}. Balance: ${currentBalance} → ${newBalance}`);
      
      return transaction;
    } catch (error) {
      console.error('[Points] Error awarding points:', error);
      return null;
    }
  }

  async spendPoints(params: SpendPointsParams): Promise<{ success: boolean; transaction?: PointsTransaction; error?: string }> {
    const { userId, amount, source, description, referenceId, referenceType, metadata } = params;

    if (amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    try {
      const currentBalance = await this.getBalance(userId);
      
      if (currentBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const newBalance = currentBalance - amount;

      // Update user balance
      await db.update(users)
        .set({ 
          streamPoints: newBalance,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Record transaction (negative amount for spending)
      const [transaction] = await db.insert(pointsTransactions)
        .values({
          userId,
          amount: -amount,
          type: 'spend',
          source,
          referenceId,
          referenceType,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: description ?? `Spent ${amount} STREAM points on ${source}`,
          metadata,
        })
        .returning();

      console.log(`[Points] User ${userId} spent ${amount} on ${source}. Balance: ${currentBalance} → ${newBalance}`);
      
      return { success: true, transaction };
    } catch (error) {
      console.error('[Points] Error spending points:', error);
      return { success: false, error: 'Transaction failed' };
    }
  }

  async getHistory(userId: string, limit = 50, offset = 0): Promise<PointsTransaction[]> {
    return db.select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, userId))
      .orderBy(desc(pointsTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getRecentActivity(userId: string, hours = 24): Promise<PointsTransaction[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return db.select()
      .from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.userId, userId),
        gte(pointsTransactions.createdAt, since)
      ))
      .orderBy(desc(pointsTransactions.createdAt));
  }

  async awardSignupBonus(userId: string): Promise<PointsTransaction | null> {
    await this.loadConfig();
    const amount = this.getPointsValue('SIGNUP_BONUS');
    
    // Check if already awarded
    const existing = await db.select()
      .from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.userId, userId),
        eq(pointsTransactions.source, 'signup')
      ))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[Points] Signup bonus already awarded to ${userId}`);
      return null;
    }

    return this.awardPoints({
      userId,
      amount,
      source: 'signup',
      type: 'bonus',
      description: `Welcome bonus! You received ${amount} STREAM points to get started.`,
      metadata: { isWelcomeBonus: true }
    });
  }

  async awardProfileComplete(userId: string): Promise<PointsTransaction | null> {
    await this.loadConfig();
    const amount = this.getPointsValue('PROFILE_COMPLETE');
    
    // Check if already awarded
    const existing = await db.select()
      .from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.userId, userId),
        eq(pointsTransactions.source, 'profile_complete')
      ))
      .limit(1);

    if (existing.length > 0) return null;

    return this.awardPoints({
      userId,
      amount,
      source: 'profile_complete',
      type: 'bonus',
      description: 'Profile completed bonus!',
    });
  }

  async processDailyLogin(userId: string): Promise<{ pointsAwarded: number; streak: number; transaction: PointsTransaction | null }> {
    await this.loadConfig();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get or create streak record
    let [streakRecord] = await db.select()
      .from(dailyLoginStreak)
      .where(eq(dailyLoginStreak.userId, userId))
      .limit(1);

    if (!streakRecord) {
      // First login ever
      const [newStreak] = await db.insert(dailyLoginStreak)
        .values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastLoginDate: today,
          totalLogins: 1,
          totalPointsFromLogins: 0,
        })
        .returning();
      streakRecord = newStreak;
    } else {
      const lastLogin = streakRecord.lastLoginDate ? new Date(streakRecord.lastLoginDate) : null;
      lastLogin?.setHours(0, 0, 0, 0);
      
      if (lastLogin && lastLogin.getTime() === today.getTime()) {
        // Already logged in today
        return { 
          pointsAwarded: 0, 
          streak: streakRecord.currentStreak ?? 0, 
          transaction: null 
        };
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreak: number;
      if (lastLogin && lastLogin.getTime() === yesterday.getTime()) {
        // Consecutive day - increment streak
        newStreak = (streakRecord.currentStreak ?? 0) + 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, streakRecord.longestStreak ?? 0);

      await db.update(dailyLoginStreak)
        .set({
          currentStreak: newStreak,
          longestStreak,
          lastLoginDate: today,
          totalLogins: (streakRecord.totalLogins ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(dailyLoginStreak.userId, userId));

      streakRecord = { ...streakRecord, currentStreak: newStreak };
    }

    // Calculate points with streak multiplier
    const basePoints = this.getPointsValue('DAILY_LOGIN_BASE');
    const multiplierPerDay = this.getPointsValue('DAILY_LOGIN_STREAK_MULTIPLIER') as number;
    const maxMultiplier = this.getPointsValue('DAILY_LOGIN_MAX_MULTIPLIER');
    
    const streakDays = streakRecord.currentStreak ?? 1;
    const multiplier = Math.min(1 + (streakDays - 1) * multiplierPerDay, maxMultiplier);
    const pointsAwarded = Math.round(basePoints * multiplier);

    const transaction = await this.awardPoints({
      userId,
      amount: pointsAwarded,
      source: 'daily_login',
      description: `Daily login bonus (${streakDays} day streak, ${multiplier.toFixed(1)}x multiplier)`,
      metadata: { 
        streak: streakDays, 
        multiplier,
        basePoints 
      }
    });

    // Update total points from logins
    if (transaction) {
      await db.update(dailyLoginStreak)
        .set({
          totalPointsFromLogins: sql`${dailyLoginStreak.totalPointsFromLogins} + ${pointsAwarded}`,
        })
        .where(eq(dailyLoginStreak.userId, userId));
    }

    return { 
      pointsAwarded, 
      streak: streakRecord.currentStreak ?? 1, 
      transaction 
    };
  }

  async awardBountySubmission(userId: string, bountyId: string, qualityScore?: number): Promise<PointsTransaction | null> {
    await this.loadConfig();
    
    const basePoints = this.getPointsValue('BOUNTY_SUBMIT_BASE');
    const maxPoints = this.getPointsValue('BOUNTY_SUBMIT_MAX');
    
    // Scale points based on quality score (0-100)
    const quality = qualityScore ?? 50;
    const points = Math.round(basePoints + (maxPoints - basePoints) * (quality / 100));

    return this.awardPoints({
      userId,
      amount: points,
      source: 'bounty_submit',
      referenceId: bountyId,
      referenceType: 'bounty',
      description: `Bounty submission (quality: ${quality}%)`,
      metadata: { qualityScore: quality }
    });
  }

  async awardBountyAccepted(userId: string, bountyId: string): Promise<PointsTransaction | null> {
    await this.loadConfig();
    const points = this.getPointsValue('BOUNTY_ACCEPTED');

    return this.awardPoints({
      userId,
      amount: points,
      source: 'bounty_accepted',
      referenceId: bountyId,
      referenceType: 'bounty',
      description: 'Bounty solution accepted!',
    });
  }

  async awardStreamWatch(userId: string, streamId: string, minutesWatched: number): Promise<PointsTransaction | null> {
    await this.loadConfig();
    
    const pointsPer5Min = this.getPointsValue('STREAM_WATCH_PER_5MIN');
    const dailyCap = this.getPointsValue('STREAM_WATCH_DAILY_CAP');
    
    // Calculate points earned
    const intervals = Math.floor(minutesWatched / 5);
    const potentialPoints = intervals * pointsPer5Min;
    
    // Check today's earnings from stream watching
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEarnings = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(pointsTransactions)
      .where(and(
        eq(pointsTransactions.userId, userId),
        eq(pointsTransactions.source, 'stream_watch'),
        gte(pointsTransactions.createdAt, today)
      ));
    
    const earnedToday = todayEarnings[0]?.total ?? 0;
    const remainingCap = Math.max(0, dailyCap - earnedToday);
    const pointsToAward = Math.min(potentialPoints, remainingCap);
    
    if (pointsToAward <= 0) return null;

    return this.awardPoints({
      userId,
      amount: pointsToAward,
      source: 'stream_watch',
      referenceId: streamId,
      referenceType: 'stream',
      description: `Watched stream for ${minutesWatched} minutes`,
      metadata: { minutesWatched, dailyEarned: earnedToday + pointsToAward, dailyCap }
    });
  }

  async awardVoiceConversation(userId: string, streamId: string): Promise<PointsTransaction | null> {
    await this.loadConfig();
    const points = this.getPointsValue('VOICE_CONVERSATION');

    return this.awardPoints({
      userId,
      amount: points,
      source: 'voice_conversation',
      referenceId: streamId,
      referenceType: 'stream',
      description: 'Participated in voice conversation',
    });
  }

  async awardReferral(referrerId: string, referredUserId: string): Promise<PointsTransaction | null> {
    await this.loadConfig();
    const points = this.getPointsValue('REFERRAL_BONUS');

    return this.awardPoints({
      userId: referrerId,
      amount: points,
      source: 'referral',
      type: 'bonus',
      referenceId: referredUserId,
      referenceType: 'user',
      description: 'Referral bonus - new user signed up!',
    });
  }

  async awardPredictionWin(userId: string, marketId: string, stake: number): Promise<PointsTransaction | null> {
    await this.loadConfig();
    const multiplier = this.getPointsValue('PREDICTION_WIN_MULTIPLIER') as number;
    const winnings = Math.round(stake * multiplier);

    return this.awardPoints({
      userId,
      amount: winnings,
      source: 'prediction_win',
      referenceId: marketId,
      referenceType: 'market',
      description: `Prediction correct! Won ${winnings} STREAM points`,
      metadata: { stake, multiplier }
    });
  }

  async getStats(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalSpent: number;
    streak: number;
    longestStreak: number;
    transactionCount: number;
  }> {
    // Auto-recovery: Award signup bonus if user never received it
    await this.ensureSignupBonus(userId);

    const [balanceResult, streakResult, statsResult] = await Promise.all([
      this.getBalance(userId),
      db.select().from(dailyLoginStreak).where(eq(dailyLoginStreak.userId, userId)).limit(1),
      db.select({
        totalEarned: sql<number>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`,
        totalSpent: sql<number>`COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)`,
        count: sql<number>`COUNT(*)`
      })
        .from(pointsTransactions)
        .where(eq(pointsTransactions.userId, userId))
    ]);

    return {
      balance: balanceResult,
      totalEarned: statsResult[0]?.totalEarned ?? 0,
      totalSpent: statsResult[0]?.totalSpent ?? 0,
      streak: streakResult[0]?.currentStreak ?? 0,
      longestStreak: streakResult[0]?.longestStreak ?? 0,
      transactionCount: statsResult[0]?.count ?? 0,
    };
  }

  async ensureSignupBonus(userId: string): Promise<boolean> {
    try {
      const existing = await db.select()
        .from(pointsTransactions)
        .where(and(
          eq(pointsTransactions.userId, userId),
          eq(pointsTransactions.source, 'signup')
        ))
        .limit(1);

      if (existing.length === 0) {
        console.log(`[Points] Auto-recovery: Awarding missing signup bonus to user ${userId}`);
        const result = await this.awardSignupBonus(userId);
        return result !== null;
      }
      return false;
    } catch (error) {
      console.error('[Points] Error in ensureSignupBonus:', error);
      return false;
    }
  }
}

export const pointsService = new PointsService();
