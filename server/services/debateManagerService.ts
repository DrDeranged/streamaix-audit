import { db } from '../db';
import { scheduledDebates, knowledgeAvatars, liveStreams } from '@shared/schema';
import { eq, and, lte, gt, desc, or } from 'drizzle-orm';
import OpenAI from 'openai';
import { AvatarVoiceService } from './avatarVoiceService';
import { WebSocketServer, WebSocket } from 'ws';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DebateExchange {
  speakerId: string;
  speakerName: string;
  content: string;
  audioBase64?: string;
  timestamp: number;
}

interface ActiveDebate {
  debateId: string;
  avatar1: { id: string; name: string; tradingStyle?: string; marketOutlook?: string };
  avatar2: { id: string; name: string; tradingStyle?: string; marketOutlook?: string };
  topic: string;
  maxRounds: number;
  turnDurationMs: number;
  enableVoice: boolean;
  currentRound: number;
  currentSpeaker: 1 | 2;
  exchanges: DebateExchange[];
  isActive: boolean;
  turnTimer: NodeJS.Timeout | null;
  streamId?: string;
}

const activeDebates = new Map<string, ActiveDebate>();
const debateSubscribers = new Map<string, Set<WebSocket>>();

export class DebateManagerService {
  private static checkInterval: NodeJS.Timeout | null = null;
  private static wss: WebSocketServer | null = null;

  static initialize(wss?: WebSocketServer) {
    if (wss) {
      this.wss = wss;
    }
    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => this.checkScheduledDebates(), 30000);
      console.log('[DebateManager] Initialized - checking for scheduled debates every 30s');
    }
  }

  static async checkScheduledDebates() {
    if (process.env.QUIET_MODE === 'true' || process.env.PAUSE_OPENAI_API === 'true') {
      return;
    }

    try {
      const now = new Date();
      const upcoming = await db.select()
        .from(scheduledDebates)
        .where(and(
          eq(scheduledDebates.status, 'scheduled'),
          lte(scheduledDebates.scheduledStartTime, now)
        ))
        .limit(5);

      for (const debate of upcoming) {
        if (!activeDebates.has(debate.id)) {
          console.log(`[DebateManager] Starting scheduled debate: ${debate.topic}`);
          await this.startDebate(debate.id);
        }
      }
    } catch (error) {
      console.error('[DebateManager] Error checking scheduled debates:', error);
    }
  }

  static async scheduleDebate(params: {
    avatar1Id: string;
    avatar2Id: string;
    topic: string;
    description?: string;
    category?: string;
    scheduledStartTime: Date;
    maxRounds?: number;
    turnDurationSeconds?: number;
    enableVoice?: boolean;
    createdBy?: string;
  }) {
    const [avatar1, avatar2] = await Promise.all([
      db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, params.avatar1Id)).limit(1),
      db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, params.avatar2Id)).limit(1),
    ]);

    if (!avatar1[0] || !avatar2[0]) {
      throw new Error('One or both avatars not found');
    }

    const [debate] = await db.insert(scheduledDebates).values({
      avatar1Id: params.avatar1Id,
      avatar2Id: params.avatar2Id,
      topic: params.topic,
      description: params.description,
      category: params.category || 'crypto',
      scheduledStartTime: params.scheduledStartTime,
      maxRounds: params.maxRounds || 6,
      turnDurationSeconds: params.turnDurationSeconds || 45,
      enableVoice: params.enableVoice !== false,
      createdBy: params.createdBy,
      status: 'scheduled',
    }).returning();

    console.log(`[DebateManager] Scheduled debate "${params.topic}" between ${avatar1[0].name} and ${avatar2[0].name} for ${params.scheduledStartTime}`);

    return {
      ...debate,
      avatar1Name: avatar1[0].name,
      avatar2Name: avatar2[0].name,
    };
  }

  static async startDebate(debateId: string): Promise<ActiveDebate | null> {
    const [debate] = await db.select()
      .from(scheduledDebates)
      .where(eq(scheduledDebates.id, debateId))
      .limit(1);

    if (!debate) {
      console.error(`[DebateManager] Debate ${debateId} not found`);
      return null;
    }

    if (debate.status === 'live') {
      return activeDebates.get(debateId) || null;
    }

    const [avatar1, avatar2] = await Promise.all([
      db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, debate.avatar1Id)).limit(1),
      db.select().from(knowledgeAvatars).where(eq(knowledgeAvatars.id, debate.avatar2Id)).limit(1),
    ]);

    if (!avatar1[0] || !avatar2[0]) {
      console.error(`[DebateManager] Avatars not found for debate ${debateId}`);
      return null;
    }

    const activeDebate: ActiveDebate = {
      debateId,
      avatar1: {
        id: avatar1[0].id,
        name: avatar1[0].name,
        tradingStyle: avatar1[0].tradingStyle || undefined,
        marketOutlook: avatar1[0].marketOutlook || undefined,
      },
      avatar2: {
        id: avatar2[0].id,
        name: avatar2[0].name,
        tradingStyle: avatar2[0].tradingStyle || undefined,
        marketOutlook: avatar2[0].marketOutlook || undefined,
      },
      topic: debate.topic,
      maxRounds: debate.maxRounds || 6,
      turnDurationMs: (debate.turnDurationSeconds || 45) * 1000,
      enableVoice: debate.enableVoice !== false,
      currentRound: 0,
      currentSpeaker: 1,
      exchanges: [],
      isActive: true,
      turnTimer: null,
      streamId: debate.streamId || undefined,
    };

    activeDebates.set(debateId, activeDebate);

    await db.update(scheduledDebates)
      .set({
        status: 'live',
        actualStartTime: new Date(),
        currentRound: 0,
        currentSpeaker: 1,
      })
      .where(eq(scheduledDebates.id, debateId));

    this.broadcastDebateEvent(debateId, {
      type: 'debate-started',
      debateId,
      topic: debate.topic,
      avatar1: { id: avatar1[0].id, name: avatar1[0].name },
      avatar2: { id: avatar2[0].id, name: avatar2[0].name },
      maxRounds: activeDebate.maxRounds,
    });

    this.scheduleNextTurn(debateId);

    return activeDebate;
  }

  private static scheduleNextTurn(debateId: string) {
    const debate = activeDebates.get(debateId);
    if (!debate || !debate.isActive) return;

    if (debate.currentRound >= debate.maxRounds) {
      this.endDebate(debateId);
      return;
    }

    this.executeTurn(debateId);
  }

  private static async executeTurn(debateId: string) {
    const debate = activeDebates.get(debateId);
    if (!debate || !debate.isActive) return;

    const currentAvatar = debate.currentSpeaker === 1 ? debate.avatar1 : debate.avatar2;
    const previousExchange = debate.exchanges[debate.exchanges.length - 1];

    this.broadcastDebateEvent(debateId, {
      type: 'turn-started',
      debateId,
      round: debate.currentRound + 1,
      speaker: debate.currentSpeaker,
      speakerName: currentAvatar.name,
      speakerId: currentAvatar.id,
    });

    try {
      const response = await this.generateDebateResponse(debate, currentAvatar, previousExchange?.content);

      if (!response) {
        console.error(`[DebateManager] Failed to generate response for ${currentAvatar.name}`);
        this.endDebate(debateId, 'error');
        return;
      }

      let audioBase64: string | undefined;
      if (debate.enableVoice && process.env.PAUSE_OPENAI_API !== 'true') {
        try {
          audioBase64 = await AvatarVoiceService.textToSpeechBase64(response, currentAvatar.name);
        } catch (audioError) {
          console.warn(`[DebateManager] TTS failed for ${currentAvatar.name}:`, audioError);
        }
      }

      const exchange: DebateExchange = {
        speakerId: currentAvatar.id,
        speakerName: currentAvatar.name,
        content: response,
        audioBase64,
        timestamp: Date.now(),
      };

      debate.exchanges.push(exchange);
      debate.currentRound++;

      await db.update(scheduledDebates)
        .set({
          exchanges: debate.exchanges,
          currentRound: debate.currentRound,
          currentSpeaker: debate.currentSpeaker === 1 ? 2 : 1,
          updatedAt: new Date(),
        })
        .where(eq(scheduledDebates.id, debateId));

      this.broadcastDebateEvent(debateId, {
        type: 'turn-completed',
        debateId,
        round: debate.currentRound,
        speaker: debate.currentSpeaker,
        speakerName: currentAvatar.name,
        speakerId: currentAvatar.id,
        content: response,
        audioBase64,
        totalRounds: debate.maxRounds,
      });

      debate.currentSpeaker = debate.currentSpeaker === 1 ? 2 : 1;

      if (debate.currentRound >= debate.maxRounds) {
        this.endDebate(debateId);
      } else {
        debate.turnTimer = setTimeout(() => {
          this.scheduleNextTurn(debateId);
        }, debate.turnDurationMs);
      }

    } catch (error) {
      console.error(`[DebateManager] Error executing turn:`, error);
      this.endDebate(debateId, 'error');
    }
  }

  private static async generateDebateResponse(
    debate: ActiveDebate,
    avatar: { id: string; name: string; tradingStyle?: string; marketOutlook?: string },
    previousStatement?: string
  ): Promise<string | null> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      return `[${avatar.name}'s response would appear here - API paused for cost control]`;
    }

    try {
      const conversationContext = debate.exchanges.slice(-4)
        .map(e => `${e.speakerName}: "${e.content}"`)
        .join('\n');

      const systemPrompt = `You are ${avatar.name}, a knowledge avatar participating in a debate about "${debate.topic}".
Your trading style: ${avatar.tradingStyle || 'balanced'}
Your market outlook: ${avatar.marketOutlook || 'neutral'}

Guidelines:
- Be conversational and engaging, like a podcast discussion
- Make clear, compelling arguments in 2-3 sentences
- Acknowledge valid points from the other side when appropriate
- Stay focused on the debate topic
- Use your unique perspective and expertise
- Be respectful but confident in your position`;

      const userPrompt = previousStatement
        ? `Recent discussion:\n${conversationContext}\n\nThe other debater just said: "${previousStatement}"\n\nRespond with your perspective (2-3 sentences).`
        : `You're starting this debate on "${debate.topic}". Give your opening statement (2-3 sentences).`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error(`[DebateManager] OpenAI error:`, error);
      return null;
    }
  }

  static async endDebate(debateId: string, reason: 'completed' | 'cancelled' | 'error' = 'completed') {
    const debate = activeDebates.get(debateId);
    if (!debate) return;

    debate.isActive = false;
    if (debate.turnTimer) {
      clearTimeout(debate.turnTimer);
    }

    await db.update(scheduledDebates)
      .set({
        status: reason === 'completed' ? 'completed' : 'cancelled',
        endTime: new Date(),
        exchanges: debate.exchanges,
        currentRound: debate.currentRound,
        updatedAt: new Date(),
      })
      .where(eq(scheduledDebates.id, debateId));

    this.broadcastDebateEvent(debateId, {
      type: 'debate-ended',
      debateId,
      reason,
      totalRounds: debate.currentRound,
      exchanges: debate.exchanges.map(e => ({
        speakerName: e.speakerName,
        content: e.content,
        timestamp: e.timestamp,
      })),
    });

    activeDebates.delete(debateId);
    debateSubscribers.delete(debateId);

    console.log(`[DebateManager] Debate ${debateId} ended: ${reason}`);
  }

  static async voteForAvatar(debateId: string, avatarNumber: 1 | 2, userId: string) {
    const [debate] = await db.select()
      .from(scheduledDebates)
      .where(eq(scheduledDebates.id, debateId))
      .limit(1);

    if (!debate) return null;

    const votes = (debate.viewerVotes as { avatar1: number; avatar2: number }) || { avatar1: 0, avatar2: 0 };
    if (avatarNumber === 1) {
      votes.avatar1++;
    } else {
      votes.avatar2++;
    }

    await db.update(scheduledDebates)
      .set({ viewerVotes: votes })
      .where(eq(scheduledDebates.id, debateId));

    this.broadcastDebateEvent(debateId, {
      type: 'vote-update',
      debateId,
      votes,
    });

    return votes;
  }

  static subscribeToDebate(debateId: string, ws: WebSocket) {
    if (!debateSubscribers.has(debateId)) {
      debateSubscribers.set(debateId, new Set());
    }
    debateSubscribers.get(debateId)!.add(ws);
  }

  static unsubscribeFromDebate(debateId: string, ws: WebSocket) {
    debateSubscribers.get(debateId)?.delete(ws);
  }

  private static broadcastDebateEvent(debateId: string, event: any) {
    const subscribers = debateSubscribers.get(debateId);
    if (!subscribers) return;

    const message = JSON.stringify(event);
    subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  static async getUpcomingDebates(limit: number = 10) {
    const now = new Date();
    return db.select({
      id: scheduledDebates.id,
      topic: scheduledDebates.topic,
      description: scheduledDebates.description,
      category: scheduledDebates.category,
      scheduledStartTime: scheduledDebates.scheduledStartTime,
      status: scheduledDebates.status,
      maxRounds: scheduledDebates.maxRounds,
      enableVoice: scheduledDebates.enableVoice,
      avatar1Id: scheduledDebates.avatar1Id,
      avatar2Id: scheduledDebates.avatar2Id,
    })
    .from(scheduledDebates)
    .where(or(
      eq(scheduledDebates.status, 'scheduled'),
      eq(scheduledDebates.status, 'live')
    ))
    .orderBy(scheduledDebates.scheduledStartTime)
    .limit(limit);
  }

  static async getLiveDebates() {
    return db.select()
      .from(scheduledDebates)
      .where(eq(scheduledDebates.status, 'live'));
  }

  static async getDebateById(debateId: string) {
    const [debate] = await db.select()
      .from(scheduledDebates)
      .where(eq(scheduledDebates.id, debateId))
      .limit(1);
    return debate;
  }

  static async getRecentDebates(limit: number = 20) {
    return db.select()
      .from(scheduledDebates)
      .where(eq(scheduledDebates.status, 'completed'))
      .orderBy(desc(scheduledDebates.endTime))
      .limit(limit);
  }

  static getActiveDebate(debateId: string): ActiveDebate | null {
    return activeDebates.get(debateId) || null;
  }

  static cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    activeDebates.forEach((debate, id) => {
      if (debate.turnTimer) {
        clearTimeout(debate.turnTimer);
      }
    });
    activeDebates.clear();
    debateSubscribers.clear();
  }
}
