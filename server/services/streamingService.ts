import { WebSocket } from 'ws';
import { db } from '../db';
import { liveStreams, streamMessages, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { pushNotificationService } from './pushNotificationService';

interface StreamMessage {
  type: 'join' | 'leave' | 'chat' | 'tip' | 'reaction' | 'viewer-count' | 'stream-end' | 'ai-message' | 
        'webrtc-offer' | 'webrtc-answer' | 'webrtc-ice-candidate' | 'request-offer' | 'broadcaster-ready' | 'broadcaster-left';
  streamId: string;
  userId: string;
  username?: string;
  avatar?: string;
  isAiAgent?: boolean;
  data?: any;
  timestamp?: number;
  targetUserId?: string;
}

interface StreamViewer {
  odatetime: string;
  odlUserId: string;
  userId: string;
  username: string;
  avatar?: string;
  isAiAgent: boolean;
  ws: WebSocket;
  joinedAt: number;
}

interface StreamSession {
  streamId: string;
  hostId: string;
  hostUsername: string;
  streamTitle: string;
  viewers: Map<string, StreamViewer>;
  broadcasterWs: WebSocket | null;
  broadcasterUserId: string | null;
  messages: Array<{
    id: string;
    userId: string;
    username: string;
    content: string;
    isAiAgent: boolean;
    timestamp: number;
  }>;
  tips: Array<{
    id: string;
    fromUserId: string;
    fromUsername: string;
    amount: number;
    message?: string;
    timestamp: number;
  }>;
  isLive: boolean;
  startedAt: number;
  peakViewers: number;
  notifiedMilestones: Set<number>;
}

export class StreamingService {
  private sessions = new Map<string, StreamSession>();
  private viewerStreams = new Map<string, Set<string>>(); // userId -> Set of streamIds

  constructor() {}

  async handleConnection(
    ws: WebSocket, 
    streamId: string,
    userId: string, 
    username: string, 
    avatar?: string,
    isAiAgent: boolean = false
  ) {
    // Get or create session
    let session = this.sessions.get(streamId);
    
    if (!session) {
      // Check if stream exists in database
      const [streamRecord] = await db.select()
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId))
        .limit(1);
        
      if (!streamRecord) {
        ws.send(JSON.stringify({ type: 'error', message: 'Stream not found' }));
        ws.close();
        return;
      }
      
      // Get host username
      const [hostUser] = await db.select({ username: users.username })
        .from(users)
        .where(eq(users.id, streamRecord.hostId))
        .limit(1);

      session = {
        streamId,
        hostId: streamRecord.hostId,
        hostUsername: hostUser?.username || 'unknown',
        streamTitle: streamRecord.title || 'Untitled Stream',
        viewers: new Map(),
        broadcasterWs: null,
        broadcasterUserId: null,
        messages: [],
        tips: [],
        isLive: streamRecord.status === 'live',
        startedAt: Date.now(),
        peakViewers: 0,
        notifiedMilestones: new Set<number>(),
      };
      this.sessions.set(streamId, session);
    }

    // Add viewer to session
    const viewerKey = `${userId}-${Date.now()}`;
    session.viewers.set(viewerKey, {
      odatetime: new Date().toISOString(),
      odlUserId: viewerKey,
      userId,
      username,
      avatar,
      isAiAgent,
      ws,
      joinedAt: Date.now(),
    });

    // Track viewer's active streams
    if (!this.viewerStreams.has(userId)) {
      this.viewerStreams.set(userId, new Set());
    }
    this.viewerStreams.get(userId)!.add(streamId);

    // Update peak viewers and check milestones
    const currentViewerCount = session.viewers.size;
    if (currentViewerCount > session.peakViewers) {
      session.peakViewers = currentViewerCount;
      
      // Check viewer milestones
      const viewerMilestones = [10, 25, 50, 100, 250, 500, 1000, 5000];
      for (const milestone of viewerMilestones) {
        if (currentViewerCount >= milestone && !session.notifiedMilestones.has(milestone)) {
          session.notifiedMilestones.add(milestone);
          pushNotificationService.notifyStreamMilestone(
            session.hostId,
            'viewers',
            milestone,
            session.streamTitle,
            streamId
          ).catch(err => console.error('Error sending viewer milestone notification:', err));
        }
      }
    }

    // Update database viewer count
    await this.updateViewerCount(streamId);

    // Broadcast viewer count update
    this.broadcastToStream(streamId, {
      type: 'viewer-count',
      streamId,
      userId: '',
      data: { count: currentViewerCount },
    });

    // Send recent messages to new viewer
    ws.send(JSON.stringify({
      type: 'chat-history',
      data: session.messages.slice(-50), // Last 50 messages
    }));

    // Notify others about join
    this.broadcastToStream(streamId, {
      type: 'join',
      streamId,
      userId,
      username,
      isAiAgent,
      timestamp: Date.now(),
    }, userId);

    // Handle WebSocket messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message: StreamMessage = JSON.parse(data.toString());
        await this.handleMessage(streamId, userId, username, isAiAgent, message);
      } catch (error) {
        console.error('Error handling stream message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(streamId, viewerKey, userId, username, isAiAgent);
    });

    console.log(`[Streaming] ${isAiAgent ? 'AI Agent' : 'User'} ${username} joined stream ${streamId}. Viewers: ${currentViewerCount}`);
  }

  private async handleMessage(
    streamId: string, 
    userId: string, 
    username: string,
    isAiAgent: boolean,
    message: StreamMessage
  ) {
    const session = this.sessions.get(streamId);
    if (!session) return;

    switch (message.type) {
      case 'chat':
        const chatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          username,
          content: message.data.content,
          isAiAgent,
          timestamp: Date.now(),
        };
        
        session.messages.push(chatMessage);
        
        // Keep only last 500 messages in memory
        if (session.messages.length > 500) {
          session.messages = session.messages.slice(-500);
        }

        // Save to database
        try {
          await db.insert(streamMessages).values({
            streamId,
            userId,
            content: message.data.content,
            messageType: 'chat',
          });
        } catch (error) {
          console.error('Error saving stream message:', error);
        }

        // Broadcast to all viewers
        this.broadcastToStream(streamId, {
          type: 'chat',
          streamId,
          userId,
          username,
          isAiAgent,
          data: chatMessage,
        });
        break;

      case 'tip':
        const tipData = {
          id: `tip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fromUserId: userId,
          fromUsername: username,
          amount: message.data.amount,
          message: message.data.message,
          timestamp: Date.now(),
        };

        session.tips.push(tipData);

        // Broadcast tip to all viewers (show in chat)
        this.broadcastToStream(streamId, {
          type: 'tip',
          streamId,
          userId,
          username,
          data: tipData,
        });

        // Send push notification to the host
        try {
          await pushNotificationService.notifyStreamTip(
            session.hostId,
            username,
            message.data.amount,
            session.streamTitle,
            streamId,
            message.data.message
          );

          // Check tip milestones
          const totalTips = session.tips.reduce((sum, t) => sum + t.amount, 0);
          const tipMilestones = [100, 500, 1000, 5000, 10000];
          for (const milestone of tipMilestones) {
            if (totalTips >= milestone && !session.notifiedMilestones.has(milestone * 1000)) {
              session.notifiedMilestones.add(milestone * 1000); // Use different range for tip milestones
              await pushNotificationService.notifyStreamMilestone(
                session.hostId,
                'tips',
                milestone,
                session.streamTitle,
                streamId
              );
            }
          }
        } catch (error) {
          console.error('Error sending tip notification:', error);
        }
        break;

      case 'reaction':
        // Broadcast reaction (emoji, applause, etc)
        this.broadcastToStream(streamId, {
          type: 'reaction',
          streamId,
          userId,
          username,
          isAiAgent,
          data: message.data,
        });
        break;

      // WebRTC Signaling for live video streaming
      case 'broadcaster-ready':
        // Host is ready to broadcast - store their WebSocket for signaling
        session.broadcasterWs = this.getViewerWs(session, userId);
        session.broadcasterUserId = userId;
        console.log(`[WebRTC] Broadcaster ${username} is ready for stream ${streamId}`);
        
        // Notify all existing viewers that broadcaster is ready
        this.broadcastToStream(streamId, {
          type: 'broadcaster-ready',
          streamId,
          userId,
          username,
          timestamp: Date.now(),
        }, userId);
        break;

      case 'request-offer':
        // Viewer is requesting an offer from broadcaster
        if (session.broadcasterWs && session.broadcasterWs.readyState === WebSocket.OPEN) {
          session.broadcasterWs.send(JSON.stringify({
            type: 'request-offer',
            streamId,
            userId,
            username,
            data: { viewerId: userId, viewerKey: message.data?.viewerKey },
          }));
          console.log(`[WebRTC] Viewer ${username} requesting offer from broadcaster`);
        } else {
          // Broadcaster not ready yet, notify viewer
          const viewerWs = this.getViewerWs(session, userId);
          if (viewerWs) {
            viewerWs.send(JSON.stringify({
              type: 'broadcaster-not-ready',
              streamId,
            }));
          }
        }
        break;

      case 'webrtc-offer':
        // Broadcaster sending offer to specific viewer
        if (message.targetUserId) {
          const targetWs = this.getViewerWs(session, message.targetUserId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
              type: 'webrtc-offer',
              streamId,
              userId,
              data: message.data,
            }));
            console.log(`[WebRTC] Offer sent from ${username} to viewer ${message.targetUserId}`);
          }
        }
        break;

      case 'webrtc-answer':
        // Viewer sending answer back to broadcaster
        if (session.broadcasterWs && session.broadcasterWs.readyState === WebSocket.OPEN) {
          session.broadcasterWs.send(JSON.stringify({
            type: 'webrtc-answer',
            streamId,
            userId,
            data: message.data,
          }));
          console.log(`[WebRTC] Answer sent from viewer ${username} to broadcaster`);
        }
        break;

      case 'webrtc-ice-candidate':
        // ICE candidate exchange (can be from broadcaster or viewer)
        if (message.targetUserId) {
          // Specific target
          const targetWs = this.getViewerWs(session, message.targetUserId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
              type: 'webrtc-ice-candidate',
              streamId,
              userId,
              data: message.data,
            }));
          }
        } else if (userId === session.broadcasterUserId) {
          // From broadcaster to viewer specified in data
          const viewerId = message.data?.viewerId;
          if (viewerId) {
            const viewerWs = this.getViewerWs(session, viewerId);
            if (viewerWs && viewerWs.readyState === WebSocket.OPEN) {
              viewerWs.send(JSON.stringify({
                type: 'webrtc-ice-candidate',
                streamId,
                userId,
                data: message.data,
              }));
            }
          }
        } else {
          // From viewer to broadcaster
          if (session.broadcasterWs && session.broadcasterWs.readyState === WebSocket.OPEN) {
            session.broadcasterWs.send(JSON.stringify({
              type: 'webrtc-ice-candidate',
              streamId,
              userId,
              data: message.data,
            }));
          }
        }
        break;
    }
  }

  private getViewerWs(session: StreamSession, userId: string): WebSocket | null {
    const viewersArray = Array.from(session.viewers.values());
    for (const viewer of viewersArray) {
      if (viewer.userId === userId && viewer.ws.readyState === WebSocket.OPEN) {
        return viewer.ws;
      }
    }
    return null;
  }

  private async handleDisconnection(
    streamId: string, 
    viewerKey: string,
    userId: string, 
    username: string,
    isAiAgent: boolean
  ) {
    const session = this.sessions.get(streamId);
    if (!session) return;

    session.viewers.delete(viewerKey);
    this.viewerStreams.get(userId)?.delete(streamId);

    // Update database viewer count
    await this.updateViewerCount(streamId);

    // Broadcast viewer count update
    this.broadcastToStream(streamId, {
      type: 'viewer-count',
      streamId,
      userId: '',
      data: { count: session.viewers.size },
    });

    // Notify others about leave
    this.broadcastToStream(streamId, {
      type: 'leave',
      streamId,
      userId,
      username,
      isAiAgent,
      timestamp: Date.now(),
    });

    // Clean up empty sessions after 5 minutes
    if (session.viewers.size === 0) {
      setTimeout(() => {
        const currentSession = this.sessions.get(streamId);
        if (currentSession && currentSession.viewers.size === 0) {
          this.sessions.delete(streamId);
          console.log(`[Streaming] Cleaned up empty stream session: ${streamId}`);
        }
      }, 5 * 60 * 1000);
    }

    console.log(`[Streaming] ${isAiAgent ? 'AI Agent' : 'User'} ${username} left stream ${streamId}. Viewers: ${session.viewers.size}`);
  }

  private broadcastToStream(streamId: string, message: StreamMessage, excludeUserId?: string) {
    const session = this.sessions.get(streamId);
    if (!session) return;

    const messageStr = JSON.stringify(message);
    
    session.viewers.forEach((viewer) => {
      if (excludeUserId && viewer.userId === excludeUserId) return;
      
      try {
        if (viewer.ws.readyState === WebSocket.OPEN) {
          viewer.ws.send(messageStr);
        }
      } catch (error) {
        console.error('Error broadcasting to viewer:', error);
      }
    });
  }

  private async updateViewerCount(streamId: string) {
    const session = this.sessions.get(streamId);
    if (!session) return;

    try {
      await db.update(liveStreams)
        .set({ currentViewers: session.viewers.size })
        .where(eq(liveStreams.id, streamId));
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  }

  // AI Agent can send messages to a stream
  async sendAiMessage(streamId: string, agentId: string, agentUsername: string, content: string) {
    const chatMessage = {
      id: `ai-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: agentId,
      username: agentUsername,
      content,
      isAiAgent: true,
      timestamp: Date.now(),
    };

    // Always save to database (even if no active WebSocket session)
    try {
      await db.insert(streamMessages).values({
        streamId,
        userId: agentId,
        content,
        messageType: 'ai_comment',
      });
      console.log(`[Streaming] AI message saved: ${agentUsername} -> ${streamId.slice(0, 8)}...`);
    } catch (error) {
      console.error('Error saving AI stream message:', error);
      return false;
    }

    // If there's an active session, add to memory and broadcast
    const session = this.sessions.get(streamId);
    if (session) {
      session.messages.push(chatMessage);

      // Broadcast to all viewers
      this.broadcastToStream(streamId, {
        type: 'ai-message',
        streamId,
        userId: agentId,
        username: agentUsername,
        isAiAgent: true,
        data: chatMessage,
      });
    }

    return true;
  }

  // End a stream
  async endStream(streamId: string, hostId: string) {
    const session = this.sessions.get(streamId);
    if (!session) return false;

    if (session.hostId !== hostId) {
      return false;
    }

    session.isLive = false;

    // Update database
    await db.update(liveStreams)
      .set({ 
        status: 'ended',
        actualEnd: new Date(),
      })
      .where(eq(liveStreams.id, streamId));

    // Notify all viewers
    this.broadcastToStream(streamId, {
      type: 'stream-end',
      streamId,
      userId: hostId,
      data: {
        duration: Date.now() - session.startedAt,
        peakViewers: session.peakViewers,
        totalMessages: session.messages.length,
        totalTips: session.tips.reduce((sum, t) => sum + t.amount, 0),
      },
    });

    // Close all viewer connections
    session.viewers.forEach((viewer) => {
      try {
        viewer.ws.close();
      } catch (error) {
        // Ignore close errors
      }
    });

    this.sessions.delete(streamId);
    return true;
  }

  // Get active streams count
  getActiveStreamsCount(): number {
    return this.sessions.size;
  }

  // Get viewer count for a stream
  getViewerCount(streamId: string): number {
    const session = this.sessions.get(streamId);
    return session ? session.viewers.size : 0;
  }
}

// Singleton instance
let streamingServiceInstance: StreamingService | null = null;

export function initStreamingService(): StreamingService {
  if (!streamingServiceInstance) {
    streamingServiceInstance = new StreamingService();
  }
  return streamingServiceInstance;
}

export function getStreamingService(): StreamingService | null {
  return streamingServiceInstance;
}
