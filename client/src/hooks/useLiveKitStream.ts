import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Room, 
  RoomEvent, 
  ConnectionState,
  LocalParticipant,
  RemoteParticipant,
  Track,
  LocalTrack,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
  createLocalTracks,
  VideoPresets
} from 'livekit-client';
import { useAuth } from './useAuth';
import { apiRequest } from '@/lib/queryClient';

interface LiveKitTokenResponse {
  success: boolean;
  token: string;
  wsUrl: string;
  roomName: string;
  isHost: boolean;
  error?: string;
}

export interface LiveKitStreamState {
  isConnected: boolean;
  connectionState: ConnectionState;
  isPublishing: boolean;
  localVideoTrack: LocalVideoTrack | null;
  localAudioTrack: LocalAudioTrack | null;
  remoteVideoTrack: RemoteVideoTrack | null;
  remoteAudioTrack: RemoteAudioTrack | null;
  participantCount: number;
  isHost: boolean;
  error: string | null;
}

export interface UseLiveKitStreamReturn extends LiveKitStreamState {
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

export function useLiveKitStream(streamId: string | null): UseLiveKitStreamReturn {
  const { isAuthenticated } = useAuth();
  const roomRef = useRef<Room | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isPublishing, setIsPublishing] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteVideoTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<RemoteAudioTrack | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const updateParticipantCount = useCallback(() => {
    if (roomRef.current) {
      const count = roomRef.current.remoteParticipants.size + 1;
      setParticipantCount(count);
    }
  }, []);

  const handleTrackSubscribed = useCallback((
    track: RemoteTrack,
    _publication: any,
    _participant: RemoteParticipant
  ) => {
    if (track.kind === Track.Kind.Video) {
      setRemoteVideoTrack(track as RemoteVideoTrack);
    } else if (track.kind === Track.Kind.Audio) {
      setRemoteAudioTrack(track as RemoteAudioTrack);
      track.attach();
    }
  }, []);

  const handleTrackUnsubscribed = useCallback((
    track: RemoteTrack,
    _publication: any,
    _participant: RemoteParticipant
  ) => {
    if (track.kind === Track.Kind.Video) {
      setRemoteVideoTrack(null);
    } else if (track.kind === Track.Kind.Audio) {
      setRemoteAudioTrack(null);
      track.detach();
    }
  }, []);

  const connect = useCallback(async () => {
    if (!streamId || !isAuthenticated) {
      setError('Authentication required');
      return;
    }

    try {
      setError(null);
      
      const tokenData: LiveKitTokenResponse = await apiRequest(`/api/streams/${streamId}/token`, {
        method: 'POST',
      });

      if (!tokenData.success || !tokenData.token) {
        throw new Error(tokenData.error || 'Failed to get stream token');
      }

      setIsHost(tokenData.isHost);

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });
      
      roomRef.current = room;

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
        setIsConnected(state === ConnectionState.Connected);
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        updateParticipantCount();
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        updateParticipantCount();
      });

      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setIsPublishing(false);
        setLocalVideoTrack(null);
        setLocalAudioTrack(null);
        setRemoteVideoTrack(null);
        setRemoteAudioTrack(null);
      });

      await room.connect(tokenData.wsUrl, tokenData.token);
      updateParticipantCount();

      if (tokenData.isHost) {
        const tracks = await createLocalTracks({
          audio: true,
          video: {
            resolution: VideoPresets.h720.resolution,
          },
        });

        for (const track of tracks) {
          await room.localParticipant.publishTrack(track);
          if (track.kind === Track.Kind.Video) {
            setLocalVideoTrack(track as LocalVideoTrack);
          } else if (track.kind === Track.Kind.Audio) {
            setLocalAudioTrack(track as LocalAudioTrack);
          }
        }
        setIsPublishing(true);
      }

    } catch (err: any) {
      console.error('[LiveKit] Connection error:', err);
      setError(err.message || 'Failed to connect to stream');
    }
  }, [streamId, isAuthenticated, updateParticipantCount, handleTrackSubscribed, handleTrackUnsubscribed]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    setIsPublishing(false);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setRemoteVideoTrack(null);
    setRemoteAudioTrack(null);
    setConnectionState(ConnectionState.Disconnected);
  }, []);

  const toggleVideo = useCallback(async () => {
    if (localVideoTrack) {
      if (videoEnabled) {
        await localVideoTrack.mute();
      } else {
        await localVideoTrack.unmute();
      }
      setVideoEnabled(!videoEnabled);
    }
  }, [localVideoTrack, videoEnabled]);

  const toggleAudio = useCallback(async () => {
    if (localAudioTrack) {
      if (audioEnabled) {
        await localAudioTrack.mute();
      } else {
        await localAudioTrack.unmute();
      }
      setAudioEnabled(!audioEnabled);
    }
  }, [localAudioTrack, audioEnabled]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionState,
    isPublishing,
    localVideoTrack,
    localAudioTrack,
    remoteVideoTrack,
    remoteAudioTrack,
    participantCount,
    isHost,
    error,
    connect,
    disconnect,
    toggleVideo,
    toggleAudio,
    videoEnabled,
    audioEnabled,
  };
}
