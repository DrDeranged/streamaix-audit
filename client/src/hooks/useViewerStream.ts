import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

interface StreamEvent {
  type: string;
  streamId?: string;
  userId?: string;
  username?: string;
  data?: any;
  timestamp?: number;
  message?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  isAiAgent: boolean;
  timestamp: number;
}

export interface ViewerStreamState {
  isConnected: boolean;
  isReceivingVideo: boolean;
  remoteStream: MediaStream | null;
  viewerCount: number;
  messages: ChatMessage[];
  connectionState: 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected';
  error: string | null;
}

export interface UseViewerStreamReturn extends ViewerStreamState {
  sendMessage: (content: string) => void;
  sendReaction: (reaction: string) => void;
  disconnect: () => void;
  retryConnection: () => void;
}

export function useViewerStream(streamId: string | null, enabled: boolean = true): UseViewerStreamReturn {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isReceivingVideo, setIsReceivingVideo] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const offerRequestTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setIsReceivingVideo(true);
        setConnectionState('connected');
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc-ice-candidate',
          streamId,
          userId: user?.id,
          data: { candidate: event.candidate },
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setConnectionState('connected');
          setError(null);
          break;
        case 'connecting':
          setConnectionState('connecting');
          break;
        case 'disconnected':
          setConnectionState('reconnecting');
          break;
        case 'failed':
          setConnectionState('failed');
          setError('Video connection failed');
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    return pc;
  }, [streamId, user?.id]);

  const requestOffer = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[Viewer] Sending request-offer to broadcaster');
      wsRef.current.send(JSON.stringify({
        type: 'request-offer',
        streamId,
        userId: user?.id,
        username: user?.username,
        data: { viewerId: user?.id, viewerKey: `${user?.id}-${Date.now()}` },
      }));
    }
  }, [streamId, user?.id, user?.username]);

  const handleSignalingMessage = useCallback(async (event: StreamEvent) => {
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

      case 'tip':
        if (event.data) {
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

      case 'broadcaster-ready':
        if (offerRequestTimeoutRef.current) {
          clearTimeout(offerRequestTimeoutRef.current);
        }
        // Request offer immediately when broadcaster is ready (reduced from 500ms)
        offerRequestTimeoutRef.current = setTimeout(requestOffer, 50);
        break;

      case 'broadcaster-not-ready':
        if (offerRequestTimeoutRef.current) {
          clearTimeout(offerRequestTimeoutRef.current);
        }
        // Retry faster when broadcaster not ready (reduced from 2000ms)
        offerRequestTimeoutRef.current = setTimeout(requestOffer, 500);
        break;

      case 'webrtc-offer':
        if (event.data?.sdp) {
          setConnectionState('connecting');
          
          const pc = createPeerConnection();
          
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(event.data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'webrtc-answer',
                streamId,
                userId: user?.id,
                data: { sdp: answer },
              }));
            }
          } catch (err) {
            console.error('[Viewer] Error handling offer:', err);
            setError('Failed to connect to stream');
            setConnectionState('failed');
          }
        }
        break;

      case 'webrtc-ice-candidate':
        if (event.data?.candidate && pcRef.current) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(event.data.candidate));
          } catch (err) {
            console.error('[Viewer] Error adding ICE candidate:', err);
          }
        }
        break;

      case 'stream-end':
        setIsReceivingVideo(false);
        setRemoteStream(null);
        setConnectionState('disconnected');
        break;

      case 'error':
        console.error('[Viewer] Error:', event.message);
        setError(event.message || 'Unknown error');
        break;

      case 'join':
        break;

      case 'leave':
        break;
    }
  }, [createPeerConnection, requestOffer, streamId, user?.id]);

  const connect = useCallback(() => {
    if (!streamId || !isAuthenticated || !user) return;

    setConnectionState('connecting');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const params = new URLSearchParams({
      streamId,
      userId: user.id || 'guest',
      username: user.username || 'Anonymous',
      avatar: user.avatar || '',
      isAiAgent: 'false',
    });
    
    const wsUrl = `${protocol}//${host}/ws/stream?${params.toString()}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        
        // Request offer faster on connect (reduced from 1000ms to 100ms)
        offerRequestTimeoutRef.current = setTimeout(requestOffer, 100);
      };

      ws.onmessage = (messageEvent) => {
        try {
          const data: StreamEvent = JSON.parse(messageEvent.data);
          handleSignalingMessage(data);
        } catch (err) {
          console.error('[Viewer] Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        
        if (streamId && isAuthenticated) {
          setConnectionState('reconnecting');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('[Viewer] WebSocket error:', err);
        setError('Connection error');
      };
    } catch (err) {
      console.error('[Viewer] Error connecting:', err);
      setError('Failed to connect');
      setConnectionState('failed');
    }
  }, [streamId, isAuthenticated, user, handleSignalingMessage, requestOffer]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        streamId,
        userId: user?.id,
        username: user?.username,
        data: { content },
      }));
    }
  }, [streamId, user?.id, user?.username]);

  const sendReaction = useCallback((reaction: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reaction',
        streamId,
        userId: user?.id,
        username: user?.username,
        data: { reaction },
      }));
    }
  }, [streamId, user?.id, user?.username]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (offerRequestTimeoutRef.current) {
      clearTimeout(offerRequestTimeoutRef.current);
      offerRequestTimeoutRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsReceivingVideo(false);
    setRemoteStream(null);
    setConnectionState('disconnected');
  }, []);

  const retryConnection = useCallback(() => {
    console.log('[Viewer] Manually retrying connection...');
    disconnect();
    setError(null);
    setTimeout(() => {
      connect();
    }, 500);
  }, [disconnect, connect]);

  useEffect(() => {
    if (streamId && isAuthenticated && enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [streamId, isAuthenticated, enabled]);

  return {
    isConnected,
    isReceivingVideo,
    remoteStream,
    viewerCount,
    messages,
    connectionState,
    error,
    sendMessage,
    sendReaction,
    disconnect,
    retryConnection,
  };
}
