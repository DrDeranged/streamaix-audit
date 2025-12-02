import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Video, 
  Mic, 
  Radio, 
  Target, 
  Users, 
  Eye, 
  TrendingUp, 
  MessageCircle,
  Coins,
  Play,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Signal,
  Bot,
  Crown,
  BarChart3,
  Headphones,
  Wifi,
  Activity,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StreamType = 'broadcast' | 'trading_room' | 'audio_space' | 'live_bounty';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  streamType: StreamType;
  hostId: string;
  hostUsername?: string;
  hostAvatar?: string;
  status: string;
  currentViewers: number;
  totalTipsReceived: number;
  category?: string;
  tags?: string[];
  linkedBountyId?: string;
  linkedMarketId?: string;
  scheduledStart?: string;
  actualStart?: string;
}

const streamTypeConfig = {
  broadcast: {
    icon: Video,
    label: 'Creator Broadcasts',
    shortLabel: 'Broadcasts',
    description: 'Live insights & AMAs',
    colorClass: 'cyan',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    borderColor: 'border-cyan-500/30',
    bgTint: 'bg-cyan-500/5',
    textColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
  },
  trading_room: {
    icon: TrendingUp,
    label: 'Trading Rooms',
    shortLabel: 'Trading',
    description: 'Watch live trades',
    colorClass: 'emerald',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    borderColor: 'border-emerald-500/30',
    bgTint: 'bg-emerald-500/5',
    textColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  audio_space: {
    icon: Headphones,
    label: 'Crypto Spaces',
    shortLabel: 'Spaces',
    description: 'Audio discussions',
    colorClass: 'violet',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    borderColor: 'border-violet-500/30',
    bgTint: 'bg-violet-500/5',
    textColor: 'text-violet-400',
    iconBg: 'bg-violet-500/20',
  },
  live_bounty: {
    icon: Target,
    label: 'Live Bounties',
    shortLabel: 'Bounties',
    description: 'Collaborative sessions',
    colorClass: 'amber',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    borderColor: 'border-amber-500/30',
    bgTint: 'bg-amber-500/5',
    textColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
  },
};

function PulsingLiveIndicator({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { dot: 'w-1.5 h-1.5', ring: 'w-3 h-3' },
    md: { dot: 'w-2 h-2', ring: 'w-4 h-4' },
    lg: { dot: 'w-2.5 h-2.5', ring: 'w-5 h-5' },
  };
  
  return (
    <div className="relative flex items-center justify-center">
      <div className={cn(
        sizes[size].ring,
        "absolute rounded-full bg-red-500/30 animate-ping"
      )} />
      <div className={cn(
        sizes[size].ring,
        "absolute rounded-full bg-red-500/20 animate-pulse"
      )} style={{ animationDelay: '0.5s' }} />
      <div className={cn(
        sizes[size].dot,
        "relative rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50"
      )} />
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 backdrop-blur-sm">
      <PulsingLiveIndicator size="sm" />
      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span>
    </div>
  );
}

function ViewerCount({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
      <Eye className="w-3 h-3 text-slate-400" />
      <span className="text-xs font-medium text-slate-300">{count.toLocaleString()}</span>
    </div>
  );
}

function StreamCard({ stream, index }: { stream: LiveStream; index: number }) {
  const config = streamTypeConfig[stream.streamType];
  const Icon = config.icon;
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative cursor-pointer"
    >
      <div 
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
        style={{
          background: `linear-gradient(135deg, ${config.glowColor}, transparent 60%)`,
        }}
      />
      
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-800/50",
        "border border-white/[0.08] group-hover:border-white/[0.15]",
        "backdrop-blur-xl",
        "transition-all duration-500"
      )}>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at top right, ${config.glowColor.replace('0.5', '0.15')}, transparent 60%)`,
          }}
        />
        
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className={cn(
                  "relative p-2.5 rounded-xl",
                  config.iconBg,
                  "border border-white/10"
                )}
                animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon className={cn("w-5 h-5", config.textColor)} />
                <div 
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-50 blur-md transition-opacity"
                  style={{ background: config.glowColor }}
                />
              </motion.div>
              {stream.status === 'live' && <LiveBadge />}
            </div>
            
            <ViewerCount count={stream.currentViewers} />
          </div>
          
          <h3 className="font-semibold text-white text-base mb-3 line-clamp-2 group-hover:text-white/90 transition-colors leading-snug">
            {stream.title}
          </h3>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
              "bg-gradient-to-br",
              config.gradientFrom,
              config.gradientTo,
              "shadow-lg"
            )}
            style={{ boxShadow: `0 4px 14px ${config.glowColor}` }}
            >
              {stream.hostUsername?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white/90">@{stream.hostUsername || 'anonymous'}</span>
              {stream.category && (
                <span className={cn("text-[10px] uppercase tracking-wider", config.textColor)}>
                  {stream.category}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              {stream.totalTipsReceived > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-300">
                    {stream.totalTipsReceived.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            
            <Button
              size="sm"
              className={cn(
                "h-8 px-4 text-xs font-semibold rounded-xl",
                "bg-gradient-to-r",
                config.gradientFrom,
                config.gradientTo,
                "hover:shadow-lg transition-all duration-300",
                "border-0"
              )}
              style={{ boxShadow: isHovered ? `0 8px 24px ${config.glowColor}` : 'none' }}
            >
              <Play className="w-3 h-3 mr-1.5 fill-current" />
              Join
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyStateCard({ type }: { type: StreamType }) {
  const config = streamTypeConfig[type];
  const Icon = config.icon;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-8 text-center",
        "bg-gradient-to-br from-slate-900/80 to-slate-800/40",
        "border border-white/[0.06]",
        "backdrop-blur-xl"
      )}
    >
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at center, ${config.glowColor.replace('0.5', '0.2')}, transparent 70%)`,
        }}
      />
      
      <motion.div 
        className={cn(
          "relative w-16 h-16 mx-auto mb-4 rounded-2xl",
          config.iconBg,
          "border border-white/10",
          "flex items-center justify-center"
        )}
        animate={{ 
          y: [0, -5, 0],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      >
        <Icon className={cn("w-8 h-8", config.textColor, "opacity-70")} />
      </motion.div>
      
      <p className="text-sm text-slate-400 mb-5">No {config.label.toLowerCase()} live right now</p>
      
      <Button
        className={cn(
          "bg-gradient-to-r",
          config.gradientFrom,
          config.gradientTo,
          "text-white font-semibold",
          "border-0 shadow-lg"
        )}
        style={{ boxShadow: `0 8px 24px ${config.glowColor.replace('0.5', '0.3')}` }}
      >
        <Video className="w-4 h-4 mr-2" />
        Start Streaming
      </Button>
    </motion.div>
  );
}

function ScheduledStreamItem({ stream, index }: { stream: LiveStream; index: number }) {
  const config = streamTypeConfig[stream.streamType];
  const Icon = config.icon;
  const scheduledDate = stream.scheduledStart ? new Date(stream.scheduledStart) : null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl",
        "bg-white/[0.02] hover:bg-white/[0.05]",
        "border border-white/[0.05] hover:border-white/[0.1]",
        "transition-all duration-300 cursor-pointer"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-xl",
        config.iconBg,
        "border border-white/10"
      )}>
        <Icon className={cn("w-4 h-4", config.textColor)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
          {stream.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-500">
            {scheduledDate ? scheduledDate.toLocaleString([], { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit' 
            }) : 'TBD'}
          </span>
        </div>
      </div>
      
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 w-8 p-0 rounded-lg hover:bg-white/10"
      >
        <Calendar className={cn("w-4 h-4", config.textColor)} />
      </Button>
    </motion.div>
  );
}

function TabButton({ 
  type, 
  isActive, 
  count, 
  onClick 
}: { 
  type: StreamType; 
  isActive: boolean; 
  count: number;
  onClick: () => void;
}) {
  const config = streamTypeConfig[type];
  const Icon = config.icon;
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2.5 px-4 py-3 rounded-xl",
        "transition-all duration-300",
        isActive 
          ? "bg-white/[0.08] border border-white/[0.12]" 
          : "bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.08]"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${config.glowColor.replace('0.5', '0.15')}, transparent 60%)`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      <div className={cn(
        "relative p-1.5 rounded-lg transition-colors duration-300",
        isActive ? config.iconBg : "bg-white/5"
      )}>
        <Icon className={cn(
          "w-4 h-4 transition-colors duration-300",
          isActive ? config.textColor : "text-slate-500"
        )} />
      </div>
      
      <div className="relative text-left">
        <div className={cn(
          "text-sm font-medium transition-colors duration-300",
          isActive ? "text-white" : "text-slate-400"
        )}>
          {config.shortLabel}
        </div>
        <div className="text-[10px] text-slate-500 hidden lg:block">
          {config.description}
        </div>
      </div>
      
      {count > 0 && (
        <motion.div 
          className={cn(
            "relative ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold",
            isActive 
              ? `bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white` 
              : "bg-white/10 text-slate-400"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          {count}
        </motion.div>
      )}
    </motion.button>
  );
}

function StatPill({ icon: Icon, value, label, color }: { 
  icon: any; 
  value: string | number; 
  label: string;
  color: 'red' | 'cyan' | 'amber';
}) {
  const colorClasses = {
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      iconColor: 'text-red-400',
      valueColor: 'text-red-300',
      glow: 'rgba(239, 68, 68, 0.3)',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      iconColor: 'text-cyan-400',
      valueColor: 'text-cyan-300',
      glow: 'rgba(6, 182, 212, 0.3)',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      iconColor: 'text-amber-400',
      valueColor: 'text-amber-300',
      glow: 'rgba(245, 158, 11, 0.3)',
    },
  };
  
  const classes = colorClasses[color];
  
  return (
    <motion.div 
      className={cn(
        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl",
        classes.bg,
        "border",
        classes.border,
        "backdrop-blur-sm"
      )}
      whileHover={{ scale: 1.05 }}
      style={{ boxShadow: `0 4px 20px ${classes.glow}` }}
    >
      <Icon className={cn("w-4 h-4", classes.iconColor)} />
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-sm font-bold", classes.valueColor)}>{value}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
    </motion.div>
  );
}

export function LiveStreamingTerminal() {
  const [activeTab, setActiveTab] = useState<StreamType>('broadcast');
  
  const { data: streamsData, isLoading } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams/live'],
    refetchInterval: 10000,
  });
  
  const { data: scheduledData } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams/scheduled'],
    refetchInterval: 30000,
  });
  
  const liveStreams = streamsData?.streams || [];
  const scheduledStreams = scheduledData?.streams || [];
  
  const filteredLiveStreams = liveStreams.filter(s => s.streamType === activeTab && s.status === 'live');
  const filteredScheduled = scheduledStreams.filter(s => s.streamType === activeTab);
  
  const totalLive = liveStreams.filter(s => s.status === 'live').length;
  const totalViewers = liveStreams.reduce((acc, s) => acc + (s.currentViewers || 0), 0);
  
  const streamTypes: StreamType[] = ['broadcast', 'trading_room', 'audio_space', 'live_bounty'];
  
  return (
    <section 
      id="live-terminal"
      className="py-20 px-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>
      
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className={cn(
            "relative overflow-hidden rounded-3xl",
            "bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/80",
            "border border-white/[0.08]",
            "backdrop-blur-2xl",
            "shadow-2xl shadow-black/20"
          )}>
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/[0.07] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-500/[0.07] via-transparent to-transparent" />
              
              <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            </div>
            
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            
            <div className="relative p-6 md:p-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <motion.div 
                    className="relative"
                    animate={{ 
                      boxShadow: [
                        '0 0 20px rgba(239, 68, 68, 0.3)',
                        '0 0 40px rgba(239, 68, 68, 0.5)',
                        '0 0 20px rgba(239, 68, 68, 0.3)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-xl">
                      <Signal className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <PulsingLiveIndicator size="lg" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold">
                      <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        StreamAiX
                      </span>{' '}
                      <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Live
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5" />
                      Real-time broadcasts, trading rooms & audio spaces
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <StatPill 
                    icon={Activity} 
                    value={totalLive} 
                    label="Live Now" 
                    color="red" 
                  />
                  <StatPill 
                    icon={Users} 
                    value={totalViewers.toLocaleString()} 
                    label="Watching" 
                    color="cyan" 
                  />
                  
                  <Link href="/go-live">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className={cn(
                          "h-11 px-6 rounded-xl font-semibold",
                          "bg-gradient-to-r from-red-500 via-rose-500 to-pink-600",
                          "hover:from-red-600 hover:via-rose-600 hover:to-pink-700",
                          "text-white border-0",
                          "shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
                          "transition-all duration-300"
                        )}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Go Live
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                {streamTypes.map((type) => {
                  const count = liveStreams.filter(s => s.streamType === type && s.status === 'live').length;
                  return (
                    <TabButton 
                      key={type}
                      type={type}
                      isActive={activeTab === type}
                      count={count}
                      onClick={() => setActiveTab(type)}
                    />
                  );
                })}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className="h-48 rounded-2xl bg-white/[0.02] animate-pulse border border-white/[0.05]"
                        />
                      ))}
                    </div>
                  ) : filteredLiveStreams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredLiveStreams.map((stream, index) => (
                        <StreamCard key={stream.id} stream={stream} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <EmptyStateCard type={activeTab} />
                      
                      {filteredScheduled.length > 0 && (
                        <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
                          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-violet-400" />
                            Upcoming Streams
                          </h4>
                          <div className="space-y-2">
                            {filteredScheduled.slice(0, 4).map((stream, index) => (
                              <ScheduledStreamItem key={stream.id} stream={stream} index={index} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              <motion.div 
                className="mt-8 pt-6 border-t border-white/[0.05]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2.5 text-slate-500 hover:text-slate-400 transition-colors">
                      <div className="p-1.5 rounded-lg bg-amber-500/10">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-xs">AI auto-summary on stream end</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-500 hover:text-slate-400 transition-colors">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="text-xs">Create markets from predictions</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-500 hover:text-slate-400 transition-colors">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10">
                        <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-xs">Tip with STREAM tokens</span>
                    </div>
                  </div>
                  
                  <Link href="/streams">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl"
                    >
                      View All Streams
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LiveStreamingTerminal;
