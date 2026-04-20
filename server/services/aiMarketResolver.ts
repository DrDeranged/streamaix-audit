import { db } from '../db';
import { predictionMarkets, marketResolutions, autonomousSystemLogs } from '@shared/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
import axios from 'axios';

// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

interface ResolutionData {
  outcome: 'YES' | 'NO' | 'INVALID';
  confidence: number;
  reasoning: string;
  sources: string[];
}

export class AIMarketResolver {
  private isRunning: boolean = false;
  private cryptoPriceCache: Map<string, { price: number; change24h: number; marketCap: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 min cache for resolution cycle

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

    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log('🎯 [Market Resolver] ⏸️ OpenAI API paused - market resolver disabled');
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

    // Pre-fetch all crypto prices ONCE to avoid 429 rate limits
    await this.prefetchCryptoPrices();

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
   * Pre-fetch all crypto prices in a single batch request to avoid 429 errors
   */
  private async prefetchCryptoPrices(): Promise<void> {
    const now = Date.now();
    
    // Skip if cache is still fresh
    const anyFresh = Array.from(this.cryptoPriceCache.values()).some(c => now - c.timestamp < this.CACHE_TTL);
    if (anyFresh && this.cryptoPriceCache.size > 0) {
      console.log(`📦 Using cached crypto prices (${this.cryptoPriceCache.size} coins)`);
      return;
    }

    console.log('📊 Pre-fetching crypto prices in batch...');
    
    // All coins we might need for market resolution
    const coinIds = [
      'bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot', 'chainlink',
      'avalanche-2', 'polygon', 'uniswap', 'aave', 'toncoin', 'dogecoin',
      'shiba-inu', 'ripple', 'tron', 'litecoin', 'monero', 'zcash',
      'filecoin', 'the-sandbox', 'axie-infinity', 'decentraland'
    ];

    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: coinIds.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_market_cap: true,
        },
        headers: process.env.COINGECKO_PRO_API_KEY ? {
          'x-cg-pro-api-key': process.env.COINGECKO_PRO_API_KEY
        } : {},
        timeout: 10000,
      });

      for (const [coinId, data] of Object.entries(response.data)) {
        const coinData = data as any;
        this.cryptoPriceCache.set(coinId, {
          price: coinData.usd || 0,
          change24h: coinData.usd_24h_change || 0,
          marketCap: coinData.usd_market_cap || 0,
          timestamp: now,
        });
      }

      console.log(`✅ Pre-fetched ${this.cryptoPriceCache.size} crypto prices in single request`);
    } catch (error: any) {
      console.warn('⚠️ Failed to batch fetch crypto prices:', error.message);
      // Continue with stale cache if available
    }
  }

  /**
   * Get crypto market data from pre-fetched cache (no API calls during resolution)
   */
  private async fetchCryptoData(question: string): Promise<string | null> {
    // Map of keywords to CoinGecko IDs
    const keywordToCoinId: Record<string, string> = {
      'bitcoin': 'bitcoin', 'btc': 'bitcoin',
      'ethereum': 'ethereum', 'eth': 'ethereum',
      'solana': 'solana', 'sol': 'solana',
      'cardano': 'cardano', 'ada': 'cardano',
      'polkadot': 'polkadot', 'dot': 'polkadot',
      'chainlink': 'chainlink', 'link': 'chainlink',
      'avalanche': 'avalanche-2', 'avax': 'avalanche-2',
      'polygon': 'polygon', 'matic': 'polygon',
      'uniswap': 'uniswap', 'uni': 'uniswap',
      'aave': 'aave',
      'toncoin': 'toncoin', 'ton': 'toncoin',
      'dogecoin': 'dogecoin', 'doge': 'dogecoin',
      'ripple': 'ripple', 'xrp': 'ripple',
      'zcash': 'zcash', 'zec': 'zcash',
      'filecoin': 'filecoin', 'fil': 'filecoin',
      'firo': 'zcoin',
      'ergo': 'ergo',
    };

    const questionLower = question.toLowerCase();
    
    // Find matching coin from question
    let matchedCoinId: string | null = null;
    for (const [keyword, coinId] of Object.entries(keywordToCoinId)) {
      if (questionLower.includes(keyword)) {
        matchedCoinId = coinId;
        break;
      }
    }
    
    if (!matchedCoinId) return null;

    // Use cached data instead of making API call
    const cached = this.cryptoPriceCache.get(matchedCoinId);
    if (cached) {
      return `${matchedCoinId.toUpperCase()}: $${cached.price.toFixed(2)} (24h change: ${cached.change24h.toFixed(2)}%, Market cap: $${(cached.marketCap / 1e9).toFixed(2)}B)`;
    }

    return null; // No data available - skip rather than making individual API call
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
