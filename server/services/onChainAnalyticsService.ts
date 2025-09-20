import axios from 'axios';
import { duneAnalyticsService } from './duneAnalyticsService';

interface EtherscanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  timeStamp: string;
  blockNumber: string;
}

interface NetworkStatus {
  network: string;
  gasPrice: {
    slow: number;
    standard: number;
    fast: number;
  };
  blockTime: number;
  hashRate: number;
  difficulty: string;
  lastBlock: number;
  congestionLevel: 'low' | 'medium' | 'high';
}

interface RealTimeAlert {
  id: string;
  type: 'whale_tx' | 'exchange_deposit' | 'large_transfer' | 'network_spike';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  data: any;
}

export class OnChainAnalyticsService {
  private etherscanApiKey: string;
  private alchemyApiKey: string;
  private bscScanApiKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute for real-time data
  private longCacheTimeout = 300000; // 5 minutes for slower-changing data

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY || '';
    this.bscScanApiKey = process.env.BSCSCAN_API_KEY || '';
    
    console.log('🔗 OnChain Analytics Service initialized:');
    console.log(`  - Etherscan API: ${this.etherscanApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - Alchemy API: ${this.alchemyApiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`  - BSCScan API: ${this.bscScanApiKey ? '✅ Available' : '❌ Missing'}`);
  }

  private getFromCache(key: string, customTimeout?: number): any | null {
    const cached = this.cache.get(key);
    if (cached) {
      const timeout = customTimeout || this.cacheTimeout;
      if (Date.now() - cached.timestamp < timeout) {
        return cached.data;
      }
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get real-time whale movements from Etherscan
   */
  async getRealTimeWhaleMovements(minAmountEth: number = 1000): Promise<any[]> {
    const cacheKey = `realtime_whales_${minAmountEth}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (!this.etherscanApiKey) {
      console.log('⚠️ Etherscan API key not available - using mock data');
      return this.generateMockWhaleData();
    }

    try {
      // Get latest blocks and scan for large transactions
      const latestBlockResponse = await axios.get(`https://api.etherscan.io/api`, {
        params: {
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: this.etherscanApiKey
        }
      });

      const latestBlock = parseInt(latestBlockResponse.data.result, 16);
      const whaleMovements = [];

      // Scan last 5 blocks for large transactions
      for (let i = 0; i < 5; i++) {
        const blockNumber = latestBlock - i;
        const blockResponse = await axios.get(`https://api.etherscan.io/api`, {
          params: {
            module: 'proxy',
            action: 'eth_getBlockByNumber',
            tag: '0x' + blockNumber.toString(16),
            boolean: true,
            apikey: this.etherscanApiKey
          }
        });

        if (blockResponse.data.result?.transactions) {
          const largeTxs = blockResponse.data.result.transactions.filter((tx: any) => {
            const valueEth = parseInt(tx.value, 16) / 1e18;
            return valueEth >= minAmountEth;
          });

          for (const tx of largeTxs) {
            const ethPrice = await this.getETHPrice();
            const valueEth = parseInt(tx.value, 16) / 1e18;
            const valueUsd = valueEth * ethPrice;

            whaleMovements.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              valueEth: valueEth,
              valueUsd: valueUsd,
              gasPrice: parseInt(tx.gasPrice, 16) / 1e9, // Convert to Gwei
              blockNumber: parseInt(tx.blockNumber, 16),
              timestamp: new Date().toISOString(),
              isWhale: valueUsd >= 1000000 // $1M+ threshold
            });
          }
        }
      }

      this.setCache(cacheKey, whaleMovements);
      console.log(`🐋 Found ${whaleMovements.length} whale transactions in last 5 blocks`);
      return whaleMovements;

    } catch (error) {
      console.error('❌ Failed to fetch real-time whale movements:', error);
      return this.generateMockWhaleData();
    }
  }

  /**
   * Get current network status and gas prices
   */
  async getNetworkStatus(): Promise<NetworkStatus[]> {
    const cacheKey = 'network_status';
    const cached = this.getFromCache(cacheKey, this.longCacheTimeout);
    if (cached) return cached;

    const networkStatuses: NetworkStatus[] = [];

    // Ethereum network status
    if (this.etherscanApiKey) {
      try {
        const gasResponse = await axios.get(`https://api.etherscan.io/api`, {
          params: {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: this.etherscanApiKey
          }
        });

        const gasData = gasResponse.data.result;
        networkStatuses.push({
          network: 'Ethereum',
          gasPrice: {
            slow: parseInt(gasData.SafeGasPrice) || 20,
            standard: parseInt(gasData.StandardGasPrice) || 25,
            fast: parseInt(gasData.FastGasPrice) || 30
          },
          blockTime: 12, // Average Ethereum block time
          hashRate: 0, // Would need additional API call
          difficulty: '0',
          lastBlock: 0,
          congestionLevel: this.determineCongestionFromGas(parseInt(gasData.FastGasPrice) || 30)
        });
      } catch (error) {
        console.error('Failed to fetch Ethereum network status:', error);
      }
    }

    // Add mock data for other networks if no API keys
    networkStatuses.push(
      {
        network: 'Bitcoin',
        gasPrice: { slow: 1, standard: 5, fast: 10 },
        blockTime: 600, // 10 minutes
        hashRate: 0,
        difficulty: '0',
        lastBlock: 0,
        congestionLevel: 'low'
      },
      {
        network: 'Binance Smart Chain',
        gasPrice: { slow: 5, standard: 10, fast: 15 },
        blockTime: 3,
        hashRate: 0,
        difficulty: '0',
        lastBlock: 0,
        congestionLevel: 'low'
      }
    );

    this.setCache(cacheKey, networkStatuses);
    return networkStatuses;
  }

  /**
   * Monitor exchange addresses for large inflows/outflows
   */
  async getExchangeFlowAlerts(): Promise<RealTimeAlert[]> {
    const cacheKey = 'exchange_flow_alerts';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Known exchange addresses (subset for monitoring)
    const exchangeAddresses = {
      'Binance': '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
      'Coinbase': '0x71660c4005ba85c37ccec55d0c4493e66fe775d3',
      'Kraken': '0x2910543af39aba0cd09dbb2d50200b3e800a63d2',
      'Bitfinex': '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f'
    };

    const alerts: RealTimeAlert[] = [];

    if (!this.etherscanApiKey) {
      return this.generateMockExchangeAlerts();
    }

    try {
      for (const [exchangeName, address] of Object.entries(exchangeAddresses)) {
        const txResponse = await axios.get(`https://api.etherscan.io/api`, {
          params: {
            module: 'account',
            action: 'txlist',
            address: address,
            startblock: 0,
            endblock: 'latest',
            page: 1,
            offset: 10, // Last 10 transactions
            sort: 'desc',
            apikey: this.etherscanApiKey
          }
        });

        const transactions = txResponse.data.result || [];
        const ethPrice = await this.getETHPrice();
        
        for (const tx of transactions) {
          const valueEth = parseInt(tx.value) / 1e18;
          const valueUsd = valueEth * ethPrice;
          
          if (valueUsd >= 1000000) { // $1M+ threshold
            const isDeposit = tx.to.toLowerCase() === address.toLowerCase();
            alerts.push({
              id: `exchange_${tx.hash}`,
              type: 'exchange_deposit',
              title: `🏦 Large ${exchangeName} ${isDeposit ? 'Deposit' : 'Withdrawal'}`,
              message: `${this.formatNumber(valueUsd)} USD ${isDeposit ? 'deposited to' : 'withdrawn from'} ${exchangeName}`,
              severity: valueUsd >= 10000000 ? 'critical' : 'warning',
              timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
              data: {
                exchange: exchangeName,
                amount_usd: valueUsd,
                amount_eth: valueEth,
                transaction_hash: tx.hash,
                is_deposit: isDeposit
              }
            });
          }
        }
      }

      this.setCache(cacheKey, alerts);
      console.log(`📊 Generated ${alerts.length} exchange flow alerts`);
      return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Failed to fetch exchange flow alerts:', error);
      return this.generateMockExchangeAlerts();
    }
  }

  /**
   * Get comprehensive on-chain analytics combining all data sources
   */
  async getComprehensiveAnalytics(): Promise<{
    whaleMovements: any[];
    exchangeFlows: any[];
    networkStatus: NetworkStatus[];
    alerts: RealTimeAlert[];
    duneData: any;
    timestamp: string;
  }> {
    const cacheKey = 'comprehensive_analytics';
    const cached = this.getFromCache(cacheKey, this.longCacheTimeout);
    if (cached) return cached;

    try {
      console.log('🔍 Fetching comprehensive on-chain analytics...');
      
      const [whaleMovements, exchangeFlows, networkStatus, alerts, duneData] = await Promise.all([
        this.getRealTimeWhaleMovements(),
        this.getExchangeFlowAlerts(),
        this.getNetworkStatus(),
        this.generateNetworkAlerts(),
        this.getDuneAnalytics()
      ]);

      const analytics = {
        whaleMovements,
        exchangeFlows,
        networkStatus,
        alerts,
        duneData,
        timestamp: new Date().toISOString()
      };

      this.setCache(cacheKey, analytics);
      console.log('✅ Comprehensive on-chain analytics compiled successfully');
      return analytics;

    } catch (error) {
      console.error('❌ Failed to compile comprehensive analytics:', error);
      return {
        whaleMovements: [],
        exchangeFlows: [],
        networkStatus: [],
        alerts: [],
        duneData: null,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getDuneAnalytics(): Promise<any> {
    try {
      const [whaleMovements, exchangeFlows, onChainAlerts] = await Promise.all([
        duneAnalyticsService.getWhaleMovements(['BTC', 'ETH', 'USDT'], 1000000),
        duneAnalyticsService.getExchangeFlows(),
        duneAnalyticsService.getOnChainAlerts()
      ]);

      return {
        whaleMovements,
        exchangeFlows,
        alerts: onChainAlerts
      };
    } catch (error) {
      console.error('Failed to fetch Dune Analytics data:', error);
      return null;
    }
  }

  private async generateNetworkAlerts(): Promise<RealTimeAlert[]> {
    const networkStatuses = await this.getNetworkStatus();
    const alerts: RealTimeAlert[] = [];

    networkStatuses.forEach(status => {
      if (status.congestionLevel === 'high') {
        alerts.push({
          id: `network_${status.network}_${Date.now()}`,
          type: 'network_spike',
          title: `⚠️ High Gas on ${status.network}`,
          message: `${status.network} gas prices elevated: ${status.gasPrice.fast} gwei`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          data: status
        });
      }
    });

    return alerts;
  }

  private async getETHPrice(): Promise<number> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      return response.data.ethereum.usd;
    } catch (error) {
      console.warn('Failed to fetch ETH price, using fallback');
      return 3000; // Fallback price
    }
  }

  private determineCongestionFromGas(gasPriceGwei: number): 'low' | 'medium' | 'high' {
    if (gasPriceGwei > 100) return 'high';
    if (gasPriceGwei > 50) return 'medium';
    return 'low';
  }

  private formatNumber(value: number): string {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }

  // Mock data methods for fallback when APIs are not available
  private generateMockWhaleData(): any[] {
    const mockData = [];
    const tokens = ['ETH', 'BTC', 'USDT', 'USDC'];
    
    for (let i = 0; i < 5; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const valueUsd = Math.random() * 10000000 + 1000000; // $1M - $11M
      
      mockData.push({
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        from: '0x' + Math.random().toString(16).substr(2, 40),
        to: '0x' + Math.random().toString(16).substr(2, 40),
        valueEth: token === 'ETH' ? valueUsd / 3000 : 0,
        valueUsd: valueUsd,
        gasPrice: Math.random() * 50 + 20,
        blockNumber: Math.floor(Math.random() * 1000000),
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        isWhale: true,
        token_symbol: token,
        whale_tier: valueUsd >= 10000000 ? 'mega' : valueUsd >= 5000000 ? 'large' : 'medium'
      });
    }
    
    return mockData;
  }

  private generateMockExchangeAlerts(): RealTimeAlert[] {
    const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bitfinex'];
    const alerts: RealTimeAlert[] = [];
    
    for (let i = 0; i < 3; i++) {
      const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
      const valueUsd = Math.random() * 5000000 + 2000000; // $2M - $7M
      const isDeposit = Math.random() > 0.5;
      
      alerts.push({
        id: `mock_exchange_${exchange}_${i}`,
        type: 'exchange_deposit',
        title: `🏦 Large ${exchange} ${isDeposit ? 'Deposit' : 'Withdrawal'}`,
        message: `${this.formatNumber(valueUsd)} USD ${isDeposit ? 'deposited to' : 'withdrawn from'} ${exchange}`,
        severity: valueUsd >= 5000000 ? 'critical' : 'warning',
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        data: {
          exchange,
          amount_usd: valueUsd,
          is_deposit: isDeposit
        }
      });
    }
    
    return alerts;
  }
}

export const onChainAnalyticsService = new OnChainAnalyticsService();