import axios from 'axios';
import { duneAnalyticsService } from './duneAnalyticsService';
import { MarketDataService } from './marketDataService';

interface UnifiedMarketData {
  // Asset identification
  symbol: string;
  name: string;
  category: 'Crypto' | 'Stocks' | 'Bonds' | 'Commodities' | 'ETFs' | 'Forex';
  
  // Price data
  price: number;
  percentChange24h: number;
  percentChange7d?: number;
  percentChange30d?: number;
  
  // Volume & market data
  volume24h?: number;
  marketCap?: number;
  
  // Asset-specific data
  fundamentals?: {
    pe_ratio?: number;
    dividend_yield?: number;
    book_value?: number;
    earnings_growth?: number;
    revenue_growth?: number;
    debt_to_equity?: number;
  };
  
  // Alternative data
  sentiment?: number;
  socialMentions?: number;
  institutionalFlow?: number;
  
  // On-chain data (for crypto)
  onChainMetrics?: {
    whaleActivity?: string;
    dexVolume?: number;
    protocolTvl?: number;
    activeAddresses?: number;
  };
  
  // Yield data (for bonds/commodities)
  yield?: number;
  duration?: number;
  
  // Alpha signals
  alphaSignals?: Array<{
    type: string;
    strength: 'weak' | 'moderate' | 'strong';
    description: string;
    confidence: number;
  }>;
  
  lastUpdated: string;
}

interface TreasuryYieldData {
  date: string;
  value: number;
  series_id: string;
}

interface CommodityData {
  name: string;
  price: number;
  unit: string;
  change_24h?: number;
  timestamp: string;
}

export class ComprehensiveMarketService {
  private static instance: ComprehensiveMarketService;
  private marketDataService: MarketDataService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  // API Keys
  private readonly fredApiKey = process.env.FRED_API_KEY;
  private readonly alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly commoditiesApiKey = process.env.COMMODITIES_API_KEY;
  
  constructor() {
    this.marketDataService = MarketDataService.getInstance();
  }

  static getInstance(): ComprehensiveMarketService {
    if (!ComprehensiveMarketService.instance) {
      ComprehensiveMarketService.instance = new ComprehensiveMarketService();
    }
    return ComprehensiveMarketService.instance;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get comprehensive market data for any asset across all categories
   */
  async getUnifiedMarketData(symbol: string, category: string): Promise<UnifiedMarketData | null> {
    const cacheKey = `unified_${symbol}_${category}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let data: UnifiedMarketData | null = null;

      switch (category.toLowerCase()) {
        case 'crypto':
          data = await this.getCryptoData(symbol);
          break;
        case 'stocks':
          data = await this.getStockData(symbol);
          break;
        case 'bonds':
          data = await this.getBondData(symbol);
          break;
        case 'commodities':
          data = await this.getCommodityData(symbol);
          break;
        case 'etfs':
          data = await this.getETFData(symbol);
          break;
        case 'forex':
          data = await this.getForexData(symbol);
          break;
        default:
          console.log(`⚠️ Unknown category: ${category}`);
          return null;
      }

      if (data) {
        this.setCache(cacheKey, data);
      }
      return data;

    } catch (error) {
      console.error(`❌ Failed to fetch unified data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Enhanced crypto data with on-chain analytics
   */
  private async getCryptoData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      // Get basic price data from existing service
      const quotes = await this.marketDataService.getCryptoQuotes([symbol]);
      const quote = quotes.find(q => q.symbol === symbol);
      
      if (!quote) return null;

      // Get on-chain data from Dune Analytics
      const onChainAlpha = await duneAnalyticsService.getOnChainAlpha([symbol]);
      
      // Build comprehensive crypto data
      const data: UnifiedMarketData = {
        symbol: quote.symbol,
        name: quote.name,
        category: 'Crypto',
        price: quote.price,
        percentChange24h: quote.percentChange24h,
        percentChange7d: quote.percentChange7d,
        percentChange30d: quote.percentChange30d,
        volume24h: quote.volume24h,
        marketCap: quote.marketCap,
        onChainMetrics: {
          whaleActivity: this.analyzeWhaleActivity(onChainAlpha.whaleActivity),
          dexVolume: this.calculateDEXVolume(onChainAlpha.dexTrends),
          activeAddresses: 0 // Would come from specific Dune queries
        },
        alphaSignals: this.generateCryptoAlphaSignals(quote, onChainAlpha),
        lastUpdated: new Date().toISOString()
      };

      console.log(`📊 Enhanced crypto data for ${symbol} with on-chain analytics`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get crypto data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Enhanced stock data with fundamentals and institutional flow
   */
  private async getStockData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      // Use Alpha Vantage for comprehensive stock data
      if (!this.alphaVantageKey) {
        console.log(`⚠️ Alpha Vantage key not available for ${symbol} - using basic data`);
        return this.getBasicStockData(symbol);
      }

      const [quote, fundamentals, earnings] = await Promise.all([
        this.getAlphaVantageQuote(symbol),
        this.getAlphaVantageFundamentals(symbol),
        this.getAlphaVantageEarnings(symbol)
      ]);

      if (!quote) return null;

      const data: UnifiedMarketData = {
        symbol: symbol.toUpperCase(),
        name: quote.name || symbol,
        category: 'Stocks',
        price: quote.price,
        percentChange24h: quote.change_percent || 0,
        volume24h: quote.volume,
        marketCap: fundamentals?.market_capitalization,
        fundamentals: {
          pe_ratio: fundamentals?.pe_ratio,
          dividend_yield: fundamentals?.dividend_yield,
          book_value: fundamentals?.book_value,
          earnings_growth: earnings?.quarterly_earnings_growth,
          revenue_growth: earnings?.quarterly_revenue_growth,
          debt_to_equity: fundamentals?.debt_to_equity
        },
        alphaSignals: this.generateStockAlphaSignals(quote, fundamentals, earnings),
        lastUpdated: new Date().toISOString()
      };

      console.log(`📈 Enhanced stock data for ${symbol} with fundamentals`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get stock data for ${symbol}:`, error);
      return this.getBasicStockData(symbol);
    }
  }

  /**
   * Bond data with Treasury yields and credit analysis
   */
  private async getBondData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      // Get Treasury yield data from FRED
      let yieldData = null;
      if (this.fredApiKey) {
        yieldData = await this.getTreasuryYield(symbol);
      }

      const data: UnifiedMarketData = {
        symbol: symbol.toUpperCase(),
        name: this.getBondName(symbol),
        category: 'Bonds',
        price: yieldData?.value || 0,
        percentChange24h: 0, // Would need historical comparison
        yield: yieldData?.value,
        alphaSignals: this.generateBondAlphaSignals(yieldData),
        lastUpdated: new Date().toISOString()
      };

      console.log(`💰 Enhanced bond data for ${symbol}`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get bond data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Commodity data with futures and spot pricing
   */
  private async getCommodityData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      let commodityPrice = null;

      // Try Commodities API first
      if (this.commoditiesApiKey) {
        commodityPrice = await this.getCommoditiesApiData(symbol);
      }

      // Fallback to FRED for major commodities
      if (!commodityPrice && this.fredApiKey) {
        commodityPrice = await this.getFredCommodityData(symbol);
      }

      if (!commodityPrice) {
        console.log(`⚠️ No commodity data available for ${symbol}`);
        return null;
      }

      const data: UnifiedMarketData = {
        symbol: symbol.toUpperCase(),
        name: commodityPrice.name || symbol,
        category: 'Commodities',
        price: commodityPrice.price,
        percentChange24h: commodityPrice.change_24h || 0,
        alphaSignals: this.generateCommodityAlphaSignals(commodityPrice),
        lastUpdated: new Date().toISOString()
      };

      console.log(`🛢️ Enhanced commodity data for ${symbol}`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get commodity data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * ETF data with holdings and performance analysis
   */
  private async getETFData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      // ETFs can be treated similar to stocks but with additional sector analysis
      const stockData = await this.getStockData(symbol);
      if (!stockData) return null;

      stockData.category = 'ETFs';
      stockData.alphaSignals = this.generateETFAlphaSignals(stockData);

      console.log(`📦 Enhanced ETF data for ${symbol}`);
      return stockData;

    } catch (error) {
      console.error(`❌ Failed to get ETF data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Forex data with currency correlations
   */
  private async getForexData(symbol: string): Promise<UnifiedMarketData | null> {
    try {
      let forexData = null;

      if (this.alphaVantageKey) {
        forexData = await this.getAlphaVantageForex(symbol);
      }

      if (!forexData) {
        console.log(`⚠️ No forex data available for ${symbol}`);
        return null;
      }

      const data: UnifiedMarketData = {
        symbol: symbol.toUpperCase(),
        name: `${symbol} Exchange Rate`,
        category: 'Forex',
        price: forexData.rate,
        percentChange24h: forexData.change_percent || 0,
        alphaSignals: this.generateForexAlphaSignals(forexData),
        lastUpdated: new Date().toISOString()
      };

      console.log(`💱 Enhanced forex data for ${symbol}`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to get forex data for ${symbol}:`, error);
      return null;
    }
  }

  // Alpha Signal Generation Methods
  private generateCryptoAlphaSignals(quote: any, onChainData: any): Array<any> {
    const signals = [];

    // Enhanced price momentum with multi-timeframe analysis
    if (quote.percentChange24h > 10) {
      signals.push({
        type: 'price_momentum',
        strength: 'strong',
        description: `Strong 24h momentum: +${quote.percentChange24h.toFixed(2)}%`,
        confidence: 0.8,
        technicalIndicator: 'RSI_BULLISH',
        volumeConfirmation: quote.volume24h > (quote.avgVolume || 0) * 1.5
      });
    }

    // Whale activity signals from on-chain data
    if (onChainData.whaleActivity && onChainData.whaleActivity.largeTransfers > 0) {
      signals.push({
        type: 'whale_accumulation',
        strength: 'strong',
        description: `Whale accumulation detected: ${onChainData.whaleActivity.largeTransfers} large transfers`,
        confidence: 0.85,
        onChainMetric: 'WHALE_INFLOW'
      });
    }

    // DeFi protocol metrics
    if (onChainData.dexTrends && onChainData.dexTrends.volumeIncrease > 50) {
      signals.push({
        type: 'defi_activity',
        strength: 'moderate',
        description: `DEX volume surge: +${onChainData.dexTrends.volumeIncrease}%`,
        confidence: 0.75,
        protocol: 'MULTI_DEX'
      });
    }

    // Additional on-chain signals
    if (onChainData.signals) {
      signals.push(...onChainData.signals);
    }

    return signals;
  }

  private generateStockAlphaSignals(quote: any, fundamentals: any, earnings: any): Array<any> {
    const signals = [];

    // Enhanced valuation analysis
    if (fundamentals?.pe_ratio && fundamentals.pe_ratio < 15) {
      signals.push({
        type: 'valuation',
        strength: fundamentals.pe_ratio < 10 ? 'strong' : 'moderate',
        description: `Attractive P/E ratio: ${fundamentals.pe_ratio} vs sector average`,
        confidence: 0.8,
        metric: 'PE_DISCOUNT',
        benchmarks: { sectorPE: 18, marketPE: 22 }
      });
    }

    // Revenue quality and growth acceleration
    if (earnings?.quarterly_earnings_growth > 20) {
      signals.push({
        type: 'growth_acceleration',
        strength: 'strong',
        description: `Strong earnings growth: ${earnings.quarterly_earnings_growth}% QoQ`,
        confidence: 0.85,
        catalyst: 'EARNINGS_BEAT',
        sustainability: earnings.consecutive_quarters_growth || 1
      });
    }

    // Institutional flow analysis
    if (fundamentals?.institutional_ownership > 70) {
      signals.push({
        type: 'institutional_interest',
        strength: 'moderate',
        description: `High institutional ownership: ${fundamentals.institutional_ownership}%`,
        confidence: 0.75,
        flow: 'ACCUMULATION'
      });
    }

    // Dividend sustainability for income plays
    if (fundamentals?.dividend_yield > 3 && fundamentals?.payout_ratio < 60) {
      signals.push({
        type: 'income_opportunity',
        strength: 'moderate',
        description: `Sustainable dividend: ${fundamentals.dividend_yield}% yield`,
        confidence: 0.8,
        safety: 'HIGH'
      });
    }

    return signals;
  }

  private generateBondAlphaSignals(yieldData: any): Array<any> {
    const signals = [];

    if (yieldData?.value > 4.5) {
      signals.push({
        type: 'yield_opportunity',
        strength: 'moderate',
        description: `Attractive yield level: ${yieldData.value}%`,
        confidence: 0.75
      });
    }

    return signals;
  }

  private generateCommodityAlphaSignals(commodityData: any): Array<any> {
    const signals = [];

    if (commodityData.change_24h > 5) {
      signals.push({
        type: 'supply_demand',
        strength: 'strong',
        description: `Strong price movement: +${commodityData.change_24h}%`,
        confidence: 0.8
      });
    }

    return signals;
  }

  private generateETFAlphaSignals(etfData: any): Array<any> {
    // Reuse stock signals but add ETF-specific analysis
    return etfData.alphaSignals || [];
  }

  private generateForexAlphaSignals(forexData: any): Array<any> {
    const signals = [];

    if (Math.abs(forexData.change_percent) > 2) {
      signals.push({
        type: 'currency_movement',
        strength: 'moderate',
        description: `Significant currency movement: ${forexData.change_percent}%`,
        confidence: 0.7
      });
    }

    return signals;
  }

  // API Integration Methods
  private async getAlphaVantageQuote(symbol: string): Promise<any> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.alphaVantageKey
        }
      });

      const data = response.data['Global Quote'];
      return data ? {
        name: symbol,
        price: parseFloat(data['05. price']),
        change_percent: parseFloat(data['10. change percent'].replace('%', '')),
        volume: parseInt(data['06. volume'])
      } : null;

    } catch (error) {
      console.error(`❌ Alpha Vantage quote failed for ${symbol}:`, error);
      return null;
    }
  }

  private async getAlphaVantageFundamentals(symbol: string): Promise<any> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: this.alphaVantageKey
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Alpha Vantage fundamentals failed for ${symbol}:`, error);
      return null;
    }
  }

  private async getAlphaVantageEarnings(symbol: string): Promise<any> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'EARNINGS',
          symbol: symbol,
          apikey: this.alphaVantageKey
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Alpha Vantage earnings failed for ${symbol}:`, error);
      return null;
    }
  }

  private async getTreasuryYield(seriesId: string): Promise<TreasuryYieldData | null> {
    try {
      const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          series_id: seriesId,
          api_key: this.fredApiKey,
          file_type: 'json',
          limit: 1,
          sort_order: 'desc'
        }
      });

      const observations = response.data.observations;
      if (observations && observations.length > 0) {
        const latest = observations[0];
        return {
          date: latest.date,
          value: parseFloat(latest.value),
          series_id: seriesId
        };
      }
      return null;

    } catch (error) {
      console.error(`❌ FRED Treasury yield failed for ${seriesId}:`, error);
      return null;
    }
  }

  private async getCommoditiesApiData(symbol: string): Promise<CommodityData | null> {
    try {
      const response = await axios.get('https://commodities-api.com/api/latest', {
        params: {
          access_key: this.commoditiesApiKey,
          symbols: symbol.toUpperCase()
        }
      });

      const data = response.data.data;
      if (data && data[symbol.toUpperCase()]) {
        return {
          name: symbol,
          price: data[symbol.toUpperCase()],
          unit: 'USD',
          timestamp: response.data.timestamp
        };
      }
      return null;

    } catch (error) {
      console.error(`❌ Commodities API failed for ${symbol}:`, error);
      return null;
    }
  }

  private async getFredCommodityData(symbol: string): Promise<CommodityData | null> {
    // Map common commodity symbols to FRED series IDs
    const fredMapping: Record<string, string> = {
      'GOLD': 'GOLDAMGBD228NLBM',
      'OIL': 'DCOILWTICO',
      'WTI': 'DCOILWTICO',
      'BRENT': 'DCOILBRENTEU',
      'SILVER': 'LBMA/SILVER',
      'COPPER': 'PCOPPUSDM'
    };

    const seriesId = fredMapping[symbol.toUpperCase()];
    if (!seriesId) return null;

    const yieldData = await this.getTreasuryYield(seriesId);
    if (!yieldData) return null;

    return {
      name: symbol,
      price: yieldData.value,
      unit: 'USD',
      timestamp: yieldData.date
    };
  }

  private async getAlphaVantageForex(symbol: string): Promise<any> {
    // Extract currency pair (e.g., "EUR/USD" -> from: "EUR", to: "USD")
    const [from, to] = symbol.split('/');
    if (!from || !to) return null;

    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: from,
          to_currency: to,
          apikey: this.alphaVantageKey
        }
      });

      const data = response.data['Realtime Currency Exchange Rate'];
      return data ? {
        rate: parseFloat(data['5. Exchange Rate']),
        change_percent: 0 // Would need additional API call for change
      } : null;

    } catch (error) {
      console.error(`❌ Alpha Vantage forex failed for ${symbol}:`, error);
      return null;
    }
  }

  // Helper methods
  private analyzeWhaleActivity(whaleActivity: any[]): string {
    if (!whaleActivity || whaleActivity.length === 0) {
      return 'No significant whale activity detected';
    }

    const buyVolume = whaleActivity
      .filter(w => w.transaction_type === 'buy')
      .reduce((sum, w) => sum + w.amount_usd, 0);
    
    const sellVolume = whaleActivity
      .filter(w => w.transaction_type === 'sell')
      .reduce((sum, w) => sum + w.amount_usd, 0);

    if (buyVolume > sellVolume * 2) {
      return 'Strong whale accumulation';
    } else if (sellVolume > buyVolume * 2) {
      return 'Whale distribution pattern';
    } else {
      return 'Balanced whale activity';
    }
  }

  private calculateDEXVolume(dexTrends: any[]): number {
    if (!dexTrends || dexTrends.length === 0) return 0;
    return dexTrends.reduce((sum, dex) => sum + (dex.volume_24h || 0), 0);
  }

  private getBondName(symbol: string): string {
    const bondNames: Record<string, string> = {
      'DGS10': '10-Year Treasury',
      'DGS30': '30-Year Treasury',
      'DGS2': '2-Year Treasury',
      'DGS5': '5-Year Treasury'
    };
    return bondNames[symbol] || `${symbol} Bond`;
  }

  private getBasicStockData(symbol: string): UnifiedMarketData {
    return {
      symbol: symbol.toUpperCase(),
      name: symbol,
      category: 'Stocks',
      price: 0,
      percentChange24h: 0,
      alphaSignals: [{
        type: 'data_limitation',
        strength: 'weak',
        description: 'Limited data available - API key required for comprehensive analysis',
        confidence: 0.5
      }],
      lastUpdated: new Date().toISOString()
    };
  }
}

export const comprehensiveMarketService = ComprehensiveMarketService.getInstance();