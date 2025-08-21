import { AIService } from './aiService';
import { Web3Service } from './web3Service';
import { ProcessingStatusService } from './processingStatusService';
import { storage } from '../storage';
import { Summary } from '@shared/schema';

interface ProcessingJob {
  id: string;
  summaryId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export class StreamProcessor {
  private static jobs: Map<string, ProcessingJob> = new Map();
  private static jobQueue: string[] = [];
  private static isProcessing = false;
  private static statusService = ProcessingStatusService.getInstance();

  /**
   * Add content processing job to queue
   */
  static async queueProcessing(summaryId: string, url: string, options: {
    contentType: 'podcast' | 'video' | 'livestream';
    platform: string;
    title?: string;
  }): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const job: ProcessingJob = {
      id: jobId,
      summaryId,
      status: 'pending',
      progress: 0
    };

    this.jobs.set(jobId, job);
    this.jobQueue.push(jobId);

    // Store processing metadata
    await storage.updateSummary(summaryId, {
      processingStatus: 'pending'
    });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return jobId;
  }

  /**
   * Process the job queue
   */
  private static async processQueue() {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.jobQueue.length > 0) {
      const jobId = this.jobQueue.shift()!;
      const job = this.jobs.get(jobId);

      if (!job) continue;

      try {
        await this.processJob(job);
      } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        job.status = 'failed';
        job.progress = 0; // Reset progress on failure
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.completedAt = new Date();
        
        // Update summary status to failed
        await storage.updateSummary(job.summaryId, {
          processingStatus: 'failed'
        });
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process individual job
   */
  private static async processJob(job: ProcessingJob) {
    const summary = await storage.getSummary(job.summaryId);
    if (!summary) {
      throw new Error('Summary not found');
    }

    job.status = 'processing';
    job.startedAt = new Date();
    job.progress = 10;

    // Update summary status
    await storage.updateSummary(job.summaryId, {
      processingStatus: 'processing'
    });

    try {
      // Step 1: Extract content information
      job.progress = 25;
      const contentInfo = await this.extractContentInfo(summary.originalUrl);

      // Step 2: Process with AI
      job.progress = 50;
      const aiResult = await AIService.processContent(summary.originalUrl, {
        title: summary.title,
        contentType: summary.contentType as any,
        platform: summary.platform
      });

      job.progress = 75;

      // Step 3: Store on decentralized networks (mock)
      const ipfsHash = await Web3Service.storeOnIPFS({
        summary: aiResult.summary,
        keyInsights: aiResult.keyInsights,
        chapters: aiResult.chapters,
        metadata: {
          originalUrl: summary.originalUrl,
          processedAt: new Date().toISOString(),
          platform: summary.platform
        }
      });

      const arweaveId = await Web3Service.storeOnArweave({
        fullTranscript: aiResult.transcript,
        summary: aiResult.summary,
        metadata: {
          title: summary.title,
          originalUrl: summary.originalUrl,
          processedAt: new Date().toISOString()
        }
      });

      job.progress = 90;

      // Step 4: Update summary with results
      await storage.updateSummary(job.summaryId, {
        transcript: aiResult.transcript,
        summary: aiResult.summary,
        keyInsights: aiResult.keyInsights,
        chapters: aiResult.chapters,
        tags: [...(summary.tags || []), ...aiResult.tags],
        originalDuration: aiResult.duration,
        // Include all the new content intelligence features
        trends: aiResult.trends,
        narratives: aiResult.narratives,
        executiveSummary: aiResult.executiveSummary,
        bulletPoints: aiResult.bulletPoints,
        timeline: aiResult.timeline,
        keyQuotes: aiResult.keyQuotes,
        actionItems: aiResult.actionItems,
        entities: aiResult.entities,
        themes: aiResult.themes,
        marketSentiment: aiResult.marketSentiment,
        expertCredibility: aiResult.expertCredibility,
        conflictingViews: aiResult.conflictingViews,
        sourceCredibility: aiResult.sourceCredibility,
        confidenceLevel: aiResult.confidenceLevel,
        marketOutlook: aiResult.marketOutlook,
        accuracy: aiResult.accuracy,
        ipfsHash,
        arweaveId,
        processingStatus: 'completed'
      });

      // Mark job as completed with 100% progress
      job.progress = 100;
      job.status = 'completed';
      job.completedAt = new Date();

      // Step 5: Award tokens to creator (mock)
      const tokenReward = Web3Service.calculateTokenReward('summary', 1.0, 1.0);
      console.log(`Awarded ${tokenReward} STREAM tokens to user ${summary.creatorId}`);

      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();

    } catch (error) {
      console.error('Processing failed:', error);
      
      await storage.updateSummary(job.summaryId, {
        processingStatus: 'failed'
      });

      throw error;
    }
  }

  /**
   * Extract basic content information from URL
   */
  private static async extractContentInfo(url: string): Promise<{
    title?: string;
    duration?: number;
    thumbnail?: string;
    platform: string;
  }> {
    try {
      // Mock content extraction - would integrate with actual services
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      let platform = 'unknown';
      if (hostname.includes('youtube')) platform = 'youtube';
      else if (hostname.includes('spotify')) platform = 'spotify';
      else if (hostname.includes('twitch')) platform = 'twitch';
      else if (hostname.includes('soundcloud')) platform = 'soundcloud';

      return {
        platform,
        title: 'Extracted Content Title',
        duration: 1800, // 30 minutes
        thumbnail: `https://via.placeholder.com/480x360/6366f1/white?text=${platform.toUpperCase()}`
      };

    } catch (error) {
      return {
        platform: 'unknown'
      };
    }
  }

  /**
   * Get job status
   */
  static getJobStatus(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a summary
   */
  static getJobsForSummary(summaryId: string): ProcessingJob[] {
    return Array.from(this.jobs.values()).filter(job => job.summaryId === summaryId);
  }

  /**
   * Process existing content for AI enhancements
   */
  static async enhanceExistingSummary(summaryId: string): Promise<void> {
    const summary = await storage.getSummary(summaryId);
    if (!summary || !summary.transcript) {
      throw new Error('Summary not found or missing transcript');
    }

    try {
      // Generate enhanced insights
      const aiResult = await AIService.generateSummary(summary.transcript, {
        title: summary.title,
        contentType: summary.contentType as any,
        targetLength: 'long'
      });

      // Update with enhanced content
      await storage.updateSummary(summaryId, {
        keyInsights: aiResult.keyInsights,
        chapters: aiResult.chapters,
        tags: [...(summary.tags || []), ...aiResult.tags].filter((tag, index, arr) => arr.indexOf(tag) === index),
        accuracy: (summary.accuracy || 0) + 5 // Boost accuracy score
      });

    } catch (error) {
      console.error('Enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple summaries
   */
  static async batchProcess(summaryIds: string[]): Promise<{
    queued: string[];
    failed: string[];
  }> {
    const queued: string[] = [];
    const failed: string[] = [];

    for (const summaryId of summaryIds) {
      try {
        const summary = await storage.getSummary(summaryId);
        if (summary) {
          await this.queueProcessing(summaryId, summary.originalUrl, {
            contentType: summary.contentType as any,
            platform: summary.platform,
            title: summary.title
          });
          queued.push(summaryId);
        } else {
          failed.push(summaryId);
        }
      } catch (error) {
        failed.push(summaryId);
      }
    }

    return { queued, failed };
  }

  /**
   * Clean up completed jobs (keep last 100)
   */
  static cleanupJobs() {
    const completedJobs = Array.from(this.jobs.entries())
      .filter(([_, job]) => job.status === 'completed' || job.status === 'failed')
      .sort((a, b) => (b[1].completedAt?.getTime() || 0) - (a[1].completedAt?.getTime() || 0));

    if (completedJobs.length > 100) {
      const toDelete = completedJobs.slice(100);
      toDelete.forEach(([jobId]) => {
        this.jobs.delete(jobId);
      });
    }
  }
}

// Clean up jobs every hour
setInterval(() => {
  StreamProcessor.cleanupJobs();
}, 60 * 60 * 1000);