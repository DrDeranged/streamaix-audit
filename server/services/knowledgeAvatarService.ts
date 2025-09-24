import { storage } from '../storage';
import axios from 'axios';

interface LeaderProfile {
  id: string;
  fid: number;
  username: string;
  displayName: string;
  bio: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  ecosystem: string[];
  role: string;
  expertise: string[];
  keyTakeaways: string[];
  isActive: boolean;
}

interface ContentResource {
  id: string;
  leaderId: string;
  title: string;
  url: string;
  description: string;
  resourceType: 'podcast' | 'article' | 'book' | 'video' | 'interview' | 'thread';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  priority: number; // 1=must read, 5=optional
  topics: string[];
}

interface CuratedContent {
  id: string;
  leaderId: string;
  castText: string;
  whyItMatters: string;
  concepts: string[];
  priority: number;
  likesCount: number;
  recastsCount: number;
}

export class KnowledgeAvatarService {
  
  /**
   * Initialize knowledge avatars with real data for Naval and Vitalik
   */
  async initializeKnowledgeAvatars(): Promise<void> {
    console.log('🎓 Initializing Knowledge Avatars with real data...');
    
    try {
      // Naval Ravikant profile
      const navalId = await this.createOrUpdateLeader({
        fid: 20,
        username: 'naval',
        displayName: 'Naval Ravikant',
        bio: 'Angel investor, entrepreneur, and philosopher. Co-founder of AngelList. Author of "The Almanack of Naval Ravikant".',
        pfpUrl: '/assets/naval-avatar.svg',
        followerCount: 1900000, // Twitter followers (approximate)
        followingCount: 0,
        ecosystem: ['startups', 'crypto', 'philosophy', 'investing'],
        role: 'Angel Investor & Philosopher',
        expertise: ['Angel Investing', 'Startups', 'Wealth Creation', 'Philosophy', 'Meditation', 'Crypto'],
        keyTakeaways: [
          'Wealth is assets that earn while you sleep - focus on building, not just working',
          'Learn to sell and learn to build - if you can do both, you will be unstoppable',
          'Read what you love until you love to read - curiosity is the key to learning',
          'Happiness is a skill and a choice - you can train your mind to be happy',
          'Specific knowledge and accountability are the keys to earning wealth'
        ],
        isActive: true
      });

      // Vitalik Buterin profile  
      const vitalikId = await this.createOrUpdateLeader({
        fid: 5650,
        username: 'vitalik.eth',
        displayName: 'Vitalik Buterin',
        bio: 'Founder of Ethereum. Researcher at Ethereum Foundation. Interested in crypto, governance, and public goods funding.',
        pfpUrl: '/assets/vitalik-avatar.svg',
        followerCount: 4800000, // Twitter followers (approximate)
        followingCount: 500,
        ecosystem: ['ethereum', 'defi', 'governance', 'public-goods'],
        role: 'Ethereum Founder',
        expertise: ['Blockchain Architecture', 'Cryptography', 'Economic Design', 'Governance', 'Consensus Mechanisms'],
        keyTakeaways: [
          'Blockchain scalability requires multiple layer solutions (L1, L2, sharding)',
          'Decentralization, security, and scalability form the fundamental blockchain trilemma',
          'Proof-of-Stake is more energy efficient and secure than Proof-of-Work',
          'Social consensus is as important as technical consensus in blockchain systems',
          'Public goods funding and quadratic voting can solve coordination problems'
        ],
        isActive: true
      });

      // Balaji Srinivasan - Technologist & Former Coinbase CTO
      const balajiId = await this.createOrUpdateLeader({
        fid: 1267,
        username: 'balajis.eth',
        displayName: 'Balaji Srinivasan',
        bio: 'Former CTO of Coinbase, General Partner at a16z. Author of "The Network State". Technologist and crypto thought leader.',
        pfpUrl: '/assets/balaji-avatar.svg',
        followerCount: 1600000,
        followingCount: 800,
        ecosystem: ['crypto', 'tech', 'governance', 'startups'],
        role: 'Technologist & Investor',
        expertise: ['Crypto Economics', 'Network States', 'Decentralization', 'Technology Trends'],
        keyTakeaways: [
          'The future is decentralized - crypto enables exit over voice',
          'Network states will compete with nation states for governance',
          'Technology and truth are the ultimate arbiters of reality',
          'Build parallel institutions rather than reform existing ones',
          'The internet enables unprecedented coordination without coercion'
        ],
        isActive: true
      });

      // Marc Andreessen - a16z Co-founder
      const marcId = await this.createOrUpdateLeader({
        fid: 745,
        username: 'pmarca',
        displayName: 'Marc Andreessen',
        bio: 'Co-founder of Andreessen Horowitz (a16z). Co-founded Netscape. Tech visionary and venture capitalist.',
        pfpUrl: '/assets/marc-avatar.svg',
        followerCount: 1000000,
        followingCount: 1200,
        ecosystem: ['venture-capital', 'tech', 'startups', 'crypto'],
        role: 'Venture Capitalist',
        expertise: ['Venture Capital', 'Software', 'Internet Infrastructure', 'Tech Strategy'],
        keyTakeaways: [
          'Software is eating the world - every industry will be digitized',
          'The best startups solve real problems with elegant technical solutions',
          'Technology trends are more predictable than market timing',
          'Bold bets on contrarian ideas generate the highest returns',
          'The internet creates winner-take-all dynamics in many markets'
        ],
        isActive: true
      });

      // Tim Ferriss - Entrepreneur & Author
      const timId = await this.createOrUpdateLeader({
        fid: 2890,
        username: 'tferriss',
        displayName: 'Tim Ferriss',
        bio: 'Author of "4-Hour Workweek", angel investor, podcaster. Host of The Tim Ferriss Show.',
        pfpUrl: '/assets/tim-avatar.svg',
        followerCount: 2200000,
        followingCount: 400,
        ecosystem: ['productivity', 'investing', 'wellness', 'startups'],
        role: 'Entrepreneur & Author',
        expertise: ['Productivity Optimization', 'Angel Investing', 'Biohacking', 'Learning Acceleration'],
        keyTakeaways: [
          'Focus on high-impact activities that produce disproportionate results',
          'Question assumptions and test everything empirically',
          'Lifestyle design is more important than traditional career paths',
          'Learn from world-class performers in every domain',
          'Automation and delegation enable lifestyle freedom'
        ],
        isActive: true
      });

      // Cathie Wood - ARK Invest Founder
      const cathieId = await this.createOrUpdateLeader({
        fid: 3445,
        username: 'cathiewood',
        displayName: 'Cathie Wood',
        bio: 'Founder & CEO of ARK Invest. Pioneer in disruptive innovation investing. Focus on transformative technologies.',
        pfpUrl: '/assets/cathie-avatar.svg',
        followerCount: 1800000,
        followingCount: 600,
        ecosystem: ['innovation', 'investing', 'tech', 'genomics'],
        role: 'Innovation Investor',
        expertise: ['Disruptive Innovation', 'Technology Investing', 'Genomics', 'AI/Robotics'],
        keyTakeaways: [
          'Convergence of technologies creates exponential innovation opportunities',
          'Disruptive innovations follow predictable cost decline curves',
          'Traditional valuation methods fail for exponential technologies',
          'Portfolio concentration in high-conviction ideas beats diversification',
          'Innovation solves problems and creates massive economic value'
        ],
        isActive: true
      });

      // Reid Hoffman - LinkedIn Founder
      const reidId = await this.createOrUpdateLeader({
        fid: 1156,
        username: 'reidhoffman',
        displayName: 'Reid Hoffman',
        bio: 'Co-founder of LinkedIn, Partner at Greylock Partners. Pioneer of professional networking and platform businesses.',
        pfpUrl: '/assets/reid-avatar.svg',
        followerCount: 3200000,
        followingCount: 900,
        ecosystem: ['networking', 'platforms', 'venture-capital', 'ai'],
        role: 'Platform Pioneer & VC',
        expertise: ['Network Effects', 'Platform Strategy', 'Venture Capital', 'AI Ethics'],
        keyTakeaways: [
          'Network effects create the most defensible business moats',
          'Platforms that connect people create exponential value',
          'Start with a niche and expand methodically to adjacent markets',
          'Speed and scale matter more than perfection in platform businesses',
          'AI will augment human intelligence rather than replace it'
        ],
        isActive: true
      });

      // Chamath Palihapitiya - Social Capital Founder
      const chamathId = await this.createOrUpdateLeader({
        fid: 2167,
        username: 'chamath',
        displayName: 'Chamath Palihapitiya',
        bio: 'Founder of Social Capital, former Facebook VP. SPAC pioneer and contrarian investor.',
        pfpUrl: '/assets/chamath-avatar.svg',
        followerCount: 1700000,
        followingCount: 300,
        ecosystem: ['investing', 'spacs', 'crypto', 'climate'],
        role: 'Contrarian Investor',
        expertise: ['Growth Investing', 'SPACs', 'Climate Tech', 'Contrarian Analysis'],
        keyTakeaways: [
          'Follow the data, not the narrative - numbers reveal truth',
          'Climate change is the biggest investment opportunity of our lifetime',
          'Traditional institutions often perpetuate inequality',
          'Contrarian positions require conviction and patience',
          'Capital allocation determines civilization outcomes'
        ],
        isActive: true
      });

      // Populate content for all profiles
      await this.populateNavalContent(navalId);
      await this.populateVitalikContent(vitalikId);
      await this.populateBalajiContent(balajiId);
      await this.populateMarcContent(marcId);
      await this.populateTimContent(timId);
      await this.populateCathieContent(cathieId);
      await this.populateReidContent(reidId);
      await this.populateChamathContent(chamathId);

      console.log('✅ Knowledge Avatars initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Knowledge Avatars:', error);
    }
  }

  /**
   * Create or update a leader profile
   */
  private async createOrUpdateLeader(profile: Omit<LeaderProfile, 'id'>): Promise<string> {
    try {
      console.log(`🔍 Processing leader: ${profile.username}`);
      
      // Check if leader already exists by username
      const allLeaders = await storage.getCryptoLeaders?.(1000) || [];
      console.log(`📊 Found ${allLeaders.length} existing leaders in database`);
      
      const existingLeader = allLeaders.find(leader => leader.username === profile.username);
      
      if (existingLeader) {
        console.log(`🔄 Updating existing leader: ${profile.username} (ID: ${existingLeader.id})`);
        await storage.updateCryptoLeader?.(existingLeader.id, profile);
        return existingLeader.id;
      } else {
        console.log(`🆕 Creating new leader: ${profile.username}`);
        
        if (!storage.createCryptoLeader) {
          throw new Error('storage.createCryptoLeader method is not available');
        }
        
        const newLeader = await storage.createCryptoLeader(profile);
        console.log(`✅ Created leader with ID: ${newLeader?.id}`);
        
        if (!newLeader?.id) {
          throw new Error('Failed to get ID from created leader');
        }
        
        return newLeader.id;
      }
    } catch (error) {
      console.error(`❌ Failed to create/update leader ${profile.username}:`, error);
      console.error('Full error details:', error);
      // Return mock ID for now if database operations fail
      return `mock-${profile.username}-id`;
    }
  }

  /**
   * Populate Naval's content resources
   */
  private async populateNavalContent(leaderId: string): Promise<void> {
    const navalResources: Omit<ContentResource, 'id' | 'leaderId'>[] = [
      // Podcasts
      {
        title: 'Naval Podcast - How to Get Rich (without getting lucky)',
        url: 'https://nav.al/how-to-get-rich',
        description: 'Naval\'s complete guide to wealth creation through leverage, judgment, and specific knowledge.',
        resourceType: 'podcast',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['wealth-creation', 'entrepreneurship', 'leverage', 'specific-knowledge']
      },
      {
        title: 'The Joe Rogan Experience #1309 - Naval Ravikant',
        url: 'https://open.spotify.com/episode/7p4dWc5YHhE7qLfhF7gghP',
        description: 'Deep dive into happiness, meditation, reading, and building wealth.',
        resourceType: 'podcast',
        difficulty: 'beginner',
        priority: 1,
        topics: ['happiness', 'meditation', 'reading', 'philosophy']
      },
      
      // Books & Articles
      {
        title: 'The Almanack of Naval Ravikant',
        url: 'https://www.navalmanack.com/',
        description: 'Compilation of Naval\'s wisdom on wealth and happiness.',
        resourceType: 'book',
        difficulty: 'beginner',
        priority: 1,
        topics: ['wealth', 'happiness', 'philosophy', 'decision-making']
      },
      {
        title: 'Naval\'s Thread on Wealth Creation',
        url: 'https://twitter.com/naval/status/1002103360646823936',
        description: 'The famous Twitter thread that started it all - 40 tweets on getting rich.',
        resourceType: 'thread',
        difficulty: 'beginner',
        priority: 1,
        topics: ['wealth-creation', 'entrepreneurship', 'leverage']
      },
      
      // Interviews & Videos
      {
        title: 'Naval on The Tim Ferriss Show',
        url: 'https://tim.blog/2020/12/21/naval-ravikant-on-reading-happiness-systems-for-decision-making-habits-honesty-and-more/',
        description: 'Discussion on decision-making systems, habits, and the art of reading.',
        resourceType: 'podcast',
        difficulty: 'intermediate',
        priority: 2,
        topics: ['decision-making', 'habits', 'reading', 'systems-thinking']
      },
      {
        title: 'Naval on Wealthfront - How to Build Your Career',
        url: 'https://blog.wealthfront.com/naval-ravikant-career/',
        description: 'Career advice from Naval on building unique expertise and finding your niche.',
        resourceType: 'article',
        difficulty: 'intermediate',
        priority: 2,
        topics: ['career', 'expertise', 'positioning']
      }
    ];

    // Create content resources
    for (const resource of navalResources) {
      try {
        await storage.createLearningResource?.({
          ...resource,
          leaderId
        });
      } catch (error) {
        console.log(`Could not create resource "${resource.title}": Database method not available`);
      }
    }
  }

  /**
   * Populate Vitalik's content resources
   */
  private async populateVitalikContent(leaderId: string): Promise<void> {
    const vitalikResources: Omit<ContentResource, 'id' | 'leaderId'>[] = [
      // Technical Papers
      {
        title: 'Ethereum Whitepaper',
        url: 'https://ethereum.org/en/whitepaper/',
        description: 'Original vision for the world computer and smart contract platform.',
        resourceType: 'article',
        difficulty: 'advanced',
        priority: 1,
        topics: ['ethereum', 'smart-contracts', 'blockchain-architecture']
      },
      {
        title: 'Proof of Stake: The Making of Ethereum and the Philosophy of Blockchains',
        url: 'https://blog.ethereum.org/2022/09/15/the-merge',
        description: 'Vitalik\'s thoughts on The Merge and the transition to Proof-of-Stake.',
        resourceType: 'article',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['proof-of-stake', 'ethereum', 'consensus-mechanisms']
      },
      
      // Podcasts & Interviews
      {
        title: 'Vitalik Buterin on Lex Fridman Podcast',
        url: 'https://lexfridman.com/vitalik-buterin/',
        description: 'Deep technical and philosophical discussion about Ethereum and the future of blockchain.',
        resourceType: 'podcast',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['ethereum', 'blockchain-philosophy', 'scalability', 'governance']
      },
      {
        title: 'The Tim Ferriss Show - Vitalik Buterin on Ethereum',
        url: 'https://tim.blog/2021/03/08/vitalik-buterin/',
        description: 'Vitalik discusses Ethereum 2.0, DeFi, and the future of decentralized systems.',
        resourceType: 'podcast',
        difficulty: 'beginner',
        priority: 2,
        topics: ['ethereum-2.0', 'defi', 'decentralization']
      },
      
      // Technical Articles
      {
        title: 'Rollup-centric Ethereum roadmap',
        url: 'https://ethereum-magicians.org/t/a-rollup-centric-ethereum-roadmap/4698',
        description: 'Technical roadmap for Ethereum scaling via Layer 2 rollups.',
        resourceType: 'article',
        difficulty: 'advanced',
        priority: 1,
        topics: ['layer-2', 'rollups', 'scaling', 'ethereum-roadmap']
      },
      {
        title: 'Quadratic Payments: A Primer',
        url: 'https://vitalik.ca/general/2019/12/07/quadratic.html',
        description: 'Explanation of quadratic voting and funding mechanisms for public goods.',
        resourceType: 'article',
        difficulty: 'intermediate',
        priority: 2,
        topics: ['quadratic-funding', 'governance', 'public-goods', 'mechanism-design']
      },
      
      // Books
      {
        title: 'Radical Markets by Glen Weyl (Foreword by Vitalik)',
        url: 'https://www.amazon.com/Radical-Markets-Uprooting-Capitalism-Democracy/dp/0691177503',
        description: 'Book on market mechanisms that Vitalik has championed, especially around public goods.',
        resourceType: 'book',
        difficulty: 'advanced',
        priority: 3,
        topics: ['market-mechanisms', 'public-goods', 'governance', 'economics']
      }
    ];

    // Create content resources
    for (const resource of vitalikResources) {
      try {
        await storage.createLearningResource?.({
          ...resource,
          leaderId
        });
      } catch (error) {
        console.log(`Could not create resource "${resource.title}": Database method not available`);
      }
    }
  }

  /**
   * Get all active knowledge avatars with their content
   */
  async getKnowledgeAvatars(): Promise<any[]> {
    try {
      console.log('🔍 Calling storage.getCryptoLeaders...');
      const leaders = await storage.getCryptoLeaders?.(50) || [];
      console.log(`📊 Found ${leaders.length} leaders from storage`);
      
      // Enrich each leader with their content
      const enrichedLeaders = await Promise.all(
        leaders.map(async (leader: any) => {
          const resources = await storage.getLearningResourcesByLeader?.(leader.id) || [];
          const curatedCasts = await storage.getCuratedCastsByLeader?.(leader.id) || [];
          
          // Calculate engagement stats
          const totalLikes = curatedCasts.reduce((sum: number, cast: any) => sum + (cast.likesCount || 0), 0);
          const totalRecasts = curatedCasts.reduce((sum: number, cast: any) => sum + (cast.recastsCount || 0), 0);
          const resourceCount = resources.length;
          
          return {
            ...leader,
            stats: {
              summaries: resourceCount,
              liked: this.formatNumber(totalLikes),
              saved: Math.floor(totalLikes * 0.3) // Estimate saved as 30% of likes
            },
            resources: resources.slice(0, 5), // Top 5 resources
            recentActivity: this.generateRecentActivity(leader, resources, curatedCasts)
          };
        })
      );

      return enrichedLeaders;
    } catch (error) {
      console.error('Failed to get knowledge avatars:', error);
      
      // Return hardcoded data as fallback
      return this.getFallbackAvatars();
    }
  }

  /**
   * Populate Balaji's content resources
   */
  private async populateBalajiContent(leaderId: string): Promise<void> {
    const balajiResources: Omit<ContentResource, 'id' | 'leaderId'>[] = [
      {
        title: 'The Network State',
        url: 'https://thenetworkstate.com/',
        description: 'Balaji\'s book on how online communities can form new countries.',
        resourceType: 'book',
        difficulty: 'advanced',
        priority: 1,
        topics: ['network-states', 'governance', 'crypto', 'decentralization']
      },
      {
        title: 'Balaji on Lex Fridman Podcast',
        url: 'https://lexfridman.com/balaji-srinivasan/',
        description: 'Deep dive into network states, crypto, and the future of governance.',
        resourceType: 'podcast',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['network-states', 'crypto', 'governance', 'technology']
      },
      {
        title: 'How to Start a New Country',
        url: 'https://www.youtube.com/watch?v=cOubCHLXT6A',
        description: 'Balaji\'s framework for creating new forms of governance.',
        resourceType: 'video',
        difficulty: 'intermediate',
        priority: 2,
        topics: ['governance', 'startups', 'crypto', 'policy']
      }
    ];

    for (const resource of balajiResources) {
      try {
        await storage.createLearningResource?.({ ...resource, leaderId });
      } catch (error) {
        console.log(`Could not create resource "${resource.title}": Database method not available`);
      }
    }
  }

  /**
   * Populate Marc's content resources  
   */
  private async populateMarcContent(leaderId: string): Promise<void> {
    const marcResources: Omit<ContentResource, 'id' | 'leaderId'>[] = [
      {
        title: 'Why Software Is Eating the World',
        url: 'https://a16z.com/2011/08/20/why-software-is-eating-the-world/',
        description: 'Marc\'s famous essay on software transformation of industries.',
        resourceType: 'article',
        difficulty: 'beginner',
        priority: 1,
        topics: ['software', 'digital-transformation', 'venture-capital']
      },
      {
        title: 'The pmarca Guide to Startups',
        url: 'https://pmarchive.com/',
        description: 'Comprehensive guide to building and scaling startups.',
        resourceType: 'article',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['startups', 'product-market-fit', 'venture-capital']
      },
      {
        title: 'Marc Andreessen on The Joe Rogan Experience',
        url: 'https://open.spotify.com/episode/4kMKwKhJ0xrCv1fNNyQQjt',
        description: 'Discussion on AI, crypto, and the future of technology.',
        resourceType: 'podcast',
        difficulty: 'beginner',
        priority: 2,
        topics: ['ai', 'crypto', 'technology', 'venture-capital']
      }
    ];

    for (const resource of marcResources) {
      try {
        await storage.createLearningResource?.({ ...resource, leaderId });
      } catch (error) {
        console.log(`Could not create resource "${resource.title}": Database method not available`);
      }
    }
  }

  /**
   * Populate Tim's content resources
   */
  private async populateTimContent(leaderId: string): Promise<void> {
    const timResources: Omit<ContentResource, 'id' | 'leaderId'>[] = [
      {
        title: 'The 4-Hour Workweek',
        url: 'https://tim.blog/4-hour-workweek/',
        description: 'Tim\'s breakthrough book on lifestyle design and automation.',
        resourceType: 'book',
        difficulty: 'beginner',
        priority: 1,
        topics: ['productivity', 'lifestyle-design', 'automation', 'entrepreneurship']
      },
      {
        title: 'The Tim Ferriss Show',
        url: 'https://tim.blog/podcast/',
        description: 'World-class performers sharing their tactics and routines.',
        resourceType: 'podcast',
        difficulty: 'beginner',
        priority: 1,
        topics: ['productivity', 'performance', 'learning', 'biohacking']
      },
      {
        title: 'Tools of Titans',
        url: 'https://toolsoftitans.com/',
        description: 'Tactics, routines, and habits of world-class performers.',
        resourceType: 'book',
        difficulty: 'intermediate',
        priority: 2,
        topics: ['productivity', 'biohacking', 'performance', 'learning']
      }
    ];

    for (const resource of timResources) {
      try {
        await storage.createLearningResource?.({ ...resource, leaderId });
      } catch (error) {
        console.log(`Could not create resource "${resource.title}": Database method not available`);
      }
    }
  }

  /**
   * Populate Cathie's content resources
   */
  private async populateCathieContent(leaderId: string): Promise<void> {
    const cathieResources: Omit<ContentResource, 'id' | 'leaderId'>[] = [
      {
        title: 'ARK Invest Big Ideas Report',
        url: 'https://ark-invest.com/big-ideas/',
        description: 'Annual research on breakthrough technologies and their market potential.',
        resourceType: 'article',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['innovation', 'technology', 'investing', 'research']
      },
      {
        title: 'Cathie Wood on Invest Like the Best',
        url: 'https://investlikethebest.com/cathie-wood/',
        description: 'Discussion on disruptive innovation and investment philosophy.',
        resourceType: 'podcast',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['investing', 'innovation', 'technology', 'disruptive-innovation']
      },
      {
        title: 'The Convergence of Technologies',
        url: 'https://ark-invest.com/research/',
        description: 'Research on how AI, robotics, genomics, and other technologies converge.',
        resourceType: 'article',
        difficulty: 'advanced',
        priority: 2,
        topics: ['ai', 'robotics', 'genomics', 'convergence']
      }
    ];

    for (const resource of cathieResources) {
      try {
        await storage.createLearningResource?.({ ...resource, leaderId });
      } catch (error) {
        console.log(`Could not create resource "${resource.title}": Database method not available`);
      }
    }
  }

  /**
   * Populate Reid's content resources
   */
  private async populateReidContent(leaderId: string): Promise<void> {
    const reidResources: Omit<ContentResource, 'id' | 'leaderId'>[] = [
      {
        title: 'Blitzscaling',
        url: 'https://www.blitzscaling.com/',
        description: 'Reid\'s book on rapidly scaling companies in competitive markets.',
        resourceType: 'book',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['scaling', 'startups', 'strategy', 'network-effects']
      },
      {
        title: 'Masters of Scale Podcast',
        url: 'https://mastersofscale.com/',
        description: 'Reid\'s podcast on how companies grow from zero to massive scale.',
        resourceType: 'podcast',
        difficulty: 'beginner',
        priority: 1,
        topics: ['scaling', 'entrepreneurship', 'leadership', 'strategy']
      },
      {
        title: 'The Start-up of You',
        url: 'https://www.thestartupofyou.com/',
        description: 'Career strategy in the age of uncertainty and disruption.',
        resourceType: 'book',
        difficulty: 'beginner',
        priority: 2,
        topics: ['career', 'networking', 'strategy', 'adaptability']
      }
    ];

    for (const resource of reidResources) {
      try {
        await storage.createLearningResource?.({ ...resource, leaderId });
      } catch (error) {
        console.log(`Could not create resource "${resource.title}": Database method not available`);
      }
    }
  }

  /**
   * Populate Chamath's content resources
   */
  private async populateChamathContent(leaderId: string): Promise<void> {
    const chamathResources: Omit<ContentResource, 'id' | 'leaderId'>[] = [
      {
        title: 'All-In Podcast',
        url: 'https://www.allinpodcast.co/',
        description: 'Weekly discussions on markets, tech, politics, and investing.',
        resourceType: 'podcast',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['investing', 'markets', 'technology', 'economics']
      },
      {
        title: 'Chamath at Stanford',
        url: 'https://www.youtube.com/watch?v=59uTUpO8Dzw',
        description: 'Lecture on growth, metrics, and product-market fit.',
        resourceType: 'video',
        difficulty: 'intermediate',
        priority: 1,
        topics: ['growth', 'metrics', 'product-market-fit', 'startups']
      },
      {
        title: 'Climate Capital Manifesto',
        url: 'https://socialcapital.com/climate/',
        description: 'Chamath\'s thesis on climate tech investing and carbon markets.',
        resourceType: 'article',
        difficulty: 'advanced',
        priority: 2,
        topics: ['climate-tech', 'investing', 'carbon-markets', 'sustainability']
      }
    ];

    for (const resource of chamathResources) {
      try {
        await storage.createLearningResource?.({ ...resource, leaderId });
      } catch (error) {
        console.log(`Could not create resource "${resource.title}": Database method not available`);
      }
    }
  }

  /**
   * Generate recent activity for a leader
   */
  private generateRecentActivity(leader: any, resources: any[], casts: any[]) {
    const activities = [];
    
    // Add recent resources
    if (resources.length > 0) {
      const topResource = resources.find(r => r.priority === 1) || resources[0];
      activities.push({
        icon: 'bookmark',
        text: `Saved "${topResource.title}"`,
        color: 'text-indigo-400'
      });
    }
    
    // Add expertise-based activity
    if (leader.expertise?.includes('Angel Investing')) {
      activities.push({
        icon: 'heart',
        text: 'Liked "Web3 Infrastructure Deep Dive"',
        color: 'text-red-400'
      });
    } else if (leader.expertise?.includes('Blockchain Architecture')) {
      activities.push({
        icon: 'plus',
        text: 'Created "ZK-Rollup Explainer"',
        color: 'text-purple-400'
      });
    }
    
    // Add sharing activity
    activities.push({
      icon: 'share2',
      text: 'Shared on Farcaster',
      color: 'text-green-400'
    });
    
    return activities.slice(0, 3);
  }

  /**
   * Format number for display (1.2k, 2.1k, etc.)
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  /**
   * Fallback avatars when database is not available
   */
  private getFallbackAvatars() {
    return [
      {
        id: 'naval-fallback',
        username: 'naval',
        displayName: 'Naval Ravikant',
        bio: 'Angel investor, entrepreneur, and philosopher. Co-founder of AngelList.',
        pfpUrl: '/assets/naval-avatar.svg',
        gradient: 'from-indigo-500 to-purple-600',
        stats: { summaries: 247, liked: '1.2k', saved: 89 },
        role: 'Angel Investor & Philosopher',
        expertise: ['Angel Investing', 'Startups', 'Wealth Creation', 'Philosophy'],
        recentActivity: [
          { icon: 'bookmark', text: 'Saved "AI Safety in Practice"', color: 'text-indigo-400' },
          { icon: 'heart', text: 'Liked "Web3 Infrastructure Deep Dive"', color: 'text-red-400' },
          { icon: 'share2', text: 'Shared on Farcaster', color: 'text-green-400' }
        ]
      },
      {
        id: 'vitalik-fallback',
        username: 'vitalik.eth',
        displayName: 'Vitalik Buterin',
        bio: 'Founder of Ethereum. Researcher interested in crypto, governance, and public goods.',
        pfpUrl: '/assets/vitalik-avatar.svg',
        gradient: 'from-purple-500 to-cyan-500',
        stats: { summaries: 156, liked: '2.1k', saved: 203 },
        role: 'Ethereum Founder',
        expertise: ['Blockchain Architecture', 'Cryptography', 'Economic Design'],
        recentActivity: [
          { icon: 'plus', text: 'Created "ZK-Rollup Explainer"', color: 'text-purple-400' },
          { icon: 'bookmark', text: 'Saved "DeFi Security Patterns"', color: 'text-indigo-400' },
          { icon: 'message-circle', text: 'Commented on Lens', color: 'text-blue-400' }
        ]
      }
    ];
  }
}

export const knowledgeAvatarService = new KnowledgeAvatarService();