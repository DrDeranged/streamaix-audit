import { db } from "../db";
import { predictionMarkets, marketResolutions, marketPositions, marketPredictors } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import CONDITIONAL_TOKENS_ABI from "../../contracts/abis/ConditionalTokensABI.json";
import PREDICTION_FACTORY_ABI from "../../contracts/abis/PredictionMarketFactoryABI.json";

const PROVIDER_URL = process.env.RPC_URL || "https://mainnet.base.org";
const CONDITIONAL_TOKENS_ADDRESS = process.env.CONDITIONAL_TOKENS_ADDRESS || "";
const FACTORY_ADDRESS = process.env.PREDICTION_FACTORY_ADDRESS || "";

/**
 * Resolution Service
 * Handles market resolution, settlement, and winner distribution
 */
export class ResolutionService {
  private provider: JsonRpcProvider;

  constructor() {
    this.provider = new JsonRpcProvider(PROVIDER_URL);
  }

  /**
   * Resolve a market
   */
  async resolveMarket(
    marketId: string,
    resolution: 'yes' | 'no' | 'invalid',
    resolvedBy: string,
    resolutionSource: string,
    resolutionData?: any,
    privateKey?: string
  ): Promise<void> {
    try {
      const market = await db.select().from(predictionMarkets).where(eq(predictionMarkets.id, marketId)).limit(1);
      if (!market[0]) throw new Error('Market not found');
      
      if (market[0].status !== 'active') {
        throw new Error('Market already resolved or cancelled');
      }
      
      if (new Date() < market[0].deadline) {
        throw new Error('Market deadline not reached');
      }
      
      // Resolve on-chain if private key provided
      if (privateKey) {
        const wallet = new Wallet(privateKey, this.provider);
        const factoryContract = new Contract(FACTORY_ADDRESS, PREDICTION_FACTORY_ABI, wallet);
        
        // Map resolution to enum: 0=UNRESOLVED, 1=YES_WINS, 2=NO_WINS, 3=INVALID
        const resolutionEnum = resolution === 'yes' ? 1 : resolution === 'no' ? 2 : 3;
        
        const tx = await factoryContract.resolveMarket(market[0].contractMarketId, resolutionEnum);
        const receipt = await tx.wait();
        
        console.log('✅ Market resolved on-chain:', receipt.hash);
        
        // Update market in database
        await db.update(predictionMarkets)
          .set({
            status: 'resolved',
            resolution: resolution,
            resolvedAt: new Date(),
            resolutionTxHash: receipt.hash,
            updatedAt: new Date()
          })
          .where(eq(predictionMarkets.id, marketId));
        
        // Record resolution
        await db.insert(marketResolutions).values({
          marketId: marketId,
          resolution: resolution,
          resolvedBy: resolvedBy,
          resolutionSource: resolutionSource,
          resolutionData: resolutionData || {},
          blockchainTxHash: receipt.hash,
        });
      } else {
        // Database-only resolution (for testing or admin)
        await db.update(predictionMarkets)
          .set({
            status: 'resolved',
            resolution: resolution,
            resolvedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(predictionMarkets.id, marketId));
        
        await db.insert(marketResolutions).values({
          marketId: marketId,
          resolution: resolution,
          resolvedBy: resolvedBy,
          resolutionSource: resolutionSource,
          resolutionData: resolutionData || {},
        });
      }
      
      // Update predictor stats
      await this.updatePredictorStats(marketId, resolution);
      
      console.log(`✅ Market ${marketId} resolved as ${resolution}`);
    } catch (error: any) {
      console.error('❌ Error resolving market:', error);
      throw new Error(`Failed to resolve market: ${error.message}`);
    }
  }

  /**
   * Auto-resolve market based on oracle/price feed
   */
  async autoResolveMarket(
    marketId: string,
    oracleResult: boolean, // true = YES, false = NO
    privateKey: string
  ): Promise<void> {
    try {
      const resolution = oracleResult ? 'yes' : 'no';
      
      await this.resolveMarket(
        marketId,
        resolution,
        'system',
        'oracle',
        { oracle: 'UMA Optimistic Oracle', result: oracleResult },
        privateKey
      );
      
      console.log(`✅ Market ${marketId} auto-resolved as ${resolution}`);
    } catch (error: any) {
      console.error('❌ Error auto-resolving market:', error);
      throw error;
    }
  }

  /**
   * Update predictor statistics after resolution
   */
  private async updatePredictorStats(marketId: string, resolution: string): Promise<void> {
    try {
      // Get all positions for this market
      const positions = await db
        .select()
        .from(marketPositions)
        .where(eq(marketPositions.marketId, marketId));
      
      for (const position of positions) {
        if (!position.userId) continue;
        
        const isCorrect = position.outcome === resolution;
        const pnl = isCorrect ? position.shares : -position.totalInvested;
        
        // Get or create predictor stats
        const [existingPredictor] = await db
          .select()
          .from(marketPredictors)
          .where(eq(marketPredictors.userId, position.userId));
        
        if (existingPredictor) {
          // Update existing predictor
          const newTotalPredictions = existingPredictor.totalPredictions + 1;
          const newCorrectPredictions = existingPredictor.correctPredictions + (isCorrect ? 1 : 0);
          const newAccuracyRate = (newCorrectPredictions / newTotalPredictions) * 100;
          const newTotalVolume = existingPredictor.totalVolume + position.totalInvested;
          const newTotalProfit = existingPredictor.totalProfit + (pnl > 0 ? pnl : 0);
          const newTotalLoss = existingPredictor.totalLoss + (pnl < 0 ? Math.abs(pnl) : 0);
          const newNetProfit = existingPredictor.netProfit + pnl;
          const newRoi = newTotalVolume > 0 ? (newNetProfit / newTotalVolume) * 100 : 0;
          const newStreak = isCorrect ? existingPredictor.currentStreak + 1 : 0;
          const newLongestStreak = Math.max(newStreak, existingPredictor.longestStreak);
          
          await db.update(marketPredictors)
            .set({
              totalPredictions: newTotalPredictions,
              correctPredictions: newCorrectPredictions,
              accuracyRate: newAccuracyRate,
              totalVolume: newTotalVolume,
              totalProfit: newTotalProfit,
              totalLoss: newTotalLoss,
              netProfit: newNetProfit,
              roi: newRoi,
              currentStreak: newStreak,
              longestStreak: newLongestStreak,
              updatedAt: new Date()
            })
            .where(eq(marketPredictors.id, existingPredictor.id));
        } else {
          // Create new predictor
          await db.insert(marketPredictors).values({
            userId: position.userId,
            walletAddress: position.userWallet,
            totalPredictions: 1,
            correctPredictions: isCorrect ? 1 : 0,
            accuracyRate: isCorrect ? 100 : 0,
            totalVolume: position.totalInvested,
            totalProfit: pnl > 0 ? pnl : 0,
            totalLoss: pnl < 0 ? Math.abs(pnl) : 0,
            netProfit: pnl,
            roi: position.totalInvested > 0 ? (pnl / position.totalInvested) * 100 : 0,
            currentStreak: isCorrect ? 1 : 0,
            longestStreak: isCorrect ? 1 : 0,
          });
        }
      }
      
      // Update rankings
      await this.updatePredictorRankings();
      
      console.log('✅ Updated predictor stats');
    } catch (error: any) {
      console.error('❌ Error updating predictor stats:', error);
    }
  }

  /**
   * Update predictor rankings based on accuracy and profit
   */
  private async updatePredictorRankings(): Promise<void> {
    try {
      const predictors = await db
        .select()
        .from(marketPredictors)
        .orderBy(sql`${marketPredictors.accuracyRate} DESC, ${marketPredictors.netProfit} DESC`);
      
      for (let i = 0; i < predictors.length; i++) {
        await db.update(marketPredictors)
          .set({ rank: i + 1 })
          .where(eq(marketPredictors.id, predictors[i].id));
      }
      
      console.log('✅ Updated predictor rankings');
    } catch (error: any) {
      console.error('❌ Error updating rankings:', error);
    }
  }

  /**
   * Award badges to top predictors
   */
  async awardBadges(): Promise<void> {
    try {
      const predictors = await db.select().from(marketPredictors);
      
      for (const predictor of predictors) {
        const badges: string[] = predictor.badges as string[] || [];
        
        // Award badges based on achievements
        if (predictor.totalPredictions >= 1 && !badges.includes('First Prediction')) {
          badges.push('First Prediction');
        }
        if (predictor.totalPredictions >= 10 && !badges.includes('Frequent Trader')) {
          badges.push('Frequent Trader');
        }
        if (predictor.accuracyRate >= 70 && predictor.totalPredictions >= 5 && !badges.includes('Sharp Mind')) {
          badges.push('Sharp Mind');
        }
        if (predictor.longestStreak >= 5 && !badges.includes('Hot Streak')) {
          badges.push('Hot Streak');
        }
        if (predictor.netProfit >= 10000 && !badges.includes('Profit Master')) {
          badges.push('Profit Master');
        }
        if (predictor.rank && predictor.rank <= 10 && !badges.includes('Top 10')) {
          badges.push('Top 10');
        }
        
        if (badges.length > (predictor.badges as string[] || []).length) {
          await db.update(marketPredictors)
            .set({ badges: badges, updatedAt: new Date() })
            .where(eq(marketPredictors.id, predictor.id));
        }
      }
      
      console.log('✅ Awarded badges to predictors');
    } catch (error: any) {
      console.error('❌ Error awarding badges:', error);
    }
  }

  /**
   * Check and auto-resolve expired markets
   */
  async checkExpiredMarkets(privateKey: string): Promise<void> {
    try {
      const expiredMarkets = await db
        .select()
        .from(predictionMarkets)
        .where(and(
          eq(predictionMarkets.status, 'active'),
          sql`${predictionMarkets.deadline} < NOW()`
        ));
      
      console.log(`📅 Found ${expiredMarkets.length} expired markets to resolve`);
      
      for (const market of expiredMarkets) {
        // Check if this market has an automatic resolution source
        if (market.resolutionSource === 'price_feed') {
          // TODO: Fetch price from oracle and resolve
          console.log(`⏰ Market ${market.id} needs price feed resolution`);
        }
      }
    } catch (error: any) {
      console.error('❌ Error checking expired markets:', error);
    }
  }
}

export const resolutionService = new ResolutionService();
