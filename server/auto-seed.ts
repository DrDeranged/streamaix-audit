import { db } from './db';
import { knowledgeAvatars, users, aiAgents, predictionMarkets } from '@shared/schema';
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
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
    isActive: true
  }
];

export async function autoSeedDatabase() {
  try {
    // ===== SEED KNOWLEDGE AVATARS =====
    const existingAvatars = await db.query.knowledgeAvatars.findMany({ limit: 1 });
    
    if (existingAvatars.length === 0) {
      console.log('🌱 Database empty - auto-seeding knowledge avatars...');
      
      let seededCount = 0;
      for (const avatar of avatarSeedData) {
        try {
          await db.insert(knowledgeAvatars).values(avatar);
          seededCount++;
        } catch (error) {
          console.error(`❌ Error seeding avatar ${avatar.name}:`, error);
        }
      }
      
      console.log(`🎉 Auto-seed complete! Added ${seededCount}/${avatarSeedData.length} knowledge avatars`);
    } else {
      console.log('✅ Database already seeded with knowledge avatars');
    }

    // ===== SEED 100 AUTONOMOUS AI AGENTS =====
    const existingAgents = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isAiAgent, true))
      .limit(1);
    
    if (existingAgents.length === 0) {
      console.log('\n🤖 Initializing 100 autonomous AI agents...');
      
      // Import agent initialization function
      const { generateAgentPersonas } = await import('./services/agentPersonaGenerator');
      const personas = generateAgentPersonas(100);
      
      let agentCount = 0;
      for (const persona of personas) {
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
            console.log(`  ✓ Created ${agentCount}/100 AI agents...`);
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to create agent ${persona.username}:`, error.message);
        }
      }
      
      const totalPoints = personas.reduce((sum, p) => sum + p.streamPoints, 0);
      console.log(`🎉 Created ${agentCount} autonomous AI agents!`);
      console.log(`💰 Distributed ${totalPoints.toLocaleString()} STREAM points`);
      console.log(`🚀 Agents will start engaging with the platform automatically`);
    } else {
      console.log('✅ Autonomous AI agents already initialized');
    }

    // ===== SEED 50 AI TRADING BOTS =====
    const existingTradingBots = await db
      .select({ id: aiAgents.id })
      .from(aiAgents)
      .limit(1);
    
    if (existingTradingBots.length === 0) {
      console.log('\n💹 Initializing 50 AI trading bots...');
      
      // Import trading bot generator
      const { TRADING_BOTS, getBotDistributionStats } = await import('./services/tradingBotPersonaGenerator');
      
      let botCount = 0;
      for (const bot of TRADING_BOTS) {
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
            console.log(`  ✓ Created ${botCount}/50 trading bots...`);
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to create bot ${bot.name}:`, error.message);
        }
      }
      
      const stats = getBotDistributionStats();
      console.log(`🎉 Created ${botCount} AI trading bots!`);
      console.log(`💰 Total trading capital: ${stats.totalStreamPoints.toLocaleString()} STREAM`);
      console.log(`📊 Personality distribution:`, stats.byPersonality);
      console.log(`⚖️  Risk tolerance distribution:`, stats.byRiskTolerance);
      console.log(`📈 Trading bots will analyze and trade on prediction markets automatically`);
    } else {
      console.log('✅ AI trading bots already initialized');
    }

    // ===== SEED PREDICTION MARKETS =====
    const existingMarkets = await db
      .select({ id: predictionMarkets.id })
      .from(predictionMarkets)
      .limit(1);
    
    if (existingMarkets.length === 0) {
      console.log('\n📊 Initializing prediction markets...');
      
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
      ];

      const creatorWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      let marketCount = 0;
      
      for (let i = 0; i < marketSeeds.length; i++) {
        const seed = marketSeeds[i];
        try {
          await db.insert(predictionMarkets).values({
            contractMarketId: i + 1,
            question: seed.question,
            description: seed.description,
            category: seed.category,
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
            console.log(`  ✓ Created ${marketCount}/${marketSeeds.length} prediction markets...`);
          }
        } catch (error: any) {
          console.error(`  ✗ Failed to create market "${seed.question}":`, error.message);
        }
      }
      
      console.log(`🎉 Created ${marketCount} prediction markets!`);
      console.log(`📊 AI trading bots will analyze and trade on these markets automatically`);
    } else {
      console.log('✅ Prediction markets already initialized');
    }
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
    // Don't throw - allow server to start even if seeding fails
  }
}
