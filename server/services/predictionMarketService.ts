import { db } from "../storage";
import { 
  predictionMarkets, 
  marketPositions, 
  marketTrades, 
  marketResolutions,
  liquidityProviders,
  marketPredictors,
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
    privateKey: string;
  }): Promise<PredictionMarket> {
    try {
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
      
      const marketId = parseInt(event.topics[1], 16);
      
      // Store in database
      const [market] = await db.insert(predictionMarkets).values({
        contractMarketId: marketId,
        question: data.question,
        description: data.description,
        category: data.category,
        creatorId: data.creatorId,
        creatorWallet: data.creatorWallet,
        deadline: data.deadline,
        resolutionSource: data.resolutionSource || 'oracle',
        initialLiquidity: data.initialLiquidity,
        blockchainTxHash: receipt.hash,
        imageUrl: data.imageUrl,
        tags: data.tags || [],
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
  }): Promise<PredictionMarket[]> {
    try {
      let query = db
        .select()
        .from(predictionMarkets)
        .where(and(
          eq(predictionMarkets.status, 'active'),
          gte(predictionMarkets.deadline, new Date())
        ));
      
      if (filters?.category) {
        query = query.where(eq(predictionMarkets.category, filters.category));
      }
      
      const markets = await query
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
  async getMarket(marketId: string): Promise<PredictionMarket | null> {
    try {
      const [market] = await db
        .select()
        .from(predictionMarkets)
        .where(eq(predictionMarkets.id, marketId));
      
      return market || null;
    } catch (error: any) {
      console.error('❌ Error fetching market:', error);
      throw error;
    }
  }

  /**
   * Get user positions for a market
   */
  async getUserPositions(userId: string, marketId?: string): Promise<MarketPosition[]> {
    try {
      let query = db
        .select()
        .from(marketPositions)
        .where(eq(marketPositions.userId, userId));
      
      if (marketId) {
        query = query.where(eq(marketPositions.marketId, marketId));
      }
      
      const positions = await query.orderBy(desc(marketPositions.createdAt));
      return positions;
    } catch (error: any) {
      console.error('❌ Error fetching user positions:', error);
      throw error;
    }
  }

  /**
   * Get user trade history
   */
  async getUserTrades(userId: string, marketId?: string): Promise<MarketTrade[]> {
    try {
      let query = db
        .select()
        .from(marketTrades)
        .where(eq(marketTrades.userId, userId));
      
      if (marketId) {
        query = query.where(eq(marketTrades.marketId, marketId));
      }
      
      const trades = await query.orderBy(desc(marketTrades.createdAt));
      return trades;
    } catch (error: any) {
      console.error('❌ Error fetching user trades:', error);
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
      
      return newTrade;
    } catch (error: any) {
      console.error('❌ Error recording trade:', error);
      throw error;
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
              realizedPnl: existing.realizedPnl + pnl,
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
}

export const predictionMarketService = new PredictionMarketService();
