interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  publishedAt: string;
  channelTitle: string;
  duration?: string;
  viewCount?: string;
  url: string;
}

interface YouTubeChannel {
  id: string;
  name: string;
  handle: string;
}

class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 300000; // 5 minutes cache

  // Top crypto YouTube channels
  private cryptoChannels: YouTubeChannel[] = [
    { id: 'UC0zV0eXKjDbOjqDjKnVKLVg', name: 'What Bitcoin Did', handle: '@WhatBitcoinDid' },
    { id: 'UCAl9Ld79qaZxp2JeuEYr7Ow', name: 'Bankless', handle: '@Bankless' },
    { id: 'UCfwLxfr8_B8M2qaRVajl7eg', name: 'Unchained', handle: '@UnchainedPodcast' },
    { id: 'UC4sS8q8E5ayyQMtlNuCOTqA', name: 'The Investors Podcast', handle: '@TheInvestorsPodcast' },
    { id: 'UCiUnrCUGCJTCC7KjuW493Ww', name: 'Epicenter', handle: '@Epicenter' },
    { id: 'UCdOdJfz7QMXDNQY9bqDyShA', name: 'InvestAnswers', handle: '@InvestAnswers' },
    { id: 'UCqK_GSMbpiV8spgD3ZGloSw', name: 'Coin Bureau', handle: '@CoinBureau' },
    { id: 'UCdmoWMKXWGBSxhJn6QjLy7A', name: 'Anthony Pompliano', handle: '@AnthonyPompliano' }
  ];

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ YouTube API key not found. YouTube integration will be disabled.');
    }
  }

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  private isValidCache(item: { data: any; timestamp: number }): boolean {
    return Date.now() - item.timestamp < this.cacheTimeout;
  }

  private async makeRequest(endpoint: string, params: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isValidCache(cached)) {
      console.log(`📺 YouTube cache hit for ${endpoint}`);
      return cached.data;
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.append('key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      console.log(`📺 YouTube API request: ${endpoint}`);
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`YouTube API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Cache successful response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`📺 YouTube API error for ${endpoint}:`, error);
      throw error;
    }
  }

  async getLatestVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      // Get channel's uploads playlist
      const channelResponse = await this.makeRequest('channels', {
        part: 'contentDetails',
        id: channelId,
        maxResults: 1
      });

      if (!channelResponse.items?.length) {
        console.warn(`📺 No channel found for ID: ${channelId}`);
        return [];
      }

      const uploadsPlaylistId = channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

      // Get latest videos from uploads playlist
      const playlistResponse = await this.makeRequest('playlistItems', {
        part: 'snippet,contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults,
        order: 'date'
      });

      if (!playlistResponse.items?.length) {
        return [];
      }

      // Get additional video details
      const videoIds = playlistResponse.items.map((item: any) => item.contentDetails.videoId).join(',');
      const videosResponse = await this.makeRequest('videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoIds
      });

      return videosResponse.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        duration: this.parseDuration(item.contentDetails.duration),
        viewCount: item.statistics.viewCount ? parseInt(item.statistics.viewCount).toLocaleString() : undefined,
        url: `https://www.youtube.com/watch?v=${item.id}`
      }));
    } catch (error) {
      console.error(`📺 Error fetching videos for channel ${channelId}:`, error);
      return [];
    }
  }

  async getLatestCryptoContent(limit: number = 20): Promise<YouTubeVideo[]> {
    const allVideos: YouTubeVideo[] = [];
    
    // Fetch from multiple channels in parallel
    const channelPromises = this.cryptoChannels.slice(0, 4).map(async (channel) => {
      try {
        const videos = await this.getLatestVideos(channel.id, 5);
        return videos;
      } catch (error) {
        console.error(`📺 Error fetching from ${channel.name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(channelPromises);
    results.forEach(videos => allVideos.push(...videos));

    // Sort by publish date (most recent first) and limit results
    return allVideos
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit)
      .map(video => ({
        ...video,
        // Add some additional formatting for the frontend
        uploadTime: this.formatTimeAgo(video.publishedAt),
        isLive: false, // We'll implement live detection later
        tags: this.extractTags(video.title, video.description)
      }));
  }

  private parseDuration(isoDuration: string): string {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);
    
    if (!matches) return 'Unknown';
    
    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseInt(matches[3] || '0');
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  private formatTimeAgo(publishedAt: string): string {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInMinutes = Math.floor((now.getTime() - published.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return `${Math.floor(diffInMinutes / 10080)}w ago`;
  }

  private extractTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const cryptoTerms = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'defi', 'nft', 'crypto', 'blockchain',
      'web3', 'dao', 'trading', 'investment', 'altcoin', 'solana', 'cardano',
      'polygon', 'avalanche', 'chainlink', 'uniswap', 'maker', 'compound',
      'aave', 'yearn', 'sushi', 'curve', 'balancer', 'synthetix'
    ];
    
    return cryptoTerms.filter(term => text.includes(term));
  }

  async searchCryptoVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      const searchResponse = await this.makeRequest('search', {
        part: 'snippet',
        q: `${query} crypto cryptocurrency bitcoin ethereum`,
        type: 'video',
        order: 'date',
        maxResults,
        publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
      });

      if (!searchResponse.items?.length) {
        return [];
      }

      const videoIds = searchResponse.items.map((item: any) => item.id.videoId).join(',');
      const videosResponse = await this.makeRequest('videos', {
        part: 'snippet,contentDetails,statistics',
        id: videoIds
      });

      return videosResponse.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        duration: this.parseDuration(item.contentDetails.duration),
        viewCount: item.statistics.viewCount ? parseInt(item.statistics.viewCount).toLocaleString() : undefined,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        uploadTime: this.formatTimeAgo(item.snippet.publishedAt),
        isLive: false,
        tags: this.extractTags(item.snippet.title, item.snippet.description)
      }));
    } catch (error) {
      console.error('📺 Error searching YouTube videos:', error);
      return [];
    }
  }
}

export const youtubeService = new YouTubeService();
export type { YouTubeVideo };