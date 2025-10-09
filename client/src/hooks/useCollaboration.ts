import { useState, useEffect, useRef, useCallback } from 'react';

export interface CollaboratorCursor {
  userId: string;
  username: string;
  avatar?: string;
  cursor?: {
    x: number;
    y: number;
    selection?: string;
  };
}

export interface CollaborationMessage {
  type: 'join' | 'leave' | 'cursor' | 'content' | 'user-list' | 'invite' | 'share-update';
  userId?: string;
  username?: string;
  data?: any;
  timestamp?: number;
}

export function useCollaboration(bountyId: string, userId: string, username: string, avatar?: string) {
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorCursor[]>([]);
  const [content, setContent] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!bountyId || !userId || !username) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/collaborate?bountyId=${bountyId}&userId=${userId}&username=${encodeURIComponent(username)}${avatar ? `&avatar=${encodeURIComponent(avatar)}` : ''}`;

    console.log('🤝 Connecting to collaboration:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🤝 Collaboration connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: CollaborationMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'user-list':
            setCollaborators(message.data || []);
            break;

          case 'cursor':
            setCollaborators(prev => 
              prev.map(c => 
                c.userId === message.userId 
                  ? { ...c, cursor: message.data }
                  : c
              )
            );
            break;

          case 'content':
            if (message.data?.content) {
              setContent(message.data.content);
            }
            break;

          case 'invite':
            // Handle invite notification
            console.log('🎯 Received collaboration invite:', message.data);
            break;

          case 'share-update':
            // Handle reward share update
            console.log('💰 Reward shares updated:', message.data);
            break;
        }
      } catch (error) {
        console.error('Failed to parse collaboration message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('🤝 Collaboration error:', error);
    };

    ws.onclose = () => {
      console.log('🤝 Collaboration disconnected');
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [bountyId, userId, username, avatar]);

  const sendCursor = useCallback((x: number, y: number, selection?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor',
        data: { x, y, selection }
      }));
    }
  }, []);

  const sendContent = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'content',
        data: { content }
      }));
    }
  }, []);

  const inviteCollaborator = useCallback((invitedUserId: string, rewardShare: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'invite',
        data: { invitedUserId, rewardShare }
      }));
    }
  }, []);

  const updateShares = useCallback((shares: Record<string, number>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'share-update',
        data: { shares }
      }));
    }
  }, []);

  return {
    connected,
    collaborators,
    content,
    sendCursor,
    sendContent,
    inviteCollaborator,
    updateShares
  };
}
