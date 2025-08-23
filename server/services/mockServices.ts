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
    
    // Extract video ID for better context
    let videoContext = 'general';
    let title = "Content Analysis Video";
    let description = "Professional content analysis and insights.";
    let duration = 1245; // Default 20:45
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Extract video ID from URL for more contextual content
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : '';
      
      // Generate more contextual content based on URL patterns
      if (url.includes('t=')) {
        // Video has timestamp, likely educational/tutorial content
        videoContext = 'educational';
        title = "Advanced Business Strategy & Market Analysis Tutorial";
        description = "In-depth analysis covering market dynamics, strategic positioning, and growth optimization techniques for modern businesses.";
        duration = 847; // 14:07
      } else {
        // Regular video, analyze by common patterns - assume business/crypto content
        videoContext = 'business';
        title = "Cryptocurrency Market Analysis & DeFi Protocol Deep Dive";
        description = "Comprehensive analysis of current crypto market trends, DeFi yield strategies, and blockchain technology developments.";
        duration = 1156; // 19:16
      }
    } else if (url.includes('soundcloud.com')) {
      videoContext = 'podcast';
      title = "Tech Leadership Podcast: Scaling Startups in 2024";
      description = "Discussion with industry leaders about startup challenges, funding strategies, and market positioning.";
      duration = 2847; // 47:27
    } else if (url.includes('twitch.tv')) {
      videoContext = 'livestream';
      title = "Live Trading Analysis & Market Commentary";
      description = "Real-time market analysis with expert commentary on trading strategies and market movements.";
      duration = 3600; // 1 hour
    }
    
    return {
      audioPath: `/tmp/mock-audio-${Date.now()}.mp3`,
      title,
      duration,
      description
    };
  }
}

export class MockAIService {
  static async processContent(audioPath: string, metadata: any): Promise<AIResult> {
    console.log(`[MockAI] Processing audio: ${audioPath}`);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine content type based on title context
    const isCryptoFinance = metadata?.title?.includes('Crypto') || metadata?.title?.includes('DeFi') || metadata?.title?.includes('Market') || metadata?.description?.includes('crypto');
    const isBusiness = metadata?.title?.includes('Business') || metadata?.title?.includes('Strategy') || metadata?.title?.includes('Tutorial');
    
    const transcript = isCryptoFinance ? 
      `Welcome everyone to today's comprehensive cryptocurrency market analysis. I want to start by discussing the current market dynamics we're seeing across the DeFi ecosystem and what this means for both retail and institutional investors.

Looking at the broader market trends, we're witnessing significant shifts in how traditional finance institutions are approaching digital assets. The regulatory clarity we've been waiting for is slowly emerging, and this is creating new opportunities for strategic positioning.

Let's dive into the technical analysis first. Bitcoin's consolidation pattern over the past few weeks suggests we're setting up for a potential breakout. The key resistance levels we're watching are around the $45,000 and $48,000 marks, with support holding strong at $41,000.

Now, when we examine the DeFi protocols, we're seeing some fascinating developments in yield farming strategies. The total value locked across major protocols has increased by 23% this quarter, indicating growing institutional adoption and confidence in decentralized finance mechanisms.

One of the most significant trends we're tracking is the evolution of cross-chain interoperability. Projects that can seamlessly bridge different blockchain networks are positioning themselves for massive growth as the multi-chain future becomes reality.

From a risk management perspective, it's crucial to understand that while we're seeing tremendous opportunities, portfolio diversification across different crypto sectors remains essential. The correlation between traditional markets and crypto assets is still higher than historical norms.

Looking at the regulatory landscape, recent developments suggest a more favorable environment for institutional adoption. This regulatory clarity is removing significant barriers that have prevented large-scale capital allocation into digital assets.` :
      
      isBusiness ?
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

    const summary = isCryptoFinance ?
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

      isBusiness ?
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

    const keyInsights = isCryptoFinance ? [
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
    ] : isBusiness ? [
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

    const chapters = isCryptoFinance ? [
      {
        title: "Market Overview & Technical Analysis",
        startTime: "0:00",
        endTime: "4:30",
        summary: "Bitcoin consolidation patterns and key resistance/support levels analysis."
      },
      {
        title: "DeFi Protocol Developments", 
        startTime: "4:30",
        endTime: "9:15",
        summary: "23% TVL growth analysis and institutional adoption trends in DeFi ecosystem."
      },
      {
        title: "Cross-Chain Interoperability Trends",
        startTime: "9:15", 
        endTime: "14:45",
        summary: "Multi-chain future developments and interoperability project opportunities."
      },
      {
        title: "Risk Management & Portfolio Strategy",
        startTime: "14:45",
        endTime: "18:20", 
        summary: "Diversification strategies and correlation analysis with traditional markets."
      },
      {
        title: "Regulatory Landscape & Institutional Adoption",
        startTime: "18:20",
        endTime: "19:16",
        summary: "Regulatory clarity impact on institutional capital allocation opportunities."
      }
    ] : isBusiness ? [
      {
        title: "Market Positioning Dynamics",
        startTime: "0:00", 
        endTime: "4:00",
        summary: "Adaptive strategies for changing consumer behaviors and market conditions."
      },
      {
        title: "Customer Acquisition Optimization",
        startTime: "4:00",
        endTime: "8:30",
        summary: "Long-term value focus strategies achieving 40% higher retention rates."
      },
      {
        title: "Competitive Analysis Framework",
        startTime: "8:30", 
        endTime: "12:00",
        summary: "Identifying genuine opportunities versus temporary market noise patterns."
      },
      {
        title: "Operational Excellence & Scaling",
        startTime: "12:00",
        endTime: "16:30",
        summary: "Infrastructure investment strategies for sustainable growth and quality maintenance."
      },
      {
        title: "Technology Integration Benefits",
        startTime: "16:30", 
        endTime: "19:16",
        summary: "Automation and analytics providing measurable competitive advantages."
      }
    ] : [
      {
        title: "Digital Strategy Framework",
        startTime: "0:00", 
        endTime: "4:00",
        summary: "Comprehensive digital transformation approaches and performance metrics."
      },
      {
        title: "Audience Engagement Strategies",
        startTime: "4:00",
        endTime: "8:30",
        summary: "Quality-focused engagement approaches outperforming volume-based metrics."
      },
      {
        title: "Brand Positioning Techniques",
        startTime: "8:30", 
        endTime: "12:00",
        summary: "Authentic engagement strategies creating sustainable competitive advantages."
      },
      {
        title: "Performance Measurement Frameworks",
        startTime: "12:00",
        endTime: "16:30",
        summary: "Analytics and optimization tools for competitive advantage development."
      },
      {
        title: "Implementation Strategy",
        startTime: "16:30", 
        endTime: "19:16",
        summary: "Digital transformation success requiring comprehensive strategic approaches."
      }
    ];

    const tags = isCryptoFinance ? 
      ['cryptocurrency', 'defi', 'bitcoin', 'blockchain', 'market-analysis'] :
      isBusiness ?
      ['business-strategy', 'market-analysis', 'customer-acquisition', 'operational-excellence', 'competitive-analysis'] :
      ['digital-strategy', 'content-marketing', 'brand-positioning', 'audience-engagement', 'digital-transformation'];

    // Generate additional comprehensive data for the tabbed interface
    const tldrSummary = isCryptoFinance ?
      "Comprehensive cryptocurrency market analysis covering Bitcoin's technical patterns, DeFi protocol growth (23% TVL increase), cross-chain interoperability trends, and regulatory developments creating institutional adoption opportunities. Key focus on risk management and portfolio diversification strategies." :
      isBusiness ?
      "Advanced business strategy tutorial covering market positioning dynamics, customer acquisition optimization (40% higher retention rates), competitive analysis frameworks, unit economics modeling, and technology integration for operational excellence and sustainable competitive advantages." :
      "Digital content strategy analysis focusing on audience engagement optimization, brand positioning techniques, and performance measurement frameworks. Market data shows 67% better performance for comprehensive digital strategy implementations.";

    const blogPost = summary; // Use the comprehensive summary as the blog post
    
    const marketAnalysis = isCryptoFinance ?
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
      
      isBusiness ?
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
      title: isCryptoFinance ? "Cryptocurrency Market Analysis & DeFi Protocol Deep Dive" : 
             isBusiness ? "Advanced Business Strategy & Market Analysis Tutorial" : 
             "Digital Content Strategy & Market Positioning",
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