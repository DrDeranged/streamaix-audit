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
  avatar1: { id: string; name: string; imageUrl?: string; tradingStyle?: string; marketOutlook?: string };
  avatar2: { id: string; name: string; imageUrl?: string; tradingStyle?: string; marketOutlook?: string };
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
  hasIntroductions?: boolean;
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
      maxRounds: params.maxRounds || 20,
      turnDurationSeconds: params.turnDurationSeconds || 30,
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
        imageUrl: avatar1[0].imageUrl || undefined,
        tradingStyle: avatar1[0].tradingStyle || undefined,
        marketOutlook: avatar1[0].marketOutlook || undefined,
      },
      avatar2: {
        id: avatar2[0].id,
        name: avatar2[0].name,
        imageUrl: avatar2[0].imageUrl || undefined,
        tradingStyle: avatar2[0].tradingStyle || undefined,
        marketOutlook: avatar2[0].marketOutlook || undefined,
      },
      topic: debate.topic,
      maxRounds: debate.maxRounds || 20,
      turnDurationMs: (debate.turnDurationSeconds || 30) * 1000,
      enableVoice: debate.enableVoice !== false,
      currentRound: 0,
      currentSpeaker: 1,
      exchanges: [],
      isActive: true,
      turnTimer: null,
      streamId: debate.streamId || undefined,
      hasIntroductions: false,
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
      avatar1: { id: avatar1[0].id, name: avatar1[0].name, imageUrl: avatar1[0].imageUrl },
      avatar2: { id: avatar2[0].id, name: avatar2[0].name, imageUrl: avatar2[0].imageUrl },
      maxRounds: activeDebate.maxRounds,
    });

    await this.generateIntroductions(debateId);
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

  private static async generateIntroductions(debateId: string) {
    const debate = activeDebates.get(debateId);
    if (!debate || !debate.isActive || debate.hasIntroductions) return;

    console.log(`[DebateManager] Generating introductions for debate: ${debate.topic}`);

    try {
      for (const avatar of [debate.avatar1, debate.avatar2]) {
        const introText = await this.generateIntroductionText(avatar, debate.topic);
        if (!introText) continue;

        let audioBase64: string | undefined;
        if (debate.enableVoice && process.env.PAUSE_OPENAI_API !== 'true') {
          try {
            audioBase64 = await AvatarVoiceService.textToSpeechBase64(introText, avatar.name);
          } catch (audioError) {
            console.warn(`[DebateManager] TTS failed for intro ${avatar.name}:`, audioError);
          }
        }

        const introExchange: DebateExchange = {
          speakerId: avatar.id,
          speakerName: avatar.name,
          content: introText,
          audioBase64,
          timestamp: Date.now(),
        };

        debate.exchanges.push(introExchange);

        this.broadcastDebateEvent(debateId, {
          type: 'introduction',
          debateId,
          speakerName: avatar.name,
          speakerId: avatar.id,
          content: introText,
          audioBase64,
        });
      }

      debate.hasIntroductions = true;

      await db.update(scheduledDebates)
        .set({
          exchanges: debate.exchanges,
          updatedAt: new Date(),
        })
        .where(eq(scheduledDebates.id, debateId));

      console.log(`[DebateManager] Introductions complete for: ${debate.topic}`);
    } catch (error) {
      console.error(`[DebateManager] Error generating introductions:`, error);
    }
  }

  private static async generateIntroductionText(
    avatar: { id: string; name: string; tradingStyle?: string; marketOutlook?: string },
    topic: string
  ): Promise<string | null> {
    if (process.env.PAUSE_OPENAI_API === 'true') {
      return `Hey everyone, I'm ${avatar.name}. Really excited to dive into ${topic} today - this is going to be a great conversation.`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are ${avatar.name} introducing yourself at the start of a podcast conversation. Background: ${avatar.tradingStyle || 'experienced professional'}. 

Be warm and natural like you're greeting friends. Don't be formal or stiff. Use natural speech like "Hey everyone" or "What's up, I'm..." 

Keep it to 1-2 short sentences. Mention why you're excited about today's topic.`
          },
          {
            role: 'user',
            content: `Give a brief, warm podcast introduction for a conversation about: "${topic}". Be yourself - natural and engaging.`
          }
        ],
        temperature: 0.9,
        max_tokens: 80,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error(`[DebateManager] Intro generation error:`, error);
      return `Hey there, I'm ${avatar.name}. Super excited to chat about ${topic} today.`;
    }
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
      const conversationContext = debate.exchanges.slice(-6)
        .map(e => `${e.speakerName}: "${e.content}"`)
        .join('\n');

      const otherAvatar = avatar.id === debate.avatar1.id ? debate.avatar2 : debate.avatar1;
      const roundProgress = debate.currentRound / debate.maxRounds;
      
      let conversationPhase = 'opening';
      if (roundProgress > 0.7) conversationPhase = 'conclusion';
      else if (roundProgress > 0.3) conversationPhase = 'deep-dive';
      
      const phaseGuidance = {
        opening: 'Share your initial perspective and set up your key arguments. Be welcoming and engaging.',
        'deep-dive': 'Dig deeper into specifics. Share examples, data points, or personal insights. Build on what\'s been said.',
        conclusion: 'Start wrapping up. Summarize key points, find common ground, or make final compelling arguments.'
      };

      const systemPrompt = `You are ${avatar.name}, having a natural podcast-style conversation with ${otherAvatar.name} about "${debate.topic}".

Your background: ${avatar.tradingStyle || 'experienced professional'}, ${avatar.marketOutlook || 'balanced perspective'}

CRITICAL RULES FOR NATURAL CONVERSATION:
- Speak naturally like a real person on a podcast, NOT like you're reading a script
- Use conversational phrases: "You know what's interesting...", "I think the thing is...", "That's a great point, but..."
- Sometimes agree with ${otherAvatar.name}, sometimes push back politely
- Share specific examples, anecdotes, or data to support your points
- React to what was just said - don't ignore it
- Keep responses to 2-4 sentences - brief but substantive
- Use natural speech patterns with occasional filler words
- ${phaseGuidance[conversationPhase as keyof typeof phaseGuidance]}

This is round ${debate.currentRound + 1} of ${debate.maxRounds}. ${conversationPhase === 'conclusion' ? 'Start wrapping up the conversation.' : ''}`;

      const userPrompt = previousStatement
        ? `Conversation so far:\n${conversationContext}\n\n${otherAvatar.name} just said: "${previousStatement}"\n\nRespond naturally as ${avatar.name}.`
        : `You're starting this conversation on "${debate.topic}" with ${otherAvatar.name}. Give a warm, engaging opening that sets the stage.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 250,
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

  // In-memory engagement storage (persisted to DB periodically)
  private static debateEngagement = new Map<string, {
    chatMessages: any[];
    tips: any[];
    viewerQuestions: any[];
    reactions: Record<string, number>;
    viewerIds: Set<string>;
  }>();

  private static getOrCreateEngagement(debateId: string) {
    if (!this.debateEngagement.has(debateId)) {
      this.debateEngagement.set(debateId, {
        chatMessages: [],
        tips: [],
        viewerQuestions: [],
        reactions: { fire: 0, idea: 0, clap: 0, think: 0, love: 0, wow: 0 },
        viewerIds: new Set(),
      });
    }
    return this.debateEngagement.get(debateId)!;
  }

  static async addChatMessage(debateId: string, message: {
    userId: number;
    username: string;
    message: string;
    timestamp: number;
  }) {
    const engagement = this.getOrCreateEngagement(debateId);
    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...message,
    };
    engagement.chatMessages.push(chatMessage);
    
    // Keep only last 200 messages
    if (engagement.chatMessages.length > 200) {
      engagement.chatMessages = engagement.chatMessages.slice(-200);
    }

    this.broadcastDebateEvent(debateId, {
      type: 'chat-message',
      debateId,
      message: chatMessage,
    });

    return chatMessage;
  }

  static async getChatMessages(debateId: string) {
    const engagement = this.getOrCreateEngagement(debateId);
    return engagement.chatMessages.slice(-100);
  }

  static async tipAvatar(debateId: string, tip: {
    userId: number;
    username: string;
    avatarNumber: 1 | 2;
    amount: number;
    timestamp: number;
  }) {
    const engagement = this.getOrCreateEngagement(debateId);
    const tipRecord = {
      id: `tip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...tip,
    };
    engagement.tips.push(tipRecord);

    this.broadcastDebateEvent(debateId, {
      type: 'tip',
      debateId,
      tip: tipRecord,
    });

    return tipRecord;
  }

  static async getTips(debateId: string) {
    const engagement = this.getOrCreateEngagement(debateId);
    return {
      tips: engagement.tips,
      totalAvatar1: engagement.tips.filter(t => t.avatarNumber === 1).reduce((sum, t) => sum + t.amount, 0),
      totalAvatar2: engagement.tips.filter(t => t.avatarNumber === 2).reduce((sum, t) => sum + t.amount, 0),
      topTippers: this.getTopTippers(engagement.tips),
    };
  }

  private static getTopTippers(tips: any[]) {
    const tipsByUser = new Map<string, { username: string; total: number }>();
    tips.forEach(tip => {
      const key = tip.userId.toString();
      if (!tipsByUser.has(key)) {
        tipsByUser.set(key, { username: tip.username, total: 0 });
      }
      tipsByUser.get(key)!.total += tip.amount;
    });
    return Array.from(tipsByUser.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }

  static async addViewerQuestion(debateId: string, question: {
    userId: number;
    username: string;
    question: string;
    timestamp: number;
    upvotes: number;
  }) {
    const engagement = this.getOrCreateEngagement(debateId);
    const viewerQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...question,
      upvotedBy: new Set<string>(),
    };
    engagement.viewerQuestions.push(viewerQuestion);

    this.broadcastDebateEvent(debateId, {
      type: 'new-question',
      debateId,
      question: { ...viewerQuestion, upvotedBy: undefined },
    });

    return { ...viewerQuestion, upvotedBy: undefined };
  }

  static async getViewerQuestions(debateId: string) {
    const engagement = this.getOrCreateEngagement(debateId);
    return engagement.viewerQuestions
      .map(q => ({ ...q, upvotedBy: undefined }))
      .sort((a, b) => b.upvotes - a.upvotes);
  }

  static async upvoteQuestion(debateId: string, questionId: string, userId: number) {
    const engagement = this.getOrCreateEngagement(debateId);
    const question = engagement.viewerQuestions.find(q => q.id === questionId);
    if (!question) return { success: false };

    const userKey = userId.toString();
    if (question.upvotedBy.has(userKey)) {
      return { success: false, message: 'Already upvoted' };
    }

    question.upvotedBy.add(userKey);
    question.upvotes++;

    this.broadcastDebateEvent(debateId, {
      type: 'question-upvote',
      debateId,
      questionId,
      upvotes: question.upvotes,
    });

    return { success: true, upvotes: question.upvotes };
  }

  static async addReaction(debateId: string, reaction: string, userId: number) {
    const engagement = this.getOrCreateEngagement(debateId);
    engagement.reactions[reaction] = (engagement.reactions[reaction] || 0) + 1;

    this.broadcastDebateEvent(debateId, {
      type: 'reaction',
      debateId,
      reaction,
      count: engagement.reactions[reaction],
      userId,
    });

    return engagement.reactions;
  }

  static async getEngagementStats(debateId: string) {
    const engagement = this.getOrCreateEngagement(debateId);
    return {
      viewerCount: engagement.viewerIds.size,
      messageCount: engagement.chatMessages.length,
      totalTips: engagement.tips.reduce((sum, t) => sum + t.amount, 0),
      questionCount: engagement.viewerQuestions.length,
      reactions: engagement.reactions,
    };
  }

  static trackViewer(debateId: string, viewerId: string) {
    const engagement = this.getOrCreateEngagement(debateId);
    engagement.viewerIds.add(viewerId);
  }
}
