import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  SwitchCamera,
  StopCircle,
  Users,
  Clock,
  Sparkles,
  AlertTriangle,
  Loader2,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useBroadcastStream } from '@/hooks/useBroadcastStream';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BroadcasterViewProps {
  streamId: string;
  streamType: string;
  viewerCount: number;
  onEndStream: () => void;
  isEnding?: boolean;
}

export function BroadcasterView({
  streamId,
  streamType,
  viewerCount,
  onEndStream,
  isEnding = false,
}: BroadcasterViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);

  const {
    stream,
    videoEnabled,
    audioEnabled,
    isScreenSharing,
    error: mediaError,
    devices,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    switchCamera,
  } = useMediaStream();

  const {
    isConnected: isWebRTCConnected,
    isBroadcasting,
    viewerCount: webrtcViewerCount,
    connectionQuality,
    error: webrtcError,
    startBroadcast,
    stopBroadcast,
  } = useBroadcastStream(streamId);

  useEffect(() => {
    const isAudioOnly = streamType === 'audio_space';
    const initStream = async () => {
      const success = await startStream(isAudioOnly ? { video: false, audio: { echoCancellation: true, noiseSuppression: true } } : undefined);
      if (success) {
        console.log('[BroadcasterView] Media stream started, ready for WebRTC');
      }
    };
    initStream();
    
    return () => {
      stopStream();
      stopBroadcast();
    };
  }, []);

  useEffect(() => {
    if (stream && !isBroadcasting) {
      console.log('[BroadcasterView] Starting WebRTC broadcast with stream');
      startBroadcast(stream);
    }
  }, [stream, isBroadcasting, startBroadcast]);

  useEffect(() => {
    if (videoRef.current && stream && !isScreenSharing) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isScreenSharing]);

  useEffect(() => {
    if (screenRef.current && isScreenSharing && stream) {
      screenRef.current.srcObject = stream;
    }
  }, [stream, isScreenSharing]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStreamDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      const success = await startScreenShare();
      if (success) {
        toast({
          title: "Screen sharing started",
          description: "Viewers can now see your screen",
        });
      }
    }
  };

  const handleEndStream = () => {
    setShowEndConfirm(true);
  };

  const confirmEndStream = () => {
    stopStream();
    onEndStream();
  };

  const isAudioOnly = streamType === 'audio_space';

  return (
    <div className="relative w-full h-full bg-ink-page">
      {mediaError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-ink-page/95">
          <div className="text-center p-6 max-w-md">
            <AlertTriangle className="w-12 h-12 text-warn mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">Camera/Microphone Error</h3>
            <p className="text-sm text-secondary mb-4">{mediaError}</p>
            <Button
              onClick={() => startStream()}
              className="grad-accent glow-accent text-primary hover:bg-accent-deep"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {isAudioOnly ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={audioEnabled ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            className={cn(
               "p-8 rounded-xl mb-6",
               audioEnabled ? "bg-accent-core/20 ring-4 ring-accent-core/30" : "bg-ink-raised"
            )}
          >
            {audioEnabled ? (
               <Mic className="w-16 h-16 text-accent-bright" />
            ) : (
               <MicOff className="w-16 h-16 text-secondary" />
            )}
          </motion.div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={audioEnabled ? { 
                    height: [8, 20 + Math.random() * 12, 8],
                  } : { height: 8 }}
                  transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }}
                  className={cn(
                    "w-1 rounded-full",
                     audioEnabled ? "bg-accent-bright" : "bg-ink-edge"
                  )}
                  style={{ height: 8 }}
                />
              ))}
            </div>
          </div>
          
           <p className="text-sm text-secondary">
            {audioEnabled ? 'Audio is on - Your viewers can hear you' : 'Audio is muted'}
          </p>
        </div>
      ) : (
        <>
          {isScreenSharing ? (
            <video
              ref={screenRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          ) : stream && videoEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <div className="p-6 rounded-xl bg-ink-raised mb-4">
                 <VideoOff className="w-12 h-12 text-secondary" />
              </div>
               <p className="text-sm text-secondary">
                {stream ? 'Camera is off' : 'Connecting to camera...'}
              </p>
            </div>
          )}
        </>
      )}

      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <Badge className="bg-loss/90 text-primary text-xs px-2.5 py-1">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-white mr-1.5"
          />
          LIVE
        </Badge>
        
        <Badge className={cn(
          "backdrop-blur-sm text-xs px-2.5 py-1",
          connectionQuality === 'excellent' ? "bg-gain/20 text-gain" :
          connectionQuality === 'good' ? "bg-accent-core/20 text-accent-bright" :
          connectionQuality === 'poor' ? "bg-warn/20 text-warn" :
          "bg-ink-raised text-secondary"
        )}>
          {connectionQuality === 'excellent' ? <Wifi className="w-3 h-3 mr-1.5" /> :
           connectionQuality === 'good' ? <Wifi className="w-3 h-3 mr-1.5" /> :
           connectionQuality === 'poor' ? <WifiOff className="w-3 h-3 mr-1.5" /> :
           <WifiOff className="w-3 h-3 mr-1.5" />}
          {connectionQuality === 'disconnected' ? 'Connecting...' : connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
        </Badge>
        
        <Badge className="bg-ink-surface/90 backdrop-blur-sm text-primary text-xs px-2.5 py-1">
          <Clock className="w-3 h-3 mr-1.5" />
          {formatDuration(streamDuration)}
        </Badge>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-ink-surface/90 backdrop-blur-sm text-accent-bright text-xs px-2.5 py-1">
          <Users className="w-3 h-3 mr-1.5" />
          {viewerCount} watching
        </Badge>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2 bg-ink-surface/95 backdrop-blur-xl rounded-xl px-4 py-2 border border-ink-edge"
        >
          {!isAudioOnly && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleVideo}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                videoEnabled 
                  ? "bg-ink-raised text-primary hover:bg-ink-edge" 
                  : "bg-loss/20 text-loss hover:bg-loss/30"
              )}
              data-testid="button-toggle-video"
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              audioEnabled 
                ? "bg-ink-raised text-primary hover:bg-ink-edge" 
                : "bg-loss/20 text-loss hover:bg-loss/30"
            )}
            data-testid="button-toggle-audio"
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </motion.button>

          {!isAudioOnly && (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleScreenShare}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isScreenSharing 
                    ? "bg-gain/20 text-gain hover:bg-gain/30" 
                    : "bg-ink-raised text-primary hover:bg-ink-edge"
                )}
                data-testid="button-toggle-screen-share"
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </motion.button>

              {devices.videoDevices.length > 1 && !isScreenSharing && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={switchCamera}
                  className="p-2.5 rounded-full bg-ink-raised text-primary hover:bg-ink-edge transition-all"
                  data-testid="button-switch-camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </motion.button>
              )}
            </>
          )}

          <div className="w-px h-6 bg-ink-divider mx-1" />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleEndStream}
            disabled={isEnding}
            className="p-2.5 rounded-full bg-loss/20 text-loss hover:bg-loss/30 transition-all disabled:opacity-50"
            data-testid="button-end-stream"
          >
            {isEnding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <StopCircle className="w-5 h-5" />
            )}
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-page/90 backdrop-blur-sm flex items-center justify-center z-20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
               className="bg-ink-surface border border-loss/30 rounded-2xl p-6 max-w-sm mx-4 text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-loss/20 flex items-center justify-center mx-auto mb-4">
                <StopCircle className="w-7 h-7 text-loss" />
              </div>
              
              <h3 className="text-lg font-bold text-primary mb-2">End Stream?</h3>
              <p className="text-sm text-secondary mb-6">
                Your stream has been live for {formatDuration(streamDuration)} with {viewerCount} viewers.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEndConfirm(false)}
                   className="flex-1 border-ink-edge text-secondary hover:bg-ink-raised"
                  data-testid="button-cancel-end"
                >
                  Keep Streaming
                </Button>
                <Button
                  onClick={confirmEndStream}
                  disabled={isEnding}
                  className="flex-1 bg-loss hover:bg-loss/80 text-primary"
                  data-testid="button-confirm-end"
                >
                  {isEnding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ending...
                    </>
                  ) : (
                    'End Stream'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-20 left-3 right-3 z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-ink-surface/90 backdrop-blur-sm rounded-xl p-2 text-xs text-secondary border border-ink-edge text-center"
        >
          <Sparkles className="w-3 h-3 inline mr-1 text-accent-bright" />
          You're broadcasting live • Viewers see your stream with a slight delay
        </motion.div>
      </div>
    </div>
  );
}
