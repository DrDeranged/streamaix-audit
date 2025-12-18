import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  BarChart3,
  MessageCircle,
  Users,
  Brain,
  Zap,
  Trophy,
  Vote,
  HelpCircle,
  Play,
  Pause,
  Share2,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Smile,
  Frown,
  Meh,
  Activity,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  expiresAt: number;
  isActive: boolean;
}

interface Trivia {
  id: string;
  question: string;
  options: string[];
  pointsReward: number;
  timeLimit: number;
  isActive: boolean;
}

interface SentimentData {
  overallSentiment: number;
  dominantEmotion: string;
  energyLevel: number;
  topKeywords: string[];
  messageCount: number;
}

// ================== SENTIMENT INDICATOR ==================
export const SentimentIndicator = memo(function SentimentIndicator({ 
  streamId 
}: { 
  streamId: string 
}) {
  const { data: sentimentData, isLoading } = useQuery<{ success: boolean; sentiment: SentimentData }>({
    queryKey: ['/api/streams', streamId, 'sentiment'],
    refetchInterval: 30000,
  });

  const sentiment = sentimentData?.sentiment;
  
  if (isLoading || !sentiment) {
    return null;
  }

  const getSentimentIcon = () => {
    if (sentiment.overallSentiment > 0.3) return <Smile className="w-4 h-4 text-emerald-400" />;
    if (sentiment.overallSentiment < -0.3) return <Frown className="w-4 h-4 text-red-400" />;
    return <Meh className="w-4 h-4 text-amber-400" />;
  };

  const getSentimentColor = () => {
    if (sentiment.overallSentiment > 0.3) return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30';
    if (sentiment.overallSentiment < -0.3) return 'from-red-500/20 to-orange-500/20 border-red-500/30';
    return 'from-amber-500/20 to-yellow-500/20 border-amber-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border bg-gradient-to-r",
        getSentimentColor()
      )}
    >
      {getSentimentIcon()}
      <span className="text-xs font-medium text-white capitalize">
        {sentiment.dominantEmotion}
      </span>
      <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            sentiment.energyLevel > 0.6 ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-slate-500"
          )}
          style={{ width: `${sentiment.energyLevel * 100}%` }}
        />
      </div>
    </motion.div>
  );
});

// ================== LIVE POLL COMPONENT ==================
export const LivePollOverlay = memo(function LivePollOverlay({
  poll,
  onVote,
  hasVoted,
}: {
  poll: Poll;
  onVote: (optionId: string) => void;
  hasVoted: boolean;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((poll.expiresAt - Date.now()) / 1000)));
  
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((poll.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [poll.expiresAt]);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  const handleVote = (optionId: string) => {
    if (!hasVoted && poll.isActive) {
      setSelectedOption(optionId);
      onVote(optionId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="absolute top-20 right-4 w-72 z-30"
    >
      <Card className="bg-slate-900/95 backdrop-blur-xl border-purple-500/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Live Poll</span>
          </div>
          <Badge className={cn(
            "text-[10px]",
            timeLeft > 10 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400 animate-pulse"
          )}>
            <Clock className="w-3 h-3 mr-1" />
            {timeLeft}s
          </Badge>
        </div>

        <p className="text-sm text-white mb-3 font-medium">{poll.question}</p>

        <div className="space-y-2">
          {poll.options.map((option) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            const isSelected = selectedOption === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || !poll.isActive}
                className={cn(
                  "w-full relative rounded-lg p-2 text-left transition-all border",
                  hasVoted || !poll.isActive
                    ? "bg-slate-800/50 border-slate-700/50 cursor-default"
                    : "bg-slate-800/80 border-purple-500/30 hover:border-purple-500/50 cursor-pointer",
                  isSelected && "border-purple-500 bg-purple-500/20"
                )}
                data-testid={`poll-option-${option.id}`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-sm text-white">{option.text}</span>
                  {hasVoted && (
                    <span className="text-xs text-slate-400">{Math.round(percentage)}%</span>
                  )}
                </div>
                {hasVoted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-purple-500/20 rounded-lg"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          {hasVoted && <CheckCircle className="w-3 h-3 text-emerald-400" />}
        </div>
      </Card>
    </motion.div>
  );
});

// ================== TRIVIA CHALLENGE COMPONENT ==================
export const TriviaChallenge = memo(function TriviaChallenge({
  trivia,
  onAnswer,
  result,
}: {
  trivia: Trivia;
  onAnswer: (index: number) => void;
  result?: { correct: boolean; points: number; rank: number };
}) {
  const [timeLeft, setTimeLeft] = useState(trivia.timeLimit);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !answered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, answered]);

  const handleAnswer = (index: number) => {
    if (!answered && trivia.isActive) {
      setAnswered(true);
      onAnswer(index);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="bg-slate-900/95 backdrop-blur-xl border-amber-500/30 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-500/20">
              <HelpCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-orbitron">Trivia Challenge!</h3>
              <p className="text-xs text-amber-400">{trivia.pointsReward} STREAM up for grabs</p>
            </div>
          </div>
          <div className={cn(
            "text-2xl font-bold font-orbitron",
            timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"
          )}>
            {timeLeft}s
          </div>
        </div>

        <Progress 
          value={(timeLeft / trivia.timeLimit) * 100} 
          className="h-1 mb-4"
        />

        <p className="text-base text-white mb-4">{trivia.question}</p>

        <div className="grid grid-cols-2 gap-2">
          {trivia.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={answered || !trivia.isActive}
              variant="outline"
              className={cn(
                "h-auto py-3 text-sm text-left justify-start border-slate-600 hover:border-amber-500/50 hover:bg-amber-500/10",
                result && index === result.rank - 1 && "border-emerald-500 bg-emerald-500/20"
              )}
              data-testid={`trivia-option-${index}`}
            >
              <span className="mr-2 text-amber-400 font-bold">{String.fromCharCode(65 + index)}.</span>
              {option}
            </Button>
          ))}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-4 p-3 rounded-lg text-center",
                result.correct ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-red-500/20 border border-red-500/30"
              )}
            >
              {result.correct ? (
                <>
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  <p className="text-emerald-400 font-bold">Correct! +{result.points} STREAM</p>
                  {result.rank <= 3 && (
                    <p className="text-xs text-emerald-300 mt-1">
                      {result.rank === 1 ? '🥇 First!' : result.rank === 2 ? '🥈 Second!' : '🥉 Third!'}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 mx-auto text-red-400 mb-2" />
                  <p className="text-red-400 font-bold">Not quite!</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

// ================== WATCH PARTY PANEL ==================
export const WatchPartyPanel = memo(function WatchPartyPanel({
  streamId,
  onClose,
}: {
  streamId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [partyCode, setPartyCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const createPartyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/streams/${streamId}/watch-party`, { method: 'POST' });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPartyCode(data.partyCode);
        toast({ title: 'Watch party created!', description: `Share code: ${data.partyCode}` });
      }
    },
  });

  const joinPartyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest(`/api/watch-party/${code}/join`, { method: 'POST' });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: 'Joined watch party!', description: `${data.memberCount} people watching together` });
      } else {
        toast({ title: 'Could not join', description: data.error, variant: 'destructive' });
      }
    },
  });

  const copyCode = () => {
    navigator.clipboard.writeText(partyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-slate-900/95 backdrop-blur-xl border-cyan-500/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-white">Watch Party</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <XCircle className="w-4 h-4" />
        </Button>
      </div>

      {partyCode ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Share this code with friends:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-800 rounded-lg px-4 py-3 text-center">
              <span className="text-2xl font-bold font-orbitron text-cyan-400 tracking-wider">
                {partyCode}
              </span>
            </div>
            <Button onClick={copyCode} variant="outline" size="icon" className="h-12 w-12">
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={() => createPartyMutation.mutate()}
            disabled={createPartyMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Watch Party
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-2 text-slate-500">or join existing</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter party code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="bg-slate-800 border-slate-700 text-center font-mono uppercase"
              maxLength={6}
            />
            <Button
              onClick={() => joinCode && joinPartyMutation.mutate(joinCode)}
              disabled={!joinCode || joinPartyMutation.isPending}
              variant="outline"
            >
              Join
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
});

// ================== AVATAR EXPRESSION INDICATOR ==================
export type AvatarExpression = 'neutral' | 'thinking' | 'excited' | 'concerned' | 'laughing' | 'surprised' | 'confident';

export const AvatarExpressionBadge = memo(function AvatarExpressionBadge({
  expression,
  intensity,
}: {
  expression: AvatarExpression;
  intensity: number;
}) {
  const config: Record<AvatarExpression, { emoji: string; color: string }> = {
    neutral: { emoji: '😐', color: 'bg-slate-500/20 text-slate-400' },
    thinking: { emoji: '🤔', color: 'bg-blue-500/20 text-blue-400' },
    excited: { emoji: '🔥', color: 'bg-orange-500/20 text-orange-400' },
    concerned: { emoji: '😟', color: 'bg-amber-500/20 text-amber-400' },
    laughing: { emoji: '😂', color: 'bg-emerald-500/20 text-emerald-400' },
    surprised: { emoji: '😮', color: 'bg-purple-500/20 text-purple-400' },
    confident: { emoji: '💪', color: 'bg-cyan-500/20 text-cyan-400' },
  };

  const { emoji, color } = config[expression];

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: intensity > 0.7 ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", color)}
    >
      <span>{emoji}</span>
      <span className="capitalize">{expression}</span>
    </motion.div>
  );
});

// ================== MARKET PREDICTION CARD ==================
interface MarketPrediction {
  asset: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeframe: string;
  reasoning: string;
}

export const MarketPredictionCard = memo(function MarketPredictionCard({
  prediction,
  avatarName,
}: {
  prediction: MarketPrediction;
  avatarName: string;
}) {
  const directionConfig = {
    bullish: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    bearish: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20' },
    neutral: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  };

  const { icon: DirectionIcon, color, bg } = directionConfig[prediction.direction];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", bg)}>
            <DirectionIcon className={cn("w-5 h-5", color)} />
          </div>
          <div>
            <p className="font-bold text-white">{prediction.asset}</p>
            <p className="text-xs text-slate-400">{prediction.timeframe} outlook</p>
          </div>
        </div>
        <Badge className={cn("capitalize", bg, color)}>
          {prediction.direction}
        </Badge>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">Confidence</span>
          <span className={color}>{prediction.confidence}%</span>
        </div>
        <Progress value={prediction.confidence} className="h-1.5" />
      </div>

      <p className="text-sm text-slate-300 italic">"{prediction.reasoning}"</p>
      <p className="text-xs text-slate-500 mt-2">— {avatarName}</p>
    </motion.div>
  );
});

// ================== DEBATE MODE INDICATOR ==================
export const DebateModeIndicator = memo(function DebateModeIndicator({
  avatar1Name,
  avatar2Name,
  topic,
  currentSpeaker,
}: {
  avatar1Name: string;
  avatar2Name: string;
  topic: string;
  currentSpeaker: 1 | 2;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-semibold text-purple-300">DEBATE MODE</span>
        <Zap className="w-4 h-4 text-purple-400" />
      </div>

      <p className="text-xs text-slate-400 text-center mb-3">Topic: {topic}</p>

      <div className="flex items-center justify-center gap-4">
        <div className={cn(
          "flex flex-col items-center p-2 rounded-lg transition-all",
          currentSpeaker === 1 ? "bg-cyan-500/20 ring-2 ring-cyan-500" : "bg-slate-800/50"
        )}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-sm font-bold">
            {avatar1Name[0]}
          </div>
          <span className="text-xs text-white mt-1">{avatar1Name.split(' ')[0]}</span>
        </div>

        <span className="text-xl font-bold text-purple-400">VS</span>

        <div className={cn(
          "flex flex-col items-center p-2 rounded-lg transition-all",
          currentSpeaker === 2 ? "bg-pink-500/20 ring-2 ring-pink-500" : "bg-slate-800/50"
        )}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-sm font-bold">
            {avatar2Name[0]}
          </div>
          <span className="text-xs text-white mt-1">{avatar2Name.split(' ')[0]}</span>
        </div>
      </div>
    </motion.div>
  );
});

// ================== PICTURE IN PICTURE AVATAR ==================
export const PictureInPictureAvatar = memo(function PictureInPictureAvatar({
  avatarName,
  avatarImage,
  expression,
  isSpeaking,
  onClose,
}: {
  avatarName: string;
  avatarImage?: string;
  expression: AvatarExpression;
  isSpeaking: boolean;
  onClose: () => void;
}) {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-24 right-4 z-40"
    >
      <div className={cn(
        "relative w-32 h-32 rounded-2xl overflow-hidden border-2 shadow-2xl",
        isSpeaking ? "border-cyan-500 animate-pulse" : "border-purple-500/50"
      )}>
        {avatarImage ? (
          <img src={avatarImage} alt={avatarName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-3xl font-bold">
            {avatarName[0]}
          </div>
        )}

        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-xs font-medium text-white truncate">{avatarName}</p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
        >
          <XCircle className="w-4 h-4 text-white" />
        </button>
      </div>
    </motion.div>
  );
});

// ================== AR DATA VISUALIZATION ==================
export const ARDataVisualization = memo(function ARDataVisualization({
  data,
}: {
  data: { label: string; value: number; change: number }[];
}) {
  return (
    <div className="absolute top-1/4 left-4 z-20 space-y-2">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs text-white font-medium">{item.label}</span>
          <span className="text-sm font-bold text-white">${item.value.toLocaleString()}</span>
          <span className={cn(
            "text-xs font-medium",
            item.change >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
          </span>
        </motion.div>
      ))}
    </div>
  );
});

// ================== INTERACTIVE CHART HIGHLIGHT ==================
export const ChartHighlight = memo(function ChartHighlight({
  x,
  y,
  label,
  value,
  onDismiss,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="absolute transform -translate-x-1/2 -translate-y-full z-30"
      onClick={onDismiss}
    >
      <div className="relative">
        <div className="bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-white/80">{label}</p>
          <p className="text-sm font-bold text-white">{value}</p>
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-cyan-500" />
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400" />
      </div>
    </motion.div>
  );
});
