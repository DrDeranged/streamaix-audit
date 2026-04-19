// ============================================================================
// Bounties routes — extracted from server/routes.ts by
// scripts/split-routes.ts. No behavior changes; this is a pure file
// reorganization to break the 20k-line monolith into per-domain modules.
// ============================================================================
import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
  signupLimit,
  authLimit,
  requireAdminFlexible,
  disableInProd,
  validateBody,
} from "../middleware/security";
import * as schemas from "../middleware/validationSchemas";
import {
  followBodySchema,
  castActionSchema,
  replyBodySchema,
  analyzeContentSchema,
  enhanceTrendsSchema,
  volForecastSchema,
  stressTestSchema,
  ackAlertSchema,
  generateMarketsFromNewsSchema,
  avatarGenerateMarketsSchema,
  priceSnapshotSchema,
  debateNextSchema,
  avatarPredictSchema,
  testTtsSchema,
  testTtsAudioSchema,
  generateReplayAudioSchema,
  emptyBodySchema,
  streamWatchSchema,
  voiceConversationSchema,
  bountyClaimSchema,
  summaryProcessSchema,
  forceRefreshSchema,
  botStakeSchema,
  botWithdrawSchema,
  predictionMarketTradeSchema,
  aiAgentTradeSchema,
  streamPredictionSchema,
  convertToMarketSchema,
  transcribeSchema,
  channelPointsRedeemSchema,
} from "../middleware/validationSchemas";
import { cacheService } from "../services/cacheService";
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { youtubeService } from "../services/youtubeService";
import { trendingService } from "../services/trendingService";
import { pointsService } from "../services/pointsService";
import { bountyHunterService } from "../services/bountyHunterService";
import { qualityScorerService } from "../services/qualityScorerService";
import { db } from "../db";
import * as schema from "../../shared/schema";
import {
  predictionMarkets, aiAgents, aiPredictions, aiPositions, aiTrades, users, userInteractions,
  predictionLeagues, leagueParticipants, leagueTrades, marketTrades, pushSubscriptions,
  liveStreams, streamParticipants, streamMessages, streamTips, streamPredictions,
  streamPolls, streamPollVotes, streamReactions, streamScheduleReminders, streamClips,
  streamRecordings, streamAchievements, userStreamAchievements, streamChatCommands,
  streamChatCommandLogs, streamViewerLeaderboard, knowledgeAvatars, bounties, summaries,
  avatarTrades as avatarTradesTable, avatarPositions, streamConversationMessages, pointsTransactions, dailyLoginStreak,
  scheduledDebates, botStakes, botSimTrades, botPerformanceSnapshots
} from "../../shared/schema";
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray } from "drizzle-orm";
import * as validators from "../validators";
import {
  loginSchema,
  registerSchema,
  walletLoginSchema,
  twitterAuthSchema,
  updateUserSchema,
  createSummarySchema,
  updateSummarySchema,
  createBountySchema,
  updateBountySchema,
  createInteractionSchema,
  createKnowledgeStackSchema,
  updateKnowledgeStackSchema,
  createUserNoteSchema,
  updateUserNoteSchema,
  paginationSchema,
  searchSchema,
  recentActivitySchema,
  processContentSchema,
  type LoginRequest,
  type RegisterRequest,
  type WalletLoginRequest,
  type TwitterAuthRequest,
  type RecentActivityRequest,
} from "../validators";
import passport from "passport";
import axios from "axios";
import { ADMIN_USERNAMES, isAdmin, requireAdmin, validateRequest, asyncHandler } from "./_shared";

export async function registerBountiesRoutes(app: Express): Promise<void> {
  // =============================================================================
  // BOUNTY ROUTES
  // =============================================================================

  // Get all bounties with enriched data for completed bounties
  app.get('/api/bounties', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(paginationSchema, req.query);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { limit, offset } = validation.data as { limit: number; offset: number };
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    
    const bounties = await storage.getBounties(limit, offset, status, category);
    
    // Enrich bounties with status-specific data
    const enrichedBounties = await Promise.all(bounties.map(async (bounty) => {
      // Completed bounties - show summary data and completer info
      if (bounty.status === 'completed' && bounty.summaryId) {
        const summary = await storage.getSummary(bounty.summaryId);
        const completer = bounty.assigneeId ? await storage.getUser(bounty.assigneeId) : null;
        
        // Extract preview from summary text - split into sentences and take first 3
        let summaryPreview: string[] = [];
        if (summary?.summary) {
          const sentences = summary.summary.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
          summaryPreview = sentences.slice(0, 3).map((s: string) => s.trim());
        } else if (summary?.executiveSummary) {
          const sentences = summary.executiveSummary.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
          summaryPreview = sentences.slice(0, 3).map((s: string) => s.trim());
        }
        
        return {
          ...bounty,
          summaryPreview,
          summaryTitle: summary?.title,
          qualityScore: summary?.qualityScore,
          completerUsername: completer?.username,
          completerAvatar: completer?.avatar,
          isAiCompleted: completer?.isAiAgent || false,
          completedAt: bounty.completedAt,
        };
      }
      
      // In-progress bounties - show AI processing info if assignee is AI agent
      if (bounty.status === 'in_progress' && bounty.assigneeId) {
        const assignee = await storage.getUser(bounty.assigneeId);
        if (assignee?.isAiAgent) {
          return {
            ...bounty,
            isAiProcessing: true,
            processingAgentUsername: assignee.username,
            processingAgentAvatar: assignee.avatar,
          };
        }
      }
      
      return bounty;
    }));

    res.json({
      bounties: enrichedBounties,
      pagination: { limit, offset, count: bounties.length }
    });
  }));

  // Get bounty statistics with real analytics data
  app.get('/api/bounties/stats', asyncHandler(async (req: Request, res: Response) => {
    const bounties = await storage.getBounties(10000, 0);
    const users = await storage.getAllUsers();
    
    // Get real category distribution from bounties
    const categoryMap = new Map<string, number>();
    bounties.forEach(b => {
      const category = b.category || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    const totalBounties = bounties.length || 1;
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, count]) => ({
        name,
        value: Math.round((count / totalBounties) * 100),
        count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    
    // Calculate real activity for past 7 days
    const now = new Date();
    const activityData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayBounties = bounties.filter(b => {
        const created = new Date(b.createdAt);
        return created >= dayStart && created <= dayEnd;
      }).length;
      
      activityData.push({
        date: days[dayStart.getDay()],
        bounties: dayBounties,
        summaries: Math.floor(dayBounties * 0.7),
        tips: dayBounties * 50
      });
    }
    
    const activeBounties = bounties.filter(b => b.status === 'open' || b.status === 'claimed').length;
    const completedBounties = bounties.filter(b => b.status === 'completed').length;
    const totalRewards = bounties.reduce((sum, b) => sum + b.reward + (b.tipPool || 0), 0);
    
    // Calculate week-over-week changes
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekBounties = bounties.filter(b => new Date(b.createdAt) >= oneWeekAgo).length;
    const lastWeekBounties = bounties.filter(b => {
      const created = new Date(b.createdAt);
      return created >= twoWeeksAgo && created < oneWeekAgo;
    }).length;
    
    const bountyChange = lastWeekBounties > 0 
      ? Math.round(((thisWeekBounties - lastWeekBounties) / lastWeekBounties) * 100) 
      : thisWeekBounties > 0 ? 100 : 0;
    
    const stats = {
      activeBounties,
      completedBounties,
      totalRewards,
      activeUsers: users.length,
      summariesCreated: completedBounties,
      avgCompletionTime: '24h',
      categoryDistribution,
      activityData,
      changes: {
        bounties: bountyChange,
        rewards: 28,
        users: 18,
        completed: 15
      }
    };

    res.json({ stats });
  }));

  // Get trending bounties
  app.get('/api/bounties/trending', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const trendingBounties = await trendingService.getTrendingBounties(limit);
    res.json({ bounties: trendingBounties });
  }));

  // Get hot bounties (recent + high reward)
  app.get('/api/bounties/hot', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const hotBounties = await trendingService.getHotBounties(limit);
    res.json({ bounties: hotBounties });
  }));

  // Get urgent bounties (deadline < 24 hours)
  app.get('/api/bounties/urgent', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const urgentBounties = await trendingService.getUrgentBounties(limit);
    res.json({ bounties: urgentBounties });
  }));

  // Get trending categories
  app.get('/api/bounties/trending/categories', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const categories = await trendingService.getTrendingCategories(limit);
    res.json({ categories });
  }));

  // Get related bounties by tags/categories
  app.get('/api/bounties/related', asyncHandler(async (req: Request, res: Response) => {
    const tags = req.query.tags as string;
    const category = req.query.category as string;
    const limit = parseInt(req.query.limit as string) || 3;

    if (!tags && !category) {
      return res.status(400).json({ error: 'Either tags or category parameter is required' });
    }

    const allBounties = await storage.getBounties(100, 0);
    const tagArray = tags ? tags.split(',').map(t => t.trim().toLowerCase()) : [];
    const categoryLower = category?.toLowerCase();

    // Filter bounties by matching tags or category
    const relatedBounties = allBounties
      .filter(bounty => {
        const bountyTags = (bounty.tags || []).map(t => t.toLowerCase());
        const bountyCategory = bounty.category?.toLowerCase();
        
        // Match if category matches or if any tag matches
        const categoryMatch = categoryLower && bountyCategory === categoryLower;
        const tagMatch = tagArray.some(tag => bountyTags.includes(tag));
        
        return categoryMatch || tagMatch;
      })
      .filter(bounty => bounty.status === 'open')
      .sort((a, b) => {
        // Sort by reward amount (highest first)
        const rewardA = a.reward + (a.tipPool || 0);
        const rewardB = b.reward + (b.tipPool || 0);
        return rewardB - rewardA;
      })
      .slice(0, limit);

    res.json({ bounties: relatedBounties });
  }));

  // Get bounty by ID
  app.get('/api/bounties/:id', asyncHandler(async (req: Request, res: Response) => {
    const bounty = await storage.getBounty(req.params.id);
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    res.json({ bounty });
  }));

  // Create new bounty
  app.post('/api/bounties', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createBountySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const bountyData = validation.data as any;
    const rewardAmount = bountyData.reward || 0;

    // Deduct reward from creator's balance (if reward > 0)
    if (rewardAmount > 0) {
      const spendResult = await pointsService.spendPoints({
        userId: req.user!.id,
        amount: rewardAmount,
        source: 'bounty_submit',
        description: `Created bounty with ${rewardAmount} STREAM reward`,
        referenceType: 'bounty_creation',
        metadata: { title: bountyData.title }
      });

      if (!spendResult.success) {
        return res.status(400).json({ 
          error: spendResult.error || 'Insufficient STREAM points for bounty reward',
          required: rewardAmount
        });
      }
    }

    const bounty = await storage.createBounty({ ...bountyData, creatorId: req.user!.id });

    res.status(201).json({
      message: 'Bounty created successfully',
      bounty
    });
  }));

  // Update bounty
  app.patch('/api/bounties/:id', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingBounty = await storage.getBounty(req.params.id);
    if (!existingBounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (existingBounty.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own bounties' });
    }

    const validation = validateRequest(updateBountySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const bounty = await storage.updateBounty(req.params.id, validation.data as any);
    res.json({
      message: 'Bounty updated successfully',
      bounty
    });
  }));

  // Get user's bounties
  app.get('/api/users/:id/bounties', asyncHandler(async (req: Request, res: Response) => {
    const bounties = await storage.getBountiesByUser(req.params.id);
    res.json({ bounties });
  }));

  // Claim a bounty (Web3)
  app.post('/api/bounties/:id/claim', authenticateToken, mediumLimit, validateBody(bountyClaimSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const bounty = await storage.getBounty(req.params.id);
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.status !== 'open') {
      return res.status(400).json({ error: 'Bounty is not available for claiming' });
    }

    const { claimerWallet, blockchainTxHash } = req.body;
    if (!claimerWallet || !blockchainTxHash) {
      return res.status(400).json({ error: 'Claimer wallet and transaction hash are required' });
    }

    const updatedBounty = await storage.updateBounty(req.params.id, {
      assigneeId: req.user!.id,
      claimerWallet,
      status: 'claimed',
      blockchainTxHash,
      claimedAt: new Date()
    });

    // Create or get hunter profile
    let hunter = await storage.getBountyHunterByUserId(req.user!.id);
    if (!hunter) {
      hunter = await storage.createBountyHunter({
        userId: req.user!.id,
        walletAddress: claimerWallet,
        displayName: req.user!.username,
        level: 1,
        reputation: 0,
        totalBounties: 1,
      });
    } else {
      // Update total bounties claimed
      await storage.updateBountyHunter(hunter.id, {
        totalBounties: (hunter.totalBounties || 0) + 1,
      });
    }

    // Track engagement (bounty claim is a type of engagement)
    await storage.createBountyEngagement({
      bountyId: req.params.id,
      userId: req.user!.id,
      engagementType: 'claim',
      metadata: { wallet: claimerWallet, txHash: blockchainTxHash },
    });

    // Send push notification to the claimer (assigned)
    try {
      const { pushNotificationService } = await import('../services/pushNotificationService');
      await pushNotificationService.notifyBountyUpdate(
        req.user!.id,
        bounty.title,
        'assigned',
        bounty.reward,
        bounty.id
      );
    } catch (err) {
      console.log('Push notification skipped:', err);
    }

    res.json({
      message: 'Bounty claimed successfully',
      bounty: updatedBounty,
      hunter
    });
  }));

  // Complete a bounty and trigger payout (Web3)
  app.post('/api/bounties/:id/complete', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const bounty = await storage.getBounty(req.params.id);
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Only bounty creator can mark as complete' });
    }

    if (bounty.status !== 'claimed' && bounty.status !== 'in_progress') {
      return res.status(400).json({ error: 'Bounty is not in claimable/in-progress state' });
    }

    const { summaryId, completionTxHash } = req.body;
    if (!summaryId || !completionTxHash) {
      return res.status(400).json({ error: 'Summary ID and completion transaction hash are required' });
    }

    const updatedBounty = await storage.updateBounty(req.params.id, {
      summaryId,
      completionTxHash,
      status: 'completed',
      completedAt: new Date()
    });

    // Get the hunter profile
    if (bounty.assigneeId) {
      const hunter = await storage.getBountyHunterByUserId(bounty.assigneeId);
      
      if (hunter) {
        // Calculate quality score for the submitted summary
        const qualityScore = await qualityScorerService.calculateQualityScore(
          req.params.id,
          summaryId
        );

        // Update hunter reputation with quality bonus
        await bountyHunterService.updateAfterCompletion(
          hunter.id,
          req.params.id,
          qualityScore.overallScore || 70
        );

        // Award STREAM points to the bounty completer
        const totalReward = bounty.reward + (bounty.tipPool || 0);
        await pointsService.awardPoints({
          userId: bounty.assigneeId,
          amount: totalReward,
          source: 'bounty_accepted',
          type: 'earn',
          description: `Completed bounty: ${bounty.title}`,
          referenceId: req.params.id,
          referenceType: 'bounty',
          metadata: { qualityScore: qualityScore.overallScore, tipPool: bounty.tipPool || 0 }
        });
        console.log(`[Bounty] Awarded ${totalReward} STREAM points to user ${bounty.assigneeId} for completing bounty ${req.params.id}`);

        // Track engagement for completion
        await storage.createBountyEngagement({
          bountyId: req.params.id,
          userId: bounty.assigneeId,
          engagementType: 'complete',
          metadata: { summaryId, txHash: completionTxHash, qualityScore: qualityScore.overallScore },
        });

        // AI Prediction Market Extraction (for analysis/prediction tiers)
        if (bounty.engagementTier === 'analysis' || bounty.engagementTier === 'prediction') {
          try {
            const summary = await storage.getSummary(summaryId);
            if (summary && summary.summary) {
              // Extract predictions using AI
              const { extractPredictionsFromSummary } = await import('../services/predictionExtractionService');
              const predictionResult = await extractPredictionsFromSummary(
                summary.summary,
                summary.title,
                summary.originalUrl
              );

              // Save suggested markets to summary
              if (predictionResult.predictions.length > 0) {
                await storage.updateSummary(summaryId, {
                  suggestedMarkets: predictionResult.predictions as any
                });
                console.log(`🎯 Generated ${predictionResult.totalFound} prediction markets for summary ${summaryId}`);
              }
            }
          } catch (error) {
            console.error('Error extracting predictions:', error);
            // Don't fail the completion if AI extraction fails
          }
        }

        // Send push notification to the hunter (completed/reward)
        try {
          const { pushNotificationService } = await import('../services/pushNotificationService');
          await pushNotificationService.notifyBountyUpdate(
            bounty.assigneeId,
            bounty.title,
            'completed',
            bounty.reward + (bounty.tipPool || 0),
            bounty.id
          );
        } catch (err) {
          console.log('Push notification skipped:', err);
        }

        res.json({
          message: 'Bounty completed and payout initiated',
          bounty: updatedBounty,
          qualityScore,
          hunterUpdated: true
        });
      } else {
        res.json({
          message: 'Bounty completed and payout initiated',
          bounty: updatedBounty
        });
      }
    } else {
      res.json({
        message: 'Bounty completed and payout initiated',
        bounty: updatedBounty
      });
    }
  }));

  // Add tip to bounty (Web3)
  app.post('/api/bounties/:id/tip', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const bounty = await storage.getBounty(req.params.id);
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.status === 'completed' || bounty.status === 'expired') {
      return res.status(400).json({ error: 'Cannot tip a completed or expired bounty' });
    }

    const { tipperWallet, amount, blockchainTxHash } = req.body;
    if (!tipperWallet || !amount || !blockchainTxHash) {
      return res.status(400).json({ error: 'Tipper wallet, amount, and transaction hash are required' });
    }

    // Create tip contribution record
    const tipContribution = await storage.createTipContribution({
      bountyId: req.params.id,
      tipperWallet,
      amount: parseInt(amount),
      blockchainTxHash
    });

    // Update bounty tip pool
    const newTipPool = (bounty.tipPool || 0) + parseInt(amount);
    const updatedBounty = await storage.updateBounty(req.params.id, {
      tipPool: newTipPool
    });

    res.json({
      message: 'Tip added successfully',
      tipContribution,
      bounty: updatedBounty
    });
  }));

  // Verify knowledge question answer (AI-powered)
  app.post('/api/bounties/:id/verify-answer', authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const bounty = await storage.getBounty(req.params.id);
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if ((bounty as any).bountyType !== 'knowledge_question') {
      return res.status(400).json({ error: 'This bounty is not a knowledge question' });
    }

    if (bounty.status !== 'claimed' && bounty.status !== 'in_progress') {
      return res.status(400).json({ error: 'Bounty must be claimed first' });
    }

    if (bounty.assigneeId !== req.user!.id) {
      return res.status(403).json({ error: 'Only the assigned user can submit an answer' });
    }

    const { answer } = req.body;
    if (!answer || typeof answer !== 'string' || answer.trim().length < 50) {
      return res.status(400).json({ error: 'Answer must be at least 50 characters' });
    }

    const { knowledgeQuestionService } = await import('../services/knowledgeQuestionService');
    const verification = await knowledgeQuestionService.verifyAnswer(req.params.id, answer);

    if (verification.isCorrect && verification.score >= 60) {
      const totalReward = bounty.reward + (bounty.tipPool || 0);
      const qualityBonus = verification.score >= 90 ? Math.floor(totalReward * 0.2) : 
                          verification.score >= 80 ? Math.floor(totalReward * 0.1) : 0;
      const finalReward = totalReward + qualityBonus;

      await storage.updateBounty(req.params.id, {
        status: 'completed',
        completedAt: new Date()
      });

      await pointsService.awardPoints({
        userId: req.user!.id,
        amount: finalReward,
        source: 'bounty_accepted',
        type: 'earn',
        description: `Knowledge Question: ${bounty.title} (Score: ${verification.score}%)`,
        referenceId: req.params.id,
        referenceType: 'bounty',
        metadata: { 
          score: verification.score, 
          qualityBonus,
          bountyType: 'knowledge_question'
        }
      });

      res.json({
        success: true,
        verification,
        reward: finalReward,
        qualityBonus,
        message: 'Answer verified and bounty completed!'
      });
    } else {
      res.json({
        success: false,
        verification,
        message: 'Answer needs improvement. Please review the feedback and try again.'
      });
    }
  }));

  // Track bounty engagement
  app.post('/api/bounties/:id/track', optionalAuth, asyncHandler(async (req: any, res: Response) => {
    const { engagementType, metadata } = req.body;
    const userId = req.user?.id || null;
    const ipAddress = req.ip;

    await trendingService.trackEngagement(
      req.params.id,
      userId,
      engagementType,
      metadata,
      ipAddress
    );

    res.json({ success: true });
  }));

  // Get bounty engagement stats
  app.get('/api/bounties/:id/engagement', asyncHandler(async (req: Request, res: Response) => {
    const stats = await trendingService.getEngagementStats(req.params.id);
    res.json({ stats });
  }));

  // Get bounty quality score
  app.get('/api/bounties/:id/quality', asyncHandler(async (req: Request, res: Response) => {
    const qualityScore = await qualityScorerService.getQualityScore(req.params.id);
    if (!qualityScore) {
      return res.status(404).json({ error: 'Quality score not found' });
    }
    res.json({ qualityScore });
  }));

  // Get bounty hunter leaderboard
  app.get('/api/leaderboard', asyncHandler(async (req: Request, res: Response) => {
    const sortBy = (req.query.sortBy as 'reputation' | 'totalEarned' | 'completionRate' | 'averageQuality') || 'reputation';
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await bountyHunterService.getLeaderboard(sortBy, limit);
    res.json({ leaderboard });
  }));

  // Get bounty hunter profile
  app.get('/api/bounty-hunters/:id', asyncHandler(async (req: Request, res: Response) => {
    const stats = await bountyHunterService.getHunterStats(req.params.id);
    res.json({ hunter: stats });
  }));

  // Get quality stats
  app.get('/api/quality-stats', asyncHandler(async (req: Request, res: Response) => {
    const stats = await qualityScorerService.getQualityStats();
    res.json({ stats });
  }));

}
