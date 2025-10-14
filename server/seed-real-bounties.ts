import { db } from './db';
import { bounties } from '@shared/schema';

const realBounties = [
  {
    title: "Summarize Bankless: Bitcoin ETFs - What's Next?",
    description: "Create a comprehensive summary of this Bankless podcast episode discussing Bitcoin ETF approvals and their market implications. Focus on expert predictions, institutional adoption trends, and potential impact on crypto markets.",
    contentUrl: "https://www.youtube.com/watch?v=EgMWg5-DHOk",
    reward: 150,
    difficulty: "medium" as const,
    category: "crypto",
    tags: ["bitcoin", "ETF", "institutional", "bankless"],
    creatorWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    status: "open" as const,
    engagementTier: "analysis" as const,
    analysisQuestions: [
      {id: "q1", question: "What are the key predictions from experts about Bitcoin ETF impact on price?"},
      {id: "q2", question: "How will institutional adoption through ETFs change the crypto landscape?"},
      {id: "q3", question: "What are the main risks and opportunities discussed in this episode?"}
    ]
  },
  {
    title: "Analyze Lex Fridman x Vitalik Buterin: Ethereum's Future",
    description: "Summarize Lex Fridman's interview with Vitalik Buterin covering Ethereum's roadmap, scaling solutions, and vision for decentralized society. Include technical insights and philosophical perspectives.",
    contentUrl: "https://www.youtube.com/watch?v=XW0QZmtbjvs",
    reward: 200,
    difficulty: "hard" as const,
    category: "tech",
    tags: ["ethereum", "vitalik", "scaling", "lex-fridman"],
    creatorWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    status: "open" as const,
    engagementTier: "prediction" as const,
    analysisQuestions: [
      {id: "q1", question: "What are Vitalik's main predictions for Ethereum's scaling timeline?"},
      {id: "q2", question: "How does he envision the future of decentralized governance?"}
    ]
  },
  {
    title: "Summarize a16z Crypto: DeFi Trends 2024",
    description: "Break down this a16z crypto podcast on emerging DeFi trends, new protocols, and regulatory developments. Highlight investment thesis and market opportunities discussed by the partners.",
    contentUrl: "https://www.youtube.com/watch?v=5DKhl9QI2F8",
    reward: 175,
    difficulty: "medium" as const,
    category: "defi",
    tags: ["a16z", "defi", "trends", "regulation"],
    creatorWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    status: "open" as const,
    engagementTier: "analysis" as const,
    analysisQuestions: [
      {id: "q1", question: "What are the top 3 DeFi trends a16z is most excited about?"},
      {id: "q2", question: "How do regulatory changes impact the DeFi investment landscape?"},
      {id: "q3", question: "What metrics do they use to evaluate DeFi protocol success?"}
    ]
  },
  {
    title: "Decode Bankless: Layer 2 Scaling Wars",
    description: "Summarize this Bankless deep-dive on Layer 2 solutions - Optimism, Arbitrum, zkSync, and more. Compare their approaches, trade-offs, and market positioning.",
    contentUrl: "https://www.youtube.com/watch?v=Z9OGEY2M0H0",
    reward: 160,
    difficulty: "hard" as const,
    category: "tech",
    tags: ["layer2", "optimism", "arbitrum", "zksync"],
    creatorWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    status: "open" as const,
    engagementTier: "prediction" as const,
    analysisQuestions: [
      {id: "q1", question: "Which Layer 2 solution has the strongest competitive moat and why?"}
    ]
  },
  {
    title: "Extract Insights: Real Vision Macro x Crypto",
    description: "Summarize Real Vision's macro-crypto crossover discussion covering Fed policy, inflation, and crypto as a hedge. Focus on actionable investment insights.",
    contentUrl: "https://www.youtube.com/watch?v=vEEmP2cROJM",
    reward: 140,
    difficulty: "medium" as const,
    category: "business",
    tags: ["macro", "fed", "inflation", "real-vision"],
    creatorWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    status: "open" as const,
    engagementTier: "analysis" as const,
    analysisQuestions: [
      {id: "q1", question: "How does the current macro environment affect crypto valuations?"},
      {id: "q2", question: "What are the key leading indicators to watch according to the hosts?"}
    ]
  }
];

async function seedRealBounties() {
  try {
    console.log('🌱 Seeding real bounties with working YouTube videos...');
    
    for (const bounty of realBounties) {
      await db.insert(bounties).values(bounty);
      console.log(`✅ Created bounty: ${bounty.title}`);
    }
    
    console.log('🎉 Successfully seeded all real bounties!');
  } catch (error) {
    console.error('❌ Error seeding bounties:', error);
  } finally {
    process.exit(0);
  }
}

seedRealBounties();
