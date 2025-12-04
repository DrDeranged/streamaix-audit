import { marketDataService, CryptoQuote } from './marketDataService';

interface ValidationResult {
  isValid: boolean;
  validatedData: any;
  errors: string[];
  warnings: string[];
  dataFreshness: 'fresh' | 'stale' | 'expired';
  priceData?: Map<string, CryptoQuote>;
  timestamp: number;
}

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  requiredAssets?: string[];
  avatarId?: string;
  avatarName?: string;
}

interface MarketContextData {
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
  totalMarketCap?: number;
  btcDominance?: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  timestamp: number;
  isStale: boolean;
}

const TRACKED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK', 'ATOM', 'UNI', 'LTC', 'BCH', 'ALGO', 'PEPE', 'SHIB', 'ARB', 'OP', 'FET', 'RNDR', 'TAO', 'WLD'];
const MAX_DATA_AGE_MS = 5 * 60 * 1000; // 5 minutes max staleness
const WARNING_DATA_AGE_MS = 2 * 60 * 1000; // 2 minute warning threshold

class NotificationDataValidator {
  private lastMarketContext: MarketContextData | null = null;
  private lastMarketContextFetch: number = 0;
  private priceCache: Map<string, { price: number; change24h: number; timestamp: number }> = new Map();
  private validationStats = {
    totalValidations: 0,
    passed: 0,
    failed: 0,
    staleData: 0,
  };

  async getMarketContext(): Promise<MarketContextData> {
    const now = Date.now();
    
    if (this.lastMarketContext && (now - this.lastMarketContextFetch) < 30000) {
      return {
        ...this.lastMarketContext,
        isStale: (now - this.lastMarketContextFetch) > WARNING_DATA_AGE_MS
      };
    }

    try {
      const quotes = await marketDataService.getCryptoQuotes(['BTC', 'ETH']);
      const btc = quotes.find(q => q.symbol === 'BTC');
      const eth = quotes.find(q => q.symbol === 'ETH');

      if (!btc || !eth) {
        console.warn('⚠️ [Validator] Could not fetch BTC/ETH prices');
        if (this.lastMarketContext) {
          return { ...this.lastMarketContext, isStale: true };
        }
        throw new Error('No market data available');
      }

      const avgChange = (btc.percentChange24h + eth.percentChange24h) / 2;
      const marketTrend = avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'neutral';

      this.lastMarketContext = {
        btcPrice: btc.price,
        btcChange24h: btc.percentChange24h,
        ethPrice: eth.price,
        ethChange24h: eth.percentChange24h,
        totalMarketCap: btc.marketCap + eth.marketCap,
        marketTrend,
        timestamp: now,
        isStale: false
      };
      this.lastMarketContextFetch = now;

      this.priceCache.set('BTC', { price: btc.price, change24h: btc.percentChange24h, timestamp: now });
      this.priceCache.set('ETH', { price: eth.price, change24h: eth.percentChange24h, timestamp: now });

      return this.lastMarketContext;
    } catch (error) {
      console.error('❌ [Validator] Market context fetch failed:', error);
      if (this.lastMarketContext) {
        return { ...this.lastMarketContext, isStale: true };
      }
      throw error;
    }
  }

  async validatePriceData(symbols: string[]): Promise<{ prices: Map<string, CryptoQuote>; isFresh: boolean; errors: string[] }> {
    const prices = new Map<string, CryptoQuote>();
    const errors: string[] = [];
    const now = Date.now();

    try {
      const quotes = await marketDataService.getCryptoQuotes(symbols);
      
      for (const quote of quotes) {
        const lastUpdated = new Date(quote.lastUpdated).getTime();
        const age = now - lastUpdated;
        
        if (age > MAX_DATA_AGE_MS) {
          errors.push(`${quote.symbol} data is ${Math.round(age / 60000)} min old (max: 5 min)`);
        }
        
        prices.set(quote.symbol, quote);
        this.priceCache.set(quote.symbol, { 
          price: quote.price, 
          change24h: quote.percentChange24h, 
          timestamp: now 
        });
      }

      const missing = symbols.filter(s => !prices.has(s));
      if (missing.length > 0) {
        errors.push(`Missing price data for: ${missing.join(', ')}`);
      }

      return {
        prices,
        isFresh: errors.length === 0,
        errors
      };
    } catch (error: any) {
      errors.push(`Price fetch failed: ${error.message}`);
      return { prices, isFresh: false, errors };
    }
  }

  async validateNotification(payload: NotificationPayload): Promise<ValidationResult> {
    this.validationStats.totalValidations++;
    const errors: string[] = [];
    const warnings: string[] = [];
    const now = Date.now();
    let dataFreshness: 'fresh' | 'stale' | 'expired' = 'fresh';
    let priceData = new Map<string, CryptoQuote>();

    try {
      const marketContext = await this.getMarketContext();
      
      if (marketContext.isStale) {
        warnings.push('Market context data is slightly stale (>2 min)');
        dataFreshness = 'stale';
      }

      if ((now - marketContext.timestamp) > MAX_DATA_AGE_MS) {
        errors.push('Market data expired (>5 min old) - notification blocked');
        dataFreshness = 'expired';
        this.validationStats.failed++;
        this.validationStats.staleData++;
        return {
          isValid: false,
          validatedData: payload,
          errors,
          warnings,
          dataFreshness,
          timestamp: now
        };
      }

      if (payload.requiredAssets && payload.requiredAssets.length > 0) {
        const priceResult = await this.validatePriceData(payload.requiredAssets);
        priceData = priceResult.prices;
        
        if (!priceResult.isFresh) {
          errors.push(...priceResult.errors);
          dataFreshness = 'expired';
        }
      }

      const validatedPayload = await this.enrichPayloadWithLiveData(payload, marketContext, priceData);

      const isValid = errors.length === 0 && dataFreshness !== 'expired';
      
      if (isValid) {
        this.validationStats.passed++;
      } else {
        this.validationStats.failed++;
      }

      console.log(`✅ [Validator] ${payload.type}: ${isValid ? 'PASSED' : 'BLOCKED'} (freshness: ${dataFreshness}, errors: ${errors.length})`);

      return {
        isValid,
        validatedData: validatedPayload,
        errors,
        warnings,
        dataFreshness,
        priceData,
        timestamp: now
      };
    } catch (error: any) {
      errors.push(`Validation error: ${error.message}`);
      this.validationStats.failed++;
      
      return {
        isValid: false,
        validatedData: payload,
        errors,
        warnings,
        dataFreshness: 'expired',
        timestamp: now
      };
    }
  }

  private async enrichPayloadWithLiveData(
    payload: NotificationPayload, 
    marketContext: MarketContextData,
    priceData: Map<string, CryptoQuote>
  ): Promise<NotificationPayload> {
    const enrichedPayload = { ...payload };
    
    enrichedPayload.data = {
      ...enrichedPayload.data,
      _validation: {
        timestamp: Date.now(),
        btcPrice: marketContext.btcPrice,
        ethPrice: marketContext.ethPrice,
        marketTrend: marketContext.marketTrend,
        dataSource: 'coingecko_pro',
        validatedAt: new Date().toISOString()
      }
    };

    if (payload.requiredAssets && priceData.size > 0) {
      const assetPrices: Record<string, { price: number; change24h: number }> = {};
      priceData.forEach((quote, symbol) => {
        assetPrices[symbol] = {
          price: quote.price,
          change24h: quote.percentChange24h
        };
      });
      enrichedPayload.data._assetPrices = assetPrices;
    }

    return enrichedPayload;
  }

  async validateAndEnrichTradeIdea(idea: {
    asset: string;
    entry: number;
    target: number;
    stopLoss: number;
    direction: 'long' | 'short';
    reasoning: string;
  }): Promise<{
    isValid: boolean;
    enrichedIdea: any;
    livePrice: number | null;
    priceDeviation: number | null;
    errors: string[];
  }> {
    const errors: string[] = [];
    let livePrice: number | null = null;
    let priceDeviation: number | null = null;

    try {
      const priceResult = await this.validatePriceData([idea.asset]);
      const quote = priceResult.prices.get(idea.asset);

      if (quote) {
        livePrice = quote.price;
        priceDeviation = ((livePrice - idea.entry) / idea.entry) * 100;

        if (Math.abs(priceDeviation) > 5) {
          errors.push(`Entry price ${idea.entry} deviates ${priceDeviation.toFixed(1)}% from live price ${livePrice}`);
        }

        if (idea.direction === 'long' && livePrice > idea.target) {
          errors.push(`Target ${idea.target} already exceeded by live price ${livePrice}`);
        }
        if (idea.direction === 'short' && livePrice < idea.target) {
          errors.push(`Target ${idea.target} already exceeded by live price ${livePrice}`);
        }
      } else {
        errors.push(`Could not validate live price for ${idea.asset}`);
      }

      const enrichedIdea = {
        ...idea,
        livePrice,
        priceDeviation,
        validatedAt: new Date().toISOString(),
        priceSource: 'coingecko_pro'
      };

      return {
        isValid: errors.length === 0,
        enrichedIdea,
        livePrice,
        priceDeviation,
        errors
      };
    } catch (error: any) {
      errors.push(`Validation failed: ${error.message}`);
      return {
        isValid: false,
        enrichedIdea: idea,
        livePrice: null,
        priceDeviation: null,
        errors
      };
    }
  }

  async validateAvatarContent(avatarId: string, avatarName: string, content: string): Promise<{
    isValid: boolean;
    enrichedContent: string;
    marketContext: MarketContextData | null;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      const marketContext = await this.getMarketContext();
      
      const btcFormatted = `$${marketContext.btcPrice.toLocaleString()}`;
      const ethFormatted = `$${marketContext.ethPrice.toLocaleString()}`;
      const btcTrend = marketContext.btcChange24h >= 0 ? 'up' : 'down';
      const ethTrend = marketContext.ethChange24h >= 0 ? 'up' : 'down';
      
      const mentionedSymbols = this.extractMentionedSymbols(content);
      let enrichedContent = content;
      
      if (mentionedSymbols.length > 0) {
        const priceResult = await this.validatePriceData(mentionedSymbols);
        
        priceResult.prices.forEach((quote, symbol) => {
          const priceInfo = `[${symbol}: $${quote.price.toLocaleString()} ${quote.percentChange24h >= 0 ? '↑' : '↓'}${Math.abs(quote.percentChange24h).toFixed(1)}%]`;
        });
      }

      const contextFooter = `\n\n📊 Live: BTC ${btcFormatted} (${btcTrend} ${Math.abs(marketContext.btcChange24h).toFixed(1)}%) | ETH ${ethFormatted} (${ethTrend} ${Math.abs(marketContext.ethChange24h).toFixed(1)}%)`;
      
      return {
        isValid: true,
        enrichedContent: content,
        marketContext,
        errors
      };
    } catch (error: any) {
      errors.push(`Avatar content validation failed: ${error.message}`);
      return {
        isValid: false,
        enrichedContent: content,
        marketContext: null,
        errors
      };
    }
  }

  private extractMentionedSymbols(content: string): string[] {
    const symbolPatterns = TRACKED_SYMBOLS.map(s => new RegExp(`\\b${s}\\b`, 'gi'));
    const mentioned: string[] = [];
    
    for (const symbol of TRACKED_SYMBOLS) {
      if (new RegExp(`\\b${symbol}\\b`, 'i').test(content)) {
        mentioned.push(symbol);
      }
    }
    
    return mentioned;
  }

  async validateVCWalletAlert(activity: {
    fund: string;
    action: 'buy' | 'sell' | 'transfer';
    token: string;
    amount: number;
    valueUsd: number;
  }): Promise<{
    isValid: boolean;
    enrichedActivity: any;
    currentPrice: number | null;
    priceChange24h: number | null;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      const priceResult = await this.validatePriceData([activity.token]);
      const quote = priceResult.prices.get(activity.token);
      
      if (quote) {
        const calculatedValue = activity.amount * quote.price;
        const deviation = Math.abs(calculatedValue - activity.valueUsd) / activity.valueUsd * 100;
        
        if (deviation > 10) {
          errors.push(`Reported value $${activity.valueUsd.toLocaleString()} deviates ${deviation.toFixed(1)}% from calculated $${calculatedValue.toLocaleString()}`);
        }
        
        return {
          isValid: errors.length === 0,
          enrichedActivity: {
            ...activity,
            currentPrice: quote.price,
            priceChange24h: quote.percentChange24h,
            validatedValueUsd: calculatedValue,
            validatedAt: new Date().toISOString()
          },
          currentPrice: quote.price,
          priceChange24h: quote.percentChange24h,
          errors
        };
      }
      
      return {
        isValid: true,
        enrichedActivity: activity,
        currentPrice: null,
        priceChange24h: null,
        errors
      };
    } catch (error: any) {
      errors.push(`VC wallet validation failed: ${error.message}`);
      return {
        isValid: false,
        enrichedActivity: activity,
        currentPrice: null,
        priceChange24h: null,
        errors
      };
    }
  }

  async validateCTAlphaSignal(signal: {
    influencer: string;
    token?: string;
    signal: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  }): Promise<{
    isValid: boolean;
    enrichedSignal: any;
    tokenPrice: number | null;
    marketAlignment: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let tokenPrice: number | null = null;
    let marketAlignment = true;
    
    try {
      const marketContext = await this.getMarketContext();
      
      if (signal.token) {
        const priceResult = await this.validatePriceData([signal.token]);
        const quote = priceResult.prices.get(signal.token);
        
        if (quote) {
          tokenPrice = quote.price;
          
          if (signal.sentiment === 'bullish' && quote.percentChange24h < -5) {
            marketAlignment = false;
            errors.push(`Bullish signal on ${signal.token} but price down ${quote.percentChange24h.toFixed(1)}% in 24h`);
          }
          if (signal.sentiment === 'bearish' && quote.percentChange24h > 5) {
            marketAlignment = false;
            errors.push(`Bearish signal on ${signal.token} but price up ${quote.percentChange24h.toFixed(1)}% in 24h`);
          }
        }
      }

      if (signal.sentiment === 'bullish' && marketContext.marketTrend === 'bearish') {
        errors.push(`Bullish signal against bearish market trend`);
      }
      if (signal.sentiment === 'bearish' && marketContext.marketTrend === 'bullish') {
        errors.push(`Bearish signal against bullish market trend`);
      }
      
      return {
        isValid: true,
        enrichedSignal: {
          ...signal,
          tokenPrice,
          marketTrend: marketContext.marketTrend,
          btcPrice: marketContext.btcPrice,
          marketAlignment,
          validatedAt: new Date().toISOString()
        },
        tokenPrice,
        marketAlignment,
        errors
      };
    } catch (error: any) {
      errors.push(`CT Alpha validation failed: ${error.message}`);
      return {
        isValid: false,
        enrichedSignal: signal,
        tokenPrice: null,
        marketAlignment: false,
        errors
      };
    }
  }

  async getRealTimeMarketContext(): Promise<{
    btcPrice: number;
    btcChange24h: number;
    btcTrend: string;
    ethPrice: number;
    ethChange24h: number;
    ethTrend: string;
    marketPhase: string;
    marketSentiment: string;
    timestamp: number;
  }> {
    const context = await this.getMarketContext();
    const now = new Date();
    const hour = now.getUTCHours();
    
    const marketPhase = (hour >= 13 && hour < 20) ? 'US trading hours' :
                        (hour >= 0 && hour < 8) ? 'Asian session' :
                        (hour >= 8 && hour < 13) ? 'European session' : 'off-hours';
    
    return {
      btcPrice: context.btcPrice,
      btcChange24h: context.btcChange24h,
      btcTrend: context.btcChange24h >= 0 ? 'bullish momentum' : 'bearish pressure',
      ethPrice: context.ethPrice,
      ethChange24h: context.ethChange24h,
      ethTrend: context.ethChange24h >= 0 ? 'showing strength' : 'underperforming',
      marketPhase,
      marketSentiment: context.marketTrend,
      timestamp: Date.now()
    };
  }

  getValidationStats(): typeof this.validationStats {
    return { ...this.validationStats };
  }

  resetStats(): void {
    this.validationStats = {
      totalValidations: 0,
      passed: 0,
      failed: 0,
      staleData: 0,
    };
  }
}

export const notificationDataValidator = new NotificationDataValidator();
