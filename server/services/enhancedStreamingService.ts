import OpenAI from 'openai';
import { db } from '../db';
import { 
  liveStreams, streamMessages, streamParticipants, streamTips, streamPredictions, 
  streamRecordings, users, pushSubscriptions, predictionMarkets,
  streamQuestions, streamDebates, debateVotes, streamInvitations,
  scheduledStreams, streamAlerts, userStreamSettings, cachedAudioPhrases, knowledgeAvatars
} from '@shared/schema';
import { eq, and, desc, gt, sql, ne, isNull } from 'drizzle-orm';
import { getStreamingService } from './streamingService';
import { AvatarVoiceService } from './avatarVoiceService';
import webpush from 'web-push';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface KeyMoment {
  timestamp: number;
  description: string;
  type: 'insight' | 'prediction' | 'highlight' | 'milestone';
  confidence?: number;
}

interface StreamHighlight {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  type: 'key_moment' | 'prediction' | 'tip_surge' | 'viewer_spike';
}

interface RealViewerInfo {
  userId: string;
  username: string;
  isAiAgent: boolean;
  joinedAt: Date;
}

interface DebateParticipant {
  type: 'user' | 'avatar';
  id: string;
  name: string;
  position: string;
}

export class EnhancedStreamingService {
  private marketDataCache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private aiCommentaryInterval: Map<string, NodeJS.Timeout> = new Map();
  private realViewerCache = new Map<string, Map<string, RealViewerInfo>>();
  private ttsActivatedStreams = new Set<string>();
  private priceAlertThreshold = 2.0;

  async generateAIMarketCommentary(streamId: string): Promise<string | null> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      return null;
    }
    
    try {
      const [stream] = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId))
        .limit(1);

      if (!stream || stream.status !== 'live') return null;

      const marketData = await this.getMarketData(['BTC', 'ETH', 'SOL']);
      
      const prompt = `You are a crypto market analyst providing live commentary for a streaming show called "${stream.title}". 
      
Current market data:
${marketData.map(m => `- ${m.symbol}: $${m.price.toLocaleString()} (${m.change24h > 0 ? '+' : ''}${m.change24h.toFixed(2)}% 24h)`).join('\n')}

Stream category: ${stream.category || 'crypto'}
Stream tags: ${stream.tags?.join(', ') || 'general crypto'}

Generate a brief, engaging market update (2-3 sentences max) that would be relevant to the stream's audience. Be conversational and include one actionable insight. Don't use emojis excessively.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('[EnhancedStreaming] Error generating AI commentary:', error);
      return null;
    }
  }

  async startAICommentary(streamId: string, intervalMinutes: number = 5): Promise<boolean> {
    if (this.aiCommentaryInterval.has(streamId)) {
      return true;
    }

    const streamingService = getStreamingService();
    if (!streamingService) return false;

    const sendCommentary = async () => {
      const commentary = await this.generateAIMarketCommentary(streamId);
      if (commentary) {
        await streamingService.sendAiMessage(
          streamId,
          'ai-market-analyst',
          'MarketBot',
          `📊 ${commentary}`
        );
      }
    };

    await sendCommentary();
    
    const interval = setInterval(sendCommentary, intervalMinutes * 60 * 1000);
    this.aiCommentaryInterval.set(streamId, interval);
    
    return true;
  }

  stopAICommentary(streamId: string): void {
    const interval = this.aiCommentaryInterval.get(streamId);
    if (interval) {
      clearInterval(interval);
      this.aiCommentaryInterval.delete(streamId);
    }
  }

  async extractStreamHighlights(streamId: string): Promise<StreamHighlight[]> {
    try {
      const messages = await db.select()
        .from(streamMessages)
        .where(eq(streamMessages.streamId, streamId))
        .orderBy(streamMessages.createdAt);

      const tips = await db.select()
        .from(streamTips)
        .where(eq(streamTips.streamId, streamId))
        .orderBy(streamTips.createdAt);

      const predictions = await db.select()
        .from(streamPredictions)
        .where(eq(streamPredictions.streamId, streamId))
        .orderBy(streamPredictions.createdAt);

      const highlights: StreamHighlight[] = [];

      if (tips.length >= 3) {
        const tipTimes = tips.slice(0, 3).map(t => new Date(t.createdAt!).getTime());
        const avgTime = tipTimes.reduce((a, b) => a + b, 0) / tipTimes.length;
        
        highlights.push({
          id: `tip-surge-${streamId}`,
          startTime: Math.min(...tipTimes) / 1000,
          endTime: Math.max(...tipTimes) / 1000 + 30,
          title: 'Tip Surge',
          description: `${tips.slice(0, 3).reduce((sum, t) => sum + t.amount, 0)} STREAM tips received`,
          type: 'tip_surge',
        });
      }

      for (const prediction of predictions.slice(0, 5)) {
        if (prediction.upvotes && prediction.upvotes >= 3) {
          highlights.push({
            id: `prediction-${prediction.id}`,
            startTime: prediction.timestamp || 0,
            endTime: (prediction.timestamp || 0) + 60,
            title: 'Popular Prediction',
            description: prediction.predictionText,
            type: 'prediction',
          });
        }
      }

      return highlights;
    } catch (error) {
      console.error('[EnhancedStreaming] Error extracting highlights:', error);
      return [];
    }
  }

  async generateStreamSummary(streamId: string): Promise<string | null> {
    try {
      const [stream] = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId))
        .limit(1);

      if (!stream) return null;

      const messages = await db.select()
        .from(streamMessages)
        .where(eq(streamMessages.streamId, streamId))
        .orderBy(streamMessages.createdAt)
        .limit(200);

      const predictions = await db.select()
        .from(streamPredictions)
        .where(eq(streamPredictions.streamId, streamId));

      const tips = await db.select()
        .from(streamTips)
        .where(eq(streamTips.streamId, streamId));

      const chatContent = messages.map(m => m.content).join('\n').slice(0, 3000);

      const prompt = `Summarize this live crypto stream for replay viewers:

Stream Title: ${stream.title}
Category: ${stream.category || 'General'}
Duration: ${stream.durationSeconds ? Math.round(stream.durationSeconds / 60) : 'N/A'} minutes
Peak Viewers: ${stream.peakViewers || 0}
Total Tips: ${tips.reduce((sum, t) => sum + t.amount, 0)} STREAM

Chat Highlights:
${chatContent}

Predictions Made: ${predictions.length}
${predictions.slice(0, 5).map(p => `- ${p.predictionText}`).join('\n')}

Create a concise 3-4 sentence summary highlighting the main topics discussed, key market insights shared, and any notable predictions made. This will be shown to users who missed the stream.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
        temperature: 0.7,
      });

      const summary = response.choices[0]?.message?.content;
      
      if (summary) {
        await db.update(liveStreams)
          .set({ aiSummary: summary })
          .where(eq(liveStreams.id, streamId));
      }

      return summary;
    } catch (error) {
      console.error('[EnhancedStreaming] Error generating summary:', error);
      return null;
    }
  }

  async extractKeyMoments(streamId: string, messages: string[]): Promise<KeyMoment[]> {
    try {
      const chatContent = messages.slice(-100).join('\n').slice(0, 2000);
      
      if (chatContent.length < 100) return [];

      const prompt = `Analyze this live stream chat and identify 3-5 key moments worth highlighting:

${chatContent}

Return a JSON array of key moments with this format:
[
  {
    "timestamp": 0,
    "description": "Brief description of what happened",
    "type": "insight" | "prediction" | "highlight" | "milestone",
    "confidence": 85
  }
]

Focus on: market insights, price predictions, important announcements, and viewer engagement spikes.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const keyMoments = JSON.parse(jsonMatch[0]) as KeyMoment[];
      
      await db.update(liveStreams)
        .set({ keyMoments: keyMoments })
        .where(eq(liveStreams.id, streamId));

      return keyMoments;
    } catch (error) {
      console.error('[EnhancedStreaming] Error extracting key moments:', error);
      return [];
    }
  }

  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    const results: MarketData[] = [];
    
    for (const symbol of symbols) {
      const cached = this.marketDataCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < 60000) {
        results.push(cached.data);
        continue;
      }

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinGeckoId(symbol)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
        );
        const data = await response.json();
        const coinId = this.getCoinGeckoId(symbol);
        
        if (data[coinId]) {
          const marketData: MarketData = {
            symbol,
            price: data[coinId].usd || 0,
            change24h: data[coinId].usd_24h_change || 0,
            volume24h: data[coinId].usd_24h_vol || 0,
          };
          
          this.marketDataCache.set(symbol, { data: marketData, timestamp: Date.now() });
          results.push(marketData);
        }
      } catch (error) {
        console.error(`[EnhancedStreaming] Error fetching ${symbol} data:`, error);
        results.push({ symbol, price: 0, change24h: 0, volume24h: 0 });
      }
    }
    
    return results;
  }

  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
      'DOT': 'polkadot',
      'ADA': 'cardano',
      'XRP': 'ripple',
    };
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  async sendGoLiveNotification(streamId: string): Promise<number> {
    try {
      const [stream] = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId))
        .limit(1);

      if (!stream) return 0;

      const host = await db.select()
        .from(users)
        .where(eq(users.id, stream.hostId))
        .limit(1);

      if (!host[0]) return 0;

      const subscriptions = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true));

      const payload = JSON.stringify({
        title: `${host[0].username} is now LIVE!`,
        body: stream.title,
        icon: host[0].avatar || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: {
          url: `/stream/${streamId}`,
          streamId,
          hostId: stream.hostId,
          streamType: stream.streamType,
        },
      });

      let sentCount = 0;
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          sentCount++;
        } catch (error: any) {
          if (error.statusCode === 410) {
            await db.update(pushSubscriptions)
              .set({ isActive: false })
              .where(eq(pushSubscriptions.id, sub.id));
          }
        }
      }

      console.log(`[EnhancedStreaming] Sent ${sentCount} go-live notifications for stream ${streamId}`);
      return sentCount;
    } catch (error) {
      console.error('[EnhancedStreaming] Error sending notifications:', error);
      return 0;
    }
  }

  async addCoHost(streamId: string, hostId: string, coHostUserId: string): Promise<boolean> {
    try {
      const [stream] = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId))
        .limit(1);

      if (!stream || stream.hostId !== hostId) {
        return false;
      }

      const existingParticipant = await db.select()
        .from(streamParticipants)
        .where(and(
          eq(streamParticipants.streamId, streamId),
          eq(streamParticipants.userId, coHostUserId)
        ))
        .limit(1);

      if (existingParticipant.length > 0) {
        await db.update(streamParticipants)
          .set({ role: 'co_host', isActive: true })
          .where(eq(streamParticipants.id, existingParticipant[0].id));
      } else {
        await db.insert(streamParticipants).values({
          streamId,
          userId: coHostUserId,
          role: 'co_host',
          isActive: true,
        });
      }

      return true;
    } catch (error) {
      console.error('[EnhancedStreaming] Error adding co-host:', error);
      return false;
    }
  }

  async removeCoHost(streamId: string, hostId: string, coHostUserId: string): Promise<boolean> {
    try {
      const [stream] = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId))
        .limit(1);

      if (!stream || stream.hostId !== hostId) {
        return false;
      }

      await db.update(streamParticipants)
        .set({ role: 'viewer' })
        .where(and(
          eq(streamParticipants.streamId, streamId),
          eq(streamParticipants.userId, coHostUserId)
        ));

      return true;
    } catch (error) {
      console.error('[EnhancedStreaming] Error removing co-host:', error);
      return false;
    }
  }

  async getCoHosts(streamId: string): Promise<any[]> {
    try {
      const coHosts = await db.select({
        id: streamParticipants.id,
        userId: streamParticipants.userId,
        role: streamParticipants.role,
        isVideoOn: streamParticipants.isVideoOn,
        isMuted: streamParticipants.isMuted,
        isScreenSharing: streamParticipants.isScreenSharing,
      })
      .from(streamParticipants)
      .where(and(
        eq(streamParticipants.streamId, streamId),
        eq(streamParticipants.role, 'co_host'),
        eq(streamParticipants.isActive, true)
      ));

      const enriched = await Promise.all(coHosts.map(async (coHost) => {
        const [user] = await db.select({
          username: users.username,
          avatar: users.avatar,
        })
        .from(users)
        .where(eq(users.id, coHost.userId))
        .limit(1);

        return {
          ...coHost,
          username: user?.username,
          avatar: user?.avatar,
        };
      }));

      return enriched;
    } catch (error) {
      console.error('[EnhancedStreaming] Error getting co-hosts:', error);
      return [];
    }
  }

  async toggleScreenShare(streamId: string, userId: string, isSharing: boolean): Promise<boolean> {
    try {
      await db.update(streamParticipants)
        .set({ isScreenSharing: isSharing })
        .where(and(
          eq(streamParticipants.streamId, streamId),
          eq(streamParticipants.userId, userId)
        ));

      return true;
    } catch (error) {
      console.error('[EnhancedStreaming] Error toggling screen share:', error);
      return false;
    }
  }

  async createStreamRecording(streamId: string, recordingUrl: string, durationSeconds: number): Promise<string | null> {
    try {
      const [recording] = await db.insert(streamRecordings).values({
        streamId,
        recordingUrl,
        durationSeconds,
        status: 'ready',
      }).returning();

      return recording.id;
    } catch (error) {
      console.error('[EnhancedStreaming] Error creating recording:', error);
      return null;
    }
  }

  async getStreamReplays(limit: number = 20): Promise<any[]> {
    try {
      const replays = await db.select({
        id: streamRecordings.id,
        streamId: streamRecordings.streamId,
        recordingUrl: streamRecordings.recordingUrl,
        thumbnailUrl: streamRecordings.thumbnailUrl,
        durationSeconds: streamRecordings.durationSeconds,
        createdAt: streamRecordings.createdAt,
      })
      .from(streamRecordings)
      .where(eq(streamRecordings.status, 'ready'))
      .orderBy(desc(streamRecordings.createdAt))
      .limit(limit);

      const enriched = await Promise.all(replays.map(async (replay) => {
        const [stream] = await db.select({
          title: liveStreams.title,
          hostId: liveStreams.hostId,
          category: liveStreams.category,
          aiSummary: liveStreams.aiSummary,
          keyMoments: liveStreams.keyMoments,
          peakViewers: liveStreams.peakViewers,
        })
        .from(liveStreams)
        .where(eq(liveStreams.id, replay.streamId))
        .limit(1);

        if (!stream) return null;

        const [host] = await db.select({
          username: users.username,
          avatar: users.avatar,
        })
        .from(users)
        .where(eq(users.id, stream.hostId))
        .limit(1);

        return {
          ...replay,
          title: stream.title,
          category: stream.category,
          aiSummary: stream.aiSummary,
          keyMoments: stream.keyMoments,
          peakViewers: stream.peakViewers,
          hostUsername: host?.username,
          hostAvatar: host?.avatar,
        };
      }));

      return enriched.filter(Boolean);
    } catch (error) {
      console.error('[EnhancedStreaming] Error getting replays:', error);
      return [];
    }
  }

  async createPredictionFromStream(
    streamId: string,
    userId: string,
    predictionText: string,
    confidence: number = 70
  ): Promise<string | null> {
    try {
      const [prediction] = await db.insert(streamPredictions).values({
        streamId,
        predictorId: userId,
        predictionText,
        confidence,
        timestamp: Math.floor(Date.now() / 1000),
      }).returning();

      return prediction.id;
    } catch (error) {
      console.error('[EnhancedStreaming] Error creating prediction:', error);
      return null;
    }
  }

  async convertPredictionToMarket(
    predictionId: string,
    creatorId: string,
    deadline: Date
  ): Promise<string | null> {
    try {
      const [prediction] = await db.select()
        .from(streamPredictions)
        .where(eq(streamPredictions.id, predictionId))
        .limit(1);

      if (!prediction || prediction.marketCreated) return null;

      const [market] = await db.insert(predictionMarkets).values({
        question: prediction.predictionText,
        description: `Prediction made during live stream`,
        category: 'crypto',
        creatorId,
        creatorWallet: '0x0000000000000000000000000000000000000000',
        deadline,
        initialLiquidity: 500,
        yesLiquidity: 250,
        noLiquidity: 250,
        yesPrice: 5000,
        noPrice: 5000,
        status: 'active',
        tags: ['stream-prediction'],
      }).returning();

      await db.update(streamPredictions)
        .set({ 
          marketCreated: true,
          marketId: market.id,
        })
        .where(eq(streamPredictions.id, predictionId));

      return market.id;
    } catch (error) {
      console.error('[EnhancedStreaming] Error converting to market:', error);
      return null;
    }
  }

  // ==================== ON-DEMAND TTS SYSTEM ====================
  
  getRealViewerCount(streamId: string): number {
    const viewers = this.realViewerCache.get(streamId);
    if (!viewers) return 0;
    
    let realCount = 0;
    viewers.forEach(viewer => {
      if (!viewer.isAiAgent) realCount++;
    });
    return realCount;
  }

  registerViewer(streamId: string, userId: string, username: string, isAiAgent: boolean): void {
    if (!this.realViewerCache.has(streamId)) {
      this.realViewerCache.set(streamId, new Map());
    }
    
    this.realViewerCache.get(streamId)!.set(userId, {
      userId,
      username,
      isAiAgent,
      joinedAt: new Date()
    });

    if (!isAiAgent && !this.ttsActivatedStreams.has(streamId)) {
      this.activateTtsForStream(streamId);
    }
  }

  removeViewer(streamId: string, userId: string): void {
    const viewers = this.realViewerCache.get(streamId);
    if (viewers) {
      viewers.delete(userId);
      
      const realCount = this.getRealViewerCount(streamId);
      if (realCount === 0 && this.ttsActivatedStreams.has(streamId)) {
        this.deactivateTtsForStream(streamId);
      }
    }
  }

  private activateTtsForStream(streamId: string): void {
    console.log(`[Enhanced Streaming] 🎙️ TTS ACTIVATED for stream ${streamId} - real user joined`);
    this.ttsActivatedStreams.add(streamId);
  }

  private deactivateTtsForStream(streamId: string): void {
    console.log(`[Enhanced Streaming] 🔇 TTS DEACTIVATED for stream ${streamId} - no real users`);
    this.ttsActivatedStreams.delete(streamId);
  }

  isTtsActiveForStream(streamId: string): boolean {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      return false;
    }
    return this.ttsActivatedStreams.has(streamId);
  }

  // ==================== Q&A QUEUE SYSTEM ====================

  async submitQuestion(
    streamId: string, 
    askerId: string, 
    question: string, 
    isAnonymous: boolean = false,
    tipAmount: number = 0
  ): Promise<{ id: string; position: number }> {
    const [newQuestion] = await db.insert(streamQuestions).values({
      streamId,
      askerId,
      question,
      isAnonymous,
      tipAmount,
      status: 'pending'
    }).returning();

    const queuePosition = await db.select({ count: sql<number>`count(*)` })
      .from(streamQuestions)
      .where(and(
        eq(streamQuestions.streamId, streamId),
        eq(streamQuestions.status, 'pending')
      ));

    const streamingService = getStreamingService();
    if (streamingService) {
      streamingService.broadcastToStream(streamId, {
        type: 'question-submitted',
        streamId,
        userId: askerId,
        data: {
          questionId: newQuestion.id,
          position: queuePosition[0]?.count || 1,
          isAnonymous
        }
      });
    }

    return { 
      id: newQuestion.id, 
      position: Number(queuePosition[0]?.count) || 1 
    };
  }

  async getQuestionQueue(streamId: string): Promise<any[]> {
    const questions = await db.select({
      id: streamQuestions.id,
      question: streamQuestions.question,
      status: streamQuestions.status,
      upvotes: streamQuestions.upvotes,
      tipAmount: streamQuestions.tipAmount,
      isAnonymous: streamQuestions.isAnonymous,
      askerId: streamQuestions.askerId,
      askerName: users.username,
      askerAvatar: users.avatar,
      createdAt: streamQuestions.createdAt
    })
    .from(streamQuestions)
    .leftJoin(users, eq(streamQuestions.askerId, users.id))
    .where(and(
      eq(streamQuestions.streamId, streamId),
      eq(streamQuestions.status, 'pending')
    ))
    .orderBy(
      desc(streamQuestions.tipAmount),
      desc(streamQuestions.upvotes),
      streamQuestions.createdAt
    )
    .limit(20);

    return questions.map(q => ({
      ...q,
      askerName: q.isAnonymous ? 'Anonymous' : q.askerName,
      askerAvatar: q.isAnonymous ? null : q.askerAvatar
    }));
  }

  async upvoteQuestion(questionId: string): Promise<number> {
    await db.update(streamQuestions)
      .set({ upvotes: sql`upvotes + 1` })
      .where(eq(streamQuestions.id, questionId));

    const [updated] = await db.select({ upvotes: streamQuestions.upvotes })
      .from(streamQuestions)
      .where(eq(streamQuestions.id, questionId));

    return updated?.upvotes || 0;
  }

  async answerQuestion(
    questionId: string, 
    answerText: string
  ): Promise<{ success: boolean }> {
    const [question] = await db.select()
      .from(streamQuestions)
      .where(eq(streamQuestions.id, questionId));

    if (!question) {
      return { success: false };
    }

    await db.update(streamQuestions)
      .set({
        status: 'answered',
        answeredAt: new Date(),
        answerText
      })
      .where(eq(streamQuestions.id, questionId));

    const streamingService = getStreamingService();
    if (streamingService) {
      streamingService.broadcastToStream(question.streamId, {
        type: 'question-answered',
        streamId: question.streamId,
        userId: question.askerId,
        data: {
          questionId,
          answerText,
          askerId: question.askerId
        }
      });
    }

    return { success: true };
  }

  // ==================== DEBATE SYSTEM ====================

  async createDebate(
    streamId: string,
    topic: string,
    description: string,
    participant1: DebateParticipant,
    participant2: DebateParticipant,
    stakeAmount: number = 0
  ): Promise<{ id: string; success: boolean }> {
    const [debate] = await db.insert(streamDebates).values({
      streamId,
      topic,
      description,
      participant1Id: participant1.type === 'user' ? participant1.id : null,
      participant1AvatarId: participant1.type === 'avatar' ? participant1.id : null,
      participant1Position: participant1.position,
      participant2Id: participant2.type === 'user' ? participant2.id : null,
      participant2AvatarId: participant2.type === 'avatar' ? participant2.id : null,
      participant2Position: participant2.position,
      stakeAmount,
      status: 'pending'
    }).returning();

    if (participant2.type === 'user') {
      await db.insert(streamInvitations).values({
        streamId,
        debateId: debate.id,
        inviterId: participant1.type === 'user' ? participant1.id : '',
        inviteeId: participant2.id,
        invitationType: 'debate',
        message: `You've been invited to debate: ${topic}`,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      await db.update(streamDebates)
        .set({ status: 'invited' })
        .where(eq(streamDebates.id, debate.id));
    } else {
      await db.update(streamDebates)
        .set({ status: 'active', startedAt: new Date() })
        .where(eq(streamDebates.id, debate.id));
    }

    return { id: debate.id, success: true };
  }

  async getActiveDebate(streamId: string): Promise<any | null> {
    const [debate] = await db.select()
      .from(streamDebates)
      .where(and(
        eq(streamDebates.streamId, streamId),
        eq(streamDebates.status, 'active')
      ))
      .limit(1);

    if (!debate) return null;

    let participant1Name = 'Unknown';
    let participant2Name = 'Unknown';

    if (debate.participant1Id) {
      const [user] = await db.select({ username: users.username })
        .from(users)
        .where(eq(users.id, debate.participant1Id));
      participant1Name = user?.username || 'Unknown';
    } else if (debate.participant1AvatarId) {
      const [avatar] = await db.select({ name: knowledgeAvatars.name })
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, debate.participant1AvatarId));
      participant1Name = avatar?.name || 'Unknown Avatar';
    }

    if (debate.participant2Id) {
      const [user] = await db.select({ username: users.username })
        .from(users)
        .where(eq(users.id, debate.participant2Id));
      participant2Name = user?.username || 'Unknown';
    } else if (debate.participant2AvatarId) {
      const [avatar] = await db.select({ name: knowledgeAvatars.name })
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, debate.participant2AvatarId));
      participant2Name = avatar?.name || 'Unknown Avatar';
    }

    return {
      ...debate,
      participant1Name,
      participant2Name,
      participant1Type: debate.participant1Id ? 'user' : 'avatar',
      participant2Type: debate.participant2Id ? 'user' : 'avatar'
    };
  }

  async voteInDebate(debateId: string, voterId: string, votedFor: 1 | 2): Promise<{ success: boolean; totals: { p1: number; p2: number } }> {
    const existing = await db.select()
      .from(debateVotes)
      .where(and(
        eq(debateVotes.debateId, debateId),
        eq(debateVotes.voterId, voterId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, totals: { p1: 0, p2: 0 } };
    }

    await db.insert(debateVotes).values({
      debateId,
      voterId,
      votedFor,
      voteWeight: 1
    });

    if (votedFor === 1) {
      await db.update(streamDebates)
        .set({ participant1Votes: sql`participant1_votes + 1` })
        .where(eq(streamDebates.id, debateId));
    } else {
      await db.update(streamDebates)
        .set({ participant2Votes: sql`participant2_votes + 1` })
        .where(eq(streamDebates.id, debateId));
    }

    const [debate] = await db.select({
      p1: streamDebates.participant1Votes,
      p2: streamDebates.participant2Votes
    })
    .from(streamDebates)
    .where(eq(streamDebates.id, debateId));

    return { 
      success: true, 
      totals: { p1: debate?.p1 || 0, p2: debate?.p2 || 0 } 
    };
  }

  async endDebate(debateId: string): Promise<{ winnerId?: string; winnerAvatarId?: string; winnerName: string }> {
    const [debate] = await db.select()
      .from(streamDebates)
      .where(eq(streamDebates.id, debateId));

    if (!debate) {
      return { winnerName: 'Unknown' };
    }

    const p1Votes = debate.participant1Votes || 0;
    const p2Votes = debate.participant2Votes || 0;

    let winnerId = undefined;
    let winnerAvatarId = undefined;
    let winnerName = 'Tie';

    if (p1Votes > p2Votes) {
      winnerId = debate.participant1Id || undefined;
      winnerAvatarId = debate.participant1AvatarId || undefined;
    } else if (p2Votes > p1Votes) {
      winnerId = debate.participant2Id || undefined;
      winnerAvatarId = debate.participant2AvatarId || undefined;
    }

    if (winnerId) {
      const [user] = await db.select({ username: users.username })
        .from(users)
        .where(eq(users.id, winnerId));
      winnerName = user?.username || 'Unknown';
    } else if (winnerAvatarId) {
      const [avatar] = await db.select({ name: knowledgeAvatars.name })
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, winnerAvatarId));
      winnerName = avatar?.name || 'Unknown Avatar';
    }

    await db.update(streamDebates)
      .set({
        status: 'completed',
        endedAt: new Date(),
        winnerId,
        winnerAvatarId,
        winnerReward: debate.stakeAmount ? debate.stakeAmount * 2 : 0
      })
      .where(eq(streamDebates.id, debateId));

    return { winnerId, winnerAvatarId, winnerName };
  }

  // ==================== AUDIO CACHING SYSTEM ====================

  async getCachedPhrase(phrase: string, voice: string): Promise<string | null> {
    const [cached] = await db.select()
      .from(cachedAudioPhrases)
      .where(and(
        eq(cachedAudioPhrases.phrase, phrase),
        eq(cachedAudioPhrases.voice, voice)
      ))
      .limit(1);

    if (cached) {
      await db.update(cachedAudioPhrases)
        .set({ 
          usageCount: sql`usage_count + 1`,
          lastUsedAt: new Date()
        })
        .where(eq(cachedAudioPhrases.id, cached.id));

      return cached.audioBase64;
    }

    return null;
  }

  async cachePhrase(
    phrase: string, 
    phraseType: string, 
    voice: string, 
    audioBase64: string, 
    durationMs: number
  ): Promise<void> {
    await db.insert(cachedAudioPhrases).values({
      phrase,
      phraseType,
      voice,
      audioBase64,
      durationMs
    }).onConflictDoNothing();
  }

  async generateWithCache(text: string, voice: string, avatarName: string): Promise<{ audioBase64: string; fromCache: boolean }> {
    const cached = await this.getCachedPhrase(text, voice);
    if (cached) {
      console.log(`[Audio Cache] HIT: "${text.substring(0, 30)}..." (${voice})`);
      return { audioBase64: cached, fromCache: true };
    }

    if (process.env.PAUSE_OPENAI_API === 'true') {
      throw new Error('OpenAI API is paused');
    }

    const audioBuffer = await AvatarVoiceService.textToSpeech(text, avatarName);
    const audioBase64 = audioBuffer.toString('base64');

    const commonPhraseTypes = ['intro', 'outro', 'transition', 'greeting', 'thanks'];
    const isCommonPhrase = text.length < 100 && commonPhraseTypes.some(type => 
      text.toLowerCase().includes(type === 'intro' ? 'welcome' : type)
    );

    if (isCommonPhrase) {
      await this.cachePhrase(text, 'common', voice, audioBase64, text.length * 50);
    }

    return { audioBase64, fromCache: false };
  }

  // ==================== STREAM SCHEDULING ====================

  async scheduleStream(
    hostId: string | null,
    hostAvatarId: string | null,
    title: string,
    description: string,
    scheduledAt: Date,
    category?: string,
    tags?: string[],
    estimatedDuration: number = 60
  ): Promise<{ id: string; success: boolean }> {
    const [scheduled] = await db.insert(scheduledStreams).values({
      hostId,
      hostAvatarId,
      title,
      description,
      scheduledAt,
      category,
      tags,
      estimatedDuration
    }).returning();

    return { id: scheduled.id, success: true };
  }

  async getUpcomingStreams(limit: number = 20): Promise<any[]> {
    const now = new Date();
    
    const streams = await db.select({
      id: scheduledStreams.id,
      title: scheduledStreams.title,
      description: scheduledStreams.description,
      category: scheduledStreams.category,
      scheduledAt: scheduledStreams.scheduledAt,
      estimatedDuration: scheduledStreams.estimatedDuration,
      hostId: scheduledStreams.hostId,
      hostAvatarId: scheduledStreams.hostAvatarId,
      hostName: users.username,
      hostAvatar: users.avatar
    })
    .from(scheduledStreams)
    .leftJoin(users, eq(scheduledStreams.hostId, users.id))
    .where(gt(scheduledStreams.scheduledAt, now))
    .orderBy(scheduledStreams.scheduledAt)
    .limit(limit);

    const result = await Promise.all(streams.map(async (stream) => {
      if (stream.hostAvatarId && !stream.hostId) {
        const [avatar] = await db.select({ 
          name: knowledgeAvatars.name, 
          imageUrl: knowledgeAvatars.imageUrl 
        })
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, stream.hostAvatarId));
        
        return {
          ...stream,
          hostName: avatar?.name || 'AI Avatar',
          hostAvatar: avatar?.imageUrl,
          isAvatarHost: true
        };
      }
      return { ...stream, isAvatarHost: false };
    }));

    return result;
  }

  // ==================== STREAM ALERTS ====================

  async subscribeToAlerts(
    userId: string, 
    streamerId?: string, 
    avatarId?: string
  ): Promise<{ success: boolean }> {
    await db.insert(streamAlerts).values({
      userId,
      streamerId,
      avatarId
    }).onConflictDoNothing();

    return { success: true };
  }

  async getSubscribedStreamers(userId: string): Promise<any[]> {
    const alerts = await db.select({
      streamerId: streamAlerts.streamerId,
      avatarId: streamAlerts.avatarId,
      alertOnLive: streamAlerts.alertOnLive,
      alertOnScheduled: streamAlerts.alertOnScheduled
    })
    .from(streamAlerts)
    .where(eq(streamAlerts.userId, userId));

    return alerts;
  }

  // ==================== USER STREAM SETTINGS ====================

  async getUserStreamSettings(userId: string): Promise<any> {
    const [settings] = await db.select()
      .from(userStreamSettings)
      .where(eq(userStreamSettings.userId, userId));

    if (!settings) {
      const [newSettings] = await db.insert(userStreamSettings).values({
        userId,
        voiceMode: 'text',
        ttsVoice: 'alloy',
        ttsSpeed: 1.0,
        defaultStreamType: 'broadcast'
      }).returning();
      return newSettings;
    }

    return settings;
  }

  async updateUserStreamSettings(
    userId: string, 
    settings: Partial<{
      voiceMode: string;
      ttsVoice: string;
      ttsSpeed: number;
      defaultCategory: string;
      defaultTags: string[];
      defaultStreamType: string;
      allowDebateInvites: boolean;
      allowCoHostInvites: boolean;
    }>
  ): Promise<{ success: boolean }> {
    await db.update(userStreamSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userStreamSettings.userId, userId));

    return { success: true };
  }

  // ==================== MARKET REACTION TRIGGERS ====================

  async checkMarketMovement(symbol: string, currentPrice: number): Promise<boolean> {
    const cached = this.marketDataCache.get(symbol);
    
    if (!cached) {
      this.marketDataCache.set(symbol, { data: { symbol, price: currentPrice, change24h: 0, volume24h: 0 }, timestamp: Date.now() });
      return false;
    }

    const priceChange = ((currentPrice - cached.data.price) / cached.data.price) * 100;
    const timeSinceUpdate = Date.now() - cached.timestamp;

    if (timeSinceUpdate > 60000) {
      this.marketDataCache.set(symbol, { data: { symbol, price: currentPrice, change24h: priceChange, volume24h: 0 }, timestamp: Date.now() });
    }

    if (Math.abs(priceChange) >= this.priceAlertThreshold) {
      console.log(`[Market Reaction] ${symbol} moved ${priceChange.toFixed(2)}% - triggering commentary`);
      this.marketDataCache.set(symbol, { data: { symbol, price: currentPrice, change24h: priceChange, volume24h: 0 }, timestamp: Date.now() });
      return true;
    }

    return false;
  }

  async generateMarketReactionComment(
    symbol: string, 
    priceChange: number, 
    currentPrice: number,
    avatarName: string
  ): Promise<string> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      const direction = priceChange > 0 ? 'up' : 'down';
      return `${symbol} just moved ${Math.abs(priceChange).toFixed(1)}% ${direction} to $${currentPrice.toLocaleString()}!`;
    }

    const direction = priceChange > 0 ? 'surged' : 'dropped';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `You are ${avatarName}, a crypto expert. Give a brief, insightful 1-2 sentence reaction to this price movement. Be specific and actionable.`
      }, {
        role: 'user',
        content: `${symbol} just ${direction} ${Math.abs(priceChange).toFixed(1)}% to $${currentPrice.toLocaleString()}. Give your quick take.`
      }],
      max_tokens: 100
    });

    return response.choices[0]?.message?.content || `${symbol} ${direction} ${Math.abs(priceChange).toFixed(1)}%!`;
  }

  // ==================== USER GO-LIVE SYSTEM ====================

  async createUserStream(
    hostId: string,
    title: string,
    description: string,
    streamType: string = 'broadcast',
    category?: string,
    tags?: string[]
  ): Promise<{ streamId: string; success: boolean }> {
    const [stream] = await db.insert(liveStreams).values({
      hostId,
      title,
      description,
      streamType,
      category,
      tags,
      status: 'live',
      actualStart: new Date()
    }).returning();

    return { streamId: stream.id, success: true };
  }

  async endUserStream(streamId: string, hostId: string): Promise<{ success: boolean }> {
    const [stream] = await db.select()
      .from(liveStreams)
      .where(and(
        eq(liveStreams.id, streamId),
        eq(liveStreams.hostId, hostId)
      ))
      .limit(1);

    if (!stream) {
      return { success: false };
    }

    const actualStart = stream.actualStart || new Date();
    const durationSeconds = Math.floor((Date.now() - new Date(actualStart).getTime()) / 1000);

    await db.update(liveStreams)
      .set({
        status: 'ended',
        actualEnd: new Date(),
        durationSeconds
      })
      .where(eq(liveStreams.id, streamId));

    return { success: true };
  }

  // ==================== PENDING INVITATIONS ====================

  async getPendingInvitations(userId: string): Promise<any[]> {
    const invitations = await db.select({
      id: streamInvitations.id,
      streamId: streamInvitations.streamId,
      debateId: streamInvitations.debateId,
      invitationType: streamInvitations.invitationType,
      message: streamInvitations.message,
      expiresAt: streamInvitations.expiresAt,
      createdAt: streamInvitations.createdAt,
      inviterName: users.username,
      inviterAvatar: users.avatar
    })
    .from(streamInvitations)
    .leftJoin(users, eq(streamInvitations.inviterId, users.id))
    .where(and(
      eq(streamInvitations.inviteeId, userId),
      eq(streamInvitations.status, 'pending')
    ))
    .orderBy(desc(streamInvitations.createdAt));

    return invitations;
  }

  async respondToInvitation(invitationId: string, userId: string, accept: boolean): Promise<{ success: boolean }> {
    const [invitation] = await db.select()
      .from(streamInvitations)
      .where(and(
        eq(streamInvitations.id, invitationId),
        eq(streamInvitations.inviteeId, userId)
      ))
      .limit(1);

    if (!invitation) {
      return { success: false };
    }

    await db.update(streamInvitations)
      .set({
        status: accept ? 'accepted' : 'declined',
        respondedAt: new Date()
      })
      .where(eq(streamInvitations.id, invitationId));

    if (accept && invitation.debateId) {
      await db.update(streamDebates)
        .set({ status: 'active', startedAt: new Date() })
        .where(eq(streamDebates.id, invitation.debateId));
    }

    return { success: true };
  }
}

let enhancedStreamingServiceInstance: EnhancedStreamingService | null = null;

export function initEnhancedStreamingService(): EnhancedStreamingService {
  if (!enhancedStreamingServiceInstance) {
    enhancedStreamingServiceInstance = new EnhancedStreamingService();
  }
  return enhancedStreamingServiceInstance;
}

export function getEnhancedStreamingService(): EnhancedStreamingService | null {
  return enhancedStreamingServiceInstance;
}
