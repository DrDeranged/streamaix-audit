import { WebSocket } from 'ws';
import { db } from '../db';
import { 
  streamParticipants, 
  streamConversationMessages, 
  knowledgeAvatars,
  liveStreams,
  users 
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
import { modelGateway } from "../lib/modelGateway";
// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

interface ConversationParticipant {
  id: string;
  participantId: string; // DB participant ID
  type: 'user' | 'avatar';
  userId?: string;
  avatarId?: string;
  name: string;
  imageUrl?: string;
  role: 'host' | 'co_host' | 'speaker' | 'viewer';
  audioPreference: 'microphone' | 'tts' | 'text_only';
  speakingStatus: 'idle' | 'speaking' | 'requested' | 'queued';
  queuePosition?: number;
  isMuted: boolean;
  ws: WebSocket;
  joinedAt: number;
}

interface ConversationMessage {
  id: string;
  participantId: string;
  speakerType: 'user' | 'avatar';
  speakerName: string;
  textContent: string;
  audioUrl?: string;
  audioDurationMs?: number;
  sourceType: 'microphone_transcription' | 'tts_generated' | 'text_input';
  replyToMessageId?: string;
  timestamp: number;
}

interface ConversationRoom {
  streamId: string;
  hostAvatarId?: string;
  hostUserId?: string;
  participants: Map<string, ConversationParticipant>;
  speakerQueue: string[]; // participantIds in order
  conversationHistory: ConversationMessage[];
  currentSpeaker?: string; // participantId
  isActive: boolean;
  createdAt: number;
}

interface ConversationWebSocketMessage {
  type: 
    | 'join-conversation' 
    | 'leave-conversation'
    | 'request-speak'
    | 'cancel-speak-request'
    | 'grant-speaking'
    | 'revoke-speaking'
    | 'audio-chunk'
    | 'transcription'
    | 'text-input'
    | 'avatar-response'
    | 'speaker-queue-update'
    | 'participant-update'
    | 'mute'
    | 'unmute'
    | 'set-audio-preference'
    | 'conversation-history'
    | 'error';
  streamId: string;
  data?: any;
  timestamp?: number;
}

export class StreamConversationService {
  private rooms = new Map<string, ConversationRoom>();
  private participantConnections = new Map<string, WebSocket>(); // participantId -> ws
  
  private readonly PAUSE_OPENAI = process.env.PAUSE_OPENAI_API === 'true';
  private readonly PAUSE_ANTHROPIC = process.env.PAUSE_ANTHROPIC_API === 'true';
  private readonly QUIET_MODE = process.env.QUIET_MODE === 'true';
  private readonly MAX_CONTEXT_MESSAGES = 30;
  private readonly TTS_WHITELIST = ['haydenzadams', 'hayden adams', 'Hayden Adams'];
  
  constructor() {
    console.log('[StreamConversation] Service initialized');
    console.log(`[StreamConversation] PAUSE_OPENAI_API: ${this.PAUSE_OPENAI}, QUIET_MODE: ${this.QUIET_MODE}`);
  }

  async handleConnection(
    ws: WebSocket,
    streamId: string,
    userId?: string,
    avatarId?: string,
    role: 'host' | 'co_host' | 'speaker' | 'viewer' = 'viewer',
    audioPreference: 'microphone' | 'tts' | 'text_only' = 'text_only'
  ) {
    try {
      // Validate: must have either userId or avatarId
      if (!userId && !avatarId) {
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Must provide userId or avatarId' } }));
        ws.close();
        return;
      }

      // Get or create conversation room
      let room = this.rooms.get(streamId);
      if (!room) {
        const newRoom = await this.createRoom(streamId);
        if (!newRoom) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Stream not found' } }));
          ws.close();
          return;
        }
        room = newRoom;
      }

      // Get participant info
      let participant: ConversationParticipant;
      
      if (avatarId) {
        const [avatar] = await db.select()
          .from(knowledgeAvatars)
          .where(eq(knowledgeAvatars.id, avatarId))
          .limit(1);
        
        if (!avatar) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Avatar not found' } }));
          ws.close();
          return;
        }

        // Create participant record
        const [participantRecord] = await db.insert(streamParticipants).values({
          streamId,
          avatarId,
          participantType: 'avatar',
          role,
          audioPreference: 'tts',
          speakingStatus: 'idle',
          isActive: true,
        }).returning();

        participant = {
          id: `avatar-${avatarId}`,
          participantId: participantRecord.id,
          type: 'avatar',
          avatarId,
          name: avatar.name,
          imageUrl: avatar.imageUrl || undefined,
          role,
          audioPreference: 'tts',
          speakingStatus: 'idle',
          isMuted: false,
          ws,
          joinedAt: Date.now(),
        };
      } else {
        const [user] = await db.select()
          .from(users)
          .where(eq(users.id, userId!))
          .limit(1);
        
        if (!user) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'User not found' } }));
          ws.close();
          return;
        }

        // Create participant record
        const [participantRecord] = await db.insert(streamParticipants).values({
          streamId,
          userId,
          participantType: 'user',
          role,
          audioPreference,
          speakingStatus: 'idle',
          isActive: true,
        }).returning();

        participant = {
          id: `user-${userId}`,
          participantId: participantRecord.id,
          type: 'user',
          userId,
          name: user.username || 'Anonymous',
          imageUrl: user.avatar || undefined,
          role,
          audioPreference,
          speakingStatus: 'idle',
          isMuted: false,
          ws,
          joinedAt: Date.now(),
        };
      }

      // Add to room
      room.participants.set(participant.id, participant);
      this.participantConnections.set(participant.participantId, ws);

      // Send conversation history to new participant
      ws.send(JSON.stringify({
        type: 'conversation-history',
        streamId,
        data: {
          history: room.conversationHistory.slice(-this.MAX_CONTEXT_MESSAGES),
          participants: this.getParticipantList(room),
          speakerQueue: room.speakerQueue,
          currentSpeaker: room.currentSpeaker,
        },
        timestamp: Date.now(),
      }));

      // Broadcast participant joined
      this.broadcastToRoom(streamId, {
        type: 'participant-update',
        streamId,
        data: {
          action: 'joined',
          participant: this.sanitizeParticipant(participant),
          participants: this.getParticipantList(room),
        },
        timestamp: Date.now(),
      }, participant.id);

      // Handle messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message: ConversationWebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(streamId, participant.id, message);
        } catch (error) {
          console.error('[StreamConversation] Error handling message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(streamId, participant);
      });

      console.log(`[StreamConversation] ${participant.type === 'avatar' ? 'Avatar' : 'User'} ${participant.name} joined stream ${streamId}`);
    } catch (error) {
      console.error('[StreamConversation] Error handling connection:', error);
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Failed to join conversation' } }));
      ws.close();
    }
  }

  private async createRoom(streamId: string): Promise<ConversationRoom | null> {
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, streamId))
      .limit(1);

    if (!stream) return null;

    const room: ConversationRoom = {
      streamId,
      hostAvatarId: stream.hostAvatarId || undefined,
      hostUserId: stream.hostId,
      participants: new Map(),
      speakerQueue: [],
      conversationHistory: [],
      isActive: true,
      createdAt: Date.now(),
    };

    // Load recent conversation history from DB
    const recentMessages = await db.select()
      .from(streamConversationMessages)
      .where(eq(streamConversationMessages.streamId, streamId))
      .orderBy(desc(streamConversationMessages.createdAt))
      .limit(this.MAX_CONTEXT_MESSAGES);

    room.conversationHistory = recentMessages.reverse().map(msg => ({
      id: msg.id,
      participantId: msg.participantId,
      speakerType: msg.speakerType as 'user' | 'avatar',
      speakerName: msg.speakerName,
      textContent: msg.textContent,
      audioUrl: msg.audioUrl || undefined,
      audioDurationMs: msg.audioDurationMs || undefined,
      sourceType: msg.sourceType as 'microphone_transcription' | 'tts_generated' | 'text_input',
      replyToMessageId: msg.replyToMessageId || undefined,
      timestamp: msg.createdAt?.getTime() || Date.now(),
    }));

    this.rooms.set(streamId, room);
    console.log(`[StreamConversation] Created room for stream ${streamId}`);
    
    return room;
  }

  private async handleMessage(
    streamId: string,
    participantId: string,
    message: ConversationWebSocketMessage
  ) {
    const room = this.rooms.get(streamId);
    if (!room) return;

    const participant = room.participants.get(participantId);
    if (!participant) return;

    switch (message.type) {
      case 'request-speak':
        await this.handleRequestSpeak(room, participant);
        break;

      case 'cancel-speak-request':
        await this.handleCancelSpeakRequest(room, participant);
        break;

      case 'grant-speaking':
        // Only hosts/co-hosts can grant speaking
        if (participant.role === 'host' || participant.role === 'co_host') {
          const targetId = message.data?.participantId;
          if (targetId) {
            await this.grantSpeaking(room, targetId);
          }
        }
        break;

      case 'revoke-speaking':
        if (participant.role === 'host' || participant.role === 'co_host') {
          const targetId = message.data?.participantId;
          if (targetId) {
            await this.revokeSpeaking(room, targetId);
          }
        }
        break;

      case 'audio-chunk':
        // Handle incoming audio from microphone
        if (participant.speakingStatus === 'speaking' && !participant.isMuted) {
          await this.handleAudioChunk(room, participant, message.data);
        }
        break;

      case 'transcription':
        // Human speech transcribed via Whisper
        if (participant.speakingStatus === 'speaking') {
          await this.handleTranscription(room, participant, message.data);
        }
        break;

      case 'text-input':
        // Text message (non-audio)
        await this.handleTextInput(room, participant, message.data);
        break;

      case 'mute':
        participant.isMuted = true;
        this.broadcastParticipantUpdate(room, participant);
        break;

      case 'unmute':
        participant.isMuted = false;
        this.broadcastParticipantUpdate(room, participant);
        break;

      case 'set-audio-preference':
        const newPref = message.data?.preference;
        if (['microphone', 'tts', 'text_only'].includes(newPref)) {
          participant.audioPreference = newPref;
          // Update in DB
          await db.update(streamParticipants)
            .set({ audioPreference: newPref })
            .where(eq(streamParticipants.id, participant.participantId));
          this.broadcastParticipantUpdate(room, participant);
        }
        break;
    }
  }

  private async handleRequestSpeak(room: ConversationRoom, participant: ConversationParticipant) {
    // Don't allow if already speaking or in queue
    if (participant.speakingStatus !== 'idle') return;

    participant.speakingStatus = 'queued';
    participant.queuePosition = room.speakerQueue.length + 1;
    room.speakerQueue.push(participant.id);

    // Update DB
    await db.update(streamParticipants)
      .set({ 
        speakingStatus: 'queued',
        speakerQueuePosition: participant.queuePosition,
        speakRequestedAt: new Date(),
      })
      .where(eq(streamParticipants.id, participant.participantId));

    // Broadcast queue update
    this.broadcastSpeakerQueueUpdate(room);

    // If no current speaker, grant speaking to first in queue
    if (!room.currentSpeaker) {
      await this.grantSpeaking(room, participant.id);
    }
  }

  private async handleCancelSpeakRequest(room: ConversationRoom, participant: ConversationParticipant) {
    if (participant.speakingStatus === 'queued') {
      room.speakerQueue = room.speakerQueue.filter(id => id !== participant.id);
      participant.speakingStatus = 'idle';
      participant.queuePosition = undefined;
      
      // Update queue positions
      room.speakerQueue.forEach((id, idx) => {
        const p = room.participants.get(id);
        if (p) p.queuePosition = idx + 1;
      });

      await db.update(streamParticipants)
        .set({ speakingStatus: 'idle', speakerQueuePosition: null })
        .where(eq(streamParticipants.id, participant.participantId));

      this.broadcastSpeakerQueueUpdate(room);
    }
  }

  private async grantSpeaking(room: ConversationRoom, participantId: string) {
    const participant = room.participants.get(participantId);
    if (!participant) return;

    // Remove from queue
    room.speakerQueue = room.speakerQueue.filter(id => id !== participantId);
    
    // Set as current speaker
    room.currentSpeaker = participantId;
    participant.speakingStatus = 'speaking';
    participant.queuePosition = undefined;

    await db.update(streamParticipants)
      .set({ 
        speakingStatus: 'speaking',
        speakerQueuePosition: null,
        speakApprovedAt: new Date(),
        lastAudioActivity: new Date(),
      })
      .where(eq(streamParticipants.id, participant.participantId));

    // Notify participant they can speak
    participant.ws.send(JSON.stringify({
      type: 'grant-speaking',
      streamId: room.streamId,
      data: { message: 'You can now speak' },
      timestamp: Date.now(),
    }));

    this.broadcastSpeakerQueueUpdate(room);
  }

  private async revokeSpeaking(room: ConversationRoom, participantId: string) {
    const participant = room.participants.get(participantId);
    if (!participant) return;

    if (room.currentSpeaker === participantId) {
      room.currentSpeaker = undefined;
    }
    
    participant.speakingStatus = 'idle';

    await db.update(streamParticipants)
      .set({ speakingStatus: 'idle' })
      .where(eq(streamParticipants.id, participant.participantId));

    participant.ws.send(JSON.stringify({
      type: 'revoke-speaking',
      streamId: room.streamId,
      data: { message: 'Your speaking time has ended' },
      timestamp: Date.now(),
    }));

    // Grant speaking to next in queue
    if (room.speakerQueue.length > 0) {
      await this.grantSpeaking(room, room.speakerQueue[0]);
    }

    this.broadcastSpeakerQueueUpdate(room);
  }

  private async handleAudioChunk(
    room: ConversationRoom, 
    participant: ConversationParticipant, 
    data: { audioBase64: string; sequence: number }
  ) {
    // Broadcast audio to all participants for playback
    this.broadcastToRoom(room.streamId, {
      type: 'audio-chunk',
      streamId: room.streamId,
      data: {
        participantId: participant.id,
        speakerName: participant.name,
        speakerType: participant.type,
        audioBase64: data.audioBase64,
        sequence: data.sequence,
      },
      timestamp: Date.now(),
    }, participant.id);
  }

  private async handleTranscription(
    room: ConversationRoom,
    participant: ConversationParticipant,
    data: { text: string; isFinal: boolean }
  ) {
    // Broadcast live transcription to all
    this.broadcastToRoom(room.streamId, {
      type: 'transcription',
      streamId: room.streamId,
      data: {
        participantId: participant.id,
        speakerName: participant.name,
        text: data.text,
        isFinal: data.isFinal,
      },
      timestamp: Date.now(),
    });

    // If final transcription, save to DB and trigger avatar response
    if (data.isFinal && data.text.trim()) {
      const convMessage = await this.saveConversationMessage(room, participant, data.text, 'microphone_transcription');
      
      // Check if we should trigger an avatar response
      if (room.hostAvatarId && participant.type === 'user') {
        await this.triggerAvatarResponse(room, convMessage);
      }
    }
  }

  private async handleTextInput(
    room: ConversationRoom,
    participant: ConversationParticipant,
    data: { text: string }
  ) {
    if (!data.text?.trim()) return;

    const convMessage = await this.saveConversationMessage(room, participant, data.text, 'text_input');

    // Broadcast to all
    this.broadcastToRoom(room.streamId, {
      type: 'text-input',
      streamId: room.streamId,
      data: {
        message: convMessage,
      },
      timestamp: Date.now(),
    });

    // Check if we should trigger an avatar response
    if (room.hostAvatarId && participant.type === 'user') {
      await this.triggerAvatarResponse(room, convMessage);
    }
  }

  private async saveConversationMessage(
    room: ConversationRoom,
    participant: ConversationParticipant,
    text: string,
    sourceType: 'microphone_transcription' | 'tts_generated' | 'text_input'
  ): Promise<ConversationMessage> {
    const [dbMessage] = await db.insert(streamConversationMessages).values({
      streamId: room.streamId,
      participantId: participant.participantId,
      speakerType: participant.type,
      speakerUserId: participant.userId,
      speakerAvatarId: participant.avatarId,
      speakerName: participant.name,
      textContent: text,
      sourceType,
    }).returning();

    const convMessage: ConversationMessage = {
      id: dbMessage.id,
      participantId: participant.participantId,
      speakerType: participant.type,
      speakerName: participant.name,
      textContent: text,
      sourceType,
      timestamp: Date.now(),
    };

    room.conversationHistory.push(convMessage);
    
    // Keep history bounded
    if (room.conversationHistory.length > this.MAX_CONTEXT_MESSAGES * 2) {
      room.conversationHistory = room.conversationHistory.slice(-this.MAX_CONTEXT_MESSAGES);
    }

    return convMessage;
  }

  private async triggerAvatarResponse(room: ConversationRoom, triggerMessage: ConversationMessage) {
    if (this.PAUSE_ANTHROPIC) {
      console.log('[StreamConversation] Anthropic API paused, skipping avatar response');
      return;
    }

    if (!room.hostAvatarId) return;

    try {
      // Get avatar info
      const [avatar] = await db.select()
        .from(knowledgeAvatars)
        .where(eq(knowledgeAvatars.id, room.hostAvatarId))
        .limit(1);

      if (!avatar) return;

      // Check TTS whitelist
      const isTTSEnabled = this.TTS_WHITELIST.some(name => 
        avatar.name.toLowerCase().includes(name.toLowerCase()) ||
        avatar.handle?.toLowerCase().includes(name.toLowerCase())
      );

      // Build conversation context
      const contextMessages = room.conversationHistory.slice(-this.MAX_CONTEXT_MESSAGES);
      const conversationContext = contextMessages.map(msg => 
        `${msg.speakerName}: ${msg.textContent}`
      ).join('\n');

      // Generate response
      const systemPrompt = `You are ${avatar.name}, a ${avatar.expertise || 'crypto and tech'} expert. 
Background: ${avatar.bio || 'A respected industry figure with deep expertise.'}
You are participating in a live audio conversation stream. Keep responses conversational, concise (2-4 sentences max), and engaging.
Never break character. Respond naturally as if in a real conversation.`;

      const response = await modelGateway.complete({
        tier: "reasoning",
        system: systemPrompt,
        user: `Recent conversation:\n${conversationContext}\n\nRespond to the latest message from ${triggerMessage.speakerName}.`,
        maxTokens: 200,
        temperature: 0.8,
      });

      const responseText = response.content;
      if (!responseText) return;

      // Find avatar participant or create one
      let avatarParticipant = Array.from(room.participants.values())
        .find(p => p.avatarId === room.hostAvatarId);

      if (!avatarParticipant) {
        // Avatar not actively connected, use a placeholder
        avatarParticipant = {
          id: `avatar-${room.hostAvatarId}`,
          participantId: 'system-avatar',
          type: 'avatar',
          avatarId: room.hostAvatarId,
          name: avatar.name,
          imageUrl: avatar.imageUrl || undefined,
          role: 'host',
          audioPreference: 'tts',
          speakingStatus: 'idle',
          isMuted: false,
          ws: null as any,
          joinedAt: Date.now(),
        };
      }

      // Save avatar response
      const [dbMessage] = await db.insert(streamConversationMessages).values({
        streamId: room.streamId,
        participantId: avatarParticipant.participantId,
        speakerType: 'avatar',
        speakerAvatarId: room.hostAvatarId,
        speakerName: avatar.name,
        textContent: responseText,
        sourceType: 'tts_generated',
        replyToMessageId: triggerMessage.id,
      }).returning();

      const avatarMessage: ConversationMessage = {
        id: dbMessage.id,
        participantId: avatarParticipant.participantId,
        speakerType: 'avatar',
        speakerName: avatar.name,
        textContent: responseText,
        sourceType: 'tts_generated',
        replyToMessageId: triggerMessage.id,
        timestamp: Date.now(),
      };

      room.conversationHistory.push(avatarMessage);

      // Generate TTS if whitelisted
      let audioUrl: string | undefined;
      let audioDurationMs: number | undefined;

      if (isTTSEnabled) {
        try {
          const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'onyx',
            input: responseText,
          });
          
          const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
          const audioBase64 = audioBuffer.toString('base64');
          
          // Estimate duration (rough: ~150 words per minute)
          const wordCount = responseText.split(' ').length;
          audioDurationMs = Math.round((wordCount / 150) * 60 * 1000);

          // Broadcast audio response
          this.broadcastToRoom(room.streamId, {
            type: 'avatar-response',
            streamId: room.streamId,
            data: {
              message: avatarMessage,
              audioBase64,
              audioDurationMs,
            },
            timestamp: Date.now(),
          });
        } catch (ttsError) {
          console.error('[StreamConversation] TTS generation failed:', ttsError);
        }
      }

      // Broadcast text response (always)
      if (!isTTSEnabled) {
        this.broadcastToRoom(room.streamId, {
          type: 'avatar-response',
          streamId: room.streamId,
          data: {
            message: avatarMessage,
          },
          timestamp: Date.now(),
        });
      }

      console.log(`[StreamConversation] Avatar ${avatar.name} responded: "${responseText.substring(0, 50)}..."`);
    } catch (error) {
      console.error('[StreamConversation] Error generating avatar response:', error);
    }
  }

  private handleDisconnection(streamId: string, participant: ConversationParticipant) {
    const room = this.rooms.get(streamId);
    if (!room) return;

    // Remove from room
    room.participants.delete(participant.id);
    this.participantConnections.delete(participant.participantId);

    // Remove from queue if present
    room.speakerQueue = room.speakerQueue.filter(id => id !== participant.id);
    if (room.currentSpeaker === participant.id) {
      room.currentSpeaker = undefined;
      // Grant to next in queue
      if (room.speakerQueue.length > 0) {
        this.grantSpeaking(room, room.speakerQueue[0]);
      }
    }

    // Update DB
    db.update(streamParticipants)
      .set({ isActive: false, leftAt: new Date() })
      .where(eq(streamParticipants.id, participant.participantId))
      .catch(err => console.error('[StreamConversation] Error updating participant:', err));

    // Broadcast participant left
    this.broadcastToRoom(streamId, {
      type: 'participant-update',
      streamId,
      data: {
        action: 'left',
        participantId: participant.id,
        participants: this.getParticipantList(room),
      },
      timestamp: Date.now(),
    });

    // Clean up empty rooms
    if (room.participants.size === 0) {
      setTimeout(() => {
        const currentRoom = this.rooms.get(streamId);
        if (currentRoom && currentRoom.participants.size === 0) {
          this.rooms.delete(streamId);
          console.log(`[StreamConversation] Cleaned up empty room: ${streamId}`);
        }
      }, 5 * 60 * 1000);
    }

    console.log(`[StreamConversation] ${participant.name} left stream ${streamId}`);
  }

  private broadcastToRoom(
    streamId: string, 
    message: ConversationWebSocketMessage, 
    excludeParticipantId?: string
  ) {
    const room = this.rooms.get(streamId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    room.participants.forEach((participant, id) => {
      if (id !== excludeParticipantId && participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(messageStr);
      }
    });
  }

  private broadcastSpeakerQueueUpdate(room: ConversationRoom) {
    this.broadcastToRoom(room.streamId, {
      type: 'speaker-queue-update',
      streamId: room.streamId,
      data: {
        queue: room.speakerQueue.map(id => {
          const p = room.participants.get(id);
          return p ? this.sanitizeParticipant(p) : null;
        }).filter(Boolean),
        currentSpeaker: room.currentSpeaker ? 
          this.sanitizeParticipant(room.participants.get(room.currentSpeaker)!) : null,
      },
      timestamp: Date.now(),
    });
  }

  private broadcastParticipantUpdate(room: ConversationRoom, participant: ConversationParticipant) {
    this.broadcastToRoom(room.streamId, {
      type: 'participant-update',
      streamId: room.streamId,
      data: {
        action: 'updated',
        participant: this.sanitizeParticipant(participant),
      },
      timestamp: Date.now(),
    });
  }

  private getParticipantList(room: ConversationRoom): any[] {
    return Array.from(room.participants.values()).map(p => this.sanitizeParticipant(p));
  }

  private sanitizeParticipant(p: ConversationParticipant): any {
    return {
      id: p.id,
      participantId: p.participantId,
      type: p.type,
      name: p.name,
      imageUrl: p.imageUrl,
      role: p.role,
      audioPreference: p.audioPreference,
      speakingStatus: p.speakingStatus,
      queuePosition: p.queuePosition,
      isMuted: p.isMuted,
    };
  }

  // Endpoint for Whisper transcription
  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    if (this.PAUSE_OPENAI) {
      throw new Error('OpenAI API is paused');
    }

    try {
      const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'en',
      });
      return transcription.text;
    } catch (error) {
      console.error('[StreamConversation] Transcription error:', error);
      throw error;
    }
  }

  // Get room info for API
  getRoomInfo(streamId: string): any | null {
    const room = this.rooms.get(streamId);
    if (!room) return null;

    return {
      streamId: room.streamId,
      hostAvatarId: room.hostAvatarId,
      hostUserId: room.hostUserId,
      participantCount: room.participants.size,
      participants: this.getParticipantList(room),
      speakerQueue: room.speakerQueue,
      currentSpeaker: room.currentSpeaker,
      isActive: room.isActive,
    };
  }
}

// Singleton instance
let streamConversationService: StreamConversationService | null = null;

export function getStreamConversationService(): StreamConversationService {
  if (!streamConversationService) {
    streamConversationService = new StreamConversationService();
  }
  return streamConversationService;
}
