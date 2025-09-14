import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import type { CastResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';

export class FarcasterService {
  private client: NeynarAPIClient;
  private signerUuid: string;

  constructor() {
    const apiKey = process.env.NEYNAR_API_KEY;
    const signerUuid = process.env.FARCASTER_SIGNER_UUID;

    if (!apiKey || !signerUuid) {
      throw new Error('Farcaster configuration missing: NEYNAR_API_KEY and FARCASTER_SIGNER_UUID required');
    }

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
  }): Promise<CastResponse> {
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
      const response = await this.client.publishCast(this.signerUuid, castText);
      console.log(`✅ Successfully posted cast to Farcaster: ${response.cast.hash}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to create Farcaster cast:', error);
      throw new Error(`Failed to post to Farcaster: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format content for Farcaster cast (max 320 chars)
   */
  private formatCastContent(params: {
    title: string;
    summary: string;
    originalUrl: string;
    summaryUrl?: string;
    tags?: string[];
  }): string {
    const { title, summary, originalUrl, summaryUrl, tags } = params;
    
    // Start with title and AI tag
    let content = `🤖 AI Summary: ${title}

`;

    // Add truncated summary
    const maxSummaryLength = summaryUrl ? 150 : 200;
    const truncatedSummary = summary.length > maxSummaryLength 
      ? summary.substring(0, maxSummaryLength).trim() + '...'
      : summary;
    
    content += truncatedSummary;

    // Add tags if provided
    if (tags && tags.length > 0) {
      const hashTags = tags.slice(0, 3).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
      content += `

${hashTags}`;
    }

    // Add links
    content += `

🔗 Original: ${originalUrl}`;
    
    if (summaryUrl) {
      content += `
📊 Full Analysis: ${summaryUrl}`;
    }

    // Add branding
    content += `

Powered by @StreamAiX`;

    // Ensure we stay under 320 character limit
    if (content.length > 320) {
      // Truncate summary more aggressively
      const availableSpace = 320 - (content.length - truncatedSummary.length);
      const newSummary = summary.substring(0, Math.max(50, availableSpace - 10)).trim() + '...';
      content = content.replace(truncatedSummary, newSummary);
    }

    return content;
  }

  /**
   * React to a cast (like/unlike)
   */
  async reactToCast(castHash: string, reactionType: 'like' | 'recast'): Promise<any> {
    try {
      const response = await this.client.reactToCast(
        this.signerUuid, 
        reactionType === 'like' ? 'like' : 'recast', 
        castHash
      );
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
      const response = await this.client.lookUpCastByHash(castHash);
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