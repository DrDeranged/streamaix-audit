import Parser from 'rss-parser';
import memoize from 'memoizee';

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  published: string;
  source: string;
  sourceLogo?: string;
  summary: string;
  category: string;
  author?: string;
  imageUrl?: string;
}

export class NewsService {
  private static instance: NewsService;
  private parser: Parser;
  private cache: Map<string, { data: NewsArticle[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media'],
          ['description', 'description'],
          ['content:encoded', 'contentEncoded'],
        ]
      }
    });
  }

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private getCached(key: string): NewsArticle[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: NewsArticle[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private cleanHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private truncate(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  async fetchCoinTelegraphNews(): Promise<NewsArticle[]> {
    const cached = this.getCached('cointelegraph');
    if (cached) return cached;

    try {
      const feed = await this.parser.parseURL('https://cointelegraph.com/rss');
      
      const articles: NewsArticle[] = feed.items.slice(0, 20).map((item, index) => {
        const description = this.cleanHtml(item.contentSnippet || item.description || '');
        
        return {
          id: `ct-${Date.now()}-${index}`,
          title: item.title || 'Untitled',
          url: item.link || '',
          published: item.pubDate || new Date().toISOString(),
          source: 'CoinTelegraph',
          sourceLogo: 'https://s3.cointelegraph.com/storage/uploads/view/c197e01d9937c96935b0d1f09679f0ee.png',
          summary: this.truncate(description, 180),
          category: this.categorizeCoinTelegraph(item.title || ''),
          author: item.creator || 'CoinTelegraph',
          imageUrl: (item as any).media?.$?.url || undefined,
        };
      });

      this.setCache('cointelegraph', articles);
      return articles;
    } catch (error) {
      console.error('Error fetching CoinTelegraph RSS:', error);
      return [];
    }
  }

  async fetchCoinDeskNews(): Promise<NewsArticle[]> {
    const cached = this.getCached('coindesk');
    if (cached) return cached;

    try {
      const feed = await this.parser.parseURL('https://www.coindesk.com/arc/outboundfeeds/rss/');
      
      const articles: NewsArticle[] = feed.items.slice(0, 20).map((item, index) => {
        const description = this.cleanHtml(item.contentSnippet || item.description || '');
        
        return {
          id: `cd-${Date.now()}-${index}`,
          title: item.title || 'Untitled',
          url: item.link || '',
          published: item.pubDate || new Date().toISOString(),
          source: 'CoinDesk',
          sourceLogo: 'https://www.coindesk.com/resizer/TrrkaXUdvJ2RP1X_J9OLYVz-vVE=/cloudfront-us-east-1.images.arcpublishing.com/coindesk/KMNO6B4VXFCVVCZQZQGZPMQKOQ.png',
          summary: this.truncate(description, 180),
          category: this.categorizeCoinDesk(item.title || '', description),
          author: item.creator || 'CoinDesk',
          imageUrl: undefined,
        };
      });

      this.setCache('coindesk', articles);
      return articles;
    } catch (error) {
      console.error('Error fetching CoinDesk RSS:', error);
      return [];
    }
  }

  private categorizeCoinTelegraph(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('bitcoin') || titleLower.includes('btc')) return 'Bitcoin';
    if (titleLower.includes('ethereum') || titleLower.includes('eth')) return 'Ethereum';
    if (titleLower.includes('defi') || titleLower.includes('decentralized finance')) return 'DeFi';
    if (titleLower.includes('nft') || titleLower.includes('metaverse')) return 'NFT & Metaverse';
    if (titleLower.includes('regulation') || titleLower.includes('sec') || titleLower.includes('law')) return 'Regulation';
    if (titleLower.includes('market') || titleLower.includes('price') || titleLower.includes('trading')) return 'Markets';
    if (titleLower.includes('blockchain') || titleLower.includes('web3')) return 'Technology';
    
    return 'General';
  }

  private categorizeCoinDesk(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('regulation') || text.includes('policy') || text.includes('sec') || text.includes('government')) return 'Regulation';
    if (text.includes('defi') || text.includes('decentralized')) return 'DeFi';
    if (text.includes('bitcoin') || text.includes('btc')) return 'Bitcoin';
    if (text.includes('ethereum') || text.includes('eth')) return 'Ethereum';
    if (text.includes('market') || text.includes('price') || text.includes('trading')) return 'Markets';
    if (text.includes('technology') || text.includes('blockchain') || text.includes('protocol')) return 'Technology';
    if (text.includes('business') || text.includes('company') || text.includes('partnership')) return 'Business';
    
    return 'General';
  }

  async getCryptoNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      const [ctArticles, cdArticles] = await Promise.all([
        this.fetchCoinTelegraphNews(),
        this.fetchCoinDeskNews()
      ]);

      const combined = [...ctArticles, ...cdArticles]
        .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
        .slice(0, limit);

      return combined;
    } catch (error) {
      console.error('Error fetching crypto news:', error);
      return [];
    }
  }

  async getMacroNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      const cdArticles = await this.fetchCoinDeskNews();
      
      const macroArticles = cdArticles.filter(article => {
        const category = article.category.toLowerCase();
        const title = article.title.toLowerCase();
        const summary = article.summary.toLowerCase();
        const text = `${category} ${title} ${summary}`;
        
        return (
          category.includes('regulation') ||
          category.includes('business') ||
          text.includes('economy') ||
          text.includes('federal reserve') ||
          text.includes('inflation') ||
          text.includes('interest rate') ||
          text.includes('policy') ||
          text.includes('government') ||
          text.includes('financial')
        );
      });

      return macroArticles.slice(0, limit);
    } catch (error) {
      console.error('Error fetching macro news:', error);
      return [];
    }
  }
}

export const newsService = NewsService.getInstance();
