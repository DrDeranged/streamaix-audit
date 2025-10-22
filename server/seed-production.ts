/**
 * Production Seed Data Script
 * Run this after deploying to populate the database with initial data
 * 
 * Usage: tsx server/seed-production.ts
 */

import { db } from './db';
import { bounties, predictionMarkets, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const SAMPLE_BOUNTIES = [
  {
    title: "Analyze Bitcoin's 2024 Market Cycle Patterns",
    description: "Deep dive into BTC price patterns comparing 2024 to previous halving cycles. Include on-chain metrics, whale movements, and correlation with macro indicators.",
    contentUrl: 'https://youtube.com/watch?v=example1',
    reward: 500,
    status: 'open' as const,
    category: 'crypto',
    difficulty: 'expert' as const,
    tags: ['bitcoin', 'analysis', 'on-chain'],
  },
  {
    title: "DeFi Yield Farming Strategy Guide for 2025",
    description: "Comprehensive guide to yield farming strategies across major protocols. Include risk analysis, APY calculations, and impermanent loss mitigation.",
    contentUrl: 'https://youtube.com/watch?v=example2',
    reward: 350,
    status: 'open' as const,
    category: 'defi',
    difficulty: 'hard' as const,
    tags: ['defi', 'yield-farming', 'liquidity'],
  },
  {
    title: "ETH Layer 2 Comparison: Arbitrum vs Optimism vs Base",
    description: "Technical comparison of major Ethereum L2 solutions. Analyze transaction costs, speeds, security models, and ecosystem development.",
    contentUrl: 'https://youtube.com/watch?v=example3',
    reward: 400,
    status: 'open' as const,
    category: 'blockchain',
    difficulty: 'expert' as const,
    tags: ['ethereum', 'layer2', 'scaling'],
  },
  {
    title: "NFT Market Trends Q4 2024 Analysis",
    description: "Analyze NFT market trends across major marketplaces. Focus on blue chip collections, emerging trends, and market sentiment.",
    contentUrl: 'https://youtube.com/watch?v=example4',
    reward: 250,
    status: 'open' as const,
    category: 'nft',
    difficulty: 'easy' as const,
    tags: ['nft', 'markets', 'trends'],
  },
  {
    title: "AI Trading Bot Performance Comparison",
    description: "Test and compare popular AI trading bots for crypto markets. Include backtesting results, risk metrics, and profitability analysis.",
    contentUrl: 'https://youtube.com/watch?v=example5',
    reward: 600,
    status: 'open' as const,
    category: 'ai',
    difficulty: 'expert' as const,
    tags: ['ai', 'trading', 'automation'],
  },
  {
    title: "Solana Ecosystem Deep Dive 2024",
    description: "Comprehensive overview of Solana's ecosystem growth, major projects, DeFi activity, and competitive advantages vs other chains.",
    contentUrl: 'https://youtube.com/watch?v=example6',
    reward: 300,
    status: 'in_progress' as const,
    category: 'blockchain',
    difficulty: 'medium' as const,
    tags: ['solana', 'ecosystem', 'defi'],
  },
  {
    title: "Crypto Tax Optimization Strategies Guide",
    description: "Legal strategies for minimizing crypto tax burden. Cover tax-loss harvesting, holding periods, and jurisdiction differences.",
    contentUrl: 'https://youtube.com/watch?v=example7',
    reward: 450,
    status: 'open' as const,
    category: 'regulation',
    difficulty: 'medium' as const,
    tags: ['tax', 'legal', 'strategy'],
  },
  {
    title: "Web3 Security Best Practices 2024",
    description: "Comprehensive security guide for Web3 developers and users. Cover wallet security, smart contract audits, and common attack vectors.",
    contentUrl: 'https://youtube.com/watch?v=example8',
    reward: 500,
    status: 'open' as const,
    category: 'security',
    difficulty: 'expert' as const,
    tags: ['security', 'web3', 'smart-contracts'],
  },
  {
    title: "Macro Market Analysis: Fed Policy Impact on Crypto",
    description: "Analyze how Federal Reserve monetary policy affects cryptocurrency markets. Include historical correlation analysis and forward guidance.",
    contentUrl: 'https://youtube.com/watch?v=example9',
    reward: 350,
    status: 'open' as const,
    category: 'macro',
    difficulty: 'medium' as const,
    tags: ['macro', 'fed', 'correlation'],
  },
  {
    title: "Stablecoin Mechanisms Explained",
    description: "Educational guide explaining different stablecoin mechanisms: algorithmic, collateralized, and hybrid. Include risk analysis.",
    contentUrl: 'https://youtube.com/watch?v=example10',
    reward: 200,
    status: 'open' as const,
    category: 'defi',
    difficulty: 'easy' as const,
    tags: ['stablecoins', 'education', 'defi'],
  }
];

const SAMPLE_MARKETS = [
  {
    contractMarketId: 1,
    question: "Bitcoin above $100,000 by March 31, 2025?",
    description: "Will Bitcoin (BTC) trade above $100,000 USD on any major exchange before the end of March 2025?",
    category: 'crypto',
    deadline: new Date('2025-03-31'),
    initialLiquidity: 10000,
    yesPrice: 6500, // 65%
    noPrice: 3500,  // 35%
    totalVolume: 5000,
    status: 'active' as const,
  },
  {
    contractMarketId: 2,
    question: "Ethereum switches to complete PoS by Q2 2025?",
    description: "Will Ethereum fully deprecate all PoW mining by June 30, 2025?",
    category: 'crypto',
    deadline: new Date('2025-06-30'),
    initialLiquidity: 8000,
    yesPrice: 4500, // 45%
    noPrice: 5500,  // 55%
    totalVolume: 2500,
    status: 'active' as const,
  },
  {
    contractMarketId: 3,
    question: "Major DeFi hack exceeding $100M in Q1 2025?",
    description: "Will there be a DeFi protocol hack resulting in losses over $100 million before April 1, 2025?",
    category: 'defi',
    deadline: new Date('2025-04-01'),
    initialLiquidity: 5000,
    yesPrice: 3000, // 30%
    noPrice: 7000,  // 70%
    totalVolume: 1500,
    status: 'active' as const,
  },
  {
    contractMarketId: 4,
    question: "Solana TVL surpasses Ethereum by end of 2025?",
    description: "Will Solana's Total Value Locked (TVL) exceed Ethereum's TVL at any point before January 1, 2026?",
    category: 'defi',
    deadline: new Date('2025-12-31'),
    initialLiquidity: 12000,
    yesPrice: 1500, // 15%
    noPrice: 8500,  // 85%
    totalVolume: 3000,
    status: 'active' as const,
  },
  {
    contractMarketId: 5,
    question: "Bitcoin ETF sees $10B+ inflows in Q1 2025?",
    description: "Will spot Bitcoin ETFs collectively see net inflows exceeding $10 billion by March 31, 2025?",
    category: 'macro',
    deadline: new Date('2025-03-31'),
    initialLiquidity: 15000,
    yesPrice: 5500, // 55%
    noPrice: 4500,  // 45%
    totalVolume: 4200,
    status: 'active' as const,
  }
];

async function seedProduction() {
  console.log('🌱 Starting production database seed...');

  try {
    // Check if data already exists
    const existingBounties = await db.select().from(bounties).limit(1);
    
    if (existingBounties.length > 0) {
      console.log('⚠️  Database already has data. Skipping seed to avoid duplicates.');
      console.log('   If you want to re-seed, manually clear the database first.');
      return;
    }

    // Create a system user for bounties
    console.log('👤 Creating system user...');
    const [systemUser] = await db.insert(users).values({
      username: 'StreamAiX',
      password: null, // No password for system user
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      email: 'system@streamaix.com',
      bio: 'Official StreamAiX Platform Account',
      authProvider: 'local'
    }).returning();

    console.log('✅ System user created');

    // Insert bounties
    console.log('💎 Inserting bounties...');
    const insertedBounties = [];
    
    for (const bounty of SAMPLE_BOUNTIES) {
      const [inserted] = await db.insert(bounties).values({
        ...bounty,
        creatorId: systemUser.id,
        creatorWallet: systemUser.walletAddress!
      }).returning();
      
      insertedBounties.push(inserted);
      console.log(`  ✓ ${bounty.title}`);
    }

    console.log(`✅ Inserted ${insertedBounties.length} bounties`);

    // Insert prediction markets
    console.log('📊 Inserting prediction markets...');
    const insertedMarkets = [];
    
    for (const market of SAMPLE_MARKETS) {
      const [inserted] = await db.insert(predictionMarkets).values({
        ...market,
        creatorId: systemUser.id,
        creatorWallet: systemUser.walletAddress!
      }).returning();
      
      insertedMarkets.push(inserted);
      console.log(`  ✓ ${market.question}`);
    }

    console.log(`✅ Inserted ${insertedMarkets.length} prediction markets`);

    console.log('\n🎉 Production seed completed successfully!');
    console.log('\nSummary:');
    console.log(`  - ${insertedBounties.length} bounties created`);
    console.log(`  - ${insertedMarkets.length} prediction markets created`);
    console.log(`  - 1 system user created`);
    console.log('\n📝 Next steps:');
    console.log('  1. Verify data in database');
    console.log('  2. Test bounty board page');
    console.log('  3. Test prediction markets page');
    console.log('  4. Create real user accounts for testing');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedProduction()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedProduction };
