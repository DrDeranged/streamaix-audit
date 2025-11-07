import { db } from '../db';
import { bountyEngagements, userInteractions, users, bounties, summaries, predictionMarkets } from '../../shared/schema';
import { eq, and, ne, sql, desc } from 'drizzle-orm';
import type { AgentPersonality } from '../types/agents';
import { getAgentContentCreator } from './agentContentCreator';

export class AgentSocialEngine {
  private contentCreator = getAgentContentCreator();
  
  /**
   * Vote on a bounty, summary, or market
   */
  async voteAction(agentId: string, personality: AgentPersonality): Promise<boolean> {
    try {
      // Select random target to vote on
      const targetType = this.selectVoteTarget();
      
      switch (targetType) {
        case 'bounty':
          return await this.voteOnBounty(agentId, personality);
        case 'summary':
          return await this.voteOnSummary(agentId, personality);
        case 'market':
          return await this.voteOnMarket(agentId, personality);
        default:
          return false;
      }
    } catch (error: any) {
      console.error(`      ❌ Vote action failed:`, error.message);
      return false;
    }
  }
  
  /**
   * Comment on content
   */
  async commentAction(agentId: string, username: string, personality: AgentPersonality): Promise<boolean> {
    try {
      // Select random target to comment on
      const targetType = this.selectCommentTarget();
      
      switch (targetType) {
        case 'bounty':
          return await this.commentOnBounty(agentId, username, personality);
        case 'market':
          return await this.commentOnMarket(agentId, username, personality);
        default:
          return false;
      }
    } catch (error: any) {
      console.error(`      ❌ Comment action failed:`, error.message);
      return false;
    }
  }
  
  /**
   * Follow another user
   */
  async followAction(agentId: string, personality: AgentPersonality): Promise<boolean> {
    try {
      // Find users to potentially follow
      // Prefer users with similar expertise or high reputation
      const candidateUsers = await db
        .select({
          id: users.id,
          username: users.username,
          isAiAgent: users.isAiAgent,
        })
        .from(users)
        .where(ne(users.id, agentId))
        .limit(50);
      
      if (candidateUsers.length === 0) return false;
      
      // Select a random user (in a real implementation, we'd check if already following)
      const targetUser = candidateUsers[Math.floor(Math.random() * candidateUsers.length)];
      
      // Record follow interaction
      await db.insert(userInteractions).values({
        userId: agentId,
        interactionType: 'follow',
        metadata: { targetUserId: targetUser.id, targetUsername: targetUser.username },
      });
      
      console.log(`      👥 Followed @${targetUser.username}`);
      
      return true;
      
    } catch (error: any) {
      console.error(`      ❌ Follow action failed:`, error.message);
      return false;
    }
  }
  
  /**
   * Select what type of content to vote on
   */
  private selectVoteTarget(): 'bounty' | 'summary' | 'market' {
    const random = Math.random();
    if (random < 0.4) return 'bounty';
    if (random < 0.7) return 'summary';
    return 'market';
  }
  
  /**
   * Select what type of content to comment on
   */
  private selectCommentTarget(): 'bounty' | 'market' {
    return Math.random() < 0.6 ? 'bounty' : 'market';
  }
  
  /**
   * Vote on a random bounty
   */
  private async voteOnBounty(agentId: string, personality: AgentPersonality): Promise<boolean> {
    // Get random open bounties
    const openBounties = await db
      .select({
        id: bounties.id,
        title: bounties.title,
        creatorId: bounties.creatorId,
      })
      .from(bounties)
      .where(and(
        eq(bounties.status, 'open'),
        ne(bounties.creatorId, agentId) // Don't vote on own bounties
      ))
      .limit(20);
    
    if (openBounties.length === 0) return false;
    
    const targetBounty = openBounties[Math.floor(Math.random() * openBounties.length)];
    
    // Determine vote type (like/upvote most common)
    const engagementType = Math.random() < 0.85 ? 'like' : 'bookmark';
    
    await db.insert(bountyEngagements).values({
      bountyId: targetBounty.id,
      userId: agentId,
      engagementType,
      metadata: {},
    });
    
    console.log(`      👍 Voted on bounty: "${targetBounty.title}"`);
    
    return true;
  }
  
  /**
   * Vote on a random summary
   */
  private async voteOnSummary(agentId: string, personality: AgentPersonality): Promise<boolean> {
    // Get random summaries
    const recentSummaries = await db
      .select({
        id: summaries.id,
        title: summaries.title,
        creatorId: summaries.creatorId,
      })
      .from(summaries)
      .where(ne(summaries.creatorId, agentId))
      .orderBy(desc(summaries.createdAt))
      .limit(30);
    
    if (recentSummaries.length === 0) return false;
    
    const targetSummary = recentSummaries[Math.floor(Math.random() * recentSummaries.length)];
    
    const interactionType = Math.random() < 0.7 ? 'like' : 'bookmark';
    
    await db.insert(userInteractions).values({
      userId: agentId,
      summaryId: targetSummary.id,
      interactionType,
      metadata: {},
    });
    
    console.log(`      👍 Voted on summary: "${targetSummary.title}"`);
    
    return true;
  }
  
  /**
   * Vote on a random prediction market
   */
  private async voteOnMarket(agentId: string, personality: AgentPersonality): Promise<boolean> {
    // Get random active markets
    const activeMarkets = await db
      .select({
        id: predictionMarkets.id,
        question: predictionMarkets.question,
        creatorId: predictionMarkets.creatorId,
      })
      .from(predictionMarkets)
      .where(and(
        eq(predictionMarkets.status, 'active'),
        ne(predictionMarkets.creatorId, agentId)
      ))
      .limit(20);
    
    if (activeMarkets.length === 0) return false;
    
    const targetMarket = activeMarkets[Math.floor(Math.random() * activeMarkets.length)];
    
    await db.insert(userInteractions).values({
      userId: agentId,
      interactionType: 'like',
      metadata: { marketId: targetMarket.id, marketQuestion: targetMarket.question },
    });
    
    console.log(`      👍 Voted on market: "${targetMarket.question}"`);
    
    return true;
  }
  
  /**
   * Comment on a random bounty
   */
  private async commentOnBounty(agentId: string, username: string, personality: AgentPersonality): Promise<boolean> {
    // Get random bounties to comment on
    const bountyTargets = await db
      .select({
        id: bounties.id,
        title: bounties.title,
        description: bounties.description,
        creatorId: bounties.creatorId,
      })
      .from(bounties)
      .where(ne(bounties.creatorId, agentId))
      .limit(15);
    
    if (bountyTargets.length === 0) return false;
    
    const targetBounty = bountyTargets[Math.floor(Math.random() * bountyTargets.length)];
    
    // Generate comment using GPT-4
    const comment = await this.contentCreator.generateComment({
      targetType: 'bounty',
      targetTitle: targetBounty.title,
      targetDescription: targetBounty.description,
      personality,
    });
    
    if (!comment) return false;
    
    // Store comment
    await db.insert(bountyEngagements).values({
      bountyId: targetBounty.id,
      userId: agentId,
      engagementType: 'comment',
      metadata: { comment, username },
    });
    
    console.log(`      💬 Commented on bounty: "${targetBounty.title.substring(0, 40)}..."`);
    
    return true;
  }
  
  /**
   * Comment on a random prediction market
   */
  private async commentOnMarket(agentId: string, username: string, personality: AgentPersonality): Promise<boolean> {
    // Get random markets to comment on
    const marketTargets = await db
      .select({
        id: predictionMarkets.id,
        question: predictionMarkets.question,
        description: predictionMarkets.description,
        creatorId: predictionMarkets.creatorId,
      })
      .from(predictionMarkets)
      .where(and(
        eq(predictionMarkets.status, 'active'),
        ne(predictionMarkets.creatorId, agentId)
      ))
      .limit(15);
    
    if (marketTargets.length === 0) return false;
    
    const targetMarket = marketTargets[Math.floor(Math.random() * marketTargets.length)];
    
    // Generate comment using GPT-4
    const comment = await this.contentCreator.generateComment({
      targetType: 'market',
      targetTitle: targetMarket.question,
      targetDescription: targetMarket.description || '',
      personality,
    });
    
    if (!comment) return false;
    
    // Store comment
    await db.insert(userInteractions).values({
      userId: agentId,
      interactionType: 'comment',
      metadata: {
        marketId: targetMarket.id,
        comment,
        username,
      },
    });
    
    console.log(`      💬 Commented on market: "${targetMarket.question.substring(0, 40)}..."`);
    
    return true;
  }
}

// Singleton instance
let socialEngineInstance: AgentSocialEngine | null = null;

export function getAgentSocialEngine(): AgentSocialEngine {
  if (!socialEngineInstance) {
    socialEngineInstance = new AgentSocialEngine();
  }
  return socialEngineInstance;
}
