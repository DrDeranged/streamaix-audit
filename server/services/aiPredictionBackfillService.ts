import OpenAI from 'openai';
import { db } from "../db";
import { predictionMarkets } from "@shared/schema";
import { isNull, eq } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIPredictionBackfillService {
  /**
   * Generate AI prediction for a single market question
   */
  async generateAIPrediction(question: string): Promise<{
    aiProbability: number;
    aiReasoning: string;
  }> {
    try {
      const prompt = `You are an expert prediction analyst. Analyze this prediction market question and provide your prediction.

Question: ${question}

Provide:
1. Your probability assessment (0-100) that this will happen
2. A concise reasoning (1-2 sentences) explaining your prediction

Format your response as JSON:
{
  "probability": <number 0-100>,
  "reasoning": "<your reasoning>"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert prediction analyst. Provide probability assessments based on current trends, data, and logical reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        aiProbability: result.probability || 50,
        aiReasoning: result.reasoning || 'Analysis based on current market conditions and trends.'
      };
    } catch (error: any) {
      console.error('❌ Error generating AI prediction:', error);
      // Return default prediction on error
      return {
        aiProbability: 50,
        aiReasoning: 'Unable to generate detailed prediction at this time.'
      };
    }
  }

  /**
   * Backfill AI predictions for all markets with NULL values
   */
  async backfillAllMarkets(): Promise<{
    total: number;
    updated: number;
    failed: number;
  }> {
    try {
      console.log('🔄 Starting AI prediction backfill...');
      
      // Get all markets with NULL AI predictions
      const marketsToUpdate = await db
        .select()
        .from(predictionMarkets)
        .where(isNull(predictionMarkets.aiProbability));

      console.log(`📊 Found ${marketsToUpdate.length} markets to backfill`);

      let updated = 0;
      let failed = 0;

      for (const market of marketsToUpdate) {
        try {
          console.log(`🤖 Generating prediction for: ${market.question}`);
          
          const prediction = await this.generateAIPrediction(market.question);
          
          await db
            .update(predictionMarkets)
            .set({
              aiProbability: prediction.aiProbability,
              aiReasoning: prediction.aiReasoning,
              updatedAt: new Date()
            })
            .where(eq(predictionMarkets.id, market.id));
          
          console.log(`✅ Updated market ${market.id}: ${prediction.aiProbability}% - ${prediction.aiReasoning}`);
          updated++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`❌ Failed to update market ${market.id}:`, error);
          failed++;
        }
      }

      console.log(`✨ Backfill complete: ${updated} updated, ${failed} failed`);
      
      return {
        total: marketsToUpdate.length,
        updated,
        failed
      };
    } catch (error: any) {
      console.error('❌ Error in backfill process:', error);
      throw error;
    }
  }

  /**
   * Backfill a specific market by ID
   */
  async backfillMarket(marketId: string): Promise<void> {
    try {
      const [market] = await db
        .select()
        .from(predictionMarkets)
        .where(eq(predictionMarkets.id, marketId));

      if (!market) {
        throw new Error(`Market ${marketId} not found`);
      }

      const prediction = await this.generateAIPrediction(market.question);
      
      await db
        .update(predictionMarkets)
        .set({
          aiProbability: prediction.aiProbability,
          aiReasoning: prediction.aiReasoning,
          updatedAt: new Date()
        })
        .where(eq(predictionMarkets.id, marketId));
      
      console.log(`✅ Updated market ${marketId}: ${prediction.aiProbability}%`);
    } catch (error: any) {
      console.error(`❌ Error backfilling market ${marketId}:`, error);
      throw error;
    }
  }
}

export const aiPredictionBackfillService = new AIPredictionBackfillService();
