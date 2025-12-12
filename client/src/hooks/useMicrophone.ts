import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMicrophoneOptions {
  onTranscription?: (text: string, isFinal: boolean) => void;
  onAudioChunk?: (audioBase64: string, sequence: number) => void;
  streamId?: string;
}

export function useMicrophone({
  onTranscription,
  onAudioChunk,
  streamId,
}: UseMicrophoneOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sequenceRef = useRef(0);
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('[Microphone] Permission denied:', err);
      setHasPermission(false);
      setError(err.message || 'Microphone permission denied');
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      audioChunksRef.current = [];
      sequenceRef.current = 0;
      
      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Send audio chunk for real-time streaming
          if (onAudioChunk) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              onAudioChunk(base64, sequenceRef.current++);
            };
            reader.readAsDataURL(event.data);
          }
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Combine all chunks and transcribe
        if (audioChunksRef.current.length > 0 && streamId) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await transcribeAudio(audioBlob);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect chunks every 1 second
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      console.error('[Microphone] Recording error:', err);
      setError(err.message || 'Failed to start recording');
    }
  }, [onAudioChunk, streamId, requestPermission]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (!streamId) return;
    
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;
      
      // Send to transcription API
      const response = await fetch(`/api/streams/${streamId}/conversation/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ audioBase64 }),
      });
      
      const data = await response.json();
      
      if (data.success && data.text) {
        onTranscription?.(data.text, true);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('[Microphone] Transcription error:', err);
      setError(err.message || 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  }, [streamId, onTranscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    isTranscribing,
    hasPermission,
    error,
    requestPermission,
    startRecording,
    stopRecording,
  };
}
