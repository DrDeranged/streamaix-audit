import { WebSocket } from 'ws';

const adminClients: Set<WebSocket> = new Set();

export const adminWebSocketService = {
  registerConnection(ws: WebSocket) {
    adminClients.add(ws);
    console.log(`🔐 [Admin WS] Admin client connected. Total: ${adminClients.size}`);

    ws.on('close', () => {
      adminClients.delete(ws);
      console.log(`🔐 [Admin WS] Admin client disconnected. Total: ${adminClients.size}`);
    });

    ws.on('error', (error) => {
      console.error(`🔐 [Admin WS] Connection error:`, error);
      adminClients.delete(ws);
    });
  },

  broadcastNewUser(user: {
    id: number;
    username: string;
    email?: string | null;
    createdAt: Date | string;
    streamBalance?: string;
  }) {
    const message = JSON.stringify({
      type: 'new_user',
      user: {
        id: user.id,
        username: user.username,
        email: user.email || 'N/A',
        createdAt: user.createdAt,
        streamBalance: user.streamBalance || '0'
      },
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    adminClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          sentCount++;
        } catch (error) {
          console.error('🔐 [Admin WS] Failed to send to client:', error);
          adminClients.delete(client);
        }
      }
    });

    if (sentCount > 0) {
      console.log(`🔐 [Admin WS] Broadcasted new user ${user.username} to ${sentCount} admin(s)`);
    }
  },

  broadcastStatsUpdate(stats: {
    totalUsers: number;
    activeUsers24h: number;
    newUsers7d: number;
    newsletterSubs: number;
  }) {
    const message = JSON.stringify({
      type: 'stats_update',
      stats,
      timestamp: new Date().toISOString()
    });

    adminClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          adminClients.delete(client);
        }
      }
    });
  },

  getConnectedCount() {
    return adminClients.size;
  }
};
