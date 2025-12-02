import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Activity, Mic, Radio, Brain, Zap, TrendingUp, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAvatarStreamProps {
  hostName: string;
  hostAvatar?: string;
  streamType: string;
  isLive: boolean;
  currentMessage?: string;
}

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

function SpeakingIndicator({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full"
          animate={isActive ? {
            height: [8, 20 + Math.random() * 16, 8],
          } : { height: 8 }}
          transition={{
            duration: 0.4,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-400/50"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, -40, -20],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

export function AIAvatarStream({ 
  hostName, 
  hostAvatar, 
  streamType, 
  isLive,
  currentMessage 
}: AIAvatarStreamProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const style = avatarStyles[streamType] || avatarStyles.broadcast;
  const TypeIcon = style.icon;

  useEffect(() => {
    if (currentMessage) {
      setIsSpeaking(true);
      const timeout = setTimeout(() => setIsSpeaking(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [currentMessage]);

  useEffect(() => {
    if (isLive && !currentMessage) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          setIsSpeaking(true);
          setTimeout(() => setIsSpeaking(false), 2000 + Math.random() * 2000);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive, currentMessage]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 flex items-center justify-center overflow-hidden">
      <FloatingParticles />
      <NeuralNetwork />
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          className="relative"
          animate={isLive ? { y: [0, -5, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            className={cn(
              "absolute -inset-4 rounded-full bg-gradient-to-br opacity-30 blur-xl",
              style.gradient
            )}
            animate={isSpeaking ? { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] } : {}}
            transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          />
          
          <motion.div
            animate={isLive ? { rotate: 360 } : {}}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute -inset-1 rounded-full bg-gradient-to-br opacity-60",
              style.gradient
            )}
            style={{ padding: '2px' }}
          >
            <div className="w-full h-full rounded-full bg-slate-900" />
          </motion.div>
          
          <div className={cn(
            "relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br flex items-center justify-center overflow-hidden border-2 border-white/10",
            style.gradient
          )}>
            {hostAvatar ? (
              <img src={hostAvatar} alt={hostName} className="w-full h-full object-cover" />
            ) : (
              <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-white/90" />
            )}
            
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
              animate={isSpeaking ? { opacity: [0, 0.3, 0] } : { opacity: 0 }}
              transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
            />
          </div>

          {isLive && (
            <motion.div
              className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Brain className="w-4 h-4 text-white" />
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
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-orbitron mb-2">{hostName}</h3>
          
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className={cn(
                "px-3 py-1.5 rounded-full bg-gradient-to-r flex items-center gap-2",
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

        <div className="mt-6 h-8">
          <AnimatePresence mode="wait">
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3"
              >
                <Volume2 className="w-4 h-4 text-purple-400" />
                <SpeakingIndicator isActive={isSpeaking} />
                <span className="text-xs text-purple-300">Speaking...</span>
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
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 max-w-md px-6 py-3 bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-purple-500/30"
            >
              <p className="text-sm text-white text-center">{currentMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLive && (
        <motion.div
          className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 rounded-full px-3 py-1.5"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-2 h-2 rounded-full bg-white" />
          <span className="text-xs font-bold text-white">LIVE</span>
        </motion.div>
      )}

      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-purple-500/30">
        <Activity className="w-3 h-3 text-emerald-400" />
        <span className="text-xs text-slate-300">AI Powered</span>
        <Sparkles className="w-3 h-3 text-purple-400" />
      </div>
    </div>
  );
}
