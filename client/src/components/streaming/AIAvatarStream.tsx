import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Activity, Mic, Radio, Brain, Zap, TrendingUp, Volume2, MessageCircle, Lightbulb, Target, BarChart3, Shield, Flame, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAvatarStreamProps {
  hostName: string;
  hostAvatar?: string;
  streamType: string;
  isLive: boolean;
  currentMessage?: string;
  viewerCount?: number;
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
      gradient: 'from-purple-500 to-indigo-500',
    },
    'DeFi Master': {
      name: 'DeFi Master',
      style: 'educational',
      expertise: ['Yield Farming', 'Liquidity Pools', 'Protocol Analysis'],
      mood: 'Helpful',
      icon: Shield,
      gradient: 'from-emerald-500 to-cyan-500',
    },
    'AlphaBot': {
      name: 'AlphaBot',
      style: 'analytical',
      expertise: ['Technical Analysis', 'Trading Signals', 'Risk Management'],
      mood: 'Sharp',
      icon: Target,
      gradient: 'from-amber-500 to-orange-500',
    },
    'StreamHost': {
      name: 'StreamHost',
      style: 'enthusiastic',
      expertise: ['Community', 'Crypto News', 'Project Updates'],
      mood: 'Energetic',
      icon: Flame,
      gradient: 'from-pink-500 to-rose-500',
    },
  };
  
  return personas[name] || {
    name: name,
    style: 'casual',
    expertise: ['Crypto', 'Market Analysis', 'Trading'],
    mood: 'Engaged',
    icon: Bot,
    gradient: 'from-purple-500 to-fuchsia-500',
  };
};

const avatarStyles: Record<string, { gradient: string; icon: any; pulseColor: string }> = {
  broadcast: {
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    icon: Radio,
    pulseColor: 'rgb(168, 85, 247)',
  },
  trading_room: {
    gradient: 'from-emerald-500 via-cyan-500 to-blue-500',
    icon: TrendingUp,
    pulseColor: 'rgb(16, 185, 129)',
  },
  audio_space: {
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    icon: Mic,
    pulseColor: 'rgb(6, 182, 212)',
  },
  live_bounty: {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    icon: Zap,
    pulseColor: 'rgb(245, 158, 11)',
  },
};

const thoughtBubbles = [
  "Analyzing market data...",
  "Processing on-chain metrics...",
  "Evaluating trade setups...",
  "Checking price patterns...",
  "Reviewing sentiment...",
  "Computing risk levels...",
  "Scanning for alpha...",
  "Updating predictions...",
];

function NeuralNetwork() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {[...Array(8)].map((_, i) => (
        <motion.circle
          key={`node-${i}`}
          cx={100 + Math.cos((i * Math.PI * 2) / 8) * 60}
          cy={100 + Math.sin((i * Math.PI * 2) / 8) * 60}
          r="4"
          fill="url(#neural-gradient)"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
      {[...Array(8)].map((_, i) => (
        <motion.line
          key={`line-${i}`}
          x1={100 + Math.cos((i * Math.PI * 2) / 8) * 60}
          y1={100 + Math.sin((i * Math.PI * 2) / 8) * 60}
          x2={100 + Math.cos(((i + 1) * Math.PI * 2) / 8) * 60}
          y2={100 + Math.sin(((i + 1) * Math.PI * 2) / 8) * 60}
          stroke="url(#neural-gradient)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0.2, 0.6, 0.2] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
      <motion.circle
        cx="100"
        cy="100"
        r="20"
        fill="none"
        stroke="url(#neural-gradient)"
        strokeWidth="2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.8, 0.3] }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
    </svg>
  );
}

function EnhancedSpeakingIndicator({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-cyan-400 via-purple-400 to-fuchsia-400 rounded-full"
          animate={isActive ? {
            height: [6, 16 + Math.sin(i * 0.5) * 12, 6],
            opacity: [0.6, 1, 0.6],
          } : { height: 6, opacity: 0.4 }}
          transition={{
            duration: 0.3 + Math.random() * 0.2,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            background: `linear-gradient(135deg, rgba(168,85,247,0.6), rgba(6,182,212,0.6))`,
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

function ThinkingBubble({ text, position }: { text: string; position: 'left' | 'right' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      className={cn(
        "absolute top-1/4 z-20 max-w-[140px]",
        position === 'left' ? 'left-4' : 'right-4'
      )}
    >
      <div className="relative">
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-purple-500/30 shadow-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-medium">Thinking</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">{text}</p>
        </div>
        <div className={cn(
          "absolute bottom-0 w-2 h-2 rounded-full bg-slate-800/90 border border-purple-500/30",
          position === 'left' ? '-right-3 translate-y-3' : '-left-3 translate-y-3'
        )} />
        <div className={cn(
          "absolute bottom-0 w-1.5 h-1.5 rounded-full bg-slate-800/80",
          position === 'left' ? '-right-5 translate-y-5' : '-left-5 translate-y-5'
        )} />
      </div>
    </motion.div>
  );
}

function PersonaInfoPanel({ persona, isLive }: { persona: AIPersona; isLive: boolean }) {
  const PersonaIcon = persona.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-xl rounded-xl border border-purple-500/30 p-3 max-w-[160px]"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", persona.gradient)}>
          <PersonaIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{persona.name}</p>
          <p className="text-[10px] text-slate-400 capitalize">{persona.style}</p>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-pink-400" />
          <span className="text-[10px] text-slate-300">Mood: {persona.mood}</span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {persona.expertise.slice(0, 2).map((exp, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20"
            >
              {exp}
            </span>
          ))}
        </div>
      </div>
      
      {isLive && (
        <motion.div
          className="mt-2 pt-2 border-t border-purple-500/20 flex items-center gap-1.5"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Brain className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] text-cyan-300">AI Active</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function EngagementMetrics({ viewerCount }: { viewerCount?: number }) {
  const [engagement, setEngagement] = useState(75);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setEngagement(prev => Math.min(100, Math.max(50, prev + (Math.random() * 10 - 5))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur-xl rounded-xl border border-cyan-500/30 p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-white">Engagement</span>
      </div>
      
      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden mb-1.5">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${engagement}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-[10px] text-slate-400 text-center">{Math.round(engagement)}% Active</p>
      
      {viewerCount !== undefined && (
        <div className="mt-2 pt-2 border-t border-cyan-500/20 text-center">
          <span className="text-lg font-bold text-white">{viewerCount}</span>
          <span className="text-[10px] text-slate-400 ml-1">viewers</span>
        </div>
      )}
    </motion.div>
  );
}

export function AIAvatarStream({ 
  hostName, 
  hostAvatar, 
  streamType, 
  isLive,
  currentMessage,
  viewerCount
}: AIAvatarStreamProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentThought, setCurrentThought] = useState('');
  const [thoughtPosition, setThoughtPosition] = useState<'left' | 'right'>('left');
  
  const style = avatarStyles[streamType] || avatarStyles.broadcast;
  const TypeIcon = style.icon;
  const persona = useMemo(() => getPersonaFromName(hostName), [hostName]);

  useEffect(() => {
    if (currentMessage) {
      setIsSpeaking(true);
      setIsThinking(false);
      const timeout = setTimeout(() => setIsSpeaking(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [currentMessage]);

  useEffect(() => {
    if (isLive && !currentMessage) {
      const interval = setInterval(() => {
        const rand = Math.random();
        if (rand > 0.7) {
          setIsSpeaking(true);
          setTimeout(() => setIsSpeaking(false), 2000 + Math.random() * 2000);
        } else if (rand > 0.4) {
          setIsThinking(true);
          setCurrentThought(thoughtBubbles[Math.floor(Math.random() * thoughtBubbles.length)]);
          setThoughtPosition(Math.random() > 0.5 ? 'left' : 'right');
          setTimeout(() => setIsThinking(false), 3000 + Math.random() * 2000);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive, currentMessage]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 flex items-center justify-center overflow-hidden">
      <FloatingParticles />
      <NeuralNetwork />
      
      <PersonaInfoPanel persona={persona} isLive={isLive} />
      <EngagementMetrics viewerCount={viewerCount} />
      
      <AnimatePresence>
        {isThinking && !isSpeaking && (
          <ThinkingBubble text={currentThought} position={thoughtPosition} />
        )}
      </AnimatePresence>
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          className="relative"
          animate={isLive ? { y: [0, -5, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            className={cn(
              "absolute -inset-6 rounded-full bg-gradient-to-br opacity-20 blur-2xl",
              style.gradient
            )}
            animate={isSpeaking ? { scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] } : { scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: isSpeaking ? 0.4 : 2, repeat: Infinity }}
          />
          
          <motion.div
            animate={isLive ? { rotate: 360 } : {}}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute -inset-2 rounded-full bg-gradient-to-br",
              style.gradient
            )}
            style={{ opacity: 0.6 }}
          >
            <div className="w-full h-full rounded-full bg-slate-900" style={{ margin: 2 }} />
          </motion.div>
          
          <div className={cn(
            "relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-2xl",
            style.gradient
          )}>
            {hostAvatar ? (
              <img src={hostAvatar} alt={hostName} className="w-full h-full object-cover" />
            ) : (
              <Bot className="w-14 h-14 sm:w-18 sm:h-18 text-white/90" />
            )}
            
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
              animate={isSpeaking ? { opacity: [0.3, 0.5, 0.3] } : { opacity: 0.3 }}
              transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0 }}
            />
            
            {isThinking && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-slate-900/30"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-8 h-8 text-cyan-400" />
                </motion.div>
              </motion.div>
            )}
          </div>

          {isLive && (
            <motion.div
              className="absolute -bottom-1 -right-1 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full p-2.5 shadow-lg shadow-cyan-500/30"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Brain className="w-4 h-4 text-white" />
            </motion.div>
          )}
          
          {isSpeaking && (
            <motion.div
              className="absolute -top-1 -left-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-2 shadow-lg shadow-purple-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <MessageCircle className="w-3.5 h-3.5 text-white" />
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">AI Host</span>
            <Sparkles className="w-3 h-3 text-purple-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-orbitron mb-2">{hostName}</h3>
          
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className={cn(
                "px-3 py-1.5 rounded-full bg-gradient-to-r flex items-center gap-2 shadow-lg",
                style.gradient
              )}
              animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
            >
              <TypeIcon className="w-4 h-4 text-white" />
              <span className="text-xs font-medium text-white capitalize">
                {streamType.replace('_', ' ')}
              </span>
            </motion.div>
          </div>
        </motion.div>

        <div className="mt-6 h-10">
          <AnimatePresence mode="wait">
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-500/20"
              >
                <Volume2 className="w-4 h-4 text-purple-400" />
                <EnhancedSpeakingIndicator isActive={isSpeaking} />
                <span className="text-xs text-purple-300 font-medium">Speaking</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {currentMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 max-w-sm px-6 py-4 bg-gradient-to-br from-slate-800/95 via-purple-900/30 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-purple-500/40 shadow-2xl shadow-purple-500/20"
            >
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white leading-relaxed">{currentMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLive && (
        <motion.div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-red-500/90 rounded-full px-4 py-2 shadow-lg shadow-red-500/30"
          animate={{ opacity: [1, 0.8, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="text-xs font-bold text-white tracking-wider">LIVE</span>
        </motion.div>
      )}

      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-500/30 shadow-lg">
        <Activity className="w-3 h-3 text-emerald-400" />
        <span className="text-xs text-slate-300 font-medium">AI Powered</span>
        <Sparkles className="w-3 h-3 text-purple-400" />
      </div>
    </div>
  );
}
