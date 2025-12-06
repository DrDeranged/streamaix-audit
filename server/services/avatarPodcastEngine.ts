import { db } from '../db';
import { liveStreams, streamMessages, knowledgeAvatars, users } from '@shared/schema';
import { eq, desc, and, gt } from 'drizzle-orm';
import { AvatarVoiceService } from './avatarVoiceService';
import { notificationDataValidator } from './notificationDataValidator';
import OpenAI from 'openai';

const openai = new OpenAI();

interface PodcastSession {
  streamId: string;
  avatarName: string;
  avatarId: string;
  topic: string;
  startTime: Date;
  lastSegmentTime: Date;
  segmentCount: number;
  previousContext: string[];
  isActive: boolean;
  audioQueue: AudioSegment[];
  currentMarketContext: string;
}

interface AudioSegment {
  id: string;
  text: string;
  audioBase64: string;
  type: 'intro' | 'analysis' | 'alpha' | 'commentary' | 'qa' | 'market_reaction' | 'outro';
  timestamp: Date;
  duration: number;
}

interface ViewerQuestion {
  viewerId: string;
  viewerName: string;
  question: string;
  timestamp: Date;
  answered: boolean;
}

const SEGMENT_INTERVAL_MS = 25000;
const MARKET_CHECK_INTERVAL_MS = 60000;
const MAX_CONTEXT_LENGTH = 5;

export class AvatarPodcastEngine {
  private activeSessions = new Map<string, PodcastSession>();
  private questionQueues = new Map<string, ViewerQuestion[]>();
  private marketPrices = new Map<string, { price: number; change24h: number }>();
  private priceAlertThreshold = 2.0;

  async startPodcastSession(
    streamId: string,
    avatarId: string,
    topic: string
  ): Promise<boolean> {
    try {
      const [avatar] = await db.select()
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, avatarId))
        .limit(1);

      if (!avatar) {
        console.error('[Podcast] Avatar not found:', avatarId);
        return false;
      }

      const marketContext = await this.fetchMarketContext();

      const session: PodcastSession = {
        streamId,
        avatarName: avatar.name,
        avatarId,
        topic,
        startTime: new Date(),
        lastSegmentTime: new Date(),
        segmentCount: 0,
        previousContext: [],
        isActive: true,
        audioQueue: [],
        currentMarketContext: marketContext,
      };

      this.activeSessions.set(streamId, session);
      this.questionQueues.set(streamId, []);

      console.log(`[Podcast] 🎙️ Starting podcast session for ${avatar.name} on "${topic}"`);

      await this.generateIntroSegment(session);

      this.startContinuousCommentary(streamId);
      this.startMarketMonitoring(streamId);

      return true;
    } catch (error) {
      console.error('[Podcast] Failed to start session:', error);
      return false;
    }
  }

  async stopPodcastSession(streamId: string): Promise<void> {
    const session = this.activeSessions.get(streamId);
    if (!session) return;

    session.isActive = false;

    try {
      await this.generateOutroSegment(session);
    } catch (error) {
      console.error('[Podcast] Error generating outro:', error);
    }

    this.activeSessions.delete(streamId);
    this.questionQueues.delete(streamId);
    console.log(`[Podcast] 🎙️ Ended podcast session for ${session.avatarName}`);
  }

  private async fetchMarketContext(): Promise<string> {
    try {
      const context = await notificationDataValidator.getRealTimeMarketContext();
      
      this.marketPrices.set('BTC', { price: context.btcPrice, change24h: context.btcChange24h });
      this.marketPrices.set('ETH', { price: context.ethPrice, change24h: context.ethChange24h });

      return `BTC: $${context.btcPrice.toLocaleString()} (${context.btcChange24h >= 0 ? '+' : ''}${context.btcChange24h.toFixed(1)}%), ETH: $${context.ethPrice.toLocaleString()} (${context.ethChange24h >= 0 ? '+' : ''}${context.ethChange24h.toFixed(1)}%). Market: ${context.marketSentiment}. Phase: ${context.marketPhase}.`;
    } catch (error) {
      console.error('[Podcast] Failed to fetch market context:', error);
      return 'Market data temporarily unavailable.';
    }
  }

  private async generateIntroSegment(session: PodcastSession): Promise<void> {
    try {
      const segment = await AvatarVoiceService.generatePodcastSegment(
        session.avatarName,
        session.topic,
        session.currentMarketContext,
        'intro'
      );

      const audioSegment: AudioSegment = {
        id: `intro-${Date.now()}`,
        text: segment.text,
        audioBase64: segment.audioBase64,
        type: 'intro',
        timestamp: new Date(),
        duration: segment.duration,
      };

      session.audioQueue.push(audioSegment);
      session.previousContext.push(segment.text);
      session.segmentCount++;

      await this.broadcastAudioSegment(session.streamId, audioSegment);
      console.log(`[Podcast] 🎤 Intro segment generated for ${session.avatarName}`);
    } catch (error) {
      console.error('[Podcast] Failed to generate intro:', error);
    }
  }

  private async generateOutroSegment(session: PodcastSession): Promise<void> {
    try {
      const segment = await AvatarVoiceService.generatePodcastSegment(
        session.avatarName,
        session.topic,
        session.currentMarketContext,
        'outro'
      );

      const audioSegment: AudioSegment = {
        id: `outro-${Date.now()}`,
        text: segment.text,
        audioBase64: segment.audioBase64,
        type: 'outro',
        timestamp: new Date(),
        duration: segment.duration,
      };

      await this.broadcastAudioSegment(session.streamId, audioSegment);
      console.log(`[Podcast] 🎤 Outro segment generated for ${session.avatarName}`);
    } catch (error) {
      console.error('[Podcast] Failed to generate outro:', error);
    }
  }

  private startContinuousCommentary(streamId: string): void {
    const interval = setInterval(async () => {
      const session = this.activeSessions.get(streamId);
      if (!session || !session.isActive) {
        clearInterval(interval);
        return;
      }

      try {
        const questions = this.questionQueues.get(streamId) || [];
        const unansweredQuestion = questions.find(q => !q.answered);

        if (unansweredQuestion) {
          await this.answerViewerQuestion(session, unansweredQuestion);
          unansweredQuestion.answered = true;
        } else {
          await this.generateCommentarySegment(session);
        }
      } catch (error) {
        console.error('[Podcast] Commentary error:', error);
      }
    }, SEGMENT_INTERVAL_MS);
  }

  private startMarketMonitoring(streamId: string): void {
    const interval = setInterval(async () => {
      const session = this.activeSessions.get(streamId);
      if (!session || !session.isActive) {
        clearInterval(interval);
        return;
      }

      try {
        const newContext = await this.fetchMarketContext();
        const previousContext = session.currentMarketContext;
        session.currentMarketContext = newContext;

        const btcPrevious = this.extractPrice(previousContext, 'BTC');
        const btcCurrent = this.marketPrices.get('BTC');
        
        if (btcPrevious && btcCurrent) {
          const priceChange = ((btcCurrent.price - btcPrevious) / btcPrevious) * 100;
          
          if (Math.abs(priceChange) >= this.priceAlertThreshold) {
            await this.reactToMarketMove(session, 'BTC', priceChange, btcCurrent.price);
          }
        }
      } catch (error) {
        console.error('[Podcast] Market monitoring error:', error);
      }
    }, MARKET_CHECK_INTERVAL_MS);
  }

  private extractPrice(context: string, asset: string): number | null {
    const regex = new RegExp(`${asset}:\\s*\\$([\\d,]+(?:\\.\\d+)?)`);
    const match = context.match(regex);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  private async generateCommentarySegment(session: PodcastSession): Promise<void> {
    try {
      const segmentTypes = ['analysis', 'alpha', 'commentary'];
      const weights = [0.3, 0.4, 0.3];
      const random = Math.random();
      let cumulative = 0;
      let selectedType: 'analysis' | 'alpha' | 'commentary' = 'commentary';
      
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
          selectedType = segmentTypes[i] as 'analysis' | 'alpha' | 'commentary';
          break;
        }
      }

      const previousContext = session.previousContext.slice(-3).join(' | ');

      let segment;
      if (selectedType === 'commentary') {
        segment = await AvatarVoiceService.generateContinuousCommentary(
          session.avatarName,
          session.topic,
          session.currentMarketContext,
          previousContext
        );
      } else {
        const fullSegment = await AvatarVoiceService.generatePodcastSegment(
          session.avatarName,
          session.topic,
          session.currentMarketContext,
          selectedType
        );
        segment = { text: fullSegment.text, audioBase64: fullSegment.audioBase64 };
      }

      const audioSegment: AudioSegment = {
        id: `${selectedType}-${Date.now()}`,
        text: segment.text,
        audioBase64: segment.audioBase64,
        type: selectedType,
        timestamp: new Date(),
        duration: Math.round(segment.text.split(/\s+/).length / 150 * 60),
      };

      session.audioQueue.push(audioSegment);
      session.previousContext.push(segment.text);
      if (session.previousContext.length > MAX_CONTEXT_LENGTH) {
        session.previousContext.shift();
      }
      session.segmentCount++;
      session.lastSegmentTime = new Date();

      await this.broadcastAudioSegment(session.streamId, audioSegment);
      console.log(`[Podcast] 🎤 ${selectedType} segment #${session.segmentCount} for ${session.avatarName}`);
    } catch (error) {
      console.error('[Podcast] Failed to generate commentary:', error);
    }
  }

  private async answerViewerQuestion(session: PodcastSession, question: ViewerQuestion): Promise<void> {
    try {
      const response = await AvatarVoiceService.respondToViewerQuestion(
        session.avatarName,
        question.question,
        question.viewerName,
        session.currentMarketContext
      );

      const audioSegment: AudioSegment = {
        id: `qa-${Date.now()}`,
        text: response.text,
        audioBase64: response.audioBase64,
        type: 'qa',
        timestamp: new Date(),
        duration: Math.round(response.text.split(/\s+/).length / 150 * 60),
      };

      session.previousContext.push(`Q: ${question.question} A: ${response.text}`);
      if (session.previousContext.length > MAX_CONTEXT_LENGTH) {
        session.previousContext.shift();
      }

      await this.broadcastAudioSegment(session.streamId, audioSegment);
      console.log(`[Podcast] 💬 Answered question from ${question.viewerName}`);
    } catch (error) {
      console.error('[Podcast] Failed to answer question:', error);
    }
  }

  private async reactToMarketMove(
    session: PodcastSession, 
    asset: string, 
    priceChange: number, 
    currentPrice: number
  ): Promise<void> {
    try {
      const reaction = await AvatarVoiceService.reactToMarketMove(
        session.avatarName,
        asset,
        priceChange,
        currentPrice
      );

      const audioSegment: AudioSegment = {
        id: `market-${Date.now()}`,
        text: reaction.text,
        audioBase64: reaction.audioBase64,
        type: 'market_reaction',
        timestamp: new Date(),
        duration: Math.round(reaction.text.split(/\s+/).length / 150 * 60),
      };

      await this.broadcastAudioSegment(session.streamId, audioSegment);
      console.log(`[Podcast] 📈 Market reaction: ${asset} ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%`);
    } catch (error) {
      console.error('[Podcast] Failed to react to market:', error);
    }
  }

  private async broadcastAudioSegment(streamId: string, segment: AudioSegment): Promise<void> {
    try {
      const session = this.activeSessions.get(streamId);
      if (!session) return;

      await db.insert(streamMessages).values({
        streamId,
        userId: session.avatarId,
        content: segment.text,
        messageType: 'avatar_speech',
        metadata: {
          audioBase64: segment.audioBase64,
          segmentType: segment.type,
          duration: segment.duration,
          avatarName: session.avatarName,
        },
      });

      const { getStreamingService } = await import('./streamingService');
      const streamingService = getStreamingService();
      
      if (streamingService) {
        const audioMessage: import('./streamingService').AvatarAudioMessage = {
          type: 'avatar-audio' as const,
          avatarName: session.avatarName,
          text: segment.text,
          audioBase64: segment.audioBase64,
          segmentType: segment.type,
          duration: segment.duration,
          timestamp: segment.timestamp.toISOString(),
        };
        streamingService.broadcastAvatarAudio(streamId, audioMessage);
      }
    } catch (error) {
      console.error('[Podcast] Failed to broadcast audio:', error);
    }
  }

  addViewerQuestion(streamId: string, viewerId: string, viewerName: string, question: string): boolean {
    const session = this.activeSessions.get(streamId);
    if (!session || !session.isActive) return false;

    const questions = this.questionQueues.get(streamId) || [];
    
    if (questions.filter(q => !q.answered).length >= 5) {
      return false;
    }

    questions.push({
      viewerId,
      viewerName,
      question,
      timestamp: new Date(),
      answered: false,
    });

    this.questionQueues.set(streamId, questions);
    console.log(`[Podcast] 📝 Question queued from ${viewerName}: "${question.substring(0, 50)}..."`);
    return true;
  }

  getSessionStatus(streamId: string): {
    isActive: boolean;
    segmentCount: number;
    queuedQuestions: number;
    lastSegmentTime: Date | null;
  } | null {
    const session = this.activeSessions.get(streamId);
    if (!session) return null;

    const questions = this.questionQueues.get(streamId) || [];
    
    return {
      isActive: session.isActive,
      segmentCount: session.segmentCount,
      queuedQuestions: questions.filter(q => !q.answered).length,
      lastSegmentTime: session.lastSegmentTime,
    };
  }

  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }
}

export const avatarPodcastEngine = new AvatarPodcastEngine();
