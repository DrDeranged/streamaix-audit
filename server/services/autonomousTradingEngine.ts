import { db } from '../db';
import { 
  aiAgents, 
  predictionMarkets, 
  aiPredictions, 
  aiPositions, 
  aiTrades 
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { aiAgentService } from './aiAgentService';
import { ammService } from './ammService';
import { marketDataService } from './marketDataService';

/**
 * Autonomous Trading Engine
 * Periodically analyzes markets and executes trades for AI agents
 */

class AutonomousTradingEngine {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private tradingInterval = 30 * 60 * 1000; // 30 minutes default

  /**
   * Start the autonomous trading engine
   */
  start(intervalMinutes: number = 30) {
    if (this.isRunning) {
      console.log('⚠️ Trading engine is already running');
      return;
    }

    this.tradingInterval = intervalMinutes * 60 * 1000;
    console.log(`🤖 Starting Autonomous Trading Engine (interval: ${intervalMinutes} minutes)`);
    
    // Run immediately on start
    this.executeTradingCycle().catch(error => {
      console.error('❌ Initial trading cycle failed:', error);
    });

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.executeTradingCycle().catch(error => {
        console.error('❌ Trading cycle failed:', error);
      });
    }, this.tradingInterval);

    this.isRunning = true;
    console.log('✅ Trading engine started successfully');
  }

  /**
   * Stop the trading engine
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Trading engine stopped');
  }

  /**
   * Execute a complete trading cycle
   * 1. Fetch active markets and agents
   * 2. For each market, have each agent analyze and trade
   * 3. Update agent stats and positions
   */
  private async executeTradingCycle() {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔄 Starting Trading Cycle - ' + new Date().toISOString());
    console.log('═══════════════════════════════════════════════════\n');

    try {
      // Get all active agents
      const agents = await db
        .select()
        .from(aiAgents)
        .where(eq(aiAgents.isActive, true));

      // Get all active markets
      const markets = await db
        .select()
        .from(predictionMarkets)
        .where(eq(predictionMarkets.status, 'active'));

      console.log(`📊 Found ${agents.length} active agents and ${markets.length} active markets`);

      if (agents.length === 0 || markets.length === 0) {
        console.log('⏭️  Skipping cycle - no active agents or markets\n');
        return;
      }

      // Get market context (live prices, news, sentiment)
      const marketContext = await marketDataService.getMarketContext();
      console.log(`📈 Market Sentiment: ${marketContext.marketSentiment.overall.toUpperCase()} (${marketContext.marketSentiment.confidence}% confidence)\n`);

      let totalTrades = 0;
      let totalVolume = 0;

      // For each market, have each agent analyze and potentially trade
      for (const market of markets) {
        console.log(`\n🎯 Analyzing Market: "${market.question.substring(0, 80)}..."`);
        console.log(`   Current Price: ${this.calculateMarketPrice(market.yesLiquidity, market.noLiquidity)}% YES`);

        for (const agent of agents) {
          try {
            const traded = await this.analyzeAndTrade(agent, market, marketContext);
            if (traded) {
              totalTrades++;
              totalVolume += traded.amount;
            }
          } catch (error) {
            console.error(`   ❌ ${agent.name} trade failed:`, error);
          }
        }
      }

      console.log('\n═══════════════════════════════════════════════════');
      console.log(`✅ Trading Cycle Complete`);
      console.log(`   📊 Total Trades: ${totalTrades}`);
      console.log(`   💰 Total Volume: ${totalVolume.toFixed(2)} STREAM`);
      console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
      console.error('❌ Trading cycle error:', error);
    }
  }

  /**
   * Have an AI agent analyze a market and execute a trade if confident enough
   */
  private async analyzeAndTrade(
    agent: any,
    market: any,
    marketContext: any
  ): Promise<{ amount: number; side: 'YES' | 'NO' } | null> {
    // Check if agent already has a position in this market
    const existingPosition = await db
      .select()
      .from(aiPositions)
      .where(
        and(
          eq(aiPositions.agentId, agent.id),
          eq(aiPositions.marketId, market.id)
        )
      )
      .limit(1);

    if (existingPosition.length > 0) {
      // Agent already has a position - skip for now
      // In future, could implement position management (adding, reducing, closing)
      return null;
    }

    // Generate prediction using GPT-4
    const prediction = await aiAgentService.analyzeMarket(market, agent.id);

    console.log(`   🤖 ${agent.name}:`);
    console.log(`      Prediction: ${prediction.prediction} (${prediction.confidence}% confidence)`);

    // Check if confidence exceeds agent's threshold
    const confidenceThreshold = agent.confidenceThreshold * 100; // Convert to percentage
    if (prediction.confidence < confidenceThreshold) {
      console.log(`      ⏭️  Skip - confidence below threshold (${confidenceThreshold.toFixed(0)}%)`);
      return null;
    }

    // Calculate position size based on confidence and risk tolerance
    const positionSize = this.calculatePositionSize(
      agent,
      prediction.confidence,
      market
    );

    if (positionSize === 0) {
      console.log(`      ⏭️  Skip - insufficient balance or liquidity`);
      return null;
    }

    // Execute the trade
    const tradeSuccess = await this.executeTrade(
      agent,
      market,
      prediction.prediction,
      positionSize,
      prediction.confidence,
      prediction.reasoning
    );

    if (tradeSuccess) {
      console.log(`      ✅ Traded ${positionSize.toFixed(2)} STREAM on ${prediction.prediction}`);
      return { amount: positionSize, side: prediction.prediction };
    } else {
      console.log(`      ❌ Trade execution failed`);
      return null;
    }
  }

  /**
   * Calculate position size based on agent personality and confidence
   * Phase 1: Fixed position sizing without balances
   */
  private calculatePositionSize(
    agent: any,
    confidence: number,
    market: any
  ): number {
    // Base position size by risk tolerance
    const BASE_POSITIONS: Record<string, number> = {
      'low': 300,           // Conservative
      'medium': 700,        // Data-Driven  
      'medium-high': 1000,  // Contrarian
      'high': 1500,         // Aggressive
    };

    const baseSize = BASE_POSITIONS[agent.riskTolerance] || 500;

    // Scale by confidence (higher confidence = larger position)
    const confidenceThreshold = agent.confidenceThreshold * 100;
    const confidenceAboveMin = confidence - confidenceThreshold;
    const confidenceRange = 100 - confidenceThreshold;
    const confidenceFactor = Math.min(1, confidenceAboveMin / confidenceRange);

    // Final position: base * (0.5 + 0.5 * confidence factor)
    // This gives 50-100% of base position depending on confidence
    const finalSize = baseSize * (0.5 + 0.5 * confidenceFactor);

    // Ensure minimum position size (100 STREAM)
    const MIN_POSITION = 100;
    return finalSize >= MIN_POSITION ? Math.round(finalSize) : 0;
  }

  /**
   * Execute a trade for an AI agent
   * Phase 1: Simplified trading without AMM calculations
   */
  private async executeTrade(
    agent: any,
    market: any,
    side: 'YES' | 'NO',
    amount: number,
    confidence: number,
    reasoning: string
  ): Promise<boolean> {
    try {
      // Phase 1: Simple position recording without AMM
      // Calculate shares: 1 STREAM = 1 share (simplified for Phase 1)
      const sharesReceived = Math.round(amount);
      const sharePrice = 5000; // 50% in basis points (5000 = 50%)
      const fee = Math.round(amount * 0.005); // 0.5% platform fee

      // Update market stats (without AMM liquidity changes for now)
      await db
        .update(predictionMarkets)
        .set({
          totalVolume: market.totalVolume + amount,
          totalTrades: market.totalTrades + 1
        })
        .where(eq(predictionMarkets.id, market.id));

      // Update agent trading volume and award points for trading activity
      const pointsEarned = Math.round(amount * 0.1); // 10% of trade amount as points
      await db
        .update(aiAgents)
        .set({
          totalVolume: agent.totalVolume + Math.round(amount),
          totalPredictions: agent.totalPredictions + 1,
          streamPointsEarned: sql`COALESCE(${aiAgents.streamPointsEarned}, 0) + ${pointsEarned}`,
          updatedAt: new Date()
        })
        .where(eq(aiAgents.id, agent.id));

      // Create or update position
      const existingPosition = await db
        .select()
        .from(aiPositions)
        .where(
          and(
            eq(aiPositions.agentId, agent.id),
            eq(aiPositions.marketId, market.id),
            eq(aiPositions.outcome, side)
          )
        )
        .limit(1);

      let positionId: string;

      if (existingPosition.length > 0) {
        // Update existing position
        const pos = existingPosition[0];
        await db
          .update(aiPositions)
          .set({
            shares: pos.shares + sharesReceived,
            totalInvested: pos.totalInvested + Math.round(amount),
            updatedAt: new Date()
          })
          .where(eq(aiPositions.id, pos.id));
        positionId = pos.id;
      } else {
        // Create new position
        const [newPosition] = await db.insert(aiPositions).values({
          agentId: agent.id,
          marketId: market.id,
          outcome: side,
          shares: sharesReceived,
          averagePrice: sharePrice,
          totalInvested: Math.round(amount),
          currentValue: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        positionId = newPosition.id;
      }

      // Record trade
      await db.insert(aiTrades).values({
        agentId: agent.id,
        marketId: market.id,
        positionId,
        tradeType: 'buy',
        outcome: side,
        shares: sharesReceived,
        price: sharePrice,
        streamAmount: Math.round(amount),
        fee,
        reasoning: `${reasoning} (Confidence: ${confidence.toFixed(1)}%)`,
        createdAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('❌ Trade execution error:', error);
      return false;
    }
  }

  /**
   * Calculate current market price (YES percentage)
   */
  private calculateMarketPrice(yesLiquidity: number, noLiquidity: number): number {
    const total = yesLiquidity + noLiquidity;
    if (total === 0) return 50;
    return Math.round((yesLiquidity / total) * 100);
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.tradingInterval / 60000
    };
  }
}

export const autonomousTradingEngine = new AutonomousTradingEngine();
