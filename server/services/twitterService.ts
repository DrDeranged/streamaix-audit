import axios from 'axios';

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  description?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
  verified?: boolean;
}

interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  context_annotations?: Array<{
    domain: {
      id: string;
      name: string;
      description: string;
    };
    entity: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string; id: string }>;
    urls?: Array<{ expanded_url: string; display_url: string }>;
  };
}

interface TwitterSearchResult {
  data: TwitterTweet[];
  includes?: {
    users: TwitterUser[];
  };
  meta: {
    result_count: number;
    next_token?: string;
  };
}

// Memory cache for API responses
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set<T>(key: string, data: T, ttlSeconds = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Rate limiter for Twitter API
class TwitterRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number = 150; // More reasonable: 150 requests per 15 minutes
  private readonly refillRate: number = 10; // 10 requests per minute
  private backoffUntil: number = 0;
  private lastRequestTime: number = 0;
  private readonly minInterval: number = 1000; // Minimum 1 second between requests

  constructor() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timeSinceRefill = now - this.lastRefill;
    const tokensToAdd = (timeSinceRefill / 60000) * this.refillRate; // per minute
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Check backoff period
    if (now < this.backoffUntil) {
      return false;
    }
    
    // Check minimum interval between requests
    if (now - this.lastRequestTime < this.minInterval) {
      return false;
    }
    
    this.refillTokens();
    
    // More generous token check - allow requests if we have any tokens
    return this.tokens >= 0.1;
  }

  consumeToken(): boolean {
    if (!this.canMakeRequest()) {
      return false;
    }
    
    this.tokens -= 1;
    this.lastRequestTime = Date.now();
    return true;
  }

  handle429Error(retryAfterSeconds?: number): void {
    const backoffTime = retryAfterSeconds ? retryAfterSeconds * 1000 : 15 * 60 * 1000; // Default 15 minutes
    this.backoffUntil = Date.now() + backoffTime;
    this.tokens = 0;
    console.log(`⏱️ Twitter API rate limit hit, backing off for ${backoffTime / 1000} seconds`);
  }
}

export class TwitterService {
  private readonly baseUrl = 'https://api.twitter.com/2';
  private readonly bearerToken: string;
  private cache = new MemoryCache();
  private rateLimiter = new TwitterRateLimiter();

  // Top crypto influencers on Twitter
  private readonly cryptoInfluencers = [
    { username: 'elonmusk', name: 'Elon Musk', category: 'Tech/Crypto' },
    { username: 'VitalikButerin', name: 'Vitalik Buterin', category: 'Ethereum' },
    { username: 'naval', name: 'Naval', category: 'Investing/Crypto' },
    { username: 'AnthonyPompliano', name: 'Anthony Pompliano', category: 'Bitcoin' },
    { username: 'saylor', name: 'Michael Saylor', category: 'Bitcoin/MicroStrategy' },
    { username: 'CoinDesk', name: 'CoinDesk', category: 'Crypto News' },
    { username: 'cz_binance', name: 'Changpeng Zhao', category: 'Binance' },
    { username: 'cameron', name: 'Cameron Winklevoss', category: 'Gemini' },
    { username: 'tyler', name: 'Tyler Winklevoss', category: 'Gemini' },
    { username: 'balajis', name: 'Balaji S.', category: 'Crypto/Tech' }
  ];

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    if (!this.bearerToken) {
      console.warn('⚠️ Twitter Bearer Token not configured - using demo mode');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Content-Type': 'application/json'
    };
  }

  private async makeRequest<T>(url: string, params?: Record<string, any>): Promise<T | null> {
    if (!this.bearerToken) {
      console.log('⚠️ Twitter API not configured');
      return null;
    }

    if (!this.rateLimiter.consumeToken()) {
      console.log('⚠️ Twitter API rate limit reached - backing off');
      return null;
    }

    try {
      console.log(`🐦 Making Twitter API request to: ${url}`);
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params,
        timeout: 15000
      });

      console.log(`✅ Twitter API request successful: ${response.status}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || 900;
        this.rateLimiter.handle429Error(retryAfter);
        console.log(`⏱️ Twitter API rate limit hit, backing off for ${retryAfter} seconds`);
      } else if (error.response?.status === 401) {
        console.error('❌ Twitter API authentication failed - check Bearer Token');
      } else if (error.response?.status === 403) {
        console.error('❌ Twitter API forbidden - insufficient permissions');
      } else {
        console.error(`❌ Twitter API error (${error.response?.status}):`, error.message);
      }
      return null;
    }
  }

  // Search for crypto-related tweets
  async searchCryptoTweets(query: string = 'crypto OR bitcoin OR ethereum', maxResults: number = 50): Promise<TwitterTweet[]> {
    const cacheKey = `search:${query}:${maxResults}`;
    const cached = this.cache.get<TwitterTweet[]>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/tweets/search/recent`;
    const params = {
      query: `${query} -is:retweet lang:en`,
      max_results: Math.min(maxResults, 100),
      'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,entities',
      'user.fields': 'username,name,description,profile_image_url,public_metrics,verified',
      expansions: 'author_id'
    };

    try {
      const result = await this.makeRequest<TwitterSearchResult>(url, params);
      if (!result?.data) return [];

      const tweets = this.enrichTweetsWithUserData(result);
      this.cache.set(cacheKey, tweets, 300); // 5 minutes cache
      
      console.log(`🐦 Fetched ${tweets.length} crypto tweets`);
      return tweets;
    } catch (error) {
      console.error('Failed to search crypto tweets:', error);
      return [];
    }
  }

  // Get trending crypto topics
  async getTrendingCryptoTopics(): Promise<Array<{ topic: string; count: number; tweets: TwitterTweet[] }>> {
    const cacheKey = 'trending:crypto';
    const cached = this.cache.get<Array<{ topic: string; count: number; tweets: TwitterTweet[] }>>(cacheKey);
    if (cached) return cached;

    // Search for various crypto keywords and aggregate
    const cryptoKeywords = [
      'Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Web3', 
      'Crypto', 'Blockchain', 'Altcoin', 'BTC', 'ETH'
    ];

    const topicData: Array<{ topic: string; count: number; tweets: TwitterTweet[] }> = [];

    for (const keyword of cryptoKeywords.slice(0, 5)) { // Limit to avoid rate limits
      const tweets = await this.searchCryptoTweets(keyword, 20);
      if (tweets.length > 0) {
        topicData.push({
          topic: keyword,
          count: tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.like_count || 0), 0),
          tweets: tweets.slice(0, 5) // Top 5 tweets per topic
        });
      }
    }

    // Sort by engagement
    topicData.sort((a, b) => b.count - a.count);
    
    this.cache.set(cacheKey, topicData, 600); // 10 minutes cache
    return topicData;
  }

  // Get tweets from crypto influencers
  async getCryptoInfluencerTweets(): Promise<TwitterTweet[]> {
    const cacheKey = 'influencer:tweets';
    const cached = this.cache.get<TwitterTweet[]>(cacheKey);
    if (cached) return cached;

    if (!this.bearerToken) {
      console.log('⚠️ Twitter Bearer Token not configured');
      return [];
    }

    const allTweets: TwitterTweet[] = [];

    // Get tweets from a smaller set of influencers to stay within rate limits
    for (const influencer of this.cryptoInfluencers.slice(0, 2)) {
      try {
        const tweets = await this.getUserTweets(influencer.username, 3);
        allTweets.push(...tweets);
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`⚠️ Failed to fetch tweets for ${influencer.username}:`, error);
      }
    }

    // If we have tweets, sort them by engagement
    if (allTweets.length > 0) {
      allTweets.sort((a, b) => {
        const aEngagement = (a.public_metrics?.like_count || 0) + (a.public_metrics?.retweet_count || 0);
        const bEngagement = (b.public_metrics?.like_count || 0) + (b.public_metrics?.retweet_count || 0);
        return bEngagement - aEngagement;
      });

      const topTweets = allTweets.slice(0, 10);
      this.cache.set(cacheKey, topTweets, 900); // 15 minutes cache
      
      console.log(`🐦 Fetched ${topTweets.length} real tweets from Twitter API`);
      return topTweets;
    }

    // If no tweets available, return empty array (no demo data)
    console.log('⚠️ No Twitter content available - rate limits or API issues');
    return [];
  }

  // Get user's recent tweets
  async getUserTweets(username: string, maxResults: number = 20): Promise<TwitterTweet[]> {
    const cacheKey = `user:${username}:tweets`;
    const cached = this.cache.get<TwitterTweet[]>(cacheKey);
    if (cached) return cached;

    try {
      // First get user ID
      const userUrl = `${this.baseUrl}/users/by/username/${username}`;
      const userResult = await this.makeRequest<{ data: TwitterUser }>(userUrl, {
        'user.fields': 'id,username,name,description,profile_image_url,public_metrics,verified'
      });

      if (!userResult?.data?.id) return [];

      // Then get their tweets
      const tweetsUrl = `${this.baseUrl}/users/${userResult.data.id}/tweets`;
      const tweetsResult = await this.makeRequest<{ data: TwitterTweet[] }>(tweetsUrl, {
        max_results: Math.min(maxResults, 100),
        'tweet.fields': 'created_at,author_id,public_metrics,context_annotations,entities',
        exclude: 'retweets,replies'
      });

      const tweets = tweetsResult?.data || [];
      
      // Enrich with user data
      const enrichedTweets = tweets.map(tweet => ({
        ...tweet,
        author: userResult.data
      }));

      this.cache.set(cacheKey, enrichedTweets, 600); // 10 minutes cache
      return enrichedTweets;
    } catch (error) {
      console.error(`Failed to get tweets for ${username}:`, error);
      return [];
    }
  }

  // Get user profile
  async getUserProfile(username: string): Promise<TwitterUser | null> {
    const cacheKey = `user:${username}:profile`;
    const cached = this.cache.get<TwitterUser>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/users/by/username/${username}`;
    const params = {
      'user.fields': 'id,username,name,description,profile_image_url,public_metrics,verified,created_at'
    };

    try {
      const result = await this.makeRequest<{ data: TwitterUser }>(url, params);
      if (!result?.data) return null;

      this.cache.set(cacheKey, result.data, 1800); // 30 minutes cache
      return result.data;
    } catch (error) {
      console.error(`Failed to get profile for ${username}:`, error);
      return null;
    }
  }

  // Helper to enrich tweets with user data
  private enrichTweetsWithUserData(result: TwitterSearchResult): TwitterTweet[] {
    const users = result.includes?.users || [];
    const userMap = new Map(users.map(user => [user.id, user]));

    return result.data.map(tweet => ({
      ...tweet,
      author: userMap.get(tweet.author_id)
    }));
  }

  // Convert Twitter data to format compatible with existing frontend
  formatForDiscoverPage(tweets: TwitterTweet[]): any[] {
    return tweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      author: {
        username: tweet.author?.username || 'unknown',
        displayName: tweet.author?.name || 'Unknown User',
        bio: tweet.author?.description || '',
        pfpUrl: tweet.author?.profile_image_url || '',
        followerCount: tweet.author?.public_metrics?.followers_count || 0,
        verified: tweet.author?.verified || false
      },
      timestamp: tweet.created_at,
      reactions: {
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0
      },
      hash: tweet.id, // Use tweet ID as hash
      parentHash: null, // Twitter API doesn't provide parent info in basic search
      mentions: tweet.entities?.mentions?.map(m => ({ username: m.username })) || [],
      embeds: tweet.entities?.urls?.map(u => ({ url: u.expanded_url })) || [],
      channel: {
        id: 'twitter',
        name: 'Twitter',
        description: 'Crypto discussions on Twitter'
      }
    }));
  }

  // Get crypto influencers list for "Who to follow" section
  getCryptoInfluencers() {
    return this.cryptoInfluencers;
  }
}

// Export singleton instance
export const twitterService = new TwitterService();