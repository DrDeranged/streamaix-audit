import { useState, memo, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Radio,
  Video,
  TrendingUp,
  Headphones,
  Target,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Sparkles,
  Zap,
  Bot,
  Calendar,
  Play,
  Home,
  Crown,
  Star,
  Flame,
  Eye,
  Trophy,
  Gift,
  Bell,
  Heart,
  Coins,
  Shield,
  Mic,
  Pause,
  Volume2,
  Grid2X2,
  X,
  Loader2,
  Hexagon,
  CircleDot,
  Gem,
  Cpu,
  Rocket,
  Wallet,
  BarChart3,
  Brain,
  Globe
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  StreamCategoryFilter, 
  MultiStreamView, 
  StreamScheduleCard 
} from '@/components/streaming/EnhancedStreamingFeatures';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  streamType: string;
  hostId: string;
  hostUsername?: string;
  hostHandle?: string;
  hostAvatar?: string;
  hostExpertise?: string;
  isKnowledgeAvatar?: boolean;
  isVerified?: boolean;
  status: string;
  currentViewers: number;
  totalViews?: number;
  peakViewers?: number;
  totalTipsReceived?: number;
  category?: string;
  tags?: string[];
  scheduledStart?: string;
  actualStart?: string;
  isAiHost?: boolean;
  isSubscriberOnly?: boolean;
  ticketPrice?: number;
}

interface PastStream {
  id: string;
  title: string;
  description?: string;
  streamType: string;
  hostId: string;
  hostUsername?: string;
  hostHandle?: string;
  hostAvatar?: string;
  hostExpertise?: string;
  isKnowledgeAvatar?: boolean;
  isVerified?: boolean;
  status: string;
  peakViewers?: number;
  category?: string;
  tags?: string[];
  actualStart?: string;
  actualEnd?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
}

interface TopStreamer {
  id: string;
  username: string;
  avatar?: string;
  totalStreams: number;
  totalViewers: number;
  isLive: boolean;
  streamId?: string;
  badges: string[];
}

const streamTypeConfig: Record<string, { icon: any; label: string; color: string; bgColor: string; gradient: string; borderColor: string }> = {
  broadcast: { 
    icon: Video, 
    label: 'Broadcast', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20',
    gradient: 'from-purple-500 to-fuchsia-500',
    borderColor: 'border-purple-500/40'
  },
  trading_room: { 
    icon: TrendingUp, 
    label: 'Trading Room', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20',
    gradient: 'from-emerald-500 to-cyan-500',
    borderColor: 'border-emerald-500/40'
  },
  audio_space: { 
    icon: Headphones, 
    label: 'Audio Space', 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/20',
    gradient: 'from-cyan-500 to-blue-500',
    borderColor: 'border-cyan-500/40'
  },
  live_bounty: { 
    icon: Target, 
    label: 'Live Bounty', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/20',
    gradient: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/40'
  },
};

const categories = ['all', 'crypto', 'trading', 'defi', 'nft', 'education', 'ama', 'news', 'analysis'];

// Brand icon mapping for Knowledge Avatars when profile images fail to load
// Uses official brand icons from react-icons/si where available, Lucide for others
const avatarBrandIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Hayden Adams': { icon: Hexagon, color: 'text-pink-400', bgColor: 'bg-pink-500/20' }, // Uniswap (pink hexagon)
  'Vitalik Buterin': { icon: SiEthereum, color: 'text-purple-400', bgColor: 'bg-purple-500/20' }, // Ethereum
  'Gavin Wood': { icon: SiPolkadot, color: 'text-pink-400', bgColor: 'bg-pink-500/20' }, // Polkadot
  'Anatoly Yakovenko': { icon: SiSolana, color: 'text-purple-400', bgColor: 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20' }, // Solana
  'Brian Armstrong': { icon: SiCoinbase, color: 'text-blue-400', bgColor: 'bg-blue-500/20' }, // Coinbase
  'Jesse Powell': { icon: Wallet, color: 'text-purple-400', bgColor: 'bg-purple-500/20' }, // Kraken (wallet icon)
  'Sam Altman': { icon: SiOpenai, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' }, // OpenAI
  'Elon Musk': { icon: SiX, color: 'text-white', bgColor: 'bg-slate-700' }, // X/Twitter
  'Stani Kulechov': { icon: Zap, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' }, // Aave (ghost/zap)
  'Arthur Hayes': { icon: BarChart3, color: 'text-red-400', bgColor: 'bg-red-500/20' }, // BitMEX (trading chart)
  'Andre Cronje': { icon: Rocket, color: 'text-blue-400', bgColor: 'bg-blue-500/20' }, // Yearn (innovation)
  'Charles Hoskinson': { icon: SiCardano, color: 'text-blue-400', bgColor: 'bg-blue-500/20' }, // Cardano
  'Justin Sun': { icon: Zap, color: 'text-red-500', bgColor: 'bg-red-500/20' }, // Tron (energy)
  'Marc Andreessen': { icon: Globe, color: 'text-orange-400', bgColor: 'bg-orange-500/20' }, // a16z
  'Chris Dixon': { icon: Globe, color: 'text-orange-400', bgColor: 'bg-orange-500/20' }, // a16z
  'Anthony Pompliano': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' }, // Bitcoin
  'Adam Back': { icon: SiBitcoin, color: 'text-amber-400', bgColor: 'bg-amber-500/20' }, // Bitcoin/Blockstream
  'Brad Garlinghouse': { icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500/20' }, // Ripple
  'Katie Haun': { icon: Shield, color: 'text-purple-400', bgColor: 'bg-purple-500/20' }, // Haun Ventures
  'Robert Leshner': { icon: BarChart3, color: 'text-green-400', bgColor: 'bg-green-500/20' }, // Compound
};

const getAvatarFallback = (username?: string) => {
  if (!username) return null;
  return avatarBrandIcons[username] || null;
};

const getDiceBearAvatar = (username?: string) => {
  if (!username) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
};

const formatViewers = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHrs > 0) return `${diffHrs}h ago`;
  return `${diffMins}m ago`;
};

const formatLiveTime = (dateStr?: string) => {
  if (!dateStr) return 'Just started';
  const startTime = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const FeaturedStreamCard = memo(function FeaturedStreamCard({ stream }: { stream: LiveStream }) {
  const [imageError, setImageError] = useState(false);
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast;
  const Icon = config.icon;
  const brandFallback = getAvatarFallback(stream.hostUsername);
  const BrandIcon = brandFallback?.icon;
  const showImage = stream.hostAvatar && !imageError;
  const showBrandIcon = !showImage && brandFallback;
  const showDiceBear = !showImage && !showBrandIcon;

  return (
    <Link href={`/stream/${stream.id}`}>
      <div className="group relative cursor-pointer overflow-hidden rounded-2xl aspect-[16/9] min-w-[320px] sm:min-w-[400px] lg:min-w-[500px] transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-slate-700/50 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-slate-900">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <Play className="w-10 h-10 text-white fill-white" />
          </div>
        </div>
        
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-red-500 rounded-full px-3 py-1.5 shadow-lg shadow-red-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Live</span>
          </div>
          <Badge className={cn(
            "text-xs px-2.5 py-1 font-medium",
            config.bgColor,
            config.color,
            "border-0 backdrop-blur-sm"
          )}>
            <Icon className="w-3.5 h-3.5 mr-1" />
            {config.label}
          </Badge>
          {stream.isAiHost && (
            <Badge className="bg-cyan-500/90 text-white text-xs px-2 py-1">
              <Bot className="w-3 h-3 mr-1" />
              AI Host
            </Badge>
          )}
          {stream.tags?.includes('alpha') && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-1 animate-pulse shadow-lg shadow-amber-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              ALPHA
            </Badge>
          )}
        </div>
        
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Eye className="w-3.5 h-3.5 text-red-400" />
            <span className="text-sm font-semibold text-white">{formatViewers(stream.currentViewers)}</span>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className={cn(
                "w-14 h-14 rounded-full ring-3 overflow-hidden ring-white/30 flex items-center justify-center",
                showBrandIcon ? brandFallback.bgColor : 'bg-slate-800'
              )}>
                {showImage && (
                  <img 
                    src={stream.hostAvatar} 
                    alt="" 
                    loading="lazy" 
                    className="w-full h-full rounded-full object-cover" 
                    onError={() => setImageError(true)}
                  />
                )}
                {showBrandIcon && BrandIcon && (
                  <BrandIcon className={cn("w-6 h-6", brandFallback.color)} />
                )}
                {showDiceBear && (
                  <img 
                    src={getDiceBearAvatar(stream.hostUsername)} 
                    alt="" 
                    className="w-full h-full rounded-full object-cover"
                  />
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-2 group-hover:text-purple-200 transition-colors leading-tight">
                {stream.title}
              </h3>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-300 font-medium">{stream.hostUsername || 'Anonymous'}</span>
                  {stream.isKnowledgeAvatar && (
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  {stream.hostHandle && (
                    <span className="text-xs text-slate-500">@{stream.hostHandle}</span>
                  )}
                </div>
                {stream.category && (
                  <Badge variant="outline" className="text-xs text-slate-400 border-slate-600 capitalize">
                    {stream.category}
                  </Badge>
                )}
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatLiveTime(stream.actualStart)}
                </span>
              </div>
              {stream.hostExpertise && (
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{stream.hostExpertise}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

const StreamCard = memo(function StreamCard({ 
  stream, 
  size = 'normal',
  selectionMode = false,
  isSelected = false,
  onSelect
}: { 
  stream: LiveStream; 
  size?: 'normal' | 'compact';
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (streamId: string) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast;
  const Icon = config.icon;
  const isLive = stream.status === 'live';
  const brandFallback = getAvatarFallback(stream.hostUsername);
  const BrandIcon = brandFallback?.icon;
  const showImage = stream.hostAvatar && !imageError;
  const showBrandIcon = !showImage && brandFallback;
  const showDiceBear = !showImage && !showBrandIcon;

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(stream.id);
    }
  };

  if (size === 'compact') {
    return (
      <Link href={`/stream/${stream.id}`}>
        <div 
          className="group relative flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer overflow-hidden"
          onClick={handleClick}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative w-16 h-12 rounded-lg bg-slate-800 overflow-hidden">
            {isLive && (
              <div className="absolute top-1 left-1 z-20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
              {stream.title}
            </h4>
            <p className="text-xs text-slate-400">{stream.hostUsername}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/60 backdrop-blur-sm rounded border border-cyan-500/20 relative z-10">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-cyan-300">{formatViewers(stream.currentViewers)}</span>
          </div>
        </div>
      </Link>
    );
  }

  const cardContent = (
    <div 
      className={cn(
        "group cursor-pointer relative rounded-2xl overflow-hidden",
        "bg-slate-900/40 backdrop-blur-xl",
        "border border-slate-700/50",
        "hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
        "transition-all duration-500",
        selectionMode && isSelected && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950"
      )} 
      data-testid={`stream-card-${stream.id}`}
      onClick={handleClick}
    >
      {/* Corner brackets for HUD effect */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-500/40 rounded-tl-lg z-20" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-500/40 rounded-tr-lg z-20" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-purple-500/40 rounded-bl-lg z-20" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-purple-500/40 rounded-br-lg z-20" />

      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:via-transparent group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none z-10" />
      
      {selectionMode && (
        <div className={cn(
          "absolute top-4 left-4 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all backdrop-blur-sm",
          isSelected 
            ? "bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/50" 
            : "bg-slate-900/80 border-slate-500 hover:border-cyan-400"
        )}>
          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
        </div>
      )}
      
      <Card className="overflow-hidden bg-transparent border-0 shadow-none">
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />
          
          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
              <Play className="w-8 h-8 text-cyan-300 fill-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
          </div>
          
          {/* Enhanced LIVE indicator with neon glow */}
          {isLive && (
            <div className="absolute top-3 left-3 z-20">
              <div className="relative flex items-center gap-2 bg-slate-950/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                </span>
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">Live</span>
              </div>
            </div>
          )}

          {stream.isKnowledgeAvatar && (
            <div className="absolute top-3 right-3 z-20">
              <Badge className="bg-slate-950/80 backdrop-blur-md text-cyan-300 text-[10px] px-2.5 py-1 font-bold border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Shield className="w-3 h-3 mr-1.5 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
                KA
              </Badge>
            </div>
          )}

          {stream.isAiHost && !stream.isKnowledgeAvatar && (
            <div className="absolute top-3 right-3 z-20">
              <Badge className="bg-slate-950/80 backdrop-blur-md text-purple-300 text-[10px] px-2.5 py-1 font-bold border border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                <Bot className="w-3 h-3 mr-1.5" />
                AI
              </Badge>
            </div>
          )}

          {stream.tags?.includes('alpha') && (
            <div className={cn("absolute top-3 z-20", (stream.isKnowledgeAvatar || stream.isAiHost) ? "right-16" : "right-3")}>
              <Badge className="bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] px-2.5 py-1 font-bold border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
                <Sparkles className="w-3 h-3 mr-1.5 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
                ALPHA
              </Badge>
            </div>
          )}

          {stream.isSubscriberOnly && (
            <div className="absolute top-3 right-3 z-20">
              <Badge className="bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] px-2.5 py-1 font-bold border border-amber-500/50">
                <Crown className="w-3 h-3 mr-1.5" />
                Subs
              </Badge>
            </div>
          )}

          {/* HUD-style viewer count */}
          <div className="absolute bottom-3 left-3 z-20">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-cyan-500/30">
              <Users className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
              <span className="text-sm font-mono font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                {formatViewers(stream.currentViewers)}
              </span>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80" />
        </div>

        <div className="p-4 relative">
          <div className="flex items-start gap-3">
            {/* Avatar with animated ring */}
            <div className="relative group/avatar">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-full opacity-0 group-hover:opacity-60 blur-sm transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />
              <div className={cn(
                "relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ring-2 overflow-hidden ring-cyan-500/30",
                showBrandIcon ? brandFallback.bgColor : 'bg-slate-800'
              )}>
                {showImage && (
                  <img 
                    src={stream.hostAvatar} 
                    alt="" 
                    loading="lazy" 
                    className="w-full h-full rounded-full object-cover" 
                    onError={() => setImageError(true)}
                  />
                )}
                {showBrandIcon && BrandIcon && (
                  <BrandIcon className={cn("w-5 h-5", brandFallback.color)} />
                )}
                {showDiceBear && (
                  <img 
                    src={getDiceBearAvatar(stream.hostUsername)} 
                    alt="" 
                    className="w-full h-full rounded-full object-cover"
                  />
                )}
              </div>
              {isLive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors leading-snug">
                {stream.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-slate-300 font-medium">
                  {stream.hostUsername || 'Anonymous'}
                </span>
                {stream.isKnowledgeAvatar && (
                  <Shield className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]" />
                )}
                {stream.hostHandle && (
                  <span className="text-xs text-slate-500">@{stream.hostHandle}</span>
                )}
              </div>
              {stream.hostExpertise && (
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{stream.hostExpertise}</p>
              )}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <Badge variant="outline" className={cn(
                  "text-[10px] capitalize font-medium px-2 py-0.5",
                  "bg-slate-800/60 backdrop-blur-sm border-slate-600/50",
                  config.color
                )}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
                {stream.category && (
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700/50 bg-slate-800/40 capitalize">
                    {stream.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  if (selectionMode) {
    return cardContent;
  }

  return (
    <Link href={`/stream/${stream.id}`}>
      {cardContent}
    </Link>
  );
});

const ScheduledStreamCard = memo(function ScheduledStreamCard({ stream }: { stream: LiveStream }) {
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast;
  const Icon = config.icon;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs < 0) return 'Starting soon';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffDays > 0) return `in ${diffDays}d`;
    if (diffHrs > 0) return `in ${diffHrs}h`;
    return `in ${diffMins}m`;
  };

  return (
    <Card className="p-4 bg-slate-900/60 border border-slate-700/50 hover:border-amber-500/40 transition-all group cursor-pointer" data-testid={`scheduled-stream-${stream.id}`}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2.5 rounded-xl bg-gradient-to-br relative overflow-hidden",
          config.gradient
        )}>
          <Icon className="w-5 h-5 text-white relative z-10" />
          <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
              {stream.title}
            </h3>
            <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px] shrink-0">
              {getTimeUntil(stream.scheduledStart)}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {stream.hostUsername || 'Anonymous'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-amber-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">{formatDate(stream.scheduledStart)}</span>
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-8 px-3">
          <Bell className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
});

const PastStreamCard = memo(function PastStreamCard({ stream }: { stream: PastStream }) {
  const [imageError, setImageError] = useState(false);
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast;
  const Icon = config.icon;
  const brandFallback = getAvatarFallback(stream.hostUsername);
  const BrandIcon = brandFallback?.icon;
  const showImage = stream.hostAvatar && !imageError;
  const showBrandIcon = !showImage && brandFallback;
  const showDiceBear = !showImage && !showBrandIcon;

  return (
    <Link href={`/replay/${stream.id}`}>
      <div className="group cursor-pointer min-w-[280px] sm:min-w-[320px] transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" data-testid={`past-stream-${stream.id}`}>
        <Card className="overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 hover:border-cyan-500/40 transition-all">
          <div className="relative aspect-video bg-slate-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-3 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 group-hover:bg-cyan-500/30 transition-colors">
                <Play className="w-8 h-8 text-cyan-300 fill-cyan-300" />
              </div>
            </div>
            
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-slate-950/80 backdrop-blur-md text-slate-300 text-[10px] px-2 py-0.5 border border-slate-700/50">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(stream.durationSeconds)}
              </Badge>
            </div>
            
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-slate-950/80 backdrop-blur-md text-slate-400 text-[10px] px-2 py-0.5 border border-slate-700/50">
                {formatTimeAgo(stream.actualEnd)}
              </Badge>
            </div>
            
            <div className="absolute top-2 left-2">
              <Badge className="bg-slate-950/80 backdrop-blur-md text-slate-300 text-[10px] px-2 py-0.5 border border-slate-600/50">
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
          </div>

          <div className="p-3">
            <div className="flex items-start gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-cyan-500/20 flex items-center justify-center",
                showBrandIcon ? brandFallback.bgColor : 'bg-slate-800'
              )}>
                {showImage && (
                  <img 
                    src={stream.hostAvatar} 
                    alt="" 
                    loading="lazy" 
                    className="w-full h-full object-cover" 
                    onError={() => setImageError(true)}
                  />
                )}
                {showBrandIcon && BrandIcon && (
                  <BrandIcon className={cn("w-4 h-4", brandFallback.color)} />
                )}
                {showDiceBear && (
                  <img 
                    src={getDiceBearAvatar(stream.hostUsername)} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                  {stream.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{stream.hostUsername || 'Anonymous'}</span>
                  {stream.peakViewers && (
                    <span className="text-xs text-slate-500">
                      <Users className="w-3 h-3 inline mr-0.5" />
                      {stream.peakViewers} peak
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Link>
  );
});

const TopStreamerBadge = memo(function TopStreamerBadge({ streamer, rank }: { streamer: TopStreamer; rank: number }) {
  const [imageError, setImageError] = useState(false);
  const brandFallback = getAvatarFallback(streamer.username);
  const BrandIcon = brandFallback?.icon;
  
  const getRankColor = () => {
    if (rank === 1) return 'ring-amber-400/60';
    if (rank === 2) return 'ring-slate-400/60';
    if (rank === 3) return 'ring-amber-600/60';
    return 'ring-cyan-500/30';
  };

  const getRankIcon = () => {
    if (rank === 1) return <Crown className="w-3 h-3 text-amber-400" />;
    if (rank === 2) return <Star className="w-3 h-3 text-slate-300" />;
    if (rank === 3) return <Trophy className="w-3 h-3 text-amber-600" />;
    return null;
  };

  const showImage = streamer.avatar && !imageError;
  const showBrandIcon = !showImage && brandFallback;
  const showDiceBear = !showImage && !showBrandIcon;

  return (
    <Link href={streamer.isLive && streamer.streamId ? `/stream/${streamer.streamId}` : `/profile/${streamer.id}`}>
      <div className="group flex flex-col items-center gap-1 min-w-[80px] cursor-pointer" data-testid={`top-streamer-${streamer.id}`}>
        <div className="relative">
          <div className={cn(
            "w-16 h-16 rounded-full ring-2 overflow-hidden flex items-center justify-center",
            getRankColor(),
            showBrandIcon ? brandFallback.bgColor : 'bg-slate-800'
          )}>
            {showImage && (
              <img 
                src={streamer.avatar} 
                alt="" 
                className="w-full h-full object-cover" 
                onError={() => setImageError(true)}
              />
            )}
            {showBrandIcon && BrandIcon && (
              <BrandIcon className={cn("w-7 h-7", brandFallback.color)} />
            )}
            {showDiceBear && (
              <img 
                src={getDiceBearAvatar(streamer.username)} 
                alt="" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {rank <= 3 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
              {getRankIcon()}
            </div>
          )}
        </div>
        {streamer.isLive && (
          <div className="bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase shadow-[0_0_10px_rgba(239,68,68,0.6)] -mt-2">
            Live
          </div>
        )}
        <div className="text-center">
          <p className="text-xs font-medium text-white group-hover:text-cyan-300 transition-colors line-clamp-1 max-w-[70px]">
            {streamer.username}
          </p>
          <p className="text-[10px] text-slate-500">{formatViewers(streamer.totalViewers)} views</p>
        </div>
      </div>
    </Link>
  );
});

const QuickStatCard = memo(function QuickStatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  trend?: string; 
  color: string;
}) {
  const getGlowColor = () => {
    if (color.includes('red')) return 'shadow-red-500/20 border-red-500/20';
    if (color.includes('purple')) return 'shadow-purple-500/20 border-purple-500/20';
    if (color.includes('amber')) return 'shadow-amber-500/20 border-amber-500/20';
    return 'shadow-slate-500/10 border-slate-600/20';
  };

  return (
    <div className={cn(
      "streaming-glass-panel flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]",
      getGlowColor()
    )}>
      <div className={cn(
        "p-3 rounded-xl relative overflow-hidden",
        color
      )}>
        <div className="absolute inset-0 bg-white/10" />
        <Icon className="w-5 h-5 text-white relative z-10" />
      </div>
      <div>
        <p className="text-xl font-bold streaming-counter">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
      {trend && (
        <div className="ml-auto text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-full">
          {trend}
        </div>
      )}
    </div>
  );
});

export default function StreamsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [multiStreamMode, setMultiStreamMode] = useState(false);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [multiStreamLayout, setMultiStreamLayout] = useState<'1x1' | '1x2' | '2x1' | '2x2'>('2x2');
  const [primaryStreamId, setPrimaryStreamId] = useState<string | undefined>();
  const { toast } = useToast();

  const handleToggleStreamSelection = (streamId: string) => {
    if (selectedStreams.includes(streamId)) {
      setSelectedStreams(selectedStreams.filter(id => id !== streamId));
    } else if (selectedStreams.length < 4) {
      setSelectedStreams([...selectedStreams, streamId]);
    }
  };

  const handleRemoveFromMultiStream = (streamId: string) => {
    setSelectedStreams(selectedStreams.filter(id => id !== streamId));
    if (primaryStreamId === streamId && selectedStreams.length > 1) {
      setPrimaryStreamId(selectedStreams.find(id => id !== streamId));
    }
  };

  const { data: liveStreamsData, isLoading } = useQuery<{ success: boolean; streams: LiveStream[] }>({
    queryKey: ['/api/streams/live'],
    refetchInterval: 30000,
  });

  const { data: scheduledStreamsData } = useQuery<{ success: boolean; streams: LiveStream[] }>({
    queryKey: ['/api/streams/scheduled'],
  });

  const { data: pastStreamsData } = useQuery<{ streams: PastStream[] }>({
    queryKey: ['/api/streams/ended', { limit: 10 }],
  });

  const liveStreams = liveStreamsData?.streams || [];
  const scheduledStreams = scheduledStreamsData?.streams || [];
  const pastStreams = pastStreamsData?.streams || [];

  const filteredStreams = useMemo(() => {
    return liveStreams.filter(stream => {
      if (selectedCategory !== 'all' && stream.category !== selectedCategory) return false;
      if (selectedType && stream.streamType !== selectedType) return false;
      if (searchQuery && !stream.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [liveStreams, selectedCategory, selectedType, searchQuery]);

  const featuredStreams = useMemo(() => {
    return [...filteredStreams]
      .sort((a, b) => (b.currentViewers || 0) - (a.currentViewers || 0))
      .slice(0, 5);
  }, [filteredStreams]);

  const aiHostedStreams = useMemo(() => filteredStreams.filter(s => s.isAiHost), [filteredStreams]);
  const userHostedStreams = useMemo(() => filteredStreams.filter(s => !s.isAiHost), [filteredStreams]);

  const topStreamers: TopStreamer[] = useMemo(() => {
    const streamersMap = new Map<string, TopStreamer>();
    liveStreams.forEach(stream => {
      if (stream.hostId && !streamersMap.has(stream.hostId)) {
        streamersMap.set(stream.hostId, {
          id: stream.hostId,
          username: stream.hostUsername || 'Anonymous',
          avatar: stream.hostAvatar,
          totalStreams: 1,
          totalViewers: stream.currentViewers || 0,
          isLive: stream.status === 'live',
          streamId: stream.id,
          badges: []
        });
      }
    });
    return Array.from(streamersMap.values())
      .sort((a, b) => b.totalViewers - a.totalViewers)
      .slice(0, 8);
  }, [liveStreams]);

  const totalViewers = useMemo(() => 
    liveStreams.reduce((sum, s) => sum + (s.currentViewers || 0), 0), 
    [liveStreams]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950 safe-area-inset relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="streaming-orbs">
        <div className="streaming-orb streaming-orb-1" />
        <div className="streaming-orb streaming-orb-2" />
        <div className="streaming-orb streaming-orb-3" />
      </div>
      
      {/* Hexagon pattern overlay */}
      <div className="absolute inset-0 streaming-hex-pattern opacity-30 pointer-events-none" />

      {/* Modern glassmorphism header */}
      <div className="streaming-glass-panel border-b border-purple-500/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-purple-500/20 h-10 w-10 streaming-edge-glow rounded-xl" data-testid="button-back-home">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              {/* Animated logo container with morphing border */}
              <div className="relative p-3 rounded-2xl streaming-morph-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl" />
                <Radio className="w-5 h-5 text-red-400 relative z-10" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white font-orbitron tracking-tight streaming-glow-text">StreamAiX Live</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Real-time broadcasts & trading rooms</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Stats badges with glass effect */}
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <div className="streaming-viewer-glow flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <span className="relative flex h-2 w-2 streaming-live-pulse rounded-full">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold streaming-counter">{liveStreams.length}</span>
                  <span className="text-xs text-slate-400">live</span>
                </div>
                <div className="streaming-cyber-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">{formatViewers(totalViewers)}</span>
                  <span className="text-xs text-slate-400">watching</span>
                </div>
              </div>
              <Badge className="sm:hidden streaming-viewer-glow text-red-400 text-xs font-semibold">
                {liveStreams.length} Live
              </Badge>
              <Link href="/replays">
                <Button variant="outline" size="sm" className="streaming-pill-glass border-purple-500/20 text-slate-300 hover:text-white h-9 gap-1.5 rounded-xl">
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Replays</span>
                </Button>
              </Link>
              <Link href="/go-live">
                <Button size="sm" className="streaming-neon-btn text-white h-9 gap-1.5 rounded-xl font-semibold">
                  <Zap className="w-4 h-4" />
                  <span>Go Live</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {featuredStreams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Trending Now</h2>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {featuredStreams.map((stream) => (
                  <FeaturedStreamCard key={stream.id} stream={stream} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        {topStreamers.length > 0 && (
          <section className="py-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Top Streamers</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-2">
                {topStreamers.map((streamer, idx) => (
                  <TopStreamerBadge key={streamer.id} streamer={streamer} rank={idx + 1} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams, hosts, topics..."
              className="pl-11 streaming-glass-panel text-white h-12 focus:border-purple-500/50 rounded-2xl placeholder:text-slate-500"
              data-testid="input-search-streams"
            />
          </div>
          <Button
            variant={multiStreamMode ? "default" : "outline"}
            onClick={() => {
              setMultiStreamMode(!multiStreamMode);
              if (!multiStreamMode) setSelectedStreams([]);
            }}
            className={cn(
              "h-12 gap-2 whitespace-nowrap rounded-2xl font-semibold",
              multiStreamMode 
                ? "streaming-neon-btn text-white"
                : "streaming-pill-glass border-purple-500/20 text-slate-300 hover:text-white"
            )}
            data-testid="button-multistream-toggle"
          >
            <Grid2X2 className="w-4 h-4" />
            Multi-Stream
            {multiStreamMode && selectedStreams.length > 0 && (
              <Badge className="bg-white/20 text-white text-xs ml-1 font-bold">
                {selectedStreams.length}/4
              </Badge>
            )}
          </Button>
        </div>

        {multiStreamMode && selectedStreams.length > 0 && (
          <div className="streaming-holo-border rounded-2xl overflow-hidden">
            <div className="streaming-glass-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Grid2X2 className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-white streaming-glow-text">Multi-Stream View</span>
                  <Badge className="streaming-cyber-badge text-cyan-400 border-0 font-semibold">
                    {selectedStreams.length} streams selected
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={multiStreamLayout}
                    onChange={(e) => setMultiStreamLayout(e.target.value as any)}
                    className="streaming-glass-panel rounded-xl px-3 py-2 text-sm text-white border-purple-500/20"
                  >
                    <option value="1x1">1x1</option>
                    <option value="1x2">1x2</option>
                    <option value="2x1">2x1</option>
                    <option value="2x2">2x2</option>
                  </select>
                  <Link href={`/multi-stream?streams=${selectedStreams.join(',')}&layout=${multiStreamLayout}`}>
                    <Button size="sm" className="streaming-neon-btn text-white rounded-xl font-semibold">
                      Watch Now
                    </Button>
                  </Link>
                </div>
              </div>
            <div className="h-[300px]">
              <MultiStreamView
                streams={selectedStreams.map(id => {
                  const stream = liveStreams.find(s => s.id === id);
                  return {
                    id,
                    title: stream?.title || 'Stream',
                    hostUsername: stream?.hostUsername || 'Unknown',
                    thumbnailUrl: stream?.hostAvatar
                  };
                })}
                layout={multiStreamLayout}
                primaryStreamId={primaryStreamId}
                onChangePrimary={setPrimaryStreamId}
                onRemoveStream={handleRemoveFromMultiStream}
              />
            </div>
          </div>
        </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="streaming-glass-panel p-1.5 w-full sm:w-auto grid grid-cols-3 sm:flex gap-1 rounded-2xl">
            <TabsTrigger value="discover" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-200 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/10 gap-1.5 rounded-xl transition-all">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-200 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/10 gap-1.5 rounded-xl transition-all">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-200 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/10 gap-1.5 rounded-xl transition-all">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Upcoming</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6 space-y-8">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={cn(
                      "streaming-pill-glass cursor-pointer transition-all capitalize whitespace-nowrap py-2.5 px-5 text-sm rounded-full font-medium",
                      selectedCategory === cat && "active"
                    )}
                    onClick={() => setSelectedCategory(cat)}
                    data-testid={`category-filter-${cat}`}
                  >
                    <span className={selectedCategory === cat ? "text-purple-200" : "text-slate-400"}>
                      {cat}
                    </span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {aiHostedStreams.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">AI-Hosted Streams</h2>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs ml-2">
                    {aiHostedStreams.length} live
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {aiHostedStreams.map((stream) => (
                    <StreamCard 
                      key={stream.id} 
                      stream={stream} 
                      selectionMode={multiStreamMode}
                      isSelected={selectedStreams.includes(stream.id)}
                      onSelect={handleToggleStreamSelection}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">
                  {userHostedStreams.length > 0 ? 'Creator Streams' : 'All Streams'}
                </h2>
                {userHostedStreams.length > 0 && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs ml-2">
                    {userHostedStreams.length} live
                  </Badge>
                )}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i} className="overflow-hidden bg-slate-900/50 border border-slate-700/30">
                      <div className="aspect-video bg-slate-800/50 animate-pulse" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-slate-800/50 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-slate-800/50 rounded w-1/2 animate-pulse" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredStreams.length === 0 ? (
                <div className="relative streaming-holo-border rounded-3xl overflow-hidden">
                  <div className="streaming-glass-panel streaming-neural-grid streaming-scan-line p-12 text-center rounded-3xl">
                    {/* Floating particles */}
                    <div className="streaming-particles">
                      <div className="streaming-particle" />
                      <div className="streaming-particle" />
                      <div className="streaming-particle" />
                      <div className="streaming-particle" />
                      <div className="streaming-particle" />
                      <div className="streaming-particle" />
                    </div>
                    
                    {/* Animated icon container */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 streaming-empty-pulse" />
                      <div className="absolute inset-2 rounded-full streaming-glass-panel flex items-center justify-center">
                        <Video className="w-10 h-10 text-purple-400" />
                      </div>
                      {/* Orbiting dot */}
                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3 streaming-glow-text">No broadcasts live right now</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                      Be the first to go live and share your alpha with the community. Start streaming to build your audience!
                    </p>
                    <Link href="/go-live">
                      <Button className="streaming-neon-btn text-white px-8 py-3 rounded-xl font-semibold text-base gap-2">
                        <Sparkles className="w-5 h-5" />
                        Be the First
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(userHostedStreams.length > 0 ? userHostedStreams : filteredStreams).map((stream) => (
                    <StreamCard 
                      key={stream.id} 
                      stream={stream} 
                      selectionMode={multiStreamMode}
                      isSelected={selectedStreams.includes(stream.id)}
                      onSelect={handleToggleStreamSelection}
                    />
                  ))}
                </div>
              )}
            </section>

            {pastStreams.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-white">Recent Replays</h2>
                    <Badge className="bg-slate-700/50 text-slate-400 border-0 text-xs ml-2">
                      {pastStreams.length}
                    </Badge>
                  </div>
                  <Link href="/replays">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1">
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-4">
                    {pastStreams.slice(0, 5).map((stream) => (
                      <PastStreamCard key={stream.id} stream={stream} />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </section>
            )}
          </TabsContent>

          <TabsContent value="browse" className="mt-6 space-y-6">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all whitespace-nowrap py-2 px-4",
                    !selectedType
                      ? "bg-purple-500/20 border-purple-500 text-purple-300"
                      : "border-slate-700 text-slate-400 hover:border-purple-500/40"
                  )}
                  onClick={() => setSelectedType(null)}
                >
                  All Types
                </Badge>
                {Object.entries(streamTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <Badge
                      key={type}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all whitespace-nowrap py-2 px-4 flex items-center gap-1.5",
                        selectedType === type
                          ? `${config.bgColor} border-transparent ${config.color}`
                          : "border-slate-700 text-slate-400 hover:border-purple-500/40"
                      )}
                      onClick={() => setSelectedType(type)}
                      data-testid={`type-filter-${type}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </Badge>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                {filteredStreams.length === 0 ? (
                  <div className="streaming-glass-panel streaming-neural-grid p-8 text-center rounded-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full streaming-glass-panel flex items-center justify-center">
                      <Radio className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 streaming-glow-text">No Streams Found</h3>
                    <p className="text-slate-400">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredStreams.map((stream) => (
                      <StreamCard 
                        key={stream.id} 
                        stream={stream} 
                        selectionMode={multiStreamMode}
                        isSelected={selectedStreams.includes(stream.id)}
                        onSelect={handleToggleStreamSelection}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="streaming-glass-panel p-4 rounded-2xl streaming-edge-glow">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="streaming-glow-text">Hot Right Now</span>
                  </h3>
                  <div className="space-y-2">
                    {filteredStreams.slice(0, 5).map((stream) => (
                      <StreamCard 
                        key={stream.id} 
                        stream={stream} 
                        size="compact"
                        selectionMode={multiStreamMode}
                        isSelected={selectedStreams.includes(stream.id)}
                        onSelect={handleToggleStreamSelection}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6 space-y-6">
            {scheduledStreams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledStreams.map((stream) => (
                  <ScheduledStreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            ) : (
              <div className="relative streaming-holo-border rounded-3xl overflow-hidden">
                <div className="streaming-glass-panel streaming-neural-grid p-12 text-center rounded-3xl">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 streaming-empty-pulse" />
                    <div className="absolute inset-2 rounded-full streaming-glass-panel flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 streaming-glow-text">No Upcoming Streams</h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    No streams are scheduled yet. Schedule your stream to let your audience know when to tune in!
                  </p>
                  <Link href="/go-live">
                    <Button className="streaming-neon-btn text-white px-8 py-3 rounded-xl font-semibold">
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule a Stream
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
          <QuickStatCard
            icon={Radio}
            label="Live Now"
            value={liveStreams.length}
            color="bg-red-500"
          />
          <QuickStatCard
            icon={Eye}
            label="Total Viewers"
            value={formatViewers(totalViewers)}
            color="bg-purple-500"
          />
          <QuickStatCard
            icon={Calendar}
            label="Upcoming"
            value={scheduledStreams.length}
            color="bg-amber-500"
          />
          <QuickStatCard
            icon={Play}
            label="Past 24h"
            value={pastStreams.length}
            color="bg-slate-600"
          />
        </div>
      </div>
    </div>
  );
}
