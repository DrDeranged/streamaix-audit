import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Sparkles, Activity, Mic, Radio, Brain, Zap, TrendingUp, Volume2, VolumeX, 
  MessageCircle, Lightbulb, Target, BarChart3, Shield, Flame, Heart, User, 
  Send, ThumbsUp, ThumbsDown, Users, Crown, Timer, HelpCircle, MessageSquare,
  CheckCircle2, XCircle, Vote, Award, Swords
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Surface from '@/components/ds/Surface';

interface HostInfo {
  id: string;
  name: string;
  avatar?: string;
  isAvatar: boolean;
  isVerified?: boolean;
  expertise?: string[];
}

interface StreamQuestion {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  question: string;
  votes: number;
  hasVoted?: boolean;
  status: 'pending' | 'answered' | 'skipped';
  timestamp: Date;
}

interface DebateParticipant {
  id: string;
  name: string;
  avatar?: string;
  isAvatar: boolean;
  side: 'pro' | 'con';
  score: number;
  isSpeaking: boolean;
}

interface UnifiedStreamViewerProps {
  streamId: string;
  host: HostInfo;
  streamType: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  isDebate?: boolean;
  debateParticipants?: DebateParticipant[];
  debateTopic?: string;
  currentSpeaker?: string;
  onSubmitQuestion?: (question: string) => void;
  onVoteQuestion?: (questionId: string) => void;
  onDebateVote?: (participantId: string, voteType: 'pro' | 'con') => void;
  onAudioMessage?: (callback: (audio: AvatarAudioData) => void) => () => void;
}

interface AvatarAudioData {
  avatarName: string;
  text: string;
  audioBase64: string;
  segmentType: string;
  duration: number;
  timestamp: string;
}

interface AudioQueueItem {
  id: string;
  text: string;
  audioBase64: string;
  segmentType: string;
  speakerId?: string;
}

const avatarStyles: Record<string, { gradient: string; icon: any; pulseColor: string }> = {
  broadcast: {
    gradient: 'bg-accent-core',
    icon: Radio,
    pulseColor: 'rgb(168, 85, 247)',
  },
  trading_room: {
    gradient: 'bg-gain',
    icon: TrendingUp,
    pulseColor: 'rgb(16, 185, 129)',
  },
  audio_space: {
    gradient: 'bg-accent-core',
    icon: Mic,
    pulseColor: 'rgb(6, 182, 212)',
  },
  live_bounty: {
    gradient: 'bg-warn',
    icon: Zap,
    pulseColor: 'rgb(245, 158, 11)',
  },
  avatar_alpha: {
    gradient: 'bg-accent-deep',
    icon: Brain,
    pulseColor: 'rgb(168, 85, 247)',
  },
  debate: {
    gradient: 'bg-loss',
    icon: Swords,
    pulseColor: 'rgb(139, 92, 246)',
  },
};

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            background: 'rgba(139,124,246,0.6)',
          }}
          animate={{
            y: [-20, -50, -20],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

function EnhancedSpeakingIndicator({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-accent-bright rounded-full"
          animate={isActive ? {
            height: [8, 24 + Math.sin(i * 0.5) * 16, 8],
            opacity: [0.7, 1, 0.7],
          } : { height: 8, opacity: 0.4 }}
          transition={{
            duration: isActive ? 0.25 + (i * 0.03) : 0.4,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function HostAvatar({ host, isSpeaking, size = 'lg' }: { host: HostInfo; isSpeaking: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32 sm:w-40 sm:h-40',
  };

  return (
    <motion.div
      className="relative"
      animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
    >
      <motion.div
        className="absolute -inset-4 rounded-full bg-accent-core opacity-30 blur-xl"
        animate={isSpeaking ? { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] } : { scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: isSpeaking ? 0.4 : 2, repeat: Infinity }}
      />
      
      <div className={cn(
        "relative rounded-full bg-accent-core flex items-center justify-center overflow-hidden border-2 border-ink-edge shadow-2xl",
        sizeClasses[size]
      )}>
        {host.avatar ? (
          <img src={host.avatar} alt={host.name} className="w-full h-full object-cover" />
        ) : host.isAvatar ? (
          <Bot className="w-1/2 h-1/2 text-primary" />
        ) : (
          <User className="w-1/2 h-1/2 text-primary" />
        )}
        
        {host.isVerified && (
          <div className="absolute bottom-1 right-1 bg-accent-core rounded-full p-1">
            <CheckCircle2 className="w-3 h-3 text-primary" />
          </div>
        )}
      </div>
      
      {host.isAvatar && (
        <motion.div
          className="absolute -bottom-1 -right-1 bg-accent-deep rounded-full p-2 shadow-lg"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Brain className="w-4 h-4 text-primary" />
        </motion.div>
      )}
      
      {isSpeaking && (
        <motion.div
          className="absolute -top-1 -left-1 bg-accent-core rounded-full p-2 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <MessageCircle className="w-3.5 h-3.5 text-primary" />
        </motion.div>
      )}
    </motion.div>
  );
}

function SpeechBubble({ text, segmentType, speakerName }: { text: string; segmentType?: string; speakerName?: string }) {
  const getSegmentLabel = () => {
    switch (segmentType) {
      case 'opening': return '🎤 Opening';
      case 'market_analysis': return '📊 Market Analysis';
      case 'market_reaction': return '📈 Market Update';
      case 'viewer_qa': return '💬 Q&A';
      case 'debate': return '⚔️ Debate';
      default: return '💡 Insight';
    }
  };

  const truncatedText = text.length > 250 ? text.substring(0, 250) + '...' : text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute bottom-24 md:bottom-20 left-3 right-3 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 max-w-lg mx-auto"
    >
      <Surface className="relative px-5 md:px-6 py-4 md:py-5 bg-ink-surface/95 backdrop-blur-2xl rounded-2xl border-2 border-accent-core/50 shadow-2xl">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <div className="px-3 py-1 bg-accent-core rounded-xl shadow-lg">
            <span className="text-[10px] md:text-xs text-primary font-semibold tracking-wide">{getSegmentLabel()}</span>
          </div>
          {speakerName && (
            <div className="px-2 py-1 bg-ink-raised/90 rounded-xl border border-accent-core/30">
              <span className="text-[10px] text-accent-bright font-medium">{speakerName}</span>
            </div>
          )}
        </div>
        <p className="text-sm md:text-base text-primary leading-relaxed mt-1 font-medium">{truncatedText}</p>
      </Surface>
    </motion.div>
  );
}

function QAPanel({ 
  questions, 
  onSubmitQuestion, 
  onVoteQuestion,
  currentUserId 
}: { 
  questions: StreamQuestion[];
  onSubmitQuestion: (q: string) => void;
  onVoteQuestion: (id: string) => void;
  currentUserId?: string;
}) {
  const [newQuestion, setNewQuestion] = useState('');
  
  const handleSubmit = () => {
    if (newQuestion.trim()) {
      onSubmitQuestion(newQuestion.trim());
      setNewQuestion('');
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => b.votes - a.votes);
  const pendingQuestions = sortedQuestions.filter(q => q.status === 'pending');
  const answeredQuestions = sortedQuestions.filter(q => q.status === 'answered');

  return (
    <Surface className="bg-ink-surface/90 backdrop-blur-xl border border-ink-edge p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-accent-bright" />
        <h3 className="text-sm font-bold text-primary">Live Q&A</h3>
        <Badge variant="secondary" className="ml-auto bg-accent-core/20 text-accent-bright">
          {pendingQuestions.length} pending
        </Badge>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Input
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-ink-raised border-ink-edge text-primary placeholder:text-muted rounded-xl"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          data-testid="input-stream-question"
        />
        <Button 
          onClick={handleSubmit}
          size="sm"
           className="bg-accent-core hover:bg-accent-deep text-primary rounded-xl"
          data-testid="button-submit-question"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {pendingQuestions.length === 0 && answeredQuestions.length === 0 && (
            <div className="text-center py-8 text-secondary">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No questions yet. Be the first to ask!</p>
            </div>
          )}
          
          {pendingQuestions.map((q) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
               className="bg-ink-raised rounded-xl p-3 border border-ink-edge"
            >
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVoteQuestion(q.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 p-2 h-auto",
                     q.hasVoted ? "text-accent-bright" : "text-muted hover:text-accent-bright"
                  )}
                  data-testid={`button-vote-question-${q.id}`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-bold">{q.votes}</span>
                </Button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-xs font-medium text-accent-bright">{q.username}</span>
                     <span className="text-[10px] text-muted">
                      {new Date(q.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                   <p className="text-sm text-body">{q.question}</p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {answeredQuestions.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-2">
                 <CheckCircle2 className="w-4 h-4 text-gain" />
                 <span className="text-xs font-medium text-gain">Answered</span>
              </div>
              {answeredQuestions.map((q) => (
                <div
                  key={q.id}
                   className="bg-gain/10 rounded-xl p-3 border border-gain/20 opacity-75"
                >
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-xs font-medium text-gain">{q.username}</span>
                     <CheckCircle2 className="w-3 h-3 text-gain" />
                  </div>
                   <p className="text-sm text-body">{q.question}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </Surface>
  );
}

function DebateScoreCard({ participant, onVote }: { participant: DebateParticipant; onVote: () => void }) {
  const sideColor = participant.side === 'pro' ? 'emerald' : 'rose';
  
  return (
    <motion.div
      className={cn(
        "bg-ink-surface/90 backdrop-blur-xl rounded-xl border p-4",
        participant.side === 'pro' ? 'border-gain/30' : 'border-loss/30'
      )}
      animate={participant.isSpeaking ? { borderColor: participant.side === 'pro' ? 'rgb(16, 185, 129)' : 'rgb(244, 63, 94)' } : {}}
    >
      <div className="flex items-center gap-3 mb-3">
        <HostAvatar host={{ id: participant.id, name: participant.name, avatar: participant.avatar, isAvatar: participant.isAvatar }} isSpeaking={participant.isSpeaking} size="sm" />
        <div>
           <h4 className="text-sm font-bold text-primary">{participant.name}</h4>
          <Badge className={cn(
            "text-[10px]",
             participant.side === 'pro' ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'
          )}>
            {participant.side === 'pro' ? '👍 PRO' : '👎 CON'}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
         <span className="text-xs text-secondary">Audience Score</span>
        <span className={cn(
          "text-lg font-bold",
           participant.side === 'pro' ? 'text-gain' : 'text-loss'
        )}>
          {participant.score}
        </span>
      </div>
      
      <Button
        onClick={onVote}
        className={cn(
          "w-full",
           participant.side === 'pro' 
             ? 'bg-gain hover:bg-gain/80' 
             : 'bg-loss hover:bg-loss/80'
        )}
        data-testid={`button-vote-${participant.side}`}
      >
        <Vote className="w-4 h-4 mr-2" />
        Vote for {participant.name}
      </Button>
    </motion.div>
  );
}

function DebateView({ 
  topic, 
  participants, 
  onVote,
  timeRemaining 
}: { 
  topic: string;
  participants: DebateParticipant[];
  onVote: (participantId: string) => void;
  timeRemaining?: number;
}) {
  const proParticipant = participants.find(p => p.side === 'pro');
  const conParticipant = participants.find(p => p.side === 'con');
  
  const totalVotes = participants.reduce((sum, p) => sum + p.score, 0);
  const proPercentage = totalVotes > 0 ? (proParticipant?.score || 0) / totalVotes * 100 : 50;
  
  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Swords className="w-5 h-5 text-accent-bright" />
          <span className="text-xs font-bold text-accent-bright uppercase tracking-wider">Live Debate</span>
        </div>
        <h2 className="text-lg font-bold text-primary">{topic}</h2>
        {timeRemaining && (
          <div className="flex items-center justify-center gap-2 mt-2 text-warn">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-medium">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>
      
      <div className="w-full h-3 bg-ink-raised rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-gain"
          initial={{ width: '50%' }}
          animate={{ width: `${proPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {proParticipant && (
          <DebateScoreCard 
            participant={proParticipant} 
            onVote={() => onVote(proParticipant.id)}
          />
        )}
        {conParticipant && (
          <DebateScoreCard 
            participant={conParticipant} 
            onVote={() => onVote(conParticipant.id)}
          />
        )}
      </div>
    </div>
  );
}

export function UnifiedStreamViewer({
  streamId,
  host,
  streamType,
  isLive,
  title,
  viewerCount,
  isDebate = false,
  debateParticipants = [],
  debateTopic,
  currentSpeaker,
  onSubmitQuestion,
  onVoteQuestion,
  onDebateVote,
  onAudioMessage,
}: UnifiedStreamViewerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState<string | null>(null);
  const [currentSegmentType, setCurrentSegmentType] = useState<string>('');
  const [showMobileOverlay, setShowMobileOverlay] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const [questions, setQuestions] = useState<StreamQuestion[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const isProcessingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const style = avatarStyles[isDebate ? 'debate' : streamType] || avatarStyles.broadcast;
  const TypeIcon = style.icon;

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0 || isMuted) {
      return;
    }

    isProcessingRef.current = true;
    const item = audioQueueRef.current.shift();
    
    if (!item) {
      isProcessingRef.current = false;
      return;
    }

    try {
      const audioContext = initAudioContext();
      
      const binaryString = atob(item.audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      currentSourceRef.current = source;
      setIsPlayingAudio(true);
      setIsSpeaking(true);
      setCurrentSpeechText(item.text);
      setCurrentSegmentType(item.segmentType);
      
      source.onended = () => {
        currentSourceRef.current = null;
        setIsPlayingAudio(false);
        setIsSpeaking(false);
        isProcessingRef.current = false;
        
        setTimeout(() => {
          setCurrentSpeechText(null);
        }, 2000);
        
        playNextInQueue();
      };
      
      source.start(0);
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Audio] Failed to play audio:', error);
      isProcessingRef.current = false;
      setIsPlayingAudio(false);
      setIsSpeaking(false);
      playNextInQueue();
    }
  }, [isMuted, initAudioContext]);

  const handleAudioMessage = useCallback((audio: AvatarAudioData) => {
    const queueItem: AudioQueueItem = {
      id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: audio.text,
      audioBase64: audio.audioBase64,
      segmentType: audio.segmentType,
    };
    
    audioQueueRef.current.push(queueItem);
    
    if (!isProcessingRef.current && !isMuted) {
      playNextInQueue();
    }
  }, [isMuted, playNextInQueue]);

  useEffect(() => {
    if (onAudioMessage) {
      const unsubscribe = onAudioMessage(handleAudioMessage);
      return unsubscribe;
    }
  }, [onAudioMessage, handleAudioMessage]);

  useEffect(() => {
    if (!isMuted && audioQueueRef.current.length > 0 && !isProcessingRef.current) {
      playNextInQueue();
    }
  }, [isMuted, playNextInQueue]);

  const handleEnableAudio = useCallback(() => {
    setShowMobileOverlay(false);
    setHasUserInteracted(true);
    initAudioContext();
    setIsMuted(false);
  }, [initAudioContext]);

  const toggleMute = useCallback(() => {
    setHasUserInteracted(true);
    if (isMuted) {
      initAudioContext();
    } else {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
      setIsPlayingAudio(false);
      setIsSpeaking(false);
      isProcessingRef.current = false;
    }
    setIsMuted(!isMuted);
  }, [isMuted, initAudioContext]);

  useEffect(() => {
    return () => {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSubmitQuestion = (question: string) => {
    const newQ: StreamQuestion = {
      id: `q-${Date.now()}`,
      userId: 'current-user',
      username: 'You',
      question,
      votes: 1,
      hasVoted: true,
      status: 'pending',
      timestamp: new Date(),
    };
    setQuestions(prev => [...prev, newQ]);
    onSubmitQuestion?.(question);
  };

  const handleVoteQuestion = (questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, votes: q.hasVoted ? q.votes - 1 : q.votes + 1, hasVoted: !q.hasVoted }
        : q
    ));
    onVoteQuestion?.(questionId);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-ink-page flex flex-col overflow-hidden">
      <FloatingParticles />
      
      <AnimatePresence>
        {showMobileOverlay && isLive && !hasUserInteracted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-ink-surface/90 backdrop-blur-sm"
            onClick={handleEnableAudio}
          >
            <motion.div className="flex flex-col items-center gap-4 p-8">
              <motion.div
                className="w-20 h-20 rounded-full bg-accent-core flex items-center justify-center shadow-2xl glow-accent"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Volume2 className="w-10 h-10 text-primary" />
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-semibold text-primary mb-1">Tap to Enable Audio</p>
                <p className="text-sm text-secondary">Listen to live commentary</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        {isLive && (
          <motion.div
            className="flex items-center gap-2 bg-loss/90 rounded-full px-3 py-1.5 shadow-lg"
            animate={{ opacity: [1, 0.8, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-xs font-bold text-primary tracking-wider">LIVE</span>
          </motion.div>
        )}
        
        <div className="flex items-center gap-2 bg-ink-surface/90 backdrop-blur-sm rounded-full px-3 py-1.5 border border-ink-edge">
          <Users className="w-3.5 h-3.5 text-accent-bright" />
          <span className="text-xs font-medium text-primary">{viewerCount || 0}</span>
        </div>
      </div>
      
      {isDebate && debateTopic && debateParticipants.length >= 2 ? (
        <div className="flex-1 flex flex-col">
          <DebateView
            topic={debateTopic}
            participants={debateParticipants}
            onVote={(id) => onDebateVote?.(id, 'pro')}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="flex flex-col items-center">
            <HostAvatar host={host} isSpeaking={isSpeaking} size="lg" />
            
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-center gap-2 mb-3 px-4 py-2 rounded-full bg-accent-core/20 border border-accent-core/40 backdrop-blur-sm">
                {host.isAvatar ? (
                  <>
                    <Bot className="w-4 h-4 text-accent-bright" />
                    <span className="text-xs font-bold text-accent-bright uppercase tracking-widest">AI Host</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-accent-bright" />
                    <span className="text-xs font-bold text-accent-bright uppercase tracking-widest">Creator</span>
                  </>
                )}
                <Sparkles className="w-3.5 h-3.5 text-accent-bright" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-primary mb-2">{host.name}</h3>
              {title && (
                <p className="text-sm text-secondary max-w-xs mx-auto mb-3">{title}</p>
              )}
              
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  className={cn(
                    "px-3 py-1.5 rounded-full bg-accent-core flex items-center gap-2 shadow-lg",
                    style.gradient
                  )}
                  animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
                >
                  <TypeIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary capitalize">
                    {streamType.replace('_', ' ')}
                  </span>
                </motion.div>
              </div>
            </motion.div>

            <div className="mt-6 h-12">
              <AnimatePresence mode="wait">
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="flex items-center gap-4 bg-ink-raised/90 backdrop-blur-xl rounded-full px-5 py-2.5 border-2 border-accent-core/40 shadow-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >
                      <Volume2 className="w-5 h-5 text-accent-bright" />
                    </motion.div>
                    <EnhancedSpeakingIndicator isActive={isSpeaking} />
                    <span className="text-sm text-body font-semibold tracking-wide">Speaking</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {currentSpeechText && (
          <SpeechBubble 
            text={currentSpeechText} 
            segmentType={currentSegmentType}
            speakerName={isDebate ? currentSpeaker : undefined}
          />
        )}
      </AnimatePresence>
      
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleMute}
            variant="outline"
            className={cn(
              "rounded-full border-2 min-h-[44px] px-4",
              isMuted 
                ? "border-loss/50 bg-loss/10 text-loss" 
                : "border-accent-core/50 bg-accent-core/10 text-accent-bright"
            )}
            data-testid="button-toggle-audio"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="ml-2 text-sm font-medium">{isMuted ? 'Listen' : 'Listening'}</span>
          </Button>
          
          {isPlayingAudio && !isMuted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-accent-core/20 rounded-full px-3 py-2 border border-ink-edge"
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-gain"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              <span className="text-sm text-accent-bright">Playing</span>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onSubmitQuestion && (
            <Button
              onClick={() => setShowQA(!showQA)}
              variant="outline"
              className={cn(
                "rounded-full border-2 min-h-[44px] px-4",
                showQA 
                  ? "border-accent-core bg-accent-core/20 text-accent-bright" 
                  : "border-ink-edge bg-ink-raised text-body"
              )}
              data-testid="button-toggle-qa"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="ml-2 text-sm font-medium">Q&A</span>
            </Button>
          )}
          
          <div className="flex items-center gap-2 bg-ink-surface/90 backdrop-blur-sm rounded-full px-4 py-2 border border-ink-edge">
            <Activity className="w-3 h-3 text-gain" />
            <span className="text-xs text-body font-medium">
              {host.isAvatar ? 'AI Powered' : 'Live'}
            </span>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showQA && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-16 right-4 bottom-20 w-80 z-30"
          >
            <QAPanel
              questions={questions}
              onSubmitQuestion={handleSubmitQuestion}
              onVoteQuestion={handleVoteQuestion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { QAPanel, DebateView, HostAvatar, SpeechBubble };
