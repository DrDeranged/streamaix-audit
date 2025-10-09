import { db } from './db';
import { predictionMarkets } from '@shared/schema';

interface MarketSeed {
  question: string;
  description: string;
  category: 'crypto' | 'defi' | 'bounty' | 'realworld' | 'community';
  deadline: Date;
  initialLiquidity: number;
  resolutionSource: string;
  imageUrl?: string;
  tags: string[];
}

const marketSeeds: MarketSeed[] = [
  {
    question: "Will Bitcoin reach $150,000 by end of 2025?",
    description: "This market resolves to YES if Bitcoin (BTC) reaches or exceeds $150,000 USD on any major exchange (Coinbase, Binance, Kraken) before December 31, 2025 11:59 PM UTC.",
    category: "crypto",
    deadline: new Date("2025-12-31T23:59:59Z"),
    initialLiquidity: 2000,
    resolutionSource: "CoinGecko API",
    tags: ["bitcoin", "price", "2025"],
  },
  {
    question: "Will Ethereum complete the full sharding upgrade by Q4 2025?",
    description: "Resolves YES if Ethereum successfully deploys full data sharding (all phases complete) to mainnet by December 31, 2025. Partial sharding or testnet-only doesn't count.",
    category: "crypto",
    deadline: new Date("2025-12-31T23:59:59Z"),
    initialLiquidity: 1500,
    resolutionSource: "Ethereum Foundation official announcements",
    tags: ["ethereum", "upgrade", "sharding"],
  },
  {
    question: "Will any StreamAiX bounty exceed 1,000 STREAM tokens reward?",
    description: "This market resolves YES if any single bounty on StreamAiX platform has a total reward pool exceeding 1,000 STREAM tokens before the deadline.",
    category: "bounty",
    deadline: new Date("2025-06-30T23:59:59Z"),
    initialLiquidity: 1000,
    resolutionSource: "StreamAiX platform data",
    tags: ["bounty", "stream", "rewards"],
  },
  {
    question: "Will Uniswap V4 launch on mainnet before Q2 2026?",
    description: "Resolves YES if Uniswap V4 is deployed and operational on Ethereum mainnet before April 1, 2026. Testnet deployments don't count.",
    category: "defi",
    deadline: new Date("2026-03-31T23:59:59Z"),
    initialLiquidity: 1800,
    resolutionSource: "Uniswap official channels",
    tags: ["uniswap", "defi", "dex"],
  },
  {
    question: "Will US inflation rate drop below 2% in 2025?",
    description: "This market resolves YES if the US Consumer Price Index (CPI) year-over-year inflation rate falls below 2.0% in any month during 2025, as reported by the Bureau of Labor Statistics.",
    category: "realworld",
    deadline: new Date("2025-12-31T23:59:59Z"),
    initialLiquidity: 2000,
    resolutionSource: "US Bureau of Labor Statistics",
    tags: ["inflation", "economy", "usa"],
  },
  {
    question: "Will StreamAiX platform reach 10,000 registered users by year end?",
    description: "Resolves YES if StreamAiX has 10,000 or more registered user accounts by December 31, 2025 11:59 PM UTC.",
    category: "community",
    deadline: new Date("2025-12-31T23:59:59Z"),
    initialLiquidity: 1200,
    resolutionSource: "StreamAiX platform metrics",
    tags: ["streamaix", "growth", "users"],
  },
  {
    question: "Will total value locked in DeFi exceed $200B by end of Q1 2026?",
    description: "This market resolves YES if the total value locked (TVL) across all DeFi protocols exceeds $200 billion USD by March 31, 2026, as measured by DeFiLlama.",
    category: "defi",
    deadline: new Date("2026-03-31T23:59:59Z"),
    initialLiquidity: 1500,
    resolutionSource: "DeFiLlama",
    tags: ["defi", "tvl", "growth"],
  },
  {
    question: "Will Solana network have zero major outages in next 6 months?",
    description: "Resolves YES if Solana mainnet has ZERO outages lasting more than 30 minutes between now and April 9, 2026. Any network halt or consensus failure counts as outage.",
    category: "crypto",
    deadline: new Date("2026-04-09T23:59:59Z"),
    initialLiquidity: 1000,
    resolutionSource: "Solana Status & blockchain data",
    tags: ["solana", "reliability", "network"],
  },
  {
    question: "Will a StreamAiX AI summary reach 1M views by mid-2026?",
    description: "This market resolves YES if any single AI-generated summary on StreamAiX platform reaches 1 million views before June 30, 2026.",
    category: "bounty",
    deadline: new Date("2026-06-30T23:59:59Z"),
    initialLiquidity: 800,
    resolutionSource: "StreamAiX analytics",
    tags: ["ai", "views", "content"],
  },
  {
    question: "Will Base network TVL exceed Arbitrum by Q3 2025?",
    description: "Resolves YES if Base network's total value locked (TVL) is greater than Arbitrum's TVL at any point before September 30, 2025, as measured by L2Beat or DeFiLlama.",
    category: "defi",
    deadline: new Date("2025-09-30T23:59:59Z"),
    initialLiquidity: 1600,
    resolutionSource: "L2Beat & DeFiLlama",
    tags: ["base", "arbitrum", "l2"],
  },
];

async function seedPredictionMarkets() {
  console.log('🌱 Starting prediction market seeding (database-only)...\n');

  const creatorWallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'; // Example wallet
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < marketSeeds.length; i++) {
    const seed = marketSeeds[i];
    try {
      console.log(`📊 Creating market ${i + 1}/${marketSeeds.length}: "${seed.question.substring(0, 60)}..."`);
      
      const market = await db.insert(predictionMarkets).values({
        contractMarketId: i + 1, // Mock contract ID
        question: seed.question,
        description: seed.description,
        category: seed.category,
        creatorId: undefined,
        creatorWallet,
        deadline: seed.deadline,
        resolutionSource: seed.resolutionSource,
        initialLiquidity: seed.initialLiquidity,
        imageUrl: seed.imageUrl,
        tags: seed.tags,
        yesLiquidity: seed.initialLiquidity / 2,
        noLiquidity: seed.initialLiquidity / 2,
        yesPrice: 5000, // 50% initial probability
        noPrice: 5000,
        totalVolume: 0,
        totalTrades: 0,
        status: 'active',
        blockchainTxHash: `0x${Math.random().toString(16).substring(2)}`, // Mock tx hash
      }).returning();

      console.log(`  ✅ Created market: ${market[0].id}`);
      console.log(`  💰 Initial liquidity: ${seed.initialLiquidity} STREAM`);
      console.log(`  📅 Deadline: ${seed.deadline.toLocaleDateString()}\n`);
      
      successCount++;
    } catch (error: any) {
      console.error(`  ❌ Failed to create market: ${error.message}\n`);
      failCount++;
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log(`✅ Successfully created: ${successCount} markets`);
  console.log(`❌ Failed: ${failCount} markets`);
  
  if (successCount > 0) {
    console.log('\n🔗 Visit the following pages to see your markets:');
    console.log('  - Landing page prediction markets section');
    console.log('  - /markets - Full market listing');
    console.log('  - /markets/:id - Individual market trading pages');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run seeding
seedPredictionMarkets().catch((error) => {
  console.error('❌ Fatal error during seeding:', error);
  process.exit(1);
});
