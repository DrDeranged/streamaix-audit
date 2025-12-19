import { useState, useEffect, useRef, memo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  Zap,
  Calendar,
  Clock,
  Play,
  Users,
  Volume2,
  VolumeX,
  ThumbsUp,
  Mic,
  Radio,
  MessageSquare,
  ChevronRight,
  Loader2,
  Trophy,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface DebateExchange {
  speakerName: string;
  content: string;
  timestamp: number;
  hasAudio?: boolean;
  audioBase64?: string;
}

interface ScheduledDebate {
  id: string;
  topic: string;
  description?: string;
  category?: string;
  scheduledStartTime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  maxRounds?: number;
  enableVoice?: boolean;
  avatar1Id: string;
  avatar2Id: string;
  avatar1Name?: string;
  avatar1Image?: string;
  avatar2Name?: string;
  avatar2Image?: string;
  currentRound?: number;
  exchanges?: DebateExchange[];
  viewerVotes?: { avatar1: number; avatar2: number };
}

interface Avatar {
  id: string;
  name: string;
  imageUrl?: string;
  expertise?: string;
}

export const UpcomingDebatesSection = memo(function UpcomingDebatesSection() {
  const { data, isLoading } = useQuery<{ success: boolean; debates: ScheduledDebate[] }>({
    queryKey: ['/api/debates/upcoming'],
    refetchInterval: 30000,
  });

  const debates = data?.debates || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (debates.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="text-slate-400">No upcoming debates scheduled</p>
        <p className="text-sm text-slate-500 mt-1">Schedule one to see avatars debate!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debates.map((debate) => (
        <DebateCard key={debate.id} debate={debate} />
      ))}
    </div>
  );
});

const DebateCard = memo(function DebateCard({ debate }: { debate: ScheduledDebate }) {
  const isLive = debate.status === 'live';
  const isUpcoming = debate.status === 'scheduled';
  const scheduledTime = new Date(debate.scheduledStartTime);
  const canStart = isUpcoming && isPast(scheduledTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="relative"
    >
      <Card className={cn(
        "overflow-hidden border transition-all",
        isLive 
          ? "bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/50" 
          : "bg-slate-900/80 border-slate-700/50"
      )}>
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse" />
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {isLive ? (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              ) : (
                <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Calendar className="w-3 h-3 mr-1" />
                  Scheduled
                </Badge>
              )}
              {debate.enableVoice && (
                <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Voice
                </Badge>
              )}
            </div>
            
            <div className="text-right">
              {isLive ? (
                <span className="text-xs text-purple-400">
                  Round {debate.currentRound || 0}/{debate.maxRounds || 6}
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(scheduledTime, { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          <h3 className="font-semibold text-white mb-2 line-clamp-1">{debate.topic}</h3>
          
          {debate.description && (
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{debate.description}</p>
          )}

          <div className="flex items-center justify-center gap-4 mb-3">
            <AvatarDisplay 
              name={debate.avatar1Name || 'Avatar 1'} 
              image={debate.avatar1Image}
              isActive={isLive && (debate.currentRound || 0) % 2 === 1}
              votes={debate.viewerVotes?.avatar1}
            />
            
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-purple-400">VS</span>
              {isLive && (
                <Zap className="w-4 h-4 text-amber-400 animate-pulse mt-1" />
              )}
            </div>
            
            <AvatarDisplay 
              name={debate.avatar2Name || 'Avatar 2'} 
              image={debate.avatar2Image}
              isActive={isLive && (debate.currentRound || 0) % 2 === 0}
              votes={debate.viewerVotes?.avatar2}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {format(scheduledTime, 'MMM d, h:mm a')}
            </div>
            
            {isLive ? (
              <WatchDebateButton debateId={debate.id} />
            ) : canStart ? (
              <StartDebateButton debateId={debate.id} />
            ) : (
              <Button variant="outline" size="sm" disabled className="text-slate-500">
                <Timer className="w-3 h-3 mr-1" />
                Waiting
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

const AvatarDisplay = memo(function AvatarDisplay({
  name,
  image,
  isActive,
  votes,
}: {
  name: string;
  image?: string;
  isActive?: boolean;
  votes?: number;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center transition-all",
      isActive && "scale-110"
    )}>
      <div className={cn(
        "w-14 h-14 rounded-full overflow-hidden border-2 transition-all",
        isActive 
          ? "border-cyan-500 ring-4 ring-cyan-500/30" 
          : "border-slate-600"
      )}>
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xl font-bold">
            {name[0]}
          </div>
        )}
      </div>
      <span className="text-xs text-white mt-1 font-medium truncate max-w-[80px]">
        {name.split(' ')[0]}
      </span>
      {votes !== undefined && votes > 0 && (
        <div className="flex items-center gap-1 mt-0.5">
          <ThumbsUp className="w-3 h-3 text-emerald-400" />
          <span className="text-xs text-emerald-400">{votes}</span>
        </div>
      )}
    </div>
  );
});

const WatchDebateButton = memo(function WatchDebateButton({ debateId }: { debateId: string }) {
  return (
    <Button 
      size="sm" 
      className="bg-gradient-to-r from-purple-600 to-pink-600"
      onClick={() => window.location.href = `/debate/${debateId}`}
    >
      <Play className="w-3 h-3 mr-1" />
      Watch Live
    </Button>
  );
});

const StartDebateButton = memo(function StartDebateButton({ debateId }: { debateId: string }) {
  const { toast } = useToast();
  
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/debates/${debateId}/start`, { method: 'POST' });
      return res;
    },
    onSuccess: () => {
      toast({ title: 'Debate started!', description: 'The avatars are now debating.' });
      queryClient.invalidateQueries({ queryKey: ['/api/debates/upcoming'] });
    },
    onError: () => {
      toast({ title: 'Could not start debate', variant: 'destructive' });
    },
  });

  return (
    <Button 
      size="sm" 
      className="bg-gradient-to-r from-emerald-600 to-cyan-600"
      onClick={() => startMutation.mutate()}
      disabled={startMutation.isPending}
    >
      {startMutation.isPending ? (
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      ) : (
        <Play className="w-3 h-3 mr-1" />
      )}
      Start Now
    </Button>
  );
});

export const ScheduleDebateDialog = memo(function ScheduleDebateDialog() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('crypto');
  const [avatar1Id, setAvatar1Id] = useState('');
  const [avatar2Id, setAvatar2Id] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [maxRounds, setMaxRounds] = useState('6');
  const [enableVoice, setEnableVoice] = useState(true);

  const { data: avatarsData } = useQuery<{ success: boolean; avatars: Avatar[] }>({
    queryKey: ['/api/avatars'],
  });

  const avatars = avatarsData?.avatars || [];

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const scheduledStartTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const res = await apiRequest('/api/debates/schedule', {
        method: 'POST',
        body: JSON.stringify({
          avatar1Id,
          avatar2Id,
          topic,
          description,
          category,
          scheduledStartTime: scheduledStartTime.toISOString(),
          maxRounds: parseInt(maxRounds),
          enableVoice,
        }),
      });
      return res;
    },
    onSuccess: () => {
      toast({ title: 'Debate scheduled!', description: 'The debate has been added to the schedule.' });
      queryClient.invalidateQueries({ queryKey: ['/api/debates/upcoming'] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to schedule', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setTopic('');
    setDescription('');
    setCategory('crypto');
    setAvatar1Id('');
    setAvatar2Id('');
    setScheduledDate('');
    setScheduledTime('');
    setMaxRounds('6');
    setEnableVoice(true);
  };

  if (!isAuthenticated) return null;

  const canSubmit = topic && avatar1Id && avatar2Id && avatar1Id !== avatar2Id && scheduledDate && scheduledTime;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500">
          <Sparkles className="w-4 h-4 mr-2" />
          Schedule Debate
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-purple-500/30 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Schedule Avatar Debate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-slate-300">Debate Topic</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Is Bitcoin going to $100k this cycle?"
              className="bg-slate-800 border-slate-700 mt-1"
            />
          </div>

          <div>
            <Label className="text-slate-300">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this debate cover?"
              className="bg-slate-800 border-slate-700 mt-1 h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Avatar 1</Label>
              <Select value={avatar1Id} onValueChange={setAvatar1Id}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue placeholder="Select avatar" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-[200px]">
                  {avatars.map((avatar) => (
                    <SelectItem key={avatar.id} value={avatar.id} disabled={avatar.id === avatar2Id}>
                      {avatar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Avatar 2</Label>
              <Select value={avatar2Id} onValueChange={setAvatar2Id}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue placeholder="Select avatar" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-[200px]">
                  {avatars.map((avatar) => (
                    <SelectItem key={avatar.id} value={avatar.id} disabled={avatar.id === avatar1Id}>
                      {avatar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="bg-slate-800 border-slate-700 mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label className="text-slate-300">Time</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-slate-800 border-slate-700 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="trading">Trading</SelectItem>
                  <SelectItem value="macro">Macro</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Rounds</Label>
              <Select value={maxRounds} onValueChange={setMaxRounds}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="4">4 rounds</SelectItem>
                  <SelectItem value="6">6 rounds</SelectItem>
                  <SelectItem value="8">8 rounds</SelectItem>
                  <SelectItem value="10">10 rounds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-300">Enable Voice Synthesis</span>
            </div>
            <Button
              variant={enableVoice ? "default" : "outline"}
              size="sm"
              onClick={() => setEnableVoice(!enableVoice)}
              className={enableVoice ? "bg-cyan-600" : ""}
            >
              {enableVoice ? 'ON' : 'OFF'}
            </Button>
          </div>

          <Button
            onClick={() => scheduleMutation.mutate()}
            disabled={!canSubmit || scheduleMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600"
          >
            {scheduleMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Debate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export const LiveDebateViewer = memo(function LiveDebateViewer({ debateId }: { debateId: string }) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<'transcript' | 'chat' | 'questions'>('transcript');
  const [chatMessage, setChatMessage] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [tipAmount, setTipAmount] = useState(10);

  const { data, isLoading, refetch } = useQuery<{
    success: boolean;
    isLive: boolean;
    debate: any;
  }>({
    queryKey: ['/api/debates', debateId, 'state'],
    refetchInterval: 3000,
  });

  const { data: chatData, refetch: refetchChat } = useQuery<{ success: boolean; messages: any[] }>({
    queryKey: ['/api/debates', debateId, 'chat'],
    refetchInterval: 2000,
  });

  const { data: questionsData, refetch: refetchQuestions } = useQuery<{ success: boolean; questions: any[] }>({
    queryKey: ['/api/debates', debateId, 'questions'],
    refetchInterval: 5000,
  });

  const { data: engagementData } = useQuery<{ success: boolean; stats: any }>({
    queryKey: ['/api/debates', debateId, 'engagement'],
    refetchInterval: 5000,
  });

  const voteMutation = useMutation({
    mutationFn: async (avatarNumber: 1 | 2) => {
      const res = await apiRequest(`/api/debates/${debateId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ avatarNumber }),
      });
      return res;
    },
    onSuccess: () => {
      toast({ title: 'Vote recorded!' });
      refetch();
    },
  });

  const sendChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest(`/api/debates/${debateId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      return res;
    },
    onSuccess: () => {
      setChatMessage('');
      refetchChat();
    },
    onError: () => {
      toast({ title: 'Could not send message', variant: 'destructive' });
    },
  });

  const tipMutation = useMutation({
    mutationFn: async ({ avatarNumber, amount }: { avatarNumber: 1 | 2; amount: number }) => {
      const res = await apiRequest(`/api/debates/${debateId}/tip`, {
        method: 'POST',
        body: JSON.stringify({ avatarNumber, amount }),
      });
      return res;
    },
    onSuccess: (_, vars) => {
      toast({ title: `Sent ${vars.amount} STREAM!` });
    },
    onError: () => {
      toast({ title: 'Tip failed', variant: 'destructive' });
    },
  });

  const submitQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest(`/api/debates/${debateId}/question`, {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
      return res;
    },
    onSuccess: () => {
      setQuestionText('');
      refetchQuestions();
      toast({ title: 'Question submitted!' });
    },
    onError: () => {
      toast({ title: 'Could not submit question', variant: 'destructive' });
    },
  });

  const upvoteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const res = await apiRequest(`/api/debates/${debateId}/questions/${questionId}/upvote`, {
        method: 'POST',
      });
      return res;
    },
    onSuccess: () => {
      refetchQuestions();
    },
  });

  const reactMutation = useMutation({
    mutationFn: async (reaction: string) => {
      const res = await apiRequest(`/api/debates/${debateId}/react`, {
        method: 'POST',
        body: JSON.stringify({ reaction }),
      });
      return res;
    },
  });

  const debate = data?.debate;
  const isLive = data?.isLive;
  const exchanges = debate?.exchanges || [];
  const chatMessages = chatData?.messages || [];
  const questions = questionsData?.questions || [];
  const stats = engagementData?.stats;

  useEffect(() => {
    if (exchanges.length > currentAudioIndex + 1 && !isMuted) {
      const nextExchange = exchanges[currentAudioIndex + 1];
      if (nextExchange?.audioBase64 && audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${nextExchange.audioBase64}`;
        audioRef.current.play().catch(console.error);
        setCurrentAudioIndex(currentAudioIndex + 1);
      }
    }
  }, [exchanges.length, currentAudioIndex, isMuted]);

  useEffect(() => {
    if (chatContainerRef.current && activeTab === 'chat') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages.length, activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Debate not found</p>
      </div>
    );
  }

  const reactionEmojis = [
    { key: 'fire', emoji: '🔥' },
    { key: 'idea', emoji: '💡' },
    { key: 'clap', emoji: '👏' },
    { key: 'think', emoji: '🤔' },
    { key: 'love', emoji: '❤️' },
    { key: 'wow', emoji: '😮' },
  ];

  return (
    <div className="space-y-4">
      <audio ref={audioRef} className="hidden" />
      
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-500/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{debate.topic}</h2>
            <div className="flex items-center gap-2 mt-1">
              {isLive ? (
                <Badge className="bg-red-500/20 text-red-400 animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              ) : (
                <Badge className="bg-slate-600/50 text-slate-300">
                  Completed
                </Badge>
              )}
              <span className="text-xs text-slate-400">
                Round {debate.currentRound || exchanges.length}/{debate.maxRounds || 6}
              </span>
              {stats && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stats.viewerCount || 0}
                </span>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={cn("h-10 w-10", isMuted && "text-red-400")}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl font-bold transition-all",
              debate.currentSpeaker === 1 && isLive && "ring-4 ring-cyan-500/50 scale-110"
            )}>
              {debate.avatar1?.imageUrl ? (
                <img 
                  src={debate.avatar1.imageUrl} 
                  alt={debate.avatar1?.name || 'Avatar 1'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white">{debate.avatar1?.name?.[0] || 'A'}</span>
              )}
            </div>
            <p className="text-sm text-white mt-2 font-medium">{debate.avatar1?.name || 'Avatar 1'}</p>
            <div className="flex gap-1 mt-2">
              {isAuthenticated && isLive && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-cyan-400 border-cyan-500/30 h-7 px-2"
                    onClick={() => voteMutation.mutate(1)}
                    disabled={voteMutation.isPending}
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {debate.viewerVotes?.avatar1 || 0}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-400 border-amber-500/30 h-7 px-2"
                    onClick={() => tipMutation.mutate({ avatarNumber: 1, amount: tipAmount })}
                    disabled={tipMutation.isPending}
                  >
                    <Sparkles className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Zap className="w-8 h-8 text-purple-400" />
            <span className="text-sm text-purple-400 font-bold mt-1">VS</span>
          </div>

          <div className="text-center">
            <div className={cn(
              "w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl font-bold transition-all",
              debate.currentSpeaker === 2 && isLive && "ring-4 ring-pink-500/50 scale-110"
            )}>
              {debate.avatar2?.imageUrl ? (
                <img 
                  src={debate.avatar2.imageUrl} 
                  alt={debate.avatar2?.name || 'Avatar 2'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white">{debate.avatar2?.name?.[0] || 'B'}</span>
              )}
            </div>
            <p className="text-sm text-white mt-2 font-medium">{debate.avatar2?.name || 'Avatar 2'}</p>
            <div className="flex gap-1 mt-2">
              {isAuthenticated && isLive && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-pink-400 border-pink-500/30 h-7 px-2"
                    onClick={() => voteMutation.mutate(2)}
                    disabled={voteMutation.isPending}
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {debate.viewerVotes?.avatar2 || 0}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-400 border-amber-500/30 h-7 px-2"
                    onClick={() => tipMutation.mutate({ avatarNumber: 2, amount: tipAmount })}
                    disabled={tipMutation.isPending}
                  >
                    <Sparkles className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {isLive && (
          <Progress 
            value={(debate.currentRound / debate.maxRounds) * 100} 
            className="h-1.5 bg-slate-700" 
          />
        )}

        {isLive && isAuthenticated && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {reactionEmojis.map(({ key, emoji }) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className="text-lg h-9 w-9 p-0 hover:scale-125 transition-transform"
                onClick={() => reactMutation.mutate(key)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-700 pb-2">
        <Button
          variant={activeTab === 'transcript' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('transcript')}
          className={activeTab === 'transcript' ? 'bg-purple-600' : ''}
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Transcript
        </Button>
        <Button
          variant={activeTab === 'chat' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('chat')}
          className={activeTab === 'chat' ? 'bg-purple-600' : ''}
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
        </Button>
        <Button
          variant={activeTab === 'questions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('questions')}
          className={activeTab === 'questions' ? 'bg-purple-600' : ''}
        >
          Q&A {questions.length > 0 && `(${questions.length})`}
        </Button>
      </div>

      {activeTab === 'transcript' && (
        <div className="space-y-3">
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {exchanges.map((exchange: DebateExchange, index: number) => {
                const isAvatar1 = index % 2 === 0;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg",
                      isAvatar1 
                        ? "bg-cyan-500/10 border border-cyan-500/20 ml-0 mr-8" 
                        : "bg-pink-500/10 border border-pink-500/20 ml-8 mr-0"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-medium",
                        isAvatar1 ? "text-cyan-400" : "text-pink-400"
                      )}>
                        {exchange.speakerName}
                      </span>
                      {(exchange.audioBase64 || exchange.hasAudio) && (
                        <button
                          onClick={() => {
                            if (exchange.audioBase64 && audioRef.current) {
                              audioRef.current.src = `data:audio/mp3;base64,${exchange.audioBase64}`;
                              audioRef.current.play().catch(console.error);
                            }
                          }}
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Play audio"
                        >
                          <Play className="w-3 h-3" />
                          <Mic className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-200">{exchange.content}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {isLive && exchanges.length === 0 && (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Waiting for first response...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="space-y-3">
          <div 
            ref={chatContainerRef}
            className="space-y-2 max-h-[300px] overflow-y-auto bg-slate-900/50 rounded-lg p-3"
          >
            {chatMessages.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">No messages yet. Be the first!</p>
            ) : (
              chatMessages.map((msg: any) => (
                <div key={msg.id} className="text-sm">
                  <span className="text-purple-400 font-medium">{msg.username}: </span>
                  <span className="text-slate-300">{msg.message}</span>
                </div>
              ))
            )}
          </div>
          
          {isAuthenticated && isLive && (
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="bg-slate-800 border-slate-700 flex-1"
                maxLength={500}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatMessage.trim()) {
                    sendChatMutation.mutate(chatMessage.trim());
                  }
                }}
              />
              <Button
                onClick={() => chatMessage.trim() && sendChatMutation.mutate(chatMessage.trim())}
                disabled={!chatMessage.trim() || sendChatMutation.isPending}
                className="bg-purple-600"
              >
                Send
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-3">
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {questions.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">No questions yet. Submit one!</p>
            ) : (
              questions.map((q: any) => (
                <div key={q.id} className="bg-slate-800/50 rounded-lg p-3 flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-col h-auto py-1 px-2"
                    onClick={() => upvoteQuestionMutation.mutate(q.id)}
                    disabled={upvoteQuestionMutation.isPending}
                  >
                    <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
                    <span className="text-xs text-emerald-400">{q.upvotes}</span>
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{q.question}</p>
                    <p className="text-xs text-slate-500 mt-1">by {q.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {isAuthenticated && isLive && (
            <div className="flex gap-2">
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Ask a question for the avatars..."
                className="bg-slate-800 border-slate-700 flex-1"
                maxLength={300}
              />
              <Button
                onClick={() => questionText.trim() && submitQuestionMutation.mutate(questionText.trim())}
                disabled={!questionText.trim() || submitQuestionMutation.isPending}
                className="bg-purple-600"
              >
                Ask
              </Button>
            </div>
          )}
        </div>
      )}

      {stats && (
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-700/50">
          <span>{stats.messageCount || 0} messages</span>
          <span>{stats.totalTips || 0} STREAM tipped</span>
          <span>{stats.questionCount || 0} questions</span>
        </div>
      )}
    </div>
  );
});

export const AvatarDebateHub = memo(function AvatarDebateHub() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            Avatar Debates
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Watch AI avatars debate hot topics with automatic turn-taking and voice
          </p>
        </div>
        <ScheduleDebateDialog />
      </div>

      <UpcomingDebatesSection />
    </div>
  );
});

export default AvatarDebateHub;
