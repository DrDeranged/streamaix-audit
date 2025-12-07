import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

interface StreamMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  isAiAgent: boolean;
  timestamp: number;
}

interface StreamEvent {
  type: 'join' | 'leave' | 'chat' | 'tip' | 'reaction' | 'viewer-count' | 'stream-end' | 'ai-message' | 'chat-history' | 'error' | 'avatar-audio' | 'avatar-speaking';
  streamId?: string;
  userId?: string;
  username?: string;
  isAiAgent?: boolean;
  data?: any;
  timestamp?: number;
  message?: string;
}

export interface AvatarAudioData {
  type: 'avatar-audio';
  avatarName: string;
  text: string;
  audioBase64: string;
  segmentType: string;
  duration: number;
  timestamp: string;
}

type AvatarAudioCallback = (audio: AvatarAudioData) => void;

interface UseStreamSocketReturn {
  isConnected: boolean;
  viewerCount: number;
  messages: StreamMessage[];
  sendMessage: (content: string) => void;
  sendReaction: (reaction: string) => void;
  disconnect: () => void;
  onAvatarAudio: (callback: AvatarAudioCallback) => () => void;
  isSpeaking: boolean;
}

export function useStreamSocket(streamId: string | null): UseStreamSocketReturn {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioCallbacksRef = useRef<Set<AvatarAudioCallback>>(new Set());

  const connect = useCallback(() => {
    if (!streamId) return;

    // Build WebSocket URL - allow guest viewing even without authentication
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const params = new URLSearchParams({
      streamId,
      userId: user?.id || guestId,
      username: user?.username || 'Guest Viewer',
      avatar: user?.avatar || '',
      isAiAgent: 'false',
      isGuest: (!isAuthenticated).toString(),
    });
    
    const wsUrl = `${protocol}//${host}/ws/stream?${params.toString()}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (import.meta.env.DEV) console.log('[StreamSocket] Connected to stream:', streamId);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: StreamEvent = JSON.parse(event.data);
          handleStreamEvent(data);
        } catch (error) {
          console.error('[StreamSocket] Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        if (import.meta.env.DEV) console.log('[StreamSocket] Disconnected from stream');
        setIsConnected(false);
        
        // Attempt reconnection after 3 seconds
        if (streamId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('[StreamSocket] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[StreamSocket] Error connecting:', error);
    }
  }, [streamId, isAuthenticated, user]);

  const handleStreamEvent = (event: StreamEvent) => {
    switch (event.type) {
      case 'chat-history':
        if (Array.isArray(event.data)) {
          setMessages(event.data);
        }
        break;
        
      case 'chat':
      case 'ai-message':
        if (event.data) {
          setMessages(prev => [...prev, event.data]);
        }
        break;
        
      case 'viewer-count':
        if (event.data?.count !== undefined) {
          setViewerCount(event.data.count);
        }
        break;
        
      case 'join':
        break;
        
      case 'leave':
        break;
        
      case 'tip':
        if (event.data) {
          // Add tip notification as a special message
          setMessages(prev => [...prev, {
            id: event.data.id || `tip-${Date.now()}`,
            userId: event.data.fromUserId,
            username: event.data.fromUsername,
            content: `💎 Tipped ${event.data.amount} STREAM${event.data.message ? `: ${event.data.message}` : ''}`,
            isAiAgent: false,
            timestamp: event.data.timestamp || Date.now(),
          }]);
        }
        break;
        
      case 'reaction':
        break;
        
      case 'stream-end':
        setIsConnected(false);
        break;
        
      case 'error':
        console.error('[StreamSocket] Error:', event.message);
        break;
        
      case 'avatar-audio':
        if (event.data) {
          audioCallbacksRef.current.forEach(callback => {
            try {
              callback(event.data as AvatarAudioData);
            } catch (err) {
              console.error('[StreamSocket] Error in audio callback:', err);
            }
          });
        }
        break;
        
      case 'avatar-speaking':
        if (event.data) {
          setIsSpeaking(event.data.isSpeaking);
        }
        break;
    }
  };

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('[StreamSocket] Cannot send message - not connected');
      return;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      streamId,
      userId: user?.id,
      username: user?.username,
      data: { content },
    }));
  }, [streamId, user]);

  const sendReaction = useCallback((reaction: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'reaction',
      streamId,
      userId: user?.id,
      username: user?.username,
      data: { reaction },
    }));
  }, [streamId, user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const onAvatarAudio = useCallback((callback: AvatarAudioCallback) => {
    audioCallbacksRef.current.add(callback);
    return () => {
      audioCallbacksRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    // Connect for any viewer (guest or authenticated) when streamId is available
    if (streamId) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [streamId, connect, disconnect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && streamId) {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };

    const handleOnline = () => {
      if (streamId) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [streamId, connect]);

  return {
    isConnected,
    viewerCount,
    messages,
    sendMessage,
    sendReaction,
    disconnect,
    onAvatarAudio,
    isSpeaking,
  };
}
