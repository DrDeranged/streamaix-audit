import { db } from '../db';
import { liveStreams, knowledgeAvatars, streamMessages } from '@shared/schema';
import { eq, sql, desc, and, ne } from 'drizzle-orm';
import { getStreamingService } from './streamingService';
import { AvatarVoiceService } from './avatarVoiceService';
import { AvatarPodcastEngine } from './avatarPodcastEngine';
import OpenAI from 'openai';

const openai = new OpenAI();

interface ActiveVoiceStream {
  streamId: string;
  avatarId: string;
  avatarName: string;
  podcastEngine: AvatarPodcastEngine;
  startTime: Date;
  scheduledEndTime: Date;
  isActive: boolean;
}

const STREAM_DURATION_MIN = 45;
const STREAM_DURATION_MAX = 90;
const STREAM_ROTATION_INTERVAL = 4 * 60 * 60 * 1000;
const MAX_CONCURRENT_VOICE_STREAMS = 2;

export class AutonomousAvatarStreamService {
  private activeVoiceStreams = new Map<string, ActiveVoiceStream>();
  private isRunning = false;
  private schedulerInterval: NodeJS.Timeout | null = null;
  private lastStreamRotation: Date = new Date(0);
  private streamHistory: string[] = [];

  async start() {
    if (this.isRunning) {
      console.log('[Avatar Voice] Already running');
      return;
    }

    this.isRunning = true;
    console.log('🎙️ Autonomous Avatar Voice Streaming Service started');
    console.log(`   Max concurrent voice streams: ${MAX_CONCURRENT_VOICE_STREAMS}`);
    console.log(`   Stream duration: ${STREAM_DURATION_MIN}-${STREAM_DURATION_MAX} minutes`);
    console.log(`   Rotation interval: ${STREAM_ROTATION_INTERVAL / 60000} minutes`);

    await this.initializeStreams();

    this.schedulerInterval = setInterval(() => {
      this.checkAndRotateStreams();
    }, 5 * 60 * 1000);
  }

  stop() {
    this.isRunning = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    this.activeVoiceStreams.forEach((stream) => {
      this.endVoiceStream(stream.streamId, 'Service stopped');
    });
    this.activeVoiceStreams.clear();

    console.log('🎙️ Autonomous Avatar Voice Streaming Service stopped');
  }

  private async initializeStreams() {
    try {
      const avatars = await this.getAvailableAvatars();
      if (avatars.length === 0) {
        console.log('[Avatar Voice] No active avatars available');
        return;
      }

      const shuffled = avatars.sort(() => Math.random() - 0.5).slice(0, MAX_CONCURRENT_VOICE_STREAMS);
      
      for (const avatar of shuffled) {
        await this.startVoiceStream(avatar);
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (error) {
      console.error('[Avatar Voice] Error initializing streams:', error);
    }
  }

  private async getAvailableAvatars() {
    const avatars = await db.select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.isActive, true));

    return avatars.filter(a => !this.streamHistory.slice(-5).includes(a.id));
  }

  private async startVoiceStream(avatar: any): Promise<string | null> {
    try {
      console.log(`[Avatar Voice] 🎙️ Starting voice stream for ${avatar.name}`);

      const streamTypes = ['alpha_call', 'market_analysis', 'defi_deep_dive', 'ama'];
      const streamType = streamTypes[Math.floor(Math.random() * streamTypes.length)];
      
      const topic = await this.generateStreamTopic(avatar, streamType);
      const title = this.generateStreamTitle(avatar, streamType);

      const [stream] = await db.insert(liveStreams).values({
        title,
        description: `Live voice stream with ${avatar.name}. ${avatar.expertise || 'Crypto insights and market analysis.'}`,
        streamType: streamType === 'alpha_call' ? 'trading_room' : 
                   streamType === 'market_analysis' ? 'broadcast' :
                   streamType === 'defi_deep_dive' ? 'live_bounty' : 'audio_space',
        hostId: avatar.id,
        hostAvatarId: avatar.id,
        status: 'live',
        category: streamType === 'defi_deep_dive' ? 'defi' : 'crypto',
        tags: [avatar.name.toLowerCase().replace(/\s+/g, '-'), streamType, 'voice', 'live', 'alpha'],
        actualStart: new Date(),
        currentViewers: Math.floor(Math.random() * 100) + 50,
        thumbnailUrl: avatar.imageUrl,
      }).returning();

      const durationMinutes = Math.floor(Math.random() * (STREAM_DURATION_MAX - STREAM_DURATION_MIN)) + STREAM_DURATION_MIN;
      const scheduledEndTime = new Date(Date.now() + durationMinutes * 60 * 1000);

      const podcastEngine = new AvatarPodcastEngine();
      await podcastEngine.startPodcastSession(stream.id, avatar.id, topic);

      const activeStream: ActiveVoiceStream = {
        streamId: stream.id,
        avatarId: avatar.id,
        avatarName: avatar.name,
        podcastEngine,
        startTime: new Date(),
        scheduledEndTime,
        isActive: true,
      };

      this.activeVoiceStreams.set(stream.id, activeStream);
      this.streamHistory.push(avatar.id);
      if (this.streamHistory.length > 20) {
        this.streamHistory.shift();
      }

      console.log(`[Avatar Voice] ✅ ${avatar.name} is now LIVE with voice! Stream: ${stream.id.slice(0, 8)}...`);
      console.log(`   Topic: "${topic}"`);
      console.log(`   Duration: ${durationMinutes} minutes`);
      console.log(`   Ends at: ${scheduledEndTime.toLocaleTimeString()}`);

      this.scheduleStreamEnd(stream.id, durationMinutes);

      return stream.id;
    } catch (error) {
      console.error(`[Avatar Voice] Error starting stream for ${avatar.name}:`, error);
      return null;
    }
  }

  private async generateStreamTopic(avatar: any, streamType: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are creating a topic for a crypto live stream by ${avatar.name}.
Their expertise: ${avatar.expertise || 'crypto markets'}
Their investment thesis: ${avatar.investmentThesis || 'strategic investing'}
Stream type: ${streamType}

Generate a specific, engaging topic (5-10 words) that ${avatar.name} would discuss.
Just output the topic, nothing else.`
          },
          { role: 'user', content: 'Generate the stream topic:' }
        ],
        max_tokens: 30,
        temperature: 0.9,
      });

      return response.choices[0]?.message?.content?.trim() || 'Market Analysis and Alpha Insights';
    } catch (error) {
      console.error('[Avatar Voice] Topic generation error:', error);
      return 'Current Market Dynamics and Trading Opportunities';
    }
  }

  private generateStreamTitle(avatar: any, streamType: string): string {
    const templates = {
      alpha_call: [
        `🎯 LIVE: ${avatar.name} Drops Alpha`,
        `💎 ${avatar.name}'s Alpha Room - LIVE`,
        `⚡ ${avatar.name}: Real-Time Trade Calls`,
      ],
      market_analysis: [
        `📊 ${avatar.name}: Market Deep Dive`,
        `🧠 ${avatar.name}'s Market Insights - LIVE`,
        `📈 LIVE: ${avatar.name} Breaks Down The Charts`,
      ],
      defi_deep_dive: [
        `🔬 ${avatar.name}: DeFi Alpha Session`,
        `💰 ${avatar.name} Explores Yield Opportunities`,
        `⚗️ ${avatar.name}'s DeFi Research - LIVE`,
      ],
      ama: [
        `🎙️ AMA with ${avatar.name}`,
        `💬 ${avatar.name}: Ask Me Anything`,
        `🤝 Community Q&A with ${avatar.name}`,
      ],
    };

    const typeTemplates = templates[streamType as keyof typeof templates] || templates.market_analysis;
    return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
  }

  private scheduleStreamEnd(streamId: string, durationMinutes: number) {
    setTimeout(() => {
      this.endVoiceStream(streamId, 'Scheduled end');
    }, durationMinutes * 60 * 1000);
  }

  private async endVoiceStream(streamId: string, reason: string) {
    const stream = this.activeVoiceStreams.get(streamId);
    if (!stream) return;

    try {
      stream.isActive = false;
      await stream.podcastEngine.stopPodcastSession(streamId);

      await db.update(liveStreams)
        .set({
          status: 'ended',
          actualEnd: new Date(),
        })
        .where(eq(liveStreams.id, streamId));

      this.activeVoiceStreams.delete(streamId);

      const duration = Math.round((Date.now() - stream.startTime.getTime()) / 60000);
      console.log(`[Avatar Voice] 🔴 ${stream.avatarName}'s stream ended (${reason})`);
      console.log(`   Duration: ${duration} minutes`);
    } catch (error) {
      console.error(`[Avatar Voice] Error ending stream ${streamId}:`, error);
    }
  }

  private async checkAndRotateStreams() {
    if (!this.isRunning) return;

    try {
      const now = Date.now();
      
      const entries = Array.from(this.activeVoiceStreams.entries());
      for (const [streamId, stream] of entries) {
        if (now > stream.scheduledEndTime.getTime()) {
          await this.endVoiceStream(streamId, 'Duration exceeded');
        }
      }

      if (this.activeVoiceStreams.size < MAX_CONCURRENT_VOICE_STREAMS) {
        const avatars = await this.getAvailableAvatars();
        if (avatars.length > 0) {
          const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
          await this.startVoiceStream(randomAvatar);
        }
      }
    } catch (error) {
      console.error('[Avatar Voice] Rotation error:', error);
    }
  }

  getActiveStreams(): Array<{
    streamId: string;
    avatarName: string;
    startTime: Date;
    scheduledEndTime: Date;
  }> {
    return Array.from(this.activeVoiceStreams.values()).map(s => ({
      streamId: s.streamId,
      avatarName: s.avatarName,
      startTime: s.startTime,
      scheduledEndTime: s.scheduledEndTime,
    }));
  }

  async submitViewerQuestion(streamId: string, viewerId: string, viewerName: string, question: string): Promise<boolean> {
    const stream = this.activeVoiceStreams.get(streamId);
    if (!stream || !stream.isActive) return false;

    return stream.podcastEngine.addViewerQuestion(streamId, viewerId, viewerName, question);
  }
}

let serviceInstance: AutonomousAvatarStreamService | null = null;

export function initAutonomousAvatarStreamService(): AutonomousAvatarStreamService {
  if (!serviceInstance) {
    serviceInstance = new AutonomousAvatarStreamService();
  }
  return serviceInstance;
}

export function getAutonomousAvatarStreamService(): AutonomousAvatarStreamService | null {
  return serviceInstance;
}
