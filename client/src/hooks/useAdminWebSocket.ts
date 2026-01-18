import { useEffect, useRef, useState, useCallback } from 'react';

interface NewUserEvent {
  type: 'new_user';
  user: {
    id: number;
    username: string;
    email: string;
    createdAt: string;
    streamBalance: string;
  };
  timestamp: string;
}

interface StatsUpdateEvent {
  type: 'stats_update';
  stats: {
    totalUsers: number;
    activeUsers24h: number;
    newUsers7d: number;
    newsletterSubs: number;
  };
  timestamp: string;
}

type AdminEvent = NewUserEvent | StatsUpdateEvent | { type: 'connected'; message: string };

interface UseAdminWebSocketOptions {
  onNewUser?: (user: NewUserEvent['user']) => void;
  onStatsUpdate?: (stats: StatsUpdateEvent['stats']) => void;
}

export function useAdminWebSocket(options: UseAdminWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AdminEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/admin`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AdminEvent;
          setLastEvent(data);

          if (data.type === 'new_user' && options.onNewUser) {
            options.onNewUser(data.user);
          } else if (data.type === 'stats_update' && options.onStatsUpdate) {
            options.onStatsUpdate(data.stats);
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      wsRef.current.onerror = () => {
        wsRef.current?.close();
      };
    } catch (err) {
      // Connection failed, will retry
    }
  }, [options.onNewUser, options.onStatsUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, lastEvent };
}
