import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  MessageCircle,
  Heart,
  Send,
  Coins,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Radio,
  Wifi,
  WifiOff,
  ChevronUp,
  ChevronDown,
  Gift,
  Sparkles,
  Crown,
  Bot,
  Zap,
  MoreVertical,
  Share2,
  Flag,
  Clock,
  Eye,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  onSendMessage: (message: string) => void;
  onToggleMute: () => void;
  onReaction: (emoji: string) => void;
  onTip: (amount: number, message?: string) => void;
  onExit: () => void;
  isHost?: boolean;
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
        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
        msg.isAiAgent ? "bg-gradient-to-br from-cyan-500/80 to-blue-500/80" :
        msg.isModerator ? "bg-gradient-to-br from-emerald-500/80 to-green-500/80" :
        msg.isSubscriber ? "bg-gradient-to-br from-purple-500/80 to-fuchsia-500/80" :
        "bg-slate-700/80"
      )}>
        {msg.isAiAgent ? <Bot className="w-3.5 h-3.5 text-white" /> : msg.username[0]?.toUpperCase()}
      </div>
      <div className="bg-black/40 backdrop-blur-md rounded-2xl rounded-tl-sm px-3 py-2 border border-white/10">
        <div className="flex items-center gap-1.5 mb-0.5">
          {msg.isAiAgent && (
            <Badge className="bg-cyan-500/30 text-cyan-300 text-[8px] px-1 py-0 h-auto">AI</Badge>
          )}
          {msg.isModerator && (
            <Badge className="bg-emerald-500/30 text-emerald-300 text-[8px] px-1 py-0 h-auto">MOD</Badge>
          )}
          {msg.isSubscriber && (
            <Crown className="w-2.5 h-2.5 text-purple-400" />
          )}
          <span className={cn(
            "text-xs font-semibold",
            msg.isAiAgent ? "text-cyan-300" :
            msg.isModerator ? "text-emerald-300" :
            msg.isSubscriber ? "text-purple-300" : "text-white/80"
          )}>
            {msg.username}
          </span>
        </div>
        <p className="text-sm text-white/90 break-words leading-snug">{msg.content}</p>
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
      bg: 'from-amber-500/90 to-orange-500/90', 
      border: 'border-amber-400/50',
      glow: 'shadow-amber-500/40'
    },
    super: { 
      bg: 'from-purple-500/90 to-pink-500/90', 
      border: 'border-purple-400/50',
      glow: 'shadow-purple-500/40'
    },
    mega: { 
      bg: 'from-cyan-500/90 via-purple-500/90 to-pink-500/90', 
      border: 'border-cyan-400/50',
      glow: 'shadow-cyan-500/40'
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
        "bg-gradient-to-br backdrop-blur-xl rounded-2xl p-5 border-2 shadow-2xl",
        config.bg, config.border, config.glow,
        tip.tier === 'mega' && "animate-pulse"
      )}>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "p-2 rounded-full",
            tip.tier === 'mega' ? "bg-gradient-to-r from-cyan-400 to-purple-400" : "bg-white/20"
          )}>
            {tip.tier === 'mega' ? <Crown className="w-5 h-5 text-white" /> : <Coins className="w-5 h-5 text-yellow-200" />}
          </div>
          <div>
            <p className="text-base font-bold text-white">@{tip.username}</p>
            <p className="text-xs text-white/80">sent a {tip.tier} tip!</p>
          </div>
        </div>
        <p className={cn(
          "text-2xl font-bold text-center text-white font-orbitron",
          tip.tier === 'mega' && "text-3xl"
        )}>
          {tip.amount.toLocaleString()} STREAM
        </p>
        {tip.message && (
          <p className="text-sm text-white/90 mt-2 text-center italic bg-black/20 rounded-lg p-2">
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
  onSendMessage,
  onToggleMute,
  onReaction,
  onTip,
  onExit,
  isHost = false,
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
      className="fixed inset-0 bg-black z-[100] overflow-hidden"
      data-testid="immersive-stream-view"
    >
      {/* Video Background */}
      <div className="absolute inset-0">
        {remoteStream ? (
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
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-6 rounded-full bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 border border-purple-500/20 mb-4 inline-block"
              >
                <Radio className="w-12 h-12 text-purple-400" />
              </motion.div>
              <p className="text-lg font-bold text-white/80 font-orbitron">
                {connectionState === 'connecting' ? 'Connecting...' :
                 connectionState === 'reconnecting' ? 'Reconnecting...' :
                 connectionState === 'failed' ? 'Connection Failed' : 'Stream Loading...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Gradient Overlays for Visibility */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

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
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm ring-2 ring-white/20 overflow-hidden">
                    {hostAvatar ? (
                      <img src={hostAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      hostUsername[0]?.toUpperCase()
                    )}
                  </div>
                  {isLive && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black animate-pulse" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white line-clamp-1 max-w-[180px] sm:max-w-[280px]">
                    {title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span className="font-medium">@{hostUsername}</span>
                    {isLive && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
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
                  <Badge className="bg-red-500/90 text-white text-[10px] px-2 py-0.5 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    LIVE
                  </Badge>
                )}
                {isLive && (
                  <Badge className="bg-black/40 backdrop-blur-sm text-white/80 text-[10px] px-2 py-0.5 border border-white/10">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(streamDuration)}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExit}
                  className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-white/20 border border-white/10"
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
            connectionState === 'connecting' ? "bg-cyan-500/80 text-white" :
            connectionState === 'reconnecting' ? "bg-amber-500/80 text-white" :
            "bg-red-500/80 text-white"
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
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full border border-white/20 px-2 py-1">
                  <Input
                    placeholder="Say something..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-transparent border-0 text-white text-sm h-10 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/50"
                    disabled={!isConnected}
                    data-testid="input-immersive-chat"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!isConnected || !chatMessage.trim()}
                    className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 flex-shrink-0"
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
                          className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
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
                      "h-12 w-12 rounded-full backdrop-blur-md border transition-all",
                      showQuickActions 
                        ? "bg-purple-500/80 border-purple-400/50 text-white" 
                        : "bg-black/50 border-white/20 text-white hover:bg-white/20"
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
                        "h-12 w-12 rounded-full backdrop-blur-md border transition-all",
                        showTipPanel 
                          ? "bg-amber-500/80 border-amber-400/50 text-white" 
                          : "bg-black/50 border-white/20 text-white hover:bg-white/20"
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
                      "h-12 w-12 rounded-full backdrop-blur-md border transition-all",
                      showChat 
                        ? "bg-cyan-500/80 border-cyan-400/50 text-white" 
                        : "bg-black/50 border-white/20 text-white hover:bg-white/20"
                    )}
                    data-testid="button-toggle-chat"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>

                  <Button
                    size="icon"
                    onClick={onToggleMute}
                    className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                    data-testid="button-toggle-mute"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <Button
                    size="icon"
                    onClick={toggleBrowserFullscreen}
                    className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={() => setShowTipPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-5 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white font-orbitron flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  Send Tip
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTipPanel(false)}
                  className="h-8 w-8 text-slate-400 hover:text-white"
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
                        "border-slate-600 text-slate-300 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-300 transition-all",
                        tipAmount === amount.toString() && "bg-amber-500/20 border-amber-500/50 text-amber-300"
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
                  className="bg-slate-800/50 border-slate-600 text-white"
                  data-testid="input-tip-amount"
                />

                <Input
                  placeholder="Add a message (optional)"
                  value={tipMessage}
                  onChange={(e) => setTipMessage(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white"
                  data-testid="input-tip-message"
                />

                <Button
                  onClick={handleSendTip}
                  disabled={!tipAmount || parseInt(tipAmount) <= 0}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 h-12 font-semibold"
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
