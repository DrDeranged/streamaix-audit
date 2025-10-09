import { WebSocket } from 'ws';
import type { DatabaseStorage } from '../storage';

interface CollaborationMessage {
  type: 'join' | 'leave' | 'cursor' | 'content' | 'user-list' | 'invite' | 'share-update';
  bountyId: string;
  userId: string;
  username?: string;
  avatar?: string;
  data?: any;
  timestamp?: number;
}

interface ActiveUser {
  userId: string;
  username: string;
  avatar?: string;
  cursor?: { x: number; y: number; selection?: string };
  lastSeen: number;
  ws: WebSocket;
}

interface BountySession {
  bountyId: string;
  users: Map<string, ActiveUser>;
  contentSnapshot: string;
  lastActivity: number;
}

export class CollaborationService {
  private sessions = new Map<string, BountySession>();
  private userSessions = new Map<string, Set<string>>(); // userId -> Set of bountyIds

  constructor(private storage: DatabaseStorage) {}

  async handleConnection(ws: WebSocket, userId: string, bountyId: string, username: string, avatar?: string) {
    // Create or get session
    if (!this.sessions.has(bountyId)) {
      this.sessions.set(bountyId, {
        bountyId,
        users: new Map(),
        contentSnapshot: '',
        lastActivity: Date.now(),
      });
    }

    const session = this.sessions.get(bountyId)!;

    // Add user to session
    session.users.set(userId, {
      userId,
      username,
      avatar,
      lastSeen: Date.now(),
      ws,
    });

    // Track user's active sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(bountyId);

    // Update database session
    await this.updateDatabaseSession(bountyId);

    // Broadcast user list to all users in session
    this.broadcastUserList(bountyId);

    // Handle WebSocket messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message: CollaborationMessage = JSON.parse(data.toString());
        await this.handleMessage(bountyId, userId, message);
      } catch (error) {
        console.error('Error handling collaboration message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(userId, bountyId);
    });

    // Send current user list to new user
    const userList = Array.from(session.users.values()).map(u => ({
      userId: u.userId,
      username: u.username,
      avatar: u.avatar,
      cursor: u.cursor,
    }));

    ws.send(JSON.stringify({
      type: 'user-list',
      data: userList,
    }));
  }

  private async handleMessage(bountyId: string, userId: string, message: CollaborationMessage) {
    const session = this.sessions.get(bountyId);
    if (!session) return;

    session.lastActivity = Date.now();

    switch (message.type) {
      case 'cursor':
        // Update user's cursor position
        const user = session.users.get(userId);
        if (user) {
          user.cursor = message.data;
          user.lastSeen = Date.now();
          
          // Broadcast cursor update to others
          this.broadcast(bountyId, {
            type: 'cursor',
            userId,
            username: user.username,
            data: message.data,
          }, userId);
        }
        break;

      case 'content':
        // Update content snapshot
        session.contentSnapshot = message.data.content;
        
        // Save to database periodically
        await this.updateDatabaseSession(bountyId);
        
        // Broadcast content change to others
        this.broadcast(bountyId, {
          type: 'content',
          userId,
          data: message.data,
          timestamp: Date.now(),
        }, userId);
        break;

      case 'invite':
        // Handle collaboration invite
        const { invitedUserId, rewardShare } = message.data;
        
        // Create collaborator record
        await this.storage.addCollaborator({
          bountyId,
          userId: invitedUserId,
          role: 'collaborator',
          rewardShare,
          status: 'pending',
          invitedBy: userId,
        });
        
        // Notify the invited user if they're online
        this.notifyUser(invitedUserId, {
          type: 'invite',
          bountyId,
          data: {
            invitedBy: userId,
            rewardShare,
          },
        });
        break;

      case 'share-update':
        // Update reward share distribution
        const { shares } = message.data; // { userId: percentage }
        
        // Update all collaborators' shares
        for (const [collabUserId, share] of Object.entries(shares)) {
          await this.storage.updateCollaboratorShare(bountyId, collabUserId as string, share as number);
        }
        
        // Broadcast share update
        this.broadcast(bountyId, {
          type: 'share-update',
          data: shares,
        });
        break;
    }
  }

  private handleDisconnection(userId: string, bountyId: string) {
    const session = this.sessions.get(bountyId);
    if (!session) return;

    // Remove user from session
    session.users.delete(userId);

    // Remove bounty from user's sessions
    this.userSessions.get(userId)?.delete(bountyId);
    if (this.userSessions.get(userId)?.size === 0) {
      this.userSessions.delete(userId);
    }

    // If no users left, clean up session after timeout
    if (session.users.size === 0) {
      setTimeout(() => {
        if (this.sessions.get(bountyId)?.users.size === 0) {
          this.sessions.delete(bountyId);
        }
      }, 60000); // 1 minute timeout
    }

    // Broadcast updated user list
    this.broadcastUserList(bountyId);
  }

  private broadcast(bountyId: string, message: any, excludeUserId?: string) {
    const session = this.sessions.get(bountyId);
    if (!session) return;

    const messageStr = JSON.stringify(message);

    session.users.forEach((user, uid) => {
      if (uid !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(messageStr);
      }
    });
  }

  private broadcastUserList(bountyId: string) {
    const session = this.sessions.get(bountyId);
    if (!session) return;

    const userList = Array.from(session.users.values()).map(u => ({
      userId: u.userId,
      username: u.username,
      avatar: u.avatar,
      cursor: u.cursor,
    }));

    this.broadcast(bountyId, {
      type: 'user-list',
      data: userList,
    });
  }

  private notifyUser(userId: string, message: any) {
    const userBounties = this.userSessions.get(userId);
    if (!userBounties) return;

    const messageStr = JSON.stringify(message);

    // Send to all user's active sessions
    userBounties.forEach(bountyId => {
      const session = this.sessions.get(bountyId);
      const user = session?.users.get(userId);
      if (user && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(messageStr);
      }
    });
  }

  private async updateDatabaseSession(bountyId: string) {
    const session = this.sessions.get(bountyId);
    if (!session) return;

    const activeUsers = Array.from(session.users.values()).map(u => ({
      userId: u.userId,
      username: u.username,
      cursor: u.cursor,
      lastSeen: u.lastSeen,
    }));

    await this.storage.updateCollaborationSession({
      bountyId,
      activeUsers,
      contentSnapshot: session.contentSnapshot,
      lastActivity: new Date(session.lastActivity),
    });
  }

  // Get active users for a bounty
  getActiveBountyUsers(bountyId: string) {
    const session = this.sessions.get(bountyId);
    if (!session) return [];

    return Array.from(session.users.values()).map(u => ({
      userId: u.userId,
      username: u.username,
      avatar: u.avatar,
      cursor: u.cursor,
    }));
  }

  // Check if user is in a session
  isUserActive(userId: string, bountyId: string): boolean {
    return this.sessions.get(bountyId)?.users.has(userId) ?? false;
  }

  // Get all active sessions for a user
  getUserSessions(userId: string): string[] {
    return Array.from(this.userSessions.get(userId) || []);
  }
}
