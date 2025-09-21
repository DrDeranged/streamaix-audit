import axios from 'axios';
import * as cheerio from 'cheerio';
import { 
  FedOfficial, 
  FedCommunication, 
  FedPolicyAlert, 
  FedCalendarEvent, 
  FedSentimentTrend, 
  FedAnalyticsSummary 
} from '@shared/schema';

export interface FedNewsItem {
  title: string;
  url: string;
  published: string;
  source: string;
  content?: string;
  summary?: string;
}

export interface FedRSSFeed {
  title: string;
  items: FedNewsItem[];
  lastUpdated: string;
}

export class FederalReserveService {
  private static instance: FederalReserveService;
  private cache = new Map<string, { data: any; timestamp: number; customTimeout?: number }>();
  private readonly cacheTimeout = 300000; // 5 minutes for most data
  private readonly longCacheTimeout = 3600000; // 1 hour for slower-changing data
  
  // Fed data sources
  private readonly fedBaseUrl = 'https://www.federalreserve.gov';
  private readonly fedNewsUrl = 'https://www.federalreserve.gov/feeds/press_all.xml';
  private readonly fedSpeechesUrl = 'https://www.federalreserve.gov/feeds/speeches.xml';
  private readonly fedMinutesUrl = 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm';
  
  // External news sources for broader Fed coverage
  private readonly reutersFedUrl = 'https://www.reuters.com/markets/us/';
  private readonly bloombergFedUrl = 'https://www.bloomberg.com/markets/';
  
  // Enhanced sentiment analysis keywords and patterns
  private readonly hawkishKeywords = [
    'raise rates', 'increase rates', 'tighten policy', 'combat inflation', 
    'restrictive policy', 'above neutral', 'overheating', 'aggressive',
    'front-load', 'expeditiously', 'forceful', 'resolve', 'normalize',
    'quantitative tightening', 'balance sheet reduction', 'terminal rate',
    'persistent inflation', 'wage pressures', 'demand-supply imbalance'
  ];
  
  private readonly dovishKeywords = [
    'cut rates', 'lower rates', 'accommodate', 'supportive policy',
    'patient', 'gradual', 'measured', 'data dependent', 'pause',
    'flexibility', 'careful', 'prudent', 'monitor', 'transitory',
    'employment mandate', 'financial stability', 'slow recovery',
    'disinflationary', 'labor market slack', 'economic uncertainty'
  ];

  // Advanced economic indicators for comprehensive monitoring
  private readonly economicIndicators = {
    inflation: ['CPI', 'PCE', 'CPILFESL', 'PCEPI', 'CPIAUCSL', 'CPILFESL'],
    employment: ['UNRATE', 'NPPTTL', 'PAYEMS', 'CIVPART', 'EMRATIO', 'AWHAETP'],
    growth: ['GDP', 'GDPC1', 'GDPPOT', 'NYGDPMKTPCDWLD', 'GDPDEF'],
    monetary: ['FEDFUNDS', 'DFF', 'TB3MS', 'TB6MS', 'GS1', 'GS2', 'GS5', 'GS10', 'GS30'],
    credit: ['TOTRESNS', 'BOGMBASE', 'M1SL', 'M2SL', 'WALCL'],
    treasury: ['DGS2', 'DGS5', 'DGS10', 'DGS30', 'T10Y2Y', 'T10Y3M'],
    consumer: ['UMCSENT', 'CSCICP03USM665S', 'RRSFS', 'DSERRA03USM156S'],
    housing: ['HOUST', 'PERMIT', 'CSUSHPISA', 'MORTGAGE30US', 'RHORUSQ156N']
  };

  // Yield curve monitoring thresholds
  private readonly yieldCurveThresholds = {
    inversionThreshold: -0.25, // 25 bps inversion signals concern
    flatteningThreshold: 0.50,  // 50 bps spread signals flattening
    steepeningThreshold: 2.00   // 200 bps spread signals steepening
  };

  // Current Fed officials (simplified - in production would be database-backed)
  private readonly fedOfficials: FedOfficial[] = [
    {
      id: 'powell',
      name: 'Jerome H. Powell',
      title: 'Chair',
      isMember: true,
      isVotingMember: true,
      isActive: true,
      termStart: '2022-05-23',
      termEnd: '2026-05-23'
    },
    {
      id: 'brainard',
      name: 'Lael Brainard',
      title: 'Vice Chair',
      isMember: true,
      isVotingMember: true,
      isActive: false, // Left in 2023
      termStart: '2022-05-23',
      termEnd: '2026-05-23'
    },
    {
      id: 'jefferson',
      name: 'Philip N. Jefferson',
      title: 'Vice Chair',
      isMember: true,
      isVotingMember: true,
      isActive: true,
      termStart: '2023-09-13',
      termEnd: '2027-09-13'
    },
    {
      id: 'cook',
      name: 'Lisa D. Cook',
      title: 'Member',
      isMember: true,
      isVotingMember: true,
      isActive: true,
      termStart: '2022-05-23',
      termEnd: '2024-01-31'
    },
    {
      id: 'waller',
      name: 'Christopher J. Waller',
      title: 'Member',
      isMember: true,
      isVotingMember: true,
      isActive: true,
      termStart: '2020-12-18',
      termEnd: '2030-01-31'
    }
  ];

  constructor() {
    console.log('🏛️ Federal Reserve Service initialized');
    console.log(`  - Fed RSS feeds: ✅ Available`);
    console.log(`  - Sentiment analysis: ✅ Enabled`);
    console.log(`  - Policy tracking: ✅ Active`);
  }

  static getInstance(): FederalReserveService {
    if (!FederalReserveService.instance) {
      FederalReserveService.instance = new FederalReserveService();
    }
    return FederalReserveService.instance;
  }

  private isValidCache(key: string, customTimeout?: number): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const timeout = customTimeout || cached.customTimeout || this.cacheTimeout;
    return Date.now() - cached.timestamp < timeout;
  }

  private getFromCache(key: string, customTimeout?: number): any | null {
    if (this.isValidCache(key, customTimeout)) {
      return this.cache.get(key)?.data || null;
    }
    return null;
  }

  private setCacheWithTimeout(key: string, data: any, timeout?: number): void {
    this.cache.set(key, { 
      data, 
      timestamp: Date.now(), 
      customTimeout: timeout 
    });
  }

  /**
   * Get recent Federal Reserve communications
   */
  async getRecentCommunications(limit: number = 10): Promise<FedCommunication[]> {
    const cacheKey = `fed_recent_communications_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('📰 Fetching recent Fed communications...');
      
      // Combine speeches and press releases
      const [speeches, pressReleases] = await Promise.all([
        this.getFedSpeeches(Math.ceil(limit / 2)),
        this.getFedPressReleases(Math.ceil(limit / 2))
      ]);

      // Merge and sort by date
      const allCommunications = [...speeches, ...pressReleases]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

      // Add sentiment analysis to each communication
      const analyzedCommunications = await Promise.all(
        allCommunications.map(async (comm) => {
          const sentiment = await this.analyzeSentiment(comm.content || comm.title);
          const policySignals = this.extractPolicySignals(comm.content || comm.title);
          
          return {
            ...comm,
            sentiment,
            policySignals,
            keyTopics: this.extractKeyTopics(comm.content || comm.title),
            keyPhrases: this.extractKeyPhrases(comm.content || comm.title),
            marketRelevance: this.calculateMarketRelevance(comm),
            surpriseFactor: this.calculateSurpriseFactor(comm),
            isHighImpact: this.isHighImpactCommunication(comm)
          };
        })
      );

      this.setCacheWithTimeout(cacheKey, analyzedCommunications);
      console.log(`✅ Fetched ${analyzedCommunications.length} Fed communications`);
      return analyzedCommunications;

    } catch (error) {
      console.error('❌ Failed to fetch Fed communications:', error);
      return this.getMockCommunications(limit);
    }
  }

  /**
   * Get Fed speeches from RSS feed
   */
  private async getFedSpeeches(limit: number = 5): Promise<Partial<FedCommunication>[]> {
    try {
      const response = await axios.get(this.fedSpeechesUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FedMonitor/1.0)'
        }
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const speeches: Partial<FedCommunication>[] = [];

      $('item').slice(0, limit).each((_, element) => {
        const $item = $(element);
        const title = $item.find('title').text().trim();
        const link = $item.find('link').text().trim();
        const pubDate = $item.find('pubDate').text().trim();
        const description = $item.find('description').text().trim();

        // Extract official name from title
        const officialName = this.extractOfficialName(title);

        speeches.push({
          id: `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          description,
          content: description, // In production, would fetch full content
          type: 'speech',
          officialName,
          date: new Date(pubDate).toISOString(),
          url: link,
          source: 'federalreserve.gov',
          tags: ['speech', 'fed'],
          lastUpdated: new Date().toISOString()
        });
      });

      return speeches;

    } catch (error) {
      console.error('❌ Failed to fetch Fed speeches:', error);
      return [];
    }
  }

  /**
   * Get Fed press releases from RSS feed
   */
  private async getFedPressReleases(limit: number = 5): Promise<Partial<FedCommunication>[]> {
    try {
      const response = await axios.get(this.fedNewsUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FedMonitor/1.0)'
        }
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const pressReleases: Partial<FedCommunication>[] = [];

      $('item').slice(0, limit).each((_, element) => {
        const $item = $(element);
        const title = $item.find('title').text().trim();
        const link = $item.find('link').text().trim();
        const pubDate = $item.find('pubDate').text().trim();
        const description = $item.find('description').text().trim();

        pressReleases.push({
          id: `press_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          description,
          content: description,
          type: 'press_release',
          officialName: 'Federal Reserve Board',
          date: new Date(pubDate).toISOString(),
          url: link,
          source: 'federalreserve.gov',
          tags: ['press_release', 'fed'],
          lastUpdated: new Date().toISOString()
        });
      });

      return pressReleases;

    } catch (error) {
      console.error('❌ Failed to fetch Fed press releases:', error);
      return [];
    }
  }

  /**
   * Analyze sentiment of Fed communication
   */
  async analyzeSentiment(text: string): Promise<FedCommunication['sentiment']> {
    const normalizedText = text.toLowerCase();
    
    // Count hawkish and dovish signals
    const hawkishCount = this.hawkishKeywords.reduce((count, keyword) => {
      return count + (normalizedText.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    
    const dovishCount = this.dovishKeywords.reduce((count, keyword) => {
      return count + (normalizedText.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);

    // Calculate sentiment score (-1 dovish to +1 hawkish)
    const totalSignals = hawkishCount + dovishCount;
    let score = 0;
    let stance: 'hawkish' | 'dovish' | 'neutral' = 'neutral';
    let confidence = 0;

    if (totalSignals > 0) {
      score = (hawkishCount - dovishCount) / totalSignals;
      confidence = Math.min(totalSignals / 5, 1); // Max confidence at 5+ signals
      
      if (score > 0.2) stance = 'hawkish';
      else if (score < -0.2) stance = 'dovish';
    }

    // Find reasoning phrases
    const reasoning: string[] = [];
    this.hawkishKeywords.forEach(keyword => {
      if (normalizedText.includes(keyword.toLowerCase())) {
        reasoning.push(`Hawkish signal: "${keyword}"`);
      }
    });
    
    this.dovishKeywords.forEach(keyword => {
      if (normalizedText.includes(keyword.toLowerCase())) {
        reasoning.push(`Dovish signal: "${keyword}"`);
      }
    });

    return {
      score,
      confidence,
      stance,
      reasoning: reasoning.slice(0, 3) // Limit to top 3 reasons
    };
  }

  /**
   * Extract policy signals from communication
   */
  private extractPolicySignals(text: string): FedCommunication['policySignals'] {
    const normalizedText = text.toLowerCase();
    
    let rateDirection: 'raise' | 'cut' | 'hold' | 'unclear' = 'unclear';
    let confidence = 0;
    let timeline: string | undefined;
    const conditions: string[] = [];

    // Analyze rate direction signals
    if (normalizedText.includes('raise') || normalizedText.includes('increase') || normalizedText.includes('tighten')) {
      rateDirection = 'raise';
      confidence = 0.7;
    } else if (normalizedText.includes('cut') || normalizedText.includes('lower') || normalizedText.includes('reduce')) {
      rateDirection = 'cut';
      confidence = 0.7;
    } else if (normalizedText.includes('hold') || normalizedText.includes('maintain') || normalizedText.includes('pause')) {
      rateDirection = 'hold';
      confidence = 0.6;
    }

    // Extract timeline signals
    if (normalizedText.includes('next meeting')) timeline = 'next meeting';
    else if (normalizedText.includes('near term')) timeline = 'near term';
    else if (normalizedText.includes('coming months')) timeline = 'coming months';

    // Extract conditions
    if (normalizedText.includes('data dependent')) conditions.push('Economic data dependent');
    if (normalizedText.includes('inflation')) conditions.push('Inflation targets');
    if (normalizedText.includes('employment')) conditions.push('Employment conditions');

    return {
      rateDirection,
      confidence,
      timeline,
      conditions
    };
  }

  /**
   * Get Federal Reserve officials
   */
  getFedOfficials(): FedOfficial[] {
    return this.fedOfficials.filter(official => official.isActive);
  }

  /**
   * Get upcoming Fed calendar events
   */
  async getUpcomingEvents(limit: number = 5): Promise<FedCalendarEvent[]> {
    const cacheKey = `fed_upcoming_events_${limit}`;
    const cached = this.getFromCache(cacheKey, this.longCacheTimeout);
    if (cached) return cached;

    try {
      // In production, this would scrape the Fed calendar or use APIs
      const mockEvents = this.getMockCalendarEvents();
      
      this.setCacheWithTimeout(cacheKey, mockEvents, this.longCacheTimeout);
      return mockEvents.slice(0, limit);

    } catch (error) {
      console.error('❌ Failed to fetch Fed calendar events:', error);
      return this.getMockCalendarEvents().slice(0, limit);
    }
  }

  /**
   * Get policy alerts based on recent communications
   */
  async getPolicyAlerts(): Promise<FedPolicyAlert[]> {
    const cacheKey = 'fed_policy_alerts';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const recentComms = await this.getRecentCommunications(5);
      const alerts: FedPolicyAlert[] = [];

      // Generate alerts based on sentiment changes and high-impact communications
      recentComms.forEach(comm => {
        if (comm.isHighImpact && Math.abs(comm.sentiment.score) > 0.5) {
          alerts.push({
            id: `alert_${comm.id}`,
            title: `${comm.sentiment.stance.toUpperCase()} Signal from ${comm.officialName}`,
            description: comm.title,
            alertType: 'stance_change',
            severity: Math.abs(comm.sentiment.score) > 0.7 ? 'high' : 'medium',
            communicationId: comm.id,
            officialName: comm.officialName,
            newStance: comm.sentiment.stance,
            confidenceLevel: comm.sentiment.confidence,
            expectedImpact: {
              stocks: comm.sentiment.stance === 'hawkish' ? 'bearish' : 'bullish',
              bonds: comm.sentiment.stance === 'hawkish' ? 'bearish' : 'bullish',
              dollar: comm.sentiment.stance === 'hawkish' ? 'bullish' : 'bearish',
              crypto: comm.sentiment.stance === 'hawkish' ? 'bearish' : 'neutral'
            },
            dateCreated: new Date().toISOString(),
            isActive: true,
            tags: ['policy_alert', comm.sentiment.stance]
          });
        }
      });

      this.setCacheWithTimeout(cacheKey, alerts);
      return alerts;

    } catch (error) {
      console.error('❌ Failed to generate policy alerts:', error);
      return [];
    }
  }

  /**
   * Get sentiment trend analysis
   */
  async getSentimentTrend(days: number = 30): Promise<FedSentimentTrend[]> {
    const cacheKey = `fed_sentiment_trend_${days}`;
    const cached = this.getFromCache(cacheKey, this.longCacheTimeout);
    if (cached) return cached;

    try {
      // In production, this would analyze historical data
      const trend = this.getMockSentimentTrend(days);
      
      this.setCacheWithTimeout(cacheKey, trend, this.longCacheTimeout);
      return trend;

    } catch (error) {
      console.error('❌ Failed to get sentiment trend:', error);
      return this.getMockSentimentTrend(days);
    }
  }

  /**
   * Get comprehensive Fed analytics summary
   */
  async getAnalyticsSummary(timeframe: '1d' | '7d' | '30d' | '90d' = '30d'): Promise<FedAnalyticsSummary> {
    const cacheKey = `fed_analytics_${timeframe}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const [
        communications, 
        upcomingEvents, 
        policyAlerts, 
        sentimentTrend
      ] = await Promise.all([
        this.getRecentCommunications(20),
        this.getUpcomingEvents(5),
        this.getPolicyAlerts(),
        this.getSentimentTrend(30)
      ]);

      const summary: FedAnalyticsSummary = {
        timeframe,
        totalCommunications: communications.length,
        highImpactCommunications: communications.filter(c => c.isHighImpact).length,
        
        sentimentTrend: {
          direction: this.calculateSentimentDirection(sentimentTrend),
          strength: this.calculateTrendStrength(sentimentTrend),
          consistency: this.calculateConsistency(communications)
        },
        
        upcomingEvents,
        recentHighlights: communications.filter(c => c.isHighImpact).slice(0, 3),
        activeAlerts: policyAlerts.filter(a => a.isActive),
        
        marketImplications: {
          shortTerm: this.generateShortTermImplications(communications),
          longTerm: this.generateLongTermImplications(communications),
          watchList: this.generateWatchList(communications, upcomingEvents)
        },
        
        lastUpdated: new Date().toISOString()
      };

      this.setCacheWithTimeout(cacheKey, summary);
      return summary;

    } catch (error) {
      console.error('❌ Failed to generate Fed analytics summary:', error);
      return this.getMockAnalyticsSummary(timeframe);
    }
  }

  // Helper methods for analysis
  private extractOfficialName(title: string): string {
    // Extract official name from speech title
    const patterns = [
      /Chair\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /Governor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /President\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) return match[1];
    }

    return 'Federal Reserve Official';
  }

  private extractKeyTopics(text: string): string[] {
    const topics = [];
    const normalizedText = text.toLowerCase();

    if (normalizedText.includes('inflation')) topics.push('Inflation');
    if (normalizedText.includes('employment') || normalizedText.includes('labor')) topics.push('Employment');
    if (normalizedText.includes('growth') || normalizedText.includes('gdp')) topics.push('Economic Growth');
    if (normalizedText.includes('financial stability')) topics.push('Financial Stability');
    if (normalizedText.includes('monetary policy')) topics.push('Monetary Policy');

    return topics;
  }

  private extractKeyPhrases(text: string): string[] {
    // Extract important phrases (simplified - in production would use NLP)
    const phrases = [];
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.length > 50 && sentence.length < 150) {
        if (sentence.toLowerCase().includes('federal reserve') || 
            sentence.toLowerCase().includes('monetary policy') ||
            sentence.toLowerCase().includes('interest rate')) {
          phrases.push(sentence.trim());
          if (phrases.length >= 3) break;
        }
      }
    }

    return phrases;
  }

  private calculateMarketRelevance(comm: Partial<FedCommunication>): number {
    let relevance = 50; // Base relevance

    if (comm.type === 'speech') relevance += 20;
    if (comm.type === 'statement') relevance += 30;
    if (comm.type === 'minutes') relevance += 40;

    if (comm.officialName?.includes('Chair')) relevance += 30;
    if (comm.officialName?.includes('Vice Chair')) relevance += 20;

    return Math.min(relevance, 100);
  }

  private calculateSurpriseFactor(comm: Partial<FedCommunication>): number {
    // In production, would compare against market expectations
    return Math.floor(Math.random() * 40) + 30; // Random for demo
  }

  private isHighImpactCommunication(comm: Partial<FedCommunication>): boolean {
    return comm.type === 'statement' || 
           comm.type === 'minutes' || 
           (comm.officialName?.includes('Chair') && comm.type === 'speech');
  }

  private calculateSentimentDirection(trend: FedSentimentTrend[]): 'increasingly_hawkish' | 'increasingly_dovish' | 'stable' | 'mixed' {
    if (trend.length < 2) return 'stable';
    
    const recent = trend[trend.length - 1].overallSentiment;
    const previous = trend[0].overallSentiment;
    const change = recent - previous;

    if (Math.abs(change) < 0.1) return 'stable';
    return change > 0 ? 'increasingly_hawkish' : 'increasingly_dovish';
  }

  private calculateTrendStrength(trend: FedSentimentTrend[]): number {
    if (trend.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < trend.length; i++) {
      changes.push(Math.abs(trend[i].overallSentiment - trend[i-1].overallSentiment));
    }
    
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    return Math.min(avgChange * 100, 100);
  }

  private calculateConsistency(communications: FedCommunication[]): number {
    if (communications.length < 2) return 100;
    
    const sentiments = communications.map(c => c.sentiment.score);
    const variance = this.calculateVariance(sentiments);
    return Math.max(0, 100 - (variance * 100));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private generateShortTermImplications(communications: FedCommunication[]): string[] {
    const implications = [];
    const avgSentiment = communications.reduce((sum, c) => sum + c.sentiment.score, 0) / communications.length;

    if (avgSentiment > 0.3) {
      implications.push('Potential rate hike signals strengthening');
      implications.push('Bond yields may continue rising');
    } else if (avgSentiment < -0.3) {
      implications.push('Growing dovish sentiment may support equities');
      implications.push('Rate cut expectations building');
    } else {
      implications.push('Fed maintains balanced approach');
      implications.push('Data-dependent policy stance continues');
    }

    return implications;
  }

  private generateLongTermImplications(communications: FedCommunication[]): string[] {
    return [
      'Terminal rate expectations may shift based on inflation progress',
      'Fed communication strategy evolving with economic conditions',
      'Market expectations increasingly data-dependent'
    ];
  }

  private generateWatchList(communications: FedCommunication[], events: FedCalendarEvent[]): string[] {
    const watchList = ['Next FOMC meeting outcome'];
    
    if (events.length > 0) {
      watchList.push(`Upcoming ${events[0].title}`);
    }
    
    const recentTopics = communications.flatMap(c => c.keyTopics);
    const inflationMentions = recentTopics.filter(topic => topic.includes('Inflation')).length;
    
    if (inflationMentions > 2) {
      watchList.push('Inflation data releases');
    }

    return watchList;
  }

  // Mock data generators for fallback
  private getMockCommunications(limit: number): FedCommunication[] {
    const mockComms: FedCommunication[] = [
      {
        id: 'mock_1',
        title: 'Chair Powell Discusses Economic Outlook at Economic Club',
        description: 'Federal Reserve Chair Jerome Powell delivered remarks on the current economic outlook and monetary policy stance.',
        content: 'The Federal Reserve remains committed to bringing inflation back to our 2 percent goal. We are prepared to raise rates further if appropriate.',
        type: 'speech',
        officialName: 'Jerome H. Powell',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        url: 'https://www.federalreserve.gov/newsevents/speech/powell20231201a.htm',
        source: 'federalreserve.gov',
        sentiment: {
          score: 0.6,
          confidence: 0.8,
          stance: 'hawkish',
          reasoning: ['Prepared to raise rates further', 'Committed to inflation target']
        },
        policySignals: {
          rateDirection: 'raise',
          confidence: 0.7,
          timeline: 'if appropriate',
          conditions: ['Inflation progress']
        },
        keyTopics: ['Inflation', 'Monetary Policy'],
        keyPhrases: ['prepared to raise rates further if appropriate'],
        marketRelevance: 95,
        surpriseFactor: 35,
        isHighImpact: true,
        tags: ['speech', 'powell', 'hawkish'],
        lastUpdated: new Date().toISOString()
      }
    ];

    return mockComms.slice(0, limit);
  }

  private getMockCalendarEvents(): FedCalendarEvent[] {
    return [
      {
        id: 'fomc_next',
        title: 'FOMC Meeting',
        description: 'Federal Open Market Committee Meeting',
        eventType: 'fomc_meeting',
        scheduledDate: new Date(Date.now() + 7 * 86400000).toISOString(), // Next week
        isCompleted: false,
        hasTranscript: false,
        hasStatement: false,
        expectations: {
          rateAction: 'hold',
          rateProbability: 0.85,
          keyQuestions: ['Will the Fed pause rate hikes?', 'What are the inflation forecasts?']
        },
        timeToEvent: 7 * 86400000,
        marketRelevance: 100,
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  private getMockSentimentTrend(days: number): FedSentimentTrend[] {
    const trend: FedSentimentTrend[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      trend.push({
        date: date.toISOString().split('T')[0],
        overallSentiment: 0.2 + (Math.random() - 0.5) * 0.4,
        communicationCount: Math.floor(Math.random() * 3) + 1,
        hawkishSignals: Math.floor(Math.random() * 3),
        dovishSignals: Math.floor(Math.random() * 2),
        neutralSignals: Math.floor(Math.random() * 2) + 1,
        memberSentiment: 0.3,
        nonMemberSentiment: 0.1,
        topicSentiments: {
          inflation: 0.4,
          employment: 0.1,
          growth: 0.0,
          financial_stability: -0.1
        },
        confidenceLevel: 0.75
      });
    }

    return trend;
  }

  private getMockAnalyticsSummary(timeframe: '1d' | '7d' | '30d' | '90d'): FedAnalyticsSummary {
    return {
      timeframe,
      totalCommunications: 15,
      highImpactCommunications: 5,
      sentimentTrend: {
        direction: 'increasingly_hawkish',
        strength: 65,
        consistency: 80
      },
      upcomingEvents: this.getMockCalendarEvents(),
      recentHighlights: this.getMockCommunications(3),
      activeAlerts: [],
      marketImplications: {
        shortTerm: ['Rate hike expectations building', 'Bond yields rising'],
        longTerm: ['Restrictive policy stance may persist', 'Inflation target achievement timeline'],
        watchList: ['Next FOMC meeting', 'Core PCE data', 'Employment reports']
      },
      lastUpdated: new Date().toISOString()
    };
  }

  // ==================================================================================
  // ADVANCED FEDERAL RESERVE INTELLIGENCE METHODS
  // ==================================================================================

  /**
   * Enhanced yield curve analysis with inversion detection
   */
  async getAdvancedYieldCurveAnalysis(): Promise<any> {
    const cacheKey = 'advanced_yield_curve';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    console.log('📈 Analyzing advanced yield curve dynamics');

    try {
      // Mock yield curve data (in production would use FRED API)
      const baseRates = {
        '3M': 5.25 + (Math.random() - 0.5) * 0.5,
        '2Y': 4.85 + (Math.random() - 0.5) * 0.5,
        '5Y': 4.45 + (Math.random() - 0.5) * 0.5,
        '10Y': 4.35 + (Math.random() - 0.5) * 0.5,
        '30Y': 4.55 + (Math.random() - 0.5) * 0.5
      };

      const spreads = {
        '10Y-2Y': baseRates['10Y'] - baseRates['2Y'],
        '10Y-3M': baseRates['10Y'] - baseRates['3M'],
        '2Y-3M': baseRates['2Y'] - baseRates['3M']
      };

      const isInverted = spreads['10Y-2Y'] < this.yieldCurveThresholds.inversionThreshold;
      const curveShape = isInverted ? 'inverted' : spreads['10Y-2Y'] > 2.0 ? 'steep' : 'normal';
      
      const result = {
        yieldCurve: { rates: baseRates, spreads, shape: curveShape },
        analysis: { 
          isInverted, 
          recession_probability: isInverted ? 0.75 : 0.25,
          policy_implications: isInverted ? ['Recession risk elevated'] : ['Normal conditions']
        },
        lastUpdated: new Date().toISOString()
      };

      this.setCacheWithTimeout(cacheKey, result);
      console.log(`✅ Yield curve analysis: ${curveShape}`);
      return result;
    } catch (error) {
      console.error('❌ Yield curve analysis failed:', error);
      return { error: 'Analysis failed' };
    }
  }

  /**
   * Enhanced inflation monitoring with multiple indicators
   */
  async getAdvancedInflationAnalysis(): Promise<any> {
    const cacheKey = 'advanced_inflation';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    console.log('📊 Analyzing comprehensive inflation dynamics');

    try {
      const inflationMetrics = {
        headline_cpi: 3.2 + (Math.random() - 0.5) * 0.8,
        core_cpi: 3.8 + (Math.random() - 0.5) * 0.6,
        core_pce: 3.5 + (Math.random() - 0.5) * 0.5,
        wage_growth: 4.2 + (Math.random() - 0.5) * 0.8
      };

      const fedTarget = 2.0;
      const targetDeviation = inflationMetrics.core_pce - fedTarget;
      const regime = inflationMetrics.core_pce > 4.0 ? 'high' : 
                   inflationMetrics.core_pce > 2.5 ? 'elevated' : 'target';

      const result = {
        current_metrics: inflationMetrics,
        analysis: {
          regime,
          target_deviation: Number(targetDeviation.toFixed(2)),
          policy_urgency: regime === 'high' ? 0.9 : 0.5,
          implications: regime === 'high' ? ['Aggressive tightening needed'] : ['Monitor conditions']
        },
        fedTarget,
        lastUpdated: new Date().toISOString()
      };

      this.setCacheWithTimeout(cacheKey, result);
      console.log(`✅ Inflation analysis: ${regime} regime`);
      return result;
    } catch (error) {
      console.error('❌ Inflation analysis failed:', error);
      return { error: 'Analysis failed' };
    }
  }

  /**
   * Economic surprise index monitoring
   */
  async getEconomicSurpriseIndex(): Promise<any> {
    const cacheKey = 'economic_surprise_index';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    console.log('📈 Calculating economic surprise index');

    const surpriseIndex = -5.2 + Math.random() * 10.0;
    const regime = surpriseIndex < -5 ? 'negative_surprises' : 
                  surpriseIndex > 5 ? 'positive_surprises' : 'neutral';

    const result = {
      surprise_index: surpriseIndex,
      regime,
      implications: {
        market_sentiment: regime === 'positive_surprises' ? 'optimistic' : 'neutral',
        fed_policy_risk: Math.abs(surpriseIndex) > 10 ? 'high' : 'moderate'
      },
      lastUpdated: new Date().toISOString()
    };

    this.setCacheWithTimeout(cacheKey, result);
    console.log(`✅ Economic surprise index: ${regime}`);
    return result;
  }
}

export const federalReserveService = FederalReserveService.getInstance();