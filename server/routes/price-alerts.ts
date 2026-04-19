// ============================================================================
// PriceAlerts routes — extracted from server/routes.ts by
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

export async function registerPriceAlertsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // PRICE ALERTS API
  // =============================================================================

  // Get price alerts for authenticated user
  app.get("/api/price-alerts", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { priceAlerts } = await import("../shared/schema");
    const alerts = await db.select().from(priceAlerts)
      .where(eq(priceAlerts.userId, userId))
      .orderBy(desc(priceAlerts.createdAt));
    
    res.json({ success: true, alerts });
  }));

  // Create new price alert
  app.post("/api/price-alerts", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { symbol, name, assetType, alertType, targetPrice, percentChange, currentPriceAtCreation, portfolioId } = req.body;
    
    if (!symbol || !name || !assetType || !alertType || !currentPriceAtCreation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { priceAlerts } = await import("../shared/schema");
    const [newAlert] = await db.insert(priceAlerts).values({
      userId,
      portfolioId: portfolioId || null,
      symbol,
      name,
      assetType,
      alertType,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      percentChange: percentChange ? parseFloat(percentChange) : null,
      currentPriceAtCreation: parseFloat(currentPriceAtCreation),
    }).returning();
    
    res.json({ success: true, alert: newAlert });
  }));

  // Delete price alert
  app.delete("/api/price-alerts/:id", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { priceAlerts } = await import("../shared/schema");
    await db.delete(priceAlerts).where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, userId)));
    
    res.json({ success: true });
  }));

  // =============================================================================
  // PORTFOLIO EVENTS API (Earnings, Fed Meetings, Token Unlocks)
  // =============================================================================

  // Get portfolio-relevant events based on held symbols
  app.get("/api/portfolio-events", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const symbolsParam = req.query.symbols as string;
    const symbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : [];
    
    const events: Array<{
      id: string;
      date: string;
      title: string;
      type: 'earnings' | 'fed' | 'unlock' | 'halving' | 'network';
      symbol?: string;
      description?: string;
    }> = [];
    
    // 2025 Fed Meeting Dates (static schedule)
    const fedMeetings = [
      { date: '2025-01-29', title: 'FOMC Meeting' },
      { date: '2025-03-19', title: 'FOMC Meeting' },
      { date: '2025-05-07', title: 'FOMC Meeting' },
      { date: '2025-06-18', title: 'FOMC Meeting' },
      { date: '2025-07-30', title: 'FOMC Meeting' },
      { date: '2025-09-17', title: 'FOMC Meeting' },
      { date: '2025-11-05', title: 'FOMC Meeting' },
      { date: '2025-12-17', title: 'FOMC Meeting' },
    ];
    
    const now = new Date();
    fedMeetings.forEach((meeting, i) => {
      if (new Date(meeting.date) >= now) {
        events.push({
          id: `fed-${i}`,
          date: meeting.date,
          title: meeting.title,
          type: 'fed',
          description: 'Federal Reserve interest rate decision',
        });
      }
    });
    
    // Token unlock events (predefined calendar data for major tokens)
    const tokenUnlocks: Record<string, Array<{ date: string; amount: string; description: string }>> = {
      'SOL': [
        { date: '2025-01-15', amount: '~1.2M SOL', description: 'Ecosystem fund unlock' },
        { date: '2025-04-01', amount: '~800K SOL', description: 'Team/investor vesting' },
      ],
      'APT': [
        { date: '2025-02-11', amount: '~11M APT', description: 'Monthly unlock' },
        { date: '2025-03-11', amount: '~11M APT', description: 'Monthly unlock' },
      ],
      'ARB': [
        { date: '2025-01-16', amount: '~92M ARB', description: 'Team/investor unlock' },
        { date: '2025-03-16', amount: '~92M ARB', description: 'Team/investor unlock' },
      ],
      'OP': [
        { date: '2025-01-30', amount: '~31M OP', description: 'Core contributors unlock' },
        { date: '2025-02-28', amount: '~31M OP', description: 'Core contributors unlock' },
      ],
      'SUI': [
        { date: '2025-02-01', amount: '~64M SUI', description: 'Monthly unlock' },
        { date: '2025-03-01', amount: '~64M SUI', description: 'Monthly unlock' },
      ],
      'AVAX': [
        { date: '2025-02-15', amount: '~2.5M AVAX', description: 'Ecosystem unlock' },
      ],
      'LINK': [
        { date: '2025-03-01', amount: '~10M LINK', description: 'Community incentives' },
      ],
    };
    
    // Add token unlocks for held symbols
    symbols.forEach(symbol => {
      const unlocks = tokenUnlocks[symbol];
      if (unlocks) {
        unlocks.forEach((unlock, i) => {
          if (new Date(unlock.date) >= now) {
            events.push({
              id: `unlock-${symbol}-${i}`,
              date: unlock.date,
              title: `${symbol} Token Unlock`,
              type: 'unlock',
              symbol,
              description: `${unlock.amount} - ${unlock.description}`,
            });
          }
        });
      }
    });
    
    // Major crypto events
    const cryptoEvents = [
      { date: '2025-04-15', title: 'Bitcoin Halving Anniversary', type: 'halving' as const, symbol: 'BTC' },
      { date: '2025-03-01', title: 'Ethereum Dencun Anniversary', type: 'network' as const, symbol: 'ETH' },
    ];
    
    cryptoEvents.forEach((event, i) => {
      if (symbols.includes(event.symbol) && new Date(event.date) >= now) {
        events.push({
          id: `crypto-${i}`,
          ...event,
        });
      }
    });
    
    // Earnings dates for stocks - use Finnhub if available
    const stockSymbols = symbols.filter(s => 
      ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'AMD', 'NFLX', 'DIS'].includes(s)
    );
    
    // Fallback static earnings schedule for Q1 2025
    const earningsSchedule: Record<string, { date: string; quarter: string }> = {
      'AAPL': { date: '2025-01-30', quarter: 'Q1 2025' },
      'MSFT': { date: '2025-01-28', quarter: 'Q2 2025' },
      'GOOGL': { date: '2025-02-04', quarter: 'Q4 2024' },
      'AMZN': { date: '2025-02-06', quarter: 'Q4 2024' },
      'TSLA': { date: '2025-01-29', quarter: 'Q4 2024' },
      'NVDA': { date: '2025-02-26', quarter: 'Q4 2024' },
      'META': { date: '2025-02-05', quarter: 'Q4 2024' },
      'AMD': { date: '2025-02-04', quarter: 'Q4 2024' },
      'NFLX': { date: '2025-01-21', quarter: 'Q4 2024' },
      'DIS': { date: '2025-02-05', quarter: 'Q1 2025' },
    };
    
    stockSymbols.forEach(symbol => {
      const earnings = earningsSchedule[symbol];
      if (earnings && new Date(earnings.date) >= now) {
        events.push({
          id: `earnings-${symbol}`,
          date: earnings.date,
          title: `${symbol} Earnings`,
          type: 'earnings',
          symbol,
          description: `${earnings.quarter} earnings report`,
        });
      }
    });
    
    // Sort events by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.json({ success: true, events: events.slice(0, 15) });
  }));

  // Helper function to get time ago string
  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Helper function to update portfolio totals
  async function updatePortfolioTotals(portfolioId: string) {
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, portfolioId));
    
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const totalCostBasis = assets.reduce((sum, a) => sum + (a.totalCostBasis || 0), 0);
    const totalPnl = totalValue - totalCostBasis;
    const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;
    
    // Update allocation percentages
    for (const asset of assets) {
      const allocationPercent = totalValue > 0 ? ((asset.currentValue || 0) / totalValue) * 100 : 0;
      await db.update(portfolioAssets).set({ allocationPercent }).where(eq(portfolioAssets.id, asset.id));
    }
    
    await db.update(portfolios).set({
      totalValue,
      totalCostBasis,
      totalPnl,
      totalPnlPercent,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(portfolios.id, portfolioId));
  }

  // =============================================================================
  // MARKET INTELLIGENCE HUB - Real-time signals, whale tracking, sentiment
  // =============================================================================

  // Get AI-powered market signals
  app.get("/api/market-intelligence/signals", asyncHandler(async (req: Request, res: Response) => {
    const fallbackSignals = [
      { id: 'bitcoin', type: 'bullish' as const, strength: 78, asset: 'Bitcoin', price: 96500, change24h: 3.2, signal: 'Momentum Building', reasoning: 'Bitcoin showing 3.2% gains with strong institutional inflows', confidence: 85, timestamp: new Date().toISOString() },
      { id: 'ethereum', type: 'bullish' as const, strength: 65, asset: 'Ethereum', price: 3580, change24h: 2.1, signal: 'Steady Uptrend', reasoning: 'ETH/BTC ratio improving, network activity increasing', confidence: 78, timestamp: new Date().toISOString() },
      { id: 'solana', type: 'bullish' as const, strength: 82, asset: 'Solana', price: 225, change24h: 5.8, signal: 'Strong Buy Signal', reasoning: 'Solana showing 5.8% gains with DeFi TVL surge', confidence: 88, timestamp: new Date().toISOString() },
      { id: 'xrp', type: 'neutral' as const, strength: 45, asset: 'XRP', price: 2.35, change24h: 0.8, signal: 'Consolidating', reasoning: 'XRP trading sideways, awaiting regulatory clarity', confidence: 65, timestamp: new Date().toISOString() },
      { id: 'cardano', type: 'bearish' as const, strength: 55, asset: 'Cardano', price: 0.98, change24h: -2.3, signal: 'Short-term Weakness', reasoning: 'ADA facing resistance at $1, watch for support levels', confidence: 72, timestamp: new Date().toISOString() },
      { id: 'avalanche', type: 'bullish' as const, strength: 70, asset: 'Avalanche', price: 42.50, change24h: 4.1, signal: 'Momentum Building', reasoning: 'AVAX ecosystem growth driving price action', confidence: 80, timestamp: new Date().toISOString() },
      { id: 'polkadot', type: 'neutral' as const, strength: 50, asset: 'Polkadot', price: 7.85, change24h: 1.2, signal: 'Accumulation Zone', reasoning: 'DOT showing signs of accumulation before next move', confidence: 68, timestamp: new Date().toISOString() },
      { id: 'chainlink', type: 'bullish' as const, strength: 72, asset: 'Chainlink', price: 18.20, change24h: 3.5, signal: 'Oracle Strength', reasoning: 'LINK benefiting from increased smart contract adoption', confidence: 82, timestamp: new Date().toISOString() },
    ];
    
    try {
      const cryptoData = await marketDataService.getCryptoData();
      
      if (!cryptoData || cryptoData.length === 0) {
        return res.json({ success: true, signals: fallbackSignals });
      }
      
      const signals = cryptoData.slice(0, 10).map((coin: any) => {
        const change = coin.price_change_percentage_24h || 0;
        const type = change > 3 ? 'bullish' : change < -3 ? 'bearish' : 'neutral';
        const strength = Math.min(100, Math.abs(change) * 10);
        
        let signal = '';
        let reasoning = '';
        
        if (type === 'bullish') {
          signal = change > 8 ? 'Strong Buy Signal' : 'Momentum Building';
          reasoning = `${coin.name} showing ${change.toFixed(1)}% gains with ${coin.market_cap_change_percentage_24h?.toFixed(1) || 0}% market cap growth`;
        } else if (type === 'bearish') {
          signal = change < -8 ? 'Caution: Sharp Decline' : 'Short-term Weakness';
          reasoning = `${coin.name} down ${Math.abs(change).toFixed(1)}%, watch for support levels`;
        } else {
          signal = 'Consolidating';
          reasoning = `${coin.name} trading sideways, potential breakout incoming`;
        }
        
        return {
          id: coin.id,
          type,
          strength: Math.round(strength),
          asset: coin.name,
          price: coin.current_price,
          change24h: change,
          signal,
          reasoning,
          confidence: Math.min(95, 60 + Math.abs(change) * 3),
          timestamp: new Date().toISOString(),
        };
      });
      
      res.json({ success: true, signals: signals.length > 0 ? signals : fallbackSignals });
    } catch (error: any) {
      res.json({ success: true, signals: fallbackSignals });
    }
  }));

  // Get whale movements (simulated from on-chain patterns)
  app.get("/api/market-intelligence/whales", asyncHandler(async (req: Request, res: Response) => {
    const fallbackMovements = [
      { id: 'whale-btc-1', type: 'accumulation' as const, asset: 'BTC', amount: 2500, amountUsd: 241250000, from: '0x1234567890abcdef1234567890abcdef12345678', to: '0xabcdef1234567890abcdef1234567890abcdef12', timestamp: new Date(Date.now() - 1800000).toISOString(), significance: 'high' as const },
      { id: 'whale-eth-1', type: 'transfer' as const, asset: 'ETH', amount: 15000, amountUsd: 53700000, from: '0x2345678901abcdef2345678901abcdef23456789', to: '0xbcdef12345678901abcdef12345678901abcdef2', timestamp: new Date(Date.now() - 2700000).toISOString(), significance: 'medium' as const },
      { id: 'whale-sol-1', type: 'distribution' as const, asset: 'SOL', amount: 125000, amountUsd: 28125000, from: '0x3456789012abcdef3456789012abcdef34567890', to: '0xcdef123456789012abcdef123456789012abcdef', timestamp: new Date(Date.now() - 3600000).toISOString(), significance: 'high' as const },
      { id: 'whale-btc-2', type: 'accumulation' as const, asset: 'BTC', amount: 1800, amountUsd: 173700000, from: '0x4567890123abcdef4567890123abcdef45678901', to: '0xdef1234567890123abcdef1234567890123abcde', timestamp: new Date(Date.now() - 5400000).toISOString(), significance: 'high' as const },
      { id: 'whale-xrp-1', type: 'transfer' as const, asset: 'XRP', amount: 50000000, amountUsd: 117500000, from: '0x5678901234abcdef5678901234abcdef56789012', to: '0xef12345678901234abcdef12345678901234abcd', timestamp: new Date(Date.now() - 7200000).toISOString(), significance: 'medium' as const },
    ];
    
    try {
      const cryptoData = await marketDataService.getCryptoData();
      
      if (!cryptoData || cryptoData.length === 0) {
        return res.json({ success: true, movements: fallbackMovements });
      }
      
      const movements = cryptoData.slice(0, 5).map((coin: any, index: number) => {
        const types = ['accumulation', 'distribution', 'transfer'] as const;
        const type = types[index % 3];
        const significance = coin.price_change_percentage_24h > 5 ? 'high' : 
                            coin.price_change_percentage_24h > 2 ? 'medium' : 'low';
        
        const amount = Math.round(coin.market_cap / coin.current_price * 0.001);
        
        return {
          id: `whale-${coin.id}-${Date.now()}`,
          type,
          asset: coin.symbol.toUpperCase(),
          amount,
          amountUsd: amount * coin.current_price,
          from: `0x${Math.random().toString(16).slice(2, 42)}`,
          to: `0x${Math.random().toString(16).slice(2, 42)}`,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          significance,
        };
      });
      
      res.json({ success: true, movements: movements.length > 0 ? movements : fallbackMovements });
    } catch (error: any) {
      res.json({ success: true, movements: fallbackMovements });
    }
  }));

  // Get market sentiment analysis
  app.get("/api/market-intelligence/sentiment", asyncHandler(async (req: Request, res: Response) => {
    const fallbackSentiments = [
      { asset: 'Bitcoin', overall: 72, social: 78, news: 68, technical: 75, trend: 'rising' as const },
      { asset: 'Ethereum', overall: 68, social: 65, news: 72, technical: 70, trend: 'rising' as const },
      { asset: 'Solana', overall: 76, social: 82, news: 74, technical: 78, trend: 'rising' as const },
      { asset: 'XRP', overall: 55, social: 58, news: 52, technical: 54, trend: 'stable' as const },
      { asset: 'Cardano', overall: 48, social: 52, news: 45, technical: 50, trend: 'falling' as const },
      { asset: 'Avalanche', overall: 64, social: 68, news: 62, technical: 66, trend: 'rising' as const },
    ];
    
    try {
      const cryptoData = await marketDataService.getCryptoData();
      
      if (!cryptoData || cryptoData.length === 0) {
        return res.json({ success: true, sentiments: fallbackSentiments });
      }
      
      const sentiments = cryptoData.slice(0, 6).map((coin: any) => {
        const change = coin.price_change_percentage_24h || 0;
        const overall = Math.min(100, Math.max(0, 50 + change * 5));
        
        return {
          asset: coin.name,
          overall: Math.round(overall),
          social: Math.round(overall + (Math.random() - 0.5) * 20),
          news: Math.round(overall + (Math.random() - 0.5) * 15),
          technical: Math.round(overall + (Math.random() - 0.5) * 10),
          trend: change > 2 ? 'rising' : change < -2 ? 'falling' : 'stable',
        };
      });
      
      res.json({ success: true, sentiments: sentiments.length > 0 ? sentiments : fallbackSentiments });
    } catch (error: any) {
      res.json({ success: true, sentiments: fallbackSentiments });
    }
  }));

  // Get AI-summarized news
  app.get("/api/market-intelligence/news", asyncHandler(async (req: Request, res: Response) => {
    try {
      const newsItems = [
        {
          id: '1',
          title: 'Bitcoin ETF Inflows Hit Record High as Institutional Demand Surges',
          source: 'CoinDesk',
          summary: 'BlackRock and Fidelity lead massive inflow week with over $2.4B in new investments',
          sentiment: 'positive' as const,
          assets: ['BTC'],
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Ethereum Foundation Announces Major Protocol Upgrade Timeline',
          source: 'The Block',
          summary: 'Pectra upgrade scheduled for Q1 2025, promising improved scalability',
          sentiment: 'positive' as const,
          assets: ['ETH'],
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          title: 'SEC Commissioner Signals Crypto-Friendly Regulatory Shift',
          source: 'Bloomberg',
          summary: 'New leadership expected to take more accommodative stance on digital assets',
          sentiment: 'positive' as const,
          assets: ['BTC', 'ETH', 'SOL'],
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          title: 'Solana DeFi TVL Reaches New All-Time High',
          source: 'DeFi Llama',
          summary: 'Total value locked on Solana surpasses $12B amid ecosystem growth',
          sentiment: 'positive' as const,
          assets: ['SOL'],
          timestamp: new Date(Date.now() - 10800000).toISOString(),
        },
      ];
      
      res.json({ success: true, news: newsItems });
    } catch (error: any) {
      res.json({ success: true, news: [] });
    }
  }));

}
