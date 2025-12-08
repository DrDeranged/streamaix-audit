import { db } from '../db';
import { liveStreams, users, knowledgeAvatars, aiAgents, streamMessages } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getStreamingService } from './streamingService';
import OpenAI from 'openai';

const openai = new OpenAI();

interface AIAgentStreamConfig {
  agentId: string;
  agentName: string;
  avatarId?: string;
  streamType: 'broadcast' | 'trading_room' | 'audio_space' | 'live_bounty';
  topic?: string;
  duration?: number; // minutes
}

interface AIStreamPersona {
  name: string;
  style: 'analytical' | 'enthusiastic' | 'educational' | 'skeptical' | 'casual';
  expertise: string[];
  chatFrequency: 'high' | 'medium' | 'low';
}

const AI_STREAM_PERSONAS: Record<string, AIStreamPersona> = {
  'market_analyst': {
    name: 'CryptoSage',
    style: 'analytical',
    expertise: ['price analysis', 'market trends', 'on-chain metrics'],
    chatFrequency: 'medium',
  },
  'defi_expert': {
    name: 'DeFi Master',
    style: 'educational',
    expertise: ['yield farming', 'liquidity pools', 'protocol analysis'],
    chatFrequency: 'high',
  },
  'trading_bot': {
    name: 'AlphaBot',
    style: 'analytical',
    expertise: ['technical analysis', 'trading signals', 'risk management'],
    chatFrequency: 'medium',
  },
  'community_host': {
    name: 'StreamHost',
    style: 'enthusiastic',
    expertise: ['community engagement', 'crypto news', 'project updates'],
    chatFrequency: 'high',
  },
};

export class AIAgentStreamingService {
  private activeAIStreams = new Map<string, NodeJS.Timeout>();
  private isRunning = false;

  async startAIAgentStream(config: AIAgentStreamConfig): Promise<string | null> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log('[AI Streaming] ⏸️ OpenAI API paused - AI agent stream disabled');
      return null;
    }
    
    try {
      // Create the stream in database
      const [stream] = await db.insert(liveStreams).values({
        title: await this.generateStreamTitle(config),
        description: await this.generateStreamDescription(config),
        streamType: config.streamType,
        hostId: config.agentId,
        hostAvatarId: config.avatarId,
        status: 'live',
        category: this.getCategory(config.streamType),
        tags: this.getTags(config.streamType),
        actualStart: new Date(),
        currentViewers: Math.floor(Math.random() * 15) + 5, // Start with some viewers
      }).returning();

      console.log(`[AI Streaming] Started AI stream: ${stream.id} - ${stream.title}`);

      // Start AI chat participation
      this.startAIChatParticipation(stream.id, config);

      // Schedule stream end if duration specified
      if (config.duration) {
        setTimeout(() => {
          this.endAIStream(stream.id);
        }, config.duration * 60 * 1000);
      }

      return stream.id;
    } catch (error) {
      console.error('[AI Streaming] Error starting AI stream:', error);
      return null;
    }
  }

  private async generateStreamTitle(config: AIAgentStreamConfig): Promise<string> {
    const titles: Record<string, string[]> = {
      broadcast: [
        'Live Market Analysis & Trading Insights',
        'Crypto Market Deep Dive - Daily Analysis',
        'Weekly Crypto Roundup & Price Predictions',
        'Breaking Down Today\'s Market Moves',
        'Technical Analysis: Top Coins to Watch',
      ],
      trading_room: [
        'Live Trading Session - Real-Time Signals',
        'Market Analysis & Trade Setups',
        'Day Trading Crypto - Live Calls',
        'Swing Trading Opportunities Today',
        'Chart Analysis & Entry Points',
      ],
      audio_space: [
        'Crypto Twitter Space - Market Discussion',
        'Community AMA: Ask Me Anything',
        'DeFi Discussion - Yield Strategies',
        'NFT Market Update & Analysis',
        'Builder\'s Corner: Project Updates',
      ],
      live_bounty: [
        'Live Bounty Hunt - Finding Alpha',
        'Research Session: New Projects Analysis',
        'On-Chain Investigation Live',
        'Community Research Challenge',
        'Finding the Next 100x - Live Research',
      ],
    };

    const typeTitle = titles[config.streamType] || titles.broadcast;
    return typeTitle[Math.floor(Math.random() * typeTitle.length)];
  }

  private async generateStreamDescription(config: AIAgentStreamConfig): Promise<string> {
    const descriptions: Record<string, string[]> = {
      broadcast: [
        'Join us for live market analysis powered by AI. Get real-time insights on price action, market sentiment, and trading opportunities.',
        'AI-driven cryptocurrency analysis session. We\'ll cover market trends, key support/resistance levels, and upcoming catalysts.',
      ],
      trading_room: [
        'Live trading signals and analysis. Watch real-time trade setups with entry, stop-loss, and take-profit levels.',
        'Join our AI-powered trading room for actionable insights and market commentary.',
      ],
      audio_space: [
        'Open discussion about the latest developments in crypto. Share your thoughts and get AI-powered insights.',
        'Community space for crypto enthusiasts. Let\'s discuss markets, projects, and opportunities together.',
      ],
      live_bounty: [
        'Live research session to find alpha and analyze new projects. Contribute insights to earn rewards!',
        'Collaborative research bounty - help us investigate and earn STREAM tokens for valuable contributions.',
      ],
    };

    const typeDesc = descriptions[config.streamType] || descriptions.broadcast;
    return typeDesc[Math.floor(Math.random() * typeDesc.length)];
  }

  private getCategory(streamType: string): string {
    const categories: Record<string, string> = {
      broadcast: 'crypto',
      trading_room: 'trading',
      audio_space: 'ama',
      live_bounty: 'education',
    };
    return categories[streamType] || 'crypto';
  }

  private getTags(streamType: string): string[] {
    const baseTags = ['ai', 'streamaix', 'live'];
    const typeTags: Record<string, string[]> = {
      broadcast: ['analysis', 'bitcoin', 'ethereum', 'market'],
      trading_room: ['trading', 'signals', 'technical-analysis', 'crypto'],
      audio_space: ['community', 'discussion', 'ama', 'crypto'],
      live_bounty: ['research', 'bounty', 'alpha', 'investigation'],
    };
    return [...baseTags, ...(typeTags[streamType] || [])];
  }

  private async startAIChatParticipation(streamId: string, config: AIAgentStreamConfig) {
    const streamingService = getStreamingService();
    if (!streamingService) return;

    // Generate AI chat messages periodically
    const chatInterval = setInterval(async () => {
      try {
        const message = await this.generateAIChatMessage(config.streamType);
        if (message) {
          await streamingService.sendAiMessage(
            streamId,
            config.agentId,
            config.agentName,
            message
          );
        }
      } catch (error) {
        console.error('[AI Streaming] Error sending AI chat message:', error);
      }
    }, Math.floor(Math.random() * 30000) + 15000); // Random interval between 15-45 seconds

    this.activeAIStreams.set(streamId, chatInterval);
  }

  private async generateAIChatMessage(streamType: string): Promise<string | null> {
    // Pre-defined messages for cost efficiency (no API call needed)
    const messages: Record<string, string[]> = {
      broadcast: [
        '📊 Market structure looking strong on the higher timeframes',
        '👀 Watching BTC closely here - key level approaching',
        '💡 Remember: patience is key in volatile markets',
        '📈 Volume picking up - could signal a move incoming',
        '🔍 On-chain data showing interesting accumulation patterns',
        '⚡ Momentum indicators suggesting a potential breakout',
        '🎯 Key resistance at this level - watch for rejection or breakout',
        '💎 Strong hands not selling despite the dip',
        '📉 Support held well overnight - bulls maintaining control',
        '🔥 Funding rates normalizing - healthy for continuation',
      ],
      trading_room: [
        '⚠️ Setting tight stops on this trade - risk management first',
        '📊 R:R looking good here - 3:1 minimum on this setup',
        '🎯 Entry triggered - now managing the position',
        '💰 Taking partial profits at first target',
        '📈 Trailing stop activated - letting winners run',
        '🔍 Scanning for the next setup - patience pays',
        '⚡ Clean breakout forming - watching for confirmation',
        '📉 Bearish divergence spotted - being cautious here',
        '🎪 Don\'t chase! Wait for proper entries',
        '💡 Scale in, scale out - never all in at once',
      ],
      audio_space: [
        '🎙️ Great point! What do others think?',
        '💬 Interesting perspective - let\'s discuss further',
        '🤔 Anyone have experience with this protocol?',
        '📢 Remember to like and share if you\'re finding value!',
        '🙋 Any questions from the audience?',
        '🔊 Thanks for joining the space everyone!',
        '💡 This is a great learning moment for newcomers',
        '🤝 Love the community engagement here',
        '📚 For those new to crypto - don\'t invest more than you can afford to lose',
        '🎯 Let\'s keep the discussion constructive',
      ],
      live_bounty: [
        '🔍 Interesting finding - let me dig deeper',
        '📊 Cross-referencing with on-chain data now',
        '💡 This could be significant - good catch!',
        '🎯 Following this lead - looks promising',
        '📝 Documenting this for the summary',
        '⚡ Real-time alpha hunting in action',
        '🔬 Deep diving into the smart contract',
        '💎 Quality research earns quality rewards',
        '🤝 Collaboration makes us stronger',
        '📈 Connecting the dots here...',
      ],
    };

    const typeMessages = messages[streamType] || messages.broadcast;
    
    // 30% chance to skip message to feel more natural
    if (Math.random() < 0.3) return null;
    
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  }

  async endAIStream(streamId: string) {
    try {
      // Clear chat interval
      const interval = this.activeAIStreams.get(streamId);
      if (interval) {
        clearInterval(interval);
        this.activeAIStreams.delete(streamId);
      }

      // Update stream status
      await db.update(liveStreams)
        .set({
          status: 'ended',
          actualEnd: new Date(),
        })
        .where(eq(liveStreams.id, streamId));

      console.log(`[AI Streaming] Ended AI stream: ${streamId}`);
    } catch (error) {
      console.error('[AI Streaming] Error ending AI stream:', error);
    }
  }

  async participateInStream(streamId: string, agentId: string, agentName: string) {
    const streamingService = getStreamingService();
    if (!streamingService) return;

    // Join as viewer and occasionally send messages
    const chatInterval = setInterval(async () => {
      try {
        // 20% chance to comment
        if (Math.random() < 0.2) {
          const comments = [
            '👍 Great insight!',
            '📈 Bullish on this!',
            '🤔 Interesting point...',
            '💡 Never thought of it that way',
            '🔥 This stream is 🔥',
            '💎 Diamond hands!',
            '📊 Love the analysis',
            '🎯 Spot on!',
            '👀 Watching closely',
            '⚡ LFG!',
          ];
          const message = comments[Math.floor(Math.random() * comments.length)];
          await streamingService.sendAiMessage(streamId, agentId, agentName, message);
        }
      } catch (error) {
        // Stream might have ended
        clearInterval(chatInterval);
      }
    }, Math.floor(Math.random() * 60000) + 30000); // 30-90 second intervals

    // Auto-leave after 5-15 minutes
    setTimeout(() => {
      clearInterval(chatInterval);
    }, (Math.floor(Math.random() * 10) + 5) * 60 * 1000);
  }

  async scheduleAIStreams() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[AI Streaming] Starting AI stream scheduler...');

    // Check if any AI-hosted streams should be started
    const checkAndStartStreams = async () => {
      try {
        // Get AI agents that can stream
        const aiAgentsList = await db.select()
          .from(aiAgents)
          .where(eq(aiAgents.isActive, true))
          .limit(10);

        if (aiAgentsList.length === 0) return;

        // Check current live stream count
        const [liveCount] = await db.select({ count: sql<number>`count(*)` })
          .from(liveStreams)
          .where(eq(liveStreams.status, 'live'));

        const currentLive = Number(liveCount?.count || 0);

        // Start a new AI stream if less than 3 are live
        if (currentLive < 3) {
          const randomAgent = aiAgentsList[Math.floor(Math.random() * aiAgentsList.length)];
          const streamTypes: Array<'broadcast' | 'trading_room' | 'audio_space' | 'live_bounty'> = 
            ['broadcast', 'trading_room', 'audio_space', 'live_bounty'];
          
          await this.startAIAgentStream({
            agentId: randomAgent.id,
            agentName: randomAgent.name,
            streamType: streamTypes[Math.floor(Math.random() * streamTypes.length)],
            duration: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
          });
        }

        // Have some AI agents join existing streams
        const liveStreamsList = await db.select()
          .from(liveStreams)
          .where(eq(liveStreams.status, 'live'))
          .limit(5);

        for (const stream of liveStreamsList) {
          // 20% chance for an AI agent to join
          if (Math.random() < 0.2) {
            const randomAgent = aiAgentsList[Math.floor(Math.random() * aiAgentsList.length)];
            this.participateInStream(stream.id, randomAgent.id, randomAgent.name);
          }
        }
      } catch (error) {
        console.error('[AI Streaming] Error in stream scheduler:', error);
      }
    };

    // Run every 5 minutes
    setInterval(checkAndStartStreams, 5 * 60 * 1000);

    // Initial check after 30 seconds
    setTimeout(checkAndStartStreams, 30000);
  }

  stop() {
    this.isRunning = false;
    this.activeAIStreams.forEach((interval, streamId) => {
      clearInterval(interval);
      this.endAIStream(streamId);
    });
    this.activeAIStreams.clear();
    console.log('[AI Streaming] AI streaming service stopped');
  }
}

// Singleton instance
let aiStreamingServiceInstance: AIAgentStreamingService | null = null;

export function initAIAgentStreamingService(): AIAgentStreamingService {
  if (!aiStreamingServiceInstance) {
    aiStreamingServiceInstance = new AIAgentStreamingService();
  }
  return aiStreamingServiceInstance;
}

export function getAIAgentStreamingService(): AIAgentStreamingService | null {
  return aiStreamingServiceInstance;
}
