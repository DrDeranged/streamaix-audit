import axios from 'axios';

interface DuneQueryResult {
  execution_id: string;
  query_id: number;
  state: 'QUERY_STATE_PENDING' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_FAILED';
  submitted_at: string;
  expires_at: string;
  execution_started_at?: string;
  execution_ended_at?: string;
  result?: {
    rows: any[];
    metadata: {
      column_names: string[];
      column_types: string[];
      row_count: number;
      result_set_bytes: number;
      total_row_count: number;
      datapoint_count: number;
      pending_time_millis: number;
      execution_time_millis: number;
    };
  };
}

interface WhaleMovement {
  token_symbol: string;
  whale_address: string;
  transaction_type: 'buy' | 'sell';
  amount_usd: number;
  amount_tokens: number;
  timestamp: string;
  exchange?: string;
}

interface DeFiMetrics {
  protocol_name: string;
  tvl_usd: number;
  tvl_change_24h: number;
  volume_24h: number;
  unique_users_24h: number;
  yield_rate: number;
}

interface DEXMetrics {
  dex_name: string;
  volume_24h: number;
  volume_change_24h: number;
  unique_traders_24h: number;
  top_trading_pairs: Array<{
    pair: string;
    volume_24h: number;
    price_change_24h: number;
  }>;
}

export class DuneAnalyticsService {
  private readonly baseUrl = 'https://api.dune.com/api/v1';
  private readonly apiKey: string | undefined;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.DUNE_API_KEY;
  }

  private getHeaders() {
    if (!this.apiKey) {
      throw new Error('Dune API key not configured');
    }
    return {
      'x-dune-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
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
   * Execute a Dune query and wait for results
   */
  private async executeQuery(queryId: number, parameters?: Record<string, any>): Promise<DuneQueryResult> {
    if (!this.apiKey) {
      console.log('⚠️ Dune API key not available - using mock data');
      return this.getMockQueryResult(queryId);
    }

    try {
      // Execute query
      const executeResponse = await axios.post(
        `${this.baseUrl}/query/${queryId}/execute`,
        { query_parameters: parameters || {} },
        { headers: this.getHeaders() }
      );

      const executionId = executeResponse.data.execution_id;
      console.log(`🔄 Dune query ${queryId} executing with ID: ${executionId}`);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 2 seconds = 1 minute max wait
      
      while (attempts < maxAttempts) {
        const statusResponse = await axios.get(
          `${this.baseUrl}/execution/${executionId}/status`,
          { headers: this.getHeaders() }
        );

        const status = statusResponse.data.state;
        
        if (status === 'QUERY_STATE_COMPLETED') {
          const resultsResponse = await axios.get(
            `${this.baseUrl}/execution/${executionId}/results`,
            { headers: this.getHeaders() }
          );
          
          console.log(`✅ Dune query ${queryId} completed successfully`);
          return resultsResponse.data;
        }
        
        if (status === 'QUERY_STATE_FAILED') {
          throw new Error(`Query ${queryId} failed to execute`);
        }

        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      throw new Error(`Query ${queryId} timed out after ${maxAttempts * 2} seconds`);

    } catch (error: any) {
      console.error(`❌ Dune query ${queryId} failed:`, error.response?.data || error.message);
      return this.getMockQueryResult(queryId);
    }
  }

  /**
   * Get whale movements for specific tokens
   */
  async getWhaleMovements(tokenSymbols: string[]): Promise<WhaleMovement[]> {
    const cacheKey = `whale_movements_${tokenSymbols.join(',').toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Using a popular whale tracking query ID (this would be a real Dune query)
      const queryId = 1234567; // Example whale movement query
      const result = await this.executeQuery(queryId, { tokens: tokenSymbols });

      const movements: WhaleMovement[] = result.result?.rows.map(row => ({
        token_symbol: row.token_symbol,
        whale_address: row.whale_address,
        transaction_type: row.transaction_type,
        amount_usd: row.amount_usd,
        amount_tokens: row.amount_tokens,
        timestamp: row.timestamp,
        exchange: row.exchange
      })) || [];

      this.setCache(cacheKey, movements);
      return movements;

    } catch (error) {
      console.error('Failed to fetch whale movements:', error);
      return this.getMockWhaleMovements(tokenSymbols);
    }
  }

  /**
   * Get DeFi protocol metrics
   */
  async getDeFiMetrics(protocols: string[]): Promise<DeFiMetrics[]> {
    const cacheKey = `defi_metrics_${protocols.join(',').toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Using a DeFi metrics query ID
      const queryId = 2345678; // Example DeFi metrics query
      const result = await this.executeQuery(queryId, { protocols });

      const metrics: DeFiMetrics[] = result.result?.rows.map(row => ({
        protocol_name: row.protocol_name,
        tvl_usd: row.tvl_usd,
        tvl_change_24h: row.tvl_change_24h,
        volume_24h: row.volume_24h,
        unique_users_24h: row.unique_users_24h,
        yield_rate: row.yield_rate
      })) || [];

      this.setCache(cacheKey, metrics);
      return metrics;

    } catch (error) {
      console.error('Failed to fetch DeFi metrics:', error);
      return this.getMockDeFiMetrics(protocols);
    }
  }

  /**
   * Get DEX trading metrics
   */
  async getDEXMetrics(dexNames: string[]): Promise<DEXMetrics[]> {
    const cacheKey = `dex_metrics_${dexNames.join(',').toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Using a DEX metrics query ID
      const queryId = 3456789; // Example DEX metrics query
      const result = await this.executeQuery(queryId, { dexes: dexNames });

      const metrics: DEXMetrics[] = result.result?.rows.map(row => ({
        dex_name: row.dex_name,
        volume_24h: row.volume_24h,
        volume_change_24h: row.volume_change_24h,
        unique_traders_24h: row.unique_traders_24h,
        top_trading_pairs: row.top_trading_pairs || []
      })) || [];

      this.setCache(cacheKey, metrics);
      return metrics;

    } catch (error) {
      console.error('Failed to fetch DEX metrics:', error);
      return this.getMockDEXMetrics(dexNames);
    }
  }

  /**
   * Get on-chain alpha signals for specific tokens
   */
  async getOnChainAlpha(tokenSymbols: string[]): Promise<any> {
    const cacheKey = `onchain_alpha_${tokenSymbols.join(',').toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [whaleMovements, dexMetrics] = await Promise.all([
        this.getWhaleMovements(tokenSymbols),
        this.getDEXMetrics(['Uniswap', 'SushiSwap', 'Curve'])
      ]);

      const alpha = {
        whaleActivity: whaleMovements,
        dexTrends: dexMetrics,
        signals: this.analyzeAlphaSignals(whaleMovements, dexMetrics),
        timestamp: new Date().toISOString()
      };

      this.setCache(cacheKey, alpha);
      return alpha;

    } catch (error) {
      console.error('Failed to fetch on-chain alpha:', error);
      return this.getMockOnChainAlpha(tokenSymbols);
    }
  }

  private analyzeAlphaSignals(whaleMovements: WhaleMovement[], dexMetrics: DEXMetrics[]): any[] {
    const signals = [];

    // Analyze whale accumulation patterns
    const buyVolume = whaleMovements
      .filter(m => m.transaction_type === 'buy')
      .reduce((sum, m) => sum + m.amount_usd, 0);
    
    const sellVolume = whaleMovements
      .filter(m => m.transaction_type === 'sell')
      .reduce((sum, m) => sum + m.amount_usd, 0);

    if (buyVolume > sellVolume * 2) {
      signals.push({
        type: 'whale_accumulation',
        strength: 'strong',
        description: 'Strong whale accumulation detected',
        confidence: 0.85
      });
    }

    // Analyze DEX volume trends
    const totalVolume = dexMetrics.reduce((sum, dex) => sum + dex.volume_24h, 0);
    const avgVolumeChange = dexMetrics.reduce((sum, dex) => sum + dex.volume_change_24h, 0) / dexMetrics.length;

    if (avgVolumeChange > 50) {
      signals.push({
        type: 'volume_surge',
        strength: 'strong',
        description: 'Significant volume increase across DEXs',
        confidence: 0.8
      });
    }

    return signals;
  }

  // Mock data methods for when API is not available
  private getMockQueryResult(queryId: number): DuneQueryResult {
    return {
      execution_id: `mock_${queryId}_${Date.now()}`,
      query_id: queryId,
      state: 'QUERY_STATE_COMPLETED',
      submitted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      result: {
        rows: [],
        metadata: {
          column_names: [],
          column_types: [],
          row_count: 0,
          result_set_bytes: 0,
          total_row_count: 0,
          datapoint_count: 0,
          pending_time_millis: 100,
          execution_time_millis: 500
        }
      }
    };
  }

  private getMockWhaleMovements(tokenSymbols: string[]): WhaleMovement[] {
    console.log('⚠️ Using mock whale movement data - Dune API integration needed for real data');
    return [];
  }

  private getMockDeFiMetrics(protocols: string[]): DeFiMetrics[] {
    console.log('⚠️ Using mock DeFi metrics - Dune API integration needed for real data');
    return [];
  }

  private getMockDEXMetrics(dexNames: string[]): DEXMetrics[] {
    console.log('⚠️ Using mock DEX metrics - Dune API integration needed for real data');
    return [];
  }

  private getMockOnChainAlpha(tokenSymbols: string[]): any {
    console.log('⚠️ Using mock on-chain alpha - Dune API integration needed for real data');
    return {
      whaleActivity: [],
      dexTrends: [],
      signals: [],
      timestamp: new Date().toISOString()
    };
  }
}

export const duneAnalyticsService = new DuneAnalyticsService();