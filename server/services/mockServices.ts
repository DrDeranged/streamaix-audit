/**
 * Mock services for demonstrating StreamProcessorV2 functionality
 * These simulate successful content extraction and AI processing
 */

export interface ExtractedContent {
  audioPath: string;
  title: string;
  duration: number;
  description?: string;
  thumbnail?: string;
  // Enhanced metadata for better AI processing
  contentType: 'educational' | 'business' | 'crypto' | 'podcast' | 'livestream' | 'general';
  platform: 'youtube' | 'soundcloud' | 'twitch' | 'web';
  detectedKeywords: string[];
  originalUrl: string;
}

export interface AIResult {
  transcript: string;
  summary: string;
  tldrSummary?: string;
  blogPost?: string;
  marketAnalysis?: string;
  rawData?: any;
  keyInsights: Array<{
    insight: string;
    timestamp?: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  chapters: Array<{
    title: string;
    startTime: string;
    endTime: string;
    summary: string;
  }>;
  tags: string[];
  duration: number;
  accuracy: number;
}

export class MockContentExtractor {
  static async extractContent(url: string): Promise<ExtractedContent> {
    console.log(`[MockExtractor] Extracting content from: ${url}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ENHANCED URL ANALYSIS with multiple detection signals
    const analysisResult = this.analyzeUrl(url);
    console.log(`[MockExtractor] Detected content type: ${analysisResult.contentType}, platform: ${analysisResult.platform}`);
    console.log(`[MockExtractor] Keywords: ${analysisResult.detectedKeywords.join(', ')}`);
    
    return {
      audioPath: `/tmp/mock-audio-${Date.now()}.mp3`,
      title: analysisResult.title,
      duration: analysisResult.duration,
      description: analysisResult.description,
      contentType: analysisResult.contentType,
      platform: analysisResult.platform,
      detectedKeywords: analysisResult.detectedKeywords,
      originalUrl: url
    };
  }

  private static analyzeUrl(url: string): {
    title: string;
    description: string;
    duration: number;
    contentType: 'educational' | 'business' | 'crypto' | 'podcast' | 'livestream' | 'general';
    platform: 'youtube' | 'soundcloud' | 'twitch' | 'web';
    detectedKeywords: string[];
  } {
    // Platform Detection
    let platform: 'youtube' | 'soundcloud' | 'twitch' | 'web' = 'web';
    if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
    else if (url.includes('soundcloud.com')) platform = 'soundcloud';
    else if (url.includes('twitch.tv')) platform = 'twitch';

    // Content Type Detection with multiple signals
    let contentType: 'educational' | 'business' | 'crypto' | 'podcast' | 'livestream' | 'general' = 'general';
    let detectedKeywords: string[] = [];
    let title = "Professional Content Analysis";
    let description = "Comprehensive analysis and strategic insights.";
    let duration = 1200;

    // YOUTUBE SPECIFIC ANALYSIS
    if (platform === 'youtube') {
      // Check for educational indicators
      if (url.includes('t=') || url.includes('tutorial') || url.includes('how-to') || url.includes('guide')) {
        contentType = 'educational';
        title = "Advanced Business Strategy & Market Analysis Tutorial";
        description = "In-depth educational content covering strategic business frameworks, market positioning dynamics, and competitive analysis techniques for sustainable growth.";
        detectedKeywords = ['business-strategy', 'market-analysis', 'tutorial', 'educational', 'competitive-analysis'];
        duration = 847;
      }
      // Check for crypto/finance indicators
      else if (url.includes('crypto') || url.includes('bitcoin') || url.includes('defi') || url.includes('trading')) {
        contentType = 'crypto';
        title = "Cryptocurrency Market Analysis & DeFi Protocol Deep Dive";
        description = "Professional cryptocurrency market analysis covering Bitcoin technical patterns, DeFi yield strategies, and blockchain technology developments.";
        detectedKeywords = ['cryptocurrency', 'bitcoin', 'defi', 'market-analysis', 'blockchain'];
        duration = 1156;
      }
      // Check for business indicators
      else if (url.includes('business') || url.includes('startup') || url.includes('strategy') || url.includes('growth')) {
        contentType = 'business';
        title = "Strategic Business Growth & Market Expansion Analysis";
        description = "Strategic business analysis focusing on growth optimization, market expansion techniques, and competitive positioning frameworks.";
        detectedKeywords = ['business-growth', 'market-expansion', 'strategy', 'competitive-analysis'];
        duration = 980;
      }
      // Default to business for YouTube (most professional content)
      else {
        contentType = 'business';
        title = "Professional Business Strategy & Market Analysis";
        description = "Comprehensive business analysis covering market dynamics, strategic positioning, and growth optimization for competitive advantage.";
        detectedKeywords = ['business-strategy', 'market-analysis', 'professional-development'];
        duration = 1024;
      }
    }
    // SOUNDCLOUD SPECIFIC ANALYSIS
    else if (platform === 'soundcloud') {
      contentType = 'podcast';
      title = "Tech Leadership Podcast: Strategic Business Insights";
      description = "Professional podcast discussion with industry leaders covering business strategy, market trends, and leadership insights.";
      detectedKeywords = ['podcast', 'tech-leadership', 'business-strategy', 'industry-insights'];
      duration = 2847;
    }
    // TWITCH SPECIFIC ANALYSIS
    else if (platform === 'twitch') {
      contentType = 'livestream';
      title = "Live Market Analysis & Trading Strategy Session";
      description = "Real-time market analysis with professional commentary on trading strategies, market movements, and investment insights.";
      detectedKeywords = ['livestream', 'market-analysis', 'trading', 'real-time'];
      duration = 3600;
    }

    return { title, description, duration, contentType, platform, detectedKeywords };
  }
}

export class MockAIService {
  private static generateDynamicChapters(contentType: string, totalDuration: number): Array<{title: string, startTime: string, endTime: string, summary: string}> {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Generate chapters dynamically based on total duration
    if (contentType === 'crypto') {
      const chapterCount = Math.max(5, Math.ceil(totalDuration / 900)); // At least 5 chapters, roughly 15-min segments
      const segmentDuration = totalDuration / chapterCount;
      
      const cryptoTopics = [
        { title: "Market Overview & Technical Analysis", summary: "Bitcoin consolidation patterns and key resistance/support levels analysis." },
        { title: "DeFi Protocol Developments", summary: "23% TVL growth analysis and institutional adoption trends in DeFi ecosystem." },
        { title: "Cross-Chain Interoperability Trends", summary: "Multi-chain future developments and interoperability project opportunities." },
        { title: "Risk Management & Portfolio Strategy", summary: "Diversification strategies and correlation analysis with traditional markets." },
        { title: "Regulatory Landscape & Institutional Adoption", summary: "Regulatory clarity impact on institutional capital allocation opportunities." },
        { title: "Layer 2 Solutions & Scaling", summary: "Ethereum scaling solutions and their impact on DeFi ecosystem performance." },
        { title: "Yield Farming & Staking Strategies", summary: "Advanced yield optimization techniques and risk-adjusted return analysis." },
        { title: "NFT Market Analysis", summary: "Non-fungible token trends and utility-based asset evaluation frameworks." },
        { title: "Central Bank Digital Currencies", summary: "CBDC developments and their impact on traditional cryptocurrency markets." },
        { title: "Market Outlook & Investment Thesis", summary: "Long-term market predictions and strategic positioning recommendations." }
      ];
      
      const chapters = [];
      for (let i = 0; i < chapterCount; i++) {
        const startTime = Math.floor(i * segmentDuration);
        const endTime = Math.floor((i + 1) * segmentDuration);
        const topic = cryptoTopics[i % cryptoTopics.length];
        
        chapters.push({
          title: topic.title,
          startTime: formatTime(startTime),
          endTime: formatTime(Math.min(endTime, totalDuration)),
          summary: topic.summary
        });
      }
      return chapters;
      
    } else if (contentType === 'business' || contentType === 'educational') {
      const chapterCount = Math.max(5, Math.ceil(totalDuration / 1000)); // Roughly 16-17 min segments
      const segmentDuration = totalDuration / chapterCount;
      
      const businessTopics = [
        { title: "Market Positioning Dynamics", summary: "Adaptive strategies for changing consumer behaviors and market conditions." },
        { title: "Customer Acquisition Optimization", summary: "Long-term value focus strategies achieving 40% higher retention rates." },
        { title: "Competitive Analysis Framework", summary: "Identifying genuine opportunities versus temporary market noise patterns." },
        { title: "Operational Excellence & Scaling", summary: "Infrastructure investment strategies for sustainable growth and quality maintenance." },
        { title: "Technology Integration Benefits", summary: "Automation and analytics providing measurable competitive advantages." },
        { title: "Financial Planning & Unit Economics", summary: "Revenue optimization and cost structure analysis for sustainable growth." },
        { title: "Team Building & Leadership", summary: "Organizational development strategies for high-performance culture creation." },
        { title: "Strategic Partnerships & Alliances", summary: "Partnership evaluation frameworks and strategic alliance development." },
        { title: "Innovation & Product Development", summary: "Product-market fit optimization and innovation pipeline management." },
        { title: "Future Growth & Market Expansion", summary: "Long-term strategic planning and market expansion opportunity analysis." }
      ];
      
      const chapters = [];
      for (let i = 0; i < chapterCount; i++) {
        const startTime = Math.floor(i * segmentDuration);
        const endTime = Math.floor((i + 1) * segmentDuration);
        const topic = businessTopics[i % businessTopics.length];
        
        chapters.push({
          title: topic.title,
          startTime: formatTime(startTime),
          endTime: formatTime(Math.min(endTime, totalDuration)),
          summary: topic.summary
        });
      }
      return chapters;
      
    } else {
      // General content
      const chapterCount = Math.max(4, Math.ceil(totalDuration / 1200)); // Roughly 20 min segments
      const segmentDuration = totalDuration / chapterCount;
      
      const generalTopics = [
        { title: "Introduction & Context", summary: "Setting the foundation and providing essential background information." },
        { title: "Core Concepts & Analysis", summary: "Deep dive into primary topics and analytical frameworks." },
        { title: "Practical Applications", summary: "Real-world implementation strategies and case studies." },
        { title: "Advanced Insights & Trends", summary: "Expert-level analysis and future trend predictions." },
        { title: "Strategic Recommendations", summary: "Actionable recommendations and strategic implementation guidance." },
        { title: "Q&A and Discussion", summary: "Community questions, expert responses, and detailed clarifications." }
      ];
      
      const chapters = [];
      for (let i = 0; i < chapterCount; i++) {
        const startTime = Math.floor(i * segmentDuration);
        const endTime = Math.floor((i + 1) * segmentDuration);
        const topic = generalTopics[i % generalTopics.length];
        
        chapters.push({
          title: topic.title,
          startTime: formatTime(startTime),
          endTime: formatTime(Math.min(endTime, totalDuration)),
          summary: topic.summary
        });
      }
      return chapters;
    }
  }

  static async processContent(audioPath: string, metadata: any): Promise<AIResult> {
    console.log(`[MockAI] Processing audio: ${audioPath}`);
    console.log(`[MockAI] Metadata received:`, {
      title: metadata?.title,
      contentType: metadata?.contentType,
      platform: metadata?.platform,
      keywords: metadata?.detectedKeywords,
      duration: metadata?.duration
    });
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ENHANCED CONTENT TYPE DETECTION using multiple signals
    const contentAnalysis = this.analyzeContentType(metadata);
    console.log(`[MockAI] Content analysis result:`, contentAnalysis);
    
    const { contentType } = contentAnalysis;
    
    const transcript = contentType === 'crypto' ? 
      `Welcome everyone to today's comprehensive cryptocurrency market analysis. I want to start by discussing the current market dynamics we're seeing across the DeFi ecosystem and what this means for both retail and institutional investors.

Looking at the broader market trends, we're witnessing significant shifts in how traditional finance institutions are approaching digital assets. The regulatory clarity we've been waiting for is slowly emerging, and this is creating new opportunities for strategic positioning.

Let's dive into the technical analysis first. Bitcoin's consolidation pattern over the past few weeks suggests we're setting up for a potential breakout. The key resistance levels we're watching are around the $45,000 and $48,000 marks, with support holding strong at $41,000.

Now, when we examine the DeFi protocols, we're seeing some fascinating developments in yield farming strategies. The total value locked across major protocols has increased by 23% this quarter, indicating growing institutional adoption and confidence in decentralized finance mechanisms.

One of the most significant trends we're tracking is the evolution of cross-chain interoperability. Projects that can seamlessly bridge different blockchain networks are positioning themselves for massive growth as the multi-chain future becomes reality.

From a risk management perspective, it's crucial to understand that while we're seeing tremendous opportunities, portfolio diversification across different crypto sectors remains essential. The correlation between traditional markets and crypto assets is still higher than historical norms.

Looking at the regulatory landscape, recent developments suggest a more favorable environment for institutional adoption. This regulatory clarity is removing significant barriers that have prevented large-scale capital allocation into digital assets.` :
      
      contentType === 'business' || contentType === 'educational' ?
      `Good morning everyone, and welcome to this advanced business strategy session. Today we're going to dive deep into market analysis techniques that successful companies use to maintain their competitive edge in rapidly evolving industries.

The first principle we need to understand is market positioning dynamics. In today's business environment, companies that can quickly adapt to changing consumer behaviors and market conditions consistently outperform their competitors.

Let's start with customer acquisition strategy. The data shows that businesses focusing on long-term customer value rather than short-term acquisition costs see 40% higher retention rates. This shift in thinking is fundamental to building sustainable growth models.

When we analyze successful scaling strategies, we consistently see companies that invest heavily in their operational infrastructure before pursuing aggressive growth. This preparation phase is critical for maintaining quality standards during rapid expansion periods.

The competitive analysis framework we'll discuss today helps identify market gaps that represent genuine opportunities rather than temporary market noise. Too many businesses chase trends instead of building sustainable competitive advantages.

From a financial perspective, the companies showing the strongest performance metrics are those that optimize their unit economics before scaling. Understanding your true customer acquisition cost and lifetime value relationship is non-negotiable.

Technology integration plays a crucial role in modern business strategy. Companies that can effectively leverage automation and data analytics to improve their decision-making processes gain significant operational advantages over competitors still relying on intuition-based approaches.

The key insight here is that sustainable business growth requires a systematic approach to market analysis, customer understanding, and operational excellence. The businesses that master these fundamentals create lasting competitive advantages.` :
      
      `Today we're exploring advanced content strategies and digital transformation approaches that successful organizations use to stay ahead of market trends.

The digital landscape is evolving rapidly, and companies need sophisticated approaches to content strategy, audience engagement, and brand positioning. We'll examine case studies from industry leaders and identify key patterns that drive success.

Market analysis shows that organizations investing in comprehensive digital strategies see 67% better performance metrics compared to those taking traditional approaches. This performance gap is widening as consumer behavior continues shifting toward digital-first experiences.

The key areas we'll cover include audience segmentation strategies, content optimization techniques, and measurement frameworks that provide actionable insights for strategic decision making.

Looking at current market trends, we see successful companies focusing on authentic engagement rather than volume-based metrics. This shift toward quality over quantity is creating new opportunities for businesses that understand their audience deeply.`;

    const summary = contentType === 'crypto' ?
      `# Cryptocurrency Market Analysis & DeFi Protocol Deep Dive

## Executive Summary
This comprehensive analysis examines current cryptocurrency market dynamics, DeFi ecosystem developments, and institutional adoption trends. The discussion reveals critical opportunities in cross-chain interoperability, yield farming strategies, and regulatory-compliant digital asset allocation.

## Market Performance Metrics
- **Bitcoin Consolidation**: Key resistance at $45K-$48K, strong support at $41K
- **DeFi Growth**: 23% increase in total value locked across major protocols
- **Institutional Adoption**: Accelerating capital allocation following regulatory clarity
- **Cross-Chain Development**: Multi-chain interoperability driving next growth phase

## Strategic Investment Framework
The analysis emphasizes portfolio diversification across crypto sectors while maintaining awareness of traditional market correlations. Successful investors focus on projects with strong fundamentals rather than speculative momentum plays.` :

      contentType === 'business' || contentType === 'educational' ?
      `# Advanced Business Strategy & Market Analysis Tutorial

## Executive Summary
This comprehensive business strategy session covers advanced market positioning techniques, customer acquisition optimization, competitive analysis frameworks, and operational excellence strategies for sustainable growth in competitive markets.

## Strategic Performance Indicators
- **Customer Retention**: 40% improvement through long-term value focus
- **Market Positioning**: Adaptive companies outperform by significant margins
- **Operational Excellence**: Infrastructure investment before scaling critical for success
- **Technology Integration**: Automation and analytics provide measurable competitive advantages` :

      `# Digital Content Strategy & Market Positioning Analysis

## Executive Summary
This analysis explores advanced content strategies and digital transformation approaches that successful organizations use to maintain competitive advantages in rapidly evolving digital markets.

## Digital Performance Metrics
- **Strategy Investment ROI**: 67% better performance for comprehensive digital strategies
- **Audience Engagement**: Quality-focused approaches outperform volume-based metrics
- **Market Adaptation**: Digital-first organizations show superior resilience`;

    const keyInsights = contentType === 'crypto' ? [
      {
        insight: "Bitcoin consolidation pattern suggests potential breakout at $45K-$48K resistance levels",
        timestamp: "3:45",
        importance: 'high' as const
      },
      {
        insight: "DeFi protocols showing 23% TVL growth indicating institutional adoption acceleration",
        timestamp: "7:22", 
        importance: 'high' as const
      },
      {
        insight: "Cross-chain interoperability projects positioned for massive growth in multi-chain future",
        timestamp: "12:15",
        importance: 'high' as const
      }
    ] : contentType === 'business' || contentType === 'educational' ? [
      {
        insight: "Companies focusing on long-term customer value see 40% higher retention rates",
        timestamp: "4:12",
        importance: 'high' as const
      },
      {
        insight: "Operational infrastructure investment before scaling critical for quality maintenance",
        timestamp: "8:34",
        importance: 'high' as const
      },
      {
        insight: "Unit economics optimization before scaling shows strongest performance metrics",
        timestamp: "14:56",
        importance: 'medium' as const
      }
    ] : [
      {
        insight: "Organizations with comprehensive digital strategies see 67% better performance",
        timestamp: "4:12",
        importance: 'high' as const
      },
      {
        insight: "Quality-focused engagement strategies outperform volume-based metrics",
        timestamp: "8:34",
        importance: 'high' as const
      },
      {
        insight: "Performance gap widening between digital-first and traditional approaches",
        timestamp: "14:56",
        importance: 'medium' as const
      }
    ];

    // Generate dynamic chapters based on actual content duration
    const actualDuration = metadata?.duration || 1200; // Use metadata duration or fallback
    const chapters = this.generateDynamicChapters(contentType, actualDuration);

    // Use detected keywords as primary tags, with smart fallbacks
    const tags = metadata?.detectedKeywords?.length > 0 ? 
      metadata.detectedKeywords : 
      contentType === 'crypto' ? 
        ['cryptocurrency', 'defi', 'bitcoin', 'blockchain', 'market-analysis'] :
        contentType === 'business' || contentType === 'educational' ?
        ['business-strategy', 'market-analysis', 'customer-acquisition', 'operational-excellence', 'competitive-analysis'] :
        ['digital-strategy', 'content-marketing', 'brand-positioning', 'audience-engagement', 'digital-transformation'];

    // Generate additional comprehensive data for the tabbed interface
    const tldrSummary = contentType === 'crypto' ?
      "Comprehensive cryptocurrency market analysis covering Bitcoin's technical patterns, DeFi protocol growth (23% TVL increase), cross-chain interoperability trends, and regulatory developments creating institutional adoption opportunities. Key focus on risk management and portfolio diversification strategies." :
      contentType === 'business' || contentType === 'educational' ?
      "Advanced business strategy tutorial covering market positioning dynamics, customer acquisition optimization (40% higher retention rates), competitive analysis frameworks, unit economics modeling, and technology integration for operational excellence and sustainable competitive advantages." :
      "Digital content strategy analysis focusing on audience engagement optimization, brand positioning techniques, and performance measurement frameworks. Market data shows 67% better performance for comprehensive digital strategy implementations.";

    const blogPost = summary; // Use the comprehensive summary as the blog post
    
    const marketAnalysis = contentType === 'crypto' ?
      `## Market Intelligence: Cryptocurrency & DeFi Investment Outlook

### Current Market Positioning
The cryptocurrency market is experiencing a maturation phase with institutional adoption accelerating following regulatory clarity. Bitcoin's technical consolidation suggests preparation for significant price movement, with key levels clearly defined.

### Investment Landscape Analysis
- **Institutional Capital Flow**: Major financial institutions increasing digital asset allocations
- **DeFi Protocol Growth**: 23% TVL increase indicating sustained ecosystem expansion
- **Regulatory Clarity**: Government frameworks reducing institutional adoption barriers
- **Cross-Chain Innovation**: Interoperability solutions commanding premium valuations

### Market Recommendation
**High Growth Potential**: Cryptocurrency sector transitioning from speculative to institutional asset class. Focus on fundamentally strong projects with regulatory compliance and proven utility.` :
      
      contentType === 'business' || contentType === 'educational' ?
      `## Market Intelligence: Business Strategy & Competitive Analysis

### Strategic Market Assessment
Advanced business strategy implementation showing measurable performance improvements across multiple metrics. Companies adopting systematic approaches to market analysis and customer acquisition achieving significant competitive advantages.

### Performance Enhancement Data
- **Customer Retention Optimization**: 40% improvement through value-focused strategies
- **Market Adaptability**: Agile companies outperforming traditional approaches
- **Operational Excellence**: Infrastructure investment delivering scalable growth
- **Technology Integration**: Automation providing measurable competitive advantages

### Market Recommendation
**Sustainable Growth Strategy**: Businesses implementing comprehensive strategy frameworks with operational excellence focus positioned for long-term market leadership and superior performance metrics.` :
      
      `## Market Intelligence: Digital Content Strategy & Brand Positioning

### Digital Market Dynamics
Organizations investing in comprehensive digital strategies demonstrating 67% better performance metrics compared to traditional approaches. Market data indicates widening performance gap as consumer behavior shifts digital-first.

### Market Recommendation
**Digital Strategy Excellence**: Comprehensive digital transformation with focus on audience understanding, authentic engagement, and performance measurement positioned for superior market performance and sustainable growth.`;

    const rawData = {
      title: metadata?.title || (contentType === 'crypto' ? "Cryptocurrency Market Analysis & DeFi Protocol Deep Dive" : 
             contentType === 'business' || contentType === 'educational' ? "Advanced Business Strategy & Market Analysis Tutorial" : 
             "Digital Content Strategy & Market Positioning"),
      source: "YouTube Video Analysis",
      duration: metadata?.duration ? `${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')}` : "19:16",
      platform: "YouTube",
      quality: "High-definition analysis",
      fileSize: "287 MB",
      resolution: "1080p",
      metadata: {
        uploadDate: "2024-12-15",
        views: "847K",
        engagement: "12.3%",
        language: "English"
      }
    };

    return {
      transcript,
      summary,
      tldrSummary,
      blogPost,
      marketAnalysis,
      rawData,
      keyInsights,
      chapters,
      tags,
      duration: metadata?.duration || 1156,
      accuracy: 98
    };
  }

  private static analyzeContentType(metadata: any): {
    contentType: 'crypto' | 'business' | 'educational' | 'podcast' | 'livestream' | 'general';
    primaryFocus: string;
    confidence: number;
  } {
    // Use enhanced metadata if available
    if (metadata?.contentType && metadata.contentType !== 'general') {
      return {
        contentType: metadata.contentType,
        primaryFocus: metadata.contentType,
        confidence: 0.95
      };
    }

    // Fallback to keyword analysis
    const keywords = metadata?.detectedKeywords || [];
    const title = metadata?.title || '';
    const description = metadata?.description || '';
    const text = `${title} ${description}`.toLowerCase();

    // Crypto/Finance Detection
    const cryptoKeywords = ['crypto', 'bitcoin', 'defi', 'blockchain', 'trading', 'market'];
    const cryptoScore = this.calculateKeywordScore(text, cryptoKeywords) + 
                       this.calculateKeywordScore(keywords.join(' '), cryptoKeywords);

    // Business/Educational Detection
    const businessKeywords = ['business', 'strategy', 'tutorial', 'analysis', 'growth', 'competitive'];
    const businessScore = this.calculateKeywordScore(text, businessKeywords) + 
                         this.calculateKeywordScore(keywords.join(' '), businessKeywords);

    // Determine content type based on highest score
    if (cryptoScore > businessScore && cryptoScore > 0) {
      return { contentType: 'crypto', primaryFocus: 'cryptocurrency-analysis', confidence: Math.min(0.9, cryptoScore) };
    } else if (businessScore > 0) {
      return { contentType: 'business', primaryFocus: 'business-strategy', confidence: Math.min(0.9, businessScore) };
    }

    // Default to business (safer than generic)
    return { contentType: 'business', primaryFocus: 'professional-analysis', confidence: 0.6 };
  }

  private static calculateKeywordScore(text: string, keywords: string[]): number {
    let score = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.2;
    });
    return Math.min(score, 1.0);
  }
}

export class MockWeb3Service {
  static async storeOnIPFS(data: any): Promise<string> {
    console.log('[MockWeb3] Storing on IPFS...');
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Qm${Math.random().toString(36).substr(2, 32)}`;
  }

  static async storeOnArweave(data: any): Promise<string> {
    console.log('[MockWeb3] Storing on Arweave...');
    await new Promise(resolve => setTimeout(resolve, 500));
    return Math.random().toString(36).substr(2, 32);
  }
}