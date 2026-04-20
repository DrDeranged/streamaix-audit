import { db } from '../db';
import { liveStreams, knowledgeAvatars, streamRecordings, streamConversationMessages } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getStreamingService } from './streamingService';
import { MarketDataService } from './marketDataService';
import { AvatarVoiceService } from './avatarVoiceService';
import { pushNotificationService } from './pushNotificationService';
import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
import * as cron from 'node-cron';

// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

// In-memory audio storage for scheduled stream replays
const scheduledStreamAudio = new Map<string, string>(); // streamId -> base64 audio

interface ScheduledStream {
  id: string;
  type: 'morning_update' | 'market_close';
  avatarId: string;
  avatarName: string;
  startTime: Date;
  endTime: Date;
  transcript: string[];
  status: 'scheduled' | 'live' | 'ended' | 'failed';
}

interface MarketSummaryData {
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
  topMovers: Array<{ symbol: string; name: string; change: number }>;
  topLosers: Array<{ symbol: string; name: string; change: number }>;
  totalMarketCap: number;
  marketCapChange24h: number;
  fearGreedIndex: number;
  stockHighlights: Array<{ symbol: string; price: number; change: number }>;
  newsHighlights: string[];
}

interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
  marketCap?: number;
}

const STREAM_DURATION_SECONDS = 150;

export class ScheduledMarketStreamService {
  private isRunning = false;
  private marketDataService: MarketDataService;
  private morningCron: ReturnType<typeof cron.schedule> | null = null;
  private eveningCron: ReturnType<typeof cron.schedule> | null = null;
  private activeStream: ScheduledStream | null = null;

  constructor() {
    this.marketDataService = MarketDataService.getInstance();
  }

  private async ensureSchema(): Promise<void> {
    try {
      await db.execute(`
        ALTER TABLE stream_recordings 
        ADD COLUMN IF NOT EXISTS ipfs_hash TEXT;
      `);
      await db.execute(`
        ALTER TABLE stream_recordings 
        ADD COLUMN IF NOT EXISTS arweave_id TEXT;
      `);
      await db.execute(`
        ALTER TABLE stream_recordings 
        ADD COLUMN IF NOT EXISTS is_clip BOOLEAN DEFAULT false;
      `);
      console.log('[Scheduled Streams] ✅ Database schema verified');
    } catch (error) {
      console.log('[Scheduled Streams] Schema check completed (columns may already exist)');
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('[Scheduled Streams] Already running');
      return;
    }

    await this.ensureSchema();

    this.isRunning = true;
    console.log('📅 Scheduled Market Stream Service started');
    console.log('   Morning Update: 8:00 AM EST daily');
    console.log('   Market Close: 4:00 PM EST daily');

    this.morningCron = cron.schedule('0 8 * * 1-5', async () => {
      console.log('[Scheduled Streams] 🌅 Starting 8 AM Morning Market Update');
      await this.runScheduledStream('morning_update');
    }, {
      timezone: 'America/New_York'
    });

    this.eveningCron = cron.schedule('0 16 * * 1-5', async () => {
      console.log('[Scheduled Streams] 🌙 Starting 4 PM Market Close Update');
      await this.runScheduledStream('market_close');
    }, {
      timezone: 'America/New_York'
    });

    console.log('[Scheduled Streams] ✅ Cron jobs scheduled');

    // Check for missed streams on startup (runs in background)
    setImmediate(() => this.checkAndRunMissedStreams());
  }

  private async checkAndRunMissedStreams(): Promise<void> {
    try {
      // Get current time in EST
      const now = new Date();
      const estFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const estParts = estFormatter.formatToParts(now);
      const estHour = parseInt(estParts.find(p => p.type === 'hour')?.value || '0');
      const estMinute = parseInt(estParts.find(p => p.type === 'minute')?.value || '0');
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log('[Scheduled Streams] 📅 Weekend - skipping missed stream check');
        return;
      }

      console.log(`[Scheduled Streams] 🔍 Checking for missed streams (EST: ${estHour}:${estMinute.toString().padStart(2, '0')})`);

      // Get today's date in EST for database lookup
      const estDateStr = `${estParts.find(p => p.type === 'year')?.value}-${estParts.find(p => p.type === 'month')?.value}-${estParts.find(p => p.type === 'day')?.value}`;

      // Check today's streams in database
      const todayStart = new Date(estDateStr + 'T00:00:00-05:00');
      const todayEnd = new Date(estDateStr + 'T23:59:59-05:00');

      const todayStreams = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.category, 'market_update'));

      const todayMarketStreams = todayStreams.filter(s => {
        const streamDate = new Date(s.actualStart || s.scheduledStart || s.createdAt || new Date());
        return streamDate >= todayStart && streamDate <= todayEnd;
      });

      const hasMorningStream = todayMarketStreams.some(s => 
        s.title?.toLowerCase().includes('morning') || s.tags?.includes('morning_update')
      );
      const hasCloseStream = todayMarketStreams.some(s => 
        s.title?.toLowerCase().includes('close') || s.title?.toLowerCase().includes('recap') || s.tags?.includes('market_close')
      );

      // Morning update: If it's past 8am EST and before 4pm, and no morning stream exists
      if (estHour >= 8 && estHour < 16 && !hasMorningStream) {
        console.log('[Scheduled Streams] 🌅 RECOVERY: Running missed Morning Update');
        await this.runScheduledStream('morning_update');
      } else if (hasMorningStream) {
        console.log('[Scheduled Streams] ✅ Morning Update already ran today');
      }

      // Market close: If it's past 4pm EST and no close stream exists  
      if (estHour >= 16 && !hasCloseStream) {
        console.log('[Scheduled Streams] 🌙 RECOVERY: Running missed Market Close Update');
        await this.runScheduledStream('market_close');
      } else if (hasCloseStream) {
        console.log('[Scheduled Streams] ✅ Market Close already ran today');
      }

      console.log('[Scheduled Streams] 🔍 Missed stream check complete');
    } catch (error) {
      console.error('[Scheduled Streams] Error checking missed streams:', error);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.morningCron) {
      this.morningCron.stop();
      this.morningCron = null;
    }
    if (this.eveningCron) {
      this.eveningCron.stop();
      this.eveningCron = null;
    }
    console.log('📅 Scheduled Market Stream Service stopped');
  }

  async runScheduledStream(type: 'morning_update' | 'market_close'): Promise<string | null> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log(`[Scheduled Streams] ⏸️ OpenAI API paused - skipping ${type}`);
      return null;
    }

    try {
      const avatar = await this.selectRandomAvatar();
      if (!avatar) {
        console.error('[Scheduled Streams] No available avatars');
        return null;
      }

      console.log(`[Scheduled Streams] 🎙️ ${avatar.name} will host the ${type === 'morning_update' ? 'Morning Update' : 'Market Close'}`);

      const marketData = await this.fetchMarketData();
      
      const streamTitle = type === 'morning_update' 
        ? `🌅 Morning Market Update with ${avatar.name}`
        : `🌙 Market Close Recap with ${avatar.name}`;

      const [stream] = await db.insert(liveStreams).values({
        title: streamTitle,
        description: type === 'morning_update' 
          ? `Daily 8 AM market briefing covering overnight crypto moves, stock futures, and key events for the day ahead.`
          : `End of day market recap covering crypto performance, stock close, and overnight outlook.`,
        streamType: 'broadcast',
        hostId: avatar.id,
        hostAvatarId: avatar.id,
        status: 'scheduled',
        category: 'market_update',
        tags: [type, 'daily', 'market-update', 'scheduled', avatar.name.toLowerCase().replace(/\s+/g, '-')],
        actualStart: new Date(),
        currentViewers: 0,
        thumbnailUrl: avatar.imageUrl,
        scheduledStart: new Date(),
      }).returning();

      this.activeStream = {
        id: stream.id,
        type,
        avatarId: avatar.id,
        avatarName: avatar.name,
        startTime: new Date(),
        endTime: new Date(Date.now() + STREAM_DURATION_SECONDS * 1000),
        transcript: [],
        status: 'scheduled'
      };

      const streamingService = getStreamingService();
      if (streamingService) {
        await streamingService.createAvatarStreamSession(stream.id);
      }

      console.log(`[Scheduled Streams] 📝 Step 1: Stream created with status 'scheduled' - pre-recording phase`);

      // Step 2: Generate commentary (pre-recording)
      const commentary = await this.generateMarketCommentary(avatar, type, marketData);
      console.log(`[Scheduled Streams] 📝 Step 2: Commentary generated (${commentary.length} segments)`);
      
      // Step 3: Deliver commentary (generates TTS, saves messages to DB)
      await this.deliverCommentary(stream.id, avatar, commentary);
      console.log(`[Scheduled Streams] 📝 Step 3: Commentary delivered and saved to DB`);

      // Step 4: Save stream recording with audio to DB (without setting status to 'ended')
      await this.saveStreamRecording(stream.id, avatar);
      console.log(`[Scheduled Streams] 📝 Step 4: Stream recording saved to DB`);

      // Step 5: Set stream status to 'live' now that everything is pre-recorded
      await db.update(liveStreams)
        .set({ status: 'live' })
        .where(eq(liveStreams.id, stream.id));
      if (this.activeStream) {
        this.activeStream.status = 'live';
      }
      console.log(`[Scheduled Streams] 📝 Step 5: Stream status set to 'live' - going live!`);

      // Step 6: Send push notifications now that stream is live with all content ready
      try {
        const streamTypeLabel = type === 'morning_update' ? 'Morning Market Update' : 'Market Close Recap';
        await pushNotificationService.sendToAll({
          title: `📺 ${streamTypeLabel} is LIVE!`,
          body: `${avatar.name} is hosting the daily ${streamTypeLabel}. Join now to hear the latest market insights!`,
          url: `/stream/${stream.id}`,
          icon: avatar.imageUrl || '/icon-192.png',
          tag: `scheduled-stream-${stream.id}`,
          requireInteraction: true,
          actions: [
            { action: 'watch_now', title: '👁️ Watch Now' },
            { action: 'remind_later', title: '⏰ Later' }
          ],
          timestamp: Date.now(),
          data: { 
            type: 'stream_live', 
            streamId: stream.id, 
            streamerName: avatar.name, 
            streamType: 'broadcast',
            streamTitle 
          }
        }, 'stream_live');
        console.log(`[Scheduled Streams] 🔔 Step 6: Push notifications sent for ${streamTitle}`);
      } catch (pushError) {
        console.error('[Scheduled Streams] ⚠️ Failed to send push notifications:', pushError);
      }

      // Step 7: Schedule auto-end timer (10 minutes)
      const autoEndMs = 10 * 60 * 1000;
      console.log(`[Scheduled Streams] ⏰ Step 7: Auto-end timer set for 10 minutes`);
      setTimeout(async () => {
        try {
          await db.update(liveStreams)
            .set({ status: 'ended', actualEnd: new Date() })
            .where(eq(liveStreams.id, stream.id));
          this.activeStream = null;
          console.log(`[Scheduled Streams] ✅ Stream ${stream.id.slice(0, 8)}... auto-ended after 10 minutes`);
        } catch (err) {
          console.error(`[Scheduled Streams] ⚠️ Error auto-ending stream:`, err);
        }
      }, autoEndMs);

      return stream.id;
    } catch (error) {
      console.error(`[Scheduled Streams] Error running ${type}:`, error);
      if (this.activeStream) {
        this.activeStream.status = 'failed';
      }
      return null;
    }
  }

  private async selectRandomAvatar(): Promise<any> {
    const avatars = await db.select()
      .from(knowledgeAvatars)
      .where(eq(knowledgeAvatars.isActive, true));

    if (avatars.length === 0) return null;
    
    const marketExperts = avatars.filter(a => 
      a.expertise?.toLowerCase().includes('trading') ||
      a.expertise?.toLowerCase().includes('market') ||
      a.expertise?.toLowerCase().includes('defi') ||
      a.expertise?.toLowerCase().includes('crypto') ||
      a.category === 'trading' ||
      a.category === 'defi'
    );

    const pool = marketExperts.length > 0 ? marketExperts : avatars;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private async fetchMarketData(): Promise<MarketSummaryData> {
    try {
      const [cryptoPrices, stockPrices] = await Promise.all([
        this.marketDataService.getTopCryptos(20) as Promise<CryptoQuote[]>,
        this.marketDataService.getCryptoStocks().catch(() => [])
      ]);

      const btc = cryptoPrices.find(c => c.symbol === 'BTC') || { price: 0, percentChange24h: 0 };
      const eth = cryptoPrices.find(c => c.symbol === 'ETH') || { price: 0, percentChange24h: 0 };

      const sortedByChange = [...cryptoPrices].sort((a, b) => b.percentChange24h - a.percentChange24h);
      const topMovers = sortedByChange.slice(0, 3).map(c => ({
        symbol: c.symbol,
        name: c.name,
        change: c.percentChange24h
      }));
      const topLosers = sortedByChange.slice(-3).reverse().map(c => ({
        symbol: c.symbol,
        name: c.name,
        change: c.percentChange24h
      }));

      const totalMarketCap = cryptoPrices.reduce((sum, c) => sum + (c.marketCap || 0), 0);

      let fearGreedIndex = 50;
      try {
        const fgResponse = await fetch('https://api.alternative.me/fng/?limit=1');
        const fgData = await fgResponse.json();
        fearGreedIndex = parseInt(fgData.data?.[0]?.value || '50');
      } catch (e) {
        console.log('[Scheduled Streams] Fear & Greed API unavailable, using neutral');
      }

      const stockHighlights = (stockPrices || []).slice(0, 5).map((s: any) => ({
        symbol: s.symbol,
        price: s.price,
        change: s.percentChange24h || 0
      }));

      return {
        btcPrice: btc.price,
        btcChange24h: btc.percentChange24h,
        ethPrice: eth.price,
        ethChange24h: eth.percentChange24h,
        topMovers,
        topLosers,
        totalMarketCap,
        marketCapChange24h: btc.percentChange24h,
        fearGreedIndex,
        stockHighlights,
        newsHighlights: []
      };
    } catch (error) {
      console.error('[Scheduled Streams] Error fetching market data:', error);
      return {
        btcPrice: 0,
        btcChange24h: 0,
        ethPrice: 0,
        ethChange24h: 0,
        topMovers: [],
        topLosers: [],
        totalMarketCap: 0,
        marketCapChange24h: 0,
        fearGreedIndex: 50,
        stockHighlights: [],
        newsHighlights: []
      };
    }
  }

  private async generateMarketCommentary(
    avatar: any, 
    type: 'morning_update' | 'market_close',
    data: MarketSummaryData
  ): Promise<string[]> {
    const timeOfDay = type === 'morning_update' ? 'morning' : 'evening';
    const greeting = type === 'morning_update' 
      ? "Good morning everyone, welcome to your daily market briefing."
      : "Good evening traders, let's wrap up the day's market action.";

    const prompt = `You are ${avatar.name}, a ${avatar.expertise || 'crypto market analyst'} hosting a ${type === 'morning_update' ? 'morning market update' : 'market close recap'}.

Generate a 2-3 minute spoken commentary (about 350-450 words) covering today's market. Use the following REAL market data:

CRYPTO DATA:
- Bitcoin: $${data.btcPrice.toLocaleString()} (${data.btcChange24h >= 0 ? '+' : ''}${data.btcChange24h.toFixed(2)}% 24h)
- Ethereum: $${data.ethPrice.toLocaleString()} (${data.ethChange24h >= 0 ? '+' : ''}${data.ethChange24h.toFixed(2)}% 24h)
- Top Gainers: ${data.topMovers.map(m => `${m.symbol} ${m.change >= 0 ? '+' : ''}${m.change.toFixed(1)}%`).join(', ')}
- Top Losers: ${data.topLosers.map(m => `${m.symbol} ${m.change.toFixed(1)}%`).join(', ')}
- Total Crypto Market Cap: $${(data.totalMarketCap / 1e12).toFixed(2)}T
- Fear & Greed Index: ${data.fearGreedIndex} (${data.fearGreedIndex < 25 ? 'Extreme Fear' : data.fearGreedIndex < 45 ? 'Fear' : data.fearGreedIndex < 55 ? 'Neutral' : data.fearGreedIndex < 75 ? 'Greed' : 'Extreme Greed'})

STOCK DATA:
${data.stockHighlights.map(s => `- ${s.symbol}: $${s.price.toFixed(2)} (${s.change >= 0 ? '+' : ''}${s.change.toFixed(1)}%)`).join('\n')}

STRUCTURE YOUR COMMENTARY AS:
1. ${greeting}
2. Bitcoin & Ethereum overview with the exact prices above
3. Notable movers and market sentiment
4. Brief stock market context (crypto-related stocks)
5. ${type === 'morning_update' ? 'Key events to watch today' : 'What to expect overnight'}
6. Closing thoughts and sign-off

IMPORTANT RULES:
- Use the EXACT prices and percentages provided - do not make up numbers
- Speak naturally as if live on stream
- Be engaging but professional
- Include specific numbers from the data
- Match ${avatar.name}'s personality and expertise
- End with "This is ${avatar.name}, see you ${type === 'morning_update' ? 'at market close' : 'tomorrow morning'}. Stay profitable."

Return the commentary as a single flowing script, broken into 4-6 paragraphs for pacing.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      });

      const fullCommentary = response.choices[0]?.message?.content || '';
      const paragraphs = fullCommentary.split('\n\n').filter(p => p.trim().length > 0);
      
      console.log(`[Scheduled Streams] Generated ${paragraphs.length} commentary segments (${fullCommentary.length} chars)`);
      
      return paragraphs.length > 0 ? paragraphs : [greeting, "Markets are showing mixed signals today. Stay tuned for more updates."];
    } catch (error) {
      console.error('[Scheduled Streams] Error generating commentary:', error);
      return [
        greeting,
        `Bitcoin is currently trading at $${data.btcPrice.toLocaleString()}, ${data.btcChange24h >= 0 ? 'up' : 'down'} ${Math.abs(data.btcChange24h).toFixed(1)}% over the past 24 hours.`,
        `Ethereum follows at $${data.ethPrice.toLocaleString()}, ${data.ethChange24h >= 0 ? 'gaining' : 'losing'} ${Math.abs(data.ethChange24h).toFixed(1)}%.`,
        `This is ${avatar.name}, stay profitable and see you next time.`
      ];
    }
  }

  private async deliverCommentary(streamId: string, avatar: any, segments: string[]): Promise<string | null> {
    const streamingService = getStreamingService();
    const delayPerSegment = Math.floor((STREAM_DURATION_SECONDS * 1000) / segments.length);
    
    // Combine all segments into one text for TTS (more cost-effective than multiple calls)
    const fullCommentary = segments.join('\n\n');
    let audioBase64: string | null = null;
    
    // Generate TTS audio for the full commentary
    // Use forceGenerate to bypass DISABLE_OPENAI_TTS for scheduled streams
    try {
      console.log(`[Scheduled Streams] 🎙️ Generating TTS audio for ${avatar.name} (${fullCommentary.length} chars)`);
      audioBase64 = await AvatarVoiceService.textToSpeechBase64(fullCommentary, avatar.name, { forceGenerate: true });
      console.log(`[Scheduled Streams] ✅ TTS audio generated (${(audioBase64.length / 1024).toFixed(1)} KB)`);
      
      // Store audio in memory for replay
      scheduledStreamAudio.set(streamId, audioBase64);
    } catch (error) {
      console.error(`[Scheduled Streams] ⚠️ TTS generation failed, continuing with text-only:`, error);
    }

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Broadcast to WebSocket clients
      if (streamingService) {
        streamingService.sendAiMessage(streamId, avatar.id, avatar.name, segment);
      }

      // Save message to database for replay
      try {
        await db.insert(streamConversationMessages).values({
          streamId,
          participantId: avatar.id,
          speakerType: 'avatar',
          speakerAvatarId: avatar.id,
          speakerName: avatar.name,
          textContent: segment,
          sourceType: 'scheduled_stream',
        });
      } catch (err) {
        console.error('[Scheduled Streams] Error saving message to DB:', err);
      }

      if (this.activeStream) {
        this.activeStream.transcript.push(segment);
      }

      console.log(`[Scheduled Streams] 📢 ${avatar.name}: "${segment.slice(0, 80)}..."`);

      if (i < segments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayPerSegment));
      }
    }
    
    return audioBase64;
  }

  private async saveStreamRecording(streamId: string, avatar: any): Promise<void> {
    const now = new Date();
    const startTime = this.activeStream?.startTime || new Date(Date.now() - STREAM_DURATION_SECONDS * 1000);
    const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const audioData = scheduledStreamAudio.get(streamId) || null;
    
    await db.insert(streamRecordings).values({
      streamId,
      recordingUrl: `/api/streams/${streamId}/replay`,
      thumbnailUrl: avatar.imageUrl,
      durationSeconds,
      status: 'ready',
      audioData,
    });

    if (audioData) {
      console.log(`[Scheduled Streams] 💾 Audio saved to database (${(audioData.length / 1024).toFixed(1)} KB)`);
      setTimeout(() => scheduledStreamAudio.delete(streamId), 60000);
    }

    console.log(`[Scheduled Streams] ✅ Recording for stream ${streamId.slice(0, 8)}... saved (${durationSeconds}s)`);
  }

  private async endAndSaveStream(streamId: string, avatar: any, transcript: string[]): Promise<void> {
    const endTime = new Date();
    const startTime = this.activeStream?.startTime || new Date(Date.now() - STREAM_DURATION_SECONDS * 1000);
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await db.update(liveStreams)
      .set({
        status: 'ended',
        actualEnd: endTime,
        totalViews: 0,
      })
      .where(eq(liveStreams.id, streamId));

    const audioData = scheduledStreamAudio.get(streamId) || null;
    
    await db.insert(streamRecordings).values({
      streamId,
      recordingUrl: `/api/streams/${streamId}/replay`,
      thumbnailUrl: avatar.imageUrl,
      durationSeconds,
      status: 'ready',
      audioData,
    });

    if (audioData) {
      console.log(`[Scheduled Streams] 💾 Audio saved to database (${(audioData.length / 1024).toFixed(1)} KB)`);
      setTimeout(() => scheduledStreamAudio.delete(streamId), 60000);
    }

    console.log(`[Scheduled Streams] ✅ Stream ${streamId.slice(0, 8)}... saved for replay (${durationSeconds}s)`);
    
    this.activeStream = null;
  }

  async getUpcomingSchedule(): Promise<Array<{ type: string; nextRun: Date; streamId?: string; status: 'upcoming' | 'completed' }>> {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Get today's completed market streams
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayStreams = await db.select({
      id: liveStreams.id,
      title: liveStreams.title,
      tags: liveStreams.tags,
      actualStart: liveStreams.actualStart,
      status: liveStreams.status,
    })
    .from(liveStreams)
    .where(eq(liveStreams.category, 'market_update'));
    
    const completedToday = todayStreams.filter(s => {
      const streamDate = new Date(s.actualStart || new Date());
      return streamDate >= todayStart && streamDate <= todayEnd && s.status === 'ended';
    });
    
    const morningStreamToday = completedToday.find(s => 
      s.title?.toLowerCase().includes('morning') || s.tags?.includes('morning_update')
    );
    const closeStreamToday = completedToday.find(s => 
      s.title?.toLowerCase().includes('close') || s.title?.toLowerCase().includes('recap') || s.tags?.includes('market_close')
    );
    
    const schedule: Array<{ type: string; nextRun: Date; streamId?: string; status: 'upcoming' | 'completed' }> = [];
    
    const morning = new Date(today);
    morning.setHours(8, 0, 0, 0);
    
    if (morningStreamToday) {
      // Morning stream already completed today - show as completed with link
      schedule.push({ type: 'morning_update', nextRun: morning, streamId: morningStreamToday.id, status: 'completed' });
    } else if (morning > now) {
      // Morning stream upcoming today
      schedule.push({ type: 'morning_update', nextRun: morning, status: 'upcoming' });
    } else {
      // Morning time passed but no stream - show next day
      const nextMorning = new Date(morning);
      nextMorning.setDate(nextMorning.getDate() + 1);
      schedule.push({ type: 'morning_update', nextRun: nextMorning, status: 'upcoming' });
    }
    
    const evening = new Date(today);
    evening.setHours(16, 0, 0, 0);
    
    if (closeStreamToday) {
      // Market close stream already completed today - show as completed with link
      schedule.push({ type: 'market_close', nextRun: evening, streamId: closeStreamToday.id, status: 'completed' });
    } else if (evening > now) {
      // Market close stream upcoming today
      schedule.push({ type: 'market_close', nextRun: evening, status: 'upcoming' });
    } else {
      // Evening time passed but no stream - show next day
      const nextEvening = new Date(evening);
      nextEvening.setDate(nextEvening.getDate() + 1);
      schedule.push({ type: 'market_close', nextRun: nextEvening, status: 'upcoming' });
    }
    
    return schedule.sort((a, b) => {
      // Show completed first, then by time
      if (a.status === 'completed' && b.status !== 'completed') return -1;
      if (a.status !== 'completed' && b.status === 'completed') return 1;
      return a.nextRun.getTime() - b.nextRun.getTime();
    });
  }

  async getRecentReplays(limit: number = 10): Promise<any[]> {
    const replays = await db.select({
      id: streamRecordings.id,
      streamId: streamRecordings.streamId,
      recordingUrl: streamRecordings.recordingUrl,
      thumbnailUrl: streamRecordings.thumbnailUrl,
      durationSeconds: streamRecordings.durationSeconds,
      status: streamRecordings.status,
      createdAt: streamRecordings.createdAt,
      streamTitle: liveStreams.title,
      streamDescription: liveStreams.description,
      streamType: liveStreams.streamType,
      hostAvatarId: liveStreams.hostAvatarId,
    })
    .from(streamRecordings)
    .innerJoin(liveStreams, eq(streamRecordings.streamId, liveStreams.id))
    .where(eq(streamRecordings.status, 'ready'))
    .orderBy(desc(streamRecordings.createdAt))
    .limit(limit);

    return replays;
  }
}

let serviceInstance: ScheduledMarketStreamService | null = null;

export function initScheduledMarketStreamService(): ScheduledMarketStreamService {
  if (!serviceInstance) {
    serviceInstance = new ScheduledMarketStreamService();
  }
  return serviceInstance;
}

export function getScheduledMarketStreamService(): ScheduledMarketStreamService | null {
  return serviceInstance;
}

// Get TTS audio for a scheduled stream replay
export function getScheduledStreamAudio(streamId: string): string | null {
  return scheduledStreamAudio.get(streamId) || null;
}

// Check if audio exists for a stream
export function hasScheduledStreamAudio(streamId: string): boolean {
  return scheduledStreamAudio.has(streamId);
}
