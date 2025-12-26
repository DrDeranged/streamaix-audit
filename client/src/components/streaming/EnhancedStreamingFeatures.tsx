import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Trophy, Crown, Gift, MessageCircle, Clock, Bell, 
  Scissors, Play, Grid, LayoutGrid, Pin, Zap, 
  TrendingUp, Award, Star, Timer, Coins, Eye,
  Calendar, ChevronRight, Volume2, VolumeX, X,
  ThumbsUp, Send, Sparkles, Bot, AlertCircle, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ViewerLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  activityScore: number;
  messagesCount: number;
  reactionsCount: number;
  tipsAmount: number;
}

interface StreamAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  progress: number;
  target: number;
  isCompleted: boolean;
  xpReward: number;
  streamReward: number;
}

interface ScheduledStream {
  id: string;
  title: string;
  hostUsername: string;
  hostAvatar?: string;
  scheduledStart: string;
  category?: string;
  tags?: string[];
  hasReminder: boolean;
  isAvatarHost: boolean;
}

interface ChatCommand {
  command: string;
  description: string;
  example: string;
}

interface PinnedMessage {
  id: string;
  username: string;
  content: string;
  pinnedAt: string;
  isAlpha: boolean;
}

interface WatchReward {
  minutesWatched: number;
  pointsEarned: number;
  xpEarned: number;
  nextRewardAt: number;
  bonusMultiplier: number;
}

interface ClipData {
  id: string;
  title: string;
  thumbnailUrl?: string;
  startTime: number;
  duration: number;
  views: number;
  creatorUsername: string;
}

const RARITY_COLORS = {
  common: 'from-slate-500 to-slate-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-cyan-600',
  epic: 'from-purple-500 to-fuchsia-600',
  legendary: 'from-amber-500 to-orange-600',
};

const RARITY_BORDERS = {
  common: 'border-slate-500/40',
  uncommon: 'border-green-500/40',
  rare: 'border-blue-500/40',
  epic: 'border-purple-500/40',
  legendary: 'border-amber-500/40',
};

export function ViewerLeaderboard({ streamId }: { streamId: string }) {
  const { data, isLoading } = useQuery<{ leaderboard: ViewerLeaderboardEntry[] }>({
    queryKey: ['/api/streams', streamId, 'leaderboard'],
    refetchInterval: 30000,
  });

  if (isLoading || !data?.leaderboard?.length) {
    return (
      <Card className="p-4 bg-slate-900/60 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Top Chatters</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-slate-900/60 border border-amber-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Top Chatters</h3>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
          Live
        </Badge>
      </div>
      
      <div className="space-y-2">
        {data.leaderboard.slice(0, 5).map((entry) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg",
              entry.rank === 1 && "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30",
              entry.rank === 2 && "bg-slate-700/30",
              entry.rank === 3 && "bg-slate-700/20",
              entry.rank > 3 && "bg-slate-800/30"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              entry.rank === 1 && "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
              entry.rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800",
              entry.rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
              entry.rank > 3 && "bg-slate-700 text-slate-400"
            )}>
              {entry.rank}
            </div>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
              {entry.avatar ? (
                <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                entry.username[0]?.toUpperCase()
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{entry.username}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>{entry.messagesCount} msgs</span>
                <span>•</span>
                <span>{entry.reactionsCount} reacts</span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-bold text-amber-400">{entry.activityScore}</p>
              <p className="text-[10px] text-slate-500">pts</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export function WatchTimeRewards({ streamId, userId }: { streamId: string; userId?: string }) {
  const [rewards, setRewards] = useState<WatchReward>({
    minutesWatched: 0,
    pointsEarned: 0,
    xpEarned: 0,
    nextRewardAt: 5,
    bonusMultiplier: 1.0,
  });

  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      setRewards(prev => {
        const newMinutes = prev.minutesWatched + 1;
        const rewardEvery = 5;
        const basePoints = 10;
        const baseXp = 5;
        
        if (newMinutes % rewardEvery === 0) {
          const bonus = prev.bonusMultiplier;
          return {
            minutesWatched: newMinutes,
            pointsEarned: prev.pointsEarned + Math.floor(basePoints * bonus),
            xpEarned: prev.xpEarned + Math.floor(baseXp * bonus),
            nextRewardAt: rewardEvery,
            bonusMultiplier: Math.min(bonus + 0.1, 2.0),
          };
        }
        
        return {
          ...prev,
          minutesWatched: newMinutes,
          nextRewardAt: rewardEvery - (newMinutes % rewardEvery),
        };
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [userId]);

  if (!userId) return null;

  const progressPercent = ((5 - rewards.nextRewardAt) / 5) * 100;

  return (
    <Card className="p-3 bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 border border-emerald-500/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20">
            <Timer className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-emerald-400">Watch Rewards</span>
        </div>
        {rewards.bonusMultiplier > 1 && (
          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
            {rewards.bonusMultiplier.toFixed(1)}x bonus
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-4 mb-2">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{rewards.minutesWatched}</p>
          <p className="text-[10px] text-slate-400">mins</p>
        </div>
        <div className="flex-1 h-px bg-slate-700" />
        <div className="text-center">
          <p className="text-lg font-bold text-amber-400">+{rewards.pointsEarned}</p>
          <p className="text-[10px] text-slate-400">STREAM</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-400">+{rewards.xpEarned}</p>
          <p className="text-[10px] text-slate-400">XP</p>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-400">Next reward in</span>
          <span className="text-emerald-400">{rewards.nextRewardAt} min</span>
        </div>
        <Progress value={progressPercent} className="h-1.5 bg-slate-700" />
      </div>
    </Card>
  );
}

export function StreamAchievementsPanel({ userId }: { userId?: string }) {
  const { data } = useQuery<{ achievements: StreamAchievement[] }>({
    queryKey: ['/api/stream-achievements', userId],
    enabled: !!userId,
  });

  const achievements = data?.achievements || [
    { id: '1', name: 'First Timer', description: 'Watch your first stream', icon: '👀', rarity: 'common' as const, progress: 1, target: 1, isCompleted: true, xpReward: 50, streamReward: 10 },
    { id: '2', name: 'Chatterbox', description: 'Send 100 messages', icon: '💬', rarity: 'uncommon' as const, progress: 45, target: 100, isCompleted: false, xpReward: 200, streamReward: 50 },
    { id: '3', name: 'Alpha Hunter', description: 'Watch 25 Alpha streams', icon: '🎯', rarity: 'rare' as const, progress: 8, target: 25, isCompleted: false, xpReward: 500, streamReward: 200 },
    { id: '4', name: 'Marathon Viewer', description: 'Watch 100 hours', icon: '⏱️', rarity: 'epic' as const, progress: 23, target: 100, isCompleted: false, xpReward: 1000, streamReward: 500 },
  ];

  return (
    <Card className="p-4 bg-slate-900/60 border border-purple-500/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-purple-500/20">
          <Award className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Stream Achievements</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            whileHover={{ scale: 1.02 }}
            className={cn(
              "p-3 rounded-xl border bg-gradient-to-br from-slate-800/50 to-slate-900/50",
              RARITY_BORDERS[achievement.rarity],
              achievement.isCompleted && "ring-1 ring-emerald-500/50"
            )}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xl">{achievement.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{achievement.name}</p>
                <Badge className={cn(
                  "text-[8px] px-1 py-0 bg-gradient-to-r",
                  RARITY_COLORS[achievement.rarity]
                )}>
                  {achievement.rarity}
                </Badge>
              </div>
              {achievement.isCompleted && (
                <div className="p-1 rounded-full bg-emerald-500/20">
                  <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 mb-2 line-clamp-1">{achievement.description}</p>
            
            {!achievement.isCompleted && (
              <div className="space-y-1">
                <Progress 
                  value={(achievement.progress / achievement.target) * 100} 
                  className="h-1 bg-slate-700"
                />
                <p className="text-[10px] text-slate-500 text-right">
                  {achievement.progress}/{achievement.target}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export function ChatCommandsHelp({ onClose }: { onClose: () => void }) {
  const commands: ChatCommand[] = [
    { command: '!price', description: 'Get real-time crypto price', example: '!price BTC' },
    { command: '!alpha', description: 'Get AI trading insights', example: '!alpha' },
    { command: '!market', description: 'Get prediction market info', example: '!market 123' },
    { command: '!portfolio', description: 'View your STREAM balance', example: '!portfolio' },
    { command: '!tip', description: 'Tip the streamer', example: '!tip 100' },
    { command: '!leaderboard', description: 'Show top chatters', example: '!leaderboard' },
    { command: '!predict', description: 'Make a prediction', example: '!predict BTC hits 100k' },
    { command: '!remind', description: 'Set stream reminder', example: '!remind' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-purple-500/30 p-3 shadow-xl z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-white">Chat Commands</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {commands.map((cmd) => (
          <div key={cmd.command} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <code className="text-xs font-bold text-cyan-400">{cmd.command}</code>
            <p className="text-[10px] text-slate-400 mt-0.5">{cmd.description}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">e.g. {cmd.example}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function PinnedMessagesBar({ 
  messages, 
  onUnpin 
}: { 
  messages: PinnedMessage[]; 
  onUnpin?: (id: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [messages.length]);

  if (!messages.length) return null;

  const current = messages[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-2.5 rounded-lg border flex items-center gap-2",
        current.isAlpha 
          ? "bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-500/40"
          : "bg-slate-800/60 border-purple-500/30"
      )}
    >
      <div className={cn(
        "p-1 rounded",
        current.isAlpha ? "bg-amber-500/20" : "bg-purple-500/20"
      )}>
        <Pin className={cn(
          "w-3.5 h-3.5",
          current.isAlpha ? "text-amber-400" : "text-purple-400"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold",
            current.isAlpha ? "text-amber-400" : "text-purple-400"
          )}>
            @{current.username}
          </span>
          {current.isAlpha && (
            <Badge className="bg-amber-500/20 text-amber-400 text-[8px] px-1 py-0">
              ALPHA
            </Badge>
          )}
        </div>
        <p className="text-sm text-white truncate">{current.content}</p>
      </div>
      
      {messages.length > 1 && (
        <div className="flex items-center gap-1">
          {messages.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === currentIndex ? "bg-purple-400" : "bg-slate-600"
              )}
            />
          ))}
        </div>
      )}
      
      {onUnpin && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onUnpin(current.id)}
          className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </motion.div>
  );
}

export function StreamScheduleCard({ stream, onRemind }: { stream: ScheduledStream; onRemind: (id: string) => void }) {
  const scheduledDate = new Date(stream.scheduledStart);
  const now = new Date();
  const diffMs = scheduledDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  let timeDisplay = '';
  if (diffDays > 0) {
    timeDisplay = `in ${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    timeDisplay = `in ${diffHours}h`;
  } else {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    timeDisplay = diffMins > 0 ? `in ${diffMins}m` : 'Starting soon';
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold text-white overflow-hidden">
            {stream.hostAvatar ? (
              <img src={stream.hostAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              stream.hostUsername[0]?.toUpperCase()
            )}
          </div>
          {stream.isAvatarHost && (
            <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-cyan-500">
              <Bot className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white line-clamp-1">{stream.title}</h4>
          <p className="text-xs text-slate-400">@{stream.hostUsername}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] px-1.5">
              <Clock className="w-2.5 h-2.5 mr-1" />
              {timeDisplay}
            </Badge>
            {stream.category && (
              <Badge variant="outline" className="border-slate-600 text-slate-400 text-[10px]">
                {stream.category}
              </Badge>
            )}
          </div>
        </div>
        
        <Button
          size="sm"
          variant={stream.hasReminder ? "outline" : "default"}
          onClick={() => onRemind(stream.id)}
          className={cn(
            "h-8",
            stream.hasReminder 
              ? "border-emerald-500/30 text-emerald-400" 
              : "bg-purple-600 hover:bg-purple-500"
          )}
          data-testid={`button-remind-${stream.id}`}
        >
          <Bell className={cn("w-3.5 h-3.5", stream.hasReminder && "fill-emerald-400")} />
        </Button>
      </div>
    </motion.div>
  );
}

export function MultiStreamView({ 
  streams, 
  layout = '2x2',
  primaryStreamId,
  onChangePrimary,
  onRemoveStream
}: { 
  streams: { id: string; title: string; hostUsername: string; thumbnailUrl?: string }[];
  layout: '1x1' | '1x2' | '2x1' | '2x2';
  primaryStreamId?: string;
  onChangePrimary: (id: string) => void;
  onRemoveStream: (id: string) => void;
}) {
  const gridClass = {
    '1x1': 'grid-cols-1',
    '1x2': 'grid-cols-2',
    '2x1': 'grid-cols-1 grid-rows-2',
    '2x2': 'grid-cols-2 grid-rows-2',
  }[layout];

  return (
    <div className={cn("grid gap-2 h-full", gridClass)}>
      {streams.map((stream) => (
        <div 
          key={stream.id}
          className={cn(
            "relative rounded-lg overflow-hidden bg-slate-900 border-2 transition-all",
            primaryStreamId === stream.id 
              ? "border-purple-500 ring-2 ring-purple-500/30" 
              : "border-slate-700 hover:border-slate-600"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mb-2">
                <Play className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-white truncate">{stream.title}</p>
              <p className="text-xs text-slate-400">@{stream.hostUsername}</p>
            </div>
          </div>
          
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <Badge className="bg-red-500/90 text-white text-[10px] px-1.5">LIVE</Badge>
            {primaryStreamId === stream.id && (
              <Badge className="bg-purple-500/90 text-white text-[10px] px-1.5">
                <Volume2 className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
          
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChangePrimary(stream.id)}
              className="h-6 w-6 p-0 bg-slate-900/60 hover:bg-slate-900/80"
              data-testid={`button-audio-${stream.id}`}
            >
              {primaryStreamId === stream.id ? (
                <Volume2 className="w-3 h-3 text-purple-400" />
              ) : (
                <VolumeX className="w-3 h-3 text-slate-400" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveStream(stream.id)}
              className="h-6 w-6 p-0 bg-slate-900/60 hover:bg-red-500/20"
              data-testid={`button-remove-${stream.id}`}
            >
              <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
            </Button>
          </div>
        </div>
      ))}
      
      {streams.length < 4 && (
        <Button
          variant="outline"
          className="h-full min-h-[100px] border-dashed border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-400"
          data-testid="button-add-stream"
        >
          <LayoutGrid className="w-5 h-5 mr-2" />
          Add Stream
        </Button>
      )}
    </div>
  );
}

export function CreateClipButton({ 
  streamId, 
  currentTime,
  onClipCreated 
}: { 
  streamId: string; 
  currentTime: number;
  onClipCreated?: (clip: ClipData) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [clipStart, setClipStart] = useState<number | null>(null);
  const { toast } = useToast();

  const handleStartClip = () => {
    setClipStart(currentTime);
    setIsCreating(true);
    toast({
      title: "Clip started",
      description: "Recording will capture the last 30 seconds when you stop",
    });
  };

  const handleEndClip = async () => {
    if (clipStart === null) return;
    
    const clipDuration = Math.min(currentTime - clipStart, 60);
    
    try {
      const response = await apiRequest(`/api/streams/${streamId}/clips`, {
        method: 'POST',
        body: JSON.stringify({
          startTime: Math.max(0, currentTime - 30),
          duration: Math.min(30, clipDuration),
          title: `Clip from ${new Date().toLocaleTimeString()}`,
        }),
      });
      
      toast({
        title: "Clip created!",
        description: "Your clip has been saved",
      });
      
      onClipCreated?.(response as ClipData);
    } catch (error) {
      toast({
        title: "Failed to create clip",
        variant: "destructive",
      });
    }
    
    setIsCreating(false);
    setClipStart(null);
  };

  return (
    <Button
      size="sm"
      variant={isCreating ? "destructive" : "outline"}
      onClick={isCreating ? handleEndClip : handleStartClip}
      className={cn(
        "h-8 text-xs",
        isCreating 
          ? "bg-red-500 hover:bg-red-400 animate-pulse" 
          : "border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
      )}
      data-testid="button-create-clip"
    >
      <Scissors className="w-3.5 h-3.5 mr-1.5" />
      {isCreating ? 'End Clip' : 'Clip'}
    </Button>
  );
}

export function VODList({ streamId }: { streamId: string }) {
  const { data } = useQuery<{ recordings: any[] }>({
    queryKey: ['/api/streams', streamId, 'recordings'],
  });

  if (!data?.recordings?.length) {
    return (
      <div className="text-center py-8">
        <Play className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No recordings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.recordings.map((recording) => (
        <div
          key={recording.id}
          className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-16 h-10 rounded bg-slate-700 flex items-center justify-center">
              <Play className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {recording.title || 'Stream Recording'}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>{recording.durationSeconds ? `${Math.floor(recording.durationSeconds / 60)}m` : '--'}</span>
                <span>•</span>
                <span>{recording.views || 0} views</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CoStreamPanel({ 
  sessionId,
  avatars 
}: { 
  sessionId: string;
  avatars: { id: string; name: string; avatar?: string; isActive: boolean; expertise: string }[];
}) {
  return (
    <Card className="p-4 bg-slate-900/60 border border-cyan-500/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-cyan-500/20">
          <Users className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Co-Stream Panel</h3>
        <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px]">
          {avatars.filter(a => a.isActive).length} Active
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            className={cn(
              "p-3 rounded-xl border transition-all",
              avatar.isActive 
                ? "bg-gradient-to-br from-cyan-900/40 to-purple-900/40 border-cyan-500/40 ring-1 ring-cyan-500/20"
                : "bg-slate-800/50 border-slate-700/40 opacity-60"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden",
                avatar.isActive 
                  ? "bg-gradient-to-br from-cyan-500 to-purple-500 ring-2 ring-cyan-400/50" 
                  : "bg-slate-700"
              )}>
                {avatar.avatar ? (
                  <img src={avatar.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  avatar.name[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{avatar.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{avatar.expertise}</p>
              </div>
            </div>
            
            {avatar.isActive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-400">Speaking</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TipPanel({ 
  streamId, 
  hostUsername,
  onClose,
  onTipSuccess
}: { 
  streamId: string;
  hostUsername: string;
  onClose: () => void;
  onTipSuccess?: (amount: number, message?: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const presetAmounts = [10, 50, 100, 500, 1000];

  const handleTip = async () => {
    const tipAmount = parseInt(amount);
    if (!tipAmount || tipAmount < 1) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`/api/streams/${streamId}/tip`, {
        method: 'POST',
        body: JSON.stringify({
          amount: tipAmount,
          message: message.trim() || undefined,
        }),
      });
      
      toast({
        title: "Tip sent!",
        description: `You tipped ${tipAmount} STREAM to @${hostUsername}`,
      });
      
      onTipSuccess?.(tipAmount, message.trim() || undefined);
      onClose();
    } catch (error) {
      toast({
        title: "Failed to send tip",
        description: "Please try again",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-sm p-6 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-amber-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Send a Tip</h3>
              <p className="text-xs text-slate-400">to @{hostUsername}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Amount (STREAM)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className={cn(
                    "h-9 px-3",
                    amount === preset.toString()
                      ? "border-amber-500 bg-amber-500/20 text-amber-400"
                      : "border-slate-600 text-slate-300"
                  )}
                >
                  {preset}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-800/50 border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Message (optional)</label>
            <Input
              placeholder="Add a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={100}
              className="bg-slate-800/50 border-slate-700"
            />
          </div>

          <Button
            onClick={handleTip}
            disabled={!amount || isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
            data-testid="button-confirm-tip"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Coins className="w-4 h-4" />
                </motion.div>
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Send {amount ? `${amount} STREAM` : 'Tip'}
              </span>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export function StreamCategoryFilter({ 
  selected, 
  onChange 
}: { 
  selected: string;
  onChange: (category: string) => void;
}) {
  const categories = [
    { id: 'all', label: 'All Streams', icon: '📺' },
    { id: 'alpha', label: 'Alpha Calls', icon: '🎯' },
    { id: 'trading', label: 'Trading', icon: '📈' },
    { id: 'defi', label: 'DeFi', icon: '🏦' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'ama', label: 'AMAs', icon: '🎤' },
    { id: 'nft', label: 'NFT', icon: '🖼️' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant="outline"
          size="sm"
          onClick={() => onChange(cat.id)}
          className={cn(
            "h-9 whitespace-nowrap",
            selected === cat.id
              ? "border-purple-500 bg-purple-500/20 text-purple-400"
              : "border-slate-700 text-slate-400 hover:border-slate-600"
          )}
          data-testid={`filter-${cat.id}`}
        >
          <span className="mr-1.5">{cat.icon}</span>
          {cat.label}
        </Button>
      ))}
    </div>
  );
}

interface StreamClip {
  id: string;
  title: string;
  creatorUsername: string;
  startTime: number;
  durationSeconds: number;
  views: number;
  likes: number;
  createdAt: string;
  thumbnailUrl?: string;
}

export function ClipsGallery({ streamId }: { streamId: string }) {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<{ clips: StreamClip[] }>({
    queryKey: ['/api/streams', streamId, 'clips'],
    enabled: !!streamId,
  });

  const likeMutation = useMutation({
    mutationFn: async (clipId: string) => {
      return apiRequest(`/api/clips/${clipId}/like`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/streams', streamId, 'clips'] });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-video rounded-lg bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data?.clips?.length) {
    return (
      <div className="text-center py-8">
        <Scissors className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-sm text-slate-400 mb-1">No clips yet</p>
        <p className="text-xs text-slate-500">Create a clip to capture the best moments!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {data.clips.map((clip) => (
        <motion.div
          key={clip.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group relative aspect-video rounded-xl overflow-hidden bg-slate-800/60 border border-slate-700/40 hover:border-purple-500/40 cursor-pointer transition-all"
          data-testid={`clip-card-${clip.id}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-sm font-medium text-white line-clamp-1 mb-1">
              {clip.title}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {clip.views}
              </span>
              <span>{clip.durationSeconds}s</span>
            </div>
          </div>

          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 bg-black/50 hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                likeMutation.mutate(clip.id);
              }}
              data-testid={`clip-like-${clip.id}`}
            >
              <ThumbsUp className="w-3.5 h-3.5 text-white" />
            </Button>
          </div>

          <Badge className="absolute top-2 left-2 bg-purple-500/80 text-white text-[9px]">
            by {clip.creatorUsername}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}

interface LiveStreamForRaid {
  id: string;
  title: string;
  hostUsername: string;
  hostAvatar?: string;
  currentViewers: number;
  category?: string;
}

export function RaidPanel({ 
  streamId, 
  isHost,
  currentViewers,
  onRaidComplete 
}: { 
  streamId: string;
  isHost: boolean;
  currentViewers: number;
  onRaidComplete?: () => void;
}) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isRaiding, setIsRaiding] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: liveStreams } = useQuery<{ streams: LiveStreamForRaid[] }>({
    queryKey: ['/api/streams/live'],
    enabled: isHost,
    refetchInterval: 30000,
  });

  const availableTargets = liveStreams?.streams?.filter(s => s.id !== streamId) || [];

  const raidMutation = useMutation({
    mutationFn: async (toStreamId: string) => {
      return apiRequest(`/api/streams/${streamId}/raid`, {
        method: 'POST',
        body: JSON.stringify({ toStreamId, viewersTransferred: currentViewers }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Raid initiated!",
        description: `Sending ${currentViewers} viewers to the target stream`,
      });
      onRaidComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Raid failed",
        description: error.message || "Could not start raid",
        variant: "destructive",
      });
      setIsRaiding(false);
      setCountdown(null);
    },
  });

  const startRaid = useCallback(() => {
    if (!selectedTarget) return;
    setIsRaiding(true);
    setCountdown(10);
  }, [selectedTarget]);

  const cancelRaid = useCallback(() => {
    setIsRaiding(false);
    setCountdown(null);
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      raidMutation.mutate(selectedTarget!);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, selectedTarget, raidMutation]);

  if (!isHost) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-orange-500/20">
          <Zap className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Raid Another Stream</h3>
          <p className="text-xs text-slate-400">Send your {currentViewers} viewers to support another creator</p>
        </div>
      </div>

      {isRaiding && countdown !== null ? (
        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"
          >
            <span className="text-3xl font-bold text-white">{countdown}</span>
          </motion.div>
          <p className="text-white font-medium mb-2">Raid starting in {countdown}s</p>
          <Button
            variant="outline"
            onClick={cancelRaid}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            data-testid="button-cancel-raid"
          >
            Cancel Raid
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {availableTargets.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No other live streams available</p>
            ) : (
              availableTargets.map((stream) => (
                <div
                  key={stream.id}
                  onClick={() => setSelectedTarget(stream.id)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedTarget === stream.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
                  )}
                  data-testid={`raid-target-${stream.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {stream.hostAvatar ? (
                        <img src={stream.hostAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        stream.hostUsername?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{stream.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>@{stream.hostUsername}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {stream.currentViewers}
                        </span>
                      </div>
                    </div>
                    {selectedTarget === stream.id && (
                      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <Button
            onClick={startRaid}
            disabled={!selectedTarget || availableTargets.length === 0}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:opacity-50"
            data-testid="button-start-raid"
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Raid ({currentViewers} viewers)
          </Button>
        </>
      )}
    </Card>
  );
}

interface ChannelPointsReward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  isEnabled: boolean;
  usageCount: number;
  cooldownMinutes?: number;
}

export function ChannelPointsPanel({ 
  streamId,
  userPoints = 0,
  isHost = false
}: { 
  streamId: string;
  userPoints?: number;
  isHost?: boolean;
}) {
  const { toast } = useToast();
  
  const defaultRewards: ChannelPointsReward[] = [
    { id: '1', name: 'Highlight My Message', description: 'Make your chat message stand out', cost: 100, icon: '✨', isEnabled: true, usageCount: 42 },
    { id: '2', name: 'Request Song', description: 'Add a song to the queue', cost: 500, icon: '🎵', isEnabled: true, usageCount: 18, cooldownMinutes: 5 },
    { id: '3', name: 'VIP Badge (1 stream)', description: 'Get a VIP badge for this stream', cost: 1000, icon: '👑', isEnabled: true, usageCount: 8 },
    { id: '4', name: 'Choose Next Topic', description: 'Pick what the streamer talks about next', cost: 2500, icon: '🎯', isEnabled: true, usageCount: 3, cooldownMinutes: 30 },
    { id: '5', name: 'Spin the Wheel', description: 'Spin for random prizes', cost: 750, icon: '🎰', isEnabled: true, usageCount: 25, cooldownMinutes: 10 },
  ];

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      return apiRequest(`/api/streams/${streamId}/channel-points/redeem`, {
        method: 'POST',
        body: JSON.stringify({ rewardId }),
      });
    },
    onSuccess: (_, rewardId) => {
      const reward = defaultRewards.find(r => r.id === rewardId);
      toast({
        title: "Reward redeemed!",
        description: `You claimed: ${reward?.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Not enough points",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="p-4 bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Channel Points</h3>
            <p className="text-xs text-slate-400">Earn by watching & chatting</p>
          </div>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm px-3">
          <Coins className="w-3.5 h-3.5 mr-1" />
          {userPoints.toLocaleString()}
        </Badge>
      </div>

      <div className="space-y-2">
        {defaultRewards.map((reward) => (
          <div
            key={reward.id}
            className={cn(
              "p-3 rounded-lg border transition-all",
              userPoints >= reward.cost
                ? "border-amber-500/30 bg-slate-800/50 hover:border-amber-500/50 cursor-pointer"
                : "border-slate-700/30 bg-slate-800/30 opacity-60"
            )}
            onClick={() => userPoints >= reward.cost && redeemMutation.mutate(reward.id)}
            data-testid={`reward-${reward.id}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{reward.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{reward.name}</p>
                <p className="text-xs text-slate-400 truncate">{reward.description}</p>
              </div>
              <Badge className={cn(
                "text-xs",
                userPoints >= reward.cost
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-slate-700/50 text-slate-400"
              )}>
                {reward.cost}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Earn rate</span>
          <span className="text-amber-400">+10 points/min watching</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-slate-400">Chat bonus</span>
          <span className="text-green-400">+5 points/message</span>
        </div>
      </div>
    </Card>
  );
}

export function ChatModerationPanel({ 
  streamId,
  isHost,
  onModeChange
}: { 
  streamId: string;
  isHost: boolean;
  onModeChange?: (mode: string) => void;
}) {
  const [slowModeSeconds, setSlowModeSeconds] = useState(0);
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [followerOnly, setFollowerOnly] = useState(false);
  const [emoteOnly, setEmoteOnly] = useState(false);
  const { toast } = useToast();

  const updateModeMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest(`/api/streams/${streamId}/moderation`, {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    },
    onSuccess: () => {
      toast({ title: "Chat settings updated" });
    },
  });

  if (!isHost) return null;

  return (
    <Card className="p-4 bg-slate-900/60 border border-slate-700/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="font-semibold text-white">Chat Moderation</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
          <div>
            <p className="text-sm font-medium text-white">Slow Mode</p>
            <p className="text-xs text-slate-400">Limit how often users can chat</p>
          </div>
          <select
            value={slowModeSeconds}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setSlowModeSeconds(val);
              updateModeMutation.mutate({ slowModeSeconds: val });
            }}
            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
            data-testid="select-slow-mode"
          >
            <option value={0}>Off</option>
            <option value={3}>3s</option>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
          <div>
            <p className="text-sm font-medium text-white">Subscriber Only</p>
            <p className="text-xs text-slate-400">Only subscribers can chat</p>
          </div>
          <Button
            size="sm"
            variant={subscriberOnly ? "default" : "outline"}
            onClick={() => {
              setSubscriberOnly(!subscriberOnly);
              updateModeMutation.mutate({ subscriberOnly: !subscriberOnly });
            }}
            className={subscriberOnly ? "bg-purple-500" : "border-slate-600"}
            data-testid="toggle-subscriber-only"
          >
            {subscriberOnly ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
          <div>
            <p className="text-sm font-medium text-white">Follower Only</p>
            <p className="text-xs text-slate-400">Only followers can chat</p>
          </div>
          <Button
            size="sm"
            variant={followerOnly ? "default" : "outline"}
            onClick={() => {
              setFollowerOnly(!followerOnly);
              updateModeMutation.mutate({ followerOnly: !followerOnly });
            }}
            className={followerOnly ? "bg-green-500" : "border-slate-600"}
            data-testid="toggle-follower-only"
          >
            {followerOnly ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
          <div>
            <p className="text-sm font-medium text-white">Emote Only</p>
            <p className="text-xs text-slate-400">Only emotes allowed in chat</p>
          </div>
          <Button
            size="sm"
            variant={emoteOnly ? "default" : "outline"}
            onClick={() => {
              setEmoteOnly(!emoteOnly);
              updateModeMutation.mutate({ emoteOnly: !emoteOnly });
            }}
            className={emoteOnly ? "bg-amber-500" : "border-slate-600"}
            data-testid="toggle-emote-only"
          >
            {emoteOnly ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/40">
        <p className="text-xs font-medium text-slate-300 mb-2">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
            data-testid="button-clear-chat"
          >
            Clear Chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            data-testid="button-view-banned"
          >
            Banned Users
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            data-testid="button-mod-log"
          >
            Mod Log
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function GiftSubscriptionPanel({
  streamId,
  streamerId,
  streamerUsername
}: {
  streamId: string;
  streamerId: string;
  streamerUsername: string;
}) {
  const [giftCount, setGiftCount] = useState(1);
  const [isGifting, setIsGifting] = useState(false);
  const { toast } = useToast();

  const giftMutation = useMutation({
    mutationFn: async (count: number) => {
      return apiRequest(`/api/streams/${streamId}/gift-subs`, {
        method: 'POST',
        body: JSON.stringify({ count, targetUserId: null }), // null = random
      });
    },
    onSuccess: (_, count) => {
      toast({
        title: "Subscriptions gifted!",
        description: `You gifted ${count} sub${count > 1 ? 's' : ''} to the community!`,
      });
      setIsGifting(false);
    },
    onError: () => {
      toast({
        title: "Gift failed",
        variant: "destructive",
      });
      setIsGifting(false);
    },
  });

  const tierPrices = [
    { count: 1, price: 100, label: '1 Gift' },
    { count: 5, price: 450, label: '5 Gifts', discount: '10% off' },
    { count: 10, price: 800, label: '10 Gifts', discount: '20% off' },
    { count: 25, price: 1750, label: '25 Gifts', discount: '30% off' },
  ];

  return (
    <Card className="p-4 bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-pink-500/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-pink-500/20">
          <Gift className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Gift Subscriptions</h3>
          <p className="text-xs text-slate-400">Support @{streamerUsername} & the community</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {tierPrices.map((tier) => (
          <div
            key={tier.count}
            onClick={() => setGiftCount(tier.count)}
            className={cn(
              "p-3 rounded-lg border text-center cursor-pointer transition-all",
              giftCount === tier.count
                ? "border-pink-500 bg-pink-500/10"
                : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"
            )}
            data-testid={`gift-tier-${tier.count}`}
          >
            <p className="text-lg font-bold text-white">{tier.label}</p>
            <p className="text-sm text-pink-400">{tier.price} STREAM</p>
            {tier.discount && (
              <Badge className="mt-1 bg-green-500/20 text-green-400 text-[10px]">
                {tier.discount}
              </Badge>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={() => {
          setIsGifting(true);
          giftMutation.mutate(giftCount);
        }}
        disabled={isGifting || giftMutation.isPending}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400"
        data-testid="button-gift-subs"
      >
        {isGifting ? (
          <>
            <Timer className="w-4 h-4 mr-2 animate-spin" />
            Gifting...
          </>
        ) : (
          <>
            <Gift className="w-4 h-4 mr-2" />
            Gift {giftCount} Sub{giftCount > 1 ? 's' : ''}
          </>
        )}
      </Button>

      <p className="text-[10px] text-slate-500 text-center mt-2">
        Randomly gifted to viewers watching right now
      </p>
    </Card>
  );
}

export function StreamAnalyticsPanel({ streamId }: { streamId: string }) {
  const { data } = useQuery<{
    peakViewers: number;
    totalViews: number;
    averageWatchTime: number;
    chatMessages: number;
    tipsReceived: number;
    newFollowers: number;
    clipsMade: number;
  }>({
    queryKey: ['/api/streams', streamId, 'analytics'],
    refetchInterval: 60000,
  });

  const stats = [
    { label: 'Peak Viewers', value: data?.peakViewers || 0, icon: <TrendingUp className="w-4 h-4 text-green-400" />, color: 'green' },
    { label: 'Total Views', value: data?.totalViews || 0, icon: <Eye className="w-4 h-4 text-blue-400" />, color: 'blue' },
    { label: 'Avg Watch Time', value: `${Math.round((data?.averageWatchTime || 0) / 60)}m`, icon: <Clock className="w-4 h-4 text-purple-400" />, color: 'purple' },
    { label: 'Chat Messages', value: data?.chatMessages || 0, icon: <MessageCircle className="w-4 h-4 text-cyan-400" />, color: 'cyan' },
    { label: 'Tips Received', value: data?.tipsReceived || 0, icon: <Coins className="w-4 h-4 text-amber-400" />, color: 'amber', suffix: 'STREAM' },
    { label: 'New Followers', value: data?.newFollowers || 0, icon: <Users className="w-4 h-4 text-pink-400" />, color: 'pink' },
  ];

  return (
    <Card className="p-4 bg-slate-900/60 border border-slate-700/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="font-semibold text-white">Stream Analytics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"
          >
            <div className="flex items-center gap-2 mb-1">
              {stat.icon}
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              {stat.suffix && <span className="text-xs text-slate-400 ml-1">{stat.suffix}</span>}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
