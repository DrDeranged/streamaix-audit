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

    const summary = isYouTube ?
      `This comprehensive discussion explores how artificial intelligence is fundamentally transforming content creation across digital platforms. The analysis covers three critical areas: automated content generation, intelligent curation systems, and the ethical implications of AI-powered creativity.

      **Key Technical Insights:**
      - Machine learning algorithms are optimizing content for specific audiences in real-time
      - Natural language processing enables automated summarization and content adaptation
      - AI tools are reducing content production time by up to 80% while maintaining quality

      **Creative Amplification vs Replacement:**
      The discussion emphasizes that AI serves as a creative amplifier rather than a replacement for human insight. Current applications range from social media automation to complex video editing workflows, demonstrating efficiency gains that transform hours of work into minutes.

      **Future Implications:**
      The conversation addresses critical questions about authenticity, copyright protection, and the evolving role of creative professionals in an AI-enhanced landscape. The emphasis on responsible development ensures that technological advancement aligns with ethical content creation practices.

      **Industry Applications:**
      Real-world examples showcase AI integration across diverse sectors, from personalized content recommendations to automated video generation, highlighting the technology's broad applicability and transformative potential.` :
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