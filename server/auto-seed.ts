import { db } from './db';
import { knowledgeAvatars, users, aiAgents, predictionMarkets, predictionLeagues, learningModules, learningLessons, liveStreams, streamRecordings } from '@shared/schema';
import { eq } from 'drizzle-orm';

const avatarSeedData = [
  {
    name: 'Marc Andreessen',
    handle: 'pmarca',
    bio: 'Co-founder of a16z, Netscape pioneer, and legendary tech investor. Managing $35B+ AUM with deep crypto conviction.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1588992599668527104/Lx1Vqr2T_400x400.jpg',
    portfolioRoi: 26.35,
    riskScore: 42,
    investmentFocus: ['Infrastructure', 'DeFi', 'Layer-1 Blockchains', 'Web3'],
    totalInvestments: 50,
    successfulExits: 15,
    activeProjects: 25,
    accuracyPercentage: 68,
    volatility: 35,
    sharpeRatio: 1.8,
    alphaGenerated: 18.5,
    followerCount: 987000,
    isActive: true,
    // Trading Persona
    tradingStyle: 'value',
    expertiseDomains: ['infrastructure', 'l1', 'defi', 'web3'],
    riskTolerance: 'moderate',
    maxPositionPct: 15,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 150000,
  },
  {
    name: 'Chris Dixon',
    handle: 'cdixon',
    bio: 'CEO of a16z crypto, author of "Read Write Own". Leading $7.6B in crypto investments, building the next internet.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1736453777705750528/A68RBCbN_400x400.jpg',
    portfolioRoi: 26.35,
    riskScore: 45,
    investmentFocus: ['Web3', 'NFTs', 'Layer-2', 'Zero-Knowledge'],
    totalInvestments: 75,
    successfulExits: 22,
    activeProjects: 35,
    accuracyPercentage: 72,
    volatility: 38,
    sharpeRatio: 1.9,
    alphaGenerated: 20.2,
    followerCount: 654000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['web3', 'nft', 'l2', 'zk'],
    riskTolerance: 'moderate',
    maxPositionPct: 12,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 140000,
  },
  {
    name: 'Gavin Wood',
    handle: 'gavofyork',
    bio: 'Ethereum co-founder, Polkadot creator. Built Solidity, pioneered multi-chain future. Net worth $400-500M.',
    imageUrl: 'https://pbs.twimg.com/profile_images/981390366656098304/RrvaVRjJ_400x400.jpg',
    portfolioRoi: 45.0,
    riskScore: 55,
    investmentFocus: ['Multi-chain', 'Parachains', 'Substrate', 'Governance'],
    totalInvestments: 8,
    successfulExits: 2,
    activeProjects: 6,
    accuracyPercentage: 78,
    volatility: 62,
    sharpeRatio: 1.4,
    alphaGenerated: 32.8,
    followerCount: 423000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['l1', 'infrastructure', 'governance', 'interoperability'],
    riskTolerance: 'moderate',
    maxPositionPct: 10,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 130000,
  },
  {
    name: 'Charles Hoskinson',
    handle: 'IOHK_Charles',
    bio: 'Cardano founder, Ethereum co-founder. Proof-of-stake pioneer. ADA delivered 60% gains in 2024 despite volatility.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1832897923046715392/5_c9S9OQ_400x400.jpg',
    portfolioRoi: 60.0,
    riskScore: 58,
    investmentFocus: ['Proof-of-Stake', 'Smart Contracts', 'Governance', 'Africa Adoption'],
    totalInvestments: 12,
    successfulExits: 3,
    activeProjects: 8,
    accuracyPercentage: 65,
    volatility: 68,
    sharpeRatio: 1.2,
    alphaGenerated: 42.5,
    followerCount: 892000,
    isActive: true,
    tradingStyle: 'contrarian',
    expertiseDomains: ['l1', 'governance', 'infrastructure', 'emerging_markets'],
    riskTolerance: 'aggressive',
    maxPositionPct: 20,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 120000,
  },
  {
    name: 'Brad Garlinghouse',
    handle: 'bgarlinghouse',
    bio: 'Ripple CEO. XRP surged 350% in 2024 after SEC victory. Building cross-border payment infrastructure at scale.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1747698969726038016/m7XvJZHU_400x400.jpg',
    portfolioRoi: 350.0,
    riskScore: 52,
    investmentFocus: ['Cross-border Payments', 'Enterprise Blockchain', 'CBDCs', 'Banking'],
    totalInvestments: 18,
    successfulExits: 8,
    activeProjects: 12,
    accuracyPercentage: 82,
    volatility: 72,
    sharpeRatio: 2.1,
    alphaGenerated: 285.0,
    followerCount: 567000,
    isActive: true,
    tradingStyle: 'momentum',
    expertiseDomains: ['payments', 'infrastructure', 'enterprise', 'regulatory'],
    riskTolerance: 'moderate',
    maxPositionPct: 15,
    decisionBias: 'news_driven',
    tradingFrequency: 'weekly',
    streamBalance: 145000,
  },
  {
    name: 'Jesse Powell',
    handle: 'jespow',
    bio: 'Kraken founder. Built exchange with $1.5B revenue in 2024. Early Bitcoin miner, crypto OG since 2011.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1576705854044094465/xhfJLaMT_400x400.jpg',
    portfolioRoi: 95.0,
    riskScore: 38,
    investmentFocus: ['Exchanges', 'Custody', 'Derivatives', 'Institutional'],
    totalInvestments: 15,
    successfulExits: 6,
    activeProjects: 10,
    accuracyPercentage: 76,
    volatility: 42,
    sharpeRatio: 1.7,
    alphaGenerated: 68.3,
    followerCount: 234000,
    isActive: true,
    tradingStyle: 'dip_buyer',
    expertiseDomains: ['bitcoin', 'infrastructure', 'exchange', 'custody'],
    riskTolerance: 'conservative',
    maxPositionPct: 8,
    decisionBias: 'technical',
    tradingFrequency: 'opportunistic',
    streamBalance: 160000,
  },
  {
    name: 'Hayden Adams',
    handle: 'haydenzadams',
    bio: 'Uniswap founder. Built the DEX that changed DeFi forever. Net worth $350-550M, protocol does $100M+ fees monthly.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1747697084084080640/ZnAwlLkA_400x400.jpg',
    portfolioRoi: 105.5,
    riskScore: 48,
    investmentFocus: ['DEX', 'AMM', 'DeFi Protocols', 'Liquidity'],
    totalInvestments: 22,
    successfulExits: 7,
    activeProjects: 15,
    accuracyPercentage: 73,
    volatility: 58,
    sharpeRatio: 1.6,
    alphaGenerated: 78.2,
    followerCount: 445000,
    isActive: true,
    tradingStyle: 'swing_trader',
    expertiseDomains: ['defi', 'dex', 'amm', 'liquidity'],
    riskTolerance: 'aggressive',
    maxPositionPct: 18,
    decisionBias: 'technical',
    tradingFrequency: 'daily',
    streamBalance: 175000,
  },
  {
    name: 'Stani Kulechov',
    handle: 'StaniKulechov',
    bio: 'Aave founder, Lens Protocol creator. AAVE up 200%+ in 2024, protocol revenue $389M. DeFi infrastructure pioneer.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1632753754086490112/K8-yrCG7_400x400.jpg',
    portfolioRoi: 244.0,
    riskScore: 46,
    investmentFocus: ['Lending Protocols', 'Social DeFi', 'Stablecoins', 'Governance'],
    totalInvestments: 28,
    successfulExits: 9,
    activeProjects: 18,
    accuracyPercentage: 79,
    volatility: 52,
    sharpeRatio: 2.0,
    alphaGenerated: 188.5,
    followerCount: 358000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['defi', 'lending', 'social', 'stablecoins'],
    riskTolerance: 'moderate',
    maxPositionPct: 12,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 155000,
  },
  {
    name: 'Arthur Hayes',
    handle: 'CryptoHayes',
    bio: 'BitMEX co-founder, Maelstrom Fund (60% BTC, 20% ETH). Predicts BTC $250K by 2025. Contrarian macro trader.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1732458911752720384/cBwthR0U_400x400.jpg',
    portfolioRoi: 85.0,
    riskScore: 62,
    investmentFocus: ['Bitcoin', 'Macro Trading', 'Infrastructure', 'Early-stage'],
    totalInvestments: 20,
    successfulExits: 5,
    activeProjects: 16,
    accuracyPercentage: 71,
    volatility: 75,
    sharpeRatio: 1.5,
    alphaGenerated: 58.7,
    followerCount: 678000,
    isActive: true,
    tradingStyle: 'contrarian',
    expertiseDomains: ['bitcoin', 'macro', 'derivatives', 'infrastructure'],
    riskTolerance: 'aggressive',
    maxPositionPct: 25,
    decisionBias: 'sentiment',
    tradingFrequency: 'daily',
    streamBalance: 200000,
  },
  {
    name: 'Andre Cronje',
    handle: 'AndreCronjeTech',
    bio: 'Yearn Finance, Fantom, Solidly founder. DeFi architect despite 2024 headwinds. Building next-gen protocols.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1775942248616484864/n9nnO-ZY_400x400.jpg',
    portfolioRoi: -42.6,
    riskScore: 72,
    investmentFocus: ['Yield Optimization', 'Layer-1', 'DeFi Primitives', 'Innovation'],
    totalInvestments: 25,
    successfulExits: 8,
    activeProjects: 14,
    accuracyPercentage: 62,
    volatility: 88,
    sharpeRatio: 0.8,
    alphaGenerated: -12.3,
    followerCount: 512000,
    isActive: true,
    tradingStyle: 'momentum',
    expertiseDomains: ['defi', 'yield', 'l1', 'innovation'],
    riskTolerance: 'aggressive',
    maxPositionPct: 30,
    decisionBias: 'technical',
    tradingFrequency: 'daily',
    streamBalance: 90000,
  },
  {
    name: 'Robert Leshner',
    handle: 'rleshner',
    bio: 'Compound founder, Robot Ventures partner. 149 investments across DeFi. Building Superstate for institutional TradFi.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1605254184929259520/KHVu3Gp7_400x400.jpg',
    portfolioRoi: 42.0,
    riskScore: 44,
    investmentFocus: ['DeFi', 'Lending', 'Institutional', 'Infrastructure'],
    totalInvestments: 149,
    successfulExits: 28,
    activeProjects: 85,
    accuracyPercentage: 68,
    volatility: 48,
    sharpeRatio: 1.5,
    alphaGenerated: 28.5,
    followerCount: 287000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['defi', 'lending', 'institutional', 'infrastructure'],
    riskTolerance: 'conservative',
    maxPositionPct: 8,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 180000,
  },
  {
    name: 'Justin Sun',
    handle: 'justinsuntron',
    bio: 'Tron founder. $700M portfolio growth in 2024. TRX hit ATH $0.44. Leading stablecoin adoption ($60B on Tron).',
    imageUrl: 'https://pbs.twimg.com/profile_images/1748015772814004224/bpIu9yYU_400x400.jpg',
    portfolioRoi: 156.0,
    riskScore: 68,
    investmentFocus: ['Layer-1', 'Stablecoins', 'DeFi', 'NFTs'],
    totalInvestments: 32,
    successfulExits: 12,
    activeProjects: 22,
    accuracyPercentage: 64,
    volatility: 82,
    sharpeRatio: 1.3,
    alphaGenerated: 98.4,
    followerCount: 3200000,
    isActive: true,
    tradingStyle: 'momentum',
    expertiseDomains: ['l1', 'stablecoins', 'nft', 'memecoins'],
    riskTolerance: 'aggressive',
    maxPositionPct: 25,
    decisionBias: 'sentiment',
    tradingFrequency: 'daily',
    streamBalance: 250000,
  },
  {
    name: 'Sam Altman',
    handle: 'sama',
    bio: 'OpenAI CEO, Y Combinator alum, Worldcoin founder. $2.8B portfolio (400+ cos). WLD surged 115% to ATH in 2024.',
    imageUrl: 'https://pbs.twimg.com/profile_images/804990434455887872/BG0Xh7Oa_400x400.jpg',
    portfolioRoi: 115.0,
    riskScore: 48,
    investmentFocus: ['AI', 'Digital Identity', 'Web3', 'Biotech'],
    totalInvestments: 400,
    successfulExits: 75,
    activeProjects: 180,
    accuracyPercentage: 82,
    volatility: 65,
    sharpeRatio: 1.9,
    alphaGenerated: 88.2,
    followerCount: 2800000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['ai_tokens', 'identity', 'infrastructure', 'innovation'],
    riskTolerance: 'moderate',
    maxPositionPct: 10,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 300000,
  },
  {
    name: 'Anatoly Yakovenko',
    handle: 'aeyakovenko',
    bio: 'Solana founder. SOL 800x since 2020, ATH $294 in 2025. Built fastest blockchain (65K TPS). Net worth $500M+.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1664690436350357504/VnZAdHqe_400x400.jpg',
    portfolioRoi: 285.0,
    riskScore: 56,
    investmentFocus: ['High-performance L1', 'DeFi', 'NFTs', 'Gaming'],
    totalInvestments: 45,
    successfulExits: 14,
    activeProjects: 30,
    accuracyPercentage: 76,
    volatility: 78,
    sharpeRatio: 2.2,
    alphaGenerated: 228.5,
    followerCount: 478000,
    isActive: true,
    tradingStyle: 'momentum',
    expertiseDomains: ['l1', 'defi', 'nft', 'gaming'],
    riskTolerance: 'aggressive',
    maxPositionPct: 20,
    decisionBias: 'technical',
    tradingFrequency: 'daily',
    streamBalance: 220000,
  },
  {
    name: 'Anthony Pompliano',
    handle: 'APompliano',
    bio: 'Bitcoin maximalist, ProCap founder. BTC delivered 120% in 2024. Raised $750M for Bitcoin treasury company.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1611819277492056066/F7q83pYt_400x400.jpg',
    portfolioRoi: 120.0,
    riskScore: 42,
    investmentFocus: ['Bitcoin', 'Bitcoin-native Services', 'Infrastructure', 'Media'],
    totalInvestments: 56,
    successfulExits: 18,
    activeProjects: 32,
    accuracyPercentage: 74,
    volatility: 48,
    sharpeRatio: 2.0,
    alphaGenerated: 92.8,
    followerCount: 1500000,
    isActive: true,
    tradingStyle: 'dip_buyer',
    expertiseDomains: ['bitcoin', 'infrastructure', 'media'],
    riskTolerance: 'moderate',
    maxPositionPct: 15,
    decisionBias: 'sentiment',
    tradingFrequency: 'opportunistic',
    streamBalance: 180000,
  },
  {
    name: 'Katie Haun',
    handle: 'katie_haun',
    bio: 'Haun Ventures founder, former a16z GP. $1.5B crypto fund, Coinbase board member. Ex-federal prosecutor specializing in crypto.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1580265953881731075/YtlQDVmJ_400x400.jpg',
    portfolioRoi: 38.0,
    riskScore: 48,
    investmentFocus: ['Infrastructure', 'Consumer Crypto', 'DeFi', 'Web3'],
    totalInvestments: 42,
    successfulExits: 12,
    activeProjects: 28,
    accuracyPercentage: 72,
    volatility: 52,
    sharpeRatio: 1.6,
    alphaGenerated: 25.8,
    followerCount: 380000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['infrastructure', 'consumer', 'defi', 'regulatory'],
    riskTolerance: 'conservative',
    maxPositionPct: 8,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 165000,
  },
  {
    name: 'Adam Back',
    handle: 'adam3us',
    bio: 'Blockstream CEO, Hashcash inventor (Bitcoin PoW predecessor). Cited in Bitcoin whitepaper. Early Bitcoin adopter since 2013.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1592266468546756608/kQdQ8ZXw_400x400.jpg',
    portfolioRoi: 125.0,
    riskScore: 38,
    investmentFocus: ['Bitcoin Core', 'Layer-2', 'Sidechains', 'Mining'],
    totalInvestments: 18,
    successfulExits: 6,
    activeProjects: 12,
    accuracyPercentage: 82,
    volatility: 42,
    sharpeRatio: 2.1,
    alphaGenerated: 95.2,
    followerCount: 567000,
    isActive: true,
    tradingStyle: 'dip_buyer',
    expertiseDomains: ['bitcoin', 'l2', 'mining', 'infrastructure'],
    riskTolerance: 'conservative',
    maxPositionPct: 10,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 190000,
  },
  // Additional high-profile avatars
  {
    name: 'Vitalik Buterin',
    handle: 'VitalikButerin',
    bio: 'Ethereum co-founder. Built the world computer. Promotes decentralization, quadratic voting, and public goods.',
    imageUrl: 'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_400x400.jpg',
    portfolioRoi: 180.0,
    riskScore: 52,
    investmentFocus: ['Ethereum', 'Public Goods', 'ZK Proofs', 'Decentralization'],
    accuracyPercentage: 85,
    volatility: 55,
    followerCount: 5100000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['l1', 'zk', 'public_goods', 'governance'],
    riskTolerance: 'moderate',
    maxPositionPct: 10,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 280000,
  },
  {
    name: 'Cathie Wood',
    handle: 'CathieDWood',
    bio: 'ARK Invest CEO. Disruptive innovation investor. Bitcoin ETF pioneer. Believes BTC will reach $1M.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1494041294858653696/qVvSCKX1_400x400.jpg',
    portfolioRoi: 45.0,
    riskScore: 65,
    investmentFocus: ['Bitcoin', 'AI', 'Genomics', 'Innovation'],
    accuracyPercentage: 62,
    volatility: 78,
    followerCount: 1500000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['bitcoin', 'ai_tokens', 'innovation', 'etf'],
    riskTolerance: 'aggressive',
    maxPositionPct: 20,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 200000,
  },
  {
    name: 'Brian Armstrong',
    handle: 'brian_armstrong',
    bio: 'Coinbase CEO. Built the largest US crypto exchange. Advocate for clear crypto regulation.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1597316017333374976/lIgcN4MA_400x400.jpg',
    portfolioRoi: 85.0,
    riskScore: 45,
    investmentFocus: ['Infrastructure', 'Compliance', 'Base L2', 'Consumer Crypto'],
    accuracyPercentage: 75,
    volatility: 48,
    followerCount: 1800000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['infrastructure', 'l2', 'exchange', 'regulatory'],
    riskTolerance: 'conservative',
    maxPositionPct: 8,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 195000,
  },
  {
    name: 'Changpeng Zhao',
    handle: 'cz_binance',
    bio: 'Binance founder. Built the world largest crypto exchange. BNB ecosystem leader.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1590068999214624770/Ge4C4Xpm_400x400.jpg',
    portfolioRoi: 320.0,
    riskScore: 58,
    investmentFocus: ['Exchange', 'BNB Chain', 'DeFi', 'Global Expansion'],
    accuracyPercentage: 78,
    volatility: 65,
    followerCount: 8900000,
    isActive: true,
    tradingStyle: 'momentum',
    expertiseDomains: ['exchange', 'l1', 'defi', 'global'],
    riskTolerance: 'aggressive',
    maxPositionPct: 25,
    decisionBias: 'sentiment',
    tradingFrequency: 'daily',
    streamBalance: 350000,
  },
  {
    name: 'Michael Saylor',
    handle: 'saylor',
    bio: 'MicroStrategy founder. Corporate Bitcoin treasury pioneer. Over 200K BTC accumulated.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1596941221891792897/4OLFKV5L_400x400.jpg',
    portfolioRoi: 145.0,
    riskScore: 35,
    investmentFocus: ['Bitcoin', 'Treasury', 'Corporate Strategy', 'Education'],
    accuracyPercentage: 88,
    volatility: 42,
    followerCount: 3200000,
    isActive: true,
    tradingStyle: 'dip_buyer',
    expertiseDomains: ['bitcoin', 'treasury', 'corporate'],
    riskTolerance: 'moderate',
    maxPositionPct: 50,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 400000,
  },
  {
    name: 'Naval Ravikant',
    handle: 'naval',
    bio: 'AngelList founder. Philosopher-investor. Early Bitcoin adopter. Wisdom on wealth and happiness.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1256841238298292232/ycqwaMI2_400x400.jpg',
    portfolioRoi: 95.0,
    riskScore: 38,
    investmentFocus: ['Bitcoin', 'Startups', 'Philosophy', 'Technology'],
    accuracyPercentage: 82,
    volatility: 35,
    followerCount: 2400000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['bitcoin', 'infrastructure', 'innovation'],
    riskTolerance: 'conservative',
    maxPositionPct: 8,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 175000,
  },
  {
    name: 'Balaji Srinivasan',
    handle: 'balajis',
    bio: 'Former Coinbase CTO, a16z partner. Network State author. Techno-optimist futurist.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1639354851099303936/Kg4kSY3d_400x400.jpg',
    portfolioRoi: 72.0,
    riskScore: 55,
    investmentFocus: ['Bitcoin', 'Network States', 'Decentralization', 'Technology'],
    accuracyPercentage: 75,
    volatility: 62,
    followerCount: 1100000,
    isActive: true,
    tradingStyle: 'contrarian',
    expertiseDomains: ['bitcoin', 'infrastructure', 'innovation', 'macro'],
    riskTolerance: 'moderate',
    maxPositionPct: 15,
    decisionBias: 'news_driven',
    tradingFrequency: 'weekly',
    streamBalance: 165000,
  },
  {
    name: 'Tyler Winklevoss',
    handle: 'tyler',
    bio: 'Gemini co-founder. Bitcoin billionaire. Olympic rower. Early crypto pioneer since 2012.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1546997861939257344/5RRtzMBX_400x400.jpg',
    portfolioRoi: 1200.0,
    riskScore: 42,
    investmentFocus: ['Bitcoin', 'Exchange', 'NFTs', 'Stablecoins'],
    accuracyPercentage: 80,
    volatility: 45,
    followerCount: 680000,
    isActive: true,
    tradingStyle: 'dip_buyer',
    expertiseDomains: ['bitcoin', 'exchange', 'nft', 'stablecoins'],
    riskTolerance: 'moderate',
    maxPositionPct: 12,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 185000,
  },
  {
    name: 'Cameron Winklevoss',
    handle: 'cameron',
    bio: 'Gemini co-founder. Bitcoin billionaire. Twin brother of Tyler. Crypto regulation advocate.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1533527413884968960/hqXkdXpP_400x400.jpg',
    portfolioRoi: 1200.0,
    riskScore: 42,
    investmentFocus: ['Bitcoin', 'Ethereum', 'Regulation', 'NFTs'],
    accuracyPercentage: 80,
    volatility: 45,
    followerCount: 620000,
    isActive: true,
    tradingStyle: 'dip_buyer',
    expertiseDomains: ['bitcoin', 'exchange', 'regulatory', 'nft'],
    riskTolerance: 'moderate',
    maxPositionPct: 12,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 185000,
  },
  {
    name: 'Elon Musk',
    handle: 'elonmusk',
    bio: 'Tesla, SpaceX, xAI founder. Dogecoin influencer. Moved crypto markets with tweets.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg',
    portfolioRoi: 250.0,
    riskScore: 75,
    investmentFocus: ['Dogecoin', 'Bitcoin', 'AI', 'Technology'],
    accuracyPercentage: 65,
    volatility: 95,
    followerCount: 170000000,
    isActive: true,
    tradingStyle: 'momentum',
    expertiseDomains: ['memecoins', 'bitcoin', 'ai_tokens', 'innovation'],
    riskTolerance: 'aggressive',
    maxPositionPct: 30,
    decisionBias: 'sentiment',
    tradingFrequency: 'opportunistic',
    streamBalance: 500000,
  },
  {
    name: 'Peter Thiel',
    handle: 'peterthiel',
    bio: 'PayPal co-founder, Palantir founder. Contrarian investor. Early Facebook and Bitcoin backer.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1582048200952590337/4lIqRDLn_400x400.jpg',
    portfolioRoi: 85.0,
    riskScore: 48,
    investmentFocus: ['Bitcoin', 'Technology', 'Contrarian Bets', 'Infrastructure'],
    accuracyPercentage: 78,
    volatility: 52,
    followerCount: 450000,
    isActive: true,
    tradingStyle: 'contrarian',
    expertiseDomains: ['bitcoin', 'infrastructure', 'innovation'],
    riskTolerance: 'moderate',
    maxPositionPct: 15,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 220000,
  },
  {
    name: 'Jack Dorsey',
    handle: 'jack',
    bio: 'Block founder, Twitter co-founder. Bitcoin maximalist. Building decentralized social with Bluesky.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1115644092329758721/AFjOr-K8_400x400.jpg',
    portfolioRoi: 92.0,
    riskScore: 40,
    investmentFocus: ['Bitcoin', 'Lightning', 'Decentralization', 'Payments'],
    accuracyPercentage: 76,
    volatility: 48,
    followerCount: 6500000,
    isActive: true,
    tradingStyle: 'dip_buyer',
    expertiseDomains: ['bitcoin', 'payments', 'infrastructure', 'social'],
    riskTolerance: 'moderate',
    maxPositionPct: 15,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 210000,
  },
  {
    name: 'Do Kwon',
    handle: 'staboracle',
    bio: 'Terra/Luna founder. Controversial figure after $40B collapse. Facing legal challenges.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1507350147762843650/O1G8Bw-l_400x400.jpg',
    portfolioRoi: -99.0,
    riskScore: 95,
    investmentFocus: ['Stablecoins', 'DeFi', 'Layer-1', 'Algorithmic'],
    accuracyPercentage: 25,
    volatility: 100,
    followerCount: 890000,
    isActive: false,
    tradingStyle: 'momentum',
    expertiseDomains: ['stablecoins', 'l1', 'defi'],
    riskTolerance: 'aggressive',
    maxPositionPct: 50,
    decisionBias: 'technical',
    tradingFrequency: 'daily',
    streamBalance: 10000,
  },
  {
    name: 'Su Zhu',
    handle: 'zaboracle',
    bio: 'Three Arrows Capital co-founder. Faced $3.5B collapse. Lessons in leverage and risk.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1540096991007838208/Cn-_RMu-_400x400.jpg',
    portfolioRoi: -98.0,
    riskScore: 92,
    investmentFocus: ['Leveraged Trading', 'DeFi', 'Grayscale', 'Arbitrage'],
    accuracyPercentage: 30,
    volatility: 98,
    followerCount: 560000,
    isActive: false,
    tradingStyle: 'momentum',
    expertiseDomains: ['derivatives', 'defi', 'arbitrage'],
    riskTolerance: 'aggressive',
    maxPositionPct: 75,
    decisionBias: 'technical',
    tradingFrequency: 'daily',
    streamBalance: 5000,
  },
  {
    name: 'Rune Christensen',
    handle: 'RuneKek',
    bio: 'MakerDAO founder. DAI stablecoin creator. DeFi governance pioneer. Building Endgame.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1595895378057187328/YpWKFq4M_400x400.jpg',
    portfolioRoi: 125.0,
    riskScore: 48,
    investmentFocus: ['Stablecoins', 'Governance', 'DeFi', 'RWA'],
    accuracyPercentage: 74,
    volatility: 55,
    followerCount: 180000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['stablecoins', 'defi', 'governance', 'rwa'],
    riskTolerance: 'moderate',
    maxPositionPct: 12,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 170000,
  },
  {
    name: 'Elizabeth Stark',
    handle: 'staboraclene',
    bio: 'Lightning Labs CEO. Building Bitcoin Layer 2 scaling. Making payments instant and cheap.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1462089044711960577/CQ1X3c4D_400x400.jpg',
    portfolioRoi: 65.0,
    riskScore: 42,
    investmentFocus: ['Lightning Network', 'Bitcoin L2', 'Payments', 'Infrastructure'],
    accuracyPercentage: 72,
    volatility: 45,
    followerCount: 220000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['bitcoin', 'l2', 'payments', 'infrastructure'],
    riskTolerance: 'conservative',
    maxPositionPct: 10,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 145000,
  },
  {
    name: 'Jesse Pollak',
    handle: 'jessepollak',
    bio: 'Base creator. Coinbase Head of Protocols. Building the onchain future on Ethereum L2.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1685419959034167297/FD2fy0dG_400x400.jpg',
    portfolioRoi: 180.0,
    riskScore: 45,
    investmentFocus: ['Base L2', 'Ethereum', 'Onchain Apps', 'Infrastructure'],
    accuracyPercentage: 78,
    volatility: 52,
    followerCount: 380000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['l2', 'infrastructure', 'defi', 'consumer'],
    riskTolerance: 'moderate',
    maxPositionPct: 12,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 160000,
  },
  {
    name: 'Paul Graham',
    handle: 'paulg',
    bio: 'Y Combinator founder. Essay writer. Startup philosopher. Influenced generation of founders.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1824002576/pg-railsconf_400x400.jpg',
    portfolioRoi: 55.0,
    riskScore: 35,
    investmentFocus: ['Startups', 'Technology', 'Essays', 'Philosophy'],
    accuracyPercentage: 80,
    volatility: 28,
    followerCount: 1600000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['infrastructure', 'innovation', 'startups'],
    riskTolerance: 'conservative',
    maxPositionPct: 8,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 150000,
  },
  // ===== TECH MACRO LEADERS =====
  {
    name: 'Jensen Huang',
    handle: 'nvidia_ceo',
    bio: 'NVIDIA CEO. AI chip kingmaker. NVDA up 3000%+ in 5 years. Powering the AI revolution.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1861131798587768832/xIKqVPbS_400x400.jpg',
    portfolioRoi: 3200.0,
    riskScore: 55,
    investmentFocus: ['AI Chips', 'Data Centers', 'Gaming', 'Autonomous Vehicles'],
    accuracyPercentage: 92,
    volatility: 65,
    followerCount: 450000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['ai', 'semiconductors', 'tech_macro', 'nvidia'],
    riskTolerance: 'aggressive',
    maxPositionPct: 25,
    decisionBias: 'fundamental',
    tradingFrequency: 'quarterly',
    streamBalance: 500000,
  },
  {
    name: 'Satya Nadella',
    handle: 'satloraclenadella',
    bio: 'Microsoft CEO. Transformed MSFT with cloud & AI. Market cap from $300B to $3T under his leadership.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1221837516816306177/_Ld4un5A_400x400.jpg',
    portfolioRoi: 900.0,
    riskScore: 35,
    investmentFocus: ['Cloud Computing', 'Enterprise AI', 'Gaming', 'Productivity'],
    accuracyPercentage: 88,
    volatility: 32,
    followerCount: 3200000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['cloud', 'enterprise', 'tech_macro', 'microsoft'],
    riskTolerance: 'moderate',
    maxPositionPct: 15,
    decisionBias: 'fundamental',
    tradingFrequency: 'quarterly',
    streamBalance: 350000,
  },
  {
    name: 'Tim Cook',
    handle: 'tim_cook',
    bio: 'Apple CEO. Steered AAPL to $3T+ market cap. Master of supply chain and services growth.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1535420431766671360/Pwq-1eJc_400x400.jpg',
    portfolioRoi: 450.0,
    riskScore: 28,
    investmentFocus: ['Consumer Tech', 'Services', 'Wearables', 'Privacy'],
    accuracyPercentage: 85,
    volatility: 25,
    followerCount: 14000000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['consumer', 'hardware', 'tech_macro', 'apple'],
    riskTolerance: 'conservative',
    maxPositionPct: 10,
    decisionBias: 'fundamental',
    tradingFrequency: 'quarterly',
    streamBalance: 400000,
  },
  {
    name: 'Sundar Pichai',
    handle: 'sundarpichai',
    bio: 'Google/Alphabet CEO. Leading search, cloud, and AI innovation. GOOGL up 300%+ under his tenure.',
    imageUrl: 'https://pbs.twimg.com/profile_images/864282616597405701/M-FEJMZ0_400x400.jpg',
    portfolioRoi: 320.0,
    riskScore: 38,
    investmentFocus: ['Search', 'Cloud', 'AI/ML', 'Advertising'],
    accuracyPercentage: 82,
    volatility: 35,
    followerCount: 5800000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['ai', 'advertising', 'tech_macro', 'google'],
    riskTolerance: 'moderate',
    maxPositionPct: 12,
    decisionBias: 'fundamental',
    tradingFrequency: 'quarterly',
    streamBalance: 320000,
  },
  {
    name: 'Lisa Su',
    handle: 'LisaSu',
    bio: 'AMD CEO. Turned AMD around from near bankruptcy. Now competing with Intel and NVIDIA.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1061061127012110336/aHi_J4cY_400x400.jpg',
    portfolioRoi: 2800.0,
    riskScore: 52,
    investmentFocus: ['Semiconductors', 'CPUs', 'GPUs', 'Data Center'],
    accuracyPercentage: 86,
    volatility: 58,
    followerCount: 280000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['semiconductors', 'hardware', 'tech_macro', 'amd'],
    riskTolerance: 'aggressive',
    maxPositionPct: 20,
    decisionBias: 'fundamental',
    tradingFrequency: 'quarterly',
    streamBalance: 380000,
  },
  {
    name: 'Andy Jassy',
    handle: 'ajassy',
    bio: 'Amazon CEO. Built AWS into $100B+ business. Now leading Amazon through AI transformation.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1415705543715336192/xq1vyWJj_400x400.jpg',
    portfolioRoi: 180.0,
    riskScore: 42,
    investmentFocus: ['E-commerce', 'Cloud (AWS)', 'Logistics', 'AI'],
    accuracyPercentage: 79,
    volatility: 40,
    followerCount: 120000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['cloud', 'ecommerce', 'tech_macro', 'amazon'],
    riskTolerance: 'moderate',
    maxPositionPct: 15,
    decisionBias: 'fundamental',
    tradingFrequency: 'quarterly',
    streamBalance: 290000,
  },
  {
    name: 'Mark Zuckerberg',
    handle: 'faboraclezuck',
    bio: 'Meta CEO. Pivoted to metaverse and AI. META up 400%+ in 2023-2024 after efficiency push.',
    imageUrl: 'https://pbs.twimg.com/profile_images/77846223/profile_normal.jpg',
    portfolioRoi: 450.0,
    riskScore: 58,
    investmentFocus: ['Social Media', 'Metaverse', 'AI', 'VR/AR'],
    accuracyPercentage: 72,
    volatility: 62,
    followerCount: 120000,
    isActive: true,
    tradingStyle: 'contrarian',
    expertiseDomains: ['social', 'metaverse', 'tech_macro', 'meta'],
    riskTolerance: 'aggressive',
    maxPositionPct: 25,
    decisionBias: 'fundamental',
    tradingFrequency: 'quarterly',
    streamBalance: 420000,
  },
  {
    name: 'Jerome Powell',
    handle: 'federalreserve',
    bio: 'Federal Reserve Chair. Controls interest rates affecting all markets. Key macro driver.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Jerome_H._Powell.jpg/440px-Jerome_H._Powell.jpg',
    portfolioRoi: 0.0,
    riskScore: 15,
    investmentFocus: ['Monetary Policy', 'Interest Rates', 'Inflation', 'Employment'],
    accuracyPercentage: 75,
    volatility: 20,
    followerCount: 850000,
    isActive: true,
    tradingStyle: 'value',
    expertiseDomains: ['macro', 'fed', 'rates', 'economy'],
    riskTolerance: 'conservative',
    maxPositionPct: 5,
    decisionBias: 'fundamental',
    tradingFrequency: 'monthly',
    streamBalance: 200000,
  },
  {
    name: 'Cathie Wood',
    handle: 'CathieDWood',
    bio: 'ARK Invest CEO. Innovation investor. ARKK performance varies but she called TSLA early.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1322963091474731008/rOR1tBxq_400x400.jpg',
    portfolioRoi: -35.0,
    riskScore: 75,
    investmentFocus: ['Disruptive Innovation', 'Tesla', 'Genomics', 'Fintech'],
    accuracyPercentage: 55,
    volatility: 85,
    followerCount: 1500000,
    isActive: true,
    tradingStyle: 'contrarian',
    expertiseDomains: ['innovation', 'tech_macro', 'tesla', 'growth'],
    riskTolerance: 'aggressive',
    maxPositionPct: 30,
    decisionBias: 'fundamental',
    tradingFrequency: 'weekly',
    streamBalance: 180000,
  },
  {
    name: 'Sam Altman',
    handle: 'sama',
    bio: 'OpenAI CEO. Leading the AI revolution with GPT. Most influential figure in AI today.',
    imageUrl: 'https://pbs.twimg.com/profile_images/804990434455887872/BG0Xh7Oa_400x400.jpg',
    portfolioRoi: 500.0,
    riskScore: 48,
    investmentFocus: ['AI/AGI', 'Startups', 'Nuclear Energy', 'Worldcoin'],
    accuracyPercentage: 88,
    volatility: 55,
    followerCount: 3200000,
    isActive: true,
    tradingStyle: 'growth',
    expertiseDomains: ['ai', 'startups', 'tech_macro', 'openai'],
    riskTolerance: 'aggressive',
    maxPositionPct: 20,
    decisionBias: 'fundamental',
    tradingFrequency: 'opportunistic',
    streamBalance: 450000,
  }
];

export async function autoSeedDatabase() {
  try {
    // ===== SEED KNOWLEDGE AVATARS (IDEMPOTENT) =====
    const existingAvatars = await db.query.knowledgeAvatars.findMany();
    const targetAvatarCount = avatarSeedData.length;
    
    if (existingAvatars.length < targetAvatarCount) {
      console.log(`🌱 Auto-seeding knowledge avatars (${existingAvatars.length}/${targetAvatarCount} exist)...`);
      
      const existingHandles = new Set(existingAvatars.map(a => a.handle));
      const avatarsToCreate = avatarSeedData.filter(a => !existingHandles.has(a.handle));
      
      let seededCount = 0;
      for (const avatar of avatarsToCreate) {
        try {
          await db.insert(knowledgeAvatars).values(avatar);
          seededCount++;
        } catch (error) {
          console.error(`❌ Error seeding avatar ${avatar.name}:`, error);
        }
      }
      
      console.log(`🎉 Added ${seededCount} new knowledge avatars (${existingAvatars.length + seededCount}/${targetAvatarCount} total)`);
    } else {
      console.log(`✅ Knowledge avatars complete (${existingAvatars.length}/${targetAvatarCount})`);
    }

    // ===== SEED 100 AUTONOMOUS AI AGENTS (IDEMPOTENT) =====
    const existingAgents = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.isAiAgent, true));
    
    const targetAgentCount = 100;
    
    if (existingAgents.length < targetAgentCount) {
      console.log(`\n🤖 Auto-seeding AI agents (${existingAgents.length}/${targetAgentCount} exist)...`);
      
      const agentsNeeded = targetAgentCount - existingAgents.length;
      
      // Import agent initialization function
      const { generateAgentPersonas } = await import('./services/agentPersonaGenerator');
      const personas = generateAgentPersonas(agentsNeeded);
      
      const existingUsernames = new Set(existingAgents.map(a => a.username));
      const personasToCreate = personas.filter(p => !existingUsernames.has(p.username));
      
      let agentCount = 0;
      for (const persona of personasToCreate) {
        try {
          await db.insert(users).values({
            username: persona.username,
            bio: persona.bio,
            avatar: persona.avatar,
            isAiAgent: true,
            agentPersonality: persona.personality,
            agentMetadata: persona.metadata,
            streamPoints: persona.streamPoints,
            authProvider: 'ai-agent',
            walletAddress: `0x${Buffer.from(persona.username).toString('hex').padEnd(40, '0').substring(0, 40)}`,
          });
          
          agentCount++;
          if (agentCount % 25 === 0) {
            console.log(`  ✓ Created ${agentCount}/${agentsNeeded} new AI agents...`);
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to create agent ${persona.username}:`, error.message);
        }
      }
      
      const totalPoints = personas.reduce((sum, p) => sum + p.streamPoints, 0);
      console.log(`🎉 Added ${agentCount} new AI agents (${existingAgents.length + agentCount}/${targetAgentCount} total)`);
      console.log(`💰 Distributed ${totalPoints.toLocaleString()} STREAM points to new agents`);
    } else {
      console.log(`✅ AI agents complete (${existingAgents.length}/${targetAgentCount})`);
    }

    // ===== SEED 50 AI TRADING BOTS (IDEMPOTENT) =====
    const existingTradingBots = await db
      .select({ id: aiAgents.id, name: aiAgents.name })
      .from(aiAgents);
    
    const targetBotCount = 50;
    
    if (existingTradingBots.length < targetBotCount) {
      console.log(`\n💹 Auto-seeding trading bots (${existingTradingBots.length}/${targetBotCount} exist)...`);
      
      // Import trading bot generator
      const { TRADING_BOTS, getBotDistributionStats } = await import('./services/tradingBotPersonaGenerator');
      
      const existingBotNames = new Set(existingTradingBots.map(b => b.name));
      const botsToCreate = TRADING_BOTS.filter(b => !existingBotNames.has(b.name));
      
      let botCount = 0;
      for (const bot of botsToCreate) {
        try {
          await db.insert(aiAgents).values({
            name: bot.name,
            personality: bot.personality,
            description: bot.description,
            avatar: bot.avatar,
            strategy: bot.strategy,
            riskTolerance: bot.riskTolerance,
            confidenceThreshold: bot.confidenceThreshold,
            isActive: true,
          });
          
          botCount++;
          if (botCount % 10 === 0) {
            console.log(`  ✓ Created ${botCount}/${botsToCreate.length} new trading bots...`);
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to create bot ${bot.name}:`, error.message);
        }
      }
      
      const stats = getBotDistributionStats();
      console.log(`🎉 Added ${botCount} new trading bots (${existingTradingBots.length + botCount}/${targetBotCount} total)`);
      console.log(`💰 Total trading capital: ${stats.totalStreamPoints.toLocaleString()} STREAM`);
    } else {
      console.log(`✅ Trading bots complete (${existingTradingBots.length}/${targetBotCount})`);
    }

    // ===== SEED PREDICTION MARKETS (IDEMPOTENT) =====
    const existingMarkets = await db
      .select({ id: predictionMarkets.id, question: predictionMarkets.question })
      .from(predictionMarkets);
    
    const targetMarketCount = 21; // 11 crypto/defi + 10 tech stock/macro markets
    
    if (existingMarkets.length < targetMarketCount) {
      console.log(`\n📊 Auto-seeding prediction markets (${existingMarkets.length}/${targetMarketCount} exist)...`);
      
      const marketSeeds = [
        {
          question: "Will Bitcoin reach $150,000 by end of 2025?",
          description: "This market resolves to YES if Bitcoin (BTC) reaches or exceeds $150,000 USD on any major exchange (Coinbase, Binance, Kraken) before December 31, 2025 11:59 PM UTC.",
          category: "crypto" as const,
          deadline: new Date("2025-12-31T23:59:59Z"),
          initialLiquidity: 2000,
          resolutionSource: "CoinGecko API",
          tags: ["bitcoin", "price", "2025"],
        },
        {
          question: "Will Ethereum complete the full sharding upgrade by Q4 2025?",
          description: "Resolves YES if Ethereum successfully deploys full data sharding (all phases complete) to mainnet by December 31, 2025. Partial sharding or testnet-only doesn't count.",
          category: "crypto" as const,
          deadline: new Date("2025-12-31T23:59:59Z"),
          initialLiquidity: 1500,
          resolutionSource: "Ethereum Foundation official announcements",
          tags: ["ethereum", "upgrade", "sharding"],
        },
        {
          question: "Will any StreamAiX bounty exceed 1,000 STREAM tokens reward?",
          description: "This market resolves YES if any single bounty on StreamAiX platform has a total reward pool exceeding 1,000 STREAM tokens before the deadline.",
          category: "bounty" as const,
          deadline: new Date("2025-06-30T23:59:59Z"),
          initialLiquidity: 1000,
          resolutionSource: "StreamAiX platform data",
          tags: ["bounty", "stream", "rewards"],
        },
        {
          question: "Will Uniswap V4 launch on mainnet before Q2 2026?",
          description: "Resolves YES if Uniswap V4 is deployed and operational on Ethereum mainnet before April 1, 2026. Testnet deployments don't count.",
          category: "defi" as const,
          deadline: new Date("2026-03-31T23:59:59Z"),
          initialLiquidity: 1800,
          resolutionSource: "Uniswap official channels",
          tags: ["uniswap", "defi", "dex"],
        },
        {
          question: "Will US inflation rate drop below 2% in 2025?",
          description: "This market resolves YES if the US Consumer Price Index (CPI) year-over-year inflation rate falls below 2.0% in any month during 2025, as reported by the Bureau of Labor Statistics.",
          category: "realworld" as const,
          deadline: new Date("2025-12-31T23:59:59Z"),
          initialLiquidity: 2000,
          resolutionSource: "US Bureau of Labor Statistics",
          tags: ["inflation", "economy", "usa"],
        },
        {
          question: "Will StreamAiX platform reach 10,000 registered users by year end?",
          description: "Resolves YES if StreamAiX has 10,000 or more registered user accounts by December 31, 2025 11:59 PM UTC.",
          category: "community" as const,
          deadline: new Date("2025-12-31T23:59:59Z"),
          initialLiquidity: 1200,
          resolutionSource: "StreamAiX platform metrics",
          tags: ["streamaix", "growth", "users"],
        },
        {
          question: "Will total value locked in DeFi exceed $200B by end of Q1 2026?",
          description: "This market resolves YES if the total value locked (TVL) across all DeFi protocols exceeds $200 billion USD by March 31, 2026, as measured by DeFiLlama.",
          category: "defi" as const,
          deadline: new Date("2026-03-31T23:59:59Z"),
          initialLiquidity: 1500,
          resolutionSource: "DeFiLlama",
          tags: ["defi", "tvl", "growth"],
        },
        {
          question: "Will Solana network have zero major outages in next 6 months?",
          description: "Resolves YES if Solana mainnet has ZERO outages lasting more than 30 minutes between now and April 9, 2026. Any network halt or consensus failure counts as outage.",
          category: "crypto" as const,
          deadline: new Date("2026-04-09T23:59:59Z"),
          initialLiquidity: 1000,
          resolutionSource: "Solana Status & blockchain data",
          tags: ["solana", "reliability", "network"],
        },
        {
          question: "Will a StreamAiX AI summary reach 1M views by mid-2026?",
          description: "This market resolves YES if any single AI-generated summary on StreamAiX platform reaches 1 million views before June 30, 2026.",
          category: "bounty" as const,
          deadline: new Date("2026-06-30T23:59:59Z"),
          initialLiquidity: 800,
          resolutionSource: "StreamAiX analytics",
          tags: ["ai", "views", "content"],
        },
        {
          question: "Will Base network TVL exceed Arbitrum by Q3 2025?",
          description: "Resolves YES if Base network's total value locked (TVL) is greater than Arbitrum's TVL at any point before September 30, 2025, as measured by L2Beat or DeFiLlama.",
          category: "defi" as const,
          deadline: new Date("2025-09-30T23:59:59Z"),
          initialLiquidity: 1600,
          resolutionSource: "L2Beat & DeFiLlama",
          tags: ["base", "arbitrum", "l2"],
        },
        {
          question: "Will Ethereum reach $5,000 by end of 2025?",
          description: "This market resolves to YES if Ethereum (ETH) reaches or exceeds $5,000 USD on any major exchange before December 31, 2025 11:59 PM UTC.",
          category: "crypto" as const,
          deadline: new Date("2025-12-31T23:59:59Z"),
          initialLiquidity: 1800,
          resolutionSource: "CoinGecko API",
          tags: ["ethereum", "price", "2025"],
        },
        // ===== TECH STOCK MARKETS =====
        {
          question: "Will NVIDIA (NVDA) reach $200 per share by Q2 2025?",
          description: "This market resolves to YES if NVIDIA stock reaches or exceeds $200 per share on NASDAQ before June 30, 2025 market close.",
          category: "tech_stock" as const,
          assetClass: "tech_stock",
          ticker: "NVDA",
          deadline: new Date("2025-06-30T23:59:59Z"),
          initialLiquidity: 2500,
          resolutionSource: "NASDAQ/Yahoo Finance",
          tags: ["nvidia", "ai", "semiconductors", "tech"],
        },
        {
          question: "Will Apple (AAPL) announce an AI-focused product at WWDC 2025?",
          description: "Resolves YES if Apple announces a new product with significant AI/ML capabilities at WWDC 2025. Minor AI features don't count - needs to be a flagship AI product or major AI platform.",
          category: "tech_stock" as const,
          assetClass: "tech_stock",
          ticker: "AAPL",
          deadline: new Date("2025-06-15T23:59:59Z"),
          initialLiquidity: 1800,
          resolutionSource: "Apple WWDC announcements",
          tags: ["apple", "ai", "wwdc", "tech"],
        },
        {
          question: "Will Tesla (TSLA) deliver 2 million vehicles in 2025?",
          description: "This market resolves YES if Tesla reports total vehicle deliveries of 2 million or more for the full year 2025, as reported in their official Q4 2025 delivery report.",
          category: "tech_stock" as const,
          assetClass: "tech_stock",
          ticker: "TSLA",
          deadline: new Date("2026-01-15T23:59:59Z"),
          initialLiquidity: 2000,
          resolutionSource: "Tesla official delivery reports",
          tags: ["tesla", "ev", "deliveries", "automotive"],
        },
        {
          question: "Will Microsoft (MSFT) market cap exceed $4 trillion by end of 2025?",
          description: "Resolves YES if Microsoft's market capitalization exceeds $4 trillion USD at any point before December 31, 2025 market close.",
          category: "tech_stock" as const,
          assetClass: "tech_stock",
          ticker: "MSFT",
          deadline: new Date("2025-12-31T23:59:59Z"),
          initialLiquidity: 2200,
          resolutionSource: "Yahoo Finance/Bloomberg",
          tags: ["microsoft", "ai", "cloud", "tech"],
        },
        {
          question: "Will the Federal Reserve cut interest rates by June 2025?",
          description: "This market resolves YES if the Federal Reserve announces a federal funds rate cut at any FOMC meeting before July 1, 2025.",
          category: "macro" as const,
          assetClass: "macro",
          ticker: null,
          deadline: new Date("2025-06-30T23:59:59Z"),
          initialLiquidity: 2500,
          resolutionSource: "Federal Reserve FOMC announcements",
          tags: ["fed", "rates", "macro", "economy"],
        },
        {
          question: "Will Meta (META) Threads reach 500M monthly active users by end of 2025?",
          description: "Resolves YES if Meta reports Threads has 500 million or more monthly active users by December 31, 2025.",
          category: "tech_stock" as const,
          assetClass: "tech_stock",
          ticker: "META",
          deadline: new Date("2025-12-31T23:59:59Z"),
          initialLiquidity: 1600,
          resolutionSource: "Meta quarterly reports",
          tags: ["meta", "threads", "social", "tech"],
        },
        {
          question: "Will AMD (AMD) stock outperform NVIDIA (NVDA) in Q1 2025?",
          description: "Resolves YES if AMD stock returns a higher percentage gain (or smaller loss) than NVIDIA from January 1 to March 31, 2025.",
          category: "tech_stock" as const,
          assetClass: "tech_stock",
          ticker: "AMD",
          deadline: new Date("2025-03-31T23:59:59Z"),
          initialLiquidity: 1400,
          resolutionSource: "Yahoo Finance",
          tags: ["amd", "nvidia", "semiconductors", "competition"],
        },
        {
          question: "Will Amazon (AMZN) AWS revenue exceed $30B in any quarter of 2025?",
          description: "This market resolves YES if AWS quarterly revenue exceeds $30 billion in any quarter during 2025.",
          category: "tech_stock" as const,
          assetClass: "tech_stock",
          ticker: "AMZN",
          deadline: new Date("2026-01-31T23:59:59Z"),
          initialLiquidity: 1900,
          resolutionSource: "Amazon quarterly earnings",
          tags: ["amazon", "aws", "cloud", "earnings"],
        },
        {
          question: "Will OpenAI reach $10B annual revenue by end of 2025?",
          description: "Resolves YES if OpenAI reports or is credibly reported to have reached $10 billion in annualized revenue by December 31, 2025.",
          category: "tech_stock" as const,
          assetClass: "tech_stock",
          ticker: null,
          deadline: new Date("2025-12-31T23:59:59Z"),
          initialLiquidity: 1700,
          resolutionSource: "OpenAI announcements/credible news sources",
          tags: ["openai", "ai", "chatgpt", "revenue"],
        },
        {
          question: "Will S&P 500 reach 6,500 by mid-2025?",
          description: "This market resolves YES if the S&P 500 index reaches or exceeds 6,500 at any point before July 1, 2025.",
          category: "macro" as const,
          assetClass: "macro",
          ticker: "SPY",
          deadline: new Date("2025-06-30T23:59:59Z"),
          initialLiquidity: 2300,
          resolutionSource: "S&P Global/Yahoo Finance",
          tags: ["sp500", "index", "macro", "markets"],
        },
      ];

      const existingQuestions = new Set(existingMarkets.map(m => m.question));
      const marketsToCreate = marketSeeds.filter(m => !existingQuestions.has(m.question));
      
      const creatorWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      let marketCount = 0;
      
      for (let i = 0; i < marketsToCreate.length; i++) {
        const seed = marketsToCreate[i];
        try {
          const nextMarketId = existingMarkets.length + marketCount + 1;
          
          await db.insert(predictionMarkets).values({
            contractMarketId: nextMarketId,
            question: seed.question,
            description: seed.description,
            category: seed.category,
            assetClass: (seed as any).assetClass || 'crypto',
            ticker: (seed as any).ticker || null,
            creatorId: undefined,
            creatorWallet,
            deadline: seed.deadline,
            resolutionSource: seed.resolutionSource,
            initialLiquidity: seed.initialLiquidity,
            tags: seed.tags,
            yesLiquidity: seed.initialLiquidity / 2,
            noLiquidity: seed.initialLiquidity / 2,
            yesPrice: 5000,
            noPrice: 5000,
            totalVolume: 0,
            totalTrades: 0,
            status: 'active',
            blockchainTxHash: `0x${Math.random().toString(16).substring(2)}`,
          });
          
          marketCount++;
          if (marketCount % 5 === 0) {
            console.log(`  ✓ Created ${marketCount}/${marketsToCreate.length} new markets...`);
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to create market "${seed.question}":`, error.message);
        }
      }
      
      console.log(`🎉 Added ${marketCount} new prediction markets (${existingMarkets.length + marketCount}/${targetMarketCount} total)`);
      console.log(`📊 AI trading bots will analyze and trade on these markets automatically`);
    } else {
      console.log(`✅ Prediction markets complete (${existingMarkets.length}/${targetMarketCount})`);
    }
    
    // ===== STAGE 5: SEED PREDICTION LEAGUES =====
    console.log('\n🏆 Stage 5: Seeding Prediction Leagues...');
    
    const existingLeagues = await db.select().from(predictionLeagues);
    const targetLeagueCount = 3;
    
    if (existingLeagues.length < targetLeagueCount) {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const threeWeeksFromNow = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
      const fourWeeksFromNow = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
      
      const leagueSeeds = [
        {
          name: 'Weekly Crypto Champions',
          description: 'Compete weekly for the highest prediction market profits. Trade any market and climb the leaderboard!',
          startDate: now,
          endDate: oneWeekFromNow,
          entryFee: 100,
          maxParticipants: 50,
          minTrades: 3,
          prizePool: 10000,
          prizeDistribution: [
            { rank: 1, percentage: 50 },
            { rank: 2, percentage: 30 },
            { rank: 3, percentage: 20 }
          ],
          leagueType: 'weekly',
          status: 'active',
        },
        {
          name: 'Newcomers Welcome League',
          description: 'Perfect for beginners! No entry fee, learn the ropes and compete for prizes.',
          startDate: now,
          endDate: twoWeeksFromNow,
          entryFee: 0,
          maxParticipants: 100,
          minTrades: 1,
          prizePool: 5000,
          prizeDistribution: [
            { rank: 1, percentage: 40 },
            { rank: 2, percentage: 25 },
            { rank: 3, percentage: 15 },
            { rank: 4, percentage: 10 },
            { rank: 5, percentage: 10 }
          ],
          leagueType: 'beginner',
          status: 'active',
        },
        {
          name: 'DeFi Masters League',
          description: 'For serious DeFi enthusiasts. Predict the future of decentralized finance and win big!',
          startDate: now,
          endDate: fourWeeksFromNow,
          entryFee: 500,
          maxParticipants: 30,
          minTrades: 5,
          prizePool: 50000,
          prizeDistribution: [
            { rank: 1, percentage: 50 },
            { rank: 2, percentage: 25 },
            { rank: 3, percentage: 15 },
            { rank: 4, percentage: 5 },
            { rank: 5, percentage: 5 }
          ],
          leagueType: 'defi',
          status: 'active',
        },
      ];
      
      const existingNames = new Set(existingLeagues.map(l => l.name));
      const leaguesToCreate = leagueSeeds.filter(l => !existingNames.has(l.name));
      let leagueCount = 0;
      
      for (const seed of leaguesToCreate) {
        try {
          await db.insert(predictionLeagues).values({
            name: seed.name,
            description: seed.description,
            startDate: seed.startDate,
            endDate: seed.endDate,
            entryFee: seed.entryFee,
            maxParticipants: seed.maxParticipants,
            minTrades: seed.minTrades,
            prizePool: seed.prizePool,
            prizeDistribution: seed.prizeDistribution,
            leagueType: seed.leagueType,
            status: seed.status as 'upcoming' | 'active' | 'completed' | 'cancelled',
            totalParticipants: 0,
            totalVolume: 0,
          });
          leagueCount++;
          console.log(`  ✓ Created league: "${seed.name}"`);
        } catch (error: any) {
          console.error(`  ✗ Failed to create league "${seed.name}":`, error.message);
        }
      }
      
      console.log(`🎉 Added ${leagueCount} new prediction leagues (${existingLeagues.length + leagueCount}/${targetLeagueCount} total)`);
    } else {
      console.log(`✅ Prediction leagues complete (${existingLeagues.length}/${targetLeagueCount})`);
    }
    
    // ===== STAGE 6: SEED LEARNING MODULES =====
    console.log('\n📚 Stage 6: Seeding Learning Modules...');
    
    const existingModules = await db.select().from(learningModules);
    const targetModuleCount = 6;
    
    if (existingModules.length < targetModuleCount) {
      const moduleSeedData = [
        {
          id: 'mod-web3-basics',
          title: 'Web3 Fundamentals',
          description: 'Master the basics of Web3, blockchain technology, and decentralized systems. Perfect for beginners entering the crypto space.',
          category: 'web3_basics',
          difficulty: 'beginner' as const,
          estimatedMinutes: 59,
          xpReward: 475,
          lessonCount: 5,
          sortOrder: 1,
          isActive: true,
        },
        {
          id: 'mod-defi-intro',
          title: 'DeFi Deep Dive',
          description: 'Understand decentralized finance protocols, yield farming, liquidity pools, and the future of permissionless banking.',
          category: 'defi',
          difficulty: 'intermediate' as const,
          estimatedMinutes: 81,
          xpReward: 625,
          lessonCount: 5,
          sortOrder: 2,
          isActive: true,
        },
        {
          id: 'mod-ai-trading',
          title: 'AI Trading Strategies',
          description: 'Learn how AI and machine learning are revolutionizing trading. Understand signals, pattern recognition, and automated strategies.',
          category: 'ai_trading',
          difficulty: 'intermediate' as const,
          estimatedMinutes: 86,
          xpReward: 700,
          lessonCount: 5,
          sortOrder: 3,
          isActive: true,
        },
        {
          id: 'mod-prediction-markets',
          title: 'Prediction Market Mastery',
          description: 'Become an expert in prediction markets. Learn probability, market making, and how to profit from information edges.',
          category: 'prediction_markets',
          difficulty: 'advanced' as const,
          estimatedMinutes: 81,
          xpReward: 625,
          lessonCount: 5,
          sortOrder: 4,
          isActive: true,
        },
        {
          id: 'mod-macro-economics',
          title: 'Macro Economics for Traders',
          description: 'Understand how Fed policy, inflation, and global economics impact crypto and stock markets.',
          category: 'macro_economics',
          difficulty: 'advanced' as const,
          estimatedMinutes: 69,
          xpReward: 475,
          lessonCount: 4,
          sortOrder: 5,
          isActive: true,
        },
        {
          id: 'mod-tech-stocks',
          title: 'Tech Stock Analysis',
          description: 'Master fundamental and technical analysis for tech stocks. Analyze NVDA, AAPL, MSFT and more like a pro.',
          category: 'tech_stocks',
          difficulty: 'intermediate' as const,
          estimatedMinutes: 66,
          xpReward: 450,
          lessonCount: 4,
          sortOrder: 6,
          isActive: true,
        },
      ];
      
      const existingIds = new Set(existingModules.map(m => m.id));
      const modulesToCreate = moduleSeedData.filter(m => !existingIds.has(m.id));
      let moduleCount = 0;
      
      for (const seed of modulesToCreate) {
        try {
          await db.insert(learningModules).values(seed);
          moduleCount++;
          console.log(`  ✓ Created learning module: "${seed.title}"`);
        } catch (error: any) {
          console.error(`  ✗ Failed to create module "${seed.title}":`, error.message);
        }
      }
      
      console.log(`🎉 Added ${moduleCount} new learning modules (${existingModules.length + moduleCount}/${targetModuleCount} total)`);
    } else {
      console.log(`✅ Learning modules complete (${existingModules.length}/${targetModuleCount})`);
    }

    // ===== BACKFILL STREAM RECORDINGS (IDEMPOTENT) =====
    console.log(`\n📹 Checking for missing stream recordings...`);
    
    try {
      // Get all ended streams
      const endedStreams = await db
        .select({
          id: liveStreams.id,
          title: liveStreams.title,
          streamType: liveStreams.streamType,
          hostId: liveStreams.hostId,
          thumbnailUrl: liveStreams.thumbnailUrl,
          actualStart: liveStreams.actualStart,
          actualEnd: liveStreams.actualEnd,
        })
        .from(liveStreams)
        .where(eq(liveStreams.status, 'ended'));
      
      if (endedStreams.length === 0) {
        console.log(`✅ No ended streams found to backfill`);
      } else {
        // Get all existing recordings
        const existingRecordings = await db
          .select({ streamId: streamRecordings.streamId })
          .from(streamRecordings);
        
        const recordedStreamIds = new Set(existingRecordings.map(r => r.streamId));
        const streamsNeedingRecordings = endedStreams.filter(s => !recordedStreamIds.has(s.id));
        
        if (streamsNeedingRecordings.length === 0) {
          console.log(`✅ Stream recordings complete (${existingRecordings.length}/${endedStreams.length} streams have recordings)`);
        } else {
          console.log(`🔧 Backfilling ${streamsNeedingRecordings.length} missing stream recordings...`);
          
          let backfilledCount = 0;
          for (const stream of streamsNeedingRecordings) {
            try {
              // Get host info
              const host = stream.hostId ? await db
                .select({ avatar: users.avatar })
                .from(users)
                .where(eq(users.id, stream.hostId))
                .limit(1) : [];
              
              const thumbnailUrl = stream.thumbnailUrl || host[0]?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.id}`;
              
              // Calculate duration if we have start/end times
              let duration = 0;
              if (stream.actualStart && stream.actualEnd) {
                duration = Math.floor((new Date(stream.actualEnd).getTime() - new Date(stream.actualStart).getTime()) / 1000);
              }
              
              await db.insert(streamRecordings).values({
                streamId: stream.id,
                recordingUrl: `/api/streams/${stream.id}/replay`,
                thumbnailUrl: thumbnailUrl,
                durationSeconds: Math.max(0, duration),
                status: 'ready',
              });
              
              backfilledCount++;
            } catch (error: any) {
              console.error(`  ✗ Failed to create recording for stream ${stream.id}:`, error.message);
            }
          }
          
          console.log(`🎉 Backfilled ${backfilledCount} stream recordings (${existingRecordings.length + backfilledCount}/${endedStreams.length} total)`);
        }
      }
    } catch (error: any) {
      console.error('⚠️ Stream recording backfill failed:', error.message);
      // Don't throw - continue with server startup
    }
    
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
    // Don't throw - allow server to start even if seeding fails
  }
}
