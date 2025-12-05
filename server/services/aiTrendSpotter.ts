import { db } from '../db';
import { predictionMarkets, users, autonomousSystemLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MarketIdea {
  question: string;
  description: string;
  category: string;
  deadline: Date;
  confidence: number;
  reasoning: string;
}

export class AITrendSpotter {
  private isRunning: boolean = false;
  private aiUserId: string | null = null;

  constructor() {
    console.log('🔍 AI Trend Spotter initialized');
  }

  /**
   * Start the trend spotting service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Trend spotter already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Trend Spotter service...');

    // Get or create AI trend spotter user
    await this.initializeTrendBot();

    while (this.isRunning) {
      try {
        await this.spotTrendsAndCreateMarkets();

        // Run every 48 hours (MAJOR COST OPTIMIZATION: 75% reduction)
        const delayMs = 48 * 60 * 60 * 1000;
        console.log(`⏱️  Trend spotter sleeping for 48 hours...`);
        await this.sleep(delayMs);

      } catch (error) {
        console.error('❌ Error in trend spotter:', error);
        await this.sleep(60000);
      }
    }
  }

  stop() {
    console.log('🛑 Stopping AI Trend Spotter...');
    this.isRunning = false;
  }

  private async initializeTrendBot() {
    const [existingBot] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'AI_Trend_Spotter'))
      .limit(1);

    if (existingBot) {
      this.aiUserId = existingBot.id;
      console.log(`✅ Using existing trend spotter: ${existingBot.id}`);
    } else {
      const [newBot] = await db.insert(users).values({
        username: 'AI_Trend_Spotter',
        isAiAgent: true,
        streamPoints: 5000000,
        avatar: '🔍',
        bio: 'Autonomous AI system that monitors crypto trends and creates prediction markets',
        agentPersonality: {
          role: 'trend_spotter',
          expertise: ['crypto', 'defi', 'nft', 'layer2'],
        },
      }).returning();

      this.aiUserId = newBot.id;
      console.log(`✅ Created new trend spotter: ${newBot.id}`);
    }
  }

  private async spotTrendsAndCreateMarkets() {
    const startTime = Date.now();
    console.log('\n🔍 === Trend Spotting Cycle Starting ===');

    if (!this.aiUserId) {
      console.error('❌ AI user not initialized');
      return;
    }

    // Gather trend data from multiple sources
    const trendData = await this.gatherTrendData();

    // Use GPT-4 to generate market ideas
    const marketIdeas = await this.generateMarketIdeas(trendData);

    console.log(`💡 Generated ${marketIdeas.length} market ideas`);

    let created = 0;
    let failed = 0;

    for (const idea of marketIdeas) {
      try {
        // Check if similar market already exists
        const exists = await this.checkMarketExists(idea.question);
        
        if (exists) {
          console.log(`⚠️  Similar market already exists: "${idea.question}"`);
          continue;
        }

        await this.createMarket(idea);
        console.log(`✅ Created market: "${idea.question}"`);
        created++;

        await this.logAction('trend_spotter', 'market_created', 'success', undefined, {
          question: idea.question,
          category: idea.category,
          confidence: idea.confidence,
        }, idea.reasoning);

        // Notify users about new AI-created market
        this.notifyNewMarket(idea.question, idea.category).catch(err => 
          console.log('Push notification skipped:', err.message)
        );

        // Delay between creations
        await this.sleep(2000);

      } catch (error: any) {
        console.error(`❌ Failed to create market:`, error.message);
        failed++;
        await this.logAction('trend_spotter', 'market_creation_failed', 'failed', undefined, {
          question: idea.question,
        }, undefined, error.message);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`\n📊 Trend Spotting Summary:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Time: ${(executionTime / 1000).toFixed(1)}s`);
  }

  /**
   * Gather trending data from various sources
   */
  private async gatherTrendData(): Promise<string> {
    const dataPoints: string[] = [];

    // Try to get trending crypto data
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', {
        timeout: 5000,
      });

      if (response.data?.coins) {
        const trendingCoins = response.data.coins.slice(0, 10).map((c: any) => c.item.name);
        dataPoints.push(`Trending Cryptocurrencies: ${trendingCoins.join(', ')}`);
      }
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch trending crypto:', error.message);
    }

    // Try to get market data
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/global', {
        timeout: 5000,
      });

      const data = response.data?.data;
      if (data) {
        dataPoints.push(`Total Market Cap: $${(data.total_market_cap?.usd / 1e12).toFixed(2)}T`);
        dataPoints.push(`Bitcoin Dominance: ${data.market_cap_percentage?.btc?.toFixed(1)}%`);
        dataPoints.push(`DeFi to Total Cap: ${((data.defi_market_cap / data.total_market_cap?.usd) * 100).toFixed(2)}%`);
      }
    } catch (error: any) {
      console.warn('⚠️  Failed to fetch global market data:', error.message);
    }

    return dataPoints.join('\n');
  }

  /**
   * Use GPT-4 to generate market ideas based on trends
   */
  private async generateMarketIdeas(trendData: string): Promise<MarketIdea[]> {
    const currentDate = new Date();
    const next7Days = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next30Days = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const next90Days = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);

    const prompt = `You are an autonomous AI system that creates prediction markets based on crypto trends.

Current Date: ${currentDate.toISOString()}
Available Market Data:
${trendData}

Generate 3-5 interesting prediction market ideas based on current crypto trends.

Respond with JSON array:
[
  {
    "question": "Clear yes/no question (e.g., 'Will Bitcoin reach $100k by end of 2024?')",
    "description": "Detailed description explaining the market and resolution criteria",
    "category": "crypto|defi|nft|layer2|community",
    "deadlineDays": <7|30|90>,
    "confidence": <0.0-1.0 how good this market idea is>,
    "reasoning": "Why this is a timely and interesting market"
  }
]

GUIDELINES:
- Focus on objectively resolvable questions
- Use clear resolution criteria
- Mix short-term (7 days) and long-term (30-90 days) markets
- Avoid markets about subjective outcomes
- Make questions specific and measurable`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // COST OPTIMIZATION: 90% cheaper for trend spotting
      messages: [
        { role: "system", content: "You are a prediction market creator. Always return valid JSON array." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{"markets":[]}');
    const markets = response.markets || [];

    return markets.map((m: any) => {
      let deadline: Date;
      if (m.deadlineDays <= 7) deadline = next7Days;
      else if (m.deadlineDays <= 30) deadline = next30Days;
      else deadline = next90Days;

      return {
        question: m.question,
        description: m.description,
        category: m.category || 'crypto',
        deadline,
        confidence: m.confidence || 0.7,
        reasoning: m.reasoning,
      };
    }).filter((m: MarketIdea) => m.confidence >= 0.6); // Only high-confidence ideas
  }

  /**
   * Check if similar market already exists
   */
  private async checkMarketExists(question: string): Promise<boolean> {
    const similar = await db
      .select()
      .from(predictionMarkets)
      .where(eq(predictionMarkets.question, question))
      .limit(1);

    return similar.length > 0;
  }

  /**
   * Create a new prediction market
   */
  private async createMarket(idea: MarketIdea) {
    // Generate unique contract market ID
    const contractMarketId = Math.floor(Math.random() * 1000000) + 100000;
    
    await db.insert(predictionMarkets).values({
      contractMarketId,
      question: idea.question,
      description: idea.description,
      category: idea.category,
      deadline: idea.deadline,
      creatorId: this.aiUserId!,
      creatorWallet: 'AI_TREND_SPOTTER',
      initialLiquidity: 0,
      status: 'active',
      yesPrice: 5000, // 50%
      noPrice: 5000, // 50%
      yesLiquidity: 0,
      noLiquidity: 0,
      totalVolume: 0,
      totalTrades: 0,
    });
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

  /**
   * Notify users subscribed to AI agent activity about new market
   */
  private async notifyNewMarket(question: string, category: string): Promise<void> {
    try {
      const { pushNotificationService } = await import('./pushNotificationService');
      
      // Broadcast to all users who have AI agent activity notifications enabled
      await pushNotificationService.sendToAll({
        title: `🤖 New AI Prediction Market`,
        body: `📈 ${category.toUpperCase()}\n"${question.substring(0, 80)}${question.length > 80 ? '...' : ''}"`,
        url: '/markets',
        tag: `ai-market-${Date.now()}`,
        requireInteraction: false,
      }, 'ai_agent_activity');
    } catch (error) {
      // Silent fail - notifications are best effort
    }
  }
}

// Singleton instance
export const aiTrendSpotter = new AITrendSpotter();
