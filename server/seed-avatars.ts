import { db } from './db';
import { knowledgeAvatars } from '@shared/schema';

const newEntrepreneurs = [
  {
    name: 'Marc Andreessen',
    handle: 'pmarca',
    bio: 'Co-founder of a16z, Netscape pioneer, and legendary tech investor. Managing $35B+ AUM with deep crypto conviction.',
    imageUrl: 'https://pbs.twimg.com/profile_images/1588992599668527104/Lx1Vqr2T_400x400.jpg',
    portfolioRoi: 26.35, // 2024 a16z crypto fund return
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
    portfolioRoi: 26.35, // 2024 a16z crypto fund return
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
    portfolioRoi: 45.0, // DOT performance estimate
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
    portfolioRoi: 60.0, // ADA 2024 return
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
    portfolioRoi: 350.0, // XRP 2024 return
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
    portfolioRoi: 95.0, // Kraken revenue growth + BTC holdings
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
    portfolioRoi: 105.5, // UNI 2024 performance
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
    portfolioRoi: 244.0, // Aave revenue growth YoY
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
    portfolioRoi: 85.0, // Bitcoin-heavy portfolio performance
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
    portfolioRoi: -42.6, // YFI 2024 decline (honest data)
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
    portfolioRoi: 42.0, // Portfolio average estimate
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
    portfolioRoi: 156.0, // Portfolio growth + TRX performance
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
    portfolioRoi: 115.0, // Worldcoin WLD performance
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
    portfolioRoi: 285.0, // SOL exceptional performance
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
    portfolioRoi: 120.0, // Bitcoin 2024 return
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
  }
];

async function seedAvatars() {
  console.log('🌱 Starting to seed knowledge avatars...');

  for (const avatar of newEntrepreneurs) {
    try {
      const existing = await db.query.knowledgeAvatars.findFirst({
        where: (avatars, { eq }) => eq(avatars.handle, avatar.handle)
      });

      if (existing) {
        console.log(`✅ Avatar ${avatar.name} (@${avatar.handle}) already exists, skipping...`);
        continue;
      }

      await db.insert(knowledgeAvatars).values(avatar);
      console.log(`✨ Created avatar: ${avatar.name} (@${avatar.handle}) - ROI: ${avatar.portfolioRoi}%`);
    } catch (error) {
      console.error(`❌ Error creating avatar ${avatar.name}:`, error);
    }
  }

  console.log('🎉 Avatar seeding completed!');
  process.exit(0);
}

seedAvatars().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});
