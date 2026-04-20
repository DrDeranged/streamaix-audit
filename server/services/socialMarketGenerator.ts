import OpenAI from 'openai';
import { db } from "../db";
import { predictionMarkets, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-missing-deploy-time-key",
});

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  published: string;
  url: string;
}

interface GeneratedMarket {
  question: string;
  description: string;
  category: string;
  aiProbability: number;
  reasoning: string;
  deadline: Date;
  tags: string[];
}

export class SocialMarketGenerator {
  /**
   * Analyze a news article and generate a prediction market
   */
  async generateMarketFromNews(article: NewsArticle): Promise<GeneratedMarket | null> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log('⏸️ OpenAI API paused - skipping news market generation');
      return null;
    }
    
    try {
      const prompt = `You are an expert at creating prediction markets from news articles. Analyze this article and create a binary YES/NO prediction market question.

Article Title: ${article.title}
Summary: ${article.summary}
Category: ${article.category}

Generate a prediction market with:
1. A clear, specific YES/NO question that can be resolved objectively
2. A brief description (1-2 sentences) with context
3. Your probability assessment (0-100) that YES will win
4. Brief reasoning for your probability
5. Appropriate deadline (1-4 weeks from now based on topic urgency)
6. 2-4 relevant tags

The question must be:
- Binary (answerable with YES or NO)
- Specific and measurable
- Resolvable with objective data sources
- Interesting for traders
- Related to the article content

Examples:
- "Will Bitcoin reach $100,000 by end of Q1 2025?"
- "Will Ethereum ETF see $1B inflows in first week?"
- "Will the Fed cut rates at the next FOMC meeting?"

Format your response as JSON:
{
  "question": "<binary question>",
  "description": "<context and details>",
  "category": "<crypto|defi|macro|social>",
  "probability": <number 0-100>,
  "reasoning": "<why this probability>",
  "deadlineInDays": <number 7-28>,
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // COST OPTIMIZATION: 90% cheaper for market generation
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating engaging, tradeable prediction markets from news articles. Create questions that traders will want to bet on.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate the response
      if (!result.question || !result.description) {
        console.log('⚠️ Invalid market generated from news:', article.title);
        return null;
      }

      // Calculate deadline
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + (result.deadlineInDays || 14));

      return {
        question: result.question,
        description: result.description,
        category: result.category || article.category,
        aiProbability: result.probability || 50,
        reasoning: result.reasoning || 'Based on current market conditions and trends.',
        deadline: deadlineDate,
        tags: result.tags || []
      };
    } catch (error: any) {
      console.error('❌ Error generating market from news:', error);
      return null;
    }
  }

  /**
   * Create markets from multiple news articles and save to database
   */
  async createMarketsFromNewsFeed(articles: NewsArticle[], maxMarkets: number = 3): Promise<{
    created: number;
    failed: number;
    markets: any[];
  }> {
    try {
      console.log(`🎯 Generating ${maxMarkets} markets from ${articles.length} news articles...`);

      // Get AI creator account (or create one if it doesn't exist)
      let aiCreator = await db
        .select()
        .from(users)
        .where(eq(users.username, 'AI Market Spotter'))
        .limit(1);

      if (aiCreator.length === 0) {
        // Create AI creator account
        const newAiCreator = await db.insert(users).values({
          username: 'AI Market Spotter',
          email: 'ai-markets@streamaix.ai',
          password: '', // AI account doesn't need password
          isAiAgent: true,
          pointsBalance: 1000000, // 1M STREAM for liquidity
        }).returning();
        aiCreator = newAiCreator;
      }

      const creatorId = aiCreator[0].id;
      const createdMarkets: any[] = [];
      let failed = 0;

      // Select most relevant articles (mix of categories)
      const selectedArticles = this.selectDiverseArticles(articles, maxMarkets);

      for (const article of selectedArticles) {
        try {
          const generatedMarket = await this.generateMarketFromNews(article);
          
          if (!generatedMarket) {
            failed++;
            continue;
          }

          // Check if similar market already exists
          const existingMarkets = await db
            .select()
            .from(predictionMarkets)
            .where(eq(predictionMarkets.question, generatedMarket.question))
            .limit(1);

          if (existingMarkets.length > 0) {
            console.log('⚠️ Skipping duplicate market:', generatedMarket.question);
            continue;
          }

          // Create the market in the database
          // Note: sourceContentId is NOT used for news-generated markets as news article IDs
          // are not in the summaries table (sourceContentId references summaries.id)
          const newMarket = await db.insert(predictionMarkets).values({
            question: generatedMarket.question,
            description: generatedMarket.description,
            category: generatedMarket.category as any,
            creatorId,
            creatorWallet: '', // AI-generated markets don't have a wallet
            deadline: generatedMarket.deadline,
            resolutionSource: 'oracle',
            yesPrice: 500000, // Start at 50%
            noPrice: 500000,
            yesLiquidity: 5000, // Initial liquidity
            noLiquidity: 5000,
            initialLiquidity: 10000, // 10K STREAM initial liquidity
            totalVolume: 0,
            totalTrades: 0,
            status: 'active',
            tags: generatedMarket.tags,
            aiProbability: generatedMarket.aiProbability,
            aiReasoning: generatedMarket.reasoning,
            // Store news article source info in aiReasoning field instead
          }).returning();

          createdMarkets.push(newMarket[0]);
          console.log(`✅ Created market: ${generatedMarket.question}`);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          console.error(`❌ Failed to create market from article:`, error);
          failed++;
        }
      }

      console.log(`✨ Market generation complete: ${createdMarkets.length} created, ${failed} failed`);
      
      return {
        created: createdMarkets.length,
        failed,
        markets: createdMarkets
      };
    } catch (error: any) {
      console.error('❌ Error in market generation process:', error);
      throw error;
    }
  }

  /**
   * Select diverse articles across different categories
   */
  private selectDiverseArticles(articles: NewsArticle[], count: number): NewsArticle[] {
    if (articles.length <= count) {
      return articles;
    }

    // Group by category
    const byCategory = new Map<string, NewsArticle[]>();
    articles.forEach(article => {
      const category = article.category || 'general';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(article);
    });

    // Select evenly from each category
    const selected: NewsArticle[] = [];
    const categories = Array.from(byCategory.keys());
    let categoryIndex = 0;

    while (selected.length < count) {
      const category = categories[categoryIndex % categories.length];
      const categoryArticles = byCategory.get(category)!;
      
      if (categoryArticles.length > 0) {
        selected.push(categoryArticles.shift()!);
      }
      
      categoryIndex++;
      
      // Break if we've exhausted all articles
      if (Array.from(byCategory.values()).every(arr => arr.length === 0)) {
        break;
      }
    }

    return selected;
  }

  /**
   * Get social-generated markets (markets with sourceContentId)
   */
  async getSocialMarkets(limit: number = 10): Promise<any[]> {
    try {
      const markets = await db
        .select()
        .from(predictionMarkets)
        .where(eq(predictionMarkets.status, 'active'))
        .orderBy(predictionMarkets.createdAt)
        .limit(limit);

      return markets;
    } catch (error: any) {
      console.error('❌ Error fetching social markets:', error);
      return [];
    }
  }
}

export const socialMarketGenerator = new SocialMarketGenerator();
