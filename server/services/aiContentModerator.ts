import { db } from '../db';
import { summaries, bountyQualityScores, autonomousSystemLogs } from '@shared/schema';
import { eq, isNull, and } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ModerationResult {
  qualityScore: number; // 0-100
  isSpam: boolean;
  isFlagged: boolean;
  categories: {
    accuracy: number;
    depth: number;
    relevance: number;
    originality: number;
  };
  feedback: string;
  reasoning: string;
}

export class AIContentModerator {
  private isRunning: boolean = false;

  constructor() {
    console.log('🛡️ AI Content Moderator initialized');
  }

  /**
   * Start the content moderation service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Content moderator already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Content Moderator service...');

    while (this.isRunning) {
      try {
        await this.moderateContent();

        // Run every 30 minutes
        const delayMs = 30 * 60 * 1000;
        console.log(`⏱️  Content moderator sleeping for 30 minutes...`);
        await this.sleep(delayMs);

      } catch (error) {
        console.error('❌ Error in content moderator:', error);
        await this.sleep(60000);
      }
    }
  }

  stop() {
    console.log('🛑 Stopping AI Content Moderator...');
    this.isRunning = false;
  }

  private async moderateContent() {
    const startTime = Date.now();
    console.log('\n🛡️ === Content Moderation Cycle Starting ===');

    // Find unscored summaries
    const unscoredSummaries = await db
      .select()
      .from(summaries)
      .where(
        and(
          eq(summaries.processingStatus, 'completed'),
          isNull(summaries.expertCredibility)
        )
      )
      .limit(20);

    console.log(`📋 Found ${unscoredSummaries.length} summaries to moderate`);

    if (unscoredSummaries.length === 0) {
      console.log('✅ No content needs moderation');
      return;
    }

    let moderated = 0;
    let flagged = 0;
    let failed = 0;

    for (const summary of unscoredSummaries) {
      try {
        console.log(`\n📝 Moderating: "${summary.title}"`);

        // Analyze content quality
        const result = await this.analyzeContent(summary);

        // Update summary with quality scores
        await this.updateContentScores(summary, result);

        if (result.isFlagged) {
          console.log(`🚩 Flagged: "${summary.title}" (score: ${result.qualityScore}/100)`);
          flagged++;
        } else {
          console.log(`✅ Approved: "${summary.title}" (score: ${result.qualityScore}/100)`);
        }
        
        moderated++;

        await this.logAction('content_moderator', 'content_moderated', 'success', summary.id, {
          title: summary.title,
          qualityScore: result.qualityScore,
          isSpam: result.isSpam,
          isFlagged: result.isFlagged,
        }, result.reasoning);

        // Delay between moderations to avoid rate limits
        await this.sleep(1500);

      } catch (error: any) {
        console.error(`❌ Failed to moderate ${summary.id}:`, error.message);
        failed++;
        await this.logAction('content_moderator', 'moderation_failed', 'failed', summary.id, {
          title: summary.title,
        }, undefined, error.message);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`\n📊 Moderation Summary:`);
    console.log(`   ✅ Moderated: ${moderated}`);
    console.log(`   🚩 Flagged: ${flagged}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Time: ${(executionTime / 1000).toFixed(1)}s`);
  }

  /**
   * Analyze content quality using GPT-4
   */
  private async analyzeContent(summary: any): Promise<ModerationResult> {
    const prompt = `You are an autonomous AI content moderator for a crypto content platform.

Title: "${summary.title}"
Description: ${summary.description || 'N/A'}
Summary Length: ${summary.summary?.length || 0} characters
Content Type: ${summary.contentType}
Platform: ${summary.platform}

${summary.summary ? `Summary Preview: ${summary.summary.substring(0, 500)}...` : ''}

Evaluate this content for quality and appropriateness.

Respond with JSON:
{
  "qualityScore": <0-100 overall quality score>,
  "isSpam": <true|false>,
  "isFlagged": <true|false if should be reviewed manually>,
  "categories": {
    "accuracy": <0-100 factual accuracy>,
    "depth": <0-100 content depth>,
    "relevance": <0-100 relevance to crypto/web3>,
    "originality": <0-100 originality>
  },
  "feedback": "Brief constructive feedback for creator",
  "reasoning": "Explanation of the scores given"
}

GUIDELINES:
- Flag spam, low-effort content, or inappropriate material
- High-quality: 70-100, Medium: 40-69, Low: 0-39
- Be fair but maintain quality standards`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a content moderator. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      qualityScore: Math.min(Math.max(response.qualityScore || 50, 0), 100),
      isSpam: response.isSpam || false,
      isFlagged: response.isFlagged || false,
      categories: {
        accuracy: response.categories?.accuracy || 50,
        depth: response.categories?.depth || 50,
        relevance: response.categories?.relevance || 50,
        originality: response.categories?.originality || 50,
      },
      feedback: response.feedback || 'Content evaluated',
      reasoning: response.reasoning || 'Automated quality assessment',
    };
  }

  /**
   * Update summary with quality scores
   */
  private async updateContentScores(summary: any, result: ModerationResult) {
    // Update summary credibility and confidence
    await db
      .update(summaries)
      .set({
        expertCredibility: result.qualityScore,
        confidenceLevel: result.qualityScore / 100,
        sourceCredibility: this.getSourceCredibilityGrade(result.qualityScore),
        updatedAt: new Date(),
      })
      .where(eq(summaries.id, summary.id));

    // Create quality score record if bounty exists
    if (summary.creatorId) {
      try {
        await db.insert(bountyQualityScores).values({
          summaryId: summary.id,
          userId: summary.creatorId,
          accuracyScore: result.categories.accuracy,
          depthScore: result.categories.depth,
          clarityScore: (result.categories.relevance + result.categories.originality) / 2,
          relevanceScore: result.categories.relevance,
          originalityScore: result.categories.originality,
          overallScore: result.qualityScore,
          feedback: result.feedback,
        });
      } catch (error) {
        // Ignore if already exists
      }
    }
  }

  private getSourceCredibilityGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  /**
   * Log autonomous system action
   */
  private async logAction(
    systemName: string,
    actionType: string,
    status: 'success' | 'failed' | 'partial',
    targetId?: string,
    metadata?: any,
    reasoning?: string,
    errorMessage?: string
  ) {
    try {
      await db.insert(autonomousSystemLogs).values({
        systemName,
        actionType,
        status,
        targetId,
        metadata,
        reasoning,
        errorMessage,
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const aiContentModerator = new AIContentModerator();
