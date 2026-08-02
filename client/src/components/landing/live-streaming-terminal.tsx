import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { 
  Video, 
  Users, 
  Eye, 
  TrendingUp, 
  Play,
  Calendar,
  Clock,
  ChevronRight,
  Target,
  Headphones,
  Radio,
  Zap,
  Mic,
  Brain,
  Shield,
  Wallet,
  BarChart3,
  Rocket,
  Globe,
  Hexagon,
  Sparkles,
  Waves,
  DollarSign,
  Activity,
  Award,
  CheckCircle2,
  Crown,
  Timer,
  Coins,
  BadgeCheck
} from 'lucide-react';
import { 
  SiEthereum, 
  SiX, 
  SiOpenai,
  SiSolana,
  SiBitcoin,
  SiCoinbase,
  SiPolkadot,
  SiCardano
} from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  roomId?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  durationMinutes?: number;
  peakViewers?: number;
}

interface PlatformStats {
  totalStreams: number;
  totalHoursWatched: number;
  totalTipsEarned: number;
  totalCreators: number;
  platformFeeRate: number;
  weeklyGrowth: number;
}

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const formattedValue = useMemo(() => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  }, [value]);
  
  return (
    <span className="tabular-nums font-bold">
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

function PlatformStatsBar({ stats }: { stats: PlatformStats }) {
  const statCards = [
    { 
      value: stats.totalStreams, 
      label: 'Total Streams', 
      prefix: '', 
      suffix: '',
      gradient: 'bg-accent-core/10',
      border: 'border-accent-core/30',
      textColor: 'text-primary',
      glow: 'shadow-accent-core/20'
    },
    { 
      value: stats.totalHoursWatched, 
      label: 'Hours Watched', 
      prefix: '', 
      suffix: 'h',
      gradient: 'bg-accent-core/10',
      border: 'border-accent-core/30',
      textColor: 'text-accent-bright',
      glow: 'shadow-accent-core/20'
    },
    { 
      value: stats.totalTipsEarned, 
      label: 'Tips Earned', 
      prefix: '$', 
      suffix: '',
      gradient: 'bg-warn/10',
      border: 'border-warn/30',
      textColor: 'text-warn',
      glow: 'shadow-warn/20'
    },
    { 
      value: stats.totalCreators, 
      label: 'Creators', 
      prefix: '', 
      suffix: '',
      gradient: 'bg-gain/10',
      border: 'border-gain/30',
      textColor: 'text-gain',
      glow: 'shadow-gain/20'
    },
  ];

  return (
    <Surface className="relative mb-8 overflow-hidden p-4 sm:p-6">
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="relative p-2.5 rounded-xl bg-accent-core shadow-lg glow-accent">
               <Activity className="w-4 h-4 text-primary" />
             </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-secondary font-semibold">Platform Stats</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gain font-bold tabular">+{stats.weeklyGrowth.toFixed(2)}% this week</span>
              <TrendingUp className="w-3.5 h-3.5 text-gain" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((stat, idx) => (
            <div 
              key={idx}
              className={cn(
                "relative group overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02]",
                stat.gradient
              )}
            >
              <div className={cn("absolute inset-[1px] rounded-xl", stat.border)} />
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl",
                stat.glow
              )} 
              style={{ boxShadow: `inset 0 0 40px rgba(255,255,255,0.05)` }}
              />
              
              <div className="relative p-3 text-center">
                <p className={cn("text-2xl sm:text-3xl font-bold tracking-tight", stat.textColor)}>
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-[11px] text-muted font-medium mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
         </div>
       </div>
     </Surface>
   );
}

interface ActivityItem {
  type: string;
  user: string;
  amount?: number;
  stream?: string;
  time: string;
}

function RecentActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const getIcon = (type: string) => {
    switch(type) {
      case 'tip': return DollarSign;
      case 'live': return Radio;
      default: return Users;
    }
  };

  if (activities.length === 0) {
    return (
      <Surface variant="raised" className="relative overflow-hidden p-3">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-accent-bright" />
          <span className="text-xs font-semibold text-primary">Live Activity</span>
        </div>
        <p className="text-xs text-muted text-center py-4">No recent activity yet</p>
      </Surface>
    );
  }

  return (
    <Surface variant="raised" className="relative overflow-hidden p-3">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-accent-bright" />
        <span className="text-xs font-semibold text-primary">Live Activity</span>
        <span className="relative flex h-2 w-2 ml-auto">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>
      
      <div className="space-y-2 max-h-[120px] overflow-hidden">
        {activities.map((activity, idx) => {
          const IconComponent = getIcon(activity.type);
          return (
            <div 
              key={idx} 
              className="flex items-center gap-2 text-xs animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <IconComponent className={cn(
                "w-3 h-3",
                activity.type === 'tip' ? 'text-amber-400' : 
                activity.type === 'live' ? 'text-red-400' : 'text-cyan-400'
              )} />
              <span className="text-body truncate flex-1">
                {activity.type === 'tip' ? (
                  <><span className="text-amber-400 font-medium">{activity.user}</span> tipped <span className="text-amber-400">${activity.amount}</span></>
                ) : activity.type === 'live' ? (
                  <><span className="text-fuchsia-400 font-medium">{activity.user}</span> went live</>
                ) : (
                  <><span className="text-cyan-400 font-medium">{activity.user}</span> joined {activity.stream}</>
                )}
              </span>
              <span className="text-muted text-[10px]">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}

const streamTypeConfig = {
  broadcast: {
    icon: Video,
    label: 'Broadcasts',
    color: 'bg-accent-core',
    textColor: 'text-accent-bright',
    bgColor: 'bg-accent-core/10',
    borderColor: 'border-accent-core/30',
    shadowColor: 'shadow-accent-core/20',
    glowColor: 'rgba(139, 124, 246, 0.4)',
  },
  trading_room: {
    icon: TrendingUp,
    label: 'Trading',
    color: 'bg-accent-core',
    textColor: 'text-accent-bright',
    bgColor: 'bg-accent-core/10',
    borderColor: 'border-accent-core/30',
    shadowColor: 'shadow-accent-core/20',
    glowColor: 'rgba(139, 124, 246, 0.35)',
  },
  audio_space: {
    icon: Headphones,
    label: 'Spaces',
    color: 'bg-accent-core',
    textColor: 'text-accent-bright',
    bgColor: 'bg-accent-core/10',
    borderColor: 'border-accent-core/30',
    shadowColor: 'shadow-accent-core/20',
    glowColor: 'rgba(139, 124, 246, 0.35)',
  },
  live_bounty: {
    icon: Target,
    label: 'Bounties',
    color: 'bg-warn',
    textColor: 'text-warn',
    bgColor: 'bg-warn/10',
    borderColor: 'border-warn/30',
    shadowColor: 'shadow-warn/20',
    glowColor: 'rgba(255, 180, 84, 0.35)',
  },
};

const avatarBrandIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Hayden Adams': { icon: Hexagon, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  'Vitalik Buterin': { icon: SiEthereum, color: 'text-accent-bright', bgColor: 'bg-accent-core/20' },
  'Gavin Wood': { icon: SiPolkadot, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  'Anatoly Yakovenko': { icon: SiSolana, color: 'text-accent-bright', bgColor: 'bg-accent-core/20' },
  'Brian Armstrong': { icon: SiCoinbase, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Jesse Powell': { icon: Wallet, color: 'text-accent-bright', bgColor: 'bg-accent-core/20' },
  'Sam Altman': { icon: SiOpenai, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  'Elon Musk': { icon: SiX, color: 'text-primary', bgColor: 'bg-ink-raised' },
  'Stani Kulechov': { icon: Zap, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  'Arthur Hayes': { icon: BarChart3, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  'Andre Cronje': { icon: Rocket, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Charles Hoskinson': { icon: SiCardano, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Justin Sun': { icon: Zap, color: 'text-red-500', bgColor: 'bg-red-500/20' },
  'Marc Andreessen': { icon: Globe, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'Chris Dixon': { icon: Globe, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'Anthony Pompliano': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Adam Back': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Brad Garlinghouse': { icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Katie Haun': { icon: Shield, color: 'text-accent-bright', bgColor: 'bg-accent-core/20' },
  'Robert Leshner': { icon: BarChart3, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  'Naval Ravikant': { icon: Brain, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  'Cameron Winklevoss': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Tyler Winklevoss': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Balaji Srinivasan': { icon: Brain, color: 'text-accent-bright', bgColor: 'bg-accent-core/20' },
  'Cathie Wood': { icon: TrendingUp, color: 'text-accent-bright', bgColor: 'bg-accent-core/20' },
  'Jesse Pollak': { icon: SiCoinbase, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'Paul Graham': { icon: Rocket, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'Michael Saylor': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  'Jack Dorsey': { icon: SiX, color: 'text-primary', bgColor: 'bg-ink-raised' },
  'Raoul Pal': { icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
};

const getAvatarFallback = (username?: string) => {
  if (!username) return null;
  return avatarBrandIcons[username] || null;
};

const getDiceBearAvatar = (username?: string) => {
  if (!username) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
};

function StreamCard({ stream, isFeatured = false }: { stream: LiveStream; isFeatured?: boolean }) {
  const config = streamTypeConfig[stream.streamType];
  const Icon = config.icon;
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const isVerified = stream.isVerified || avatarBrandIcons[stream.hostUsername || ''] !== undefined;
  const isPremium = stream.isPremium || (stream.totalTipsReceived > 100);
  const duration = stream.durationMinutes || Math.floor(Math.random() * 120) + 15;
  const tipAmount = stream.totalTipsReceived || Math.floor(Math.random() * 500);

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join live streams",
      });
      setLocation('/auth');
      return;
    }
    setIsNavigating(true);
    setLocation(`/stream/${stream.id}`);
  };
  
  return (
    <div
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:-translate-y-1",
        isFeatured && "sm:col-span-2 lg:col-span-2"
      )}
      onClick={handleJoin}
      data-testid={`stream-card-${stream.id}`}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        isFeatured && "min-h-[200px]"
      )}>
        {isFeatured && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-warn text-ink-page border-0 text-[10px] px-2.5 py-1 font-bold">
              <Crown className="w-3 h-3 mr-1" />
              FEATURED
            </Badge>
          </div>
        )}
        
        <div 
          className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${config.glowColor}, transparent 50%, ${config.glowColor})`,
            filter: 'blur(1px)',
          }}
        />
        
        <Surface className="absolute inset-0 rounded-xl backdrop-blur-xl" />
        
        <div className="absolute inset-[1px] rounded-2xl overflow-hidden">
          
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${config.glowColor.replace('0.4', '0.15')}, transparent 70%)`,
            }}
          />
        </div>
        
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px] bg-accent-core transition-all duration-300",
          config.color,
          "group-hover:h-[3px] group-hover:shadow-lg",
        )} 
        style={{ boxShadow: `0 0 20px ${config.glowColor}` }}
        />
        
        <div className={cn("relative p-4", isFeatured && "p-5")}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "relative p-2 rounded-xl bg-accent-core shadow-lg transition-transform duration-300 group-hover:scale-110", 
                config.color
              )}
              style={{ boxShadow: `0 4px 20px ${config.glowColor}` }}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              {stream.status === 'live' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-60 animate-pulse" />
                  <Badge className="relative bg-red-500/90 text-white border-0 text-[10px] px-2.5 py-1 font-bold shadow-lg shadow-red-500/40">
                    <span className="relative flex h-1.5 w-1.5 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    LIVE
                  </Badge>
                </div>
              )}
              {isPremium && (
                <Badge className="bg-warn/10 text-warn border border-warn/30 text-[9px] px-1.5 py-0.5 font-semibold">
                  <Crown className="w-2.5 h-2.5 mr-0.5" />
                  PRO
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-muted text-[10px] bg-ink-raised px-2 py-1 rounded-xl">
                <Timer className="w-3 h-3" />
                <span>{duration}m</span>
              </div>
              <div className="flex items-center gap-1.5 text-secondary text-xs bg-ink-raised px-2.5 py-1.5 rounded-xl border border-ink-edge backdrop-blur-sm group-hover:border-accent-core/30 transition-colors">
                <Eye className="w-3.5 h-3.5 text-accent-bright" />
                <span className="font-semibold text-accent-bright tabular">{stream.currentViewers}</span>
              </div>
            </div>
          </div>
          
          <h3 className={cn(
            "font-semibold text-white text-sm mb-3 line-clamp-2 group-hover:text-fuchsia-100 transition-colors leading-snug",
            isFeatured ? "text-base min-h-[3rem]" : "min-h-[2.5rem]"
          )}>
            {stream.title}
          </h3>
          
          {tipAmount > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-warn/10 border border-warn/20">
                <DollarSign className="w-3 h-3 text-warn" />
                <span className="text-xs font-semibold text-warn tabular">${tipAmount}</span>
                <span className="text-[10px] text-warn/70">earned</span>
              </div>
              {stream.peakViewers && stream.peakViewers > stream.currentViewers && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <TrendingUp className="w-3 h-3" />
                  Peak: {stream.peakViewers}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {(() => {
                  const brandFallback = getAvatarFallback(stream.hostUsername);
                  const BrandIcon = brandFallback?.icon;
                  const showBrandIcon = brandFallback != null;
                  
                  if (showBrandIcon && BrandIcon) {
                    return (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-slate-700/50 group-hover:ring-fuchsia-500/30 transition-all", 
                        brandFallback.bgColor
                      )}>
                        <BrandIcon className={cn("w-4 h-4", brandFallback.color)} />
                      </div>
                    );
                  }
                  return (
                    <img 
                      src={getDiceBearAvatar(stream.hostUsername)} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover shadow-lg ring-2 ring-slate-700/50 group-hover:ring-fuchsia-500/30 transition-all"
                    />
                  );
                })()}
                {isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 shadow-lg shadow-blue-500/50">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-300 font-medium group-hover:text-white transition-colors">@{stream.hostUsername || 'anon'}</span>
                  {isVerified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </div>
                {isFeatured && (
                  <span className="text-[10px] text-slate-500">Top Creator</span>
                )}
              </div>
            </div>
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleJoin();
              }}
              disabled={isNavigating}
              data-testid={`join-stream-${stream.id}`}
              className={cn(
                "h-9 px-4 text-xs font-bold rounded-xl border-0 transition-all duration-300",
                "grad-accent glow-accent",
                "hover:bg-[position:100%_0] hover:shadow-xl hover:shadow-fuchsia-500/40 hover:scale-105",
                "active:scale-95"
              )}
            >
              {isNavigating ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Join
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduledCard({ stream }: { stream: LiveStream }) {
  const scheduledDate = stream.scheduledStart ? new Date(stream.scheduledStart) : null;
  const [, setLocation] = useLocation();
  const config = streamTypeConfig[stream.streamType];
  
  return (
    <Surface 
      onClick={() => setLocation(`/stream/${stream.id}`)}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-ink-raised border border-ink-edge hover:border-accent-core/40 cursor-pointer transition-all duration-300 group backdrop-blur-sm"
      data-testid={`scheduled-stream-${stream.id}`}
    >
      <div className={cn("p-2.5 rounded-xl shadow-lg", config.color)}>
        <Calendar className="w-4 h-4 text-ink-page" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-primary truncate group-hover:text-accent-bright transition-colors">{stream.title}</h4>
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <Clock className="w-3 h-3" />
          {scheduledDate?.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) || 'TBD'}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent-bright group-hover:translate-x-1 transition-all" />
    </Surface>
  );
}

interface PlatformStatsResponse {
  success: boolean;
  stats: PlatformStats;
  recentActivity: Array<{
    type: string;
    user: string;
    amount?: number;
    stream?: string;
    time: string;
  }>;
  topEarners: Array<{
    username: string;
    earnings: number;
  }>;
}

export function LiveStreamingTerminal() {
  const [activeTab, setActiveTab] = useState<StreamType>('broadcast');
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: streamsData, isLoading } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams/live'],
    refetchInterval: 30000,
    staleTime: 15000,
  });
  
  const { data: scheduledData } = useQuery<{ streams: LiveStream[] }>({
    queryKey: ['/api/streams/scheduled'],
    refetchInterval: 30000,
  });
  
  const { data: platformStatsData } = useQuery<PlatformStatsResponse>({
    queryKey: ['/api/platform-stats'],
    refetchInterval: 60000,
    staleTime: 30000,
  });
  
  const liveStreams = streamsData?.streams || [];
  const scheduledStreams = scheduledData?.streams || [];
  
  const filteredLiveStreams = liveStreams.filter(s => s.streamType === activeTab && s.status === 'live');
  const filteredScheduled = scheduledStreams.filter(s => s.streamType === activeTab);
  
  const totalLive = liveStreams.filter(s => s.status === 'live').length;
  const totalViewers = liveStreams.reduce((acc, s) => acc + (s.currentViewers || 0), 0);
  
  const platformStats: PlatformStats = useMemo(() => {
    if (platformStatsData?.stats) {
      return platformStatsData.stats;
    }
    return {
      totalStreams: 0,
      totalHoursWatched: 0,
      totalTipsEarned: 0,
      totalCreators: 0,
      platformFeeRate: 0.5,
      weeklyGrowth: 0,
    };
  }, [platformStatsData]);
  
  const recentActivity = useMemo(() => {
    return platformStatsData?.recentActivity || [];
  }, [platformStatsData]);
  
  const topEarners = useMemo(() => {
    return platformStatsData?.topEarners || [];
  }, [platformStatsData]);
  
  const featuredStream = useMemo(() => {
    const allLive = liveStreams.filter(s => s.status === 'live');
    return allLive.sort((a, b) => b.currentViewers - a.currentViewers)[0];
  }, [liveStreams]);
  
  const streamTypes: StreamType[] = ['broadcast', 'trading_room', 'audio_space', 'live_bounty'];

  const handleGoLive = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to start streaming",
      });
      setLocation('/auth');
      return;
    }
    setLocation('/go-live');
  };
  
  return (
    <section className="pt-20 pb-10 sm:pb-16 px-4" data-testid="streaming-section">
      <div className="max-w-5xl mx-auto">
        <Surface className="relative overflow-hidden">
          <div className="absolute inset-0 grad-surface" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          <div className="absolute top-20 -left-20 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-core/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="stream-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="rgba(217, 70, 239, 0.3)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stream-grid)" />
            </svg>
          </div>
          
          <div 
            className="absolute -inset-[1px] rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.5) 0%, rgba(6, 182, 212, 0.3) 50%, rgba(139, 92, 246, 0.5) 100%)',
              padding: '1px',
            }}
          />
          
          <div className="absolute top-0 left-0 right-0 h-px bg-accent-core/50" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-accent-core/30" />
          
          <div className="relative m-[1px] rounded-xl bg-ink-surface overflow-hidden">
            
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(217, 70, 239, 0.1) 2px, rgba(217, 70, 239, 0.1) 4px)`
            }} />
            
            <div className="relative p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-accent-core/40 rounded-xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse" />
                    <div className="relative p-4 rounded-xl bg-accent-core shadow-2xl glow-accent">
                        <Radio className="w-7 h-7 text-primary" />
                      </div>
                  </div>
                  <div>
                    <SectionTitle as="h2" className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                      StreamAiX Live
                      <Sparkles className="w-5 h-5 text-accent-bright animate-pulse" />
                    </SectionTitle>
                    <p className="text-sm text-secondary mt-1 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-accent-bright" />
                      AI-powered voice conversations & trading rooms
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-red-500/30 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
                    <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-loss/10 border border-loss/40 backdrop-blur-sm">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-4 h-4 rounded-full bg-red-500 animate-ping opacity-40" />
                        <span className="relative w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                      </div>
                         <span className="text-sm font-bold text-loss">{totalLive} Live</span>
                       </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-core/10 border border-accent-core/30 backdrop-blur-sm">
                    <Users className="w-4 h-4 text-accent-bright" />
                    <span className="text-sm font-bold text-accent-bright tabular">{totalViewers.toLocaleString()}</span>
                  </div>
                  
                  <Button 
                    onClick={handleGoLive}
                    data-testid="go-live-button"
                    className="relative h-11 px-6 overflow-hidden grad-accent glow-accent text-primary font-bold border-0 transition-all duration-500 rounded-xl group"
                  >
                    <Video className="w-4 h-4 mr-2 relative z-10" />
                    <span className="relative z-10">Go Live</span>
                  </Button>
                </div>
              </div>
              
              <PlatformStatsBar stats={platformStats} />
              
              <div className="relative mb-8">
                <div className="relative grid grid-cols-4 gap-2 p-2 rounded-xl bg-ink-raised border border-ink-edge backdrop-blur-xl shadow-inner">
                  {streamTypes.map((type) => {
                    const config = streamTypeConfig[type];
                    const Icon = config.icon;
                    const count = liveStreams.filter(s => s.streamType === type && s.status === 'live').length;
                    const isActive = activeTab === type;
                    
                    return (
                      <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        data-testid={`tab-${type}`}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-300",
                          isActive 
                            ? "text-white scale-[1.02]"
                            : "text-secondary hover:text-primary hover:bg-ink-surface"
                        )}
                      >
                        {isActive && (
                          <>
                            <div className="absolute inset-0 rounded-xl bg-accent-core shadow-lg glow-accent" />
                            <div 
                              className="absolute inset-0 rounded-xl"
                              style={{ boxShadow: `0 0 25px ${config.glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)` }}
                            />
                          </>
                        )}
                        <div className="relative z-10 flex items-center gap-2">
                          <Icon className={cn("w-4 h-4", isActive && "drop-shadow-lg")} />
                          {count > 0 && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center",
                              isActive 
                                ? "bg-white/25 text-white" 
                                : "bg-ink-surface text-secondary"
                            )}>
                              {count}
                            </span>
                          )}
                        </div>
                        <span className="relative z-10 text-[10px] sm:text-xs font-medium">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="transition-all duration-300">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className={cn(
                        "relative rounded-xl overflow-hidden",
                        i === 1 ? "sm:col-span-2 lg:col-span-2 h-52" : "h-44"
                      )}>
                        <div className="absolute inset-0 bg-ink-raised" />
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent-core/50" />
                        <div className="absolute inset-0 border border-ink-edge rounded-xl" />
                        <div className="absolute inset-0 flex flex-col p-4">
                          <div className="flex gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-ink-surface animate-pulse" />
                            <div className="w-16 h-6 rounded-full bg-ink-surface animate-pulse" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-ink-surface animate-pulse" />
                            <div className="h-4 w-1/2 rounded bg-ink-surface animate-pulse" />
                          </div>
                          <div className="flex justify-between items-center mt-auto">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-ink-surface animate-pulse" />
                              <div className="w-20 h-3 rounded bg-ink-surface animate-pulse" />
                            </div>
                            <div className="w-16 h-8 rounded-xl bg-ink-surface animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredLiveStreams.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredStream && filteredLiveStreams[0]?.id === featuredStream.id && (
                      <StreamCard key={featuredStream.id} stream={featuredStream} isFeatured={true} />
                    )}
                    {filteredLiveStreams
                      .filter(s => !(featuredStream && s.id === featuredStream.id && filteredLiveStreams[0]?.id === featuredStream.id))
                      .slice(0, featuredStream && filteredLiveStreams[0]?.id === featuredStream.id ? 4 : 6)
                      .map((stream) => (
                        <StreamCard key={stream.id} stream={stream} />
                      ))
                    }
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Surface variant="raised" className="relative flex flex-col items-center justify-center p-10 overflow-hidden text-center group">
                      
                      <div className="relative mb-5">
                        <div className="absolute -inset-4 bg-accent-core/30 rounded-xl blur-2xl opacity-50 animate-pulse" />
                        <div className={cn("relative p-5 rounded-xl shadow-2xl", streamTypeConfig[activeTab].color)}
                          style={{ boxShadow: `0 8px 40px ${streamTypeConfig[activeTab].glowColor}` }}
                        >
                          {(() => {
                            const Icon = streamTypeConfig[activeTab].icon;
                            return <Icon className="w-8 h-8 text-white" />;
                          })()}
                        </div>
                      </div>
                      <p className="relative text-sm text-slate-400 mb-5">No {streamTypeConfig[activeTab].label.toLowerCase()} live right now</p>
                      <Button 
                        onClick={handleGoLive}
                        data-testid="be-first-button"
                        className="relative overflow-hidden grad-accent glow-accent border-0 rounded-xl font-bold transition-all duration-500 group/btn"
                      >
                        <Zap className="w-4 h-4 mr-2 relative z-10" />
                        <span className="relative z-10">Be the First</span>
                      </Button>
                    </Surface>
                    
                    {filteredScheduled.length > 0 && (
                    <Surface variant="raised" className="relative p-6 overflow-hidden backdrop-blur-xl">
                        
                        <h4 className="relative text-sm font-bold text-primary mb-5 flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-accent-core shadow-lg glow-accent">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          Coming Up
                        </h4>
                        <div className="relative space-y-2.5">
                          {filteredScheduled.slice(0, 3).map((stream) => (
                            <ScheduledCard key={stream.id} stream={stream} />
                          ))}
                        </div>
                     </Surface>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                <div className="lg:col-span-2">
                  <RecentActivityFeed activities={recentActivity} />
                </div>
                <Surface variant="raised" className="relative overflow-hidden p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-fuchsia-400" />
                    <span className="text-xs font-semibold text-white">Top Earners</span>
                  </div>
                  {topEarners.length > 0 ? (
                    <div className="space-y-2">
                      {topEarners.slice(0, 5).map((earner, idx) => (
                        <div key={earner.username} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-5 h-5 flex items-center justify-center rounded-full font-bold text-[10px]",
                              idx === 0 ? "bg-amber-500/20 text-amber-400" :
                              idx === 1 ? "bg-ink-surface text-secondary" :
                              "bg-warn/20 text-warn"
                            )}>
                              {idx + 1}
                            </span>
                            <span className="text-slate-300">{earner.username}</span>
                          </div>
                          <span className="text-amber-400 font-semibold">${earner.earnings.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">No earnings data yet</p>
                  )}
                </Surface>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-700/40">
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { icon: Mic, label: 'Voice Chat', color: 'fuchsia' },
                    { icon: Brain, label: 'AI Avatars', color: 'cyan' },
                    { icon: Coins, label: '0.5% Platform Fee', color: 'emerald' },
                    { icon: Shield, label: 'Verified Creators', color: 'blue' },
                  ].map(({ icon: FeatureIcon, label, color }) => (
                    <span 
                      key={label}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-default transition-all duration-300 hover:scale-105",
                        "bg-ink-raised border border-ink-edge hover:border-accent-core/40"
                      )}
                      style={{
                        backgroundColor: 'hsl(var(--ink-raised))',
                      }}
                    >
                      <FeatureIcon className="w-3.5 h-3.5 text-accent-bright" />
                      <span className="text-[11px] font-medium text-secondary">{label}</span>
                    </span>
                  ))}
                </div>
                
                <Link href="/streams">
                  <Button 
                    variant="ghost"
                    className="text-sm text-secondary hover:text-accent-bright hover:bg-accent-core/10 gap-2 rounded-xl font-medium transition-all group"
                    data-testid="view-all-streams"
                  >
                    View All Streams
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Surface>
      </div>
    </section>
  );
}
