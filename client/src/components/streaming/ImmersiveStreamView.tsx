import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageCircle,
  Heart,
  Send,
  Coins,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  WifiOff,
  Gift,
  Crown,
  Bot,
  Clock,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';

interface ChatMessage {
  id: string;
  username: string;
  content: string;
  isAiAgent?: boolean;
  timestamp: number;
  isModerator?: boolean;
  isSubscriber?: boolean;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  timestamp: number;
}

interface TipNotification {
  id: string;
  username: string;
  amount: number;
  message?: string;
  tier: 'basic' | 'super' | 'mega';
}

interface ImmersiveStreamViewProps {
  streamId: string;
  title: string;
  hostUsername: string;
  hostAvatar?: string;
  viewerCount: number;
  streamDuration: number;
  isLive: boolean;
  isMuted: boolean;
  isConnected: boolean;
  connectionState: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  messages: ChatMessage[];
  videoRef: React.RefObject<HTMLVideoElement>;
  remoteStream: MediaStream | null;
  liveKitVideoTrack?: RemoteVideoTrack | LocalVideoTrack | null;
  onSendMessage: (message: string) => void;
  onToggleMute: () => void;
  onReaction: (emoji: string) => void;
  onTip: (amount: number, message?: string) => void;
  onExit: () => void;
  isHost?: boolean;
  autoFullscreen?: boolean;
  children?: React.ReactNode;
}

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatViewers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const FloatingChatBubble = memo(function FloatingChatBubble({ msg }: { msg: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex items-start gap-2 max-w-[85%]"
    >
      <div className={cn(
        "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
        msg.isAiAgent ? "bg-accent-core/80 text-primary" :
        msg.isModerator ? "bg-gain/80 text-primary" :
        msg.isSubscriber ? "bg-accent-deep/80 text-primary" :
        "bg-ink-raised text-secondary"
      )}>
        {msg.isAiAgent ? <Bot className="w-3.5 h-3.5 text-primary" /> : msg.username[0]?.toUpperCase()}
      </div>
      <div className="bg-ink-surface/95 backdrop-blur-md rounded-xl rounded-tl-sm px-3 py-2 border border-ink-edge">
        <div className="flex items-center gap-1.5 mb-0.5">
          {msg.isAiAgent && (
            <Badge className="bg-accent-core/20 text-accent-bright text-[8px] px-1 py-0 h-auto">AI</Badge>
          )}
          {msg.isModerator && (
            <Badge className="bg-gain/20 text-gain text-[8px] px-1 py-0 h-auto">MOD</Badge>
          )}
          {msg.isSubscriber && (
            <Crown className="w-2.5 h-2.5 text-accent-bright" />
          )}
          <span className={cn(
            "text-xs font-semibold",
            msg.isAiAgent ? "text-accent-bright" :
            msg.isModerator ? "text-gain" :
            msg.isSubscriber ? "text-accent-bright" : "text-body"
          )}>
            {msg.username}
          </span>
        </div>
        <p className="text-sm text-body break-words leading-snug">{msg.content}</p>
      </div>
    </motion.div>
  );
});

const FloatingReactionEmoji = memo(function FloatingReactionEmoji({ reaction }: { reaction: FloatingReaction }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ 
        opacity: 0, 
        y: -150, 
        scale: 1.2,
        x: Math.random() * 40 - 20 
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      style={{ left: `${reaction.x}%` }}
      className="absolute bottom-20 text-3xl pointer-events-none z-30"
    >
      {reaction.emoji}
    </motion.div>
  );
});

const TipNotificationOverlay = memo(function TipNotificationOverlay({ 
  tip, 
  onComplete 
}: { 
  tip: TipNotification; 
  onComplete: () => void;
}) {
  useEffect(() => {
    const duration = tip.tier === 'mega' ? 6000 : tip.tier === 'super' ? 4000 : 3000;
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [onComplete, tip.tier]);

  const tierConfig = {
    basic: { 
      bg: 'bg-warn/90', 
      border: 'border-warn/50',
      glow: 'shadow-warn/20'
    },
    super: { 
      bg: 'bg-accent-deep/90', 
      border: 'border-accent-core/50',
      glow: 'shadow-accent-core/20'
    },
    mega: { 
      bg: 'bg-accent-core/90', 
      border: 'border-accent-bright/50',
      glow: 'shadow-accent-core/20'
    },
  };
  const config = tierConfig[tip.tier];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50"
    >
      <div className={cn(
        "backdrop-blur-xl rounded-2xl p-5 border-2 shadow-2xl",
        config.bg, config.border, config.glow,
        tip.tier === 'mega' && "animate-pulse"
      )}>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "p-2 rounded-xl",
            tip.tier === 'mega' ? "bg-accent-bright" : "bg-primary/20"
          )}>
            {tip.tier === 'mega' ? <Crown className="w-5 h-5 text-primary" /> : <Coins className="w-5 h-5 text-warn" />}
          </div>
          <div>
            <p className="text-base font-bold text-primary">@{tip.username}</p>
            <p className="text-xs text-body">sent a {tip.tier} tip!</p>
          </div>
        </div>
        <p className={cn(
          "text-2xl font-bold text-center text-primary tabular",
          tip.tier === 'mega' && "text-3xl"
        )}>
          {tip.amount.toLocaleString()} STREAM
        </p>
        {tip.message && (
          <p className="text-sm text-body mt-2 text-center italic bg-ink-page/40 rounded-xl p-2">
            "{tip.message}"
          </p>
        )}
      </div>
    </motion.div>
  );
});

export const ImmersiveStreamView = memo(function ImmersiveStreamView({
  streamId,
  title,
  hostUsername,
  hostAvatar,
  viewerCount,
  streamDuration,
  isLive,
  isMuted,
  isConnected,
  connectionState,
  messages,
  videoRef,
  remoteStream,
  liveKitVideoTrack,
  onSendMessage,
  onToggleMute,
  onReaction,
  onTip,
  onExit,
  isHost = false,
  autoFullscreen = false,
  children,
}: ImmersiveStreamViewProps) {
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [tipNotifications, setTipNotifications] = useState<TipNotification[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTipPanel, setShowTipPanel] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const liveKitVideoRef = useRef<HTMLVideoElement>(null);

  // Attach LiveKit video track to video element
  useEffect(() => {
    if (liveKitVideoTrack && liveKitVideoRef.current) {
      console.log('[ImmersiveStreamView] Attaching LiveKit video track');
      liveKitVideoTrack.attach(liveKitVideoRef.current);
      return () => {
        if (liveKitVideoTrack) {
          liveKitVideoTrack.detach(liveKitVideoRef.current!);
        }
      };
    }
  }, [liveKitVideoTrack]);

  // ESC key handler to exit immersive mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If in browser fullscreen, exit that first
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onExit();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // Fullscreen API sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-enter fullscreen on mount for hosts (Instagram/FaceTime style)
  useEffect(() => {
    if ((autoFullscreen || isHost) && containerRef.current && !document.fullscreenElement) {
      const enterFullscreen = async () => {
        try {
          await containerRef.current?.requestFullscreen();
          console.log('[ImmersiveStreamView] Auto-entered fullscreen mode');
        } catch (err) {
          console.warn('[ImmersiveStreamView] Could not auto-enter fullscreen:', err);
        }
      };
      
      const timeoutId = setTimeout(enterFullscreen, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [autoFullscreen, isHost]);

  const toggleBrowserFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen not supported:', err);
    }
  }, []);

  const visibleMessages = messages.slice(-8);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const resetControlsTimer = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        if (!showChat && !showTipPanel && !showQuickActions) {
          setShowControls(false);
        }
      }, 4000);
    };

    const handleInteraction = () => resetControlsTimer();

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleInteraction);
      container.addEventListener('touchstart', handleInteraction);
      container.addEventListener('click', handleInteraction);
    }

    resetControlsTimer();

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleInteraction);
        container.removeEventListener('touchstart', handleInteraction);
        container.removeEventListener('click', handleInteraction);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showChat, showTipPanel, showQuickActions]);

  const handleSendMessage = useCallback(() => {
    if (chatMessage.trim()) {
      onSendMessage(chatMessage.trim());
      setChatMessage('');
    }
  }, [chatMessage, onSendMessage]);

  const handleReaction = useCallback((emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: 70 + Math.random() * 25,
      timestamp: Date.now(),
    };
    setFloatingReactions(prev => [...prev.slice(-15), newReaction]);
    onReaction(emoji);
    
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2500);
  }, [onReaction]);

  const handleSendTip = useCallback(() => {
    const amount = parseInt(tipAmount);
    if (amount > 0) {
      onTip(amount, tipMessage || undefined);
      const tier = amount >= 1000 ? 'mega' : amount >= 100 ? 'super' : 'basic';
      setTipNotifications(prev => [...prev, {
        id: Date.now().toString(),
        username: 'You',
        amount,
        message: tipMessage || undefined,
        tier,
      }]);
      setTipAmount('');
      setTipMessage('');
      setShowTipPanel(false);
    }
  }, [tipAmount, tipMessage, onTip]);

  const removeTipNotification = useCallback((id: string) => {
    setTipNotifications(prev => prev.filter(t => t.id !== id));
  }, []);

  const quickReactions = ['❤️', '🔥', '🚀', '💎', '👏', '😂'];

  return (
    <div 
      ref={containerRef}
       className="fixed inset-0 bg-ink-page z-[100] overflow-hidden"
      data-testid="immersive-stream-view"
    >
      {/* Video Background - prioritize LiveKit video track over WebRTC MediaStream */}
      <div className="absolute inset-0">
        {liveKitVideoTrack ? (
          <video
            ref={liveKitVideoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />
        ) : remoteStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />
        ) : children ? (
          <div className="w-full h-full">{children}</div>
        ) : (
          <div className="w-full h-full bg-ink-page flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-6 rounded-xl bg-accent-core/20 border border-accent-core/30 mb-4 inline-block"
              >
                <Radio className="w-12 h-12 text-accent-bright" />
              </motion.div>
              <p className="text-lg font-bold text-body">
                {connectionState === 'connecting' ? 'Connecting...' :
                 connectionState === 'reconnecting' ? 'Reconnecting...' :
                 connectionState === 'failed' ? 'Connection Failed' : 'Stream Loading...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Gradient Overlays for Visibility */}
       <div className="absolute inset-x-0 top-0 h-32 bg-ink-page/60 pointer-events-none" />
       <div className="absolute inset-x-0 bottom-0 h-48 bg-ink-page/75 pointer-events-none" />

      {/* Floating Reactions */}
      <AnimatePresence>
        {floatingReactions.map(reaction => (
          <FloatingReactionEmoji key={reaction.id} reaction={reaction} />
        ))}
      </AnimatePresence>

      {/* Tip Notifications */}
      <AnimatePresence>
        {tipNotifications.map(tip => (
          <TipNotificationOverlay
            key={tip.id}
            tip={tip}
            onComplete={() => removeTipNotification(tip.id)}
          />
        ))}
      </AnimatePresence>

      {/* Top Bar - Stream Info */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 p-4 safe-area-inset z-20"
          >
            <div className="flex items-center justify-between">
              {/* Host Info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-accent-core flex items-center justify-center font-bold text-sm ring-2 ring-accent-bright/30 overflow-hidden">
                    {hostAvatar ? (
                      <img src={hostAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      hostUsername[0]?.toUpperCase()
                    )}
                  </div>
                  {isLive && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-loss rounded-xl border-2 border-ink-page animate-pulse" />
                  )}
                </div>
                <div>
                      <h2 className="text-sm font-bold text-primary line-clamp-1 max-w-[180px] sm:max-w-[280px]">
                    {title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span className="font-medium">@{hostUsername}</span>
                    {isLive && (
                      <>
                        <span className="w-1 h-1 rounded-xl bg-secondary/40" />
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViewers(viewerCount)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {isLive && (
                  <Badge className="bg-loss/90 text-primary text-[10px] px-2 py-0.5 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-xl bg-primary" />
                    LIVE
                  </Badge>
                )}
                {isLive && (
                  <Badge className="bg-ink-surface/80 backdrop-blur-sm text-body text-[10px] px-2 py-0.5 border border-ink-edge">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(streamDuration)}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExit}
                  className="h-10 w-10 rounded-xl bg-ink-surface/80 backdrop-blur-sm text-primary hover:bg-ink-raised border border-ink-edge"
                  data-testid="button-exit-immersive"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Indicator */}
      {connectionState !== 'connected' && connectionState !== 'idle' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
          <Badge className={cn(
            "backdrop-blur-sm text-xs px-3 py-1.5 flex items-center gap-2",
            connectionState === 'connecting' ? "bg-accent-core/80 text-primary" :
            connectionState === 'reconnecting' ? "bg-warn/80 text-primary" :
            "bg-loss/80 text-primary"
          )}>
            {connectionState === 'connecting' || connectionState === 'reconnecting' ? (
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {connectionState === 'connecting' ? 'Connecting...' :
             connectionState === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
          </Badge>
        </div>
      )}

      {/* Floating Chat */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-28 left-4 right-20 max-w-md z-20"
          >
            <div 
              ref={chatContainerRef}
              className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-hide pb-2"
            >
              <AnimatePresence mode="popLayout">
                {visibleMessages.map((msg) => (
                  <FloatingChatBubble key={msg.id} msg={msg} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 p-4 pb-6 safe-area-inset z-20"
          >
            {/* Quick Actions Bar */}
            <div className="flex items-end justify-between gap-3 mb-3">
              {/* Chat Input */}
              <div className="flex-1 max-w-lg">
                <div className="flex items-center gap-2 bg-ink-surface/80 backdrop-blur-md rounded-xl border border-ink-edge px-2 py-1">
                  <Input
                    placeholder="Say something..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-transparent border-0 text-primary text-sm h-10 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted"
                    disabled={!isConnected}
                    data-testid="input-immersive-chat"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!isConnected || !chatMessage.trim()}
                    className="h-9 w-9 rounded-xl grad-accent glow-accent flex-shrink-0"
                    data-testid="button-immersive-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex flex-col items-center gap-3">
                {/* Quick Reactions */}
                <AnimatePresence>
                  {showQuickActions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="flex flex-col gap-2 mb-2"
                    >
                      {quickReactions.map((emoji) => (
                        <motion.button
                          key={emoji}
                          whileTap={{ scale: 1.3 }}
                          onClick={() => handleReaction(emoji)}
                          className="w-11 h-11 rounded-xl bg-ink-surface/80 backdrop-blur-md border border-ink-edge flex items-center justify-center text-xl hover:bg-ink-raised transition-colors"
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className={cn(
                      "h-12 w-12 rounded-xl backdrop-blur-md border transition-all",
                      showQuickActions 
                        ? "bg-accent-core border-accent-bright text-primary glow-accent" 
                        : "bg-ink-surface/80 border-ink-edge text-primary hover:bg-ink-raised"
                    )}
                    data-testid="button-toggle-reactions"
                  >
                    <Heart className="w-5 h-5" />
                  </Button>

                  {!isHost && (
                    <Button
                      size="icon"
                      onClick={() => setShowTipPanel(!showTipPanel)}
                      className={cn(
                        "h-12 w-12 rounded-xl backdrop-blur-md border transition-all",
                        showTipPanel 
                          ? "bg-warn/80 border-warn text-primary" 
                          : "bg-ink-surface/80 border-ink-edge text-primary hover:bg-ink-raised"
                      )}
                      data-testid="button-toggle-tip"
                    >
                      <Gift className="w-5 h-5" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    onClick={() => setShowChat(!showChat)}
                    className={cn(
                      "h-12 w-12 rounded-xl backdrop-blur-md border transition-all",
                      showChat 
                        ? "bg-accent-core border-accent-bright text-primary glow-accent" 
                        : "bg-ink-surface/80 border-ink-edge text-primary hover:bg-ink-raised"
                    )}
                    data-testid="button-toggle-chat"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>

                  <Button
                    size="icon"
                    onClick={onToggleMute}
                    className="h-12 w-12 rounded-xl bg-ink-surface/80 backdrop-blur-md border border-ink-edge text-primary hover:bg-ink-raised"
                    data-testid="button-toggle-mute"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <Button
                    size="icon"
                    onClick={toggleBrowserFullscreen}
                    className="h-12 w-12 rounded-xl bg-ink-surface/80 backdrop-blur-md border border-ink-edge text-primary hover:bg-ink-raised"
                    data-testid="button-toggle-fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tip Panel Overlay */}
      <AnimatePresence>
        {showTipPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-page/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={() => setShowTipPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-ink-surface/95 backdrop-blur-xl rounded-2xl border border-accent-core/30 p-5 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary font-orbitron flex items-center gap-2">
                  <Gift className="w-5 h-5 text-warn" />
                  Send Tip
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTipPanel(false)}
                  className="h-8 w-8 text-muted hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setTipAmount(amount.toString())}
                      className={cn(
                        "border-ink-edge text-body hover:bg-warn/20 hover:border-warn/50 hover:text-warn transition-all",
                        tipAmount === amount.toString() && "bg-warn/20 border-warn/50 text-warn"
                      )}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>

                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="bg-ink-raised border-ink-edge text-primary"
                  data-testid="input-tip-amount"
                />

                <Input
                  placeholder="Add a message (optional)"
                  value={tipMessage}
                  onChange={(e) => setTipMessage(e.target.value)}
                  className="bg-ink-raised border-ink-edge text-primary"
                  data-testid="input-tip-message"
                />

                <Button
                  onClick={handleSendTip}
                  disabled={!tipAmount || parseInt(tipAmount) <= 0}
                  className="w-full bg-warn hover:bg-warn/80 h-12 font-semibold"
                  data-testid="button-send-tip"
                >
                  <Coins className="w-5 h-5 mr-2" />
                  Send {tipAmount ? `${parseInt(tipAmount).toLocaleString()} STREAM` : 'Tip'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ImmersiveStreamView;
