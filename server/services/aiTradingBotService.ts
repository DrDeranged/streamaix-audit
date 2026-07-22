import { db } from '../db';
import { aiAgents, predictionMarkets, aiTrades, aiPredictions, aiPositions, autonomousSystemLogs } from '@shared/schema';
import { eq, and, desc, sql, lt } from 'drizzle-orm';
import { modelGateway } from "../lib/modelGateway";
import { jobScheduler } from '../jobs/scheduler';

export class AITradingBotService {
  private isRunning: boolean = false;
  private cycleCount: number = 0;

  constructor() {
    console.log('💹 AI Trading Bot Service initialized');
  }

  /**
   * Start the trading bot service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Trading bot service already running');
      return;
    }

    if (process.env.PAUSE_ANTHROPIC_API === 'true') {
      console.log('💹 [Trading Bots] ⏸️ OpenAI API paused - trading bots disabled');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI trading bot service...');

    jobScheduler.register('ai-trading-bots', 5 * 60 * 60 * 1000, () => this.runTradingCycle(), { runOnStart: true, staggerMs: 15000, jitterMs: 2 * 60 * 60 * 1000 });
  }

  /**
   * Stop the trading service
   */
  stop() {
    console.log('🛑 Stopping AI trading bot service...');
    this.isRunning = false;
    jobScheduler.cancel('ai-trading-bots');
  }

  /**
   * Run a single trading cycle
   */
  private async runTradingCycle() {
    if (process.env.PAUSE_ANTHROPIC_API === 'true') {
      console.log('💹 [Trading Bots] ⏸️ OpenAI API paused - skipping trading cycle');
      return;
    }

    this.cycleCount++;
    console.log(`\n📈 === Trading Cycle ${this.cycleCount} Starting ===`);

    // Get all active trading bots
    const bots = await db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.isActive, true));

    console.log(`🤖 Found ${bots.length} active trading bots`);

    if (bots.length === 0) {
      console.log('⚠️  No trading bots found. Run auto-seed first.');
      return;
    }

    // Get active markets that haven't resolved
    const markets = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.status, 'active'))
      .limit(20);

    console.log(`🎯 Found ${markets.length} active markets`);

    if (markets.length === 0) {
      console.log('⚠️  No active markets available for trading');
      return;
    }

    // Select random bots to trade this cycle (30-50% of bots)
    const activeBotCount = Math.floor(bots.length * (0.3 + Math.random() * 0.2));
    const shuffledBots = this.shuffleArray([...bots]);
    const tradingBots = shuffledBots.slice(0, activeBotCount);

    console.log(`✅ ${tradingBots.length} bots selected for this cycle`);

    // Execute trades in parallel (but limit concurrency to avoid rate limits)
    const BATCH_SIZE = 5;
    for (let i = 0; i < tradingBots.length; i += BATCH_SIZE) {
      const batch = tradingBots.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(bot => this.executeBotTrading(bot, markets))
      );
      // Small delay between batches to avoid API rate limits
      if (i + BATCH_SIZE < tradingBots.length) {
        await this.sleep(2000);
      }
    }

    console.log(`✅ Trading cycle ${this.cycleCount} completed`);
  }

  /**
   * Execute trading for a single bot
   */
  private async executeBotTrading(bot: any, markets: any[]) {
    try {
      // Select a random market for this bot
      const market = markets[Math.floor(Math.random() * markets.length)];

      // Analyze the market using GPT-4
      const analysis = await this.analyzeMarket(bot, market);

      // Check if bot should trade based on confidence threshold
      if (analysis.confidence < bot.confidenceThreshold * 100) {
        console.log(`  ⏭️  ${bot.name} skipped market (confidence ${analysis.confidence.toFixed(1)}% < threshold ${(bot.confidenceThreshold * 100).toFixed(1)}%)`);
        return;
      }

      // Determine position size based on bot's settings
      const tradeAmount = this.calculateTradeAmount(bot);

      // Execute the trade
      await this.executeTrade(bot, market, analysis, tradeAmount);

      console.log(`  ✅ ${bot.name} executed ${analysis.prediction} trade on "${market.question.substring(0, 50)}..." for ${tradeAmount} STREAM`);
      
      // Log successful trade to database
      await this.logTradeAction(bot.id, market.id, 'trade_executed', true, analysis.reasoning);

    } catch (error: any) {
      console.error(`  ❌ Error executing trade for ${bot.name}:`, error.message);
      // Log failed trade to database
      await this.logTradeAction(bot.id, null, 'trade_failed', false, undefined, error.message);
    }
  }
  
  /**
   * Log trading action to database for admin dashboard
   */
  private async logTradeAction(botId: string, marketId: string | null, actionType: string, success: boolean, reasoning?: string, errorMessage?: string) {
    try {
      await db.insert(autonomousSystemLogs).values({
        systemName: 'trading_bots',
        actionType,
        status: success ? 'success' : 'failed',
        targetId: marketId || botId,
        reasoning: reasoning || actionType,
        errorMessage: errorMessage || null,
        executionTimeMs: 0,
        metadata: { botId, marketId },
      });
    } catch (dbError) {
      console.error('Failed to log trade action:', dbError);
    }
  }

  /**
   * Analyze a market using GPT-4 based on bot personality
   */
  private async analyzeMarket(bot: any, market: any): Promise<{
    prediction: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
  }> {
    const systemPrompt = `You are ${bot.name}, an AI trading bot with the following characteristics:
- Personality: ${bot.personality}
- Strategy: ${bot.strategy}
- Risk Tolerance: ${bot.riskTolerance}
- Description: ${bot.description}

Your job is to analyze prediction markets and make trading decisions based on your personality and strategy.`;

    const userPrompt = `Analyze this prediction market and decide whether to trade:

Market Question: ${market.question}
${market.description ? `Description: ${market.description}` : ''}
Category: ${market.category}
${market.assetClass ? `Asset Class: ${market.assetClass}` : ''}
${market.ticker ? `Ticker: ${market.ticker}` : ''}
Deadline: ${market.deadline}
Current YES Price: ${(market.yesPrice / 100).toFixed(1)}%
Current NO Price: ${(market.noPrice / 100).toFixed(1)}%
Total Volume: ${market.totalVolume} STREAM
${market.tags?.length ? `Tags: ${market.tags.join(', ')}` : ''}

Based on your ${bot.personality} personality and ${bot.riskTolerance} risk tolerance, analyze this market.
${market.assetClass === 'tech_stock' ? 'Consider tech stock fundamentals, earnings, and market sentiment.' : ''}
${market.assetClass === 'macro' ? 'Consider macroeconomic factors, central bank policy, and economic indicators.' : ''}
${market.assetClass === 'crypto' ? 'Consider on-chain metrics, market sentiment, and crypto-specific catalysts.' : ''}

Provide your analysis in JSON format:
{
  "prediction": "YES" or "NO",
  "confidence": 0-100 (your confidence level as a percentage),
  "reasoning": "brief explanation of your decision (1-2 sentences)"
}`;

    try {
      const analysis = await modelGateway.completeJson<any>({
        tier: "reasoning",
        system: systemPrompt,
        user: userPrompt,
        temperature: bot.personality === 'contrarian' ? 0.9 : 0.7,
      });

      return {
        prediction: analysis.prediction,
        confidence: parseFloat(analysis.confidence) || 50,
        reasoning: analysis.reasoning || 'Market analysis based on current conditions',
      };
    } catch (error: any) {
      console.error(`GPT-4 analysis error for ${bot.name}:`, error.message);
      // Fallback to simple probability-based decision
      const shouldBuyYes = Math.random() > (market.yesPrice / 10000);
      return {
        prediction: shouldBuyYes ? 'YES' : 'NO',
        confidence: 55 + Math.random() * 15,
        reasoning: 'Automated decision based on market odds',
      };
    }
  }

  /**
   * Calculate trade amount based on bot's position sizing
   */
  private calculateTradeAmount(bot: any): number {
    // Base amounts for different position sizes
    const sizeMap: Record<string, number> = {
      'micro': 50,
      'small': 100,
      'medium': 250,
      'large': 500,
      'whale': 1000
    };

    const baseAmount = sizeMap[bot.positionSize] || 250;
    // Add some randomness (±20%)
    const variance = 0.8 + Math.random() * 0.4;
    return Math.floor(baseAmount * variance);
  }

  /**
   * Execute a trade
   */
  private async executeTrade(bot: any, market: any, analysis: any, tradeAmount: number) {
    try {
      // Calculate shares based on AMM formula
      const currentPrice = analysis.prediction === 'YES' ? market.yesPrice : market.noPrice;
      const shares = Math.floor((tradeAmount / currentPrice) * 100);

      // Save the trade
      await db.insert(aiTrades).values({
        agentId: bot.id,
        marketId: market.id,
        outcome: analysis.prediction,
        tradeType: 'BUY',
        streamAmount: tradeAmount,
        shares: shares,
        price: currentPrice / 100,
        fee: Math.floor(tradeAmount * 0.005), // 0.5% fee
        reasoning: analysis.reasoning,
        probability: analysis.confidence,
      });

      // Save the prediction
      await db.insert(aiPredictions).values({
        agentId: bot.id,
        marketId: market.id,
        prediction: analysis.prediction,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
      });

      // Update bot stats
      await db
        .update(aiAgents)
        .set({
          totalPredictions: sql`${aiAgents.totalPredictions} + 1`,
          totalVolume: sql`${aiAgents.totalVolume} + ${tradeAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(aiAgents.id, bot.id));

      // Update market volume
      await db
        .update(predictionMarkets)
        .set({
          totalVolume: sql`${predictionMarkets.totalVolume} + ${tradeAmount}`,
        })
        .where(eq(predictionMarkets.id, market.id));

    } catch (error: any) {
      throw new Error(`Trade execution failed: ${error.message}`);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let tradingBotServiceInstance: AITradingBotService | null = null;

export function getTradingBotService(): AITradingBotService {
  if (!tradingBotServiceInstance) {
    tradingBotServiceInstance = new AITradingBotService();
  }
  return tradingBotServiceInstance;
}
