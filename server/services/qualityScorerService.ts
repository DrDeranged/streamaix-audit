import { db } from "../db";
import { bountyQualityScores, summaries, bounties } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { BountyQualityScore, Summary } from "@shared/schema";
import { AIService } from "./aiService";

export class QualityScorerService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  // Score a summary for a bounty
  async scoreSummary(bountyId: string, summaryId: string): Promise<BountyQualityScore> {
    console.log(`🎯 Scoring summary ${summaryId} for bounty ${bountyId}...`);

    // Get the summary content
    const [summary] = await db
      .select()
      .from(summaries)
      .where(eq(summaries.id, summaryId))
      .limit(1);

    if (!summary) {
      throw new Error('Summary not found');
    }

    // Get bounty requirements
    const [bounty] = await db
      .select()
      .from(bounties)
      .where(eq(bounties.id, bountyId))
      .limit(1);

    if (!bounty) {
      throw new Error('Bounty not found');
    }

    // Use AI to analyze quality
    const aiAnalysis = await this.analyzeWithAI(summary, bounty.description);

    // Calculate plagiarism score (simplified - in production use dedicated service)
    const plagiarismScore = await this.checkPlagiarism(summary);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (aiAnalysis.accuracyScore * 0.3) +
      (aiAnalysis.completenessScore * 0.25) +
      (aiAnalysis.readabilityScore * 0.20) +
      (plagiarismScore * 0.15) +
      (aiAnalysis.insightScore * 0.10)
    );

    // Check if score already exists
    const [existingScore] = await db
      .select()
      .from(bountyQualityScores)
      .where(eq(bountyQualityScores.bountyId, bountyId))
      .limit(1);

    let qualityScore: BountyQualityScore;

    if (existingScore) {
      // Update existing score
      const [updated] = await db
        .update(bountyQualityScores)
        .set({
          summaryId,
          aiScore: aiAnalysis.overallScore,
          plagiarismScore,
          accuracyScore: aiAnalysis.accuracyScore,
          completenessScore: aiAnalysis.completenessScore,
          readabilityScore: aiAnalysis.readabilityScore,
          overallScore,
          feedback: aiAnalysis.feedback,
          metadata: {
            wordCount: summary.summary?.length || 0,
            hasChapters: !!summary.chapters,
            hasInsights: !!summary.keyInsights,
            processingTime: aiAnalysis.processingTime
          },
          scoredAt: new Date()
        })
        .where(eq(bountyQualityScores.id, existingScore.id))
        .returning();

      qualityScore = updated;
    } else {
      // Create new score
      const [created] = await db
        .insert(bountyQualityScores)
        .values({
          bountyId,
          summaryId,
          aiScore: aiAnalysis.overallScore,
          plagiarismScore,
          accuracyScore: aiAnalysis.accuracyScore,
          completenessScore: aiAnalysis.completenessScore,
          readabilityScore: aiAnalysis.readabilityScore,
          overallScore,
          feedback: aiAnalysis.feedback,
          metadata: {
            wordCount: summary.summary?.length || 0,
            hasChapters: !!summary.chapters,
            hasInsights: !!summary.keyInsights,
            processingTime: aiAnalysis.processingTime
          }
        })
        .returning();

      qualityScore = created;
    }

    console.log(`✅ Quality score: ${overallScore}/100 (Accuracy: ${aiAnalysis.accuracyScore}, Completeness: ${aiAnalysis.completenessScore}, Readability: ${aiAnalysis.readabilityScore})`);

    return qualityScore;
  }

  // Analyze summary quality using GPT-4o
  private async analyzeWithAI(summary: Summary, bountyRequirements: string): Promise<any> {
    const startTime = Date.now();

    const prompt = `You are an expert content quality evaluator. Analyze this summary and rate it on multiple dimensions.

BOUNTY REQUIREMENTS:
${bountyRequirements}

SUMMARY CONTENT:
Title: ${summary.title}
Summary: ${summary.summary || 'N/A'}
Key Insights: ${JSON.stringify(summary.keyInsights) || 'N/A'}
Chapters: ${JSON.stringify(summary.chapters) || 'N/A'}

Rate the summary on a scale of 0-100 for each criterion:

1. ACCURACY (0-100): How accurate and factually correct is the content?
2. COMPLETENESS (0-100): Does it cover all key points from the original content?
3. READABILITY (0-100): How clear, concise, and well-structured is it?
4. INSIGHT (0-100): Does it provide valuable insights and analysis?

Respond ONLY with valid JSON in this exact format:
{
  "accuracyScore": <number 0-100>,
  "completenessScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "insightScore": <number 0-100>,
  "overallScore": <number 0-100>,
  "feedback": "<2-3 sentences of constructive feedback>"
}`;

    try {
      const response = await this.aiService.chat(prompt, {
        model: 'gpt-4o-mini', // Fast and cost-effective for scoring
        temperature: 0.3,
        maxTokens: 300
      });

      // Parse AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ AI response not in JSON format, using fallback scores');
        return this.getFallbackScores();
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        ...analysis,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('❌ AI quality scoring failed:', error);
      return this.getFallbackScores();
    }
  }

  // Fallback scores if AI fails
  private getFallbackScores(): any {
    return {
      accuracyScore: 70,
      completenessScore: 70,
      readabilityScore: 70,
      insightScore: 70,
      overallScore: 70,
      feedback: 'Automated quality check completed. Manual review recommended.',
      processingTime: 0
    };
  }

  // Check plagiarism (simplified - compares against existing summaries)
  private async checkPlagiarism(summary: Summary): Promise<number> {
    // In production, use a dedicated plagiarism detection service
    // For MVP, we'll do a simple similarity check against recent summaries

    if (!summary.summary) {
      return 100; // No content to check
    }

    const summaryText = summary.summary.toLowerCase();
    const summaryWords = new Set(summaryText.split(/\s+/).filter(w => w.length > 3));

    // Get recent summaries (last 100)
    const recentSummaries = await db
      .select()
      .from(summaries)
      .where(eq(summaries.processingStatus, 'completed'))
      .limit(100);

    let maxSimilarity = 0;

    for (const existing of recentSummaries) {
      if (!existing.summary || existing.id === summary.id) continue;

      const existingText = existing.summary.toLowerCase();
      const existingWords = new Set(existingText.split(/\s+/).filter(w => w.length > 3));

      // Calculate Jaccard similarity
      const intersection = new Set([...summaryWords].filter(x => existingWords.has(x)));
      const union = new Set([...summaryWords, ...existingWords]);
      const similarity = intersection.size / union.size;

      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    // Convert similarity to uniqueness score (0-100, higher is more unique)
    const uniquenessScore = Math.round((1 - maxSimilarity) * 100);

    return Math.max(uniquenessScore, 50); // Minimum 50 for passing basic check
  }

  // Get quality score for a bounty
  async getQualityScore(bountyId: string): Promise<BountyQualityScore | null> {
    const [score] = await db
      .select()
      .from(bountyQualityScores)
      .where(eq(bountyQualityScores.bountyId, bountyId))
      .limit(1);

    return score || null;
  }

  // Check if summary passes quality threshold
  async passesQualityThreshold(bountyId: string, threshold: number = 60): Promise<boolean> {
    const score = await this.getQualityScore(bountyId);
    return score ? score.overallScore >= threshold : false;
  }

  // Get quality distribution stats
  async getQualityStats(): Promise<any> {
    const allScores = await db
      .select()
      .from(bountyQualityScores);

    if (allScores.length === 0) {
      return {
        averageScore: 0,
        highQuality: 0, // 90+
        goodQuality: 0, // 70-89
        fair: 0, // 50-69
        poor: 0 // <50
      };
    }

    const avgScore = allScores.reduce((sum, s) => sum + s.overallScore, 0) / allScores.length;

    return {
      averageScore: Math.round(avgScore),
      highQuality: allScores.filter(s => s.overallScore >= 90).length,
      goodQuality: allScores.filter(s => s.overallScore >= 70 && s.overallScore < 90).length,
      fair: allScores.filter(s => s.overallScore >= 50 && s.overallScore < 70).length,
      poor: allScores.filter(s => s.overallScore < 50).length,
      totalScored: allScores.length
    };
  }
}

export const qualityScorerService = new QualityScorerService();
