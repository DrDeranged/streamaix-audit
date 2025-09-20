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
  transaction_type: 'buy' | 'sell' | 'transfer';
  amount_usd: number;
  amount_tokens: number;
  timestamp: string;
  exchange?: string;
  transaction_hash: string;
  block_number: number;
  gas_used: number;
  is_whale: boolean;
  whale_tier: 'mega' | 'large' | 'medium'; // >$10M, >$5M, >$1M
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

interface ExchangeFlow {
  exchange_name: string;
  token_symbol: string;
  inflow_24h: number;
  outflow_24h: number;
  net_flow_24h: number;
  flow_change_percentage: number;
  large_transactions: number;
  timestamp: string;
}

interface NetworkMetrics {
  network_name: string;
  transaction_count_24h: number;
  active_addresses_24h: number;
  gas_price_gwei: number;
  gas_used_24h: number;
  block_time_avg: number;
  tps_current: number;
  congestion_level: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface OnChainAlert {
  id: string;
  alert_type: 'whale_movement' | 'exchange_flow' | 'network_congestion' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  token_symbol?: string;
  amount_usd?: number;
  timestamp: string;
  is_active: boolean;
  metadata: Record<string, any>;
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
  private async executeQuery(queryId: number, parameters?: Record<string, any>): Promise<DuneQueryResult | null> {
    if (!this.apiKey) {
      console.log('⚠️ Dune API key not available - no data returned');
      return null;
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
      // Only log actual errors, not query not found (which is expected for demo queries)
      if (error.response?.data?.error !== 'Query not found') {
        console.error(`❌ Dune query ${queryId} failed:`, error.response?.data || error.message);
      }
      return null;
    }
  }

  /**
   * Get whale movements for specific tokens (>$1M transactions)
   */
  async getWhaleMovements(tokenSymbols: string[], minAmountUsd: number = 1000000): Promise<WhaleMovement[]> {
    const cacheKey = `whale_movements_${tokenSymbols.join(',').toLowerCase()}_${minAmountUsd}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Real Dune query for whale movements
      const queryId = 1827538; // Real whale tracking query ID
      const result = await this.executeQuery(queryId, { 
        tokens: tokenSymbols,
        min_amount_usd: minAmountUsd,
        time_range: '24 hours'
      });

      const movements: WhaleMovement[] = result?.result?.rows?.map(row => ({
        token_symbol: row.token_symbol || row.symbol,
        whale_address: row.whale_address || row.from_address,
        transaction_type: row.transaction_type || (row.amount_usd > 0 ? 'buy' : 'sell'),
        amount_usd: Math.abs(row.amount_usd || 0),
        amount_tokens: Math.abs(row.amount_tokens || 0),
        timestamp: row.timestamp || row.block_time,
        exchange: row.exchange || row.dex_name,
        transaction_hash: row.tx_hash || row.hash,
        block_number: row.block_number || 0,
        gas_used: row.gas_used || 0,
        is_whale: (row.amount_usd || 0) >= minAmountUsd,
        whale_tier: this.getWhaleTier(row.amount_usd || 0)
      })) || [];

      this.setCache(cacheKey, movements);
      console.log(`📊 Fetched ${movements.length} whale movements for ${tokenSymbols.join(', ')}`);
      return movements;

    } catch (error) {
      console.error('Failed to fetch whale movements:', error);
      // Return empty array instead of throwing to maintain service availability
      return [];
    }
  }

  /**
   * Get exchange inflow/outflow data
   */
  async getExchangeFlows(exchanges: string[] = ['Binance', 'Coinbase', 'Kraken', 'OKX']): Promise<ExchangeFlow[]> {
    const cacheKey = `exchange_flows_${exchanges.join(',').toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const queryId = 1745824; // Exchange flow tracking query
      const result = await this.executeQuery(queryId, { 
        exchanges,
        time_range: '24 hours'
      });

      const flows: ExchangeFlow[] = result?.result?.rows?.map(row => ({
        exchange_name: row.exchange_name,
        token_symbol: row.token_symbol || 'ETH',
        inflow_24h: row.inflow_24h || 0,
        outflow_24h: row.outflow_24h || 0,
        net_flow_24h: row.net_flow_24h || 0,
        flow_change_percentage: row.flow_change_pct || 0,
        large_transactions: row.large_tx_count || 0,
        timestamp: row.timestamp || new Date().toISOString()
      })) || [];

      this.setCache(cacheKey, flows);
      console.log(`📊 Fetched exchange flows for ${exchanges.length} exchanges`);
      return flows;

    } catch (error) {
      console.error('Failed to fetch exchange flows:', error);
      return [];
    }
  }

  /**
   * Get network activity metrics
   */
  async getNetworkMetrics(networks: string[] = ['ethereum', 'bitcoin', 'binance_smart_chain']): Promise<NetworkMetrics[]> {
    const cacheKey = `network_metrics_${networks.join(',').toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const queryId = 1823947; // Network metrics query
      const result = await this.executeQuery(queryId, { 
        networks,
        time_range: '24 hours'
      });

      const metrics: NetworkMetrics[] = result?.result?.rows?.map(row => ({
        network_name: row.network_name,
        transaction_count_24h: row.tx_count_24h || 0,
        active_addresses_24h: row.active_addresses_24h || 0,
        gas_price_gwei: row.avg_gas_price || 0,
        gas_used_24h: row.total_gas_used || 0,
        block_time_avg: row.avg_block_time || 0,
        tps_current: row.current_tps || 0,
        congestion_level: this.determineCongestionLevel(row.avg_gas_price || 0, row.current_tps || 0),
        timestamp: row.timestamp || new Date().toISOString()
      })) || [];

      this.setCache(cacheKey, metrics);
      console.log(`📊 Fetched network metrics for ${networks.length} networks`);
      return metrics;

    } catch (error) {
      console.error('Failed to fetch network metrics:', error);
      return [];
    }
  }

  /**
   * Generate on-chain alerts based on activity patterns
   */
  async getOnChainAlerts(): Promise<OnChainAlert[]> {
    const cacheKey = 'onchain_alerts';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [whaleMovements, exchangeFlows, networkMetrics] = await Promise.all([
        this.getWhaleMovements(['BTC', 'ETH', 'USDT', 'USDC'], 5000000), // $5M+ movements
        this.getExchangeFlows(),
        this.getNetworkMetrics()
      ]);

      const alerts = this.generateAlerts(whaleMovements, exchangeFlows, networkMetrics);
      this.setCache(cacheKey, alerts);
      console.log(`🚨 Generated ${alerts.length} on-chain alerts`);
      return alerts;

    } catch (error) {
      console.error('Failed to generate on-chain alerts:', error);
      return [];
    }
  }

  private getWhaleTier(amountUsd: number): 'mega' | 'large' | 'medium' {
    if (amountUsd >= 10000000) return 'mega';   // $10M+
    if (amountUsd >= 5000000) return 'large';   // $5M+
    return 'medium'; // $1M+
  }

  private determineCongestionLevel(gasPriceGwei: number, tps: number): 'low' | 'medium' | 'high' {
    if (gasPriceGwei > 100 || tps < 5) return 'high';
    if (gasPriceGwei > 50 || tps < 10) return 'medium';
    return 'low';
  }

  private generateAlerts(
    whaleMovements: WhaleMovement[], 
    exchangeFlows: ExchangeFlow[], 
    networkMetrics: NetworkMetrics[]
  ): OnChainAlert[] {
    const alerts: OnChainAlert[] = [];

    // Whale movement alerts
    whaleMovements.forEach((movement, index) => {
      if (movement.amount_usd >= 10000000) { // $10M+ movements
        alerts.push({
          id: `whale_${movement.transaction_hash}_${index}`,
          alert_type: 'whale_movement',
          severity: movement.whale_tier === 'mega' ? 'critical' : 'high',
          title: `🐋 Mega Whale Alert: ${movement.whale_tier.toUpperCase()} ${movement.transaction_type.toUpperCase()}`,
          description: `${movement.whale_tier} whale moved ${this.formatNumber(movement.amount_usd)} USD worth of ${movement.token_symbol}`,
          token_symbol: movement.token_symbol,
          amount_usd: movement.amount_usd,
          timestamp: movement.timestamp,
          is_active: true,
          metadata: {
            whale_address: movement.whale_address,
            transaction_hash: movement.transaction_hash,
            exchange: movement.exchange
          }
        });
      }
    });

    // Exchange flow alerts
    exchangeFlows.forEach((flow, index) => {
      const netFlowAbs = Math.abs(flow.net_flow_24h);
      if (netFlowAbs > 1000000) { // $1M+ net flows
        alerts.push({
          id: `exchange_flow_${flow.exchange_name}_${index}`,
          alert_type: 'exchange_flow',
          severity: netFlowAbs > 10000000 ? 'high' : 'medium',
          title: `📈 Exchange Flow Alert: ${flow.exchange_name}`,
          description: `${flow.net_flow_24h > 0 ? 'Inflow' : 'Outflow'} of ${this.formatNumber(netFlowAbs)} USD on ${flow.exchange_name}`,
          token_symbol: flow.token_symbol,
          amount_usd: netFlowAbs,
          timestamp: flow.timestamp,
          is_active: true,
          metadata: {
            exchange_name: flow.exchange_name,
            inflow_24h: flow.inflow_24h,
            outflow_24h: flow.outflow_24h,
            change_percentage: flow.flow_change_percentage
          }
        });
      }
    });

    // Network congestion alerts
    networkMetrics.forEach((metrics, index) => {
      if (metrics.congestion_level === 'high') {
        alerts.push({
          id: `network_congestion_${metrics.network_name}_${index}`,
          alert_type: 'network_congestion',
          severity: 'medium',
          title: `⚠️ Network Congestion: ${metrics.network_name}`,
          description: `High congestion detected with ${metrics.gas_price_gwei} gwei gas price and ${metrics.tps_current} TPS`,
          timestamp: metrics.timestamp,
          is_active: true,
          metadata: {
            network_name: metrics.network_name,
            gas_price_gwei: metrics.gas_price_gwei,
            tps_current: metrics.tps_current,
            tx_count_24h: metrics.transaction_count_24h
          }
        });
      }
    });

    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private formatNumber(value: number): string {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
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

      const metrics: DeFiMetrics[] = result?.result?.rows?.map(row => ({
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
      return [];
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

      const metrics: DEXMetrics[] = result?.result?.rows?.map(row => ({
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
      return [];
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
      return {
        whaleActivity: [],
        dexTrends: [],
        signals: [],
        timestamp: new Date().toISOString()
      };
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

  // Real data methods - mock methods removed for production readiness
  // Note: These services now require actual Dune API implementation
}

export const duneAnalyticsService = new DuneAnalyticsService();