import OpenAI from 'openai';
import { db } from '../db';
import { liveStreams, streamMessages, streamParticipants, streamTips, streamPredictions, streamRecordings, users, pushSubscriptions, predictionMarkets } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getStreamingService } from './streamingService';
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

export class EnhancedStreamingService {
  private marketDataCache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private aiCommentaryInterval: Map<string, NodeJS.Timeout> = new Map();

  async generateAIMarketCommentary(streamId: string): Promise<string | null> {
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
