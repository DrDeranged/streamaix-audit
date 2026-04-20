// ============================================================================
// PortfolioNews routes — extracted from server/routes.ts by
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

export async function registerPortfolioNewsRoutes(app: Express): Promise<void> {
  // =============================================================================
  // PORTFOLIO NEWS API
  // =============================================================================

  // Get portfolio-relevant news based on held symbols
  app.get("/api/portfolio-news", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const symbolsParam = req.query.symbols as string;
    const symbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : [];
    
    const { newsService } = await import("../services/newsService");
    const allNews = await newsService.getCryptoNews(50);
    
    // Expanded symbol mappings including crypto, stocks, ETFs, and mining companies
    const symbolMappings: Record<string, string[]> = {
      // Major cryptos
      'BTC': ['bitcoin', 'btc'],
      'ETH': ['ethereum', 'eth', 'ether'],
      'SOL': ['solana', 'sol'],
      'XRP': ['ripple', 'xrp'],
      'ADA': ['cardano', 'ada'],
      'DOT': ['polkadot', 'dot'],
      'AVAX': ['avalanche', 'avax'],
      'LINK': ['chainlink', 'link'],
      'MATIC': ['polygon', 'matic'],
      'UNI': ['uniswap', 'uni'],
      'AAVE': ['aave'],
      'DOGE': ['dogecoin', 'doge'],
      'SHIB': ['shiba', 'shib'],
      // New cryptos
      'HYPE': ['hyperliquid', 'hype', 'hlp'],
      'SUI': ['sui'],
      'SEI': ['sei network', 'sei'],
      'TIA': ['celestia', 'tia'],
      'INJ': ['injective', 'inj'],
      'ARB': ['arbitrum', 'arb'],
      'OP': ['optimism', 'op token'],
      'PEPE': ['pepe'],
      'WIF': ['dogwifhat', 'wif'],
      'TON': ['toncoin', 'ton', 'telegram'],
      // Tech stocks
      'AAPL': ['apple', 'aapl', 'iphone'],
      'GOOGL': ['google', 'alphabet', 'googl'],
      'MSFT': ['microsoft', 'msft'],
      'TSLA': ['tesla', 'tsla', 'elon'],
      'NVDA': ['nvidia', 'nvda', 'gpu', 'ai chip'],
      'AMD': ['amd', 'advanced micro'],
      'AMZN': ['amazon', 'amzn', 'aws'],
      'META': ['meta', 'facebook', 'zuckerberg'],
      // Bitcoin mining stocks
      'MARA': ['marathon digital', 'mara', 'marathon'],
      'RIOT': ['riot platforms', 'riot blockchain', 'riot'],
      'HUT': ['hut 8', 'hut8'],
      'CORZ': ['core scientific', 'corz'],
      'WULF': ['terawulf', 'wulf'],
      'GLXY': ['galaxy digital', 'glxy', 'novogratz'],
      'CLSK': ['cleanspark', 'clsk'],
      'BITF': ['bitfarms', 'bitf'],
      'IREN': ['iris energy', 'iren'],
      // Crypto-related stocks
      'COIN': ['coinbase', 'coin'],
      'MSTR': ['microstrategy', 'mstr', 'saylor'],
      // ETFs
      'IBIT': ['ibit', 'blackrock bitcoin'],
      'FBTC': ['fidelity bitcoin', 'fbtc'],
      'GBTC': ['grayscale', 'gbtc'],
      'SPY': ['s&p 500', 'spy', 'sp500'],
      'QQQ': ['nasdaq', 'qqq', 'tech stocks'],
    };
    
    const relevantNews = allNews.filter(article => {
      const titleLower = article.title.toLowerCase();
      const summaryLower = article.summary.toLowerCase();
      
      return symbols.some(symbol => {
        const symbolLower = symbol.toLowerCase();
        const keywords = symbolMappings[symbol.toUpperCase()] || [symbolLower];
        return keywords.some(kw => titleLower.includes(kw) || summaryLower.includes(kw));
      });
    });
    
    // If no relevant news found but user has assets, show general market news
    let finalNews = relevantNews;
    if (relevantNews.length < 3 && allNews.length > 0) {
      // Add general crypto/market news as fallback
      const marketKeywords = ['market', 'crypto', 'bitcoin', 'stock', 'price', 'rally', 'drop'];
      const generalNews = allNews.filter(article => {
        const titleLower = article.title.toLowerCase();
        return marketKeywords.some(kw => titleLower.includes(kw));
      }).slice(0, 5 - relevantNews.length);
      finalNews = [...relevantNews, ...generalNews];
    }
    
    const newsWithSentiment = finalNews.slice(0, 10).map(article => {
      const titleLower = article.title.toLowerCase();
      const bullishKeywords = ['surge', 'rally', 'bullish', 'record', 'gains', 'pump', 'soar', 'breakthrough', 'milestone', 'upgrade', 'adoption'];
      const bearishKeywords = ['crash', 'plunge', 'bearish', 'decline', 'drop', 'selloff', 'warning', 'concern', 'dump', 'fall'];
      
      const bullishScore = bullishKeywords.filter(kw => titleLower.includes(kw)).length;
      const bearishScore = bearishKeywords.filter(kw => titleLower.includes(kw)).length;
      
      let sentiment = 'neutral';
      if (bullishScore > bearishScore) sentiment = 'bullish';
      else if (bearishScore > bullishScore) sentiment = 'bearish';
      
      const matchedSymbol = symbols.find(symbol => {
        const symbolLower = symbol.toLowerCase();
        return titleLower.includes(symbolLower) || titleLower.includes(symbolLower.slice(0, 3));
      }) || symbols[0] || '';
      
      const timeAgo = getTimeAgo(new Date(article.published));
      
      return {
        symbol: matchedSymbol,
        title: article.title,
        source: article.source,
        time: timeAgo,
        sentiment,
        url: article.url,
      };
    });
    
    res.json({ success: true, news: newsWithSentiment });
  }));

  // Get news for a specific asset symbol
  app.get("/api/portfolio/news/:symbol", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { symbol } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { newsService } = await import("../services/newsService");
    const allNews = await newsService.getCryptoNews(50);
    
    const symbolMappings: Record<string, string[]> = {
      'BTC': ['bitcoin', 'btc'], 'ETH': ['ethereum', 'eth', 'ether'], 'SOL': ['solana', 'sol'],
      'XRP': ['ripple', 'xrp'], 'ADA': ['cardano', 'ada'], 'DOT': ['polkadot', 'dot'],
      'AVAX': ['avalanche', 'avax'], 'LINK': ['chainlink', 'link'], 'MATIC': ['polygon', 'matic'],
      'DOGE': ['dogecoin', 'doge'], 'SHIB': ['shiba', 'shib'], 'HYPE': ['hyperliquid', 'hype'],
      'AAPL': ['apple', 'aapl'], 'GOOGL': ['google', 'alphabet'], 'MSFT': ['microsoft', 'msft'],
      'TSLA': ['tesla', 'tsla'], 'NVDA': ['nvidia', 'nvda'], 'AMD': ['amd'], 'AMZN': ['amazon', 'amzn'],
      'META': ['meta', 'facebook'], 'COIN': ['coinbase', 'coin'], 'MSTR': ['microstrategy', 'mstr'],
      'SPY': ['s&p 500', 'spy'], 'QQQ': ['nasdaq', 'qqq'], 'IBIT': ['ibit', 'blackrock bitcoin'],
    };
    
    const keywords = symbolMappings[symbol.toUpperCase()] || [symbol.toLowerCase()];
    
    const relevantNews = allNews.filter(article => {
      const titleLower = article.title.toLowerCase();
      const summaryLower = article.summary.toLowerCase();
      return keywords.some(kw => titleLower.includes(kw) || summaryLower.includes(kw));
    }).slice(0, 5);
    
    const bullishKeywords = ['surge', 'rally', 'bullish', 'record', 'gains', 'pump', 'soar', 'breakthrough'];
    const bearishKeywords = ['crash', 'plunge', 'bearish', 'decline', 'drop', 'selloff', 'warning'];
    
    const newsWithSentiment = relevantNews.map(article => {
      const titleLower = article.title.toLowerCase();
      const bullishScore = bullishKeywords.filter(kw => titleLower.includes(kw)).length;
      const bearishScore = bearishKeywords.filter(kw => titleLower.includes(kw)).length;
      let sentiment = 'neutral';
      if (bullishScore > bearishScore) sentiment = 'bullish';
      else if (bearishScore > bullishScore) sentiment = 'bearish';
      
      return {
        title: article.title,
        source: article.source,
        time: getTimeAgo(new Date(article.published)),
        sentiment,
        url: article.url,
      };
    });
    
    res.json({ success: true, news: newsWithSentiment });
  }));

  // AI Financial Advisor Chat endpoint
  app.post("/api/portfolio/advisor-chat", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { portfolioId, question, context } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const portfolioContext = context ? `
Portfolio Overview:
- Total Value: $${context.totalValue?.toLocaleString() || 'Unknown'}
- Number of Assets: ${context.assets?.length || 0}
- Asset Allocation: ${context.allocation ? Object.entries(context.allocation).map(([k, v]) => `${k}: ${v}%`).join(', ') : 'Unknown'}
${context.assets?.length > 0 ? `
Top Holdings:
${context.assets.slice(0, 5).map((a: any) => `- ${a.symbol} (${a.assetType}): $${a.currentValue?.toLocaleString() || 0}, P&L: ${a.unrealizedPnlPercent?.toFixed(1) || 0}%`).join('\n')}
` : ''}` : '';

    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-missing-deploy-time-key" });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI financial advisor for StreamAiX, a decentralized investment platform. Provide concise, actionable advice based on the user's portfolio. Be friendly but professional. Focus on:
- Risk management and diversification
- Tax optimization strategies
- Rebalancing recommendations
- Market insights relevant to their holdings
Keep responses under 200 words. Do not provide specific buy/sell recommendations for individual securities.`
          },
          {
            role: 'user',
            content: `${portfolioContext}\n\nUser Question: ${question}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });
      
      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
      
      res.json({ success: true, response });
    } catch (error: any) {
      console.error('AI Advisor chat error:', error);
      res.json({ 
        success: true, 
        response: "I'm currently experiencing high demand. Here are some general tips: Consider maintaining a diversified portfolio across asset classes, review your positions regularly, and ensure your risk level matches your investment goals. Feel free to ask again in a moment!"
      });
    }
  }));

}
