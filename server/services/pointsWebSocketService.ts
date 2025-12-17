import { WebSocket } from 'ws';

interface PointsUpdate {
  type: 'points_update';
  data: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    transaction?: {
      id: string;
      amount: number;
      type: string;
      source: string;
      description?: string;
      balanceAfter: number;
      createdAt: string;
    };
  };
  timestamp: string;
}

class PointsWebSocketService {
  private userConnections: Map<string, Set<WebSocket>> = new Map();
  
  registerConnection(userId: string, ws: WebSocket) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(ws);
    console.log(`💰 [PointsWS] User ${userId} connected (${this.userConnections.get(userId)!.size} connections)`);
    
    ws.on('close', () => {
      this.unregisterConnection(userId, ws);
    });
    
    ws.on('error', () => {
      this.unregisterConnection(userId, ws);
    });
  }
  
  unregisterConnection(userId: string, ws: WebSocket) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
      console.log(`💰 [PointsWS] User ${userId} disconnected (${connections.size} remaining)`);
    }
  }
  
  broadcastToUser(userId: string, update: PointsUpdate) {
    const connections = this.userConnections.get(userId);
    if (!connections || connections.size === 0) {
      return;
    }
    
    const message = JSON.stringify(update);
    let sent = 0;
    
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sent++;
      }
    });
    
    if (sent > 0) {
      console.log(`💰 [PointsWS] Sent points update to user ${userId} (${sent} connections)`);
    }
  }
  
  notifyPointsChange(
    userId: string, 
    balance: number, 
    totalEarned: number, 
    totalSpent: number,
    transaction?: {
      id: string;
      amount: number;
      type: string;
      source: string;
      description?: string;
      balanceAfter: number;
      createdAt: Date;
    }
  ) {
    const update: PointsUpdate = {
      type: 'points_update',
      data: {
        balance,
        totalEarned,
        totalSpent,
        transaction: transaction ? {
          ...transaction,
          createdAt: transaction.createdAt.toISOString()
        } : undefined
      },
      timestamp: new Date().toISOString()
    };
    
    this.broadcastToUser(userId, update);
  }
  
  getConnectionCount(userId?: string): number {
    if (userId) {
      return this.userConnections.get(userId)?.size || 0;
    }
    let total = 0;
    this.userConnections.forEach(connections => {
      total += connections.size;
    });
    return total;
  }
}

export const pointsWebSocketService = new PointsWebSocketService();
