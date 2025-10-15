import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedPrediction {
  question: string;
  description: string;
  category: 'crypto' | 'defi' | 'bounty' | 'realworld' | 'community';
  deadline: string;
  resolutionSource: string;
  rationale: string;
  confidence: number;
  tags: string[];
}

export interface PredictionExtractionResult {
  predictions: ExtractedPrediction[];
  summaryInsights: string;
  totalFound: number;
}

export async function extractPredictionsFromSummary(
  summaryContent: string,
  summaryTitle: string,
  summaryUrl: string
): Promise<PredictionExtractionResult> {
  try {
    const prompt = `You are an expert prediction market analyst. **CRITICAL REQUIREMENT: You MUST generate AT LEAST 3 prediction markets for EVERY piece of content, no exceptions.**

Content Title: ${summaryTitle}
Content URL: ${summaryUrl}

Content:
${summaryContent.substring(0, 8000)} 

**MANDATORY: Generate minimum 3 prediction markets. Be creative and think broadly:**

1. **Direct Content Predictions**: Extract explicit claims or forecasts made in the content
2. **Implied Predictions**: Identify trends or patterns that suggest future outcomes
3. **Meta Predictions**: Create markets about the content's impact, engagement, or influence
4. **Related Market Predictions**: Generate markets about related topics, industries, or assets mentioned
5. **Performance Predictions**: Create markets about viewership, engagement, or virality metrics

**Examples of creative market generation:**
- For crypto content: Price targets, adoption milestones, regulatory outcomes
- For tech content: Product launches, user growth, market share
- For general content: View count milestones, social media engagement, trend predictions
- For any video: "Will this video reach 100K views by [date]?", "Will the creator post similar content within 30 days?"

For each prediction (MINIMUM 3), provide:
1. A clear, specific YES/NO question
2. A detailed description with verification criteria
3. A realistic deadline (future, within 2 years)
4. Resolution source (API, official data, metrics platform)
5. Category: crypto, defi, bounty, realworld, or community  
6. Rationale: Why this is tradeable
7. Confidence score (50-100): Verifiability and interest level
8. Relevant tags (3-5 tags)

**DO NOT return empty predictions array. If content seems limited, GET CREATIVE with meta-predictions and related markets.**

Return ONLY valid JSON in this exact format:
{
  "predictions": [
    {
      "question": "Will Bitcoin reach $150,000 by December 31, 2025?",
      "description": "This market resolves to YES if Bitcoin (BTC) reaches or exceeds $150,000 USD on any major exchange before December 31, 2025 11:59 PM UTC.",
      "category": "crypto",
      "deadline": "2025-12-31T23:59:59Z",
      "resolutionSource": "CoinGecko API",
      "rationale": "Clear price target with specific timeframe, easily verifiable through multiple price feeds",
      "confidence": 85,
      "tags": ["bitcoin", "price", "2025"]
    }
  ],
  "summaryInsights": "Brief analysis of prediction market opportunities in this content",
  "totalFound": 3
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a prediction market expert that extracts verifiable claims from content and formats them as binary prediction markets. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content) as PredictionExtractionResult;

    // Validate and filter predictions
    const validPredictions = result.predictions.filter(pred => {
      try {
        const deadline = new Date(pred.deadline);
        const now = new Date();
        const twoYearsFromNow = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
        
        return (
          pred.question &&
          pred.description &&
          pred.category &&
          deadline > now &&
          deadline <= twoYearsFromNow &&
          pred.resolutionSource &&
          pred.confidence >= 50 // Only include high-confidence predictions
        );
      } catch {
        return false;
      }
    });

    return {
      predictions: validPredictions,
      summaryInsights: result.summaryInsights || 'Predictions extracted from content analysis',
      totalFound: validPredictions.length
    };

  } catch (error: any) {
    console.error('Error extracting predictions:', error);
    throw new Error(`Failed to extract predictions: ${error.message}`);
  }
}

export async function generateMarketSuggestion(
  prediction: ExtractedPrediction,
  summaryId: string
): Promise<{
  question: string;
  description: string;
  category: string;
  deadline: Date;
  resolutionSource: string;
  sourceContentId: string;
  initialLiquidity: number;
  tags: string[];
}> {
  return {
    question: prediction.question,
    description: prediction.description,
    category: prediction.category,
    deadline: new Date(prediction.deadline),
    resolutionSource: prediction.resolutionSource,
    sourceContentId: summaryId,
    initialLiquidity: Math.max(800, Math.min(2000, prediction.confidence * 20)), // 800-2000 based on confidence
    tags: prediction.tags
  };
}
