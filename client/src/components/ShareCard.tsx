import { motion } from 'framer-motion';
import { Brain, Zap, Activity, TrendingUp, Sparkles, Radio } from 'lucide-react';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';

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
    <Surface
      className={`relative w-full aspect-[1200/630] overflow-hidden bg-ink-page ${className}`}
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
            <SectionTitle
              as="h1"
              className="whitespace-nowrap text-3xl font-semibold tracking-tight text-primary sm:text-4xl md:text-5xl lg:text-7xl"
            >
              {title || 'StreamAiX'}
            </SectionTitle>
            
            <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3">
              <span className="h-px flex-1 max-w-12 bg-accent-core/40 sm:max-w-16" />
              <Sparkles className="h-3 w-3 text-accent-bright sm:h-4 sm:w-4" />
              <span className="h-px flex-1 max-w-12 bg-accent-core/40 sm:max-w-16" />
            </div>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-2 px-2 text-sm font-medium tracking-wide text-body sm:mt-3 sm:text-base md:mt-4 md:text-lg lg:text-xl"
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
      
      <div className="absolute bottom-0 left-0 right-0 z-5 h-24 bg-ink-page/60" />
      <div className="absolute left-0 right-0 top-0 z-5 h-16 bg-ink-page/40" />
    </Surface>
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
        {connections.map(conn => (
          <motion.line
            key={conn.id}
            x1={`${conn.from.x}%`}
            y1={`${conn.from.y}%`}
            x2={`${conn.to.x}%`}
            y2={`${conn.to.y}%`}
            stroke="#8B7CF6"
            strokeOpacity="0.35"
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
            background: node.color === 'purple' ? '#8B7CF6' : '#3DD68C',
             boxShadow: node.color === 'purple'
               ? '0 0 15px rgba(139, 124, 246, 0.45)'
               : '0 0 15px rgba(61, 214, 140, 0.4)'
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
           background: 'rgba(139, 124, 246, 0.12)'
        }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      
      <motion.div
        className="absolute inset-2 sm:inset-3 md:inset-4 rounded-full"
        style={{
           background: 'rgba(61, 214, 140, 0.12)'
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
             background: '#181F38',
            backdropFilter: 'blur(10px)',
             border: '1px solid rgba(139, 124, 246, 0.35)',
             boxShadow: '0 0 40px rgba(139, 124, 246, 0.3), inset 0 0 30px rgba(61, 214, 140, 0.16)'
          }}
        >
           <Brain className="w-5 h-5 text-accent-bright sm:h-6 sm:w-6 md:h-8 md:w-8 lg:h-12 lg:w-12" />
        </div>
      </motion.div>
      
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full"
          style={{
            left: '50%',
            top: '50%',
             background: i % 2 === 0 ? '#8B7CF6' : '#3DD68C',
             boxShadow: i % 2 === 0 
               ? '0 0 10px rgba(139, 124, 246, 0.7)'
               : '0 0 10px rgba(61, 214, 140, 0.65)',
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
       bg: 'rgba(139, 124, 246, 0.12)',
       border: '#8B7CF6',
       text: 'text-accent-bright',
       glow: 'rgba(139, 124, 246, 0.2)'
    },
    cyan: {
       bg: 'rgba(61, 214, 140, 0.1)',
       border: '#3DD68C',
       text: 'text-gain',
       glow: 'rgba(61, 214, 140, 0.16)'
    },
    amber: {
       bg: 'rgba(255, 180, 84, 0.1)',
       border: '#FFB454',
       text: 'text-warn',
       glow: 'rgba(255, 180, 84, 0.16)'
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
      <StatValue
        label={label}
        value={value}
        valueClassName={`text-xs sm:text-sm font-bold ${colors.text}`}
      />
    </div>
  );
}

function FeatureTag({ icon: Icon, label }: { icon: typeof Brain; label: string }) {
  return (
    <div 
      className="flex items-center gap-1 rounded-xl border border-ink-edge bg-ink-raised px-2 py-1 text-[10px] text-body sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs md:gap-2 md:px-3"
      style={{
        backdropFilter: 'blur(5px)'
      }}
    >
      <Icon className="h-2.5 w-2.5 text-accent-bright sm:h-3 sm:w-3" />
      <span>{label}</span>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
