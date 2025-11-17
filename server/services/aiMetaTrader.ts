import { db } from '../db';
import { predictionMarkets, users, marketTrades, autonomousSystemLogs } from '@shared/schema';
import { eq, and, sql, ne } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ArbitrageOpportunity {
  marketId: string;
  marketQuestion: string;
  expectedValue: number;
  confidence: number;
  action: 'BUY_YES' | 'BUY_NO';
  amount: number;
  reasoning: string;
}

export class AIMetaTrader {
  private isRunning: boolean = false;
  private aiUserId: string | null = null;

  constructor() {
    console.log('🎯 AI Meta-Trader initialized');
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Meta-trader already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Meta-Trader service...');

    await this.initializeMetaTrader();

    while (this.isRunning) {
      try {
        await this.findAndExecuteArbitrage();

        // Run every 20 minutes (more aggressive)
        const delayMs = 20 * 60 * 1000;
        console.log(`⏱️  Meta-trader sleeping for 20 minutes...`);
        await this.sleep(delayMs);

      } catch (error) {
        console.error('❌ Error in meta-trader:', error);
        await this.sleep(60000);
      }
    }
  }

  stop() {
    console.log('🛑 Stopping AI Meta-Trader...');
    this.isRunning = false;
  }

  private async initializeMetaTrader() {
    const [existingBot] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'AI_Meta_Trader'))
      .limit(1);

    if (existingBot) {
      this.aiUserId = existingBot.id;
      console.log(`✅ Using existing meta-trader: ${existingBot.id}`);
    } else {
      const [newBot] = await db.insert(users).values({
        username: 'AI_Meta_Trader',
        isAiAgent: true,
        streamPoints: 15000000, // 15M STREAM for arbitrage trading
        avatar: '🎯',
        bio: 'Advanced AI trader that exploits market inefficiencies and arbitrage opportunities',
        agentPersonality: {
          role: 'meta_trader',
          strategy: 'arbitrage',
          riskTolerance: 'high',
          expertise: ['market_analysis', 'statistical_arbitrage'],
        },
      }).returning();

      this.aiUserId = newBot.id;
      console.log(`✅ Created new meta-trader: ${newBot.id}`);
    }
  }

  private async findAndExecuteArbitrage() {
    const startTime = Date.now();
    console.log('\n🎯 === Meta-Trading Cycle Starting ===');

    if (!this.aiUserId) {
      console.error('❌ AI user not initialized');
      return;
    }

    // Get all active markets
    const markets = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.status, 'active'))
      .limit(50);

    console.log(`📊 Analyzing ${markets.length} markets for arbitrage...`);

    // Analyze for mispricing
    const opportunities = await this.findArbitrageOpportunities(markets);

    console.log(`💡 Found ${opportunities.length} arbitrage opportunities`);

    let executed = 0;
    let failed = 0;

    for (const opp of opportunities) {
      try {
        console.log(`\n💰 Executing: ${opp.action} on "${opp.marketQuestion.substring(0, 50)}..." (EV: ${opp.expectedValue.toFixed(2)})`);

        await this.executeArbitrageTrade(opp);

        console.log(`✅ Trade executed: ${opp.amount} STREAM`);
        executed++;

        await this.logAction('meta_trader', 'arbitrage_executed', 'success', opp.marketId, {
          action: opp.action,
          amount: opp.amount,
          expectedValue: opp.expectedValue,
        }, opp.reasoning);

        await this.sleep(1000);

      } catch (error: any) {
        console.error(`❌ Failed to execute arbitrage:`, error.message);
        failed++;
        await this.logAction('meta_trader', 'arbitrage_failed', 'failed', opp.marketId, {
          action: opp.action,
        }, undefined, error.message);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`\n📊 Meta-Trading Summary:`);
    console.log(`   ✅ Executed: ${executed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Time: ${(executionTime / 1000).toFixed(1)}s`);
  }

  private async findArbitrageOpportunities(markets: any[]): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const market of markets) {
      // Calculate implied probabilities
      const yesProb = (market.yesPrice || 5000) / 10000;
      const noProb = (market.noPrice || 5000) / 10000;

      // Check for simple arbitrage (prices don't sum to 1)
      const priceSum = yesProb + noProb;
      
      // Look for mispricing (more sophisticated analysis via GPT-4)
      if (Math.abs(priceSum - 1.0) > 0.05) {
        const analysis = await this.analyzeMarketMispricing(market);
        
        if (analysis.confidence > 0.7) {
          opportunities.push(analysis);
        }
      }

      // Limit to top 5 opportunities
      if (opportunities.length >= 5) break;
    }

    return opportunities.sort((a, b) => b.expectedValue - a.expectedValue);
  }

  private async analyzeMarketMispricing(market: any): Promise<ArbitrageOpportunity> {
    const prompt = `You are an advanced AI arbitrage trader analyzing prediction markets for mispricing.

Market: "${market.question}"
Description: ${market.description || 'N/A'}
Category: ${market.category}
YES Price: ${(market.yesPrice / 100).toFixed(1)}%
NO Price: ${(market.noPrice / 100).toFixed(1)}%
YES Liquidity: ${market.yesLiquidity} STREAM
NO Liquidity: ${market.noLiquidity} STREAM
Total Volume: ${market.totalVolume} STREAM

Analyze if this market is mispriced and presents an arbitrage opportunity.

Respond with JSON:
{
  "expectedValue": <-1.0 to 1.0, how much edge in this trade>,
  "confidence": <0.0-1.0 confidence in the mispricing>,
  "action": "BUY_YES" | "BUY_NO" | "SKIP",
  "amount": <trade size 5000-20000 STREAM>,
  "reasoning": "Why this is mispriced and expected value calculation"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an arbitrage expert. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      marketId: market.id,
      marketQuestion: market.question,
      expectedValue: response.expectedValue || 0,
      confidence: response.confidence || 0,
      action: response.action === 'SKIP' ? 'BUY_YES' : response.action,
      amount: response.amount || 10000,
      reasoning: response.reasoning || '',
    };
  }

  private async executeArbitrageTrade(opp: ArbitrageOpportunity) {
    const outcome = opp.action === 'BUY_YES' ? 'YES' : 'NO';

    // Get current balance
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, this.aiUserId!))
      .limit(1);

    if (!user || (user.streamPoints || 0) < opp.amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct STREAM
    await db
      .update(users)
      .set({
        streamPoints: sql`${users.streamPoints} - ${opp.amount}`,
      })
      .where(eq(users.id, this.aiUserId!));

    // Record trade
    await db.insert(marketTrades).values({
      marketId: opp.marketId,
      userId: this.aiUserId!,
      outcome,
      shares: opp.amount,
      price: outcome === 'YES' ? 
        (await this.getMarketPrice(opp.marketId, 'yes')) : 
        (await this.getMarketPrice(opp.marketId, 'no')),
      streamAmount: opp.amount,
    });

    // Update market
    await db
      .update(predictionMarkets)
      .set({
        totalVolume: sql`${predictionMarkets.totalVolume} + ${opp.amount}`,
        totalTrades: sql`${predictionMarkets.totalTrades} + 1`,
        ...(outcome === 'YES' ? {
          yesLiquidity: sql`${predictionMarkets.yesLiquidity} + ${opp.amount}`,
        } : {
          noLiquidity: sql`${predictionMarkets.noLiquidity} + ${opp.amount}`,
        }),
      })
      .where(eq(predictionMarkets.id, opp.marketId));
  }

  private async getMarketPrice(marketId: string, side: 'yes' | 'no'): Promise<number> {
    const [market] = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.id, marketId))
      .limit(1);

    return side === 'yes' ? (market?.yesPrice || 5000) : (market?.noPrice || 5000);
  }

  private async logAction(
    systemName: string,
    actionType: string,
    status: 'success' | 'failed' | 'partial',
    targetId?: string,
    metadata?: any,
    reasoning?: string,
    errorMessage?: string
  ) {
    try {
      await db.insert(autonomousSystemLogs).values({
        systemName,
        actionType,
        status,
        targetId,
        metadata,
        reasoning,
        errorMessage,
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiMetaTrader = new AIMetaTrader();
