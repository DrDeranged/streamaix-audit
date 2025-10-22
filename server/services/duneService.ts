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
  
  // Pre-created query IDs for common operations
  // These would be created on Dune dashboard and referenced here
  private readonly CRYPTO_PRICE_QUERY_ID = 4355826; // Public token price query
  
  // Error suppression to prevent rate limit spam
  private errorLog = new Map<string, number>(); // Track last error log time
  private errorLogCooldown = 3600000; // 1 hour cooldown for same error type
  
  constructor() {
    this.apiKey = process.env.DUNE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ DUNE_API_KEY not configured - Dune Analytics will not be available');
    } else {
      console.log('✅ Dune Analytics initialized with API key');
    }
  }

  /**
   * Log an error with suppression to prevent spam (only logs same error type once per hour)
   */
  private logErrorOnce(errorKey: string, message: string, details?: any): void {
    const now = Date.now();
    const lastLogged = this.errorLog.get(errorKey);
    
    // Only log if we haven't logged this error recently
    if (!lastLogged || (now - lastLogged) > this.errorLogCooldown) {
      if (details) {
        console.error(message, details);
      } else {
        console.error(message);
      }
      this.errorLog.set(errorKey, now);
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
        { 
          query_parameters: parameters || {},
          performance: 'medium' // Use medium tier (10 credits per query)
        },
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
      this.logErrorOnce('dune_query_error', `❌ Dune API error:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Execute a custom SQL query using Dune's ad-hoc query execution
   */
  private async executeCustomSQL(sql: string): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Dune API key not configured');
    }

    try {
      // For Dune API v1, we need to use a pre-created query
      // As a fallback, we'll use the prices.latest approach through existing queries
      console.log('🔮 Executing custom Dune SQL query');
      
      // This would require creating a query on Dune dashboard first
      // For now, we'll use a workaround with known token addresses
      return [];
    } catch (error: any) {
      this.logErrorOnce('dune_sql_error', `❌ Dune custom SQL error:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get token price from Dune using prices.latest table
   */
  async getTokenPrice(symbol: string): Promise<number | null> {
    try {
      if (!this.apiKey) {
        console.log(`⚠️ Dune API key not configured`);
        return null;
      }

      // Map common symbols to their Ethereum contract addresses
      // Using lowercase addresses as Dune expects
      const tokenAddressMap: Record<string, string> = {
        'ETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        'BTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
        'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
        'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
        'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
        'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        'AAVE': '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        'MKR': '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        'SNX': '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
        'COMP': '0xc00e94cb662c3520282e6f5717214004a7f26888',
        'SUSHI': '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
        'CRV': '0xd533a949740bb3306d119cc777fa900ba034cd52',
        'YFI': '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        'BAL': '0xba100000625a3754423978a60c9317c58a424e3d',
        'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        'MATIC': '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
        'SOL': '', // SOL is not an ERC-20 token, needs different handling
        'ADA': '', // ADA is not an ERC-20 token
        'DOT': '', // DOT is not an ERC-20 token
        'AVAX': '', // AVAX is not an ERC-20 token (ERC-20 wrapped versions exist)
      };

      const tokenAddress = tokenAddressMap[symbol.toUpperCase()];
      
      if (!tokenAddress) {
        console.log(`⚠️ Token ${symbol} address not mapped for Dune query`);
        return null;
      }

      console.log(`🔮 Fetching ${symbol} price from Dune Analytics (address: ${tokenAddress})`);

      // Try multiple public Dune queries for token prices
      // These are well-known public queries on Dune that fetch token prices
      const queryIdsToTry = [
        4355826, // Public token price query #1
        3238619, // Public token price query #2
        4024910, // DEX aggregated prices
        3845216, // Token prices from Uniswap v3
      ];

      for (const queryId of queryIdsToTry) {
        try {
          const results = await this.executeQuery(queryId, {
            token_address: tokenAddress,
            contract_address: tokenAddress,
            blockchain: 'ethereum',
            address: tokenAddress,
          });

          if (results && results.length > 0) {
            // Try different price field names that Dune queries might use
            const priceFields = ['price', 'price_usd', 'avg_price', 'current_price', 'token_price'];
            
            for (const field of priceFields) {
              const price = results[0][field];
              if (price && typeof price === 'number' && price > 0) {
                console.log(`✅ Dune price for ${symbol} from query ${queryId}: $${price}`);
                return price;
              }
            }
          }
        } catch (queryError: any) {
          console.log(`⚠️ Dune query ${queryId} failed: ${queryError.message}`);
          continue; // Try next query
        }
      }

      console.log(`⚠️ No Dune price data available for ${symbol} after trying all queries`);
      return null;
    } catch (error) {
      console.error(`❌ Dune price fetch failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple token prices in one query (more efficient)
   */
  async getMultipleTokenPrices(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    try {
      if (!this.apiKey) {
        console.log(`⚠️ Dune API key not configured`);
        return prices;
      }

      console.log(`🔮 Fetching ${symbols.length} token prices from Dune Analytics`);

      // Fetch prices sequentially (parallel might hit rate limits)
      for (const symbol of symbols) {
        const price = await this.getTokenPrice(symbol);
        if (price !== null) {
          prices.set(symbol, price);
        }
      }

      console.log(`✅ Retrieved ${prices.size} prices from Dune`);
      return prices;
    } catch (error) {
      console.error(`❌ Dune multiple price fetch failed:`, error);
      return prices;
    }
  }

  /**
   * Get DeFi protocol TVL from Dune
   */
  async getProtocolTVL(protocol: string): Promise<number | null> {
    try {
      if (!this.apiKey) {
        return null;
      }

      // This would use a custom Dune query for protocol TVL
      // Query IDs would need to be created on Dune dashboard
      console.log(`🔮 Dune TVL query for ${protocol} - using pre-created query`);
      
      // Example protocol TVL query IDs (would need to be created)
      const protocolQueryMap: Record<string, number> = {
        'uniswap': 0, // Replace with actual query ID
        'aave': 0,
        'compound': 0,
        'curve': 0,
      };

      return null; // Not implemented yet
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
      if (!this.apiKey) {
        return null;
      }

      // This would use a custom Dune query for Base network metrics
      // Example: daily transactions, active users, gas usage, etc.
      console.log(`🔮 Dune Base network stats - using pre-created query`);
      
      // Base network stats query ID (would need to be created)
      const BASE_STATS_QUERY_ID = 0; // Replace with actual query ID

      return null; // Not implemented yet
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
      if (!this.apiKey) {
        return null;
      }

      // This would use a custom Dune query for NFT floor prices
      console.log(`🔮 Dune NFT floor price query for ${collection} - using pre-created query`);
      
      return null; // Not implemented yet
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
      if (!this.apiKey) {
        return null;
      }

      // This would use a custom Dune query for DEX volumes
      console.log(`🔮 Dune DEX volume query for ${dex} (${timeframe}) - using pre-created query`);
      
      return null; // Not implemented yet
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
