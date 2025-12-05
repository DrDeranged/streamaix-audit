import { db } from "../db";
import { 
  predictionMarkets, 
  marketPositions, 
  marketTrades, 
  marketResolutions,
  liquidityProviders,
  marketPredictors,
  summaries,
  type PredictionMarket,
  type MarketPosition,
  type MarketTrade,
  type InsertPredictionMarket,
  type InsertMarketPosition,
  type InsertMarketTrade
} from "@shared/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import CONDITIONAL_TOKENS_ABI from "../../contracts/abis/ConditionalTokensABI.json";
import PREDICTION_FACTORY_ABI from "../../contracts/abis/PredictionMarketFactoryABI.json";

const PROVIDER_URL = process.env.RPC_URL || "https://mainnet.base.org";
const CONDITIONAL_TOKENS_ADDRESS = process.env.CONDITIONAL_TOKENS_ADDRESS || "";
const FACTORY_ADDRESS = process.env.PREDICTION_FACTORY_ADDRESS || "";

export class PredictionMarketService {
  private provider: JsonRpcProvider;
  
  constructor() {
    this.provider = new JsonRpcProvider(PROVIDER_URL);
  }

  /**
   * Create a new prediction market
   */
  async createMarket(data: {
    question: string;
    description?: string;
    category: string;
    creatorId: string;
    creatorWallet: string;
    deadline: Date;
    initialLiquidity: number;
    resolutionSource?: string;
    imageUrl?: string;
    tags?: string[];
    aiProbability?: number;
    aiReasoning?: string;
    privateKey: string;
  }): Promise<PredictionMarket> {
    try {
      // Check if smart contracts are deployed (production mode)
      const isProductionMode = FACTORY_ADDRESS && CONDITIONAL_TOKENS_ADDRESS && FACTORY_ADDRESS !== "" && CONDITIONAL_TOKENS_ADDRESS !== "";
      
      let marketId: number;
      let txHash: string;
      
      if (isProductionMode) {
        // PRODUCTION MODE: Deploy to blockchain
        console.log('🔗 Creating market on Base network...');
        const wallet = new Wallet(data.privateKey, this.provider);
        const factoryContract = new Contract(FACTORY_ADDRESS, PREDICTION_FACTORY_ABI, wallet);
        
        // Map category to enum
        const categoryMap: { [key: string]: number } = {
          'crypto': 0,
          'defi': 1,
          'real_world': 2,
          'community': 3
        };
        
        const categoryEnum = categoryMap[data.category.toLowerCase()] || 3;
        const deadlineTimestamp = Math.floor(data.deadline.getTime() / 1000);
        
        // Create market on-chain
        const tx = await factoryContract.createMarket(
          data.question,
          deadlineTimestamp,
          data.initialLiquidity,
          categoryEnum
        );
        
        const receipt = await tx.wait();
        console.log('✅ Prediction market created on-chain:', receipt.hash);
        
        // Get market ID from event
        const event = receipt.logs.find((log: any) => 
          log.topics[0] === factoryContract.interface.getEvent('MarketCreatedWithLiquidity').topicHash
        );
        
        if (!event) {
          throw new Error('Market creation event not found in transaction logs');
        }
        
        marketId = parseInt(event.topics[1], 16);
        txHash = receipt.hash;
      } else {
        // DEV MODE: Database-only (no blockchain deployment)
        console.log('🔧 DEV MODE: Creating market in database only (smart contracts not deployed)');
        
        // Generate mock contract ID and tx hash for development
        marketId = Math.floor(Math.random() * 1000000);
        txHash = `0xdev${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
        
        console.log('📝 Generated mock contract ID:', marketId);
        console.log('📝 Generated mock tx hash:', txHash);
      }
      
      // Store in database
      const [market] = await db.insert(predictionMarkets).values({
        contractMarketId: marketId,
        question: data.question,
        description: data.description,
        category: data.category,
        creatorId: data.creatorId,
        creatorWallet: data.creatorWallet || "dev_mode_wallet",
        deadline: data.deadline,
        resolutionSource: data.resolutionSource || 'oracle',
        initialLiquidity: data.initialLiquidity,
        blockchainTxHash: txHash,
        imageUrl: data.imageUrl,
        tags: data.tags || [],
        aiProbability: data.aiProbability,
        aiReasoning: data.aiReasoning,
        yesLiquidity: data.initialLiquidity / 2,
        noLiquidity: data.initialLiquidity / 2,
      }).returning();
      
      console.log('✅ Market stored in database:', market.id);
      return market;
    } catch (error: any) {
      console.error('❌ Error creating prediction market:', error);
      throw new Error(`Failed to create market: ${error.message}`);
    }
  }

  /**
   * Get all active markets
   */
  async getActiveMarkets(filters?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const conditions = [
        eq(predictionMarkets.status, 'active'),
        gte(predictionMarkets.deadline, new Date())
      ];
      
      if (filters?.category) {
        conditions.push(eq(predictionMarkets.category, filters.category));
      }
      
      const markets = await db
        .select({
          id: predictionMarkets.id,
          contractMarketId: predictionMarkets.contractMarketId,
          question: predictionMarkets.question,
          description: predictionMarkets.description,
          category: predictionMarkets.category,
          creatorId: predictionMarkets.creatorId,
          creatorWallet: predictionMarkets.creatorWallet,
          deadline: predictionMarkets.deadline,
          resolutionSource: predictionMarkets.resolutionSource,
          sourceContentId: predictionMarkets.sourceContentId,
          status: predictionMarkets.status,
          resolution: predictionMarkets.resolution,
          resolvedAt: predictionMarkets.resolvedAt,
          totalVolume: predictionMarkets.totalVolume,
          totalTrades: predictionMarkets.totalTrades,
          yesPrice: predictionMarkets.yesPrice,
          noPrice: predictionMarkets.noPrice,
          yesLiquidity: predictionMarkets.yesLiquidity,
          noLiquidity: predictionMarkets.noLiquidity,
          initialLiquidity: predictionMarkets.initialLiquidity,
          blockchainTxHash: predictionMarkets.blockchainTxHash,
          resolutionTxHash: predictionMarkets.resolutionTxHash,
          imageUrl: predictionMarkets.imageUrl,
          tags: predictionMarkets.tags,
          aiProbability: predictionMarkets.aiProbability,
          aiReasoning: predictionMarkets.aiReasoning,
          createdAt: predictionMarkets.createdAt,
          updatedAt: predictionMarkets.updatedAt,
          sourceSummary: {
            id: summaries.id,
            title: summaries.title,
          }
        })
        .from(predictionMarkets)
        .leftJoin(summaries, eq(predictionMarkets.sourceContentId, summaries.id))
        .where(and(...conditions))
        .orderBy(desc(predictionMarkets.totalVolume))
        .limit(filters?.limit || 20)
        .offset(filters?.offset || 0);
      
      return markets;
    } catch (error: any) {
      console.error('❌ Error fetching active markets:', error);
      throw error;
    }
  }

  /**
   * Get trending markets by volume
   */
  async getTrendingMarkets(limit: number = 10): Promise<PredictionMarket[]> {
    try {
      const markets = await db
        .select()
        .from(predictionMarkets)
        .where(and(
          eq(predictionMarkets.status, 'active'),
          gte(predictionMarkets.deadline, new Date())
        ))
        .orderBy(desc(predictionMarkets.totalVolume))
        .limit(limit);
      
      return markets;
    } catch (error: any) {
      console.error('❌ Error fetching trending markets:', error);
      throw error;
    }
  }

  /**
   * Get market by ID
   */
  async getMarket(marketId: string): Promise<any | null> {
    try {
      const [market] = await db
        .select({
          id: predictionMarkets.id,
          contractMarketId: predictionMarkets.contractMarketId,
          question: predictionMarkets.question,
          description: predictionMarkets.description,
          category: predictionMarkets.category,
          creatorId: predictionMarkets.creatorId,
          creatorWallet: predictionMarkets.creatorWallet,
          deadline: predictionMarkets.deadline,
          resolutionSource: predictionMarkets.resolutionSource,
          sourceContentId: predictionMarkets.sourceContentId,
          status: predictionMarkets.status,
          resolution: predictionMarkets.resolution,
          resolvedAt: predictionMarkets.resolvedAt,
          totalVolume: predictionMarkets.totalVolume,
          totalTrades: predictionMarkets.totalTrades,
          yesPrice: predictionMarkets.yesPrice,
          noPrice: predictionMarkets.noPrice,
          yesLiquidity: predictionMarkets.yesLiquidity,
          noLiquidity: predictionMarkets.noLiquidity,
          initialLiquidity: predictionMarkets.initialLiquidity,
          blockchainTxHash: predictionMarkets.blockchainTxHash,
          resolutionTxHash: predictionMarkets.resolutionTxHash,
          imageUrl: predictionMarkets.imageUrl,
          tags: predictionMarkets.tags,
          aiProbability: predictionMarkets.aiProbability,
          aiReasoning: predictionMarkets.aiReasoning,
          createdAt: predictionMarkets.createdAt,
          updatedAt: predictionMarkets.updatedAt,
          sourceSummary: {
            id: summaries.id,
            title: summaries.title,
          }
        })
        .from(predictionMarkets)
        .leftJoin(summaries, eq(predictionMarkets.sourceContentId, summaries.id))
        .where(eq(predictionMarkets.id, marketId));
      
      return market || null;
    } catch (error: any) {
      console.error('❌ Error fetching market:', error);
      throw error;
    }
  }

  /**
   * Find market by question (case-insensitive)
   */
  async findMarketByQuestion(normalizedQuestion: string): Promise<PredictionMarket | null> {
    try {
      const [market] = await db
        .select()
        .from(predictionMarkets)
        .where(sql`LOWER(TRIM(${predictionMarkets.question})) = ${normalizedQuestion}`)
        .limit(1);
      
      return market || null;
    } catch (error: any) {
      console.error('❌ Error finding market by question:', error);
      throw error;
    }
  }

  /**
   * Get markets linked to a specific source content (summary)
   */
  async getMarketsBySourceContent(sourceContentId: string): Promise<PredictionMarket[]> {
    try {
      const markets = await db
        .select()
        .from(predictionMarkets)
        .where(eq(predictionMarkets.sourceContentId, sourceContentId))
        .orderBy(desc(predictionMarkets.createdAt));
      
      return markets;
    } catch (error: any) {
      console.error('❌ Error fetching markets by source content:', error);
      throw error;
    }
  }

  /**
   * Get user positions for a market
   */
  async getUserPositions(userId: string, marketId?: string): Promise<MarketPosition[]> {
    try {
      const conditions = [eq(marketPositions.userId, userId)];
      
      if (marketId) {
        conditions.push(eq(marketPositions.marketId, marketId));
      }
      
      const positions = await db
        .select()
        .from(marketPositions)
        .where(and(...conditions))
        .orderBy(desc(marketPositions.createdAt));
      
      return positions;
    } catch (error: any) {
      console.error('❌ Error fetching user positions:', error);
      throw error;
    }
  }

  /**
   * Get user positions with market details
   */
  async getUserPositionsWithMarkets(userId: string): Promise<any[]> {
    try {
      const positions = await db
        .select({
          position: marketPositions,
          market: predictionMarkets
        })
        .from(marketPositions)
        .innerJoin(predictionMarkets, eq(marketPositions.marketId, predictionMarkets.id))
        .where(eq(marketPositions.userId, userId))
        .orderBy(desc(marketPositions.updatedAt));
      
      return positions.map(({ position, market }) => ({
        ...position,
        market: {
          id: market.id,
          question: market.question,
          category: market.category,
          deadline: market.deadline,
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
          yesLiquidity: market.yesLiquidity,
          noLiquidity: market.noLiquidity,
          totalVolume: market.totalVolume,
          totalTrades: market.totalTrades,
          aiProbability: market.aiProbability,
          aiReasoning: market.aiReasoning,
          status: market.status,
          imageUrl: market.imageUrl,
          tags: market.tags
        }
      }));
    } catch (error: any) {
      console.error('❌ Error fetching user positions with markets:', error);
      throw error;
    }
  }

  /**
   * Get user trade history
   */
  async getUserTrades(userId: string, marketId?: string): Promise<MarketTrade[]> {
    try {
      const conditions = [eq(marketTrades.userId, userId)];
      
      if (marketId) {
        conditions.push(eq(marketTrades.marketId, marketId));
      }
      
      const trades = await db
        .select()
        .from(marketTrades)
        .where(and(...conditions))
        .orderBy(desc(marketTrades.createdAt));
      
      return trades;
    } catch (error: any) {
      console.error('❌ Error fetching user trades:', error);
      throw error;
    }
  }

  /**
   * Get all trades for a specific market (for volume analysis)
   */
  async getMarketTrades(marketId: string): Promise<MarketTrade[]> {
    try {
      const trades = await db
        .select()
        .from(marketTrades)
        .where(eq(marketTrades.marketId, marketId))
        .orderBy(desc(marketTrades.createdAt));
      
      return trades;
    } catch (error: any) {
      console.error('❌ Error fetching market trades:', error);
      throw error;
    }
  }

  /**
   * Record a trade in database
   */
  async recordTrade(trade: InsertMarketTrade): Promise<MarketTrade> {
    try {
      const [newTrade] = await db.insert(marketTrades).values(trade).returning();
      
      // Update market stats
      await db
        .update(predictionMarkets)
        .set({
          totalVolume: sql`${predictionMarkets.totalVolume} + ${trade.streamAmount}`,
          totalTrades: sql`${predictionMarkets.totalTrades} + 1`,
          updatedAt: new Date()
        })
        .where(eq(predictionMarkets.id, trade.marketId));
      
      // Update user position
      await this.updateUserPosition(
        trade.marketId,
        trade.userId!,
        trade.userWallet,
        trade.outcome,
        trade.tradeType,
        trade.shares,
        trade.price,
        trade.streamAmount
      );
      
      // Send push notification for trade confirmation (non-blocking)
      if (trade.userId) {
        this.sendTradeNotification(trade).catch(err => 
          console.log('Push notification skipped:', err.message)
        );
      }
      
      return newTrade;
    } catch (error: any) {
      console.error('❌ Error recording trade:', error);
      throw error;
    }
  }

  /**
   * Send push notification for trade confirmation
   */
  private async sendTradeNotification(trade: InsertMarketTrade): Promise<void> {
    try {
      const { pushNotificationService } = await import('./pushNotificationService');
      const market = await this.getMarket(trade.marketId);
      if (market && trade.userId) {
        await pushNotificationService.notifyTradeConfirmation(
          trade.userId,
          market.question,
          trade.outcome,
          trade.streamAmount
        );
      }
    } catch (error) {
      // Silently fail - notifications are best effort
    }
  }

  /**
   * Update user position
   */
  private async updateUserPosition(
    marketId: string,
    userId: string,
    userWallet: string,
    outcome: string,
    tradeType: string,
    shares: number,
    price: number,
    streamAmount: number
  ): Promise<void> {
    try {
      const [existing] = await db
        .select()
        .from(marketPositions)
        .where(and(
          eq(marketPositions.marketId, marketId),
          eq(marketPositions.userId, userId),
          eq(marketPositions.outcome, outcome)
        ));
      
      if (existing) {
        if (tradeType === 'buy') {
          const newShares = existing.shares + shares;
          const newInvested = existing.totalInvested + streamAmount;
          const newAvgPrice = Math.floor((newInvested / newShares) * 10000);
          
          await db
            .update(marketPositions)
            .set({
              shares: newShares,
              totalInvested: newInvested,
              averagePrice: newAvgPrice,
              updatedAt: new Date()
            })
            .where(eq(marketPositions.id, existing.id));
        } else {
          // Sell
          const newShares = existing.shares - shares;
          const pnl = streamAmount - (shares * existing.averagePrice / 10000);
          
          await db
            .update(marketPositions)
            .set({
              shares: newShares,
              realizedPnl: (existing.realizedPnl || 0) + pnl,
              updatedAt: new Date()
            })
            .where(eq(marketPositions.id, existing.id));
        }
      } else if (tradeType === 'buy') {
        // Create new position
        await db.insert(marketPositions).values({
          marketId,
          userId,
          userWallet,
          outcome,
          shares,
          averagePrice: price,
          totalInvested: streamAmount,
        });
      }
    } catch (error: any) {
      console.error('❌ Error updating position:', error);
      throw error;
    }
  }

  /**
   * Update market prices from on-chain
   */
  async updateMarketPrices(marketId: string): Promise<void> {
    try {
      const market = await this.getMarket(marketId);
      if (!market) throw new Error('Market not found');
      
      const factoryContract = new Contract(FACTORY_ADDRESS, PREDICTION_FACTORY_ABI, this.provider);
      const [yesPrice, noPrice] = await factoryContract.getMarketPrice(market.contractMarketId);
      
      await db
        .update(predictionMarkets)
        .set({
          yesPrice: parseInt(yesPrice.toString()),
          noPrice: parseInt(noPrice.toString()),
          updatedAt: new Date()
        })
        .where(eq(predictionMarkets.id, marketId));
      
      console.log(`✅ Updated prices for market ${marketId}: YES=${yesPrice}, NO=${noPrice}`);
    } catch (error: any) {
      console.error('❌ Error updating market prices:', error);
      throw error;
    }
  }

  /**
   * Get market statistics
   */
  async getMarketStats(): Promise<{
    totalMarkets: number;
    activeMarkets: number;
    totalVolume: number;
    totalTrades: number;
  }> {
    try {
      const [stats] = await db
        .select({
          totalMarkets: sql<number>`COUNT(*)::int`,
          activeMarkets: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)::int`,
          totalVolume: sql<number>`COALESCE(SUM(${predictionMarkets.totalVolume}), 0)::int`,
          totalTrades: sql<number>`COALESCE(SUM(${predictionMarkets.totalTrades}), 0)::int`,
        })
        .from(predictionMarkets);
      
      return stats;
    } catch (error: any) {
      console.error('❌ Error fetching market stats:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const leaders = await db
        .select()
        .from(marketPredictors)
        .orderBy(desc(marketPredictors.accuracyRate), desc(marketPredictors.netProfit))
        .limit(limit);
      
      return leaders;
    } catch (error: any) {
      console.error('❌ Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get a single user position for a specific market (aggregates YES and NO positions)
   */
  async getUserPosition(userId: string, marketId: string): Promise<{
    yesShares: number;
    noShares: number;
    totalCost: number;
    averageYesPrice: number;
    averageNoPrice: number;
  } | null> {
    try {
      const positions = await db
        .select()
        .from(marketPositions)
        .where(and(
          eq(marketPositions.userId, userId),
          eq(marketPositions.marketId, marketId)
        ));
      
      if (positions.length === 0) {
        return null;
      }
      
      // Aggregate YES and NO positions
      let yesShares = 0;
      let noShares = 0;
      let totalCost = 0;
      let yesInvested = 0;
      let noInvested = 0;
      
      for (const pos of positions) {
        if (pos.outcome === 'YES') {
          yesShares += pos.shares;
          yesInvested += pos.totalInvested;
        } else {
          noShares += pos.shares;
          noInvested += pos.totalInvested;
        }
        totalCost += pos.totalInvested;
      }
      
      return {
        yesShares,
        noShares,
        totalCost,
        averageYesPrice: yesShares > 0 ? Math.round(yesInvested / yesShares * 100) : 0,
        averageNoPrice: noShares > 0 ? Math.round(noInvested / noShares * 100) : 0
      };
    } catch (error: any) {
      console.error('❌ Error fetching user position:', error);
      throw error;
    }
  }

  /**
   * Get user trades for a specific market
   */
  async getUserTradesForMarket(userId: string, marketId: string): Promise<MarketTrade[]> {
    try {
      const trades = await db
        .select()
        .from(marketTrades)
        .where(and(
          eq(marketTrades.userId, userId),
          eq(marketTrades.marketId, marketId)
        ))
        .orderBy(desc(marketTrades.createdAt));
      
      return trades;
    } catch (error: any) {
      console.error('❌ Error fetching user trades for market:', error);
      throw error;
    }
  }

  /**
   * Execute a trade and record it
   */
  async executeTrade(params: {
    userId: string;
    marketId: string;
    outcome: 'YES' | 'NO';
    tradeType: 'buy' | 'sell';
    amount: number;
    shares: number;
    price: number;
    fee: number;
  }): Promise<MarketTrade> {
    try {
      const trade = await this.recordTrade({
        marketId: params.marketId,
        userId: params.userId,
        userWallet: '', // Will be updated with wallet if connected
        outcome: params.outcome,
        tradeType: params.tradeType,
        shares: params.shares,
        price: params.price,
        streamAmount: params.amount,
        fee: params.fee,
      });
      
      console.log(`✅ Trade executed: ${params.tradeType} ${params.shares.toFixed(2)} ${params.outcome} shares for ${params.amount} STREAM`);
      
      return trade;
    } catch (error: any) {
      console.error('❌ Error executing trade:', error);
      throw error;
    }
  }

  /**
   * Update market data
   */
  async updateMarket(marketId: string, updates: Partial<{
    yesLiquidity: number;
    noLiquidity: number;
    yesPrice: number;
    noPrice: number;
    totalVolume: number;
    totalTrades: number;
    status: string;
  }>): Promise<void> {
    try {
      await db
        .update(predictionMarkets)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(predictionMarkets.id, marketId));
      
      console.log(`✅ Market ${marketId} updated`);
    } catch (error: any) {
      console.error('❌ Error updating market:', error);
      throw error;
    }
  }
}

export const predictionMarketService = new PredictionMarketService();
