import { useState, useEffect, useCallback, useRef } from 'react';

export interface ConversationParticipant {
  id: string;
  participantId: string;
  type: 'user' | 'avatar';
  name: string;
  imageUrl?: string;
  role: 'host' | 'co_host' | 'speaker' | 'viewer';
  audioPreference: 'microphone' | 'tts' | 'text_only';
  speakingStatus: 'idle' | 'speaking' | 'requested' | 'queued';
  queuePosition?: number;
  isMuted: boolean;
}

export interface ConversationMessage {
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

interface UseStreamConversationOptions {
  streamId: string;
  userId?: string;
  avatarId?: string;
  role?: 'host' | 'co_host' | 'speaker' | 'viewer';
  audioPreference?: 'microphone' | 'tts' | 'text_only';
  onAudioReceived?: (audioBase64: string, speakerName: string) => void;
}

export function useStreamConversation({
  streamId,
  userId,
  avatarId,
  role = 'viewer',
  audioPreference = 'text_only',
  onAudioReceived,
}: UseStreamConversationOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [speakerQueue, setSpeakerQueue] = useState<ConversationParticipant[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<ConversationParticipant | null>(null);
  const [myParticipant, setMyParticipant] = useState<ConversationParticipant | null>(null);
  const [liveTranscription, setLiveTranscription] = useState<{ participantId: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!streamId || (!userId && !avatarId)) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams({
      streamId,
      ...(userId && { userId }),
      ...(avatarId && { avatarId }),
      role,
      audioPreference,
    });
    
    const wsUrl = `${protocol}//${window.location.host}/ws/conversation?${params}`;
    console.log('[Conversation] Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Conversation] Connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      console.log('[Conversation] Disconnected');
      setIsConnected(false);
      
      // Attempt reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('[Conversation] WebSocket error:', err);
      setError('Connection error');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('[Conversation] Failed to parse message:', err);
      }
    };
  }, [streamId, userId, avatarId, role, audioPreference]);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'conversation-history':
        setMessages(message.data.history || []);
        setParticipants(message.data.participants || []);
        setSpeakerQueue(message.data.speakerQueue?.map((id: string) => 
          message.data.participants?.find((p: any) => p.id === id)
        ).filter(Boolean) || []);
        if (message.data.currentSpeaker) {
          setCurrentSpeaker(message.data.participants?.find(
            (p: any) => p.id === message.data.currentSpeaker
          ) || null);
        }
        // Set my participant
        const myId = userId ? `user-${userId}` : avatarId ? `avatar-${avatarId}` : null;
        if (myId) {
          setMyParticipant(message.data.participants?.find((p: any) => p.id === myId) || null);
        }
        break;

      case 'participant-update':
        if (message.data.action === 'joined' || message.data.action === 'updated') {
          setParticipants(prev => {
            const existing = prev.findIndex(p => p.id === message.data.participant.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = message.data.participant;
              return updated;
            }
            return [...prev, message.data.participant];
          });
        } else if (message.data.action === 'left') {
          setParticipants(message.data.participants || []);
        }
        break;

      case 'speaker-queue-update':
        setSpeakerQueue(message.data.queue || []);
        setCurrentSpeaker(message.data.currentSpeaker || null);
        break;

      case 'text-input':
      case 'avatar-response':
        const newMessage = message.data.message;
        if (newMessage) {
          setMessages(prev => [...prev, newMessage]);
        }
        // Handle audio for avatar response
        if (message.type === 'avatar-response' && message.data.audioBase64 && onAudioReceived) {
          onAudioReceived(message.data.audioBase64, newMessage?.speakerName || 'Avatar');
        }
        break;

      case 'transcription':
        if (message.data.isFinal) {
          setLiveTranscription(null);
          // Final transcription will come as a separate message
        } else {
          setLiveTranscription({
            participantId: message.data.participantId,
            text: message.data.text,
          });
        }
        break;

      case 'audio-chunk':
        if (onAudioReceived) {
          onAudioReceived(message.data.audioBase64, message.data.speakerName);
        }
        break;

      case 'grant-speaking':
        // Update my participant status
        setMyParticipant(prev => prev ? { ...prev, speakingStatus: 'speaking' } : null);
        break;

      case 'revoke-speaking':
        setMyParticipant(prev => prev ? { ...prev, speakingStatus: 'idle' } : null);
        break;

      case 'error':
        setError(message.data?.message || 'Unknown error');
        break;
    }
  }, [userId, avatarId, onAudioReceived]);

  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Send methods
  const sendMessage = useCallback((type: string, data?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        streamId,
        data,
        timestamp: Date.now(),
      }));
    }
  }, [streamId]);

  const requestSpeak = useCallback(() => {
    sendMessage('request-speak');
  }, [sendMessage]);

  const cancelSpeakRequest = useCallback(() => {
    sendMessage('cancel-speak-request');
  }, [sendMessage]);

  const sendTextInput = useCallback((text: string) => {
    sendMessage('text-input', { text });
  }, [sendMessage]);

  const mute = useCallback(() => {
    sendMessage('mute');
    setMyParticipant(prev => prev ? { ...prev, isMuted: true } : null);
  }, [sendMessage]);

  const unmute = useCallback(() => {
    sendMessage('unmute');
    setMyParticipant(prev => prev ? { ...prev, isMuted: false } : null);
  }, [sendMessage]);

  const setAudioPreference = useCallback((preference: 'microphone' | 'tts' | 'text_only') => {
    sendMessage('set-audio-preference', { preference });
  }, [sendMessage]);

  const sendTranscription = useCallback((text: string, isFinal: boolean) => {
    sendMessage('transcription', { text, isFinal });
  }, [sendMessage]);

  const grantSpeaking = useCallback((participantId: string) => {
    sendMessage('grant-speaking', { participantId });
  }, [sendMessage]);

  const revokeSpeaking = useCallback((participantId: string) => {
    sendMessage('revoke-speaking', { participantId });
  }, [sendMessage]);

  return {
    isConnected,
    participants,
    messages,
    speakerQueue,
    currentSpeaker,
    myParticipant,
    liveTranscription,
    error,
    requestSpeak,
    cancelSpeakRequest,
    sendTextInput,
    mute,
    unmute,
    setAudioPreference,
    sendTranscription,
    grantSpeaking,
    revokeSpeaking,
  };
}
