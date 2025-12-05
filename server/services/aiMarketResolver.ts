import { db } from '../db';
import { predictionMarkets, marketResolutions, autonomousSystemLogs } from '@shared/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ResolutionData {
  outcome: 'YES' | 'NO' | 'INVALID';
  confidence: number;
  reasoning: string;
  sources: string[];
}

export class AIMarketResolver {
  private isRunning: boolean = false;

  constructor() {
    console.log('🎯 AI Market Resolver initialized');
  }

  /**
   * Start the auto-resolution service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Market resolver already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Market Resolver service...');

    while (this.isRunning) {
      try {
        await this.resolveExpiredMarkets();

        // Run every 12 hours (MAJOR COST OPTIMIZATION: 8x reduction)
        const delayMs = 12 * 60 * 60 * 1000;
        console.log(`⏱️  Market resolver sleeping for 12 hours...`);
        await this.sleep(delayMs);

      } catch (error) {
        console.error('❌ Error in market resolver:', error);
        await this.sleep(60000);
      }
    }
  }

  stop() {
    console.log('🛑 Stopping AI Market Resolver...');
    this.isRunning = false;
  }

  private async resolveExpiredMarkets() {
    const startTime = Date.now();
    console.log('\n🎯 === Market Resolution Cycle Starting ===');

    // Find markets that are past deadline and not yet resolved
    const expiredMarkets = await db
      .select()
      .from(predictionMarkets)
      .where(
        and(
          eq(predictionMarkets.status, 'active'),
          lt(predictionMarkets.deadline, new Date())
        )
      );

    console.log(`📋 Found ${expiredMarkets.length} expired markets to resolve`);

    if (expiredMarkets.length === 0) {
      console.log('✅ No markets need resolution');
      return;
    }

    let resolved = 0;
    let failed = 0;

    for (const market of expiredMarkets) {
      try {
        console.log(`\n🔍 Analyzing market: "${market.question}"`);

        // Get resolution data from AI + external sources
        const resolutionData = await this.analyzeMarketOutcome(market);

        if (resolutionData.confidence < 0.75) {
          console.log(`⚠️  Confidence too low (${(resolutionData.confidence * 100).toFixed(1)}%) - skipping for manual review`);
          await this.logAction('market_resolver', 'skipped_low_confidence', 'partial', market.id, {
            question: market.question,
            confidence: resolutionData.confidence,
            reasoning: resolutionData.reasoning,
          }, resolutionData.reasoning);
          continue;
        }

        // Resolve the market
        await this.resolveMarket(market, resolutionData);

        console.log(`✅ Resolved: ${market.question} → ${resolutionData.outcome} (${(resolutionData.confidence * 100).toFixed(1)}% confidence)`);
        resolved++;

        await this.logAction('market_resolver', 'market_resolved', 'success', market.id, {
          question: market.question,
          outcome: resolutionData.outcome,
          confidence: resolutionData.confidence,
          sources: resolutionData.sources,
        }, resolutionData.reasoning);

        // Small delay between resolutions to avoid rate limits
        await this.sleep(2000);

      } catch (error: any) {
        console.error(`❌ Failed to resolve market ${market.id}:`, error.message);
        failed++;
        await this.logAction('market_resolver', 'resolution_failed', 'failed', market.id, {
          question: market.question,
        }, undefined, error.message);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`\n📊 Resolution Summary:`);
    console.log(`   ✅ Resolved: ${resolved}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Time: ${(executionTime / 1000).toFixed(1)}s`);
  }

  /**
   * Use GPT-4 + external APIs to determine market outcome
   */
  private async analyzeMarketOutcome(market: any): Promise<ResolutionData> {
    const sources: string[] = [];
    let externalData = '';

    // Try to fetch relevant data based on market category
    if (market.category === 'crypto' || market.category === 'defi') {
      const cryptoData = await this.fetchCryptoData(market.question);
      if (cryptoData) {
        externalData += `\n\nCrypto Market Data:\n${cryptoData}`;
        sources.push('CoinGecko API');
      }
    }

    // Use GPT-4 to analyze the outcome
    const prompt = `You are an autonomous AI system that resolves prediction markets.

Market Question: "${market.question}"
Market Description: ${market.description || 'N/A'}
Market Category: ${market.category}
Deadline: ${market.deadline}
${externalData}

Based on the available information, determine the outcome of this prediction market.

Respond with a JSON object:
{
  "outcome": "YES" | "NO" | "INVALID",
  "confidence": 0.0 to 1.0,
  "reasoning": "Detailed explanation of why this outcome was chosen",
  "key_facts": ["fact 1", "fact 2", ...]
}

IMPORTANT:
- Only return confidence > 0.75 if you have strong evidence
- Use "INVALID" if the market is ambiguous or cannot be resolved objectively
- Be conservative - if unsure, lower the confidence score`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // COST OPTIMIZATION: 90% cheaper for market resolution
      messages: [
        { role: "system", content: "You are an expert prediction market resolver. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      outcome: response.outcome,
      confidence: response.confidence,
      reasoning: response.reasoning,
      sources: sources.length > 0 ? sources : ['GPT-4 Analysis'],
    };
  }

  /**
   * Fetch crypto market data from CoinGecko
   */
  private async fetchCryptoData(question: string): Promise<string | null> {
    try {
      // Extract potential crypto symbols from question
      const cryptoSymbols = ['bitcoin', 'ethereum', 'btc', 'eth', 'solana', 'sol'];
      const questionLower = question.toLowerCase();
      
      const foundSymbol = cryptoSymbols.find(symbol => questionLower.includes(symbol));
      
      if (!foundSymbol) return null;

      // Map common names to CoinGecko IDs
      const symbolMap: Record<string, string> = {
        'bitcoin': 'bitcoin',
        'btc': 'bitcoin',
        'ethereum': 'ethereum',
        'eth': 'ethereum',
        'solana': 'solana',
        'sol': 'solana',
      };

      const coinId = symbolMap[foundSymbol];
      if (!coinId) return null;

      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true,
        },
        timeout: 5000,
      });

      const data = response.data[coinId];
      if (!data) return null;

      return `${coinId.toUpperCase()}: $${data.usd} (24h change: ${data.usd_24h_change?.toFixed(2)}%, Market cap: $${(data.usd_market_cap / 1e9).toFixed(2)}B)`;

    } catch (error: any) {
      console.warn('⚠️  Failed to fetch crypto data:', error.message);
      return null;
    }
  }

  /**
   * Resolve a market with the determined outcome
   */
  private async resolveMarket(market: any, resolutionData: ResolutionData) {
    // Update market status
    await db
      .update(predictionMarkets)
      .set({
        status: 'resolved',
        resolution: resolutionData.outcome,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(predictionMarkets.id, market.id));

    // Record resolution details
    await db.insert(marketResolutions).values({
      marketId: market.id,
      resolution: resolutionData.outcome,
      resolutionSource: `AI_RESOLVER (confidence: ${resolutionData.confidence}%)`,
      resolutionData: {
        reasoning: resolutionData.reasoning,
        confidence: resolutionData.confidence,
        sources: resolutionData.sources,
      },
    });

    // Send push notifications to all users with positions in this market
    await this.notifyMarketParticipants(market, resolutionData.outcome);
  }

  /**
   * Notify all users who have positions in a resolved market
   */
  private async notifyMarketParticipants(market: any, outcome: string) {
    try {
      const { pushNotificationService } = await import('./pushNotificationService');
      const { marketPositions } = await import('@shared/schema');

      // Get all users with positions in this market
      const positions = await db
        .select()
        .from(marketPositions)
        .where(eq(marketPositions.marketId, market.id));

      console.log(`🔔 Notifying ${positions.length} users about market resolution`);

      for (const position of positions) {
        if (!position.userId) continue;

        // Calculate winnings if user bet correctly
        const userWon = position.outcome.toUpperCase() === outcome.toUpperCase();
        const winnings = userWon ? position.shares : 0;
        const investment = position.totalInvested || 0;
        const percentReturn = investment > 0 && userWon ? ((winnings - investment) / investment) * 100 : 0;

        await pushNotificationService.notifyMarketResolution(
          position.userId,
          market.question,
          outcome,
          winnings,
          percentReturn,
          market.id
        ).catch(err => console.log('Push notification skipped:', err.message));
      }
    } catch (error) {
      console.error('Error sending market resolution notifications:', error);
    }
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
export const aiMarketResolver = new AIMarketResolver();
