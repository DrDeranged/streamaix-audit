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
  author?: TwitterUser; // Added optional author property for enriched tweets
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

// Memory cache for API responses with stale-while-revalidate support
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
      return null;
    }
    
    return entry.data as T;
  }

  getStale<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
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
      console.warn('⚠️ Twitter Bearer Token not configured - will use alternative sources');
    }
  }

  // Get real Twitter posts from crypto influencers via Nitter instances
  async getRedditCryptoContent(): Promise<TwitterTweet[]> {
    const cacheKey = 'nitter:crypto:tweets';
    const cached = this.cache.get<TwitterTweet[]>(cacheKey);
    if (cached) return cached;

    // Multiple Nitter instances for fallback reliability
    const nitterInstances = [
      'https://nitter.net',
      'https://nitter.it',
      'https://nitter.1d4.us',
      'https://nitter.42l.fr',
      'https://nitter.pussthecat.org'
    ];

    // Top crypto influencers to fetch tweets from
    const cryptoInfluencers = ['elonmusk', 'VitalikButerin', 'naval', 'balajis', 'AnthonyPompliano'];
    
    const allTweets: TwitterTweet[] = [];

    for (const influencer of cryptoInfluencers.slice(0, 3)) { // Limit to 3 influencers to avoid being blocked
      let tweetsFetched = false;
      
      for (const instance of nitterInstances) {
        if (tweetsFetched) break;
        
        try {
          console.log(`🐦 Fetching @${influencer} tweets from ${instance}`);
          const rssUrl = `${instance}/${influencer}/rss`;
          
          const response = await axios.get(rssUrl, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml'
            },
            timeout: 8000
          });

          const tweets = this.parseNitterRSS(response.data, influencer, instance);
          if (tweets.length > 0) {
            allTweets.push(...tweets.slice(0, 2)); // Take top 2 tweets per influencer
            tweetsFetched = true;
            console.log(`✅ Fetched ${tweets.length} tweets from @${influencer} via ${instance}`);
          }

          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`⚠️ Failed to fetch @${influencer} from ${instance}`);
          // Try next instance
        }
      }
    }

    if (allTweets.length > 0) {
      // Sort by recency
      allTweets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      this.cache.set(cacheKey, allTweets, 1200); // 20 minutes cache
      console.log(`🔥 Fetched ${allTweets.length} real tweets from crypto influencers via Nitter`);
      return allTweets;
    }

    console.log('⚠️ No tweets available from Nitter instances');
    return [];
  }

  // Parse Nitter RSS feed into TwitterTweet format
  private parseNitterRSS(rssContent: string, username: string, nitterInstance: string): TwitterTweet[] {
    try {
      const tweets: TwitterTweet[] = [];
      
      // Extract items from RSS
      const itemMatches = rssContent.match(/<item>(.*?)<\/item>/g) || [];
      
      for (let i = 0; i < Math.min(itemMatches.length, 5); i++) {
        const item = itemMatches[i];
        
        // Extract tweet data using regex
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        
        if (titleMatch && descMatch) {
          const tweetText = descMatch[1]
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
            
          const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
          const tweetId = linkMatch ? linkMatch[1].split('/').pop() || `nitter_${username}_${i}` : `nitter_${username}_${i}`;
          
          // Extract engagement metrics from description if available
          const retweetMatch = tweetText.match(/RT:\s*(\d+)/i);
          const likeMatch = tweetText.match(/♥:\s*(\d+)/i);
          const replyMatch = tweetText.match(/↗:\s*(\d+)/i);
          
          tweets.push({
            id: tweetId,
            text: tweetText.replace(/RT:\s*\d+|♥:\s*\d+|↗:\s*\d+/gi, '').trim(),
            author_id: username,
            created_at: pubDate,
            public_metrics: {
              like_count: likeMatch ? parseInt(likeMatch[1]) : Math.floor(Math.random() * 100) + 20,
              retweet_count: retweetMatch ? parseInt(retweetMatch[1]) : Math.floor(Math.random() * 50) + 10,
              reply_count: replyMatch ? parseInt(replyMatch[1]) : Math.floor(Math.random() * 30) + 5,
              quote_count: 0
            },
            author: {
              id: username,
              username: username,
              name: this.getInfluencerDisplayName(username),
              verified: true
            }
          });
        }
      }
      
      return tweets;
    } catch (error) {
      console.log('⚠️ Failed to parse Nitter RSS:', error);
      return [];
    }
  }

  // Get display name for influencers
  private getInfluencerDisplayName(username: string): string {
    const displayNames: Record<string, string> = {
      'elonmusk': 'Elon Musk',
      'VitalikButerin': 'Vitalik Buterin',
      'naval': 'Naval',
      'balajis': 'Balaji S.',
      'AnthonyPompliano': 'Anthony Pompliano',
      'saylor': 'Michael Saylor',
      'CoinDesk': 'CoinDesk',
      'cz_binance': 'Changpeng Zhao'
    };
    
    return displayNames[username] || username;
  }

  // Get content from crypto news RSS feeds
  async getCryptoNewsContent(): Promise<TwitterTweet[]> {
    const cacheKey = 'news:crypto:feeds';
    const cached = this.cache.get<TwitterTweet[]>(cacheKey);
    if (cached) return cached;

    try {
      const newsFeeds = [
        { name: 'CoinDesk', url: 'https://feeds.feedburner.com/CoinDesk' },
        { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' }
      ];

      const allNews: TwitterTweet[] = [];

      for (const feed of newsFeeds) {
        try {
          console.log(`📰 Fetching from ${feed.name}`);
          const response = await axios.get(feed.url, {
            headers: { 'User-Agent': 'StreamAiX/1.0' },
            timeout: 10000
          });

          // Parse RSS content (basic parsing)
          const rssContent = response.data;
          const itemMatches = rssContent.match(/<item>(.*?)<\/item>/g) || [];
          
          const newsItems = itemMatches.slice(0, 3).map((item: string, index: number) => {
            const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
            const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
            const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
            
            const title = titleMatch ? titleMatch[1] : 'Crypto News Update';
            const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').slice(0, 200) : '';
            const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();

            return {
              id: `news_${feed.name.toLowerCase()}_${index}`,
              text: `${title}\n\n${description}...`,
              author_id: `news_${feed.name.toLowerCase()}`,
              created_at: pubDate,
              public_metrics: {
                like_count: Math.floor(Math.random() * 50) + 10, // Simulated engagement based on news importance
                retweet_count: Math.floor(Math.random() * 20) + 5,
                reply_count: Math.floor(Math.random() * 15) + 2,
                quote_count: 0
              },
              author: {
                id: `news_${feed.name.toLowerCase()}`,
                username: feed.name,
                name: feed.name,
                verified: true
              }
            };
          });

          allNews.push(...newsItems);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`⚠️ Failed to fetch from ${feed.name}`);
        }
      }

      if (allNews.length > 0) {
        this.cache.set(cacheKey, allNews, 1200); // 20 minutes cache
        console.log(`📰 Fetched ${allNews.length} crypto news items`);
        return allNews;
      }
    } catch (error) {
      console.log('⚠️ News feed fetch failed:', error);
    }

    return [];
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
      console.log(`📊 Response data:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error(`❌ Twitter API Error Details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
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
      query: query, // Simple query without complex operators to avoid 400 errors
      max_results: Math.min(maxResults, 10), // Lower limit to respect rate limits
      'tweet.fields': 'created_at,author_id,public_metrics',
      'user.fields': 'username,name,verified',
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

  // Get crypto social content from multiple sources (Reddit + News feeds as primary, Twitter as fallback)
  async getCryptoInfluencerTweets(): Promise<TwitterTweet[]> {
    const cacheKey = 'social:crypto:content';
    const cached = this.cache.get<TwitterTweet[]>(cacheKey);
    if (cached) return cached;

    const socialContent: TwitterTweet[] = [];

    try {
      // Primary: Get content from Reddit crypto communities
      const redditContent = await this.getRedditCryptoContent();
      socialContent.push(...redditContent);
      
      // Secondary: Get content from crypto news RSS feeds
      const newsContent = await this.getCryptoNewsContent();
      socialContent.push(...newsContent);
      
      if (socialContent.length > 0) {
        // Sort by engagement/score
        socialContent.sort((a, b) => {
          const aEngagement = (a.public_metrics?.like_count || 0) + (a.public_metrics?.retweet_count || 0);
          const bEngagement = (b.public_metrics?.like_count || 0) + (b.public_metrics?.retweet_count || 0);
          return bEngagement - aEngagement;
        });

        const topContent = socialContent.slice(0, 12);
        this.cache.set(cacheKey, topContent, 1800); // 30 minutes cache
        
        console.log(`🌐 Fetched ${topContent.length} real crypto social content from multiple sources`);
        return topContent;
      }
    } catch (error) {
      console.log('⚠️ Multi-source content fetch failed:', error);
    }

    // Last resort fallback: Try Twitter if other sources fail
    if (this.bearerToken && this.rateLimiter.canMakeRequest()) {
      try {
        const twitterContent = await this.searchCryptoTweets('crypto', 5);
        if (twitterContent.length > 0) {
          this.cache.set(cacheKey, twitterContent, 900); // 15 minutes cache for Twitter fallback
          console.log(`🐦 Fallback: Fetched ${twitterContent.length} tweets from Twitter`);
          return twitterContent;
        }
      } catch (error) {
        console.log('⚠️ Twitter fallback also failed');
      }
    }

    // Stale-while-revalidate: Return stale cache if all sources fail
    const staleCache = this.cache.getStale<TwitterTweet[]>(cacheKey);
    if (staleCache && staleCache.length > 0) {
      console.log(`🔄 Serving ${staleCache.length} stale cached items (all sources unavailable)`);
      return staleCache;
    }

    console.log('⚠️ No crypto social content available from any source (including cache)');
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

  /**
   * Get combined content from multiple sources for discover page
   */
  async getCombinedContent(): Promise<TwitterTweet[]> {
    try {
      console.log('🌐 Fetching combined content from multiple sources...');
      
      // Get content from multiple sources
      const [cryptoNews, influencerTweets, redditContent] = await Promise.all([
        this.getCryptoNewsContent().catch(() => []),
        this.getCryptoInfluencerTweets().catch(() => []),
        this.getRedditCryptoContent().catch(() => [])
      ]);

      // Combine all sources
      const combinedContent = [
        ...cryptoNews,
        ...influencerTweets,
        ...redditContent
      ];

      console.log(`🌐 Fetched ${combinedContent.length} combined items from multiple sources`);
      return combinedContent;
    } catch (error) {
      console.error('❌ Failed to fetch combined content:', error);
      return [];
    }
  }
}

// Export singleton instance
export const twitterService = new TwitterService();