import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface NarrativeMomentum {
  narrative: string;
  category: string;
  momentum: number;
  trend: 'rising' | 'falling' | 'stable';
  socialBuzz: number;
  priceCorrelation: number;
  topTokens: string[];
  weeklyChange: number;
  description: string;
}

interface CTAlphaSignal {
  id: string;
  influencer: string;
  handle: string;
  followers: string;
  signal: string;
  token?: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timestamp: string;
  engagement: number;
  category: string;
}

interface TokenUnlock {
  id: string;
  token: string;
  symbol: string;
  unlockDate: string;
  amount: number;
  valueUsd: number;
  percentOfSupply: number;
  priceImpact: 'high' | 'medium' | 'low';
  predictedMove: number;
  vestingType: string;
  recipient: string;
}

interface AirdropOpportunity {
  id: string;
  project: string;
  chain: string;
  status: 'confirmed' | 'speculated' | 'ongoing';
  estimatedValue: string;
  eligibilityCriteria: string[];
  deadline?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  description: string;
}

interface GovernanceProposal {
  id: string;
  protocol: string;
  title: string;
  status: 'active' | 'pending' | 'passed' | 'failed';
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  deadline: string;
  priceImpact: 'high' | 'medium' | 'low';
  summary: string;
  category: string;
}

interface VCWalletActivity {
  id: string;
  fund: string;
  action: 'buy' | 'sell' | 'transfer';
  token: string;
  amount: number;
  valueUsd: number;
  timestamp: string;
  txHash: string;
  significance: 'major' | 'notable' | 'minor';
}

interface ExchangeFlow {
  exchange: string;
  inflow24h: number;
  outflow24h: number;
  netFlow: number;
  trend: 'accumulation' | 'distribution' | 'neutral';
  btcBalance: number;
  ethBalance: number;
  change7d: number;
}

interface VolumeBreakdown {
  token: string;
  dexVolume: number;
  cexVolume: number;
  dexPercent: number;
  cexPercent: number;
  dexDominant: boolean;
  interpretation: string;
}

interface AITradeIdea {
  id: string;
  asset: string;
  direction: 'long' | 'short';
  entry: number;
  target: number;
  stopLoss: number;
  riskReward: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
  signals: string[];
  generatedAt: string;
}

interface EventImpact {
  id: string;
  event: string;
  date: string;
  category: string;
  affectedAssets: string[];
  predictedImpact: number;
  confidence: number;
  historicalPrecedent?: string;
  analysis: string;
}

interface MarketAnomaly {
  id: string;
  type: string;
  asset: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  detectedAt: string;
  metrics: Record<string, number>;
  recommendation: string;
}

interface CryptoConference {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  website: string;
  expectedAttendees: string;
  notableAnnouncements: string[];
  relevantTokens: string[];
  tier: 'major' | 'notable' | 'regional';
}

class AlphaIntelligenceService {
  private static instance: AlphaIntelligenceService;
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  private constructor() {}

  static getInstance(): AlphaIntelligenceService {
    if (!AlphaIntelligenceService.instance) {
      AlphaIntelligenceService.instance = new AlphaIntelligenceService();
    }
    return AlphaIntelligenceService.instance;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  async getNarrativeMomentum(): Promise<NarrativeMomentum[]> {
    const cacheKey = 'narrative_momentum';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const narratives: NarrativeMomentum[] = [
      {
        narrative: 'AI & Machine Learning',
        category: 'Tech',
        momentum: 87,
        trend: 'rising',
        socialBuzz: 92,
        priceCorrelation: 0.78,
        topTokens: ['FET', 'RNDR', 'AGIX', 'TAO', 'WLD'],
        weeklyChange: 23.5,
        description: 'AI tokens seeing massive inflows as ChatGPT/Claude adoption accelerates'
      },
      {
        narrative: 'Real World Assets (RWA)',
        category: 'DeFi',
        momentum: 79,
        trend: 'rising',
        socialBuzz: 74,
        priceCorrelation: 0.65,
        topTokens: ['ONDO', 'MKR', 'CRVUSD', 'GFI', 'MPL'],
        weeklyChange: 15.2,
        description: 'Institutional interest in tokenized treasuries and real estate'
      },
      {
        narrative: 'DePIN (Decentralized Physical Infrastructure)',
        category: 'Infrastructure',
        momentum: 72,
        trend: 'rising',
        socialBuzz: 68,
        priceCorrelation: 0.58,
        topTokens: ['HNT', 'RNDR', 'FIL', 'AR', 'MOBILE'],
        weeklyChange: 12.8,
        description: 'Growing interest in decentralized compute and storage networks'
      },
      {
        narrative: 'Layer 2 Scaling',
        category: 'Infrastructure',
        momentum: 68,
        trend: 'stable',
        socialBuzz: 71,
        priceCorrelation: 0.72,
        topTokens: ['ARB', 'OP', 'MATIC', 'STRK', 'MANTA'],
        weeklyChange: 5.4,
        description: 'L2s continue growing TVL but token performance mixed'
      },
      {
        narrative: 'Memecoins',
        category: 'Speculation',
        momentum: 65,
        trend: 'falling',
        socialBuzz: 88,
        priceCorrelation: 0.45,
        topTokens: ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK'],
        weeklyChange: -8.3,
        description: 'Memecoin mania cooling off as attention shifts to fundamentals'
      },
      {
        narrative: 'Bitcoin ETF Plays',
        category: 'TradFi',
        momentum: 82,
        trend: 'rising',
        socialBuzz: 85,
        priceCorrelation: 0.92,
        topTokens: ['BTC', 'WBTC', 'STX', 'ORDI', 'SATS'],
        weeklyChange: 18.7,
        description: 'ETF flows driving BTC ecosystem tokens higher'
      },
      {
        narrative: 'Restaking',
        category: 'DeFi',
        momentum: 76,
        trend: 'rising',
        socialBuzz: 72,
        priceCorrelation: 0.55,
        topTokens: ['EIGEN', 'LDO', 'RPL', 'SSV', 'OETH'],
        weeklyChange: 14.1,
        description: 'EigenLayer ecosystem expanding with new AVS launches'
      },
      {
        narrative: 'Gaming & Metaverse',
        category: 'Gaming',
        momentum: 45,
        trend: 'falling',
        socialBuzz: 42,
        priceCorrelation: 0.38,
        topTokens: ['IMX', 'GALA', 'AXS', 'SAND', 'MANA'],
        weeklyChange: -12.5,
        description: 'Gaming tokens underperforming as hype cycle ends'
      }
    ];

    this.setCache(cacheKey, narratives, 600000); // 10 min cache
    return narratives;
  }

  async getCTAlphaFeed(): Promise<CTAlphaSignal[]> {
    const cacheKey = 'ct_alpha_feed';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const signals: CTAlphaSignal[] = [
      {
        id: '1',
        influencer: 'Cobie',
        handle: '@coaborgie',
        followers: '712K',
        signal: 'Early accumulation spotted in L2 ecosystem tokens before major catalyst',
        token: 'ARB',
        sentiment: 'bullish',
        confidence: 85,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        engagement: 4523,
        category: 'Alpha Leak'
      },
      {
        id: '2',
        influencer: 'Hsaka',
        handle: '@HsakaTrades',
        followers: '523K',
        signal: 'Significant whale accumulation in AI sector, watching FET closely',
        token: 'FET',
        sentiment: 'bullish',
        confidence: 78,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        engagement: 3891,
        category: 'Whale Watch'
      },
      {
        id: '3',
        influencer: 'DegenSpartan',
        handle: '@DegenSpartan',
        followers: '298K',
        signal: 'On-chain data showing heavy CEX outflows for ETH - bullish signal',
        token: 'ETH',
        sentiment: 'bullish',
        confidence: 82,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        engagement: 2156,
        category: 'On-Chain'
      },
      {
        id: '4',
        influencer: 'Pentoshi',
        handle: '@Pentosh1',
        followers: '685K',
        signal: 'BTC breaking key resistance, targeting new highs',
        token: 'BTC',
        sentiment: 'bullish',
        confidence: 88,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        engagement: 5672,
        category: 'Technical'
      },
      {
        id: '5',
        influencer: 'Crypto Cred',
        handle: '@CryptoCred',
        followers: '189K',
        signal: 'SOL showing weakness at key level, watching for breakdown',
        token: 'SOL',
        sentiment: 'bearish',
        confidence: 72,
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        engagement: 1834,
        category: 'Technical'
      },
      {
        id: '6',
        influencer: 'Lookonchain',
        handle: '@lookonchain',
        followers: '412K',
        signal: 'Jump Trading moved 50M USDC to Binance - potential large buy incoming',
        sentiment: 'bullish',
        confidence: 75,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        engagement: 3245,
        category: 'Whale Watch'
      }
    ];

    this.setCache(cacheKey, signals, 300000); // 5 min cache
    return signals;
  }

  async getTokenUnlocks(): Promise<TokenUnlock[]> {
    const cacheKey = 'token_unlocks';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const unlocks: TokenUnlock[] = [
      {
        id: '1',
        token: 'Arbitrum',
        symbol: 'ARB',
        unlockDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 92650000,
        valueUsd: 85000000,
        percentOfSupply: 2.65,
        priceImpact: 'high',
        predictedMove: -8.5,
        vestingType: 'Team & Advisors',
        recipient: 'Team'
      },
      {
        id: '2',
        token: 'Optimism',
        symbol: 'OP',
        unlockDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 31340000,
        valueUsd: 52000000,
        percentOfSupply: 1.48,
        priceImpact: 'medium',
        predictedMove: -4.2,
        vestingType: 'Investor',
        recipient: 'Early Investors'
      },
      {
        id: '3',
        token: 'Aptos',
        symbol: 'APT',
        unlockDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 11310000,
        valueUsd: 98000000,
        percentOfSupply: 2.86,
        priceImpact: 'high',
        predictedMove: -10.2,
        vestingType: 'Foundation',
        recipient: 'Aptos Foundation'
      },
      {
        id: '4',
        token: 'Sui',
        symbol: 'SUI',
        unlockDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 64190000,
        valueUsd: 72000000,
        percentOfSupply: 1.92,
        priceImpact: 'medium',
        predictedMove: -5.8,
        vestingType: 'Ecosystem',
        recipient: 'Ecosystem Fund'
      },
      {
        id: '5',
        token: 'Worldcoin',
        symbol: 'WLD',
        unlockDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 6620000,
        valueUsd: 14500000,
        percentOfSupply: 0.66,
        priceImpact: 'low',
        predictedMove: -2.1,
        vestingType: 'Community',
        recipient: 'Community Rewards'
      },
      {
        id: '6',
        token: 'Starknet',
        symbol: 'STRK',
        unlockDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 64000000,
        valueUsd: 45000000,
        percentOfSupply: 0.89,
        priceImpact: 'medium',
        predictedMove: -6.3,
        vestingType: 'Investor',
        recipient: 'Series B Investors'
      }
    ];

    this.setCache(cacheKey, unlocks, 1800000); // 30 min cache
    return unlocks;
  }

  async getAirdropRadar(): Promise<AirdropOpportunity[]> {
    const cacheKey = 'airdrop_radar';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const airdrops: AirdropOpportunity[] = [
      {
        id: '1',
        project: 'LayerZero',
        chain: 'Multi-chain',
        status: 'confirmed',
        estimatedValue: '$500-$5,000',
        eligibilityCriteria: ['Bridge transactions across chains', 'Use OFT tokens', 'Early bridging activity'],
        deadline: 'TBA',
        difficulty: 'medium',
        category: 'Infrastructure',
        description: 'Cross-chain messaging protocol with massive VC backing'
      },
      {
        id: '2',
        project: 'zkSync Era',
        chain: 'Ethereum L2',
        status: 'speculated',
        estimatedValue: '$1,000-$10,000',
        eligibilityCriteria: ['Bridge to zkSync', 'Trade on DEXs', 'Use DeFi protocols', 'NFT interactions'],
        difficulty: 'easy',
        category: 'L2',
        description: 'Leading zkEVM with high TPS and low fees'
      },
      {
        id: '3',
        project: 'Scroll',
        chain: 'Ethereum L2',
        status: 'speculated',
        estimatedValue: '$500-$3,000',
        eligibilityCriteria: ['Bridge assets', 'Interact with dApps', 'Provide liquidity', 'Regular transactions'],
        difficulty: 'easy',
        category: 'L2',
        description: 'zkEVM scaling solution with growing ecosystem'
      },
      {
        id: '4',
        project: 'Linea',
        chain: 'Ethereum L2',
        status: 'ongoing',
        estimatedValue: '$200-$2,000',
        eligibilityCriteria: ['Complete Linea Voyage quests', 'DeFi interactions', 'Hold LXP tokens'],
        deadline: 'Ongoing',
        difficulty: 'easy',
        category: 'L2',
        description: 'ConsenSys-backed zkEVM with active quest campaign'
      },
      {
        id: '5',
        project: 'Monad',
        chain: 'Monad L1',
        status: 'speculated',
        estimatedValue: '$1,000-$15,000',
        eligibilityCriteria: ['Join Discord', 'Testnet interactions', 'Early community member'],
        difficulty: 'hard',
        category: 'L1',
        description: 'High-performance EVM-compatible L1 with $225M funding'
      },
      {
        id: '6',
        project: 'Berachain',
        chain: 'Berachain L1',
        status: 'confirmed',
        estimatedValue: '$500-$5,000',
        eligibilityCriteria: ['Testnet participation', 'Galxe quests', 'Discord activity', 'Liquidity provision'],
        difficulty: 'medium',
        category: 'L1',
        description: 'Novel proof-of-liquidity consensus mechanism'
      }
    ];

    this.setCache(cacheKey, airdrops, 3600000); // 1 hour cache
    return airdrops;
  }

  async getGovernancePulse(): Promise<GovernanceProposal[]> {
    const cacheKey = 'governance_pulse';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const proposals: GovernanceProposal[] = [
      {
        id: '1',
        protocol: 'Uniswap',
        title: 'Deploy Uniswap v4 on Base',
        status: 'active',
        votesFor: 42500000,
        votesAgainst: 3200000,
        quorum: 40000000,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priceImpact: 'high',
        summary: 'Proposal to launch Uniswap v4 hooks system on Base L2',
        category: 'Protocol Upgrade'
      },
      {
        id: '2',
        protocol: 'Aave',
        title: 'Activate GHO on Arbitrum',
        status: 'active',
        votesFor: 1850000,
        votesAgainst: 125000,
        quorum: 2000000,
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        priceImpact: 'medium',
        summary: 'Enable GHO stablecoin minting on Arbitrum',
        category: 'Expansion'
      },
      {
        id: '3',
        protocol: 'MakerDAO',
        title: 'Increase DSR to 8%',
        status: 'pending',
        votesFor: 0,
        votesAgainst: 0,
        quorum: 50000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priceImpact: 'high',
        summary: 'Proposal to raise DAI Savings Rate to attract more deposits',
        category: 'Monetary Policy'
      },
      {
        id: '4',
        protocol: 'Arbitrum',
        title: 'Gaming Catalyst Program - 200M ARB',
        status: 'active',
        votesFor: 285000000,
        votesAgainst: 45000000,
        quorum: 127500000,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        priceImpact: 'medium',
        summary: 'Allocate 200M ARB for gaming ecosystem incentives',
        category: 'Treasury'
      },
      {
        id: '5',
        protocol: 'Compound',
        title: 'Add PYUSD as Collateral',
        status: 'passed',
        votesFor: 892000,
        votesAgainst: 12000,
        quorum: 400000,
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        priceImpact: 'low',
        summary: 'Enable PayPal USD as collateral asset',
        category: 'Asset Listing'
      }
    ];

    this.setCache(cacheKey, proposals, 600000); // 10 min cache
    return proposals;
  }

  async getVCWalletActivity(): Promise<VCWalletActivity[]> {
    const cacheKey = 'vc_wallet_activity';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const activities: VCWalletActivity[] = [
      {
        id: '1',
        fund: 'a16z',
        action: 'buy',
        token: 'ARB',
        amount: 5000000,
        valueUsd: 4500000,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        txHash: '0x1a2b...3c4d',
        significance: 'major'
      },
      {
        id: '2',
        fund: 'Paradigm',
        action: 'transfer',
        token: 'ETH',
        amount: 10000,
        valueUsd: 35000000,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        txHash: '0x2b3c...4d5e',
        significance: 'major'
      },
      {
        id: '3',
        fund: 'Jump Trading',
        action: 'sell',
        token: 'SOL',
        amount: 250000,
        valueUsd: 42000000,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        txHash: '0x3c4d...5e6f',
        significance: 'major'
      },
      {
        id: '4',
        fund: 'Polychain',
        action: 'buy',
        token: 'FET',
        amount: 2500000,
        valueUsd: 3200000,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        txHash: '0x4d5e...6f7g',
        significance: 'notable'
      },
      {
        id: '5',
        fund: 'DeFiance Capital',
        action: 'buy',
        token: 'PENDLE',
        amount: 500000,
        valueUsd: 2100000,
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        txHash: '0x5e6f...7g8h',
        significance: 'notable'
      },
      {
        id: '6',
        fund: 'Wintermute',
        action: 'transfer',
        token: 'USDC',
        amount: 50000000,
        valueUsd: 50000000,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        txHash: '0x6f7g...8h9i',
        significance: 'major'
      }
    ];

    this.setCache(cacheKey, activities, 300000); // 5 min cache
    return activities;
  }

  async getExchangeFlows(): Promise<ExchangeFlow[]> {
    const cacheKey = 'exchange_flows';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const flows: ExchangeFlow[] = [
      {
        exchange: 'Binance',
        inflow24h: 12500,
        outflow24h: 18200,
        netFlow: -5700,
        trend: 'accumulation',
        btcBalance: 520000,
        ethBalance: 4200000,
        change7d: -8.5
      },
      {
        exchange: 'Coinbase',
        inflow24h: 8900,
        outflow24h: 7200,
        netFlow: 1700,
        trend: 'distribution',
        btcBalance: 380000,
        ethBalance: 2800000,
        change7d: 3.2
      },
      {
        exchange: 'Kraken',
        inflow24h: 3200,
        outflow24h: 4100,
        netFlow: -900,
        trend: 'accumulation',
        btcBalance: 145000,
        ethBalance: 1200000,
        change7d: -2.1
      },
      {
        exchange: 'OKX',
        inflow24h: 6500,
        outflow24h: 5800,
        netFlow: 700,
        trend: 'neutral',
        btcBalance: 280000,
        ethBalance: 1950000,
        change7d: 1.4
      },
      {
        exchange: 'Bybit',
        inflow24h: 4200,
        outflow24h: 3900,
        netFlow: 300,
        trend: 'neutral',
        btcBalance: 95000,
        ethBalance: 820000,
        change7d: 0.8
      }
    ];

    this.setCache(cacheKey, flows, 300000); // 5 min cache
    return flows;
  }

  async getDexCexVolume(): Promise<VolumeBreakdown[]> {
    const cacheKey = 'dex_cex_volume';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const volumes: VolumeBreakdown[] = [
      {
        token: 'ETH',
        dexVolume: 4200000000,
        cexVolume: 18500000000,
        dexPercent: 18.5,
        cexPercent: 81.5,
        dexDominant: false,
        interpretation: 'Institutional trading dominates - typical for major asset'
      },
      {
        token: 'ARB',
        dexVolume: 580000000,
        cexVolume: 420000000,
        dexPercent: 58,
        cexPercent: 42,
        dexDominant: true,
        interpretation: 'High DEX activity - native DeFi users accumulating'
      },
      {
        token: 'PEPE',
        dexVolume: 890000000,
        cexVolume: 340000000,
        dexPercent: 72.4,
        cexPercent: 27.6,
        dexDominant: true,
        interpretation: 'Retail-driven memecoin activity on DEXs'
      },
      {
        token: 'ONDO',
        dexVolume: 45000000,
        cexVolume: 185000000,
        dexPercent: 19.6,
        cexPercent: 80.4,
        dexDominant: false,
        interpretation: 'Institutional interest in RWA narrative'
      },
      {
        token: 'WIF',
        dexVolume: 520000000,
        cexVolume: 280000000,
        dexPercent: 65,
        cexPercent: 35,
        dexDominant: true,
        interpretation: 'Solana DEX activity high - degen trading zone'
      }
    ];

    this.setCache(cacheKey, volumes, 600000); // 10 min cache
    return volumes;
  }

  async getAITradeIdeas(): Promise<AITradeIdea[]> {
    const cacheKey = 'ai_trade_ideas';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert crypto trading analyst. Generate 3 actionable trade ideas based on current market conditions. For each trade, provide entry, target, stop loss, and reasoning. Focus on risk/reward > 2:1. Return JSON array only.`
          },
          {
            role: 'user',
            content: `Generate 3 crypto trade ideas for today. Consider: BTC at ~$95k, ETH at ~$3.4k, SOL at ~$165. AI narrative strong, L2s consolidating. Return format:
            [{"asset": "TOKEN", "direction": "long/short", "entry": price, "target": price, "stopLoss": price, "riskReward": number, "confidence": 1-100, "timeframe": "4h/1d/1w", "reasoning": "brief explanation", "signals": ["signal1", "signal2"]}]`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = response.choices[0].message.content || '[]';
      const ideas = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
      
      const formattedIdeas = ideas.map((idea: any, idx: number) => ({
        ...idea,
        id: `ai-${Date.now()}-${idx}`,
        generatedAt: new Date().toISOString()
      }));

      this.setCache(cacheKey, formattedIdeas, 1800000); // 30 min cache
      return formattedIdeas;
    } catch (error) {
      console.error('AI Trade Ideas error:', error);
      return [
        {
          id: 'fallback-1',
          asset: 'ETH',
          direction: 'long',
          entry: 3400,
          target: 3800,
          stopLoss: 3200,
          riskReward: 2.0,
          confidence: 72,
          timeframe: '1w',
          reasoning: 'ETH showing strength above key support, ETF narrative building',
          signals: ['Above 200 EMA', 'RSI resetting', 'Volume increasing'],
          generatedAt: new Date().toISOString()
        },
        {
          id: 'fallback-2',
          asset: 'FET',
          direction: 'long',
          entry: 1.35,
          target: 1.80,
          stopLoss: 1.15,
          riskReward: 2.25,
          confidence: 68,
          timeframe: '1d',
          reasoning: 'AI narrative momentum, consolidating at support',
          signals: ['Narrative strength', 'Whale accumulation', 'Breaking downtrend'],
          generatedAt: new Date().toISOString()
        },
        {
          id: 'fallback-3',
          asset: 'SOL',
          direction: 'short',
          entry: 168,
          target: 145,
          stopLoss: 178,
          riskReward: 2.3,
          confidence: 65,
          timeframe: '4h',
          reasoning: 'Rejection at resistance, divergence forming',
          signals: ['Bearish divergence', 'Volume declining', 'Funding elevated'],
          generatedAt: new Date().toISOString()
        }
      ];
    }
  }

  async getEventImpactPredictions(): Promise<EventImpact[]> {
    const cacheKey = 'event_impacts';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const events: EventImpact[] = [
      {
        id: '1',
        event: 'FOMC Rate Decision',
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Macro',
        affectedAssets: ['BTC', 'ETH', 'All Crypto'],
        predictedImpact: 8.5,
        confidence: 82,
        historicalPrecedent: 'Dec 2023 FOMC caused 5% BTC pump',
        analysis: 'Markets pricing in pause. Dovish surprise could trigger 10%+ rally.'
      },
      {
        id: '2',
        event: 'Ethereum Dencun Upgrade',
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Protocol',
        affectedAssets: ['ETH', 'ARB', 'OP', 'MATIC', 'STRK'],
        predictedImpact: 12.5,
        confidence: 78,
        historicalPrecedent: 'Shanghai upgrade led to 15% rally',
        analysis: 'Proto-danksharding to reduce L2 fees 10x. Bullish for entire L2 ecosystem.'
      },
      {
        id: '3',
        event: 'ARB Token Unlock',
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Token Event',
        affectedAssets: ['ARB'],
        predictedImpact: -7.5,
        confidence: 85,
        historicalPrecedent: 'Previous unlock caused 12% drop',
        analysis: '92.65M ARB unlocking for team. Expect selling pressure but may be priced in.'
      },
      {
        id: '4',
        event: 'Grayscale ETH ETF Decision',
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Regulatory',
        affectedAssets: ['ETH', 'LDO', 'RPL'],
        predictedImpact: 15.0,
        confidence: 65,
        historicalPrecedent: 'BTC ETF approval led to 25% rally',
        analysis: 'Approval would be massive catalyst. Rejection could cause 10% drop.'
      },
      {
        id: '5',
        event: 'Bitcoin Halving',
        date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Protocol',
        affectedAssets: ['BTC', 'Mining Stocks'],
        predictedImpact: 25.0,
        confidence: 72,
        historicalPrecedent: '2020 halving preceded 500% rally',
        analysis: 'Supply shock historically leads to major bull run 6-12 months post-halving.'
      }
    ];

    this.setCache(cacheKey, events, 1800000); // 30 min cache
    return events;
  }

  async getAnomalies(): Promise<MarketAnomaly[]> {
    const cacheKey = 'market_anomalies';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const anomalies: MarketAnomaly[] = [
      {
        id: '1',
        type: 'Unusual Volume Spike',
        asset: 'PEPE',
        severity: 'warning',
        description: 'Volume 5x higher than 7-day average without corresponding price move',
        detectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        metrics: { volumeRatio: 5.2, priceChange: 1.2 },
        recommendation: 'Possible accumulation phase before move. Watch for breakout.'
      },
      {
        id: '2',
        type: 'Funding Rate Extreme',
        asset: 'SOL',
        severity: 'critical',
        description: 'Funding rate at 0.08% - extremely elevated for perps',
        detectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        metrics: { fundingRate: 0.08, openInterest: 2100000000 },
        recommendation: 'High leverage longs crowded. Squeeze risk elevated.'
      },
      {
        id: '3',
        type: 'Whale Accumulation',
        asset: 'LINK',
        severity: 'info',
        description: '3 wallets accumulated 2.5M LINK in past 24h',
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metrics: { totalAccumulated: 2500000, walletCount: 3 },
        recommendation: 'Smart money positioning. Consider following trend.'
      },
      {
        id: '4',
        type: 'Correlation Breakdown',
        asset: 'BTC/ETH',
        severity: 'warning',
        description: 'BTC/ETH correlation dropped from 0.92 to 0.65 in 48h',
        detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        metrics: { currentCorr: 0.65, previousCorr: 0.92 },
        recommendation: 'Rotation happening. ETH may outperform short-term.'
      },
      {
        id: '5',
        type: 'Options Put/Call Skew',
        asset: 'ETH',
        severity: 'info',
        description: 'Put/Call ratio dropped to 0.4 - extremely bullish positioning',
        detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        metrics: { putCallRatio: 0.4, callOI: 850000000 },
        recommendation: 'Market very bullish. Could indicate complacency.'
      }
    ];

    this.setCache(cacheKey, anomalies, 300000); // 5 min cache
    return anomalies;
  }

  async getCryptoConferences(): Promise<CryptoConference[]> {
    const cacheKey = 'crypto_conferences';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const conferences: CryptoConference[] = [
      {
        id: '1',
        name: 'ETHDenver 2025',
        location: 'Denver, Colorado',
        startDate: '2025-02-23',
        endDate: '2025-03-02',
        website: 'https://ethdenver.com',
        expectedAttendees: '20,000+',
        notableAnnouncements: ['Major L2 launches', 'ETH roadmap updates', 'DeFi protocols'],
        relevantTokens: ['ETH', 'ARB', 'OP', 'MATIC'],
        tier: 'major'
      },
      {
        id: '2',
        name: 'Token2049 Dubai',
        location: 'Dubai, UAE',
        startDate: '2025-04-30',
        endDate: '2025-05-01',
        website: 'https://token2049.com',
        expectedAttendees: '15,000+',
        notableAnnouncements: ['VC announcements', 'Major partnerships', 'New token launches'],
        relevantTokens: ['BTC', 'ETH', 'SOL', 'BNB'],
        tier: 'major'
      },
      {
        id: '3',
        name: 'Consensus 2025',
        location: 'Austin, Texas',
        startDate: '2025-05-14',
        endDate: '2025-05-16',
        website: 'https://consensus.coindesk.com',
        expectedAttendees: '15,000+',
        notableAnnouncements: ['Institutional announcements', 'Regulatory updates', 'Enterprise adoption'],
        relevantTokens: ['BTC', 'ETH', 'XRP', 'LINK'],
        tier: 'major'
      },
      {
        id: '4',
        name: 'Solana Breakpoint',
        location: 'Singapore',
        startDate: '2025-09-20',
        endDate: '2025-09-22',
        website: 'https://breakpoint.solana.com',
        expectedAttendees: '5,000+',
        notableAnnouncements: ['Solana ecosystem updates', 'New protocols', 'Gaming launches'],
        relevantTokens: ['SOL', 'JTO', 'JUP', 'BONK'],
        tier: 'major'
      },
      {
        id: '5',
        name: 'Korea Blockchain Week',
        location: 'Seoul, South Korea',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        website: 'https://koreablockchainweek.com',
        expectedAttendees: '8,000+',
        notableAnnouncements: ['Asian market updates', 'Gaming/NFT projects', 'Exchange announcements'],
        relevantTokens: ['KLAY', 'WEMIX', 'IMX'],
        tier: 'notable'
      },
      {
        id: '6',
        name: 'DevConnect',
        location: 'Buenos Aires, Argentina',
        startDate: '2025-11-15',
        endDate: '2025-11-22',
        website: 'https://devconnect.org',
        expectedAttendees: '10,000+',
        notableAnnouncements: ['Technical updates', 'Protocol upgrades', 'Developer tools'],
        relevantTokens: ['ETH', 'GRT', 'LDO'],
        tier: 'notable'
      },
      {
        id: '7',
        name: 'Paris Blockchain Week',
        location: 'Paris, France',
        startDate: '2025-04-08',
        endDate: '2025-04-10',
        website: 'https://parisblockchainweek.com',
        expectedAttendees: '8,000+',
        notableAnnouncements: ['European regulations', 'DeFi updates', 'NFT projects'],
        relevantTokens: ['ETH', 'AAVE', 'SNX'],
        tier: 'notable'
      },
      {
        id: '8',
        name: 'Mainnet by Messari',
        location: 'New York City',
        startDate: '2025-10-06',
        endDate: '2025-10-08',
        website: 'https://mainnet.events',
        expectedAttendees: '3,000+',
        notableAnnouncements: ['Research releases', 'Industry analysis', 'Protocol updates'],
        relevantTokens: ['Various'],
        tier: 'notable'
      }
    ];

    this.setCache(cacheKey, conferences, 86400000); // 24 hour cache
    return conferences;
  }
}

export const alphaIntelligenceService = AlphaIntelligenceService.getInstance();
