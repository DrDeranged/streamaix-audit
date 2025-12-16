import { db } from '../db';
import { bounties, users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import type { AgentPersonality } from '../types/agents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BountyCreationParams {
  agentId: string;
  username: string;
  streamPoints: number;
  personality: AgentPersonality;
}

interface GeneratedBounty {
  title: string;
  description: string;
  contentUrl: string;
  category: string;
  difficulty: string;
  reward: number;
  tags: string[];
}

// Real crypto content sources for bounties
const contentSources = [
  // Bankless episodes
  'https://www.youtube.com/watch?v=kGjFTzRTH3Q',
  'https://www.youtube.com/watch?v=P7D5knRO48c',
  // Lex Fridman crypto interviews
  'https://www.youtube.com/watch?v=3x1b_S6Qp2Q',
  'https://www.youtube.com/watch?v=rYEY2B79zaM',
  // Coin Bureau educational content
  'https://www.youtube.com/watch?v=ZE2HxTmxfrI',
  'https://www.youtube.com/watch?v=VYWc9dFqROI',
  // Podcast episodes
  'https://podcasts.apple.com/us/podcast/bankless/id1499409058',
  'https://podcasts.apple.com/us/podcast/unchained/id1123922160',
];

export class AgentBountyEngine {
  /**
   * Create a bounty from an AI agent
   */
  async createBounty(params: BountyCreationParams): Promise<string | null> {
    try {
      console.log(`      🎯 Generating bounty idea for ${params.username}...`);
      
      // Generate bounty using GPT-4
      const generatedBounty = await this.generateBountyWithAI(params);
      
      if (!generatedBounty) {
        console.log(`      ⚠️  Failed to generate bounty idea`);
        return null;
      }
      
      // Determine reward based on agent's wealth and personality
      const reward = this.calculateReward(params.streamPoints, params.personality);
      
      // Create deadline (2-7 days from now)
      const daysUntilDeadline = 2 + Math.floor(Math.random() * 5);
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + daysUntilDeadline);
      
      // Insert bounty into database
      const [bounty] = await db.insert(bounties).values({
        title: generatedBounty.title,
        description: generatedBounty.description,
        contentUrl: generatedBounty.contentUrl,
        reward,
        tokenType: 'STREAM',
        deadline,
        difficulty: generatedBounty.difficulty,
        category: generatedBounty.category,
        tags: generatedBounty.tags,
        creatorId: params.agentId,
        creatorWallet: await this.getAgentWallet(params.agentId),
        status: 'open',
        engagementTier: this.selectEngagementTier(params.personality),
      }).returning();
      
      // Deduct reward from agent's STREAM points
      await db
        .update(users)
        .set({
          streamPoints: params.streamPoints - reward,
        })
        .where(eq(users.id, params.agentId));
      
      console.log(`      ✅ Created bounty: "${generatedBounty.title}" (${reward} STREAM)`);
      
      return bounty.id;
      
    } catch (error: any) {
      console.error(`      ❌ Bounty creation failed:`, error.message);
      return null;
    }
  }
  
  /**
   * Use GPT-4 to generate a realistic bounty
   */
  private async generateBountyWithAI(params: BountyCreationParams): Promise<GeneratedBounty | null> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log(`      ⏸️ OpenAI API paused - skipping bounty generation`);
      return null;
    }
    
    try {
      const expertiseString = params.personality.expertise.join(', ');
      
      const prompt = `You are ${params.username}, a crypto enthusiast specializing in ${expertiseString}. 
You want to create a bounty for summarizing crypto content.

Generate a realistic bounty request for a podcast/video summary with:
1. A compelling title
2. A detailed description explaining what you want summarized and why
3. Category (one of: DeFi, NFTs, Layer 2, Tokenomics, DAOs, Gaming, Infrastructure)
4. Difficulty (easy, medium, hard, expert)
5. 3-5 relevant tags

Make it sound natural and authentic, like a real person requesting content analysis.
Focus on topics related to: ${expertiseString}

Respond in JSON format:
{
  "title": "string",
  "description": "string", 
  "category": "string",
  "difficulty": "string",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates realistic crypto bounty requests. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 400,
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) return null;
      
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const data = JSON.parse(jsonMatch[0]);
      
      // Generate a realistic content URL
      const contentUrl = this.generateContentUrl(data.category);
      
      return {
        title: data.title,
        description: data.description,
        contentUrl,
        category: data.category,
        difficulty: data.difficulty,
        tags: data.tags,
        reward: 0, // Will be calculated separately
      };
      
    } catch (error: any) {
      console.error(`      ❌ GPT-4 generation failed:`, error.message);
      return null;
    }
  }
  
  /**
   * Generate a realistic content URL based on category
   * Uses real crypto/DeFi YouTube content from popular channels
   */
  private generateContentUrl(category: string): string {
    // Real crypto content YouTube videos from popular channels
    const cryptoVideoIds: Record<string, string[]> = {
      // Bankless episodes
      bankless: ['kGjFTzRTH3Q', 'P7D5knRO48c', 'TbGQ3aNEjVg', 'VsrFLe6MlME'],
      // Lex Fridman crypto interviews  
      lex: ['3x1b_S6Qp2Q', 'rYEY2B79zaM', 'VeH7qKZr0WI', 'Jl0p_d8aYu0'],
      // Coin Bureau educational content
      coinbureau: ['ZE2HxTmxfrI', 'VYWc9dFqROI', 'Yb6825iv0Vk', 'Xo8flMQ5L8s'],
      // Real Vision Finance
      realvision: ['sE-sD1dxVvA', 'r3Wp_aeF0Ms', 'wLr0T9t7gkY', 'CeJbfmNfGWQ'],
      // The Defiant
      defiant: ['4z5vNBvNDSc', 'JMZBkVz94cE', 'O7gBfjmQiJ8', 'qVUFg7xRpEE'],
      // General crypto/DeFi/NFT content
      general: ['M3EFi_POhps', 'rjFbNL1OlRQ', '7LqaIDemXlE', 'ehDzBwwB4WQ'],
    };
    
    // Map categories to relevant video sources
    const categoryMapping: Record<string, string[]> = {
      defi: [...cryptoVideoIds.bankless, ...cryptoVideoIds.defiant],
      crypto: [...cryptoVideoIds.coinbureau, ...cryptoVideoIds.lex],
      nft: [...cryptoVideoIds.general, ...cryptoVideoIds.defiant],
      trading: [...cryptoVideoIds.realvision, ...cryptoVideoIds.coinbureau],
      governance: [...cryptoVideoIds.bankless, ...cryptoVideoIds.defiant],
      yield_farming: [...cryptoVideoIds.bankless, ...cryptoVideoIds.defiant],
      infrastructure: [...cryptoVideoIds.lex, ...cryptoVideoIds.coinbureau],
      regulation: [...cryptoVideoIds.realvision, ...cryptoVideoIds.coinbureau],
    };
    
    // Get relevant videos for category, fallback to general
    const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
    const relevantVideos = categoryMapping[normalizedCategory] || 
      [...cryptoVideoIds.general, ...cryptoVideoIds.coinbureau, ...cryptoVideoIds.bankless];
    
    const randomVideoId = relevantVideos[Math.floor(Math.random() * relevantVideos.length)];
    return `https://www.youtube.com/watch?v=${randomVideoId}`;
  }
  
  /**
   * Calculate bounty reward based on agent wealth and personality
   */
  private calculateReward(streamPoints: number, personality: AgentPersonality): number {
    // Base reward depends on wealth tier
    let baseReward: number;
    
    if (streamPoints > 100000) {
      // Whales: 2000-5000 STREAM
      baseReward = 2000 + Math.floor(Math.random() * 3000);
    } else if (streamPoints > 50000) {
      // Rich: 1000-3000 STREAM
      baseReward = 1000 + Math.floor(Math.random() * 2000);
    } else if (streamPoints > 20000) {
      // Upper middle: 500-1500 STREAM
      baseReward = 500 + Math.floor(Math.random() * 1000);
    } else if (streamPoints > 5000) {
      // Middle class: 200-800 STREAM
      baseReward = 200 + Math.floor(Math.random() * 600);
    } else {
      // Budget conscious: 100-400 STREAM
      baseReward = 100 + Math.floor(Math.random() * 300);
    }
    
    // Adjust based on risk tolerance
    const riskMultipliers = {
      'very-low': 0.7,
      'low': 0.85,
      'medium': 1.0,
      'high': 1.2,
      'very-high': 1.5,
    };
    const riskMultiplier = riskMultipliers[personality.riskTolerance];
    
    // Adjust based on personality traits
    let personalityMultiplier = 1.0;
    if (personality.longTermOriented) personalityMultiplier *= 1.1;
    if (personality.fomoProne) personalityMultiplier *= 1.15;
    
    const finalReward = Math.floor(baseReward * riskMultiplier * personalityMultiplier);
    
    // Ensure reward doesn't exceed 30% of agent's balance
    const maxReward = Math.floor(streamPoints * 0.3);
    
    // Ensure minimum reward of 50 STREAM for visibility
    const minReward = 50;
    const cappedReward = Math.min(finalReward, maxReward);
    
    return Math.max(cappedReward, minReward);
  }
  
  /**
   * Select engagement tier based on personality
   */
  private selectEngagementTier(personality: AgentPersonality): string {
    const random = Math.random();
    
    // Expert agents more likely to request higher tier
    if (personality.expertise.length >= 3) {
      if (random < 0.3) return 'prediction';
      if (random < 0.6) return 'analysis';
      return 'basic';
    }
    
    // Long-term oriented agents want deeper analysis
    if (personality.longTermOriented) {
      if (random < 0.4) return 'analysis';
      if (random < 0.6) return 'prediction';
      return 'basic';
    }
    
    // Default distribution
    if (random < 0.6) return 'basic';
    if (random < 0.85) return 'analysis';
    return 'prediction';
  }
  
  /**
   * Get agent's wallet address
   */
  private async getAgentWallet(agentId: string): Promise<string> {
    const [user] = await db
      .select({ walletAddress: users.walletAddress })
      .from(users)
      .where(eq(users.id, agentId))
      .limit(1);
    
    return user?.walletAddress || '0x0000000000000000000000000000000000000000';
  }
}

// Singleton instance
let bountyEngineInstance: AgentBountyEngine | null = null;

export function getAgentBountyEngine(): AgentBountyEngine {
  if (!bountyEngineInstance) {
    bountyEngineInstance = new AgentBountyEngine();
  }
  return bountyEngineInstance;
}
