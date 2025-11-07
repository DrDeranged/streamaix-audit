import { storage } from '../storage';
import { AgentContentCreator } from './agentContentCreator';
import type { AgentPersonality, SkillLevel } from '../types/agents';

export interface SubmitSummaryParams {
  agentId: number;
  username: string;
  personality: AgentPersonality;
  streamPoints: number;
}

export class AgentSummarySubmitter {
  private contentCreator: AgentContentCreator;

  constructor() {
    this.contentCreator = new AgentContentCreator();
  }

  /**
   * Submit a summary to an interesting bounty
   */
  async submitSummary(params: SubmitSummaryParams): Promise<boolean> {
    try {
      console.log(`      📄 Finding bounty to submit summary...`);
      
      // Get open bounties
      const bounties = await storage.getAllBounties({ status: 'open', limit: 20 });
      if (!bounties || bounties.length === 0) {
        console.log(`      ⚠️  No open bounties found`);
        return false;
      }
      
      // Filter bounties that match agent expertise
      const relevantBounties = this.filterRelevantBounties(bounties, params.personality);
      
      if (relevantBounties.length === 0) {
        console.log(`      ⚠️  No relevant bounties for this agent's expertise`);
        return false;
      }
      
      // Pick a random bounty from relevant ones
      const bounty = relevantBounties[Math.floor(Math.random() * relevantBounties.length)];
      
      console.log(`      🎯 Selected bounty: "${bounty.title}"`);
      
      // Generate summary content
      const summaryContent = await this.contentCreator.generateSummary({
        bountyTitle: bounty.title,
        bountyDescription: bounty.description,
        contentUrl: bounty.contentUrl || 'https://example.com/content',
        category: bounty.category,
        personality: params.personality,
        skillLevel: this.mapActivityToSkill(params.personality),
      });
      
      if (!summaryContent) {
        console.log(`      ❌ Failed to generate summary content`);
        return false;
      }
      
      // Create the summary in the database
      const summary = await storage.createSummary({
        title: this.generateSummaryTitle(bounty.title),
        summary: summaryContent.summary,
        tldrSummary: summaryContent.tldrSummary,
        blogPost: this.expandSummaryToBlog(summaryContent.summary),
        contentUrl: bounty.contentUrl || 'https://example.com/content',
        category: bounty.category,
        tags: bounty.tags || [],
        chapters: summaryContent.keyInsights,
        creatorId: params.agentId,
        bountyId: bounty.id,
        metadata: {
          aiGenerated: true,
          agentUsername: params.username,
          qualityScore: summaryContent.quality,
        },
      });
      
      console.log(`      ✅ Submitted summary (ID: ${summary.id}, quality: ${summaryContent.quality}/100)`);
      
      // Optionally claim the bounty if not already claimed
      if (!bounty.claimerId && Math.random() > 0.5) {
        await this.attemptBountyClaim(bounty.id, params.agentId);
      }
      
      return true;
      
    } catch (error: any) {
      console.error(`      ❌ Summary submission failed:`, error.message);
      return false;
    }
  }
  
  /**
   * Filter bounties relevant to agent's expertise
   */
  private filterRelevantBounties(bounties: any[], personality: AgentPersonality): any[] {
    return bounties.filter(bounty => {
      // Match by category
      const categoryMatch = personality.expertise.some(exp => 
        bounty.category?.toLowerCase().includes(exp.toLowerCase()) ||
        exp.toLowerCase().includes(bounty.category?.toLowerCase())
      );
      
      // Match by tags
      const tagMatch = bounty.tags?.some((tag: string) =>
        personality.expertise.some(exp => 
          tag.toLowerCase().includes(exp.toLowerCase()) ||
          exp.toLowerCase().includes(tag.toLowerCase())
        )
      );
      
      return categoryMatch || tagMatch || Math.random() > 0.7; // 30% random chance for diversity
    });
  }
  
  /**
   * Map activity level to skill level
   */
  private mapActivityToSkill(personality: AgentPersonality): SkillLevel {
    const activityMap: Record<string, SkillLevel> = {
      'casual': 'beginner',
      'regular': 'intermediate',
      'active': 'intermediate',
      'hyperactive': 'expert',
    };
    
    // High risk tolerance agents are more advanced
    if (personality.riskTolerance === 'very-high' || personality.riskTolerance === 'high') {
      return 'advanced';
    }
    
    return activityMap[personality.activityLevel] || 'intermediate';
  }
  
  /**
   * Generate a summary title from bounty title
   */
  private generateSummaryTitle(bountyTitle: string): string {
    const prefixes = [
      'Analysis:',
      'Deep Dive:',
      'Summary:',
      'Overview:',
      'Insights:',
      'Key Takeaways:',
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix} ${bountyTitle}`;
  }
  
  /**
   * Expand summary to blog post format
   */
  private expandSummaryToBlog(summary: string): string {
    return `## Introduction\n\n${summary}\n\n## Key Points\n\nThis analysis covers the main aspects of the topic, providing valuable insights for the community.\n\n## Conclusion\n\nBased on the analysis above, we can see important trends and opportunities in this space.`;
  }
  
  /**
   * Attempt to claim a bounty
   */
  private async attemptBountyClaim(bountyId: string, agentId: number): Promise<void> {
    try {
      const storage = getStorage();
      await storage.updateBounty(bountyId, {
        claimerId: agentId,
        status: 'in_progress',
      });
      console.log(`      🎯 Claimed bounty ${bountyId}`);
    } catch (error: any) {
      // Ignore claim errors (might be claimed by someone else)
      console.log(`      ⚠️  Bounty claim failed (likely already claimed)`);
    }
  }
}

// Singleton instance
let agentSummarySubmitter: AgentSummarySubmitter | null = null;

export function getAgentSummarySubmitter(): AgentSummarySubmitter {
  if (!agentSummarySubmitter) {
    agentSummarySubmitter = new AgentSummarySubmitter();
  }
  return agentSummarySubmitter;
}
