import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  SwitchCamera,
  Settings,
  StopCircle,
  Users,
  Clock,
  Sparkles,
  AlertTriangle,
  Loader2,
  Radio,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useBroadcastStream } from '@/hooks/useBroadcastStream';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {mediaError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/90">
          <div className="text-center p-6 max-w-md">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Camera/Microphone Error</h3>
            <p className="text-sm text-slate-400 mb-4">{mediaError}</p>
            <Button
              onClick={() => startStream()}
              className="bg-purple-600 hover:bg-purple-500"
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
              "p-8 rounded-full mb-6",
              audioEnabled ? "bg-cyan-500/20 ring-4 ring-cyan-500/30" : "bg-slate-700/50"
            )}
          >
            {audioEnabled ? (
              <Mic className="w-16 h-16 text-cyan-400" />
            ) : (
              <MicOff className="w-16 h-16 text-slate-400" />
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
                    audioEnabled ? "bg-cyan-400" : "bg-slate-600"
                  )}
                  style={{ height: 8 }}
                />
              ))}
            </div>
          </div>
          
          <p className="text-sm text-slate-400">
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
              <div className="p-6 rounded-full bg-slate-700/50 mb-4">
                <VideoOff className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">
                {stream ? 'Camera is off' : 'Connecting to camera...'}
              </p>
            </div>
          )}
        </>
      )}

      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <Badge className="bg-red-500/90 text-white text-xs px-2.5 py-1">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-white mr-1.5"
          />
          LIVE
        </Badge>
        
        <Badge className={cn(
          "backdrop-blur-sm text-xs px-2.5 py-1",
          connectionQuality === 'excellent' ? "bg-emerald-500/80 text-white" :
          connectionQuality === 'good' ? "bg-cyan-500/80 text-white" :
          connectionQuality === 'poor' ? "bg-amber-500/80 text-white" :
          "bg-slate-700/80 text-slate-300"
        )}>
          {connectionQuality === 'excellent' ? <Wifi className="w-3 h-3 mr-1.5" /> :
           connectionQuality === 'good' ? <Wifi className="w-3 h-3 mr-1.5" /> :
           connectionQuality === 'poor' ? <WifiOff className="w-3 h-3 mr-1.5" /> :
           <WifiOff className="w-3 h-3 mr-1.5" />}
          {connectionQuality === 'disconnected' ? 'Connecting...' : connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
        </Badge>
        
        <Badge className="bg-slate-900/80 backdrop-blur-sm text-white text-xs px-2.5 py-1">
          <Clock className="w-3 h-3 mr-1.5" />
          {formatDuration(streamDuration)}
        </Badge>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-slate-900/80 backdrop-blur-sm text-cyan-400 text-xs px-2.5 py-1">
          <Users className="w-3 h-3 mr-1.5" />
          {viewerCount} watching
        </Badge>
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl rounded-full px-4 py-2 border border-purple-500/30"
        >
          {!isAudioOnly && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleVideo}
              className={cn(
                "p-2.5 rounded-full transition-all",
                videoEnabled 
                  ? "bg-slate-700/50 text-white hover:bg-slate-600/50" 
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
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
              "p-2.5 rounded-full transition-all",
              audioEnabled 
                ? "bg-slate-700/50 text-white hover:bg-slate-600/50" 
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
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
                  "p-2.5 rounded-full transition-all",
                  isScreenSharing 
                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                    : "bg-slate-700/50 text-white hover:bg-slate-600/50"
                )}
                data-testid="button-toggle-screen-share"
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </motion.button>

              {devices.videoDevices.length > 1 && !isScreenSharing && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={switchCamera}
                  className="p-2.5 rounded-full bg-slate-700/50 text-white hover:bg-slate-600/50 transition-all"
                  data-testid="button-switch-camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </motion.button>
              )}
            </>
          )}

          <div className="w-px h-6 bg-slate-600 mx-1" />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleEndStream}
            disabled={isEnding}
            className="p-2.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm mx-4 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <StopCircle className="w-7 h-7 text-red-400" />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">End Stream?</h3>
              <p className="text-sm text-slate-400 mb-6">
                Your stream has been live for {formatDuration(streamDuration)} with {viewerCount} viewers.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                  data-testid="button-cancel-end"
                >
                  Keep Streaming
                </Button>
                <Button
                  onClick={confirmEndStream}
                  disabled={isEnding}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white"
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
          className="bg-slate-900/70 backdrop-blur-sm rounded-lg p-2 text-xs text-slate-400 text-center"
        >
          <Sparkles className="w-3 h-3 inline mr-1 text-purple-400" />
          You're broadcasting live • Viewers see your stream with a slight delay
        </motion.div>
      </div>
    </div>
  );
}
