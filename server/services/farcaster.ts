import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

export class FarcasterService {
  private client: NeynarAPIClient;
  private signerUuid: string;

  constructor() {
    const apiKey = process.env.NEYNAR_API_KEY;
    const signerUuid = process.env.FARCASTER_SIGNER_UUID;

    if (!apiKey || !signerUuid) {
      throw new Error('Farcaster configuration missing: NEYNAR_API_KEY and FARCASTER_SIGNER_UUID required');
    }

    // Correct SDK instantiation per Neynar docs
    const config = new Configuration({
      apiKey,
    });
    this.client = new NeynarAPIClient(config);
    this.signerUuid = signerUuid;
  }

  /**
   * Create a cast on Farcaster with AI summary content
   */
  async createCast(params: {
    title: string;
    summary: string;
    originalUrl: string;
    summaryUrl?: string;
    tags?: string[];
  }): Promise<any> {
    const { title, summary, originalUrl, summaryUrl, tags } = params;

    // Format the cast content
    const castText = this.formatCastContent({
      title,
      summary,
      originalUrl,
      summaryUrl,
      tags
    });

    try {
      const response = await this.client.publishCast({
        signerUuid: this.signerUuid,
        text: castText
      });
      console.log(`✅ Successfully posted cast to Farcaster: ${response.cast.hash}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to create Farcaster cast:', error);
      throw new Error(`Failed to post to Farcaster: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format content for Farcaster cast (max 320 chars) with proper length enforcement
   */
  private formatCastContent(params: {
    title: string;
    summary: string;
    originalUrl: string;
    summaryUrl?: string;
    tags?: string[];
  }): string {
    const { title, summary, originalUrl, summaryUrl, tags } = params;
    const MAX_LENGTH = 320;
    
    // Essential components that must be included
    const prefix = `🤖 AI Summary: ${title}

`;
    const originalLink = `

🔗 Original: ${originalUrl}`;
    const branding = `

Powered by @StreamAiX`;
    
    // Optional components
    const fullAnalysisLink = summaryUrl ? `
📊 Full Analysis: ${summaryUrl}` : '';
    const hashTags = tags && tags.length > 0 
      ? `

${tags.slice(0, 3).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')}` 
      : '';
    
    // Calculate space available for summary
    const fixedContentLength = prefix.length + originalLink.length + branding.length;
    let remainingSpace = MAX_LENGTH - fixedContentLength;
    
    // Try to include optional components in priority order
    let optionalContent = '';
    
    // Priority 1: Add tags if they fit
    if (hashTags && remainingSpace >= hashTags.length) {
      optionalContent += hashTags;
      remainingSpace -= hashTags.length;
    }
    
    // Priority 2: Add full analysis link if it fits
    if (fullAnalysisLink && remainingSpace >= fullAnalysisLink.length) {
      optionalContent += fullAnalysisLink;
      remainingSpace -= fullAnalysisLink.length;
    }
    
    // Use remaining space for summary (minimum 30 chars, otherwise skip)
    let summaryContent = '';
    if (remainingSpace >= 33) { // 30 chars + "..." = 33
      const summaryText = remainingSpace >= summary.length 
        ? summary 
        : summary.substring(0, remainingSpace - 3).trim() + '...';
      summaryContent = summaryText;
    }
    
    // Build final content
    const finalContent = prefix + summaryContent + optionalContent + originalLink + branding;
    
    // Final safety check - should never exceed 320 but just in case
    if (finalContent.length > MAX_LENGTH) {
      console.warn(`Farcaster cast length exceeded: ${finalContent.length} > ${MAX_LENGTH}`);
      return finalContent.substring(0, MAX_LENGTH - 3) + '...';
    }
    
    return finalContent;
  }

  /**
   * React to a cast (like/recast)
   */
  async reactToCast(castHash: string, reactionType: 'like' | 'recast'): Promise<any> {
    try {
      const response = await this.client.publishReaction({
        signerUuid: this.signerUuid,
        reactionType: reactionType,
        target: castHash // Use target parameter as per SDK
      });
      console.log(`✅ Successfully ${reactionType}d cast: ${castHash}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to ${reactionType} cast:`, error);
      throw new Error(`Failed to ${reactionType} cast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cast information
   */
  async getCast(castHash: string): Promise<any> {
    try {
      const response = await this.client.lookupCastByHashOrUrl({
        identifier: castHash,
        type: 'hash'
      });
      return response.cast;
    } catch (error) {
      console.error('❌ Failed to get cast:', error);
      throw new Error(`Failed to get cast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test the Farcaster connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get signer information to test connection
      const testCast = await this.createCast({
        title: 'StreamAiX Connection Test',
        summary: 'Testing Farcaster integration for AI-powered content sharing.',
        originalUrl: 'https://streamaix.com',
        tags: ['test', 'streamaix']
      });
      
      console.log('✅ Farcaster connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Farcaster connection test failed:', error);
      return false;
    }
  }
}

export const farcasterService = new FarcasterService();