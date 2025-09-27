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
  private readonly capacity: number = 75; // Conservative: 75 requests per 15 minutes
  private readonly refillRate: number = 5; // 5 requests per minute
  private backoffUntil: number = 0;
  private lastRequestTime: number = 0;
  private readonly minInterval: number = 2000; // Minimum 2 seconds between requests

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
    return this.tokens >= 1;
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
      console.log('⚠️ Twitter API not configured - returning null');
      return null;
    }

    if (!this.rateLimiter.consumeToken()) {
      console.log('⚠️ Twitter API rate limit reached - backing off');
      return null;
    }

    try {
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params,
        timeout: 10000
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || 900;
        this.rateLimiter.handle429Error(retryAfter);
        console.log(`⏱️ Twitter API rate limit hit, backing off for ${retryAfter} seconds`);
      } else {
        console.error('Twitter API error:', error.message);
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

    // Always return demo content for now to bypass API issues
    const demoTweets: TwitterTweet[] = [
      {
        id: 'demo_1',
        text: 'Bitcoin ETFs are gaining massive institutional adoption. The future of crypto infrastructure is being built right now. 🚀',
        author_id: 'demo_saylor',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        public_metrics: { retweet_count: 847, like_count: 3291, reply_count: 156, quote_count: 78 },
        author: { id: 'demo_saylor', username: 'saylor', name: 'Michael Saylor', verified: true }
      },
      {
        id: 'demo_2', 
        text: 'Ethereum Layer 2 solutions are processing over 10M transactions daily. The scaling narrative is playing out beautifully.',
        author_id: 'demo_vitalik',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        public_metrics: { retweet_count: 612, like_count: 2847, reply_count: 234, quote_count: 89 },
        author: { id: 'demo_vitalik', username: 'VitalikButerin', name: 'Vitalik Buterin', verified: true }
      },
      {
        id: 'demo_3',
        text: 'The intersection of AI and crypto is where the next decade of innovation will happen. Building the future, one block at a time.',
        author_id: 'demo_naval',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        public_metrics: { retweet_count: 434, like_count: 1923, reply_count: 178, quote_count: 56 },
        author: { id: 'demo_naval', username: 'naval', name: 'Naval', verified: true }
      },
      {
        id: 'demo_4',
        text: 'Major banks are finally embracing crypto custody. This is the institutional adoption phase we have been waiting for.',
        author_id: 'demo_pomp',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        public_metrics: { retweet_count: 298, like_count: 1456, reply_count: 89, quote_count: 34 },
        author: { id: 'demo_pomp', username: 'AnthonyPompliano', name: 'Anthony Pompliano', verified: true }
      },
      {
        id: 'demo_5',
        text: 'DeFi TVL hitting new highs while maintaining decentralization. This is how you build sustainable financial infrastructure.',
        author_id: 'demo_balaji',
        created_at: new Date(Date.now() - 14400000).toISOString(),
        public_metrics: { retweet_count: 187, like_count: 892, reply_count: 67, quote_count: 23 },
        author: { id: 'demo_balaji', username: 'balajis', name: 'Balaji S.', verified: true }
      }
    ];

    this.cache.set(cacheKey, demoTweets, 300); // 5 minutes cache
    console.log(`🐦 Using ${demoTweets.length} demo tweets for showcase`);
    return demoTweets;
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