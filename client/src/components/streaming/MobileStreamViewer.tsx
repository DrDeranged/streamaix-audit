import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageCircle, Heart, Share2, Volume2, VolumeX, 
  ArrowLeft, Maximize2, Minimize2, Gift, X, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback';

interface ViewerInfo {
  id: string;
  username: string;
  avatar?: string;
  isAiAgent?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  isAiAgent?: boolean;
  timestamp: number;
}

interface MobileStreamViewerProps {
  streamId: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  isLive: boolean;
  viewerCount: number;
  videoElement?: React.ReactNode;
  isAvatarStream?: boolean;
  onBack?: () => void;
  onShare?: () => void;
  onTip?: () => void;
  children?: React.ReactNode;
}

export function MobileStreamViewer({
  streamId,
  title,
  hostName,
  hostAvatar,
  isLive,
  viewerCount,
  videoElement,
  isAvatarStream,
  onBack,
  onShare,
  onTip,
  children
}: MobileStreamViewerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const formatViewers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleTap = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  useEffect(() => {
    handleTap();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleTap]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div 
      className={cn(
        "relative w-full bg-black",
        isFullscreen ? "fixed inset-0 z-50" : "aspect-video max-h-[60vh]"
      )}
      onClick={handleTap}
      data-testid="stream-viewer-container"
    >
      {videoElement ? (
        videoElement
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
          {isAvatarStream && (
            <div className="relative">
              <motion.div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-600 via-cyan-500 to-emerald-500 p-1"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AvatarWithFallback 
                  src={hostAvatar} 
                  name={hostName} 
                  size="xl"
                  className="w-full h-full"
                />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-400/50"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showControls && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {onBack && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-black/40 hover:bg-black/60 text-white"
                      onClick={(e) => { e.stopPropagation(); onBack(); }}
                      data-testid="button-back"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <AvatarWithFallback src={hostAvatar} name={hostName} size="sm" />
                    <div>
                      <p className="text-white font-semibold text-sm line-clamp-1">{hostName}</p>
                      <div className="flex items-center gap-2">
                        {isLive && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4">
                            LIVE
                          </Badge>
                        )}
                        <span className="text-white/70 text-xs flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatViewers(viewerCount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white"
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    data-testid="button-mute"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white"
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    data-testid="button-fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
            >
              <p className="text-white text-sm font-medium mb-3 line-clamp-2">{title}</p>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 bg-white/10 hover:bg-white/20 text-white gap-1.5"
                    onClick={(e) => { e.stopPropagation(); }}
                    data-testid="button-like"
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">Like</span>
                  </Button>
                  {onShare && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 bg-white/10 hover:bg-white/20 text-white gap-1.5"
                      onClick={(e) => { e.stopPropagation(); onShare(); }}
                      data-testid="button-share"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-xs">Share</span>
                    </Button>
                  )}
                </div>
                
                {onTip && (
                  <Button
                    size="sm"
                    className="h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white gap-1.5"
                    onClick={(e) => { e.stopPropagation(); onTip(); }}
                    data-testid="button-tip"
                  >
                    <Gift className="h-4 w-4" />
                    <span className="text-xs font-semibold">Tip</span>
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

interface ViewerJoinInfo {
  id?: string;
  oderId?: string;
  username: string;
  avatar?: string;
  isAiAgent?: boolean;
}

interface ViewerPresenceProps {
  recentJoins: ViewerJoinInfo[];
  className?: string;
}

export function ViewerPresence({ recentJoins, className }: ViewerPresenceProps) {
  return (
    <AnimatePresence>
      {recentJoins.slice(0, 3).map((viewer, index) => {
        const viewerId = viewer.id || (viewer as any).userId || `viewer-${index}`;
        return (
          <motion.div
            key={`${viewerId}-${index}`}
            initial={{ opacity: 0, x: -50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full",
              className
            )}
          >
            <AvatarWithFallback src={viewer.avatar} name={viewer.username} size="xs" />
            <span className="text-white text-xs font-medium">
              {viewer.username} joined
            </span>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
