import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Mic, Radio, Brain, Zap, TrendingUp, Volume2, VolumeX, MessageCircle, Target, BarChart3, Shield, Flame, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';

interface AIAvatarStreamProps {
  hostName: string;
  hostAvatar?: string;
  streamType: string;
  isLive: boolean;
  currentMessage?: string;
  viewerCount?: number;
  onAudioMessage?: (callback: (audio: AvatarAudioData) => void) => () => void;
  streamId?: string;
}

interface AvatarAudioData {
  avatarName: string;
  text: string;
  audioBase64: string;
  segmentType: string;
  duration: number;
  timestamp: string;
}

interface AudioQueueItem {
  id: string;
  text: string;
  audioBase64: string;
  segmentType: string;
}

interface AIPersona {
  name: string;
  style: 'analytical' | 'enthusiastic' | 'educational' | 'skeptical' | 'casual';
  expertise: string[];
  mood: string;
  icon: any;
  gradient: string;
}

const getPersonaFromName = (name: string): AIPersona => {
  const personas: Record<string, AIPersona> = {
    'CryptoSage': {
      name: 'CryptoSage',
      style: 'analytical',
      expertise: ['Market Trends', 'On-chain Metrics', 'Price Analysis'],
      mood: 'Focused',
      icon: BarChart3,
      gradient: 'bg-accent-core',
    },
    'DeFi Master': {
      name: 'DeFi Master',
      style: 'educational',
      expertise: ['Yield Farming', 'Liquidity Pools', 'Protocol Analysis'],
      mood: 'Helpful',
      icon: Shield,
      gradient: 'bg-gain',
    },
    'AlphaBot': {
      name: 'AlphaBot',
      style: 'analytical',
      expertise: ['Technical Analysis', 'Trading Signals', 'Risk Management'],
      mood: 'Sharp',
      icon: Target,
      gradient: 'bg-warn',
    },
    'StreamHost': {
      name: 'StreamHost',
      style: 'enthusiastic',
      expertise: ['Community', 'Crypto News', 'Project Updates'],
      mood: 'Energetic',
      icon: Flame,
      gradient: 'bg-accent-deep',
    },
    'Marc Andreessen': {
      name: 'Marc Andreessen',
      style: 'analytical',
      expertise: ['Venture Capital', 'Tech Trends', 'Web3 Vision'],
      mood: 'Strategic',
      icon: Brain,
      gradient: 'bg-accent-core',
    },
    'Vitalik Buterin': {
      name: 'Vitalik Buterin',
      style: 'educational',
      expertise: ['Ethereum', 'Protocol Design', 'Crypto Philosophy'],
      mood: 'Thoughtful',
      icon: Sparkles,
      gradient: 'bg-accent-deep',
    },
    'Elon Musk': {
      name: 'Elon Musk',
      style: 'enthusiastic',
      expertise: ['Innovation', 'Meme Coins', 'Tech Future'],
      mood: 'Unpredictable',
      icon: Zap,
      gradient: 'bg-warn',
    },
    'Balaji Srinivasan': {
      name: 'Balaji Srinivasan',
      style: 'analytical',
      expertise: ['Network States', 'Crypto Economics', 'Tech Predictions'],
      mood: 'Visionary',
      icon: Target,
      gradient: 'bg-gain',
    },
  };
  
  return personas[name] || {
    name: name,
    style: 'casual',
    expertise: ['Crypto', 'Market Analysis', 'Trading'],
    mood: 'Engaged',
    icon: Bot,
    gradient: 'bg-accent-core',
  };
};

const avatarStyles: Record<string, { gradient: string; icon: any; pulseColor: string }> = {
  broadcast: {
    gradient: 'bg-accent-core',
    icon: Radio,
    pulseColor: 'rgb(217, 70, 239)',
  },
  trading_room: {
    gradient: 'bg-gain',
    icon: TrendingUp,
    pulseColor: 'rgb(16, 185, 129)',
  },
  audio_space: {
    gradient: 'bg-accent-core',
    icon: Mic,
    pulseColor: 'rgb(6, 182, 212)',
  },
  live_bounty: {
    gradient: 'bg-warn',
    icon: Zap,
    pulseColor: 'rgb(245, 158, 11)',
  },
  avatar_alpha: {
    gradient: 'bg-accent-deep',
    icon: Brain,
    pulseColor: 'rgb(217, 70, 239)',
  },
};

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            background: '#8B7CF6',
          }}
          animate={{
            y: [-20, -50, -20],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

function SpeakingAvatar({ 
  hostName, 
  hostAvatar, 
  isSpeaking, 
  persona,
  style 
}: { 
  hostName: string;
  hostAvatar?: string;
  isSpeaking: boolean;
  persona: AIPersona;
  style: { gradient: string; icon: any; pulseColor: string };
}) {
  const PersonaIcon = persona.icon;

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className="relative"
        animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.6, repeat: isSpeaking ? Infinity : 0 }}
      >
        {isSpeaking && (
          <>
            <motion.div
              className={cn("absolute -inset-3 rounded-full opacity-60 blur-xl", style.gradient)}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            <motion.div
              className={cn("absolute -inset-1.5 rounded-full", style.gradient)}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.4, repeat: Infinity }}
              style={{ filter: 'blur(2px)' }}
            />
          </>
        )}
        
        {!isSpeaking && (
          <motion.div
            className={cn("absolute -inset-2 rounded-full opacity-30 blur-lg", style.gradient)}
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
        
        <div className={cn(
          "relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center overflow-hidden border-2 shadow-lg",
          isSpeaking ? "border-accent-core/80" : "border-ink-edge",
          style.gradient
        )}>
          {hostAvatar ? (
            <img src={hostAvatar} alt={hostName} className="w-full h-full object-cover" />
          ) : (
            <Bot className="w-1/2 h-1/2 text-primary" />
          )}
        </div>
        
        <motion.div
          className={cn(
            "absolute -bottom-1 -right-1 rounded-full p-2 shadow-lg border border-ink-edge",
            persona.gradient
          )}
          animate={isSpeaking ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
        >
          <PersonaIcon className="w-4 h-4 text-primary" />
        </motion.div>

        {isSpeaking && (
          <motion.div
            className="absolute -top-1 -left-1 bg-accent-core rounded-full p-2 shadow-lg border border-ink-edge"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            <MessageCircle className="w-3.5 h-3.5 text-primary" />
          </motion.div>
        )}
      </motion.div>

      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg sm:text-xl font-bold text-primary">{hostName}</h3>
        <p className="text-xs sm:text-sm text-secondary capitalize">{persona.style} • {persona.mood}</p>
      </motion.div>
    </div>
  );
}

function StatusBar({ 
  isLive, 
  viewerCount, 
  isSpeaking, 
  isMuted,
  persona 
}: { 
  isLive: boolean;
  viewerCount?: number;
  isSpeaking: boolean;
  isMuted: boolean;
  persona: AIPersona;
}) {
  return (
    <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {isLive && (
          <Badge className="bg-loss/20 text-loss border-loss/30 text-[10px] sm:text-xs px-2 py-0.5">
            <motion.span 
              className="w-1.5 h-1.5 rounded-full bg-loss mr-1.5 inline-block"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            LIVE
          </Badge>
        )}
        
        <Badge className="bg-accent-core/20 text-accent-bright border-accent-core/30 text-[10px] sm:text-xs px-2 py-0.5">
          <Brain className="w-3 h-3 mr-1" />
          AI Host
        </Badge>

        {viewerCount !== undefined && (
          <Badge variant="outline" className="border-accent-core/30 text-accent-bright text-[10px] sm:text-xs px-2 py-0.5">
            <Users className="w-3 h-3 mr-1" />
            {viewerCount}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSpeaking && !isMuted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 bg-accent-core/20 rounded-full px-2.5 py-1 border border-accent-core/30"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-accent-core"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
            <span className="text-[10px] sm:text-xs text-accent-bright font-medium">Speaking</span>
          </motion.div>
        )}
        
        {isMuted && (
          <Badge variant="outline" className="border-ink-edge text-secondary text-[10px] sm:text-xs px-2 py-0.5">
            <VolumeX className="w-3 h-3" />
          </Badge>
        )}
      </div>
    </div>
  );
}

function SpeechBubble({ text, segmentType }: { text: string; segmentType?: string }) {
  const getSegmentLabel = () => {
    switch (segmentType) {
      case 'opening': return '🎤 Opening';
      case 'market_analysis': return '📊 Market Analysis';
      case 'market_reaction': return '📈 Market Update';
      case 'viewer_qa': return '💬 Q&A';
      default: return '💡 Insight';
    }
  };

  const truncatedText = text.length > 200 ? text.substring(0, 200) + '...' : text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto px-3"
    >
      <Surface variant="raised" className="relative px-4 py-3 sm:px-5 sm:py-4 backdrop-blur-2xl rounded-xl border border-accent-core/40 shadow-lg shadow-accent-core/10">
        <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
          <div className="px-2.5 py-0.5 bg-accent-deep rounded-full shadow-lg">
            <span className="text-[10px] text-primary font-semibold tracking-wide">{getSegmentLabel()}</span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-body leading-relaxed mt-1 font-medium text-center">{truncatedText}</p>
      </Surface>
    </motion.div>
  );
}

function AudioControls({ 
  isMuted, 
  onToggleMute,
  isPlaying 
}: { 
  isMuted: boolean;
  onToggleMute: () => void;
  isPlaying: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        onClick={onToggleMute}
        onTouchEnd={(e) => {
          e.preventDefault();
          onToggleMute();
        }}
        className={cn(
          "rounded-xl border-2 transition-all h-12 px-5 font-medium",
          isMuted 
            ? "border-ink-edge bg-ink-raised text-secondary hover:bg-ink-surface" 
            : "border-accent-core/50 bg-accent-core/20 text-accent-bright hover:bg-accent-core/30"
        )}
        data-testid="button-toggle-audio"
      >
        {isMuted ? <VolumeX className="w-5 h-5 mr-2" /> : <Volume2 className="w-5 h-5 mr-2" />}
        {isMuted ? 'Enable Audio' : 'Listening'}
      </Button>
      
      {isPlaying && !isMuted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1"
        >
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-accent-core rounded-full"
              animate={{ height: [8, 16 + Math.sin(i * 0.8) * 8, 8] }}
              transition={{
                duration: 0.3 + (i * 0.05),
                repeat: Infinity,
                delay: i * 0.05,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function MobileAudioOverlay({ onEnable }: { onEnable: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink-page/80 backdrop-blur-sm"
      onClick={onEnable}
      onTouchEnd={(e) => {
        e.preventDefault();
        onEnable();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-4 p-8"
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-accent-core flex items-center justify-center shadow-lg shadow-accent-core/30"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Volume2 className="w-10 h-10 text-primary" />
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-semibold text-primary mb-1">Tap to Enable Audio</p>
          <p className="text-sm text-secondary">Listen to live AI commentary</p>
        </div>
        <motion.div
          className="flex items-center gap-1 mt-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-2 h-2 rounded-full bg-accent-core" />
          <div className="w-2 h-2 rounded-full bg-accent-bright" />
          <div className="w-2 h-2 rounded-full bg-accent-core" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function AIAvatarStream({ 
  hostName, 
  hostAvatar, 
  streamType, 
  isLive,
  currentMessage,
  viewerCount,
  onAudioMessage,
  streamId
}: AIAvatarStreamProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState<string | null>(null);
  const [currentSegmentType, setCurrentSegmentType] = useState<string>('');
  const [showMobileOverlay, setShowMobileOverlay] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const isProcessingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const preRecordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const preRecordedLoadedRef = useRef(false);
  
  const style = avatarStyles[streamType] || avatarStyles.broadcast;
  const persona = useMemo(() => getPersonaFromName(hostName), [hostName]);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0 || isMuted) {
      return;
    }

    isProcessingRef.current = true;
    const item = audioQueueRef.current.shift();
    
    if (!item) {
      isProcessingRef.current = false;
      return;
    }

    // Server-side TTS was removed — avatar segments arrive text-only
    // (audioBase64 === ''). Speak them client-side via the Web Speech API.
    if (!item.audioBase64) {
      setIsSpeaking(true);
      setCurrentSpeechText(item.text);
      setCurrentSegmentType(item.segmentType);
      const finish = () => {
        setIsPlayingAudio(false);
        setIsSpeaking(false);
        isProcessingRef.current = false;
        setTimeout(() => setCurrentSpeechText(null), 2000);
        playNextInQueue();
      };
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.onend = finish;
        utterance.onerror = finish;
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      } else {
        // No speech support: show the text for a reading-paced interval.
        const readMs = Math.min(15000, Math.max(3000, item.text.length * 50));
        setTimeout(finish, readMs);
      }
      return;
    }

    try {
      const audioContext = initAudioContext();
      
      const binaryString = atob(item.audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      currentSourceRef.current = source;
      setIsPlayingAudio(true);
      setIsSpeaking(true);
      setCurrentSpeechText(item.text);
      setCurrentSegmentType(item.segmentType);
      
      source.onended = () => {
        currentSourceRef.current = null;
        setIsPlayingAudio(false);
        setIsSpeaking(false);
        isProcessingRef.current = false;
        
        setTimeout(() => {
          setCurrentSpeechText(null);
        }, 2000);
        
        playNextInQueue();
      };
      
      source.start(0);
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Audio] Failed to play audio:', error);
      isProcessingRef.current = false;
      setIsPlayingAudio(false);
      setIsSpeaking(false);
      playNextInQueue();
    }
  }, [isMuted, initAudioContext]);

  const handleAudioMessage = useCallback((audio: AvatarAudioData) => {
    const queueItem: AudioQueueItem = {
      id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: audio.text,
      audioBase64: audio.audioBase64,
      segmentType: audio.segmentType,
    };
    
    audioQueueRef.current.push(queueItem);
    
    if (!isProcessingRef.current && !isMuted) {
      playNextInQueue();
    }
  }, [isMuted, playNextInQueue]);

  useEffect(() => {
    if (onAudioMessage) {
      const unsubscribe = onAudioMessage(handleAudioMessage);
      return unsubscribe;
    }
  }, [onAudioMessage, handleAudioMessage]);

  useEffect(() => {
    if (!isMuted && audioQueueRef.current.length > 0 && !isProcessingRef.current) {
      playNextInQueue();
    }
  }, [isMuted, playNextInQueue]);

  const playPreRecordedAudio = useCallback(async () => {
    if (!streamId || preRecordedLoadedRef.current) return;
    preRecordedLoadedRef.current = true;
    
    try {
      const response = await fetch(`/api/streams/${streamId}/audio`);
      if (!response.ok) return;
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      preRecordedAudioRef.current = audio;
      
      audio.onplay = () => {
        setIsPlayingAudio(true);
        setIsSpeaking(true);
        setCurrentSegmentType('market_analysis');
      };
      audio.onended = () => {
        setIsPlayingAudio(false);
        setIsSpeaking(false);
        setCurrentSpeechText(null);
        URL.revokeObjectURL(url);
        preRecordedAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        preRecordedAudioRef.current = null;
      };
      
      audio.play().catch(() => {});
    } catch (err) {
      preRecordedLoadedRef.current = false;
    }
  }, [streamId]);

  const handleEnableAudio = useCallback(() => {
    setShowMobileOverlay(false);
    setHasUserInteracted(true);
    initAudioContext();
    setIsMuted(false);
    playPreRecordedAudio();
  }, [initAudioContext, playPreRecordedAudio]);

  const toggleMute = useCallback(() => {
    setHasUserInteracted(true);
    if (isMuted) {
      initAudioContext();
      if (preRecordedAudioRef.current) {
        preRecordedAudioRef.current.play().catch(() => {});
      } else {
        playPreRecordedAudio();
      }
    } else {
      if (preRecordedAudioRef.current) {
        preRecordedAudioRef.current.pause();
      }
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
      setIsPlayingAudio(false);
      setIsSpeaking(false);
      isProcessingRef.current = false;
    }
    setIsMuted(!isMuted);
  }, [isMuted, initAudioContext, playPreRecordedAudio]);

  useEffect(() => {
    return () => {
      if (preRecordedAudioRef.current) {
        preRecordedAudioRef.current.pause();
        preRecordedAudioRef.current = null;
      }
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (currentMessage && !currentSpeechText) {
      const timer = setTimeout(() => {
        setCurrentSpeechText(currentMessage);
        setIsSpeaking(true);
        setTimeout(() => {
          setCurrentSpeechText(null);
          setIsSpeaking(false);
        }, 8000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentMessage, currentSpeechText]);

  return (
    <div className="absolute inset-0 flex flex-col bg-ink-page overflow-hidden">
      <FloatingParticles />
      
      <StatusBar 
        isLive={isLive}
        viewerCount={viewerCount}
        isSpeaking={isSpeaking}
        isMuted={isMuted}
        persona={persona}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 gap-6">
        <SpeakingAvatar
          hostName={hostName}
          hostAvatar={hostAvatar}
          isSpeaking={isSpeaking}
          persona={persona}
          style={style}
        />

        <div className="w-full min-h-[100px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentSpeechText && (
              <SpeechBubble 
                key="speech"
                text={currentSpeechText} 
                segmentType={currentSegmentType} 
              />
            )}
          </AnimatePresence>
        </div>

        <AudioControls
          isMuted={isMuted}
          onToggleMute={toggleMute}
          isPlaying={isPlayingAudio}
        />
      </div>

      <AnimatePresence>
        {showMobileOverlay && !hasUserInteracted && (
          <MobileAudioOverlay onEnable={handleEnableAudio} />
        )}
      </AnimatePresence>
    </div>
  );
}
