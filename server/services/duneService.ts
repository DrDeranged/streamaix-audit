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
      total_result_set_bytes: number;
      datapoint_count: number;
      pending_time_millis: number;
      execution_time_millis: number;
    };
  };
}

interface DuneTokenPrice {
  symbol: string;
  price: number;
  timestamp: string;
}

class DuneService {
  private apiKey: string;
  private baseUrl = 'https://api.dune.com/api/v1';
  
  constructor() {
    this.apiKey = process.env.DUNE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ DUNE_API_KEY not configured - Dune Analytics will not be available');
    }
  }

  /**
   * Execute a Dune query and wait for results
   */
  private async executeQuery(queryId: number, parameters?: Record<string, any>): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Dune API key not configured');
    }

    try {
      // Start query execution
      const executeResponse = await axios.post(
        `${this.baseUrl}/query/${queryId}/execute`,
        { query_parameters: parameters || {} },
        {
          headers: {
            'X-Dune-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const executionId = executeResponse.data.execution_id;
      console.log(`🔮 Dune query ${queryId} started with execution ID: ${executionId}`);

      // Poll for results (max 30 seconds)
      const maxAttempts = 15;
      const pollInterval = 2000; // 2 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const statusResponse = await axios.get<DuneQueryResult>(
          `${this.baseUrl}/execution/${executionId}/results`,
          {
            headers: {
              'X-Dune-API-Key': this.apiKey,
            },
          }
        );

        const status = statusResponse.data;

        if (status.state === 'QUERY_STATE_COMPLETED') {
          console.log(`✅ Dune query ${queryId} completed: ${status.result?.metadata.row_count || 0} rows`);
          return status.result?.rows || [];
        } else if (status.state === 'QUERY_STATE_FAILED') {
          throw new Error('Dune query failed');
        }

        console.log(`⏳ Dune query ${queryId} status: ${status.state} (attempt ${attempt + 1}/${maxAttempts})`);
      }

      throw new Error('Dune query timeout');
    } catch (error: any) {
      console.error(`❌ Dune API error:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get token price from Dune (using a public price query)
   * Note: This requires a pre-created Dune query for token prices
   */
  async getTokenPrice(symbol: string): Promise<number | null> {
    try {
      // Using Dune's public token prices query (query ID would need to be created)
      // For now, we'll use a generic approach
      
      // Map common symbols to their contract addresses for Dune queries
      const tokenMap: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'BNB': 'binancecoin',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'AVAX': 'avalanche-2',
        'DOT': 'polkadot',
        'MATIC': 'matic-network',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'AAVE': 'aave',
      };

      const tokenId = tokenMap[symbol.toUpperCase()];
      if (!tokenId) {
        console.log(`⚠️ Token ${symbol} not supported in Dune fallback`);
        return null;
      }

      // This is a placeholder - in production, you'd create a custom Dune query
      // that fetches latest prices from DEX data or price oracles on-chain
      console.log(`🔮 Dune price query for ${symbol} not yet implemented (would use query for ${tokenId})`);
      return null;
    } catch (error) {
      console.error(`❌ Dune price fetch failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get DeFi protocol TVL from Dune
   */
  async getProtocolTVL(protocol: string): Promise<number | null> {
    try {
      // This would use a custom Dune query for protocol TVL
      console.log(`🔮 Dune TVL query for ${protocol} not yet implemented`);
      return null;
    } catch (error) {
      console.error(`❌ Dune TVL fetch failed for ${protocol}:`, error);
      return null;
    }
  }

  /**
   * Get Base network statistics from Dune
   */
  async getBaseNetworkStats(): Promise<any> {
    try {
      // This would use a custom Dune query for Base network metrics
      // Example: daily transactions, active users, gas usage, etc.
      console.log(`🔮 Dune Base network stats query not yet implemented`);
      return null;
    } catch (error) {
      console.error(`❌ Dune Base stats fetch failed:`, error);
      return null;
    }
  }

  /**
   * Get NFT floor prices from Dune
   */
  async getNFTFloorPrice(collection: string): Promise<number | null> {
    try {
      // This would use a custom Dune query for NFT floor prices
      console.log(`🔮 Dune NFT floor price query for ${collection} not yet implemented`);
      return null;
    } catch (error) {
      console.error(`❌ Dune NFT price fetch failed for ${collection}:`, error);
      return null;
    }
  }

  /**
   * Get DEX volume data from Dune
   */
  async getDexVolume(dex: string, timeframe: string = '24h'): Promise<number | null> {
    try {
      // This would use a custom Dune query for DEX volumes
      console.log(`🔮 Dune DEX volume query for ${dex} (${timeframe}) not yet implemented`);
      return null;
    } catch (error) {
      console.error(`❌ Dune DEX volume fetch failed for ${dex}:`, error);
      return null;
    }
  }

  /**
   * Check if Dune API is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export const duneService = new DuneService();
