import { db } from '../db';
import { predictionMarkets, users, marketTrades, autonomousSystemLogs } from '@shared/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

export class AILiquidityProvider {
  private isRunning: boolean = false;
  private aiUserId: string | null = null;

  constructor() {
    console.log('💧 AI Liquidity Provider initialized');
  }

  /**
   * Start the liquidity provision service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Liquidity provider already running');
      return;
    }

    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log('💧 [Liquidity Provider] ⏸️ OpenAI API paused - liquidity provider disabled');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Liquidity Provider service...');

    // Get or create AI liquidity provider user
    await this.initializeLiquidityBot();

    while (this.isRunning) {
      try {
        await this.provideLiquidity();

        // Run every 12 hours (MAJOR COST OPTIMIZATION: 6x reduction)
        const delayMs = 12 * 60 * 60 * 1000;
        console.log(`⏱️  Liquidity provider sleeping for 12 hours...`);
        await this.sleep(delayMs);

      } catch (error) {
        console.error('❌ Error in liquidity provider:', error);
        await this.sleep(60000);
      }
    }
  }

  stop() {
    console.log('🛑 Stopping AI Liquidity Provider...');
    this.isRunning = false;
  }

  private async initializeLiquidityBot() {
    // Check if liquidity bot exists
    const [existingBot] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'AI_Liquidity_Provider'))
      .limit(1);

    if (existingBot) {
      this.aiUserId = existingBot.id;
      console.log(`✅ Using existing liquidity bot: ${existingBot.id}`);
    } else {
      // Create liquidity bot
      const [newBot] = await db.insert(users).values({
        username: 'AI_Liquidity_Provider',
        isAiAgent: true,
        streamPoints: 10000000, // 10M STREAM for liquidity provision
        avatar: '💧',
        bio: 'Autonomous AI system that provides liquidity to new prediction markets',
        agentPersonality: {
          role: 'liquidity_provider',
          strategy: 'balanced',
          riskTolerance: 'medium',
        },
      }).returning();

      this.aiUserId = newBot.id;
      console.log(`✅ Created new liquidity bot: ${newBot.id}`);
    }
  }

  private async provideLiquidity() {
    const startTime = Date.now();
    console.log('\n💧 === Liquidity Provision Cycle Starting ===');

    if (!this.aiUserId) {
      console.error('❌ AI user not initialized');
      return;
    }

    // Find new markets with low liquidity (< 10K STREAM)
    const lowLiquidityMarkets = await db
      .select()
      .from(predictionMarkets)
      .where(
        and(
          eq(predictionMarkets.status, 'active'),
          lt(predictionMarkets.totalVolume, 10000)
        )
      )
      .limit(10);

    console.log(`📋 Found ${lowLiquidityMarkets.length} markets needing liquidity`);

    if (lowLiquidityMarkets.length === 0) {
      console.log('✅ All markets have sufficient liquidity');
      return;
    }

    let provided = 0;
    let failed = 0;

    for (const market of lowLiquidityMarkets) {
      try {
        console.log(`\n💰 Providing liquidity to: "${market.question}"`);

        // Analyze market to determine fair liquidity amounts
        const liquidityPlan = await this.analyzeLiquidityNeed(market);

        // Execute balanced YES/NO liquidity provision
        await this.addBalancedLiquidity(market, liquidityPlan);

        console.log(`✅ Added ${liquidityPlan.yesAmount + liquidityPlan.noAmount} STREAM liquidity (${liquidityPlan.yesAmount} YES / ${liquidityPlan.noAmount} NO)`);
        provided++;

        await this.logAction('liquidity_provider', 'liquidity_added', 'success', market.id, {
          question: market.question,
          yesAmount: liquidityPlan.yesAmount,
          noAmount: liquidityPlan.noAmount,
          totalAdded: liquidityPlan.yesAmount + liquidityPlan.noAmount,
        }, liquidityPlan.reasoning);

        // Small delay between provisions
        await this.sleep(1000);

      } catch (error: any) {
        console.error(`❌ Failed to provide liquidity for market ${market.id}:`, error.message);
        failed++;
        await this.logAction('liquidity_provider', 'liquidity_failed', 'failed', market.id, {
          question: market.question,
        }, undefined, error.message);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`\n📊 Liquidity Provision Summary:`);
    console.log(`   ✅ Provided: ${provided}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Time: ${(executionTime / 1000).toFixed(1)}s`);
  }

  /**
   * Analyze market and determine optimal liquidity amounts
   */
  private async analyzeLiquidityNeed(market: any): Promise<{
    yesAmount: number;
    noAmount: number;
    reasoning: string;
  }> {
    const prompt = `You are an autonomous AI liquidity provider for prediction markets.

Market Question: "${market.question}"
Market Description: ${market.description || 'N/A'}
Category: ${market.category}
Current YES liquidity: ${market.yesLiquidity || 0} STREAM
Current NO liquidity: ${market.noLiquidity || 0} STREAM
Current total volume: ${market.totalVolume || 0} STREAM
Deadline: ${market.deadline}

Determine how much liquidity to provide to this market.

Respond with JSON:
{
  "yesAmount": <number between 2000-5000>,
  "noAmount": <number between 2000-5000>,
  "reasoning": "Brief explanation of the liquidity amounts chosen"
}

GUIDELINES:
- Provide balanced liquidity (roughly equal YES/NO) for new markets
- Slightly favor the more likely outcome if it's obvious (60/40 split max)
- Total liquidity should be 4000-8000 STREAM for most markets
- More liquidity for high-interest categories (crypto, defi)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // COST OPTIMIZATION: 90% cheaper for liquidity decisions
      messages: [
        { role: "system", content: "You are a liquidity provider. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      yesAmount: Math.min(Math.max(response.yesAmount || 3000, 2000), 5000),
      noAmount: Math.min(Math.max(response.noAmount || 3000, 2000), 5000),
      reasoning: response.reasoning || 'Providing balanced liquidity',
    };
  }

  /**
   * Add balanced liquidity to a market
   */
  private async addBalancedLiquidity(market: any, plan: { yesAmount: number; noAmount: number }) {
    // Get current user balance
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, this.aiUserId!))
      .limit(1);

    const totalNeeded = plan.yesAmount + plan.noAmount;
    
    if (!user || (user.streamPoints || 0) < totalNeeded) {
      // Auto-refill balance for AI liquidity bot when insufficient
      console.log(`💰 Refilling AI Liquidity Provider balance (current: ${user?.streamPoints || 0}, needed: ${totalNeeded})`);
      const refillAmount = 10000000; // 10M STREAM refill
      await db
        .update(users)
        .set({
          streamPoints: sql`COALESCE(${users.streamPoints}, 0) + ${refillAmount}`,
        })
        .where(eq(users.id, this.aiUserId!));
      console.log(`✅ Balance refilled with ${refillAmount.toLocaleString()} STREAM`);
    }

    // Deduct STREAM from liquidity bot
    await db
      .update(users)
      .set({
        streamPoints: sql`${users.streamPoints} - ${totalNeeded}`,
      })
      .where(eq(users.id, this.aiUserId!));

    // Add YES liquidity
    await db.insert(marketTrades).values({
      marketId: market.id,
      userId: this.aiUserId!,
      userWallet: 'AI_LIQUIDITY_PROVIDER',
      tradeType: 'BUY',
      outcome: 'YES',
      shares: plan.yesAmount,
      price: market.yesPrice || 5000, // 50% default
      streamAmount: plan.yesAmount,
      fee: 0, // No fee for liquidity provision
    });

    // Add NO liquidity
    await db.insert(marketTrades).values({
      marketId: market.id,
      userId: this.aiUserId!,
      userWallet: 'AI_LIQUIDITY_PROVIDER',
      tradeType: 'BUY',
      outcome: 'NO',
      shares: plan.noAmount,
      price: market.noPrice || 5000, // 50% default
      streamAmount: plan.noAmount,
      fee: 0, // No fee for liquidity provision
    });

    // Update market liquidity
    await db
      .update(predictionMarkets)
      .set({
        yesLiquidity: sql`${predictionMarkets.yesLiquidity} + ${plan.yesAmount}`,
        noLiquidity: sql`${predictionMarkets.noLiquidity} + ${plan.noAmount}`,
        totalVolume: sql`${predictionMarkets.totalVolume} + ${totalNeeded}`,
        totalTrades: sql`${predictionMarkets.totalTrades} + 2`,
        updatedAt: new Date(),
      })
      .where(eq(predictionMarkets.id, market.id));
  }

  /**
   * Log autonomous system action
   */
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

// Singleton instance
export const aiLiquidityProvider = new AILiquidityProvider();
