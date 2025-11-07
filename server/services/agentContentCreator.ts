import OpenAI from 'openai';
import type { AgentPersonality, SkillLevel } from '../types/agents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SummaryCreationParams {
  bountyTitle: string;
  bountyDescription: string;
  contentUrl: string;
  category: string;
  personality: AgentPersonality;
  skillLevel: SkillLevel;
}

export interface CommentCreationParams {
  targetType: 'bounty' | 'market' | 'summary';
  targetTitle: string;
  targetDescription: string;
  personality: AgentPersonality;
}

export class AgentContentCreator {
  /**
   * Generate a summary for a bounty submission
   */
  async generateSummary(params: SummaryCreationParams): Promise<{
    summary: string;
    tldrSummary: string;
    keyInsights: any[];
    quality: number;
  } | null> {
    try {
      console.log(`      🎨 Generating summary...`);
      
      const prompt = this.buildSummaryPrompt(params);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getSummarySystemPrompt(params.skillLevel),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.getTemperatureForSkill(params.skillLevel),
        max_tokens: 1500,
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) return null;
      
      // Parse the generated content
      const parsedContent = this.parseSummaryContent(content);
      
      // Calculate quality based on skill level with variance
      const quality = this.calculateContentQuality(params.skillLevel, params.personality);
      
      console.log(`      ✅ Generated summary (quality: ${quality}/100)`);
      
      return {
        ...parsedContent,
        quality,
      };
      
    } catch (error: any) {
      console.error(`      ❌ Summary generation failed:`, error.message);
      return null;
    }
  }
  
  /**
   * Generate a comment for social engagement
   */
  async generateComment(params: CommentCreationParams): Promise<string | null> {
    try {
      console.log(`      💬 Generating comment...`);
      
      const prompt = this.buildCommentPrompt(params);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a crypto community member leaving thoughtful comments. Be concise, authentic, and add value. 1-3 sentences max.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 150,
      });
      
      const comment = response.choices[0]?.message?.content?.trim();
      
      if (!comment) return null;
      
      console.log(`      ✅ Generated comment`);
      
      return comment;
      
    } catch (error: any) {
      console.error(`      ❌ Comment generation failed:`, error.message);
      return null;
    }
  }
  
  /**
   * Generate market analysis/prediction rationale
   */
  async generateMarketRationale(params: {
    marketQuestion: string;
    prediction: 'YES' | 'NO';
    personality: AgentPersonality;
  }): Promise<string | null> {
    try {
      const prompt = `As a ${params.personality.expertise.join('/')} expert, explain why you predict ${params.prediction} for this prediction market:

"${params.marketQuestion}"

Provide a brief, data-driven rationale (2-3 sentences). Consider your trading style: ${params.personality.tradingStyle}.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a crypto trader explaining your market predictions. Be concise and analytical.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });
      
      return response.choices[0]?.message?.content?.trim() || null;
      
    } catch (error: any) {
      console.error(`      ❌ Rationale generation failed:`, error.message);
      return null;
    }
  }
  
  /**
   * Build summary generation prompt
   */
  private buildSummaryPrompt(params: SummaryCreationParams): string {
    const expertiseString = params.personality.expertise.join(', ');
    const focusString = params.personality.contentFocus;
    
    return `You are creating a summary for this bounty:

Title: ${params.bountyTitle}
Description: ${params.bountyDescription}
Category: ${params.category}
Content URL: ${params.contentUrl}

Your expertise: ${expertiseString}
Your focus: ${focusString} analysis

Create a comprehensive summary with:
1. Executive summary (2-3 paragraphs)
2. TLDR (2-3 sentences)
3. 3-5 key insights (as a JSON array)

Format your response as:
EXECUTIVE SUMMARY:
[Your executive summary here]

TLDR:
[Your TLDR here]

KEY INSIGHTS:
[JSON array of insights]`;
  }
  
  /**
   * Build comment generation prompt
   */
  private buildCommentPrompt(params: CommentCreationParams): string {
    const expertiseString = params.personality.expertise.join(', ');
    
    let contextPrompt = '';
    
    switch (params.targetType) {
      case 'bounty':
        contextPrompt = `Comment on this bounty request:\n"${params.targetTitle}"\n${params.targetDescription}`;
        break;
      case 'market':
        contextPrompt = `Comment on this prediction market:\n"${params.targetTitle}"\n${params.targetDescription}`;
        break;
      case 'summary':
        contextPrompt = `Comment on this content summary:\n"${params.targetTitle}"`;
        break;
    }
    
    return `${contextPrompt}

Your expertise: ${expertiseString}

Leave a brief, thoughtful comment (1-3 sentences). ${params.personality.contrarian ? 'You tend to have contrarian views.' : 'Share your perspective.'}`;
  }
  
  /**
   * Get system prompt based on skill level
   */
  private getSummarySystemPrompt(skillLevel: SkillLevel): string {
    const prompts = {
      beginner: 'You are a beginner crypto analyst. Your summaries are clear but may miss some nuanced details. Focus on the basics.',
      intermediate: 'You are an intermediate crypto analyst. Your summaries are solid with good coverage of key points.',
      advanced: 'You are an advanced crypto analyst. Your summaries are detailed, well-structured, and insightful.',
      expert: 'You are an expert crypto analyst. Your summaries are comprehensive, deeply analytical, and include sophisticated insights.',
    };
    
    return prompts[skillLevel];
  }
  
  /**
   * Get temperature based on skill level
   */
  private getTemperatureForSkill(skillLevel: SkillLevel): number {
    const temperatures = {
      beginner: 0.9, // More variation, less consistency
      intermediate: 0.8,
      advanced: 0.7,
      expert: 0.6, // More focused, consistent
    };
    
    return temperatures[skillLevel];
  }
  
  /**
   * Parse summary content from GPT response
   */
  private parseSummaryContent(content: string): {
    summary: string;
    tldrSummary: string;
    keyInsights: any[];
  } {
    // Extract executive summary
    const summaryMatch = content.match(/EXECUTIVE SUMMARY:([\s\S]*?)(?=TLDR:|$)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : content.substring(0, 500);
    
    // Extract TLDR
    const tldrMatch = content.match(/TLDR:([\s\S]*?)(?=KEY INSIGHTS:|$)/i);
    const tldrSummary = tldrMatch ? tldrMatch[1].trim() : content.substring(0, 200);
    
    // Extract key insights
    let keyInsights: any[] = [];
    const insightsMatch = content.match(/KEY INSIGHTS:([\s\S]*?)$/i);
    if (insightsMatch) {
      try {
        const jsonMatch = insightsMatch[1].match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          keyInsights = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Fallback: create simple insights array
        keyInsights = [
          { insight: 'Analysis of key market trends', importance: 'high' },
          { insight: 'Technical analysis and data points', importance: 'medium' },
          { insight: 'Future outlook and predictions', importance: 'high' },
        ];
      }
    }
    
    return {
      summary,
      tldrSummary,
      keyInsights,
    };
  }
  
  /**
   * Calculate content quality based on skill level with realistic variance
   */
  private calculateContentQuality(skillLevel: SkillLevel, personality: AgentPersonality): number {
    // Base quality by skill level
    const baseQuality = {
      beginner: 55,
      intermediate: 70,
      advanced: 82,
      expert: 92,
    };
    
    let quality = baseQuality[skillLevel];
    
    // Add random variance (±5-15 points based on skill)
    const variance = {
      beginner: 15,
      intermediate: 12,
      advanced: 8,
      expert: 5,
    };
    
    const randomVariance = (Math.random() - 0.5) * 2 * variance[skillLevel];
    quality += randomVariance;
    
    // Personality adjustments
    if (personality.confidenceBias > 0.7) {
      quality += 3; // Confident agents produce slightly better work
    }
    
    if (personality.longTermOriented) {
      quality += 2; // Long-term thinkers are more thorough
    }
    
    // Content focus bonus
    if (personality.contentFocus === 'technical' || personality.contentFocus === 'fundamental') {
      quality += 3;
    }
    
    // Ensure quality is within 0-100 range
    return Math.max(40, Math.min(100, Math.round(quality)));
  }
}

// Singleton instance
let contentCreatorInstance: AgentContentCreator | null = null;

export function getAgentContentCreator(): AgentContentCreator {
  if (!contentCreatorInstance) {
    contentCreatorInstance = new AgentContentCreator();
  }
  return contentCreatorInstance;
}
