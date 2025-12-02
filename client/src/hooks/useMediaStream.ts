import { useState, useEffect, useCallback, useRef } from 'react';

export interface MediaStreamState {
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isScreenSharing: boolean;
  error: string | null;
  devices: {
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
  };
}

export interface UseMediaStreamReturn extends MediaStreamState {
  startStream: (options?: MediaStreamConstraints) => Promise<boolean>;
  stopStream: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => void;
  switchCamera: () => Promise<void>;
  switchMicrophone: (deviceId: string) => Promise<void>;
}

const defaultConstraints: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export function useMediaStream(): UseMediaStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<{
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
  }>({ videoDevices: [], audioDevices: [] });
  
  const facingModeRef = useRef<'user' | 'environment'>('user');

  const enumerateDevices = useCallback(async () => {
    try {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter(d => d.kind === 'videoinput');
      const audioDevices = deviceInfos.filter(d => d.kind === 'audioinput');
      setDevices({ videoDevices, audioDevices });
    } catch (err) {
      console.error('[MediaStream] Error enumerating devices:', err);
    }
  }, []);

  const startStream = useCallback(async (options?: MediaStreamConstraints): Promise<boolean> => {
    try {
      setError(null);
      
      const constraints = options || defaultConstraints;
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      setVideoEnabled(true);
      setAudioEnabled(true);
      
      await enumerateDevices();
      
      console.log('[MediaStream] Stream started successfully');
      return true;
    } catch (err: any) {
      console.error('[MediaStream] Error starting stream:', err);
      
      let errorMessage = 'Could not access camera/microphone';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      }
      
      setError(errorMessage);
      return false;
    }
  }, [enumerateDevices]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    }
    setVideoEnabled(false);
    setAudioEnabled(false);
    console.log('[MediaStream] Stream stopped');
  }, [stream, screenStream]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(prev => !prev);
    }
  }, [stream]);

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(prev => !prev);
    }
  }, [stream]);

  const startScreenShare = useCallback(async (): Promise<boolean> => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      } as DisplayMediaStreamOptions);
      
      setScreenStream(displayStream);
      setIsScreenSharing(true);
      
      displayStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
      };
      
      console.log('[MediaStream] Screen share started');
      return true;
    } catch (err: any) {
      console.error('[MediaStream] Error starting screen share:', err);
      if (err.name !== 'AbortError') {
        setError('Could not start screen sharing');
      }
      return false;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      console.log('[MediaStream] Screen share stopped');
    }
  }, [screenStream]);

  const switchCamera = useCallback(async () => {
    if (!stream) return;
    
    facingModeRef.current = facingModeRef.current === 'user' ? 'environment' : 'user';
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingModeRef.current,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: stream.getAudioTracks().length > 0,
      });
      
      stream.getVideoTracks().forEach(track => track.stop());
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = stream.getVideoTracks()[0];
      
      if (oldVideoTrack && newVideoTrack) {
        stream.removeTrack(oldVideoTrack);
        stream.addTrack(newVideoTrack);
      }
      
      setStream(newStream);
      console.log('[MediaStream] Camera switched to:', facingModeRef.current);
    } catch (err) {
      console.error('[MediaStream] Error switching camera:', err);
      setError('Could not switch camera');
    }
  }, [stream]);

  const switchMicrophone = useCallback(async (deviceId: string) => {
    if (!stream) return;
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: stream.getVideoTracks().length > 0 ? {
          facingMode: facingModeRef.current,
        } : false,
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      
      stream.getAudioTracks().forEach(track => track.stop());
      
      const newAudioTrack = newStream.getAudioTracks()[0];
      const oldAudioTrack = stream.getAudioTracks()[0];
      
      if (oldAudioTrack && newAudioTrack) {
        stream.removeTrack(oldAudioTrack);
        stream.addTrack(newAudioTrack);
      }
      
      console.log('[MediaStream] Microphone switched');
    } catch (err) {
      console.error('[MediaStream] Error switching microphone:', err);
      setError('Could not switch microphone');
    }
  }, [stream]);

  useEffect(() => {
    enumerateDevices();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    stream: isScreenSharing ? screenStream : stream,
    videoEnabled,
    audioEnabled,
    isScreenSharing,
    error,
    devices,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    switchCamera,
    switchMicrophone,
  };
}
