import { Story, Figure, CompactStory, ProminentFigure, AlphaTickerItem } from '@shared/schema.js';
import { farcasterService } from './farcaster.js';
import { getTopFids, getTopAccounts } from './farcasterTopAccounts.js';
import { AIService } from './aiService.js';

// Simple in-memory cache for stories and figures
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlSeconds: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  clear() {
    this.cache.clear();
  }
}

export class NewsService {
  private cache = new MemoryCache();

  /**
   * Transform raw cast into a compact story with AI summarization
   */
  private async transformCastToStory(cast: any): Promise<CompactStory | null> {
    try {
      // Skip very short casts that don't provide alpha
      if (cast.text.length < 50) return null;
      
      // Extract URLs from cast for source attribution
      const urlMatch = cast.text.match(/(https?:\/\/[^\s]+)/g);
      const sourceUrl = urlMatch?.[0] || `https://warpcast.com/${cast.author.username}/cast/${cast.hash}`;
      
      // Use AI to create compact summary (≤140 chars)
      const summary = await this.generateCompactSummary(cast.text);
      if (!summary) return null;
      
      // Generate title from first meaningful sentence
      const title = this.extractTitle(cast.text);
      
      // Calculate alpha score based on engagement, author influence, and content quality
      const alphaScore = this.calculateAlphaScore(cast);
      
      // Extract tags from cast content
      const tags = this.extractTags(cast.text);
      
      // Determine source info
      const sourceName = this.getSourceName(cast.author);
      
      return {
        id: cast.hash,
        title,
        summary,
        sourceName,
        sourceLogoUrl: cast.author.pfp_url,
        url: sourceUrl,
        tags,
        alphaScore,
        publishedAt: cast.timestamp,
        isBreaking: alphaScore > 80 || cast.engagement > 200
      };
    } catch (error) {
      console.error('Failed to transform cast to story:', error);
      return null;
    }
  }

  /**
   * Generate compact summary using AI (≤140 chars)
   */
  private async generateCompactSummary(text: string): Promise<string | null> {
    const cacheKey = `summary_${this.hashText(text)}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached) return cached;

    try {
      // For production, use AIService with specific prompt for compact summaries
      // For demo, use rule-based extraction
      const summary = this.extractKeyInsight(text);
      
      this.cache.set(cacheKey, summary, 300); // 5 minute cache
      return summary;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // Fallback to truncated text
      return text.slice(0, 137) + '...';
    }
  }

  /**
   * Extract key insight using rule-based approach (fallback for AI)
   */
  private extractKeyInsight(text: string): string {
    // Clean up the text
    const cleaned = text.replace(/https?:\/\/[^\s]+/g, '').trim();
    
    // Look for key phrases that indicate alpha
    const alphaPatterns = [
      /(?:just announced|breaking:|new|launched|released)[\s:]+([^.!?]+)/i,
      /(?:bullish|bearish|expecting)[\s:]+([^.!?]+)/i,
      /(?:price|market|trading)[\s:]+([^.!?]+)/i,
      /(?:major|significant|important)[\s:]+([^.!?]+)/i
    ];

    for (const pattern of alphaPatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        const insight = match[0].trim();
        return insight.length <= 140 ? insight : insight.slice(0, 137) + '...';
      }
    }

    // Fallback to first sentence
    const firstSentence = cleaned.split(/[.!?]/)[0];
    return firstSentence.length <= 140 ? firstSentence : firstSentence.slice(0, 137) + '...';
  }

  /**
   * Extract title from cast text
   */
  private extractTitle(text: string): string {
    // Remove URLs
    const cleaned = text.replace(/https?:\/\/[^\s]+/g, '').trim();
    
    // Get first meaningful sentence or phrase
    const sentences = cleaned.split(/[.!?]/);
    const title = sentences[0].trim();
    
    // Limit title length and capitalize
    const maxLength = 60;
    const finalTitle = title.length > maxLength ? title.slice(0, maxLength - 3) + '...' : title;
    
    return finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);
  }

  /**
   * Calculate alpha score based on multiple factors
   */
  private calculateAlphaScore(cast: any): number {
    let score = 0;
    
    // Engagement weight (40%)
    const engagementScore = Math.min(100, (cast.engagement || 0) / 2);
    score += engagementScore * 0.4;
    
    // Author influence (30%)
    const influenceScore = Math.min(100, (cast.author.follower_count || 0) / 10000 * 100);
    score += influenceScore * 0.3;
    
    // Content quality (30%) - based on keywords and length
    const qualityScore = this.calculateContentQuality(cast.text);
    score += qualityScore * 0.3;
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQuality(text: string): number {
    let score = 0;
    
    // Length bonus (optimal range 100-500 chars)
    const length = text.length;
    if (length >= 100 && length <= 500) score += 30;
    else if (length > 50) score += 15;
    
    // Alpha keywords
    const alphaKeywords = [
      'breaking', 'announced', 'launched', 'raised', 'funding', 'partnership',
      'bullish', 'bearish', 'price', 'token', 'airdrop', 'yield',
      'defi', 'nft', 'dao', 'layer2', 'scaling', 'bridge'
    ];
    
    const lowerText = text.toLowerCase();
    const keywordMatches = alphaKeywords.filter(keyword => lowerText.includes(keyword));
    score += Math.min(40, keywordMatches.length * 10);
    
    // URL presence (indicates news/sources)
    if (text.includes('http')) score += 15;
    
    // Numbers/data presence
    if (/\d+[kmb%$]/i.test(text)) score += 15;
    
    return Math.min(100, score);
  }

  /**
   * Extract relevant tags from cast text
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Crypto/DeFi categories
    const tagMap = {
      'DeFi': ['defi', 'yield', 'lending', 'liquidity', 'amm', 'dex'],
      'NFTs': ['nft', 'opensea', 'art', 'collectible', 'pfp'],
      'Layer2': ['layer2', 'l2', 'rollup', 'base', 'arbitrum', 'optimism'],
      'ETH': ['ethereum', 'eth', 'vitalik', 'merge', 'staking'],
      'BTC': ['bitcoin', 'btc', 'sats', 'lightning'],
      'Governance': ['dao', 'proposal', 'vote', 'governance'],
      'Trading': ['price', 'pump', 'dump', 'bull', 'bear', 'trend']
    };
    
    for (const [tag, keywords] of Object.entries(tagMap)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return tags.slice(0, 3); // Limit to 3 tags
  }

  /**
   * Get source name for attribution
   */
  private getSourceName(author: any): string {
    if (author.display_name && author.display_name !== author.username) {
      return author.display_name;
    }
    return `@${author.username}`;
  }

  /**
   * Hash text for caching
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get new stories (recently published, high alpha potential)
   */
  async getNewStories(limit = 20): Promise<CompactStory[]> {
    const cacheKey = `new_stories_${limit}`;
    const cached = this.cache.get<CompactStory[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get recent casts from top crypto accounts
      const topFids = getTopFids(8);
      const allCastsPromises = topFids.map(fid => 
        farcasterService.fetchUserRecent(fid, 3)
      );
      const allCastsResults = await Promise.all(allCastsPromises);
      
      // Flatten and process casts
      const allCasts = allCastsResults.flat();
      const storyPromises = allCasts.map(cast => this.transformCastToStory(cast));
      const stories = await Promise.all(storyPromises);
      
      // Filter out nulls and sort by publish time
      const validStories = stories
        .filter((story): story is CompactStory => story !== null)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, limit);
      
      this.cache.set(cacheKey, validStories, 120); // 2 minute cache
      return validStories;
    } catch (error) {
      console.error('Failed to get new stories:', error);
      return this.getDemoNewStories(limit);
    }
  }

  /**
   * Get trending stories (high engagement, rising alpha scores)
   */
  async getTrendingStories(limit = 20): Promise<CompactStory[]> {
    const cacheKey = `trending_stories_${limit}`;
    const cached = this.cache.get<CompactStory[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get aggregated trending casts
      const topFids = getTopFids(10);
      const trendingCasts = await farcasterService.aggregateTrendingFromFids(topFids, limit * 2);
      
      // Transform to stories and sort by alpha score
      const storyPromises = trendingCasts.map(cast => this.transformCastToStory(cast));
      const stories = await Promise.all(storyPromises);
      
      const validStories = stories
        .filter((story): story is CompactStory => story !== null)
        .sort((a, b) => b.alphaScore - a.alphaScore)
        .slice(0, limit);
      
      this.cache.set(cacheKey, validStories, 150); // 2.5 minute cache
      return validStories;
    } catch (error) {
      console.error('Failed to get trending stories:', error);
      return this.getDemoTrendingStories(limit);
    }
  }

  /**
   * Get prominent figures with their latest highlights
   */
  async getProminentFigures(limit = 8): Promise<ProminentFigure[]> {
    const cacheKey = `prominent_figures_${limit}`;
    const cached = this.cache.get<ProminentFigure[]>(cacheKey);
    if (cached) return cached;

    try {
      const topAccounts = getTopAccounts(limit);
      const figuresPromises = topAccounts.map(async (account) => {
        // Get recent casts to find latest highlight
        const recentCasts = await farcasterService.fetchUserRecent(account.fid, 3);
        const latestCast = recentCasts.length > 0 ? recentCasts[0] : null;
        
        const highlight = latestCast 
          ? this.extractKeyInsight(latestCast.text).slice(0, 80)
          : account.bio || 'Crypto thought leader';
        
        return {
          id: account.fid.toString(),
          fid: account.fid,
          handle: account.username,
          displayName: account.displayName,
          avatarUrl: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`, // Placeholder avatar
          role: account.bio,
          lastHighlight: highlight,
          influenceScore: account.priority >= 8 ? 95 : account.priority >= 6 ? 80 : 65,
          topics: account.ecosystem.slice(0, 2)
        };
      });
      
      const figures = await Promise.all(figuresPromises);
      
      this.cache.set(cacheKey, figures, 300); // 5 minute cache
      return figures;
    } catch (error) {
      console.error('Failed to get prominent figures:', error);
      return this.getDemoProminentFigures(limit);
    }
  }

  /**
   * Get alpha ticker items (top headlines for scrolling ticker)
   */
  async getAlphaTickerItems(limit = 15): Promise<AlphaTickerItem[]> {
    const cacheKey = `alpha_ticker_${limit}`;
    const cached = this.cache.get<AlphaTickerItem[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get mix of new and trending stories
      const newStories = await this.getNewStories(8);
      const trendingStories = await this.getTrendingStories(8);
      
      const allStories = [...newStories, ...trendingStories];
      
      // Transform to ticker items
      const tickerItems = allStories
        .sort((a, b) => b.alphaScore - a.alphaScore)
        .slice(0, limit)
        .map((story, index) => ({
          id: story.id,
          title: story.title,
          impact: this.getImpactLevel(story.alphaScore),
          sentiment: this.getSentiment(story.summary + ' ' + story.title),
          url: story.url,
          timestamp: story.publishedAt
        }));
      
      this.cache.set(cacheKey, tickerItems, 90); // 1.5 minute cache
      return tickerItems;
    } catch (error) {
      console.error('Failed to get alpha ticker items:', error);
      return this.getDemoAlphaTickerItems(limit);
    }
  }

  /**
   * Get impact level based on alpha score
   */
  private getImpactLevel(alphaScore: number): 'high' | 'medium' | 'low' {
    if (alphaScore >= 80) return 'high';
    if (alphaScore >= 60) return 'medium';
    return 'low';
  }

  /**
   * Determine sentiment from text
   */
  private getSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    const bullishWords = ['bullish', 'pump', 'moon', 'up', 'rise', 'gain', 'launched', 'partnership'];
    const bearishWords = ['bearish', 'dump', 'crash', 'down', 'fall', 'loss', 'hack', 'exploit'];
    
    const bullishCount = bullishWords.filter(word => lowerText.includes(word)).length;
    const bearishCount = bearishWords.filter(word => lowerText.includes(word)).length;
    
    if (bullishCount > bearishCount && bullishCount > 0) return 'bullish';
    if (bearishCount > bullishCount && bearishCount > 0) return 'bearish';
    return 'neutral';
  }

  /**
   * Demo data for new stories when API fails
   */
  private getDemoNewStories(limit: number): CompactStory[] {
    const now = Date.now();
    const demoStories = [
      {
        id: 'demo_new_1',
        title: 'Base Mainnet Hits 10M Daily Transactions',
        summary: 'Coinbase\'s L2 network reaches new milestone with record transaction volume, driven by consumer app adoption.',
        sourceName: '@jessepollak',
        sourceLogoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        url: 'https://base.org',
        tags: ['Layer2', 'Base'],
        alphaScore: 85,
        publishedAt: new Date(now - 30 * 60 * 1000).toISOString(),
        isBreaking: true
      },
      {
        id: 'demo_new_2',
        title: 'Ethereum Blob Fees Drop to Near Zero',
        summary: 'EIP-4844 working as intended with L2 transaction costs falling 70% as blob space demand normalizes.',
        sourceName: '@vitalik.eth',
        sourceLogoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        url: 'https://ethereum.org',
        tags: ['ETH', 'Layer2'],
        alphaScore: 78,
        publishedAt: new Date(now - 60 * 60 * 1000).toISOString(),
        isBreaking: false
      }
    ];
    return demoStories.slice(0, limit);
  }

  /**
   * Demo data for trending stories when API fails
   */
  private getDemoTrendingStories(limit: number): CompactStory[] {
    const now = Date.now();
    const demoStories = [
      {
        id: 'demo_trend_1',
        title: 'DeFi Summer 2.0: New Yield Opportunities',
        summary: 'Multiple protocols launching innovative yield strategies with 15%+ APY on stablecoins through automated market makers.',
        sourceName: '@hasufl',
        sourceLogoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        url: 'https://example.com',
        tags: ['DeFi', 'Trading'],
        alphaScore: 92,
        publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        isBreaking: false
      },
      {
        id: 'demo_trend_2',
        title: 'Institutional Adoption Accelerates',
        summary: 'BlackRock and Fidelity ETFs see record inflows as traditional finance embraces crypto infrastructure.',
        sourceName: '@balajis',
        sourceLogoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        url: 'https://example.com',
        tags: ['BTC', 'Trading'],
        alphaScore: 88,
        publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        isBreaking: false
      }
    ];
    return demoStories.slice(0, limit);
  }

  /**
   * Demo data for prominent figures when API fails
   */
  private getDemoProminentFigures(limit: number): ProminentFigure[] {
    const demoFigures = [
      {
        id: '5650',
        fid: 5650,
        handle: 'vitalik.eth',
        displayName: 'Vitalik Buterin',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        role: 'Ethereum Founder',
        lastHighlight: 'Optimistic about L2 scaling reaching mainstream adoption this year',
        influenceScore: 98,
        topics: ['ETH', 'Layer2']
      },
      {
        id: '3',
        fid: 3,
        handle: 'dwr.eth',
        displayName: 'Dan Romero',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'Farcaster Co-founder',
        lastHighlight: 'Building in public creates faster feedback loops for product teams',
        influenceScore: 94,
        topics: ['Social', 'Protocol']
      }
    ];
    return demoFigures.slice(0, limit);
  }

  /**
   * Demo data for alpha ticker when API fails
   */
  private getDemoAlphaTickerItems(limit: number): AlphaTickerItem[] {
    const now = Date.now();
    const demoItems = [
      {
        id: 'ticker_1',
        title: 'Base TVL Surpasses $1.5B',
        impact: 'high' as const,
        sentiment: 'bullish' as const,
        url: 'https://base.org',
        timestamp: new Date(now - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'ticker_2',
        title: 'ETH Staking Yields Hit 4.2%',
        impact: 'medium' as const,
        sentiment: 'bullish' as const,
        url: 'https://ethereum.org',
        timestamp: new Date(now - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'ticker_3',
        title: 'New DeFi Protocol Raises $50M',
        impact: 'high' as const,
        sentiment: 'bullish' as const,
        url: 'https://example.com',
        timestamp: new Date(now - 45 * 60 * 1000).toISOString()
      }
    ];
    return demoItems.slice(0, limit);
  }
}

export const newsService = new NewsService();