import { db } from '../db';
import { liveStreams, knowledgeAvatars, streamMessages } from '@shared/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { getStreamingService } from './streamingService';
import OpenAI from 'openai';

const openai = new OpenAI();

interface AvatarStreamConfig {
  avatarId: string;
  streamType: 'alpha_call' | 'market_analysis' | 'defi_deep_dive' | 'ama';
  duration?: number; // minutes
}

interface KnowledgeAvatar {
  id: string;
  name: string;
  handle: string;
  expertise: string | null;
  category: string | null;
  investmentThesis: string | null;
  marketOutlook: string | null;
  primaryInterests: string[] | null;
  imageUrl: string | null;
}

// Avatar-specific alpha topics based on their expertise
const AVATAR_ALPHA_TOPICS: Record<string, string[]> = {
  'vitalik': ['Ethereum scaling', 'Layer 2 solutions', 'EIP proposals', 'Proof of stake optimization', 'Account abstraction'],
  'elonmusk': ['Crypto market sentiment', 'Dogecoin updates', 'Tesla Bitcoin holdings', 'xAI and blockchain', 'Sustainable crypto mining'],
  'cz_binance': ['Exchange trends', 'BNB ecosystem', 'Regulatory landscape', 'DeFi on BNB Chain', 'Global crypto adoption'],
  'sama': ['AI x Crypto intersection', 'OpenAI tokenization', 'Worldcoin updates', 'AGI market implications', 'Tech investments'],
  'jack': ['Bitcoin Lightning', 'Block payments', 'Bitcoin maximalism', 'Decentralized social', 'Square crypto initiatives'],
  'cathiewood': ['Disruptive tech', 'Bitcoin ETF flows', 'Innovation investing', 'Crypto equities', 'ARK fund strategies'],
  'balaji': ['Network states', 'Crypto geopolitics', 'Decentralized identity', 'Prediction markets', 'Startup ecosystems'],
  'pmarca': ['Web3 investing', 'Crypto VC trends', 'Software eating finance', 'a16z portfolio', 'Token economics'],
  'haydenzadams': ['Uniswap governance', 'DEX innovations', 'AMM mechanics', 'DeFi yield strategies', 'Liquidity provision'],
  'starkness': ['Lightning Network', 'Bitcoin scalability', 'Layer 2 payments', 'Cross-chain bridges', 'Bitcoin DeFi'],
  'RuneKek': ['DAI stability', 'MakerDAO governance', 'Real-world assets', 'Stablecoin mechanics', 'DeFi lending'],
  'peterthiel': ['Contrarian crypto plays', 'Bitcoin as digital gold', 'Thiel Fellowship crypto projects', 'Palantir blockchain', 'Political crypto'],
  'tylerwinklevoss': ['Gemini exchange', 'Bitcoin custody', 'Crypto regulation', 'NFT markets', 'Institutional adoption'],
  'cameronwinklevoss': ['Web3 infrastructure', 'Crypto custody solutions', 'Gemini updates', 'NFT curation', 'DeFi security'],
  'brianarmstrong': ['Coinbase ecosystem', 'Base L2', 'Crypto regulation', 'On-chain summer', 'Institutional crypto'],
  'dokwon': ['Algorithmic stablecoins', 'Terra lessons', 'DeFi risks', 'Stablecoin design', 'Market mechanics'],
  'justinsuntron': ['TRON ecosystem', 'Stablecoin dominance', 'Asian crypto markets', 'Exchange dynamics', 'High-yield DeFi'],
};

// Real-time market data simulation (would connect to live APIs)
async function getCurrentMarketContext(): Promise<string> {
  const now = new Date();
  const hour = now.getHours();
  
  // Market context based on time
  const marketPhase = hour >= 9 && hour < 16 ? 'US trading hours' : 
                      hour >= 2 && hour < 9 ? 'Asian session' : 'overnight/European';
  
  const btcTrend = Math.random() > 0.5 ? 'bullish momentum' : 'consolidating';
  const ethTrend = Math.random() > 0.5 ? 'showing strength' : 'following BTC';
  const defiTvl = Math.random() > 0.5 ? 'increasing' : 'stable';
  
  return `Market context: ${marketPhase}. BTC ${btcTrend}. ETH ${ethTrend}. DeFi TVL ${defiTvl}.`;
}

export class AvatarAlphaStreamService {
  private activeStreams = new Map<string, { chatInterval: NodeJS.Timeout; alphaInterval: NodeJS.Timeout }>();
  private isRunning = false;

  async startAvatarStream(config: AvatarStreamConfig): Promise<string | null> {
    try {
      // Get avatar details
      const [avatar] = await db.select()
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, config.avatarId))
        .limit(1);

      if (!avatar) {
        console.error('[Avatar Alpha] Avatar not found:', config.avatarId);
        return null;
      }

      const streamTitle = this.generateAvatarStreamTitle(avatar, config.streamType);
      const streamDescription = this.generateAvatarStreamDescription(avatar, config.streamType);

      // Create the stream
      const [stream] = await db.insert(liveStreams).values({
        title: streamTitle,
        description: streamDescription,
        streamType: config.streamType === 'alpha_call' ? 'trading_room' : 
                   config.streamType === 'market_analysis' ? 'broadcast' :
                   config.streamType === 'defi_deep_dive' ? 'live_bounty' : 'audio_space',
        hostId: avatar.id,
        hostAvatarId: avatar.id,
        status: 'live',
        category: this.getCategory(config.streamType),
        tags: this.getTags(avatar, config.streamType),
        actualStart: new Date(),
        currentViewers: Math.floor(Math.random() * 50) + 20, // Avatars get more viewers
        thumbnailUrl: avatar.imageUrl,
      }).returning();

      console.log(`[Avatar Alpha] 🎙️ Started ${avatar.name}'s stream: ${stream.id} - ${streamTitle}`);

      // Start alpha content generation
      this.startAlphaGeneration(stream.id, avatar as KnowledgeAvatar, config.streamType);

      // Schedule stream end
      if (config.duration) {
        setTimeout(() => {
          this.endStream(stream.id);
        }, config.duration * 60 * 1000);
      }

      return stream.id;
    } catch (error) {
      console.error('[Avatar Alpha] Error starting stream:', error);
      return null;
    }
  }

  private generateAvatarStreamTitle(avatar: any, streamType: string): string {
    const titles: Record<string, string[]> = {
      alpha_call: [
        `🎯 ${avatar.name}: Live Alpha Calls & Trade Setups`,
        `💎 ${avatar.name}'s Trading Room - Real-Time Signals`,
        `🔥 ${avatar.name}: Market Alpha - Entry Points & Targets`,
        `⚡ LIVE: ${avatar.name} Drops Alpha`,
      ],
      market_analysis: [
        `📊 ${avatar.name}: Market Analysis & Outlook`,
        `🧠 ${avatar.name}'s Take on Today's Markets`,
        `📈 ${avatar.name}: Technical & Fundamental Deep Dive`,
        `🔍 ${avatar.name} Breaks Down the Charts`,
      ],
      defi_deep_dive: [
        `🔬 ${avatar.name}: DeFi Protocol Analysis`,
        `💡 ${avatar.name} Explores Hidden DeFi Gems`,
        `🌊 ${avatar.name}: Yield Farming Strategies`,
        `⚗️ ${avatar.name}'s DeFi Research Session`,
      ],
      ama: [
        `🎙️ AMA with ${avatar.name}`,
        `💬 ${avatar.name}: Ask Me Anything`,
        `🤝 Community Q&A with ${avatar.name}`,
        `📢 ${avatar.name} Answers Your Questions`,
      ],
    };

    const typeTitle = titles[streamType] || titles.market_analysis;
    return typeTitle[Math.floor(Math.random() * typeTitle.length)];
  }

  private generateAvatarStreamDescription(avatar: any, streamType: string): string {
    const expertise = avatar.expertise || 'crypto markets';
    const thesis = avatar.investmentThesis || 'strategic investment analysis';
    
    const descriptions: Record<string, string> = {
      alpha_call: `Join ${avatar.name} for live trading insights and actionable alpha. Known for ${expertise}. Get real-time entry points, price targets, and risk management strategies.`,
      market_analysis: `${avatar.name} breaks down the current market conditions with deep analysis. Expertise: ${expertise}. ${thesis ? thesis.slice(0, 100) + '...' : ''}`,
      defi_deep_dive: `${avatar.name} explores DeFi opportunities and protocol mechanics. Learn about yield strategies, risk assessment, and hidden alpha in the DeFi space.`,
      ama: `Interactive Q&A session with ${avatar.name}. Ask about ${expertise}, market outlook, and investment strategies. Community engagement welcome!`,
    };

    return descriptions[streamType] || descriptions.market_analysis;
  }

  private getCategory(streamType: string): string {
    const categories: Record<string, string> = {
      alpha_call: 'trading',
      market_analysis: 'crypto',
      defi_deep_dive: 'defi',
      ama: 'ama',
    };
    return categories[streamType] || 'crypto';
  }

  private getTags(avatar: any, streamType: string): string[] {
    const baseTags = ['alpha', 'live', 'avatar', avatar.handle?.toLowerCase() || ''];
    const interests = avatar.primaryInterests?.slice(0, 3) || [];
    const typeTags: Record<string, string[]> = {
      alpha_call: ['trading', 'signals', 'entries', 'crypto'],
      market_analysis: ['analysis', 'charts', 'technical', 'fundamental'],
      defi_deep_dive: ['defi', 'yield', 'protocols', 'apy'],
      ama: ['ama', 'community', 'questions', 'discussion'],
    };
    return [...baseTags, ...(typeTags[streamType] || []), ...interests.map((i: string) => i.toLowerCase().replace(/\s+/g, '-'))];
  }

  private async startAlphaGeneration(streamId: string, avatar: KnowledgeAvatar, streamType: string) {
    const streamingService = getStreamingService();
    if (!streamingService) return;

    // Send initial welcome and alpha message immediately
    setTimeout(async () => {
      try {
        const welcomeMsg = `🎙️ Hey everyone! ${avatar.name} here. Let's get into it - I've got some insights to share on ${avatar.expertise || 'crypto markets'} today.`;
        await streamingService.sendAiMessage(streamId, avatar.id, avatar.name, welcomeMsg);
        
        // Follow up with actual alpha after 5 seconds
        setTimeout(async () => {
          const alphaMessage = await this.generateAlphaContent(avatar, streamType);
          if (alphaMessage) {
            await streamingService.sendAiMessage(streamId, avatar.id, avatar.name, alphaMessage);
          }
        }, 5000);
      } catch (error) {
        console.error('[Avatar Alpha] Error sending initial messages:', error);
      }
    }, 2000);

    // Generate alpha messages every 30-60 seconds
    const alphaInterval = setInterval(async () => {
      try {
        const alphaMessage = await this.generateAlphaContent(avatar, streamType);
        if (alphaMessage) {
          await streamingService.sendAiMessage(
            streamId,
            avatar.id,
            avatar.name,
            alphaMessage
          );
          
          // Update viewer count slightly
          await db.update(liveStreams)
            .set({ 
              currentViewers: sql`${liveStreams.currentViewers} + ${Math.floor(Math.random() * 3) - 1}`
            })
            .where(eq(liveStreams.id, streamId));
        }
      } catch (error) {
        console.error('[Avatar Alpha] Error generating alpha:', error);
      }
    }, Math.floor(Math.random() * 30000) + 30000); // 30-60 seconds

    // Also send quick engagement messages
    const chatInterval = setInterval(async () => {
      try {
        if (Math.random() < 0.4) { // 40% chance
          const message = this.getEngagementMessage(streamType);
          await streamingService.sendAiMessage(streamId, avatar.id, avatar.name, message);
        }
      } catch (error) {
        // Stream might have ended
      }
    }, Math.floor(Math.random() * 20000) + 15000); // 15-35 seconds

    this.activeStreams.set(streamId, { chatInterval, alphaInterval });
  }

  private async generateAlphaContent(avatar: KnowledgeAvatar, streamType: string): Promise<string> {
    const handle = avatar.handle?.toLowerCase() || '';
    const topics = AVATAR_ALPHA_TOPICS[handle] || ['market analysis', 'crypto trends', 'trading opportunities'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const marketContext = await getCurrentMarketContext();

    // Use GPT to generate avatar-specific alpha (cost-efficient with gpt-4o-mini)
    try {
      const systemPrompt = `You are ${avatar.name}, a crypto thought leader known for ${avatar.expertise || 'market insights'}.
Your investment thesis: ${avatar.investmentThesis || 'Strategic crypto investing'}
Your current outlook: ${avatar.marketOutlook || 'Cautiously optimistic on quality projects'}

Generate a SHORT (1-2 sentences) insightful message about "${randomTopic}" for a live stream.
Include specific details like price levels, percentages, or actionable insights when relevant.
Use your unique voice and perspective. Be bold with predictions.
Do NOT use hashtags. Keep it conversational but packed with alpha.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${marketContext}\n\nShare an alpha insight about ${randomTopic} in your stream.` }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      const message = response.choices[0]?.message?.content?.trim();
      if (message) {
        // Add relevant emoji based on content
        const emoji = this.getAlphaEmoji(message, streamType);
        return `${emoji} ${message}`;
      }
    } catch (error) {
      console.error('[Avatar Alpha] GPT error, using fallback:', error);
    }

    // Fallback to pre-generated alpha messages
    return this.getFallbackAlpha(avatar, streamType, randomTopic);
  }

  private getAlphaEmoji(message: string, streamType: string): string {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('bull') || lowerMsg.includes('long') || lowerMsg.includes('buy')) return '🟢';
    if (lowerMsg.includes('bear') || lowerMsg.includes('short') || lowerMsg.includes('sell')) return '🔴';
    if (lowerMsg.includes('entry') || lowerMsg.includes('target')) return '🎯';
    if (lowerMsg.includes('alert') || lowerMsg.includes('warning')) return '⚠️';
    if (lowerMsg.includes('analysis') || lowerMsg.includes('chart')) return '📊';
    if (lowerMsg.includes('defi') || lowerMsg.includes('yield')) return '💎';
    
    const emojis: Record<string, string> = {
      alpha_call: '💡',
      market_analysis: '📈',
      defi_deep_dive: '🔬',
      ama: '💬',
    };
    return emojis[streamType] || '⚡';
  }

  private getFallbackAlpha(avatar: KnowledgeAvatar, streamType: string, topic: string): string {
    const alphaMessages = [
      `🎯 Looking at ${topic} - seeing strong accumulation patterns. Key level to watch is the 50-day MA.`,
      `📊 My analysis on ${topic}: institutional flows suggest we're in early accumulation phase.`,
      `💡 Alpha on ${topic}: watch for the breakout above current resistance. Target +15-20% from here.`,
      `🔍 Deep diving into ${topic} - the on-chain metrics are flashing bullish signals.`,
      `⚡ Quick take on ${topic}: risk/reward looking favorable. Setting alerts at key levels.`,
      `🧠 ${topic} thesis: we're seeing a structural shift. Position accordingly.`,
      `💎 Hidden alpha in ${topic}: most people are missing the bigger picture here.`,
      `📈 ${topic} update: momentum building. This could be the start of a larger move.`,
    ];
    
    return alphaMessages[Math.floor(Math.random() * alphaMessages.length)];
  }

  private getEngagementMessage(streamType: string): string {
    const messages: Record<string, string[]> = {
      alpha_call: [
        '👀 Who caught that last call? Drop a 🔥 if you\'re in!',
        '📝 Taking notes? These setups don\'t come often.',
        '⚡ More alpha coming - stay locked in.',
        '💬 Any questions on the current setup?',
        '🎯 Risk management reminder: never risk more than 2% per trade.',
      ],
      market_analysis: [
        '📊 Let me know what asset you want me to break down next.',
        '🧐 Interesting price action forming here...',
        '📈 The technicals are aligning nicely.',
        '💡 Key takeaway: patience pays in this market.',
        '🔍 Zooming out for the bigger picture...',
      ],
      defi_deep_dive: [
        '🔬 This protocol has some interesting mechanics...',
        '💰 APY looks attractive but always DYOR on risks.',
        '⚗️ Smart contract risk is real - diversify your positions.',
        '🌊 Liquidity is key in DeFi - always check depth.',
        '💎 Finding gems requires deep research.',
      ],
      ama: [
        '🙋 What questions do you have?',
        '💬 Drop your questions in chat!',
        '🤔 Good question - let me address that...',
        '📢 Keep the questions coming!',
        '🎙️ This is a great discussion!',
      ],
    };

    const typeMessages = messages[streamType] || messages.market_analysis;
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  }

  async endStream(streamId: string) {
    try {
      const intervals = this.activeStreams.get(streamId);
      if (intervals) {
        clearInterval(intervals.chatInterval);
        clearInterval(intervals.alphaInterval);
        this.activeStreams.delete(streamId);
      }

      await db.update(liveStreams)
        .set({
          status: 'ended',
          actualEnd: new Date(),
        })
        .where(eq(liveStreams.id, streamId));

      console.log(`[Avatar Alpha] 🔴 Ended stream: ${streamId}`);
    } catch (error) {
      console.error('[Avatar Alpha] Error ending stream:', error);
    }
  }

  async scheduleAvatarStreams() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[Avatar Alpha] 🎙️ Starting Knowledge Avatar stream scheduler...');

    const runScheduler = async () => {
      try {
        // Get active knowledge avatars
        const avatars = await db.select()
          .from(knowledgeAvatars)
          .where(eq(knowledgeAvatars.isActive, true))
          .limit(17);

        if (avatars.length === 0) {
          console.log('[Avatar Alpha] No active avatars found');
          return;
        }

        // Check current avatar-hosted live streams
        const [liveCount] = await db.select({ count: sql<number>`count(*)` })
          .from(liveStreams)
          .where(eq(liveStreams.status, 'live'));

        const currentLive = Number(liveCount?.count || 0);

        // Start avatar streams if less than 2 avatar streams are live
        if (currentLive < 5) { // Allow up to 5 total streams
          const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
          const streamTypes: Array<'alpha_call' | 'market_analysis' | 'defi_deep_dive' | 'ama'> = 
            ['alpha_call', 'market_analysis', 'defi_deep_dive', 'ama'];
          
          // Weight towards alpha_call and market_analysis
          const weights = [0.4, 0.35, 0.15, 0.1];
          const random = Math.random();
          let selectedType = streamTypes[0];
          let cumulative = 0;
          for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
              selectedType = streamTypes[i];
              break;
            }
          }

          await this.startAvatarStream({
            avatarId: randomAvatar.id,
            streamType: selectedType,
            duration: Math.floor(Math.random() * 45) + 30, // 30-75 minutes
          });
        }
      } catch (error) {
        console.error('[Avatar Alpha] Scheduler error:', error);
      }
    };

    // Run every 10 minutes
    setInterval(runScheduler, 10 * 60 * 1000);

    // Initial run after 15 seconds
    setTimeout(runScheduler, 15000);
  }

  stop() {
    this.isRunning = false;
    this.activeStreams.forEach((intervals, streamId) => {
      clearInterval(intervals.chatInterval);
      clearInterval(intervals.alphaInterval);
      this.endStream(streamId);
    });
    this.activeStreams.clear();
    console.log('[Avatar Alpha] Service stopped');
  }
}

// Singleton
let avatarAlphaServiceInstance: AvatarAlphaStreamService | null = null;

export function initAvatarAlphaStreamService(): AvatarAlphaStreamService {
  if (!avatarAlphaServiceInstance) {
    avatarAlphaServiceInstance = new AvatarAlphaStreamService();
  }
  return avatarAlphaServiceInstance;
}

export function getAvatarAlphaStreamService(): AvatarAlphaStreamService | null {
  return avatarAlphaServiceInstance;
}
