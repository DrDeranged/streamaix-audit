import { db } from '../db';
import { predictionMarkets, autonomousSystemLogs } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';
import { jobScheduler } from '../jobs/scheduler';
import { evidenceResolutionService } from './evidenceResolutionService';

/**
 * AI Market Resolver
 *
 * Finds expired active markets and runs each through the evidence-gathering
 * resolution pipeline (evidenceResolutionService). Markets resolve
 * automatically only with high-confidence, evidence-cited outcomes; everything
 * else escalates to 'pending_review' for admins. All outcomes are audited in
 * market_resolutions_audit.
 */
export class AIMarketResolver {
  private isRunning: boolean = false;

  constructor() {
    console.log('🎯 AI Market Resolver initialized');
  }

  /**
   * Start the auto-resolution service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Market resolver already running');
      return;
    }

    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log('🎯 [Market Resolver] ⏸️ OpenAI API paused - market resolver disabled');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Market Resolver service...');

    jobScheduler.register('ai-market-resolver', 12 * 60 * 60 * 1000, () => this.resolveExpiredMarkets(), { runOnStart: true, staggerMs: 30000 });
  }

  stop() {
    console.log('🛑 Stopping AI Market Resolver...');
    this.isRunning = false;
    jobScheduler.cancel('ai-market-resolver');
  }

  private async resolveExpiredMarkets() {
    const startTime = Date.now();
    console.log('\n🎯 === Market Resolution Cycle Starting ===');

    // Find markets that are past deadline and not yet resolved
    const expiredMarkets = await db
      .select()
      .from(predictionMarkets)
      .where(
        and(
          eq(predictionMarkets.status, 'active'),
          lt(predictionMarkets.deadline, new Date())
        )
      );

    console.log(`📋 Found ${expiredMarkets.length} expired markets to resolve`);

    if (expiredMarkets.length === 0) {
      console.log('✅ No markets need resolution');
      return;
    }

    let resolved = 0;
    let escalated = 0;
    let failed = 0;

    for (const market of expiredMarkets) {
      try {
        console.log(`\n🔍 Analyzing market: "${market.question}"`);

        const result = await evidenceResolutionService.resolveWithEvidence(market);

        if (result.action === 'resolved') {
          resolved++;
          console.log(`✅ Resolved: ${market.question} → ${result.assessment.resolution} (${(result.assessment.confidence * 100).toFixed(1)}% confidence, ${result.assessment.citedEvidence.length} evidence citations)`);
          await this.logAction('market_resolver', 'market_resolved', 'success', market.id, {
            question: market.question,
            outcome: result.assessment.resolution,
            confidence: result.assessment.confidence,
            citedEvidence: result.assessment.citedEvidence,
            evidenceCount: result.evidence.length,
          }, result.assessment.reasoning);
        } else {
          escalated++;
          console.log(`⚠️  Escalated to admin review: ${market.question} — ${result.escalationReason}`);
          await this.logAction('market_resolver', 'escalated_to_review', 'partial', market.id, {
            question: market.question,
            assessment: result.assessment,
            escalationReason: result.escalationReason,
            evidenceCount: result.evidence.length,
          }, result.assessment.reasoning);
        }

        // Small delay between resolutions to avoid rate limits
        await this.sleep(2000);

      } catch (error: any) {
        console.error(`❌ Failed to resolve market ${market.id}:`, error.message);
        failed++;
        await this.logAction('market_resolver', 'resolution_failed', 'failed', market.id, {
          question: market.question,
        }, undefined, error.message);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`\n📊 Resolution Summary:`);
    console.log(`   ✅ Resolved: ${resolved}`);
    console.log(`   ⚖️  Escalated: ${escalated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Time: ${(executionTime / 1000).toFixed(1)}s`);
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
export const aiMarketResolver = new AIMarketResolver();
