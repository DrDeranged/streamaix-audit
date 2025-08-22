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
    
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const title = isYouTube ? 
      "How AI is Revolutionizing Content Creation" : 
      "The Future of Decentralized Applications";
    
    return {
      audioPath: `/tmp/mock-audio-${Date.now()}.mp3`,
      title,
      duration: 1245, // 20:45
      description: "A comprehensive discussion about emerging technologies and their impact on digital transformation."
    };
  }
}

export class MockAIService {
  static async processContent(audioPath: string, metadata: any): Promise<AIResult> {
    console.log(`[MockAI] Processing audio: ${audioPath}`);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isYouTube = metadata?.title?.includes('AI') || Math.random() > 0.5;
    
    const transcript = isYouTube ? 
      `Welcome to today's discussion about artificial intelligence and its transformative impact on content creation. 

      In this comprehensive analysis, we'll explore how AI is revolutionizing the way we produce, consume, and interact with digital content. From automated video generation to intelligent content curation, AI is reshaping every aspect of the creative process.

      The key areas we'll cover include machine learning algorithms for content optimization, natural language processing for automated summarization, and the ethical considerations surrounding AI-generated content.

      As we move forward, it's important to understand that AI doesn't replace human creativity - it amplifies it. The tools we're seeing today represent just the beginning of a new era where human insight combines with machine intelligence to create unprecedented possibilities.

      Looking at current trends in content creation, we see AI being used for everything from social media scheduling to complex video editing workflows. The efficiency gains are remarkable - what once took hours can now be accomplished in minutes.

      However, with great power comes great responsibility. We must carefully consider the implications of AI-generated content on authenticity, copyright, and the future of creative professions.` :
      `Today we're diving deep into the world of decentralized applications and blockchain technology.

      Decentralized applications, or DApps, represent a fundamental shift in how we think about software architecture. Unlike traditional applications that rely on centralized servers, DApps operate on blockchain networks, providing unprecedented transparency and security.

      The key benefits of decentralized systems include resistance to censorship, elimination of single points of failure, and true data ownership for users. These advantages are driving adoption across industries from finance to social media.

      Smart contracts form the backbone of most DApps, enabling automated execution of agreements without intermediaries. This programmable money concept is revolutionizing everything from lending protocols to prediction markets.

      We're also seeing exciting developments in cross-chain interoperability, allowing different blockchain networks to communicate and share value. This is crucial for the future scalability of the decentralized ecosystem.

      The challenges remain significant - user experience, scalability, and regulatory uncertainty are major hurdles that the industry continues to address through innovative solutions and thoughtful design patterns.`;

    // Generate structured content with the requested format
    const rawData = isYouTube ? {
      title: "How AI is Revolutionizing Content Creation",
      source: "YouTube Video Analysis",
      duration: "20:45",
      platform: "YouTube",
      quality: "High-definition analysis"
    } : {
      title: "The Future of Decentralized Applications", 
      source: "Blockchain Podcast Analysis",
      duration: "20:45", 
      platform: "Podcast",
      quality: "Professional audio analysis"
    };

    const tldr = isYouTube ?
      "AI is transforming content creation by reducing production time by 80% while maintaining quality. Machine learning optimizes content in real-time, and ethical considerations around authenticity are becoming critical as AI amplifies rather than replaces human creativity." :
      "Decentralized applications are revolutionizing software architecture through smart contracts and blockchain technology. Cross-chain interoperability is crucial for scalability, but user experience complexity remains the primary adoption barrier.";

    const blogSummary = isYouTube ?
      `# The AI Content Creation Revolution: Efficiency Meets Ethics

## Executive Summary
Artificial intelligence is fundamentally reshaping how we create, consume, and interact with digital content. This analysis reveals three critical transformation areas: automated generation systems, intelligent curation platforms, and the emerging ethical framework governing AI-powered creativity.

## Key Performance Metrics
- **Production Efficiency**: 80% reduction in content creation time
- **Quality Maintenance**: Consistent output standards across automated workflows  
- **Real-time Optimization**: Machine learning algorithms adapt content for specific audiences instantly
- **Workflow Integration**: Seamless embedding in existing creative processes

## Creative Amplification Strategy
The evidence suggests AI functions as a creative amplifier rather than a replacement mechanism. Current implementations span from automated social media scheduling to complex video editing workflows, demonstrating measurable efficiency gains that convert hours of manual work into minutes of AI-assisted production.

## Industry Impact Analysis
Real-world deployments showcase successful AI integration across diverse sectors:
- **Personalized Recommendations**: Content curation systems learning user preferences
- **Automated Video Generation**: AI-powered creation tools for marketing and education
- **Content Adaptation**: Intelligent summarization and format optimization
- **Creative Workflow Enhancement**: Tools that augment human insight with machine intelligence

## Ethical Framework Considerations
The analysis addresses critical questions surrounding authenticity verification, copyright protection protocols, and the evolving professional landscape for creative workers. The emphasis on responsible development ensures technological advancement aligns with ethical content creation standards.

## Future Outlook
This transformation represents the beginning of a new era where human creativity combines with machine intelligence to create unprecedented possibilities in content creation and distribution.` :
      `# Decentralized Applications: The Blockchain Architecture Revolution

## Executive Summary  
Decentralized applications represent a fundamental paradigm shift from centralized to distributed software architecture, offering unprecedented transparency, security, and user data ownership through blockchain technology integration.

## Core Technical Architecture
DApps operate on blockchain networks, eliminating single points of failure while providing complete transaction transparency. Smart contracts serve as programmable foundations, enabling automated agreement execution without traditional intermediary dependencies.

## Revolutionary Benefits Analysis
- **Censorship Resistance**: Distributed infrastructure prevents centralized control
- **Data Sovereignty**: Users maintain complete ownership of their digital assets
- **System Reliability**: No centralized vulnerabilities or scheduled downtime
- **Programmable Finance**: Smart contracts enable innovative financial instruments

## Cross-Chain Innovation Framework
Breakthrough developments in blockchain interoperability allow different networks to communicate and share value seamlessly. This technological advancement addresses critical scalability limitations and enables broader ecosystem adoption.

## Implementation Challenge Matrix
Current barriers include:
- **User Experience Complexity**: Technical knowledge requirements limit mainstream adoption
- **Network Scalability**: Transaction throughput limitations across blockchain networks  
- **Regulatory Uncertainty**: Evolving legal frameworks impact development strategies
- **Energy Consumption**: Environmental concerns around blockchain consensus mechanisms

## Market Application Case Studies
Successful DApp implementations demonstrate versatility across multiple industries:
- **Decentralized Finance**: Lending protocols and automated market makers
- **Social Platforms**: Censorship-resistant communication networks
- **Prediction Markets**: Decentralized forecasting and betting systems
- **Digital Asset Management**: NFT marketplaces and tokenized assets

## Strategic Development Outlook
Industry leaders are addressing current limitations through innovative design patterns, improved user interfaces, and regulatory compliance frameworks, positioning DApps for mainstream enterprise adoption.`;

    const marketAnalysis = isYouTube ?
      `## Market Intelligence: AI Content Creation Opportunities

### Current Market Positioning
The AI content creation sector is experiencing explosive growth with 80% efficiency improvements creating significant competitive advantages. Companies implementing AI-powered workflows are capturing market share through faster production cycles and reduced operational costs.

### Investment Landscape
- **Venture Capital Focus**: $2.3B invested in AI content tools in 2024
- **Enterprise Adoption**: 67% of Fortune 500 companies integrating AI content systems
- **Creator Economy Impact**: Individual creators seeing 300% productivity increases

### Strategic Opportunities
1. **Content Automation Services**: High-demand market for AI-powered content generation
2. **Ethical AI Development**: Companies addressing authenticity concerns gaining trust
3. **Workflow Integration Tools**: Solutions bridging human creativity and AI efficiency
4. **Copyright Protection Systems**: Technology addressing intellectual property concerns

### Competitive Advantage Indicators
Organizations leading this transformation demonstrate measurable ROI through reduced production costs, increased content volume, and improved audience engagement metrics.

### Risk Assessment
Primary concerns include authenticity verification, creative job displacement, and regulatory compliance requirements that may impact rapid scaling strategies.

### Market Recommendation
**High Growth Potential**: AI content creation represents a transformative market opportunity with established demand, proven efficiency gains, and expanding enterprise adoption patterns.` :
      `## Market Intelligence: Decentralized Application Investment Outlook

### Sector Analysis
The DApp ecosystem is transitioning from experimental technology to enterprise-ready solutions. Cross-chain interoperability developments are removing critical scalability barriers, creating new investment opportunities across multiple blockchain networks.

### Market Penetration Metrics
- **Total Value Locked**: $47B across DeFi protocols in 2024
- **User Adoption**: 156% year-over-year growth in active DApp users
- **Enterprise Integration**: 23% of financial institutions exploring DApp implementations

### Investment Categories
1. **Infrastructure Solutions**: Layer 2 scaling solutions showing 400% growth
2. **User Experience Tools**: Simplified DApp interfaces capturing mainstream users
3. **Cross-Chain Protocols**: Interoperability solutions commanding premium valuations
4. **Regulatory Compliance**: Legal framework tools for enterprise DApp deployment

### Competitive Landscape
First-mover advantages exist in sectors addressing current limitations: user experience complexity, transaction costs, and regulatory uncertainty. Companies solving these challenges are attracting significant institutional investment.

### Growth Catalysts
- **Regulatory Clarity**: Government framework development increasing institutional confidence
- **Technical Improvements**: Layer 2 solutions reducing transaction costs by 95%
- **Enterprise Adoption**: Corporate blockchain strategies driving DApp demand

### Market Recommendation  
**Emerging High-Value Sector**: DApps represent a maturing technology with proven utility, growing institutional adoption, and significant infrastructure investment supporting long-term growth potential.`;

    const summary = `${blogSummary}

## Raw Data Analysis
${JSON.stringify(rawData, null, 2)}

## TLDR
${tldr}

## Market Intelligence Assessment
${marketAnalysis}`;
      `This in-depth exploration of decentralized applications reveals how blockchain technology is reshaping software architecture and user relationships with digital platforms. The discussion covers fundamental shifts from centralized to distributed systems, emphasizing user sovereignty and data ownership.

      **Core Technical Architecture:**
      Decentralized applications operate on blockchain networks, eliminating single points of failure while providing unprecedented transparency. Smart contracts serve as the programmable backbone, enabling automated agreement execution without traditional intermediaries.

      **Revolutionary Benefits:**
      - Censorship resistance through distributed infrastructure
      - True data ownership returning control to users  
      - Elimination of centralized vulnerabilities and downtime risks
      - Programmable money enabling innovative financial instruments

      **Cross-Chain Innovation:**
      The analysis highlights breakthrough developments in blockchain interoperability, allowing different networks to communicate and share value. This technological advancement is crucial for ecosystem scalability and broader adoption.

      **Implementation Challenges:**
      Current hurdles include user experience complexity, network scalability limitations, and evolving regulatory frameworks. The discussion outlines how industry leaders are addressing these challenges through innovative design patterns and thoughtful technical solutions.

      **Market Applications:**
      Real-world case studies demonstrate DApp success across finance, social media, and prediction markets, showcasing the technology's versatility and growing mainstream adoption potential.`;

    const keyInsights = isYouTube ? [
      {
        insight: "AI reduces content production time by 80% while maintaining quality standards",
        timestamp: "3:45",
        importance: 'high' as const
      },
      {
        insight: "Machine learning algorithms optimize content for specific audiences in real-time",
        timestamp: "7:22", 
        importance: 'high' as const
      },
      {
        insight: "Ethical considerations around authenticity and copyright are becoming critical",
        timestamp: "12:15",
        importance: 'high' as const
      }
    ] : [
      {
        insight: "Smart contracts eliminate intermediaries while enabling programmable money",
        timestamp: "4:12",
        importance: 'high' as const
      },
      {
        insight: "Cross-chain interoperability is crucial for decentralized ecosystem scalability",
        timestamp: "8:34",
        importance: 'high' as const
      },
      {
        insight: "User experience complexity remains the primary adoption barrier",
        timestamp: "14:56",
        importance: 'medium' as const
      }
    ];

    const chapters = isYouTube ? [
      {
        title: "Introduction to AI Content Creation",
        startTime: "0:00",
        endTime: "3:30",
        summary: "Overview of AI's role in transforming digital content production and consumption patterns."
      },
      {
        title: "Machine Learning for Content Optimization", 
        startTime: "3:30",
        endTime: "8:15",
        summary: "Deep dive into algorithms that automatically optimize content for target audiences."
      },
      {
        title: "Natural Language Processing Applications",
        startTime: "8:15", 
        endTime: "13:45",
        summary: "Exploration of NLP technologies enabling automated summarization and content adaptation."
      },
      {
        title: "Creative Amplification vs Replacement",
        startTime: "13:45",
        endTime: "18:20", 
        summary: "Analysis of how AI enhances rather than replaces human creativity and insight."
      },
      {
        title: "Ethical Considerations and Future Outlook",
        startTime: "18:20",
        endTime: "20:45",
        summary: "Discussion of responsible AI development and implications for creative industries."
      }
    ] : [
      {
        title: "Decentralized Applications Overview",
        startTime: "0:00", 
        endTime: "4:00",
        summary: "Introduction to DApps and fundamental differences from centralized systems."
      },
      {
        title: "Smart Contract Architecture",
        startTime: "4:00",
        endTime: "9:30",
        summary: "Technical exploration of smart contracts as the backbone of decentralized systems."
      },
      {
        title: "Cross-Chain Interoperability",
        startTime: "9:30", 
        endTime: "15:00",
        summary: "Analysis of blockchain communication protocols and value sharing mechanisms."
      },
      {
        title: "Implementation Challenges",
        startTime: "15:00",
        endTime: "18:30",
        summary: "Discussion of scalability, UX, and regulatory hurdles facing DApp adoption."
      },
      {
        title: "Real-World Applications",
        startTime: "18:30", 
        endTime: "20:45",
        summary: "Case studies of successful DApp implementations across various industries."
      }
    ];

    const tags = isYouTube ? 
      ['artificial-intelligence', 'content-creation', 'machine-learning', 'automation', 'digital-transformation'] :
      ['blockchain', 'decentralization', 'smart-contracts', 'web3', 'cryptocurrency'];

    return {
      transcript,
      summary, 
      keyInsights,
      chapters,
      tags,
      duration: 1245,
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