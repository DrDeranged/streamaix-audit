import { FarcasterService } from './farcaster.js';

interface CuratedCast {
  hash: string;
  text: string;
  whyItMatters: string;
  concepts: string[];
  priority: number;
}

interface TopicTag {
  name: string;
  definition: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface LearningResource {
  title: string;
  url: string;
  description: string;
  type: 'article' | 'talk' | 'thread' | 'website';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  priority: number;
}

interface CryptoLeaderEducation {
  fid: number;
  username: string;
  displayName: string;
  role: string;
  expertise: string[];
  keyTakeaways: string[];
  ecosystem: string[];
  notableCasts: CuratedCast[];
  resources: LearningResource[];
  topics: TopicTag[];
}

export class EducationService {
  private farcasterService: FarcasterService;

  constructor() {
    this.farcasterService = new FarcasterService();
  }

  private getCuratedEducationalContent(): { [fid: number]: CryptoLeaderEducation } {
    return {
      // Vitalik Buterin - Ethereum Founder
      5650: {
        fid: 5650,
        username: 'vitalik.eth',
        displayName: 'Vitalik Buterin',
        role: 'Ethereum Founder',
        expertise: ['Blockchain Architecture', 'Cryptography', 'Economic Design', 'Consensus Mechanisms'],
        keyTakeaways: [
          'Blockchain scalability requires multiple layer solutions (L1, L2, sharding)',
          'Proof-of-Stake is more energy efficient and secure than Proof-of-Work',
          'Decentralization, security, and scalability are fundamental blockchain trilemma',
          'Social consensus is as important as technical consensus in blockchain systems'
        ],
        ecosystem: ['Ethereum', 'DeFi', 'Layer 2'],
        notableCasts: [
          {
            hash: '0x123456',
            text: 'The merge to proof of stake reduced Ethereum energy consumption by ~99.9%',
            whyItMatters: 'Shows how major protocol upgrades can solve environmental concerns while maintaining security',
            concepts: ['Proof-of-Stake', 'Energy Efficiency', 'Protocol Upgrades'],
            priority: 1
          },
          {
            hash: '0x234567',
            text: 'Rollups are the endgame for scaling Ethereum while preserving decentralization',
            whyItMatters: 'Explains the long-term scaling strategy that maintains Ethereum\'s core values',
            concepts: ['Layer 2 Scaling', 'Rollups', 'Decentralization'],
            priority: 1
          }
        ],
        resources: [
          {
            title: 'Ethereum Whitepaper',
            url: 'https://ethereum.org/en/whitepaper/',
            description: 'Original vision for the world computer and smart contract platform',
            type: 'article',
            difficulty: 'intermediate',
            priority: 1
          },
          {
            title: 'Rollup-centric Ethereum roadmap',
            url: 'https://ethereum-magicians.org/t/a-rollup-centric-ethereum-roadmap/4698',
            description: 'Technical roadmap for Ethereum scaling via Layer 2 rollups',
            type: 'article',
            difficulty: 'advanced',
            priority: 1
          }
        ],
        topics: [
          {
            name: 'Proof-of-Stake',
            definition: 'Consensus mechanism where validators stake tokens to secure the network',
            category: 'technology',
            difficulty: 'intermediate'
          },
          {
            name: 'Layer 2 Scaling',
            definition: 'Solutions built on top of blockchains to increase transaction throughput',
            category: 'technology',
            difficulty: 'intermediate'
          }
        ]
      },

      // Dan Romero - Farcaster Co-founder
      3: {
        fid: 3,
        username: 'dwr.eth',
        displayName: 'Dan Romero',
        role: 'Farcaster Co-founder',
        expertise: ['Social Protocols', 'Decentralized Identity', 'Web3 UX', 'Community Building'],
        keyTakeaways: [
          'Decentralized social networks need both technical and social innovation',
          'User experience is critical for Web3 adoption - complexity must be hidden',
          'Social protocols should be open and interoperable, not siloed',
          'Building sustainable communities requires aligning incentives properly'
        ],
        ecosystem: ['Farcaster', 'Social Protocols', 'Web3 UX'],
        notableCasts: [
          {
            hash: '0x345678',
            text: 'The best crypto social products feel like normal social products that happen to be on-chain',
            whyItMatters: 'Highlights the importance of UX in Web3 social applications - users shouldn\'t feel the complexity',
            concepts: ['Web3 UX', 'Social Protocols', 'User Experience'],
            priority: 1
          },
          {
            hash: '0x456789',
            text: 'Decentralized social networks need credible exit - users should own their social graph',
            whyItMatters: 'Explains why data portability and user ownership are fundamental to decentralized social',
            concepts: ['Decentralized Identity', 'Data Ownership', 'Social Graphs'],
            priority: 1
          }
        ],
        resources: [
          {
            title: 'Farcaster Protocol Documentation',
            url: 'https://docs.farcaster.xyz/',
            description: 'Technical specification for the decentralized social protocol',
            type: 'website',
            difficulty: 'intermediate',
            priority: 1
          },
          {
            title: 'The Network State',
            url: 'https://thenetworkstate.com/',
            description: 'Vision for digital-first communities and governance',
            type: 'article',
            difficulty: 'advanced',
            priority: 2
          }
        ],
        topics: [
          {
            name: 'Social Protocols',
            definition: 'Open standards for decentralized social networking and communication',
            category: 'technology',
            difficulty: 'intermediate'
          },
          {
            name: 'Decentralized Identity',
            definition: 'Self-sovereign identity systems where users control their own data',
            category: 'technology',
            difficulty: 'intermediate'
          }
        ]
      },

      // Jesse Pollak - Base Protocol Lead
      6546: {
        fid: 6546,
        username: 'jessepollak',
        displayName: 'Jesse Pollak',
        role: 'Base Protocol Lead',
        expertise: ['Layer 2 Solutions', 'Developer Experience', 'Blockchain Scaling', 'Consumer Apps'],
        keyTakeaways: [
          'Layer 2s are essential for bringing crypto to billions of users globally',
          'Developer experience and tooling are critical for ecosystem growth',
          'Consumer crypto applications need to be fast, cheap, and reliable',
          'Building on existing infrastructure (Ethereum) provides security and interoperability'
        ],
        ecosystem: ['Base', 'Layer 2', 'Ethereum', 'Optimism'],
        notableCasts: [
          {
            hash: '0x567890',
            text: 'Base is designed to be the home for the next generation of consumer crypto apps',
            whyItMatters: 'Shows the vision of L2s as platforms specifically optimized for mainstream adoption',
            concepts: ['Layer 2', 'Consumer Apps', 'Mass Adoption'],
            priority: 1
          }
        ],
        resources: [
          {
            title: 'Base Documentation',
            url: 'https://docs.base.org/',
            description: 'Developer resources and guides for building on Base L2',
            type: 'website',
            difficulty: 'beginner',
            priority: 1
          },
          {
            title: 'Optimistic Rollups Explained',
            url: 'https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/',
            description: 'Technical overview of optimistic rollup architecture',
            type: 'article',
            difficulty: 'intermediate',
            priority: 1
          }
        ],
        topics: [
          {
            name: 'Optimistic Rollups',
            definition: 'L2 scaling solution that assumes transactions are valid by default',
            category: 'technology',
            difficulty: 'intermediate'
          }
        ]
      },

      // Balaji Srinivasan - Crypto Thought Leader
      1235: {
        fid: 1235,
        username: 'balajis.eth',
        displayName: 'Balaji Srinivasan',
        role: 'Crypto Thought Leader',
        expertise: ['Macro Economics', 'Geopolitics', 'Network States', 'Bitcoin', 'Decentralization'],
        keyTakeaways: [
          'Bitcoin represents a fundamental shift in monetary sovereignty and freedom',
          'Network states could emerge as alternatives to traditional nation-states',
          'Decentralization is not just technical but social and political',
          'Crypto enables exit options from legacy financial and governance systems'
        ],
        ecosystem: ['Bitcoin', 'Network States', 'DeFi'],
        notableCasts: [
          {
            hash: '0x678901',
            text: 'Bitcoin is not just a cryptocurrency, it\'s a monetary revolution that gives individuals sovereignty',
            whyItMatters: 'Frames Bitcoin beyond technology as a tool for financial freedom and personal sovereignty',
            concepts: ['Bitcoin', 'Monetary Sovereignty', 'Financial Freedom'],
            priority: 1
          }
        ],
        resources: [
          {
            title: 'The Network State',
            url: 'https://thenetworkstate.com/',
            description: 'Vision for how online communities can become physical territories',
            type: 'article',
            difficulty: 'advanced',
            priority: 1
          }
        ],
        topics: [
          {
            name: 'Network States',
            definition: 'Digital-first communities that can eventually acquire physical territory',
            category: 'governance',
            difficulty: 'advanced'
          }
        ]
      }
    };
  }

  /**
   * Get comprehensive educational data for a crypto leader
   */
  async getLeaderEducation(fid: number) {
    try {
      console.log(`🎓 Getting educational data for leader FID: ${fid}`);

      // Get real profile data from Farcaster
      const realProfile = await this.farcasterService.getUserProfile(fid);
      
      // Get curated educational content
      const curatedContent = this.getCuratedEducationalContent();
      const leaderEducation = curatedContent[fid];

      if (!leaderEducation) {
        // If no curated content, return basic profile info
        return {
          profile: {
            fid,
            username: realProfile.username,
            displayName: realProfile.display_name || realProfile.displayName,
            bio: realProfile.profile?.bio?.text || '',
            pfpUrl: realProfile.pfp_url,
            followerCount: realProfile.follower_count,
            followingCount: realProfile.following_count,
            role: 'Crypto Leader',
            expertise: [],
            keyTakeaways: []
          },
          notableCasts: [],
          resources: [],
          topics: [],
          engagement: { avgLikes: 0, avgRecasts: 0, totalEngagement: 0 }
        };
      }

      // Combine real data with curated educational content
      const educationalProfile = {
        ...realProfile,
        ...leaderEducation,
        bio: realProfile.profile?.bio?.text || '',
        pfpUrl: realProfile.pfp_url,
        followerCount: realProfile.follower_count,
        followingCount: realProfile.following_count,
        powerBadge: realProfile.power_badge || false,
        verifiedAddresses: realProfile.verified_addresses || []
      };

      // Calculate mock engagement for educational casts
      const engagement = {
        avgLikes: Math.floor(Math.random() * 500) + 100,
        avgRecasts: Math.floor(Math.random() * 200) + 50,
        totalEngagement: Math.floor(Math.random() * 1000) + 300
      };

      return {
        profile: educationalProfile,
        notableCasts: leaderEducation.notableCasts,
        resources: leaderEducation.resources,
        topics: leaderEducation.topics,
        engagement
      };

    } catch (error) {
      console.error(`❌ Failed to get leader education for FID ${fid}:`, error);
      throw new Error(`Failed to get leader education: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available crypto leaders for education
   */
  async getAllLeadersEducation(limit = 10) {
    try {
      console.log(`🎓 Getting education data for all leaders (limit: ${limit})`);
      
      const curatedContent = this.getCuratedEducationalContent();
      const fids = Object.keys(curatedContent).map(Number);
      
      const results = await Promise.all(
        fids.slice(0, limit).map(fid => this.getLeaderEducation(fid))
      );

      return results.filter(result => result !== null);
    } catch (error) {
      console.error('❌ Failed to get all leaders education:', error);
      throw new Error(`Failed to get leaders education: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get topic tags by category
   */
  getTopicsByCategory(category?: string) {
    const curatedContent = this.getCuratedEducationalContent();
    const allTopics: TopicTag[] = [];

    Object.values(curatedContent).forEach(leader => {
      allTopics.push(...leader.topics);
    });

    // Remove duplicates and filter by category if provided
    const uniqueTopics = allTopics.reduce((acc, topic) => {
      const existing = acc.find(t => t.name === topic.name);
      if (!existing) {
        acc.push(topic);
      }
      return acc;
    }, [] as TopicTag[]);

    return category 
      ? uniqueTopics.filter(topic => topic.category === category)
      : uniqueTopics;
  }

  /**
   * Get learning resources by leader
   */
  async getResourcesByLeader(fid: number) {
    const leaderEducation = await this.getLeaderEducation(fid);
    return leaderEducation ? leaderEducation.resources : [];
  }
}