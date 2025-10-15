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

// Generate fallback markets when AI extraction fails or returns too few
function generateFallbackMarkets(title: string, url: string, count: number): ExtractedPrediction[] {
  const now = new Date();
  const markets: ExtractedPrediction[] = [];
  
  // Extract topic from title for better market generation
  const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
  const titleWords = cleanTitle.split(' ').slice(0, 5).join(' ');
  
  const fallbackTemplates = [
    {
      question: `Will "${titleWords}" content reach 100K views by ${new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}?`,
      description: `This market resolves to YES if the content titled "${title}" reaches 100,000 views on any platform by the deadline. Verification via platform analytics or public view counters.`,
      category: 'community' as const,
      deadline: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      resolutionSource: 'Platform Analytics / Public View Counter',
      rationale: 'Engagement prediction based on content virality potential',
      confidence: 65,
      tags: ['engagement', 'views', 'growth']
    },
    {
      question: `Will this content creator publish similar content within 30 days?`,
      description: `This market resolves to YES if the content creator of "${title}" publishes another video/podcast on similar topics within 30 days of the original content date.`,
      category: 'community' as const,
      deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      resolutionSource: 'Creator Channel / Platform RSS Feed',
      rationale: 'Content consistency and creator activity prediction',
      confidence: 70,
      tags: ['creator', 'content', 'activity']
    },
    {
      question: `Will topics from "${titleWords}" trend on social media within 14 days?`,
      description: `This market resolves to YES if key topics or themes from "${title}" become trending topics on major social media platforms (Twitter, Reddit, etc.) within 14 days.`,
      category: 'realworld' as const,
      deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      resolutionSource: 'Social Media Trending APIs / Twitter Trends',
      rationale: 'Social impact and virality prediction for content themes',
      confidence: 60,
      tags: ['social', 'trending', 'virality']
    },
    {
      question: `Will the engagement rate exceed 5% for this content by ${new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()}?`,
      description: `This market resolves to YES if "${title}" achieves an engagement rate (likes + comments + shares / views) exceeding 5% within 60 days.`,
      category: 'community' as const,
      deadline: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      resolutionSource: 'Platform Engagement Metrics',
      rationale: 'High-quality content engagement measurement',
      confidence: 68,
      tags: ['engagement', 'quality', 'metrics']
    }
  ];
  
  // Return requested number of fallback markets
  for (let i = 0; i < Math.min(count, fallbackTemplates.length); i++) {
    markets.push(fallbackTemplates[i]);
  }
  
  return markets;
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

    // CRITICAL FALLBACK: If AI didn't generate enough markets, create generic ones
    if (validPredictions.length < 3) {
      console.log(`⚠️ Only ${validPredictions.length} markets generated, adding fallbacks...`);
      
      const fallbackMarkets = generateFallbackMarkets(summaryTitle, summaryUrl, 3 - validPredictions.length);
      validPredictions.push(...fallbackMarkets);
    }

    console.log(`✅ Total markets generated: ${validPredictions.length}`);

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
