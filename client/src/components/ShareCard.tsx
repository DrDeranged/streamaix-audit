import { motion } from 'framer-motion';
import { Brain, Zap, Activity, TrendingUp, Sparkles, Radio } from 'lucide-react';

interface ShareCardProps {
  mode?: 'brand' | 'stats' | 'content';
  title?: string;
  subtitle?: string;
  stats?: {
    aiAgents?: number;
    predictions?: number;
    streamPoints?: number;
  };
  className?: string;
}

export function ShareCard({
  mode = 'brand',
  title,
  subtitle,
  stats,
  className = ''
}: ShareCardProps) {
  return (
    <div 
      className={`relative w-full aspect-[1200/630] overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 25%, #0a1628 50%, #0f0a1a 75%, #050510 100%)'
      }}
    >
      <NeuralNetworkStatic />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 z-10">
        <GlowingCore />
        
        <div className="relative z-20 text-center mt-2 sm:mt-3 md:mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative"
          >
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight whitespace-nowrap"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #a855f7 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.5))'
              }}
            >
              {title || 'StreamAiX'}
            </h1>
            
            <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3">
              <span className="h-px flex-1 max-w-12 sm:max-w-16 bg-gradient-to-r from-transparent to-purple-500/50" />
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="h-px flex-1 max-w-12 sm:max-w-16 bg-gradient-to-l from-transparent to-cyan-500/50" />
            </div>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mt-2 sm:mt-3 md:mt-4 font-medium tracking-wide px-2"
            style={{ textShadow: '0 0 20px rgba(6, 182, 212, 0.3)' }}
          >
            {subtitle || 'Stream the Noise. Capture the Signal.'}
          </motion.p>
          
          {mode === 'stats' && stats && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 mt-4 sm:mt-6 md:mt-8 flex-wrap"
            >
              {stats.aiAgents && (
                <StatPill icon={Brain} label="AI Agents" value={stats.aiAgents} color="purple" />
              )}
              {stats.predictions && (
                <StatPill icon={Activity} label="Markets" value={stats.predictions} color="cyan" />
              )}
              {stats.streamPoints && (
                <StatPill icon={Zap} label="STREAM" value={formatNumber(stats.streamPoints)} color="amber" />
              )}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 md:mt-8 flex-wrap"
          >
            <FeatureTag icon={Brain} label="100+ AI" />
            <FeatureTag icon={TrendingUp} label="Prediction" />
            <FeatureTag icon={Radio} label="Live" />
          </motion.div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent z-5" />
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/40 to-transparent z-5" />
    </div>
  );
}

function NeuralNetworkStatic() {
  const nodes = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    size: 4 + Math.random() * 8,
    color: Math.random() > 0.5 ? 'purple' : 'cyan',
    delay: Math.random() * 2
  }));
  
  const connections = nodes.slice(0, 15).map((node, i) => {
    const target = nodes[(i + 3 + Math.floor(Math.random() * 5)) % nodes.length];
    return { from: node, to: target, id: i };
  });
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.3)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {connections.map(conn => (
          <motion.line
            key={conn.id}
            x1={`${conn.from.x}%`}
            y1={`${conn.from.y}%`}
            x2={`${conn.to.x}%`}
            y2={`${conn.to.y}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </svg>
      
      {nodes.map(node => (
        <motion.div
          key={node.id}
          className="absolute rounded-full"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size,
            height: node.size,
            background: node.color === 'purple' 
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.9) 0%, rgba(168, 85, 247, 0.4) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(6, 182, 212, 0.9) 0%, rgba(6, 182, 212, 0.4) 50%, transparent 70%)',
            boxShadow: node.color === 'purple'
              ? '0 0 15px rgba(168, 85, 247, 0.6)'
              : '0 0 15px rgba(6, 182, 212, 0.6)'
          }}
          initial={{ scale: 0.8, opacity: 0.4 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.4, 0.9, 0.4]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: node.delay
          }}
        />
      ))}
    </div>
  );
}

function GlowingCore() {
  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-40 lg:h-40">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)'
        }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      
      <motion.div
        className="absolute inset-2 sm:inset-3 md:inset-4 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)'
        }}
        animate={{ scale: [1.1, 0.9, 1.1] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />
      
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div 
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-24 lg:h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.2)'
          }}
        >
          <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-12 lg:h-12 text-purple-400" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))' }} />
        </div>
      </motion.div>
      
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            background: i % 2 === 0 ? '#a855f7' : '#06b6d4',
            boxShadow: i % 2 === 0 
              ? '0 0 10px rgba(168, 85, 247, 0.8)'
              : '0 0 10px rgba(6, 182, 212, 0.8)',
            transform: `rotate(${angle}deg) translateX(30px) translateY(-50%)`
          }}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3
          }}
        />
      ))}
    </div>
  );
}

function StatPill({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: typeof Brain; 
  label: string; 
  value: number | string; 
  color: 'purple' | 'cyan' | 'amber';
}) {
  const colorMap = {
    purple: {
      bg: 'rgba(168, 85, 247, 0.15)',
      border: 'rgba(168, 85, 247, 0.4)',
      text: 'text-purple-400',
      glow: 'rgba(168, 85, 247, 0.3)'
    },
    cyan: {
      bg: 'rgba(6, 182, 212, 0.15)',
      border: 'rgba(6, 182, 212, 0.4)',
      text: 'text-cyan-400',
      glow: 'rgba(6, 182, 212, 0.3)'
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.4)',
      text: 'text-amber-400',
      glow: 'rgba(245, 158, 11, 0.3)'
    }
  };
  
  const colors = colorMap[color];
  
  return (
    <div 
      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 0 20px ${colors.glow}`
      }}
    >
      <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.text}`} />
      <div className="text-left">
        <div className={`text-xs sm:text-sm font-bold ${colors.text}`}>{value}</div>
        <div className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function FeatureTag({ icon: Icon, label }: { icon: typeof Brain; label: string }) {
  return (
    <div 
      className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs text-gray-300"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(5px)'
      }}
    >
      <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
      <span>{label}</span>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function ShareCardPreview() {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h2 className="text-xl font-bold text-white mb-6">Share Card Preview (1200x630)</h2>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <p className="text-gray-400 mb-2">Brand Mode (Default)</p>
          <ShareCard mode="brand" />
        </div>
        
        <div>
          <p className="text-gray-400 mb-2">Stats Mode</p>
          <ShareCard 
            mode="stats" 
            stats={{ aiAgents: 100, predictions: 1561, streamPoints: 2450000 }}
          />
        </div>
        
        <div>
          <p className="text-gray-400 mb-2">Content Mode (Custom Title)</p>
          <ShareCard 
            mode="content"
            title="Market Alert"
            subtitle="BTC breaking $100K - AI agents predict 78% bullish"
          />
        </div>
      </div>
    </div>
  );
}
