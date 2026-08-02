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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Surface from '@/components/ds/Surface';
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
     if (sentiment.overallSentiment > 0.3) return <Smile className="w-4 h-4 text-gain" />;
     if (sentiment.overallSentiment < -0.3) return <Frown className="w-4 h-4 text-loss" />;
     return <Meh className="w-4 h-4 text-warn" />;
  };

  const getSentimentColor = () => {
    if (sentiment.overallSentiment > 0.3) return 'bg-gain/10 border-gain/30';
    if (sentiment.overallSentiment < -0.3) return 'bg-loss/10 border-loss/30';
    return 'bg-warn/10 border-warn/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border",
        getSentimentColor()
      )}
    >
      {getSentimentIcon()}
      <span className="text-xs font-medium text-primary capitalize">
        {sentiment.dominantEmotion}
      </span>
      <div className="w-12 h-1.5 bg-ink-raised rounded-xl overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-xl transition-all",
            sentiment.energyLevel > 0.6 ? "bg-warn" : "bg-muted"
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
      <Surface className="bg-ink-surface/95 backdrop-blur-xl border-accent-core/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-accent-bright" />
            <span className="text-sm font-semibold text-primary">Live Poll</span>
          </div>
          <Badge className={cn(
            "text-[10px]",
            timeLeft > 10 ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss animate-pulse"
          )}>
            <Clock className="w-3 h-3 mr-1" />
            {timeLeft}s
          </Badge>
        </div>

        <p className="text-sm text-primary mb-3 font-medium">{poll.question}</p>

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
                  "w-full relative rounded-xl p-2 text-left transition-all border",
                  hasVoted || !poll.isActive
                    ? "bg-ink-raised/50 border-ink-edge cursor-default"
                    : "bg-ink-raised/80 border-accent-core/30 hover:border-accent-core/50 cursor-pointer",
                  isSelected && "border-accent-core bg-accent-core/20"
                )}
                data-testid={`poll-option-${option.id}`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-sm text-primary">{option.text}</span>
                  {hasVoted && (
                    <span className="text-xs text-secondary tabular">{Math.round(percentage)}%</span>
                  )}
                </div>
                {hasVoted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-accent-core/20 rounded-xl"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-secondary">
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          {hasVoted && <CheckCircle className="w-3 h-3 text-gain" />}
        </div>
      </Surface>
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
      className="fixed inset-0 bg-ink-page/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Surface className="bg-ink-surface/95 backdrop-blur-xl border-warn/30 p-6 w-full max-w-md rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-warn/10">
              <HelpCircle className="w-5 h-5 text-warn" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary font-display">Trivia Challenge!</h3>
              <p className="text-xs text-warn">{trivia.pointsReward} STREAM up for grabs</p>
            </div>
          </div>
          <div className={cn(
            "text-2xl font-bold font-orbitron",
            timeLeft <= 5 ? "text-loss animate-pulse" : "text-primary"
          )}>
            {timeLeft}s
          </div>
        </div>

        <Progress 
          value={(timeLeft / trivia.timeLimit) * 100} 
          className="h-1 mb-4"
        />

        <p className="text-base text-primary mb-4">{trivia.question}</p>

        <div className="grid grid-cols-2 gap-2">
          {trivia.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={answered || !trivia.isActive}
              variant="outline"
              className={cn(
                "h-auto py-3 text-sm text-left justify-start border-ink-edge hover:border-warn/50 hover:bg-warn/10 rounded-xl",
                result && index === result.rank - 1 && "border-gain bg-gain/10"
              )}
              data-testid={`trivia-option-${index}`}
            >
              <span className="mr-2 text-warn font-bold">{String.fromCharCode(65 + index)}.</span>
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
                "mt-4 p-3 rounded-xl text-center",
                result.correct ? "bg-gain/10 border border-gain/30" : "bg-loss/10 border border-loss/30"
              )}
            >
              {result.correct ? (
                <>
                  <CheckCircle className="w-8 h-8 mx-auto text-gain mb-2" />
                  <p className="text-gain font-bold">Correct! +{result.points} STREAM</p>
                  {result.rank <= 3 && (
                    <p className="text-xs text-gain mt-1">
                      {result.rank === 1 ? '🥇 First!' : result.rank === 2 ? '🥈 Second!' : '🥉 Third!'}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 mx-auto text-loss mb-2" />
                  <p className="text-loss font-bold">Not quite!</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Surface>
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
      <Surface className="bg-ink-surface/95 backdrop-blur-xl border-accent-core/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-bright" />
          <h3 className="font-semibold text-primary">Watch Party</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <XCircle className="w-4 h-4" />
        </Button>
      </div>

      {partyCode ? (
        <div className="space-y-3">
          <p className="text-sm text-secondary">Share this code with friends:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-ink-raised rounded-xl px-4 py-3 text-center">
              <span className="text-2xl font-bold text-accent-bright tracking-wider tabular">
                {partyCode}
              </span>
            </div>
            <Button onClick={copyCode} variant="outline" size="icon" className="h-12 w-12">
              {copied ? <Check className="w-5 h-5 text-gain" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            onClick={() => createPartyMutation.mutate()}
            disabled={createPartyMutation.isPending}
            className="w-full grad-accent glow-accent"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Watch Party
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-divider" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-ink-surface px-2 text-muted">or join existing</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter party code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="bg-ink-raised border-ink-edge text-primary text-center font-mono uppercase rounded-xl"
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
    </Surface>
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
    neutral: { emoji: '😐', color: 'bg-ink-raised text-secondary' },
    thinking: { emoji: '🤔', color: 'bg-accent-core/20 text-accent-bright' },
    excited: { emoji: '🔥', color: 'bg-warn/20 text-warn' },
    concerned: { emoji: '😟', color: 'bg-warn/20 text-warn' },
    laughing: { emoji: '😂', color: 'bg-gain/20 text-gain' },
    surprised: { emoji: '😮', color: 'bg-accent-core/20 text-accent-bright' },
    confident: { emoji: '💪', color: 'bg-accent-core/20 text-accent-bright' },
  };

  const { emoji, color } = config[expression];

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: intensity > 0.7 ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.3 }}
    className={cn("flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-medium", color)}
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
    bullish: { icon: TrendingUp, color: 'text-gain', bg: 'bg-gain/10' },
    bearish: { icon: TrendingDown, color: 'text-loss', bg: 'bg-loss/10' },
    neutral: { icon: Minus, color: 'text-secondary', bg: 'bg-ink-raised' },
  };

  const { icon: DirectionIcon, color, bg } = directionConfig[prediction.direction];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-ink-surface/90 backdrop-blur-xl rounded-xl border border-accent-core/30 p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-xl", bg)}>
            <DirectionIcon className={cn("w-5 h-5", color)} />
          </div>
          <div>
            <p className="font-bold text-primary">{prediction.asset}</p>
            <p className="text-xs text-secondary">{prediction.timeframe} outlook</p>
          </div>
        </div>
        <Badge className={cn("capitalize", bg, color)}>
          {prediction.direction}
        </Badge>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">Confidence</span>
        <span className={cn(color, "tabular")}>{prediction.confidence}%</span>
        </div>
        <Progress value={prediction.confidence} className="h-1.5" />
      </div>

      <p className="text-sm text-body italic">"{prediction.reasoning}"</p>
      <p className="text-xs text-muted mt-2">— {avatarName}</p>
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
      className="bg-ink-surface/90 backdrop-blur-xl rounded-xl border border-accent-core/30 p-4"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-accent-bright" />
        <span className="text-sm font-semibold text-accent-bright">DEBATE MODE</span>
        <Zap className="w-4 h-4 text-accent-bright" />
      </div>

      <p className="text-xs text-secondary text-center mb-3">Topic: {topic}</p>

      <div className="flex items-center justify-center gap-4">
        <div className={cn(
          "flex flex-col items-center p-2 rounded-xl transition-all",
          currentSpeaker === 1 ? "bg-accent-core/20 ring-2 ring-accent-core" : "bg-ink-raised/50"
        )}>
          <div className="w-10 h-10 rounded-xl bg-accent-core flex items-center justify-center text-sm font-bold text-primary">
            {avatar1Name[0]}
          </div>
          <span className="text-xs text-primary mt-1">{avatar1Name.split(' ')[0]}</span>
        </div>

        <span className="text-xl font-bold text-accent-bright">VS</span>

        <div className={cn(
          "flex flex-col items-center p-2 rounded-xl transition-all",
          currentSpeaker === 2 ? "bg-accent-deep/30 ring-2 ring-accent-core" : "bg-ink-raised/50"
        )}>
          <div className="w-10 h-10 rounded-xl bg-accent-deep flex items-center justify-center text-sm font-bold text-primary">
            {avatar2Name[0]}
          </div>
          <span className="text-xs text-primary mt-1">{avatar2Name.split(' ')[0]}</span>
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
         isSpeaking ? "border-accent-core animate-pulse" : "border-accent-core/50"
      )}>
        {avatarImage ? (
          <img src={avatarImage} alt={avatarName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-accent-deep flex items-center justify-center text-3xl font-bold text-primary">
            {avatarName[0]}
          </div>
        )}

        {isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-page/30">
            <Activity className="w-8 h-8 text-accent-bright animate-pulse" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-ink-page/80">
           <p className="text-xs font-medium text-primary truncate">{avatarName}</p>
        </div>

        <button
          onClick={onClose}
           className="absolute top-1 right-1 p-1 rounded-xl bg-ink-page/80 hover:bg-ink-raised transition-colors"
        >
           <XCircle className="w-4 h-4 text-primary" />
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
          className="flex items-center gap-2 bg-ink-surface/90 backdrop-blur-md rounded-xl px-3 py-2 border border-ink-edge"
        >
          <div className="w-2 h-2 rounded-xl bg-accent-core" />
          <span className="text-xs text-primary font-medium">{item.label}</span>
          <span className="text-sm font-bold text-primary tabular">${item.value.toLocaleString()}</span>
          <span className={cn(
            "text-xs font-medium",
            item.change >= 0 ? "text-gain" : "text-loss"
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
         <div className="bg-accent-core rounded-xl px-3 py-2 shadow-lg">
           <p className="text-xs text-primary/80">{label}</p>
           <p className="text-sm font-bold text-primary tabular">{value}</p>
        </div>
         <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-accent-core" />
         <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-xl bg-accent-bright animate-ping" />
         <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-xl bg-accent-bright" />
      </div>
    </motion.div>
  );
});
