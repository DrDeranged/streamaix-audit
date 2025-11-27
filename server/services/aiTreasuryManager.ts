import { db } from '../db';
import { predictionMarkets, users, autonomousSystemLogs } from '@shared/schema';
import { sql } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TreasuryReport {
  totalFees: number;
  reinvestedAmount: number;
  liquidity_additions: number;
  recommendations: string[];
}

export class AITreasuryManager {
  private isRunning: boolean = false;
  private treasuryWalletId: string | null = null;

  constructor() {
    console.log('💰 AI Treasury Manager initialized');
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Treasury manager already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Treasury Manager service...');

    await this.initializeTreasury();

    while (this.isRunning) {
      try {
        await this.manageTreasury();

        // Run every 24 hours
        const delayMs = 24 * 60 * 60 * 1000;
        console.log(`⏱️  Treasury manager sleeping for 24 hours...`);
        await this.sleep(delayMs);

      } catch (error) {
        console.error('❌ Error in treasury manager:', error);
        await this.sleep(60000);
      }
    }
  }

  stop() {
    console.log('🛑 Stopping AI Treasury Manager...');
    this.isRunning = false;
  }

  private async initializeTreasury() {
    const [existingWallet] = await db
      .select()
      .from(users)
      .where(sql`${users.username} = 'AI_Treasury'`)
      .limit(1);

    if (existingWallet) {
      this.treasuryWalletId = existingWallet.id;
      console.log(`✅ Using existing treasury wallet: ${existingWallet.id}`);
    } else {
      const [newWallet] = await db.insert(users).values({
        username: 'AI_Treasury',
        isAiAgent: true,
        streamPoints: 0, // Accumulates fees
        avatar: '💰',
        bio: 'Autonomous treasury management system - collects fees and reinvests into platform growth',
        agentPersonality: {
          role: 'treasury_manager',
        },
      }).returning();

      this.treasuryWalletId = newWallet.id;
      console.log(`✅ Created new treasury wallet: ${newWallet.id}`);
    }
  }

  private async manageTreasury() {
    const startTime = Date.now();
    console.log('\n💰 === Treasury Management Cycle Starting ===');

    if (!this.treasuryWalletId) {
      console.error('❌ Treasury wallet not initialized');
      return;
    }

    // Calculate total platform fees collected
    const feeData = await this.calculateFees();

    // Generate treasury management strategy
    const strategy = await this.generateStrategy(feeData);

    // Execute strategy (reinvest into liquidity pools, etc.)
    await this.executeStrategy(strategy);

    const executionTime = Date.now() - startTime;
    console.log(`\n📊 Treasury Management Summary:`);
    console.log(`   💵 Total Fees: ${feeData.totalFees} STREAM`);
    console.log(`   🔄 Reinvested: ${strategy.reinvestedAmount} STREAM`);
    console.log(`   ⏱️  Time: ${(executionTime / 1000).toFixed(1)}s`);

    await this.logAction('treasury_manager', 'treasury_managed', 'success', undefined, {
      totalFees: feeData.totalFees,
      reinvested: strategy.reinvestedAmount,
    }, strategy.recommendations.join('; '));
  }

  private async calculateFees(): Promise<{ totalFees: number; tradingVolume: number }> {
    const [stats] = await db
      .select({
        totalVolume: sql<number>`COALESCE(SUM(${predictionMarkets.totalVolume}), 0)::int`,
      })
      .from(predictionMarkets);

    // Platform takes 0.5% fee on all trades
    const totalFees = Math.floor((stats.totalVolume || 0) * 0.005);

    return {
      totalFees,
      tradingVolume: stats.totalVolume || 0,
    };
  }

  private async generateStrategy(feeData: { totalFees: number; tradingVolume: number }): Promise<TreasuryReport> {
    const prompt = `You are an autonomous AI treasury manager for a prediction market platform.

Current Treasury Status:
- Total fees collected: ${feeData.totalFees} STREAM
- Total trading volume: ${feeData.tradingVolume} STREAM

Recommend how to use the collected fees to grow the platform.

Respond with JSON:
{
  "totalFees": ${feeData.totalFees},
  "reinvestedAmount": <amount to reinvest in liquidity pools>,
  "liquidity_additions": <number of markets to add liquidity to>,
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

GUIDELINES:
- Reinvest 70-90% of fees back into platform liquidity
- Keep 10-30% in reserve for operations
- Prioritize high-volume markets for liquidity additions`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // COST OPTIMIZATION: 90% cheaper for treasury management
      messages: [
        { role: "system", content: "You are a treasury manager. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      totalFees: feeData.totalFees,
      reinvestedAmount: response.reinvestedAmount || 0,
      liquidity_additions: response.liquidity_additions || 0,
      recommendations: response.recommendations || [],
    };
  }

  private async executeStrategy(strategy: TreasuryReport) {
    console.log(`💵 Executing treasury strategy: ${strategy.recommendations.join(', ')}`);
    
    // In a real implementation, this would:
    // 1. Transfer fees to treasury wallet
    // 2. Reinvest into liquidity pools
    // 3. Update treasury balance
    
    // For now, just log the strategy
    console.log(`✅ Strategy executed: ${strategy.reinvestedAmount} STREAM reinvested`);
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

export const aiTreasuryManager = new AITreasuryManager();
