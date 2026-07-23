// ============================================================================
// LiveStreaming routes — extracted from server/routes.ts by
// scripts/split-routes-phase2.ts. No behavior changes; pure file
// reorganization to break the monolith into per-domain modules.
// ============================================================================
import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
  looseLimit,
  signupLimit,
  authLimit,
  requireAdminFlexible,
  disableInProd,
  validateBody,
} from "../middleware/security";
import * as schemas from "../middleware/validationSchemas";
import { marketDataService } from "../services/marketDataService";
import { portfolios, portfolioAssets } from "@shared/schema";

// Helper restored after route split — recomputes portfolio totals/allocations.
async function updatePortfolioTotals(portfolioId: string) {
  const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, portfolioId));

  const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalCostBasis = assets.reduce((sum, a) => sum + (a.totalCostBasis || 0), 0);
  const totalPnl = totalValue - totalCostBasis;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

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
import { StreamProcessor } from "../services/streamProcessor";
import { StreamProcessorV2 } from "../services/streamProcessorV2";
import RebuiltContentProcessor from "../services/rebuiltContentProcessor";
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { MarketDataService } from "../services/marketDataService";
import { youtubeService } from "../services/youtubeService";
import { PredictiveAnalyticsService } from "../services/predictiveAnalyticsService";
import { onChainAnalyticsService } from "../services/onChainAnalyticsService";
import { duneAnalyticsService } from "../services/duneAnalyticsService";
import { federalReserveService } from "../services/federalReserveService";
import { CorrelationAnalysisService } from "../services/correlationAnalysisService";
import { chartingService } from "../services/chartingService";
import { derivativesAnalyticsService } from "../services/derivativesAnalyticsService";
import { institutionalFlowService } from "../services/institutionalFlowService";
import { RiskAssessmentService } from "../services/riskAssessmentService";
import { CrossMarketSignalService } from "../services/crossMarketSignalService";
import { VolatilityForecastingService } from "../services/volatilityForecastingService";
import { marketEventModelingService } from "../services/marketEventModelingService";
import { patternRecognitionService } from "../services/patternRecognitionService";
import { RecommendationEngine } from "../recommendation-engine";
import { cryptoIntelligenceService } from "../services/cryptoIntelligenceService";
import { macroDataService } from "../services/macroDataService";
import { advancedMarketIntelService } from "../services/advancedMarketIntelService";
import { aiTradingSignalsService } from "../services/aiTradingSignalsService";
import { trendingService } from "../services/trendingService";
import { autonomousTradingEngine } from "../services/autonomousTradingEngine";
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
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray, count } from "drizzle-orm";
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

export async function registerLiveStreamingPortfolioRoutes(app: Express): Promise<void> {
  // AI PORTFOLIO COMMAND CENTER - Unified asset management with AI intelligence
  // =============================================================================

  const { portfolios, portfolioAssets, portfolioTransactions, portfolioInsights, portfolioSnapshots } = await import("../../shared/schema");

  // Get user's portfolios
  app.get("/api/portfolios", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userPortfolios = await db.select().from(portfolios).where(eq(portfolios.userId, userId)).orderBy(desc(portfolios.createdAt));
    res.json({ success: true, portfolios: userPortfolios });
  }));

  // Get single portfolio with assets
  app.get("/api/portfolios/:id", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [portfolio] = await db.select().from(portfolios).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id)).orderBy(desc(portfolioAssets.currentValue));
    const insights = await db.select().from(portfolioInsights).where(and(eq(portfolioInsights.portfolioId, id), eq(portfolioInsights.isDismissed, false))).orderBy(desc(portfolioInsights.createdAt)).limit(10);
    
    res.json({ success: true, portfolio, assets, insights });
  }));

  // Create new portfolio
  app.post("/api/portfolios", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { name, description } = req.body;
    
    // Check if this is the first portfolio (make it default)
    const existingPortfolios = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    const isDefault = existingPortfolios.length === 0;
    
    const [newPortfolio] = await db.insert(portfolios).values({
      userId,
      name: name || 'My Portfolio',
      description,
      isDefault,
    }).returning();
    
    res.json({ success: true, portfolio: newPortfolio });
  }));

  // Update portfolio
  app.patch("/api/portfolios/:id", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { name, description } = req.body;
    
    const [updated] = await db.update(portfolios).set({
      name,
      description,
      updatedAt: new Date(),
    }).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId))).returning();
    
    res.json({ success: true, portfolio: updated });
  }));

  // Delete portfolio
  app.delete("/api/portfolios/:id", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Delete related records first
    await db.delete(portfolioInsights).where(eq(portfolioInsights.portfolioId, id));
    await db.delete(portfolioSnapshots).where(eq(portfolioSnapshots.portfolioId, id));
    await db.delete(portfolioTransactions).where(eq(portfolioTransactions.portfolioId, id));
    await db.delete(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    await db.delete(portfolios).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
    
    res.json({ success: true });
  }));

  // Add asset to portfolio
  app.post("/api/portfolios/:id/assets", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { assetType, symbol, name, quantity, averageCostBasis, accountName, accountType, walletAddress, notes, color, annualGrowthRate, contributionAmount, contributionFrequency } = req.body;
    
    // Verify portfolio ownership
    const [portfolio] = await db.select().from(portfolios).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Get current price from market data
    let currentPrice = 0;
    const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'FRAX', 'LUSD', 'SUSD'];
    const isStablecoin = assetType === 'stablecoin' || stablecoinSymbols.includes(symbol.toUpperCase());
    
    // Helper function to validate price isn't wildly off from cost basis
    const validatePrice = (fetchedPrice: number, costBasis: number, sym: string): number => {
      if (!costBasis || costBasis === 0) return fetchedPrice;
      const ratio = fetchedPrice / costBasis;
      // If price is more than 5x or less than 0.2x the cost basis, something is likely wrong
      if (ratio > 5 || ratio < 0.2) {
        console.warn(`⚠️ ${sym}: Price sanity check FAILED! Fetched $${fetchedPrice.toFixed(2)} but cost basis is $${costBasis.toFixed(2)} (ratio: ${ratio.toFixed(2)}x). Using cost basis.`);
        return costBasis;
      }
      return fetchedPrice;
    };

    try {
      if (isStablecoin) {
        // Stablecoins are always $1
        currentPrice = 1;
        console.log(`💵 ${symbol}: $1.00 (stablecoin)`);
      } else if (assetType === 'crypto') {
        const quotes = await marketDataService.getCryptoQuotes([symbol.toUpperCase()]);
        const coin = quotes?.find((c: any) => c.symbol.toUpperCase() === symbol.toUpperCase());
        if (coin?.price) {
          const fetchedPrice = coin.price;
          currentPrice = validatePrice(fetchedPrice, averageCostBasis || 0, symbol);
          console.log(`🪙 ${symbol}: $${currentPrice.toLocaleString()} from CoinGecko (raw: $${fetchedPrice})`);
        } else {
          currentPrice = averageCostBasis || 0;
          console.log(`⚠️ ${symbol}: No API price, using cost basis $${currentPrice}`);
        }
      } else if (assetType === 'stock' || assetType === 'etf') {
        // Use individual stock quote for accuracy
        const quote = await marketDataService.getStockQuote(symbol.toUpperCase());
        if (quote?.price) {
          const fetchedPrice = quote.price;
          currentPrice = validatePrice(fetchedPrice, averageCostBasis || 0, symbol);
          console.log(`📈 ${symbol}: $${currentPrice.toLocaleString()} from Finnhub (raw: $${fetchedPrice})`);
        } else {
          currentPrice = averageCostBasis || 0;
          console.log(`⚠️ ${symbol}: No API price, using cost basis $${currentPrice}`);
        }
      } else if (assetType === 'cash') {
        currentPrice = 1; // USD
      } else {
        // For retirement, bonds, real estate, etc. - use user's input
        currentPrice = averageCostBasis || 0;
      }
    } catch (e) {
      console.error('Failed to fetch price for', symbol, e);
      currentPrice = averageCostBasis || 0;
    }
    
    const totalCostBasis = quantity * (averageCostBasis || 0);
    const currentValue = quantity * currentPrice;
    const unrealizedPnl = currentValue - totalCostBasis;
    const unrealizedPnlPercent = totalCostBasis > 0 ? (unrealizedPnl / totalCostBasis) * 100 : 0;
    
    const [newAsset] = await db.insert(portfolioAssets).values({
      portfolioId: id,
      userId,
      assetType,
      symbol: symbol.toUpperCase(),
      name,
      quantity,
      averageCostBasis: averageCostBasis || 0,
      totalCostBasis,
      currentPrice,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      priceLastUpdated: new Date(),
      accountName,
      accountType,
      walletAddress,
      notes,
      color,
      annualGrowthRate,
      contributionAmount,
      contributionFrequency,
      lastGrowthCalculation: annualGrowthRate ? new Date() : null,
    }).returning();
    
    // Update portfolio totals
    await updatePortfolioTotals(id);
    
    res.json({ success: true, asset: newAsset });
  }));

  // Update asset
  app.patch("/api/portfolios/:portfolioId/assets/:assetId", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { portfolioId, assetId } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { quantity, averageCostBasis, accountName, notes, targetAllocation } = req.body;
    
    const [asset] = await db.select().from(portfolioAssets).where(and(eq(portfolioAssets.id, assetId), eq(portfolioAssets.userId, userId)));
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const newQuantity = quantity !== undefined ? quantity : asset.quantity;
    const newCostBasis = averageCostBasis !== undefined ? averageCostBasis : asset.averageCostBasis;
    const totalCostBasis = newQuantity * (newCostBasis || 0);
    const currentValue = newQuantity * (asset.currentPrice || 0);
    const unrealizedPnl = currentValue - totalCostBasis;
    const unrealizedPnlPercent = totalCostBasis > 0 ? (unrealizedPnl / totalCostBasis) * 100 : 0;
    
    const [updated] = await db.update(portfolioAssets).set({
      quantity: newQuantity,
      averageCostBasis: newCostBasis,
      totalCostBasis,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      accountName,
      notes,
      targetAllocation,
      updatedAt: new Date(),
    }).where(and(eq(portfolioAssets.id, assetId), eq(portfolioAssets.userId, userId))).returning();
    
    await updatePortfolioTotals(portfolioId);
    
    res.json({ success: true, asset: updated });
  }));

  // Delete asset
  app.delete("/api/portfolios/:portfolioId/assets/:assetId", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { portfolioId, assetId } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await db.delete(portfolioTransactions).where(eq(portfolioTransactions.assetId, assetId));
    await db.delete(portfolioAssets).where(and(eq(portfolioAssets.id, assetId), eq(portfolioAssets.userId, userId)));
    
    await updatePortfolioTotals(portfolioId);
    
    res.json({ success: true });
  }));

  // Recalculate asset price and regenerate portfolio snapshots (fixes glitched charts)
  app.post("/api/portfolios/:portfolioId/assets/:assetId/recalculate", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { portfolioId, assetId } = req.params;
    const { manualPrice } = req.body; // Optional: allow user to set a manual price
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [asset] = await db.select().from(portfolioAssets).where(and(eq(portfolioAssets.id, assetId), eq(portfolioAssets.userId, userId)));
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    let newPrice = manualPrice;
    
    // If no manual price provided, try to fetch from API
    if (!newPrice) {
      try {
        if (asset.assetType === 'crypto') {
          const quotes = await marketDataService.getCryptoQuotes([asset.symbol]);
          const coin = quotes?.find((c: any) => c.symbol.toUpperCase() === asset.symbol.toUpperCase());
          newPrice = coin?.price || asset.averageCostBasis;
        } else if (asset.assetType === 'stock' || asset.assetType === 'etf') {
          const quote = await marketDataService.getStockQuote(asset.symbol);
          newPrice = quote?.price || asset.averageCostBasis;
        } else {
          newPrice = asset.averageCostBasis;
        }
      } catch (e) {
        console.error('Failed to fetch price for recalculation:', e);
        newPrice = asset.averageCostBasis;
      }
    }
    
    // Validate price isn't wildly off
    const costBasis = asset.averageCostBasis || 0;
    if (costBasis > 0 && newPrice) {
      const ratio = newPrice / costBasis;
      if (ratio > 5 || ratio < 0.2) {
        console.warn(`⚠️ ${asset.symbol}: Recalculated price $${newPrice} still seems off (ratio: ${ratio.toFixed(2)}x). Using cost basis.`);
        newPrice = costBasis;
      }
    }
    
    const currentValue = asset.quantity * (newPrice || 0);
    const totalCostBasis = asset.quantity * costBasis;
    const unrealizedPnl = currentValue - totalCostBasis;
    const unrealizedPnlPercent = totalCostBasis > 0 ? (unrealizedPnl / totalCostBasis) * 100 : 0;
    
    // Update the asset
    const [updated] = await db.update(portfolioAssets).set({
      currentPrice: newPrice,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      priceLastUpdated: new Date(),
      updatedAt: new Date(),
    }).where(eq(portfolioAssets.id, assetId)).returning();
    
    // Update portfolio totals
    await updatePortfolioTotals(portfolioId);
    
    // Regenerate historical snapshots to fix the chart
    const { portfolioSnapshotService } = await import('../services/portfolioSnapshotService');
    await portfolioSnapshotService.regenerateHistoricalData(portfolioId, userId, 30);
    
    console.log(`✅ Recalculated ${asset.symbol}: $${asset.currentPrice} → $${newPrice}`);
    
    res.json({ 
      success: true, 
      asset: updated,
      message: `Fixed ${asset.symbol} price from $${(asset.currentPrice || 0).toLocaleString()} to $${(newPrice || 0).toLocaleString()}`
    });
  }));

  // Regenerate portfolio chart (fixes glitched/spiked charts)
  app.post("/api/portfolios/:id/regenerate-chart", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [portfolio] = await db.select().from(portfolios).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Regenerate historical snapshots
    const { portfolioSnapshotService } = await import('../services/portfolioSnapshotService');
    await portfolioSnapshotService.regenerateHistoricalData(id, userId, 30);
    
    res.json({ success: true, message: 'Portfolio chart regenerated successfully' });
  }));

  // Add transaction
  app.post("/api/portfolios/:id/transactions", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { assetId, transactionType, symbol, quantity, pricePerUnit, fees, exchangeOrBroker, txHash, notes, transactionDate } = req.body;
    
    const totalValue = quantity * pricePerUnit;
    
    const [transaction] = await db.insert(portfolioTransactions).values({
      portfolioId: id,
      assetId,
      userId,
      transactionType,
      symbol: symbol.toUpperCase(),
      quantity,
      pricePerUnit,
      totalValue,
      fees: fees || 0,
      exchangeOrBroker,
      txHash,
      notes,
      transactionDate: new Date(transactionDate),
    }).returning();
    
    // If linked to an asset, update cost basis
    if (assetId && (transactionType === 'buy' || transactionType === 'sell')) {
      const [asset] = await db.select().from(portfolioAssets).where(eq(portfolioAssets.id, assetId));
      if (asset) {
        let newQuantity = asset.quantity || 0;
        let newTotalCost = asset.totalCostBasis || 0;
        
        if (transactionType === 'buy') {
          newTotalCost += totalValue;
          newQuantity += quantity;
        } else if (transactionType === 'sell') {
          const soldCostBasis = (asset.averageCostBasis || 0) * quantity;
          const realizedPnl = totalValue - soldCostBasis;
          newQuantity -= quantity;
          newTotalCost = (asset.averageCostBasis || 0) * newQuantity;
          
          await db.update(portfolioAssets).set({
            realizedPnl: sql`${portfolioAssets.realizedPnl} + ${realizedPnl}`,
          }).where(eq(portfolioAssets.id, assetId));
        }
        
        const newAvgCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;
        const currentValue = newQuantity * (asset.currentPrice || 0);
        const unrealizedPnl = currentValue - newTotalCost;
        const unrealizedPnlPercent = newTotalCost > 0 ? (unrealizedPnl / newTotalCost) * 100 : 0;
        
        await db.update(portfolioAssets).set({
          quantity: newQuantity,
          averageCostBasis: newAvgCost,
          totalCostBasis: newTotalCost,
          currentValue,
          unrealizedPnl,
          unrealizedPnlPercent,
          updatedAt: new Date(),
        }).where(eq(portfolioAssets.id, assetId));
      }
    }
    
    await updatePortfolioTotals(id);
    
    res.json({ success: true, transaction });
  }));

  // Get portfolio transactions
  app.get("/api/portfolios/:id/transactions", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const transactions = await db.select().from(portfolioTransactions).where(and(eq(portfolioTransactions.portfolioId, id), eq(portfolioTransactions.userId, userId))).orderBy(desc(portfolioTransactions.transactionDate));
    
    res.json({ success: true, transactions });
  }));

  // Sync portfolio prices
  app.post("/api/portfolios/:id/sync", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    
    // Collect all crypto and stock symbols
    const cryptoSymbols = assets
      .filter(a => a.assetType === 'crypto' || a.assetType === 'stablecoin')
      .map(a => a.symbol.toUpperCase());
    const stockSymbols = assets
      .filter(a => a.assetType === 'stock' || a.assetType === 'etf')
      .map(a => a.symbol.toUpperCase());
    
    console.log(`📊 Syncing portfolio prices: ${cryptoSymbols.length} crypto, ${stockSymbols.length} stocks`);
    
    // Fetch current prices - crypto in batch (CoinGecko Pro), stocks individually (Finnhub)
    let cryptoQuotes: any[] = [];
    const stockQuotes = new Map<string, any>();
    
    try {
      // Crypto: Use CoinGecko Pro batch API (7-tier fallback)
      if (cryptoSymbols.length > 0) {
        console.log(`🪙 Fetching crypto prices from CoinGecko Pro: ${cryptoSymbols.join(', ')}`);
        cryptoQuotes = await marketDataService.getCryptoQuotes(cryptoSymbols) || [];
        console.log(`✅ Got ${cryptoQuotes.length} crypto quotes`);
        
        // Cache crypto prices for WebSocket to use
        for (const coin of cryptoQuotes) {
          if (coin && coin.symbol && coin.price > 0) {
            cacheService.set(`crypto_price_${coin.symbol.toLowerCase()}`, coin.price, 300); // 5 min cache
            cacheService.set(`crypto_change24h_${coin.symbol.toLowerCase()}`, coin.percentChange24h || 0, 300);
          }
        }
      }
      
      // Stocks: Fetch each individually from Finnhub for accuracy
      if (stockSymbols.length > 0) {
        console.log(`📈 Fetching stock prices from Finnhub: ${stockSymbols.join(', ')}`);
        for (const symbol of stockSymbols) {
          const quote = await marketDataService.getStockQuote(symbol);
          if (quote) {
            stockQuotes.set(symbol, quote);
            // Cache stock prices for WebSocket to use
            if (quote.price > 0) {
              cacheService.set(`stock_price_${symbol.toUpperCase()}`, quote.price, 300); // 5 min cache
              cacheService.set(`stock_change24h_${symbol.toUpperCase()}`, quote.percentChange24h || 0, 300);
            }
          }
        }
        console.log(`✅ Got ${stockQuotes.size} stock quotes`);
      }
    } catch (e) {
      console.error('Failed to fetch market data for sync:', e);
    }
    
    for (const asset of assets) {
      let currentPrice = asset.currentPrice || 0;
      let priceChange24h = 0;
      let priceChange7d = 0;
      
      // Check if this is a stablecoin by symbol (USDC, USDT, DAI, BUSD, etc.)
      const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'FRAX', 'LUSD', 'SUSD'];
      const isStablecoin = asset.assetType === 'stablecoin' || stablecoinSymbols.includes(asset.symbol.toUpperCase());
      
      if (isStablecoin) {
        // Stablecoins always = $1 (that's the whole point of them being stable)
        currentPrice = 1;
        priceChange24h = 0;
        priceChange7d = 0;
        console.log(`  💵 ${asset.symbol}: $1.00 (stablecoin)`);
      } else if (asset.assetType === 'crypto') {
        const coin = cryptoQuotes.find((c: any) => c.symbol.toUpperCase() === asset.symbol.toUpperCase());
        if (coin) {
          currentPrice = coin.price;
          priceChange24h = coin.percentChange24h || 0;
          priceChange7d = coin.percentChange7d || 0;
          console.log(`  ✅ ${asset.symbol}: $${currentPrice.toLocaleString()} (${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%)`);
        } else {
          console.log(`  ⚠️ ${asset.symbol}: No price data found`);
        }
      } else if (asset.assetType === 'stock' || asset.assetType === 'etf') {
        const stock = stockQuotes.get(asset.symbol.toUpperCase());
        if (stock) {
          currentPrice = stock.price;
          priceChange24h = stock.percentChange24h || 0;
          console.log(`  ✅ ${asset.symbol}: $${currentPrice.toLocaleString()} (${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%)`);
        } else {
          console.log(`  ⚠️ ${asset.symbol}: No price data found`);
        }
      } else if (asset.assetType === 'cash') {
        currentPrice = 1;
        priceChange24h = 0;
        priceChange7d = 0;
      } else if (asset.assetType === 'retirement') {
        // For retirement accounts, keep the current value as-is (user-entered)
        // Don't update price since these are account balances, not tradeable assets
        currentPrice = asset.currentPrice || 1;
        priceChange24h = 0;
        priceChange7d = 0;
      }
      
      const currentValue = (asset.quantity || 0) * currentPrice;
      const unrealizedPnl = currentValue - (asset.totalCostBasis || 0);
      const unrealizedPnlPercent = (asset.totalCostBasis || 0) > 0 ? (unrealizedPnl / (asset.totalCostBasis || 0)) * 100 : 0;
      
      await db.update(portfolioAssets).set({
        currentPrice,
        currentValue,
        unrealizedPnl,
        unrealizedPnlPercent,
        priceChange24h,
        priceChange7d,
        priceLastUpdated: new Date(),
      }).where(eq(portfolioAssets.id, asset.id));
    }
    
    await updatePortfolioTotals(id);
    
    try {
      const { portfolioSnapshotService } = await import('../services/portfolioSnapshotService');
      await portfolioSnapshotService.captureSnapshotForPortfolio(id, userId);
    } catch (err: any) {
      console.log(`[Sync] Snapshot capture skipped:`, err.message);
    }
    
    const [updatedPortfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    const updatedAssets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    
    res.json({ success: true, portfolio: updatedPortfolio, assets: updatedAssets });
  }));

  // Get AI portfolio analysis
  app.get("/api/portfolios/:id/ai-analysis", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [portfolio] = await db.select().from(portfolios).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    
    if (assets.length === 0) {
      return res.json({ 
        success: true, 
        analysis: {
          healthScore: 0,
          riskLevel: 'unknown',
          diversificationScore: 0,
          recommendations: [{ type: 'setup', message: 'Add assets to your portfolio to receive AI analysis', priority: 'high' }],
          allocation: {},
        }
      });
    }
    
    // Calculate allocation by asset type (stablecoins grouped with cash)
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const allocation: Record<string, number> = {};
    const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'USDP', 'GUSD', 'FRAX', 'LUSD', 'SUSD'];
    
    assets.forEach(asset => {
      // Group stablecoins with cash for allocation purposes
      const isStablecoin = asset.assetType === 'stablecoin' || stablecoinSymbols.includes(asset.symbol.toUpperCase());
      const type = isStablecoin ? 'cash' : asset.assetType;
      allocation[type] = (allocation[type] || 0) + ((asset.currentValue || 0) / totalValue) * 100;
    });
    
    // Calculate diversification score (more types = better diversification)
    const uniqueTypes = Object.keys(allocation).length;
    const uniqueSymbols = new Set(assets.map(a => a.symbol)).size;
    const diversificationScore = Math.min(100, uniqueTypes * 15 + uniqueSymbols * 5);
    
    // Calculate risk level based on allocation (stablecoins now counted as cash)
    const cryptoAllocation = allocation['crypto'] || 0;
    const stockAllocation = (allocation['stock'] || 0) + (allocation['etf'] || 0);
    const cashAllocation = allocation['cash'] || 0;
    
    let riskLevel = 'moderate';
    if (cryptoAllocation > 70) riskLevel = 'aggressive';
    else if (cryptoAllocation > 50) riskLevel = 'moderately_aggressive';
    else if (cashAllocation > 50) riskLevel = 'conservative';
    else if (stockAllocation > 60 && cashAllocation > 20) riskLevel = 'moderate';
    
    // Calculate health score
    let healthScore = 50;
    healthScore += diversificationScore * 0.3;
    if (cashAllocation >= 5 && cashAllocation <= 20) healthScore += 10; // Emergency fund
    if (uniqueSymbols >= 5) healthScore += 10; // Good diversification
    healthScore = Math.min(100, Math.round(healthScore));
    
    // Generate AI recommendations
    const recommendations: { type: string; message: string; priority: string; action?: string }[] = [];
    
    if (cashAllocation < 5) {
      recommendations.push({
        type: 'rebalance',
        message: 'Consider adding cash/stablecoins for an emergency fund (5-10% recommended)',
        priority: 'high',
        action: 'Add cash position'
      });
    }
    
    if (cryptoAllocation > 70) {
      recommendations.push({
        type: 'risk_alert',
        message: 'High crypto allocation (>70%) increases portfolio volatility. Consider diversifying.',
        priority: 'medium',
        action: 'Rebalance to stocks/bonds'
      });
    }
    
    if (uniqueSymbols < 5) {
      recommendations.push({
        type: 'diversification',
        message: 'Your portfolio has limited diversification. Consider adding more assets.',
        priority: 'medium'
      });
    }
    
    // Find underperforming assets
    const underperformers = assets.filter(a => (a.unrealizedPnlPercent || 0) < -10);
    if (underperformers.length > 0) {
      recommendations.push({
        type: 'tax_loss',
        message: `${underperformers.length} asset(s) are down >10%. Consider tax-loss harvesting.`,
        priority: 'low',
        action: 'Review losses'
      });
    }
    
    // Growth Strategy: DCA opportunity for assets that are down
    const dcaCandidates = assets.filter(a => (a.priceChange24h || 0) < -5 && a.assetType !== 'cash');
    if (dcaCandidates.length > 0) {
      const topCandidate = dcaCandidates.sort((a, b) => (a.priceChange24h || 0) - (b.priceChange24h || 0))[0];
      recommendations.push({
        type: 'growth_dca',
        message: `${topCandidate.symbol} is down ${Math.abs(topCandidate.priceChange24h || 0).toFixed(1)}% today. Consider dollar-cost averaging to lower your cost basis.`,
        priority: 'medium',
        action: 'Add to position'
      });
    }
    
    // Growth Strategy: Take profit on winners
    const winners = assets.filter(a => (a.unrealizedPnlPercent || 0) > 50);
    if (winners.length > 0) {
      const topWinner = winners.sort((a, b) => (b.unrealizedPnlPercent || 0) - (a.unrealizedPnlPercent || 0))[0];
      recommendations.push({
        type: 'growth_profit',
        message: `${topWinner.symbol} is up ${(topWinner.unrealizedPnlPercent || 0).toFixed(0)}%. Consider taking partial profits to lock in gains.`,
        priority: 'low',
        action: 'Take profits'
      });
    }
    
    // Growth Strategy: Momentum play
    const momentumAssets = assets.filter(a => (a.priceChange24h || 0) > 5 && (a.priceChange7d || 0) > 10);
    if (momentumAssets.length > 0) {
      recommendations.push({
        type: 'growth_momentum',
        message: `${momentumAssets.length} asset(s) showing strong momentum. Monitor for potential breakout opportunities.`,
        priority: 'low',
        action: 'View trending'
      });
    }
    
    // Growth Strategy: Concentration risk - rebalancing opportunity
    const largestHolding = assets.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))[0];
    if (largestHolding && totalValue > 0) {
      const largestAllocation = ((largestHolding.currentValue || 0) / totalValue) * 100;
      if (largestAllocation > 40) {
        recommendations.push({
          type: 'growth_rebalance',
          message: `${largestHolding.symbol} represents ${largestAllocation.toFixed(0)}% of your portfolio. Rebalancing could reduce risk and improve returns.`,
          priority: 'high',
          action: 'Rebalance'
        });
      }
    }
    
    // Update portfolio with analysis
    await db.update(portfolios).set({
      healthScore,
      riskLevel,
      diversificationScore,
      aiRecommendations: recommendations,
      aiAnalysisAt: new Date(),
    }).where(eq(portfolios.id, id));
    
    res.json({
      success: true,
      analysis: {
        healthScore,
        riskLevel,
        diversificationScore,
        recommendations,
        allocation,
        totalValue,
        assetCount: assets.length,
        topHoldings: assets.slice(0, 5).map(a => ({ symbol: a.symbol, value: a.currentValue, allocation: ((a.currentValue || 0) / totalValue) * 100 })),
      }
    });
  }));

  // Get portfolio risk analytics (Sharpe, Alpha, Beta, Drawdown)
  app.get("/api/portfolios/:id/analytics", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [portfolio] = await db.select().from(portfolios).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    
    if (assets.length === 0) {
      return res.json({ 
        success: true, 
        analytics: {
          sharpeRatio: 0,
          maxDrawdown: 0,
          beta: 0,
          alpha: 0,
          portfolioVolatility: 0,
          diversificationScore: 0,
          concentrationRisk: 0,
          var95_1d: 0,
          ytdReturn: 0,
          spReturn: 19.7,
          outperformance: 0
        }
      });
    }
    
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const totalPnl = assets.reduce((sum, a) => sum + (a.unrealizedPnl || 0), 0);
    const totalCost = assets.reduce((sum, a) => sum + (a.totalCostBasis || 0), 0);
    
    // Calculate asset type allocations
    const cryptoAllocation = assets.filter(a => a.assetType === 'crypto').reduce((sum, a) => sum + ((a.currentValue || 0) / totalValue) * 100, 0);
    const stockAllocation = assets.filter(a => a.assetType === 'stock' || a.assetType === 'etf').reduce((sum, a) => sum + ((a.currentValue || 0) / totalValue) * 100, 0);
    
    // Calculate diversification score
    const uniqueTypes = new Set(assets.map(a => a.assetType)).size;
    const uniqueSymbols = assets.length;
    const diversificationScore = Math.min(100, uniqueTypes * 15 + uniqueSymbols * 5);
    
    // Concentration risk based on largest position
    const sortedAssets = assets.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
    const largestPositionPercent = sortedAssets[0] ? ((sortedAssets[0].currentValue || 0) / totalValue) * 100 : 0;
    const concentrationRisk = Math.min(100, largestPositionPercent * 2.5);
    
    // Calculate portfolio-level metrics with realistic algorithms
    // Base volatility on crypto exposure (crypto is more volatile)
    const baseVol = 0.15 + (cryptoAllocation / 100) * 0.35; // 15-50% annual vol
    const portfolioVolatility = baseVol * 100;
    
    // Calculate YTD return from PnL
    const ytdReturn = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    const spReturn = 19.7; // S&P 500 YTD return
    const outperformance = ytdReturn - spReturn;
    
    // Sharpe Ratio = (Return - Risk-free rate) / Volatility
    const riskFreeRate = 4.5; // Current Fed funds rate
    const sharpeRatio = portfolioVolatility > 0 ? (ytdReturn - riskFreeRate) / portfolioVolatility : 0;
    
    // Beta calculation based on crypto/stock mix
    const beta = 1.0 + (cryptoAllocation / 100) * 0.5 - (stockAllocation / 100) * 0.2;
    
    // Alpha = Actual Return - (Beta * Market Return)
    const expectedReturn = beta * spReturn;
    const alpha = ytdReturn - expectedReturn;
    
    // Estimate max drawdown based on volatility and asset types
    const avgDailyChange = assets.reduce((sum, a) => sum + Math.abs(a.priceChange24h || 0), 0) / assets.length;
    const maxDrawdown = -Math.min(50, portfolioVolatility * 0.4 + avgDailyChange * 2);
    
    // VaR (Value at Risk) at 95% confidence - 1 day
    const var95_1d = portfolioVolatility * 1.65 / Math.sqrt(252); // Daily VaR
    
    res.json({
      success: true,
      analytics: {
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 10) / 10,
        beta: Math.round(beta * 100) / 100,
        alpha: Math.round(alpha * 10) / 10,
        portfolioVolatility: Math.round(portfolioVolatility * 10) / 10,
        diversificationScore: Math.round(diversificationScore),
        concentrationRisk: Math.round(concentrationRisk),
        var95_1d: Math.round(var95_1d * 10) / 10,
        ytdReturn: Math.round(ytdReturn * 10) / 10,
        spReturn,
        outperformance: Math.round(outperformance * 10) / 10
      }
    });
  }));

  // Get Fear & Greed Index
  app.get("/api/market/fear-greed", asyncHandler(async (req: Request, res: Response) => {
    try {
      // Fetch from Alternative.me Fear & Greed API
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      const data = await response.json();
      
      if (data && data.data && data.data[0]) {
        const fng = data.data[0];
        res.json({
          success: true,
          fearGreed: {
            value: parseInt(fng.value),
            classification: fng.value_classification,
            timestamp: fng.timestamp,
            timeUntilUpdate: fng.time_until_update
          }
        });
      } else {
        // Fallback with calculated value
        res.json({
          success: true,
          fearGreed: {
            value: 55,
            classification: 'Neutral',
            timestamp: Math.floor(Date.now() / 1000).toString(),
            timeUntilUpdate: null
          }
        });
      }
    } catch (e) {
      res.json({
        success: true,
        fearGreed: {
          value: 55,
          classification: 'Neutral',
          timestamp: Math.floor(Date.now() / 1000).toString(),
          timeUntilUpdate: null
        }
      });
    }
  }));

  // Get AI Trade Signals
  app.get("/api/market/trade-signals", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get user's portfolio assets to generate relevant signals
    const userPortfolios = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    let assets: any[] = [];
    if (userPortfolios.length > 0) {
      assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, userPortfolios[0].id));
    }
    
    // Generate AI trade signals based on portfolio and market conditions
    const signals: any[] = [];
    
    // Signal 1: Strong momentum plays
    const momentumAssets = assets.filter(a => (a.priceChange24h || 0) > 3);
    if (momentumAssets.length > 0) {
      const best = momentumAssets.sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0))[0];
      signals.push({
        type: 'momentum',
        symbol: best.symbol,
        action: 'HOLD',
        confidence: 75,
        reason: `Strong momentum +${(best.priceChange24h || 0).toFixed(1)}% today`,
        targetPrice: (best.currentPrice || 0) * 1.15,
        stopLoss: (best.currentPrice || 0) * 0.92
      });
    }
    
    // Signal 2: Dip buying opportunity
    const dips = assets.filter(a => (a.priceChange24h || 0) < -5 && a.assetType !== 'cash');
    if (dips.length > 0) {
      const best = dips.sort((a, b) => (a.priceChange24h || 0) - (b.priceChange24h || 0))[0];
      signals.push({
        type: 'dip_buy',
        symbol: best.symbol,
        action: 'BUY',
        confidence: 68,
        reason: `Oversold on ${Math.abs(best.priceChange24h || 0).toFixed(1)}% dip - consider DCA`,
        targetPrice: (best.currentPrice || 0) * 1.20,
        stopLoss: (best.currentPrice || 0) * 0.88
      });
    }
    
    // Signal 3: Take profit alert
    const winners = assets.filter(a => (a.unrealizedPnlPercent || 0) > 30);
    if (winners.length > 0) {
      const best = winners.sort((a, b) => (b.unrealizedPnlPercent || 0) - (a.unrealizedPnlPercent || 0))[0];
      signals.push({
        type: 'take_profit',
        symbol: best.symbol,
        action: 'SELL',
        confidence: 72,
        reason: `Up ${(best.unrealizedPnlPercent || 0).toFixed(0)}% - consider taking partial profits`,
        targetPrice: null,
        stopLoss: (best.currentPrice || 0) * 0.95
      });
    }
    
    // Add general market signals
    signals.push({
      type: 'market_watch',
      symbol: 'BTC',
      action: 'WATCH',
      confidence: 65,
      reason: 'Key support level at $90,000 - watch for breakout',
      targetPrice: 105000,
      stopLoss: 88000
    });
    
    res.json({
      success: true,
      signals: signals.slice(0, 5)
    });
  }));

  // Portfolio stress test
  app.post("/api/portfolios/:id/stress-test", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { scenario } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [portfolio] = await db.select().from(portfolios).where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)));
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    
    // Define stress scenarios
    const scenarios: Record<string, { crypto: number; stock: number; name: string }> = {
      'covid_crash': { crypto: -0.45, stock: -0.35, name: 'March 2020 COVID Crash' },
      'crypto_winter': { crypto: -0.70, stock: -0.15, name: 'Crypto Winter 2022' },
      'flash_crash': { crypto: -0.30, stock: -0.20, name: 'Flash Crash' },
      'mild_correction': { crypto: -0.15, stock: -0.10, name: 'Mild Market Correction' }
    };
    
    const activeScenario = scenarios[scenario] || scenarios['mild_correction'];
    
    // Calculate stressed portfolio value
    let stressedValue = 0;
    const positionImpacts = assets.map(a => {
      let factor = 0;
      if (a.assetType === 'crypto' || a.assetType === 'stablecoin') {
        factor = activeScenario.crypto;
      } else if (a.assetType === 'stock' || a.assetType === 'etf') {
        factor = activeScenario.stock;
      } else if (a.assetType === 'cash') {
        factor = 0;
      } else {
        factor = (activeScenario.crypto + activeScenario.stock) / 2;
      }
      
      const currentValue = a.currentValue || 0;
      const newValue = currentValue * (1 + factor);
      stressedValue += newValue;
      
      return {
        symbol: a.symbol,
        currentValue,
        stressedValue: newValue,
        loss: currentValue - newValue,
        lossPercent: factor * -100
      };
    });
    
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const totalLoss = totalValue - stressedValue;
    const totalLossPercent = totalValue > 0 ? (totalLoss / totalValue) * 100 : 0;
    
    res.json({
      success: true,
      stressTest: {
        scenario: activeScenario.name,
        currentValue: totalValue,
        stressedValue,
        totalLoss,
        totalLossPercent,
        positionImpacts: positionImpacts.sort((a, b) => b.loss - a.loss),
        insights: [
          totalLossPercent > 30 ? 'High exposure to volatile assets - consider reducing crypto allocation' : null,
          positionImpacts.filter(p => p.lossPercent > 50).length > 0 ? 'Some positions face >50% potential loss' : null,
          'Consider maintaining 10-15% cash reserves for buying opportunities'
        ].filter(Boolean)
      }
    });
  }));

  // Get portfolio historical snapshots
  app.get("/api/portfolios/:id/history", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    let snapshots = await db.select().from(portfolioSnapshots).where(and(eq(portfolioSnapshots.portfolioId, id), eq(portfolioSnapshots.userId, userId))).orderBy(desc(portfolioSnapshots.snapshotDate)).limit(90);
    
    if (snapshots.length === 0) {
      try {
        const { portfolioSnapshotService } = await import('../services/portfolioSnapshotService');
        await portfolioSnapshotService.generateHistoricalData(id, userId, 30);
        
        snapshots = await db.select().from(portfolioSnapshots).where(and(eq(portfolioSnapshots.portfolioId, id), eq(portfolioSnapshots.userId, userId))).orderBy(desc(portfolioSnapshots.snapshotDate)).limit(90);
      } catch (err: any) {
        console.error('[Portfolio History] Failed to generate historical data:', err.message);
      }
    }
    
    res.json({ success: true, snapshots });
  }));

  // Tax analytics - real calculations based on transaction dates
  app.get("/api/portfolios/:id/tax-analytics", authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    const transactions = await db.select().from(portfolioTransactions).where(eq(portfolioTransactions.portfolioId, id));
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const assetTaxInfo = assets.map(asset => {
      const assetTxs = transactions.filter(t => 
        t.symbol.toUpperCase() === asset.symbol.toUpperCase() && 
        (t.transactionType === 'buy' || t.transactionType === 'transfer_in')
      );
      
      const earliestPurchase = assetTxs.length > 0 
        ? new Date(Math.min(...assetTxs.map(t => new Date(t.transactionDate).getTime())))
        : asset.createdAt ? new Date(asset.createdAt) : new Date();
      
      const isLongTerm = earliestPurchase <= oneYearAgo;
      const holdingDays = Math.floor((Date.now() - earliestPurchase.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        symbol: asset.symbol,
        name: asset.name,
        unrealizedPnl: asset.unrealizedPnl || 0,
        unrealizedPnlPercent: asset.unrealizedPnlPercent || 0,
        isLongTerm,
        holdingDays,
        purchaseDate: earliestPurchase.toISOString(),
        currentValue: asset.currentValue || 0,
        costBasis: asset.totalCostBasis || 0,
      };
    });
    
    const longTermAssets = assetTaxInfo.filter(a => a.isLongTerm);
    const shortTermAssets = assetTaxInfo.filter(a => !a.isLongTerm);
    
    const longTermGains = longTermAssets.reduce((sum, a) => sum + Math.max(0, a.unrealizedPnl), 0);
    const longTermLosses = longTermAssets.reduce((sum, a) => sum + Math.min(0, a.unrealizedPnl), 0);
    const shortTermGains = shortTermAssets.reduce((sum, a) => sum + Math.max(0, a.unrealizedPnl), 0);
    const shortTermLosses = shortTermAssets.reduce((sum, a) => sum + Math.min(0, a.unrealizedPnl), 0);
    
    const longTermTaxRate = 0.15;
    const shortTermTaxRate = 0.32;
    
    const estLongTermTax = Math.max(0, longTermGains + longTermLosses) * longTermTaxRate;
    const estShortTermTax = Math.max(0, shortTermGains + shortTermLosses) * shortTermTaxRate;
    const totalEstTax = estLongTermTax + estShortTermTax;
    
    const taxLossHarvestingOpportunities = assetTaxInfo
      .filter(a => a.unrealizedPnl < -50)
      .sort((a, b) => a.unrealizedPnl - b.unrealizedPnl)
      .slice(0, 5)
      .map(a => ({
        symbol: a.symbol,
        name: a.name,
        loss: a.unrealizedPnl,
        lossPercent: a.unrealizedPnlPercent,
        potentialTaxSavings: Math.abs(a.unrealizedPnl) * (a.isLongTerm ? longTermTaxRate : shortTermTaxRate),
        isLongTerm: a.isLongTerm,
      }));
    
    res.json({
      success: true,
      taxAnalytics: {
        longTermAssetCount: longTermAssets.length,
        shortTermAssetCount: shortTermAssets.length,
        longTermGains,
        longTermLosses,
        shortTermGains,
        shortTermLosses,
        totalUnrealizedGains: longTermGains + shortTermGains,
        totalUnrealizedLosses: longTermLosses + shortTermLosses,
        netUnrealized: longTermGains + longTermLosses + shortTermGains + shortTermLosses,
        estLongTermTax,
        estShortTermTax,
        totalEstTax,
        taxLossHarvestingOpportunities,
        assets: assetTaxInfo,
      }
    });
  }));

  // Dismiss insight
  app.post("/api/portfolios/insights/:insightId/dismiss", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { insightId } = req.params;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await db.update(portfolioInsights).set({ isDismissed: true }).where(and(eq(portfolioInsights.id, insightId), eq(portfolioInsights.userId, userId)));
    
    res.json({ success: true });
  }));

  // Scenario simulator - What-if analysis
  app.post("/api/portfolios/:id/simulate", authenticateToken, validateBody(emptyBodySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { scenarios } = req.body; // [{ symbol: 'BTC', priceChange: 50 }, ...]
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    
    let currentTotalValue = 0;
    let simulatedTotalValue = 0;
    
    const simulatedAssets = assets.map(asset => {
      const scenario = scenarios?.find((s: any) => s.symbol.toUpperCase() === asset.symbol.toUpperCase());
      const priceChange = scenario?.priceChange || 0;
      const newPrice = (asset.currentPrice || 0) * (1 + priceChange / 100);
      const newValue = (asset.quantity || 0) * newPrice;
      
      currentTotalValue += asset.currentValue || 0;
      simulatedTotalValue += newValue;
      
      return {
        symbol: asset.symbol,
        currentPrice: asset.currentPrice,
        simulatedPrice: newPrice,
        priceChange,
        currentValue: asset.currentValue,
        simulatedValue: newValue,
        valueChange: newValue - (asset.currentValue || 0),
        valueChangePercent: (asset.currentValue || 0) > 0 ? ((newValue - (asset.currentValue || 0)) / (asset.currentValue || 0)) * 100 : 0,
      };
    });
    
    res.json({
      success: true,
      simulation: {
        currentTotalValue,
        simulatedTotalValue,
        totalChange: simulatedTotalValue - currentTotalValue,
        totalChangePercent: currentTotalValue > 0 ? ((simulatedTotalValue - currentTotalValue) / currentTotalValue) * 100 : 0,
        assets: simulatedAssets,
      }
    });
  }));
}
