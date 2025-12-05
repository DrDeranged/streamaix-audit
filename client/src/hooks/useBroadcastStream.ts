import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

interface PeerConnection {
  viewerId: string;
  pc: RTCPeerConnection;
  connectionState: string;
}

interface StreamEvent {
  type: string;
  streamId?: string;
  userId?: string;
  username?: string;
  data?: any;
  timestamp?: number;
}

export interface BroadcastStreamState {
  isConnected: boolean;
  isBroadcasting: boolean;
  viewerCount: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  error: string | null;
}

export interface UseBroadcastStreamReturn extends BroadcastStreamState {
  startBroadcast: (stream: MediaStream) => void;
  stopBroadcast: () => void;
  sendChatMessage: (content: string) => void;
}

export function useBroadcastStream(streamId: string | null): UseBroadcastStreamReturn {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const createPeerConnection = useCallback((viewerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc-ice-candidate',
          streamId,
          userId: user?.id,
          data: {
            candidate: event.candidate,
            viewerId,
          },
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[Broadcast] Connection state for viewer ${viewerId}:`, pc.connectionState);
      
      const peerConn = peerConnectionsRef.current.get(viewerId);
      if (peerConn) {
        peerConn.connectionState = pc.connectionState;
      }

      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        pc.close();
        peerConnectionsRef.current.delete(viewerId);
      }

      updateConnectionQuality();
    };

    peerConnectionsRef.current.set(viewerId, {
      viewerId,
      pc,
      connectionState: pc.connectionState,
    });

    return pc;
  }, [streamId, user?.id]);

  const updateConnectionQuality = useCallback(() => {
    const connections = Array.from(peerConnectionsRef.current.values());
    if (connections.length === 0) {
      setConnectionQuality(isBroadcasting ? 'excellent' : 'disconnected');
      return;
    }

    const connectedCount = connections.filter(c => c.connectionState === 'connected').length;
    const ratio = connectedCount / connections.length;

    if (ratio >= 0.9) setConnectionQuality('excellent');
    else if (ratio >= 0.7) setConnectionQuality('good');
    else if (ratio >= 0.3) setConnectionQuality('poor');
    else setConnectionQuality('disconnected');
  }, [isBroadcasting]);

  const handleSignalingMessage = useCallback(async (event: StreamEvent) => {
    switch (event.type) {
      case 'request-offer':
        const viewerId = event.data?.viewerId;
        if (viewerId && localStreamRef.current) {
          console.log(`[Broadcast] Creating offer for viewer ${viewerId}`);
          const pc = createPeerConnection(viewerId);
          
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'webrtc-offer',
                streamId,
                userId: user?.id,
                targetUserId: viewerId,
                data: { sdp: offer },
              }));
            }
          } catch (err) {
            console.error('[Broadcast] Error creating offer:', err);
          }
        }
        break;

      case 'webrtc-answer':
        const answerFromViewer = event.userId;
        if (answerFromViewer && event.data?.sdp) {
          const peerConn = peerConnectionsRef.current.get(answerFromViewer);
          if (peerConn) {
            console.log(`[Broadcast] Received answer from viewer ${answerFromViewer}`);
            try {
              await peerConn.pc.setRemoteDescription(new RTCSessionDescription(event.data.sdp));
            } catch (err) {
              console.error('[Broadcast] Error setting remote description:', err);
            }
          }
        }
        break;

      case 'webrtc-ice-candidate':
        const candidateFromViewer = event.userId;
        if (candidateFromViewer && event.data?.candidate) {
          const peerConn = peerConnectionsRef.current.get(candidateFromViewer);
          if (peerConn) {
            try {
              await peerConn.pc.addIceCandidate(new RTCIceCandidate(event.data.candidate));
            } catch (err) {
              console.error('[Broadcast] Error adding ICE candidate:', err);
            }
          }
        }
        break;

      case 'viewer-count':
        if (event.data?.count !== undefined) {
          setViewerCount(event.data.count);
        }
        break;

      case 'join':
        console.log(`[Broadcast] ${event.username} joined the stream`);
        break;

      case 'leave':
        console.log(`[Broadcast] ${event.username} left the stream`);
        if (event.userId) {
          const peerConn = peerConnectionsRef.current.get(event.userId);
          if (peerConn) {
            peerConn.pc.close();
            peerConnectionsRef.current.delete(event.userId);
          }
        }
        break;
    }
  }, [createPeerConnection, streamId, user?.id]);

  const connect = useCallback(() => {
    if (!streamId || !isAuthenticated || !user) return;

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
        console.log('[Broadcast] WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: StreamEvent = JSON.parse(event.data);
          handleSignalingMessage(data);
        } catch (err) {
          console.error('[Broadcast] Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[Broadcast] WebSocket disconnected');
        setIsConnected(false);
        
        if (isBroadcasting && streamId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('[Broadcast] WebSocket error:', err);
        setError('Connection error');
      };
    } catch (err) {
      console.error('[Broadcast] Error connecting:', err);
      setError('Failed to connect');
    }
  }, [streamId, isAuthenticated, user, handleSignalingMessage, isBroadcasting]);

  const startBroadcast = useCallback((stream: MediaStream) => {
    localStreamRef.current = stream;
    setIsBroadcasting(true);
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
    }

    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'broadcaster-ready',
          streamId,
          userId: user?.id,
          username: user?.username,
        }));
        console.log('[Broadcast] Sent broadcaster-ready signal');
        setConnectionQuality('excellent');
      }
    }, 500);
  }, [connect, streamId, user?.id, user?.username]);

  const stopBroadcast = useCallback(() => {
    peerConnectionsRef.current.forEach(({ pc }) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    localStreamRef.current = null;
    setIsBroadcasting(false);
    setIsConnected(false);
    setConnectionQuality('disconnected');
  }, []);

  const sendChatMessage = useCallback((content: string) => {
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

  useEffect(() => {
    if (streamId && isAuthenticated) {
      connect();
    }
    
    return () => {
      stopBroadcast();
    };
  }, [streamId, isAuthenticated]);

  return {
    isConnected,
    isBroadcasting,
    viewerCount,
    connectionQuality,
    error,
    startBroadcast,
    stopBroadcast,
    sendChatMessage,
  };
}
