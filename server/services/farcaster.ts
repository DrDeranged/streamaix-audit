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
   * Get user's recent casts for activity dashboard
   */
  async getUserCasts(fid: number, limit: number = 25): Promise<any[]> {
    try {
      const response = await this.client.fetchFeedForYou({
        fid: fid,
        limit: limit
      });
      console.log(`✅ Retrieved casts for user ${fid}`);
      return response.casts || [];
    } catch (error) {
      console.error('❌ Failed to get user casts:', error);
      throw new Error(`Failed to get user casts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's follower information
   */
  async getUserFollowers(fid: number, limit: number = 100): Promise<any> {
    try {
      const response = await this.client.fetchUserFollowers({
        fid: fid,
        limit: limit
      });
      console.log(`✅ Retrieved follower data for user ${fid}`);
      return {
        followers: response.users,
        followerCount: response.users.length
      };
    } catch (error) {
      console.error('❌ Failed to get user followers:', error);
      throw new Error(`Failed to get user followers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's following information
   */
  async getUserFollowing(fid: number, limit: number = 100): Promise<any> {
    try {
      const response = await this.client.fetchUserFollowing({
        fid: fid,
        limit: limit
      });
      console.log(`✅ Retrieved following data for user ${fid}`);
      return {
        following: response.users,
        followingCount: response.users.length
      };
    } catch (error) {
      console.error('❌ Failed to get user following:', error);
      throw new Error(`Failed to get user following: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cast engagement metrics (likes, recasts, replies)
   */
  async getCastEngagement(castHash: string): Promise<any> {
    try {
      const cast = await this.getCast(castHash);
      
      // Extract engagement metrics from cast data
      const likes = cast.reactions?.likes_count || 0;
      const recasts = cast.reactions?.recasts_count || 0;
      const replies = cast.replies?.count || 0;
      
      return {
        likes,
        recasts,
        replies,
        totalEngagement: likes + recasts + replies
      };
    } catch (error) {
      console.error('❌ Failed to get cast engagement:', error);
      throw new Error(`Failed to get cast engagement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(fid: number): Promise<any> {
    try {
      const response = await this.client.fetchBulkUsers({
        fids: [fid]
      });
      
      if (!response.users || response.users.length === 0) {
        throw new Error('User not found');
      }
      
      const user = response.users[0];
      console.log(`✅ Retrieved profile for user ${fid}: @${user.username}`);
      return user;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get activity analytics for a user
   */
  async getUserActivityAnalytics(fid: number): Promise<any> {
    try {
      const [casts, followers, following, profile] = await Promise.all([
        this.getUserCasts(fid, 50),
        this.getUserFollowers(fid),
        this.getUserFollowing(fid),
        this.getUserProfile(fid)
      ]);

      // Calculate engagement rates
      const totalEngagement = await Promise.all(
        casts.slice(0, 10).map(cast => this.getCastEngagement(cast.hash))
      );

      const avgEngagement = totalEngagement.reduce((sum, eng) => sum + eng.totalEngagement, 0) / totalEngagement.length;

      return {
        profile,
        stats: {
          totalCasts: casts.length,
          followerCount: followers.followerCount,
          followingCount: following.followingCount,
          avgEngagementRate: avgEngagement,
          recentActivity: casts.slice(0, 10)
        },
        engagement: totalEngagement
      };
    } catch (error) {
      console.error('❌ Failed to get user activity analytics:', error);
      throw new Error(`Failed to get user activity analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get trending content from Farcaster
   */
  async getTrendingContent(limit: number = 25): Promise<any[]> {
    try {
      console.log(`🔍 Fetching trending content (limit: ${limit})`);
      
      // Try to get trending/popular content from the API
      // Use the global feed for trending content as fetchFeedTrending may not be available
      const trendingCasts = await this.client.fetchFeed({
        feedType: 'following',
        fid: 3, // Use Dan Romero as a seed for trending content
        limit: limit
      });
      
      console.log(`✅ Retrieved ${trendingCasts.casts?.length || 0} trending casts`);
      return trendingCasts.casts || [];
    } catch (error) {
      console.error('❌ Failed to get trending content:', error);
      
      // Fallback: get recent casts from popular crypto accounts
      try {
        console.log('🔄 Falling back to popular accounts\' content...');
        const popularFids = [3, 5650, 1, 6546]; // Dan, Vitalik, Farcaster, Jesse
        const allCasts: any[] = [];
        
        for (const fid of popularFids) {
          try {
            const userCasts = await this.getUserCasts(fid, Math.floor(limit / popularFids.length));
            allCasts.push(...userCasts);
          } catch (castError) {
            console.error(`Failed to get casts for fid ${fid}:`, castError);
            continue;
          }
        }
        
        // Sort by engagement and recency
        const sortedCasts = allCasts.sort((a, b) => {
          const aEngagement = (a.reactions?.likes_count || 0) + (a.reactions?.recasts_count || 0);
          const bEngagement = (b.reactions?.likes_count || 0) + (b.reactions?.recasts_count || 0);
          return bEngagement - aEngagement;
        });
        
        console.log(`✅ Fallback retrieved ${sortedCasts.length} casts from popular accounts`);
        return sortedCasts.slice(0, limit);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return [];
      }
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