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
  Radio,
  Square,
  Settings,
  MessageCircle,
  Users,
  Coins,
  BarChart3,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import { cn } from '@/lib/utils';

interface BroadcastControlsProps {
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isScreenSharing: boolean;
  isLive: boolean;
  viewerCount: number;
  duration: number;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  onSwitchCamera: () => void;
  onEndStream: () => void;
  onOpenChat: () => void;
  onOpenStats: () => void;
}

export function BroadcastControls({
  stream,
  videoEnabled,
  audioEnabled,
  isScreenSharing,
  isLive,
  viewerCount,
  duration,
  onToggleVideo,
  onToggleAudio,
  onStartScreenShare,
  onStopScreenShare,
  onSwitchCamera,
  onEndStream,
  onOpenChat,
  onOpenStats,
}: BroadcastControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      {isLive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-16 left-0 right-0 flex items-center justify-between px-4"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1.5 bg-loss/90 backdrop-blur-sm rounded-xl px-3 py-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">LIVE</span>
            </motion.div>
            <Badge className="bg-ink-surface text-primary border border-ink-edge text-xs">
              {formatDuration(duration)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/30 text-xs">
              <Users className="w-3 h-3 mr-1" />
              {viewerCount.toLocaleString()}
            </Badge>
          </div>
        </motion.div>
      )}

      <Surface className="bg-ink-surface/95 backdrop-blur-xl rounded-t-xl p-4 pb-8 safe-area-inset-bottom">
        <div className="flex items-center justify-around gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleVideo}
            className={cn(
               "relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all touch-manipulation",
              videoEnabled 
                 ? "bg-ink-raised text-primary"
                 : "bg-loss/20 text-loss"
            )}
            data-testid="button-toggle-video"
          >
            {videoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
            <span className="text-[10px] font-medium">
              {videoEnabled ? 'Camera' : 'Off'}
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleAudio}
            className={cn(
               "relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all touch-manipulation",
              audioEnabled 
                 ? "bg-ink-raised text-primary"
                 : "bg-loss/20 text-loss"
            )}
            data-testid="button-toggle-audio"
          >
            {audioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
            <span className="text-[10px] font-medium">
              {audioEnabled ? 'Mic' : 'Muted'}
            </span>
          </motion.button>

          {isLive ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onEndStream}
               className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-loss text-primary shadow-lg shadow-loss/30 touch-manipulation"
              data-testid="button-end-stream"
            >
              <Square className="w-6 h-6 fill-current" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
               className="flex flex-col items-center gap-1.5 p-4 rounded-xl grad-accent text-primary glow-accent touch-manipulation"
              data-testid="button-start-stream"
            >
              <Radio className="w-6 h-6" />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onSwitchCamera}
             className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-ink-raised text-primary transition-all touch-manipulation"
            data-testid="button-switch-camera"
          >
            <SwitchCamera className="w-6 h-6" />
            <span className="text-[10px] font-medium">Flip</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
            className={cn(
               "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all touch-manipulation",
              isScreenSharing 
                 ? "bg-gain/20 text-gain"
                 : "bg-ink-raised text-primary"
            )}
            data-testid="button-screen-share"
          >
            {isScreenSharing ? (
              <MonitorOff className="w-6 h-6" />
            ) : (
              <Monitor className="w-6 h-6" />
            )}
            <span className="text-[10px] font-medium">
              {isScreenSharing ? 'Stop' : 'Share'}
            </span>
          </motion.button>
        </div>

        <motion.button
          onClick={() => setShowAdvanced(!showAdvanced)}
           className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-secondary text-sm"
        >
          {showAdvanced ? (
            <>
              <ChevronDown className="w-4 h-4" />
              Hide Options
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4" />
              More Options
            </>
          )}
        </motion.button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-3 pt-4 border-t border-ink-divider">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenChat}
                   className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-ink-raised text-body hover:bg-ink-surface transition-colors touch-manipulation"
                  data-testid="button-open-chat"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-[10px]">Chat</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenStats}
                   className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-ink-raised text-body hover:bg-ink-surface transition-colors touch-manipulation"
                  data-testid="button-open-stats"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-[10px]">Stats</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                   className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-ink-raised text-body hover:bg-ink-surface transition-colors touch-manipulation"
                  data-testid="button-tips"
                >
                  <Coins className="w-5 h-5" />
                  <span className="text-[10px]">Tips</span>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                   className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-ink-raised text-body hover:bg-ink-surface transition-colors touch-manipulation"
                  data-testid="button-settings"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-[10px]">Settings</span>
                </motion.button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
       </Surface>
    </div>
  );
}

export function VideoPreview({ 
  stream, 
  videoEnabled,
  isScreenSharing,
  className 
}: { 
  stream: MediaStream | null; 
  videoEnabled: boolean;
  isScreenSharing: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn(
      "relative aspect-video bg-ink-surface rounded-xl overflow-hidden border border-ink-edge",
      className
    )}>
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover",
            !isScreenSharing && "scale-x-[-1]"
          )}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-raised">
          <div className="p-4 rounded-xl bg-ink-surface">
            <VideoOff className="w-8 h-8 text-secondary" />
          </div>
          <span className="text-sm text-secondary">Camera is off</span>
        </div>
      )}

      {isScreenSharing && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gain/90 rounded-xl px-3 py-1.5">
          <Monitor className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Sharing Screen</span>
        </div>
      )}
    </div>
  );
}

export function LiveIndicator({ isLive, className }: { isLive: boolean; className?: string }) {
  if (!isLive) return null;
  
  return (
    <motion.div
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={cn(
        "flex items-center gap-1.5 bg-loss/90 backdrop-blur-sm rounded-xl px-3 py-1.5",
        className
      )}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-2 h-2 rounded-xl bg-primary"
      />
      <span className="text-xs font-bold text-primary tracking-wider">LIVE</span>
    </motion.div>
  );
}

export function StreamStats({ 
  viewerCount, 
  duration, 
  tipsReceived,
  messagesCount,
  className 
}: { 
  viewerCount: number; 
  duration: number;
  tipsReceived: number;
  messagesCount: number;
  className?: string;
}) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Surface className={cn(
      "grid grid-cols-4 gap-3 p-4 bg-ink-surface/80 backdrop-blur-xl",
      className
    )}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-accent-bright mb-1">
          <Users className="w-4 h-4" />
        </div>
        <StatValue label="Viewers" value={viewerCount} valueClassName="text-lg font-bold" />
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-accent-bright mb-1">
          <Radio className="w-4 h-4" />
        </div>
        <StatValue label="Duration" value={formatDuration(duration)} valueClassName="text-lg font-bold" />
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-warn mb-1">
          <Coins className="w-4 h-4" />
        </div>
        <StatValue label="Tips" value={tipsReceived} valueClassName="text-lg font-bold" />
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-gain mb-1">
          <MessageCircle className="w-4 h-4" />
        </div>
        <StatValue label="Messages" value={messagesCount} valueClassName="text-lg font-bold" />
      </div>
    </Surface>
  );
}
