import OpenAI from 'openai';
import { db } from "../db";
import { predictionMarkets, users, knowledgeAvatars } from "@shared/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GeneratedMarket {
  question: string;
  description: string;
  category: string;
  aiProbability: number;
  reasoning: string;
  deadline: Date;
  tags: string[];
}

export class AvatarMarketGenerator {
  /**
   * Generate prediction markets based on avatar's activities and investments
   */
  async generateMarketsForAvatar(avatarId: string): Promise<GeneratedMarket[]> {
    try {
      // Get avatar details
      const avatar = await db
        .select()
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, avatarId))
        .limit(1);

      if (avatar.length === 0) {
        console.log('⚠️ Avatar not found:', avatarId);
        return [];
      }

      const avatarData = avatar[0];
      const prompt = `You are an expert at creating prediction markets about entrepreneurs, investors, and influential figures in crypto/tech.

Entrepreneur: ${avatarData.name}
Bio: ${avatarData.bio}
Expertise: ${avatarData.expertise}
Investment Focus: ${JSON.stringify(avatarData.investmentFocus)}
Notable Investments: ${JSON.stringify(avatarData.notableInvestments)}
Philosophical Views: ${JSON.stringify(avatarData.philosophicalViews)}

Generate 2-3 prediction markets about this person's future activities, investment predictions, or influence. Markets should be:
- Binary YES/NO questions
- Specific and measurable
- Resolvable within 1-6 months
- Related to their expertise and influence
- Interesting for traders who follow this person

Examples:
- "Will ${avatarData.name} publicly invest in a major AI company by Q2 2025?"
- "Will ${avatarData.name}'s portfolio ROI exceed 50% by end of Q1 2025?"
- "Will ${avatarData.name} launch a new crypto project by March 2025?"

Format your response as JSON array:
[
  {
    "question": "<binary question>",
    "description": "<context and details>",
    "category": "avatar",
    "probability": <number 0-100>,
    "reasoning": "<why this probability>",
    "deadlineInDays": <number 30-180>,
    "tags": ["tag1", "tag2"]
  }
]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating engaging, tradeable prediction markets about influential people in crypto and tech.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"markets": []}');
      const markets = result.markets || [];

      return markets.map((m: any) => {
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + (m.deadlineInDays || 90));

        return {
          question: m.question,
          description: m.description,
          category: 'avatar',
          aiProbability: m.probability || 50,
          reasoning: m.reasoning || 'Based on historical activity and current trends.',
          deadline: deadlineDate,
          tags: [...(m.tags || []), avatarData.name],
        };
      });
    } catch (error: any) {
      console.error('❌ Error generating avatar markets:', error);
      return [];
    }
  }

  /**
   * Create and save markets for an avatar
   */
  async createMarketsForAvatar(avatarId: string): Promise<{
    created: number;
    markets: any[];
  }> {
    try {
      console.log(`🎯 Generating markets for avatar: ${avatarId}`);

      // Get AI creator account
      let aiCreator = await db
        .select()
        .from(users)
        .where(eq(users.username, 'AI Market Spotter'))
        .limit(1);

      if (aiCreator.length === 0) {
        const newAiCreator = await db.insert(users).values({
          username: 'AI Market Spotter',
          email: 'ai-markets@streamaix.ai',
          password: '',
          isAiAgent: true,
          pointsBalance: 1000000,
        }).returning();
        aiCreator = newAiCreator;
      }

      const creatorId = aiCreator[0].id;
      const generatedMarkets = await this.generateMarketsForAvatar(avatarId);
      const createdMarkets: any[] = [];

      for (const market of generatedMarkets) {
        try {
          // Check if similar market exists
          const existingMarkets = await db
            .select()
            .from(predictionMarkets)
            .where(eq(predictionMarkets.question, market.question))
            .limit(1);

          if (existingMarkets.length > 0) {
            console.log('⚠️ Skipping duplicate market:', market.question);
            continue;
          }

          // Create the market (use tags to link to avatar, not sourceContentId which is FK constrained)
          const newMarket = await db.insert(predictionMarkets).values({
            question: market.question,
            description: market.description,
            category: 'avatar' as any,
            creatorId,
            deadline: market.deadline,
            resolutionSource: 'oracle',
            yesPrice: 500000,
            noPrice: 500000,
            yesLiquidity: 3000,
            noLiquidity: 3000,
            initialLiquidity: 6000,
            totalVolume: 0,
            totalTrades: 0,
            status: 'active',
            tags: market.tags, // Tags include avatar name for linking
            aiProbability: market.aiProbability,
            aiReasoning: market.reasoning,
          }).returning();

          createdMarkets.push(newMarket[0]);
          console.log(`✅ Created avatar market: ${market.question}`);
        } catch (error: any) {
          console.error(`❌ Failed to create market:`, error);
        }
      }

      return {
        created: createdMarkets.length,
        markets: createdMarkets
      };
    } catch (error: any) {
      console.error('❌ Error in avatar market creation:', error);
      throw error;
    }
  }

  /**
   * Get markets for a specific avatar by looking at tags that include the avatar name
   */
  async getMarketsForAvatar(avatarId: string, limit: number = 3): Promise<any[]> {
    try {
      // First get the avatar name
      const avatar = await db
        .select({ name: knowledgeAvatars.name })
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, avatarId))
        .limit(1);

      if (avatar.length === 0) {
        return [];
      }

      const avatarName = avatar[0].name;

      // Get markets that have this avatar's name in tags or in category 'avatar'
      const markets = await db
        .select()
        .from(predictionMarkets)
        .where(eq(predictionMarkets.category, 'avatar'))
        .limit(20); // Get more and filter

      // Filter by avatar name in tags
      const avatarMarkets = markets.filter(m => {
        if (!m.tags || m.tags.length === 0) return false;
        return m.tags.some(tag => 
          tag.toLowerCase().includes(avatarName.toLowerCase()) ||
          avatarName.toLowerCase().includes(tag.toLowerCase())
        );
      });

      return avatarMarkets.slice(0, limit);
    } catch (error: any) {
      console.error('❌ Error fetching avatar markets:', error);
      return [];
    }
  }
}

export const avatarMarketGenerator = new AvatarMarketGenerator();
