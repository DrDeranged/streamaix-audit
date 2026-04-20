import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
import { marketDataService } from './marketDataService';
import { derivativesAnalyticsService } from './derivativesAnalyticsService';

// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

interface MarketContext {
  symbol: string;
  price: number;
  change24h: number;
  change7d?: number;
  volume24h: number;
  marketCap?: number;
  fundingRate?: number;
  openInterest?: number;
  liquidations24h?: number;
}

interface AlphaInsight {
  headline: string;
  analysis: string;
  actionableAdvice: string;
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'caution';
  confidence: number;
  keyLevels?: { support: number; resistance: number };
}

interface PriceAlertInsight {
  headline: string;
  whyItMoved: string;
  whatItMeans: string;
  actionAdvice: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface MorningBriefingInsight {
  marketRegime: string;
  topOpportunity: string;
  riskWarning: string;
  watchList: string[];
  dayTraderFocus: string;
  swingTraderFocus: string;
}

interface EveningRecapInsight {
  dayAnalysis: string;
  keyTakeaway: string;
  overnightSetup: string;
  tomorrowOutlook: string;
  positionAdvice: string;
}

interface TradingSignalInsight {
  signalStrength: 'weak' | 'moderate' | 'strong' | 'extreme';
  correlatedSignals: string[];
  recommendation: string;
  timeframe: string;
  riskReward: string;
}

class AlphaInsightsEngine {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async generatePriceAlertInsight(
    symbol: string,
    oldPrice: number,
    newPrice: number,
    hourlyChange: number,
    change24h: number,
    additionalContext?: { fundingRate?: number; volume24h?: number }
  ): Promise<PriceAlertInsight> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      return {
        headline: `${symbol} moved ${hourlyChange > 0 ? 'up' : 'down'} ${Math.abs(hourlyChange).toFixed(1)}%`,
        whyItMoved: 'AI analysis paused',
        whatItMeans: 'AI analysis paused',
        actionAdvice: 'AI analysis paused',
        riskLevel: 'medium'
      };
    }
    
    const cacheKey = `price_alert_${symbol}_${Math.floor(Date.now() / 60000)}`;
    const cached = this.getCached<PriceAlertInsight>(cacheKey);
    if (cached) return cached;

    try {
      const direction = hourlyChange > 0 ? 'up' : 'down';
      const magnitude = Math.abs(hourlyChange).toFixed(1);

      const prompt = `You are a crypto market analyst. Generate a concise, alpha-focused analysis for this price movement:

${symbol}: ${direction} ${magnitude}% in 1 hour
Price: $${oldPrice.toLocaleString()} → $${newPrice.toLocaleString()}
24h Change: ${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}%
${additionalContext?.fundingRate ? `Funding Rate: ${(additionalContext.fundingRate * 100).toFixed(3)}%` : ''}
${additionalContext?.volume24h ? `24h Volume: $${(additionalContext.volume24h / 1e9).toFixed(2)}B` : ''}

Respond in this EXACT JSON format (no markdown):
{
  "headline": "5-7 word punchy headline with specific insight",
  "whyItMoved": "1 sentence - specific catalyst or pattern causing this move",
  "whatItMeans": "1 sentence - what this signals about market structure/sentiment",
  "actionAdvice": "1 sentence - specific actionable advice for traders",
  "riskLevel": "low|medium|high"
}

Be specific, avoid generic statements. Reference actual levels and patterns.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const insight = JSON.parse(cleanContent) as PriceAlertInsight;
      
      this.setCache(cacheKey, insight);
      return insight;
    } catch (error) {
      console.error('❌ Failed to generate price alert insight:', error);
      return {
        headline: `${symbol} ${hourlyChange > 0 ? 'Surges' : 'Drops'} ${Math.abs(hourlyChange).toFixed(1)}%`,
        whyItMoved: 'Significant volume activity detected in the past hour.',
        whatItMeans: `${symbol} showing ${hourlyChange > 0 ? 'bullish' : 'bearish'} momentum.`,
        actionAdvice: `Watch key levels and manage risk accordingly.`,
        riskLevel: Math.abs(hourlyChange) > 5 ? 'high' : 'medium'
      };
    }
  }

  async generateMorningBriefing(
    cryptoData: MarketContext[],
    economicEvents: any[],
    tradingMetrics?: { btcFunding?: number; ethFunding?: number; totalOI?: number }
  ): Promise<MorningBriefingInsight> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      const avgChange = cryptoData.reduce((sum, c) => sum + c.change24h, 0) / cryptoData.length;
      return {
        marketRegime: avgChange > 0 ? 'Risk-on environment' : 'Risk-off conditions',
        topOpportunity: 'AI analysis paused',
        riskWarning: 'AI analysis paused',
        watchList: ['BTC', 'ETH', 'SOL'],
        dayTraderFocus: 'AI analysis paused',
        swingTraderFocus: 'AI analysis paused'
      };
    }
    
    const cacheKey = `morning_briefing_${new Date().toDateString()}`;
    const cached = this.getCached<MorningBriefingInsight>(cacheKey);
    if (cached) return cached;

    try {
      const btc = cryptoData.find(c => c.symbol === 'BTC');
      const eth = cryptoData.find(c => c.symbol === 'ETH');
      const topGainer = cryptoData.reduce((max, c) => c.change24h > (max?.change24h || -Infinity) ? c : max, cryptoData[0]);
      const topLoser = cryptoData.reduce((min, c) => c.change24h < (min?.change24h || Infinity) ? c : min, cryptoData[0]);
      
      const avgChange = cryptoData.reduce((sum, c) => sum + c.change24h, 0) / cryptoData.length;

      const prompt = `You are an elite crypto trading desk analyst. Generate a morning briefing with alpha-focused insights:

MARKET SNAPSHOT:
BTC: $${btc?.price?.toLocaleString() || 'N/A'} (${btc?.change24h?.toFixed(1) || 0}% 24h)
ETH: $${eth?.price?.toLocaleString() || 'N/A'} (${eth?.change24h?.toFixed(1) || 0}% 24h)
Avg Market: ${avgChange.toFixed(1)}%
Top Gainer: ${topGainer?.symbol} +${topGainer?.change24h?.toFixed(1)}%
Top Loser: ${topLoser?.symbol} ${topLoser?.change24h?.toFixed(1)}%

DERIVATIVES:
${tradingMetrics?.btcFunding ? `BTC Funding: ${(tradingMetrics.btcFunding * 100).toFixed(3)}%` : 'BTC Funding: N/A'}
${tradingMetrics?.ethFunding ? `ETH Funding: ${(tradingMetrics.ethFunding * 100).toFixed(3)}%` : 'ETH Funding: N/A'}

TODAY'S EVENTS:
${economicEvents.slice(0, 3).map(e => `- ${e.title}`).join('\n') || 'No major events'}

Respond in this EXACT JSON format (no markdown):
{
  "marketRegime": "10 words max - current market state and likely behavior today",
  "topOpportunity": "Specific trade setup or opportunity to watch today with entry/target if applicable",
  "riskWarning": "Most important risk factor traders should monitor today",
  "watchList": ["Symbol1", "Symbol2", "Symbol3"],
  "dayTraderFocus": "15 words max - key focus for day traders",
  "swingTraderFocus": "15 words max - key focus for swing traders"
}

Be specific with levels and setups. No generic advice.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const insight = JSON.parse(cleanContent) as MorningBriefingInsight;
      
      this.setCache(cacheKey, insight);
      return insight;
    } catch (error) {
      console.error('❌ Failed to generate morning briefing insight:', error);
      const avgChange = cryptoData.reduce((sum, c) => sum + c.change24h, 0) / cryptoData.length;
      return {
        marketRegime: avgChange > 2 ? 'Risk-on environment, momentum favoring longs' : avgChange < -2 ? 'Risk-off, defensive positioning recommended' : 'Choppy conditions, range-trading environment',
        topOpportunity: 'Watch for breakout continuation on high momentum assets',
        riskWarning: 'Volatility expected around scheduled economic events',
        watchList: ['BTC', 'ETH', 'SOL'],
        dayTraderFocus: 'Trade momentum direction, avoid counter-trend',
        swingTraderFocus: 'Build positions on dips, scale into winners'
      };
    }
  }

  async generateEveningRecap(
    cryptoData: MarketContext[],
    tradingMetrics?: { totalLiquidations?: number; dominantSide?: string }
  ): Promise<EveningRecapInsight> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      const avgChange = cryptoData.reduce((sum, c) => sum + c.change24h, 0) / cryptoData.length;
      return {
        dayAnalysis: avgChange > 0 ? 'Bulls maintained control' : 'Bears dominated',
        keyTakeaway: 'AI analysis paused',
        overnightSetup: 'AI analysis paused',
        tomorrowOutlook: 'AI analysis paused',
        positionAdvice: 'AI analysis paused'
      };
    }
    
    const cacheKey = `evening_recap_${new Date().toDateString()}`;
    const cached = this.getCached<EveningRecapInsight>(cacheKey);
    if (cached) return cached;

    try {
      const btc = cryptoData.find(c => c.symbol === 'BTC');
      const eth = cryptoData.find(c => c.symbol === 'ETH');
      const avgChange = cryptoData.reduce((sum, c) => sum + c.change24h, 0) / cryptoData.length;
      const topGainer = cryptoData.reduce((max, c) => c.change24h > (max?.change24h || -Infinity) ? c : max, cryptoData[0]);
      const topLoser = cryptoData.reduce((min, c) => c.change24h < (min?.change24h || Infinity) ? c : min, cryptoData[0]);

      const prompt = `You are an elite crypto trading desk analyst. Generate an evening market recap with actionable overnight insights:

TODAY'S PERFORMANCE:
BTC: $${btc?.price?.toLocaleString() || 'N/A'} (${btc?.change24h?.toFixed(1) || 0}% today)
ETH: $${eth?.price?.toLocaleString() || 'N/A'} (${eth?.change24h?.toFixed(1) || 0}% today)
Market Average: ${avgChange.toFixed(1)}%
Day's Winner: ${topGainer?.symbol} +${topGainer?.change24h?.toFixed(1)}%
Day's Loser: ${topLoser?.symbol} ${topLoser?.change24h?.toFixed(1)}%

TRADING METRICS:
${tradingMetrics?.totalLiquidations ? `Total Liquidations: $${(tradingMetrics.totalLiquidations / 1e6).toFixed(1)}M (${tradingMetrics.dominantSide || 'mixed'})` : 'Liquidations: Normal levels'}

Respond in this EXACT JSON format (no markdown):
{
  "dayAnalysis": "20 words max - what happened today and why, specific catalysts",
  "keyTakeaway": "15 words max - most important lesson from today's action",
  "overnightSetup": "Specific setup to watch during Asian/European session with levels",
  "tomorrowOutlook": "15 words max - what to expect tomorrow based on today",
  "positionAdvice": "Specific advice on position management going into tomorrow"
}

Be specific about levels, not vague. Reference actual price action.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 350,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const insight = JSON.parse(cleanContent) as EveningRecapInsight;
      
      this.setCache(cacheKey, insight);
      return insight;
    } catch (error) {
      console.error('❌ Failed to generate evening recap insight:', error);
      const avgChange = cryptoData.reduce((sum, c) => sum + c.change24h, 0) / cryptoData.length;
      return {
        dayAnalysis: avgChange > 0 ? 'Bulls maintained control with steady accumulation throughout the session' : 'Bears dominated as sellers pressured key support levels',
        keyTakeaway: avgChange > 0 ? 'Dips getting bought aggressively' : 'Rallies getting sold into',
        overnightSetup: 'Watch BTC reaction at current levels during Asian session',
        tomorrowOutlook: avgChange > 0 ? 'Continuation expected if overnight holds' : 'Recovery bounce possible if selling exhausts',
        positionAdvice: 'Size appropriately for overnight volatility, set stops'
      };
    }
  }

  async generateTradingSignalInsight(
    symbol: string,
    signalType: 'funding' | 'liquidation' | 'whale' | 'volume',
    signalData: {
      fundingRate?: number;
      liquidationVolume?: number;
      whaleSize?: number;
      volumeSpike?: number;
      priceChange?: number;
    },
    additionalContext?: { btcCorrelation?: number; marketTrend?: string }
  ): Promise<TradingSignalInsight> {
    const cacheKey = `signal_${symbol}_${signalType}_${Math.floor(Date.now() / 300000)}`;
    const cached = this.getCached<TradingSignalInsight>(cacheKey);
    if (cached) return cached;

    try {
      const signalDescriptions: Record<string, string> = {
        funding: `Funding Rate: ${((signalData.fundingRate || 0) * 100).toFixed(3)}% (${(signalData.fundingRate || 0) > 0 ? 'longs paying' : 'shorts paying'})`,
        liquidation: `Liquidation Volume: $${((signalData.liquidationVolume || 0) / 1e6).toFixed(1)}M in past hour`,
        whale: `Whale Movement: $${((signalData.whaleSize || 0) / 1e6).toFixed(1)}M transaction detected`,
        volume: `Volume Spike: ${signalData.volumeSpike?.toFixed(0)}x average`
      };

      const prompt = `You are an expert crypto derivatives trader. Analyze this trading signal and provide actionable alpha:

SIGNAL:
Asset: ${symbol}
Type: ${signalType.toUpperCase()}
${signalDescriptions[signalType]}
Recent Price: ${signalData.priceChange ? `${signalData.priceChange > 0 ? '+' : ''}${signalData.priceChange.toFixed(1)}%` : 'N/A'}

CONTEXT:
${additionalContext?.btcCorrelation ? `BTC Correlation: ${additionalContext.btcCorrelation.toFixed(2)}` : ''}
${additionalContext?.marketTrend || 'Market trend: Neutral'}

Respond in this EXACT JSON format (no markdown):
{
  "signalStrength": "weak|moderate|strong|extreme",
  "correlatedSignals": ["What other signals to look for that would confirm this"],
  "recommendation": "Specific trading recommendation with entry/exit logic if applicable",
  "timeframe": "Expected timeframe for this signal to play out",
  "riskReward": "Risk/reward assessment for acting on this signal"
}

Focus on actionable advice, avoid generic statements.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const insight = JSON.parse(cleanContent) as TradingSignalInsight;
      
      this.setCache(cacheKey, insight);
      return insight;
    } catch (error) {
      console.error('❌ Failed to generate trading signal insight:', error);
      return {
        signalStrength: 'moderate',
        correlatedSignals: ['Watch for price confirmation', 'Monitor volume'],
        recommendation: 'Wait for additional confirmation before acting',
        timeframe: '1-4 hours',
        riskReward: 'Moderate - size accordingly'
      };
    }
  }

  async generateAlphaSignalFromMultipleSignals(
    marketData: MarketContext[],
    signals: Array<{ type: string; strength: number; asset: string; details: string }>
  ): Promise<AlphaInsight | null> {
    // Only generate alpha signal when multiple strong signals align
    const strongSignals = signals.filter(s => s.strength >= 0.7);
    if (strongSignals.length < 2) return null;

    try {
      const btc = marketData.find(c => c.symbol === 'BTC');
      
      const prompt = `You are an elite quant trader. Multiple signals are aligning - generate a high-conviction alpha call:

ALIGNED SIGNALS:
${strongSignals.map(s => `- ${s.type} on ${s.asset}: ${s.details}`).join('\n')}

MARKET CONTEXT:
BTC: $${btc?.price?.toLocaleString()} (${btc?.change24h?.toFixed(1)}% 24h)
${marketData.slice(0, 5).map(m => `${m.symbol}: ${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(1)}%`).join(', ')}

Respond in this EXACT JSON format (no markdown):
{
  "headline": "Punchy 7 word max headline for this opportunity",
  "analysis": "2 sentences - why these signals together are significant",
  "actionableAdvice": "Specific trade setup with entry, target, stop loss",
  "sentiment": "bullish|bearish|neutral|caution",
  "confidence": 0.0-1.0,
  "keyLevels": {"support": 00000, "resistance": 00000}
}

Be bold but responsible. This is high-conviction alpha.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 350,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content || '';
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const insight = JSON.parse(cleanContent) as AlphaInsight;
      
      return insight;
    } catch (error) {
      console.error('❌ Failed to generate alpha signal:', error);
      return null;
    }
  }

  async generateAlphaSignal(confluenceData: {
    symbol: string;
    direction: 'bullish' | 'bearish';
    signals: string[];
    priceChange: number;
    fundingRate: number;
    liquidations: number;
    volumeSurge: number;
  }): Promise<{ recommendation: string; timeframe: string; riskReward: string }> {
    const cacheKey = `alpha_${confluenceData.symbol}_${confluenceData.direction}_${Math.floor(Date.now() / 300000)}`;
    const cached = this.getCached<{ recommendation: string; timeframe: string; riskReward: string }>(cacheKey);
    if (cached) return cached;

    try {
      const prompt = `You are an elite crypto trading desk. Multiple signals have aligned for a high-conviction trade. Generate alpha:

CONFLUENCE DETECTED:
Asset: ${confluenceData.symbol}
Direction: ${confluenceData.direction.toUpperCase()}
Aligned Signals: ${confluenceData.signals.join(', ')}

SIGNAL DETAILS:
- Price Move: ${confluenceData.priceChange > 0 ? '+' : ''}${confluenceData.priceChange.toFixed(1)}% (24h)
- Funding Rate: ${(confluenceData.fundingRate * 100).toFixed(3)}%
- Liquidations: $${(confluenceData.liquidations / 1e6).toFixed(1)}M
- Volume/MCap: ${(confluenceData.volumeSurge * 100).toFixed(1)}%

Respond in this EXACT JSON format (no markdown):
{
  "recommendation": "Specific, actionable trade recommendation (entry, target, stop) in 25 words max",
  "timeframe": "Expected timeframe for this setup to play out (e.g., '4-8 hours', '1-2 days')",
  "riskReward": "R:R ratio and position sizing advice (e.g., '2:1 R:R, size 2% max')"
}

This is high-conviction alpha from multiple signals aligning. Be specific with levels.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const insight = JSON.parse(cleanContent);
      
      this.setCache(cacheKey, insight);
      return insight;
    } catch (error) {
      console.error('❌ Failed to generate confluence alpha signal:', error);
      return {
        recommendation: confluenceData.direction === 'bullish' 
          ? 'Consider scaling into longs on dips to support' 
          : 'Consider scaling into shorts on rallies to resistance',
        timeframe: '4-12 hours',
        riskReward: '2:1 R:R, size 1-2% max'
      };
    }
  }
}

export const alphaInsightsEngine = new AlphaInsightsEngine();
