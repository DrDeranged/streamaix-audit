import { db } from '../db';
import { liveStreams, knowledgeAvatars, streamMessages } from '@shared/schema';
import { eq, sql, desc, and, ne } from 'drizzle-orm';
import { getStreamingService } from './streamingService';
import { AvatarVoiceService } from './avatarVoiceService';
import { AvatarPodcastEngine } from './avatarPodcastEngine';
import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

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
const MAX_CONCURRENT_VOICE_STREAMS = 1; // Reduced to 1 for testing - saves API costs

// Avatars allowed to use TTS even when PAUSE_OPENAI_API is true (for testing)
// Uses avatar handles (lowercase, no spaces)
const TTS_ENABLED_AVATARS = new Set([
  'haydenzadams',  // Hayden Adams - Uniswap founder
]);

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

    // DISABLED BY DEFAULT: Background TTS is expensive and should only run when explicitly enabled
    // Set ENABLE_BACKGROUND_TTS=true to enable continuous avatar voice streaming
    const enableBackgroundTTS = process.env.ENABLE_BACKGROUND_TTS === 'true';
    if (!enableBackgroundTTS || process.env.PAUSE_OPENAI_API === 'true' || process.env.DISABLE_OPENAI_TTS === 'true') {
      console.log('🎙️ [Avatar Voice] ⏸️ Background TTS disabled - voice streaming not started');
      console.log('   (Set ENABLE_BACKGROUND_TTS=true to enable continuous avatar voice streams)');
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
    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log(`[Avatar Voice] ⏸️ OpenAI API paused - skipping voice stream for ${avatar.name}`);
      return null;
    }

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

      // Pre-create WebSocket session so audio can be broadcast immediately
      const streamingService = getStreamingService();
      if (streamingService) {
        await streamingService.createAvatarStreamSession(stream.id);
      }

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

  // Check if an avatar is allowed to use TTS (for on-demand testing)
  isAvatarTtsEnabled(avatarHandle: string): boolean {
    const normalizedHandle = avatarHandle.toLowerCase().replace(/\s+/g, '');
    return TTS_ENABLED_AVATARS.has(normalizedHandle);
  }

  async activateVoiceForStream(streamId: string): Promise<boolean> {
    if (this.activeVoiceStreams.has(streamId)) {
      return true;
    }

    const streamingService = getStreamingService();

    // ON-DEMAND TTS: Only activate if there are REAL (human) viewers
    const realViewerCount = streamingService?.getRealViewerCount(streamId) || 0;
    if (realViewerCount === 0) {
      console.log(`[Avatar Voice] ⏸️ No real viewers in stream ${streamId.slice(0, 8)}... - TTS not activated (on-demand mode)`);
      return false;
    }

    // Check if we're at the limit and need to stop an empty stream
    if (this.activeVoiceStreams.size >= MAX_CONCURRENT_VOICE_STREAMS) {
      let stoppedEmpty = false;
      
      // Look for active voice streams with 0 real viewers
      const activeStreams = Array.from(this.activeVoiceStreams.entries());
      for (let i = 0; i < activeStreams.length; i++) {
        const [activeStreamId, activeStream] = activeStreams[i];
        const viewerCount = streamingService?.getRealViewerCount(activeStreamId) || 0;
        if (viewerCount === 0) {
          console.log(`[Avatar Voice] 🔄 Stopping empty stream ${activeStreamId.slice(0, 8)}... (${activeStream.avatarName}) to activate viewer's stream`);
          await this.endVoiceStream(activeStreamId, 'No real viewers - viewer priority');
          stoppedEmpty = true;
          break;
        }
      }
      
      if (!stoppedEmpty) {
        console.log(`[Avatar Voice] Cannot activate - all active streams have real viewers`);
        return false;
      }
    }

    try {
      const [streamRecord] = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId))
        .limit(1);

      if (!streamRecord?.hostAvatarId) {
        return false;
      }

      const [avatar] = await db.select()
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, streamRecord.hostAvatarId))
        .limit(1);

      if (!avatar) {
        return false;
      }

      // Check if this avatar is allowed to use TTS (even when API is paused)
      const avatarHandle = avatar.handle || avatar.name.toLowerCase().replace(/\s+/g, '');
      if (!this.isAvatarTtsEnabled(avatarHandle)) {
        console.log(`[Avatar Voice] ⏸️ Avatar ${avatar.name} (${avatarHandle}) is not TTS-enabled - voice not activated`);
        return false;
      }

      console.log(`[Avatar Voice] 🎙️ Activating ON-DEMAND voice for ${avatar.name}'s stream (${realViewerCount} real viewer(s) present)`);

      const topic = streamRecord.description || 'Current market dynamics and trading strategies';
      const durationMinutes = 60;
      const scheduledEndTime = new Date(Date.now() + durationMinutes * 60 * 1000);

      const streamingService = getStreamingService();
      if (streamingService) {
        await streamingService.createAvatarStreamSession(streamId);
      }

      const podcastEngine = new AvatarPodcastEngine();
      await podcastEngine.startPodcastSession(streamId, avatar.id, topic);

      const activeStream: ActiveVoiceStream = {
        streamId,
        avatarId: avatar.id,
        avatarName: avatar.name,
        podcastEngine,
        startTime: new Date(),
        scheduledEndTime,
        isActive: true,
      };

      this.activeVoiceStreams.set(streamId, activeStream);

      console.log(`[Avatar Voice] ✅ ${avatar.name}'s stream now has voice enabled!`);

      this.scheduleStreamEnd(streamId, durationMinutes);

      return true;
    } catch (error) {
      console.error(`[Avatar Voice] Error activating voice for stream ${streamId}:`, error);
      return false;
    }
  }

  isVoiceActiveForStream(streamId: string): boolean {
    return this.activeVoiceStreams.has(streamId);
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
