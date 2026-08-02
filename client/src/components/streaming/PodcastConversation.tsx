import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Loader2,
  MessageCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { cn } from '@/lib/utils';

interface ConversationExchange {
  speakerName: string;
  speakerId: string;
  content: string;
  audioBase64?: string;
  timestamp: number;
  isIntroduction?: boolean;
}

interface ConversationData {
  success: boolean;
  isLive: boolean;
  debate: {
    id: string;
    topic: string;
    status: string;
    currentRound: number;
    maxRounds: number;
    avatar1: {
      id: string;
      name: string;
      imageUrl?: string;
    };
    avatar2: {
      id: string;
      name: string;
      imageUrl?: string;
    };
    exchanges: ConversationExchange[];
  };
  stats?: {
    viewerCount: number;
    totalTips: number;
  };
}

interface PodcastConversationProps {
  debateId: string;
  onBack?: () => void;
}

export function PodcastConversation({ debateId, onBack }: PodcastConversationProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const { data, isLoading, error } = useQuery<ConversationData>({
    queryKey: ['/api/debates', debateId, 'state'],
    refetchInterval: 30000,
  });

  const conversation = data?.debate;
  const exchanges = conversation?.exchanges || [];
  const isLive = data?.isLive || false;
  const currentExchange = exchanges[currentExchangeIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (scrollRef.current && currentExchangeIndex >= 0) {
      const element = scrollRef.current.children[currentExchangeIndex] as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentExchangeIndex]);

  const playExchange = (index: number) => {
    if (!exchanges[index]?.audioBase64 || !audioRef.current) return;
    
    setCurrentExchangeIndex(index);
    audioRef.current.src = `data:audio/mp3;base64,${exchanges[index].audioBase64}`;
    audioRef.current.play().catch(console.error);
    setIsPlaying(true);
    setHasStarted(true);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (hasStarted) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else {
      const firstAudioIndex = exchanges.findIndex((e: ConversationExchange) => e.audioBase64);
      if (firstAudioIndex >= 0) {
        playExchange(firstAudioIndex);
      }
    }
  };

  const handleNext = () => {
    const nextIndex = exchanges.findIndex((e: ConversationExchange, i: number) => i > currentExchangeIndex && e.audioBase64);
    if (nextIndex >= 0) {
      playExchange(nextIndex);
    }
  };

  const handlePrevious = () => {
    let prevIndex = -1;
    for (let i = currentExchangeIndex - 1; i >= 0; i--) {
      if (exchanges[i]?.audioBase64) {
        prevIndex = i;
        break;
      }
    }
    if (prevIndex >= 0) {
      playExchange(prevIndex);
    }
  };

  const handleAudioEnded = () => {
    const nextIndex = exchanges.findIndex((e: ConversationExchange, i: number) => i > currentExchangeIndex && e.audioBase64);
    if (nextIndex >= 0) {
      playExchange(nextIndex);
    } else {
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = exchanges.length * 30;
  const estimatedProgress = (currentExchangeIndex / Math.max(exchanges.length, 1)) * 100;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent-bright mx-auto mb-4" />
          <p className="text-secondary">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-10 h-10 text-muted mx-auto mb-4" />
          <p className="text-secondary">Conversation not found</p>
          {onBack && (
            <Button variant="outline" className="mt-4" onClick={onBack}>
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  const hasAudio = exchanges.some((e: ConversationExchange) => e.audioBase64);

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        className="hidden"
        onTimeUpdate={(e) => setAudioProgress(e.currentTarget.currentTime)}
        onDurationChange={(e) => setAudioDuration(e.currentTarget.duration)}
        onEnded={handleAudioEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <Surface className="overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <SectionTitle as="h2" className="mb-2">{conversation.topic}</SectionTitle>
            <div className="flex items-center justify-center gap-2 text-sm text-secondary">
              {isLive ? (
                <span className="flex items-center gap-1 text-loss">
                  <span className="w-2 h-2 bg-loss rounded-full animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="text-gain">Completed</span>
              )}
              <span>•</span>
              <span>{exchanges.length} exchanges</span>
              {data?.stats && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {data.stats.viewerCount}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className={cn(
                       "w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-500 mx-auto",
                currentExchange?.speakerName === conversation.avatar1.name && isPlaying
                   ? "border-accent-core glow-accent scale-110"
                   : "border-ink-edge"
              )}>
                {conversation.avatar1.imageUrl ? (
                  <img
                    src={conversation.avatar1.imageUrl}
                    alt={conversation.avatar1.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-accent-deep flex items-center justify-center text-2xl font-bold text-primary">
                    {conversation.avatar1.name[0]}
                  </div>
                )}
              </div>
               <p className="text-sm text-primary mt-2 font-medium">{conversation.avatar1.name}</p>
              {currentExchange?.speakerName === conversation.avatar1.name && isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                   className="text-xs text-accent-bright mt-1"
                >
                  Speaking...
                </motion.div>
              )}
            </div>

            <div className="flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-accent-core flex items-center justify-center">
                 <MessageCircle className="w-6 h-6 text-primary" />
              </div>
            </div>

            <div className="text-center">
              <div className={cn(
                "w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-500 mx-auto",
                currentExchange?.speakerName === conversation.avatar2.name && isPlaying
                   ? "border-accent-core glow-accent scale-110"
                   : "border-ink-edge"
              )}>
                {conversation.avatar2.imageUrl ? (
                  <img
                    src={conversation.avatar2.imageUrl}
                    alt={conversation.avatar2.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-accent-deep flex items-center justify-center text-2xl font-bold text-primary">
                    {conversation.avatar2.name[0]}
                  </div>
                )}
              </div>
               <p className="text-sm text-primary mt-2 font-medium">{conversation.avatar2.name}</p>
              {currentExchange?.speakerName === conversation.avatar2.name && isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                   className="text-xs text-accent-bright mt-1"
                >
                  Speaking...
                </motion.div>
              )}
            </div>
          </div>

          {hasAudio && (
             <Surface variant="raised" className="p-4 mb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={currentExchangeIndex === 0}
                   className="text-secondary hover:text-primary"
                  data-testid="button-previous"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  className={cn(
                     "w-16 h-16 rounded-full transition-all grad-accent glow-accent",
                    isPlaying
                       ? "bg-accent-deep"
                       : "bg-accent-core"
                  )}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? (
                     <Pause className="w-7 h-7 text-primary" />
                  ) : (
                     <Play className="w-7 h-7 text-primary ml-1" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentExchangeIndex >= exchanges.length - 1}
                   className="text-secondary hover:text-primary"
                  data-testid="button-next"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                   className={cn("text-secondary hover:text-primary", isMuted && "text-loss")}
                  data-testid="button-mute"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
              </div>

              <div className="space-y-2">
                <Progress value={estimatedProgress} className="h-1" />
                 <div className="flex justify-between text-xs text-muted tabular">
                  <span>{currentExchangeIndex + 1} / {exchanges.length}</span>
                  <span>~{Math.ceil(exchanges.length * 0.5)} min</span>
                </div>
              </div>
            </Surface>
          )}

          {!hasAudio && exchanges.length > 0 && (
             <div className="bg-warn/10 border border-warn/30 rounded-xl p-3 mb-4 text-center">
               <p className="text-warn text-sm">Audio not available for this conversation</p>
            </div>
          )}
        </div>

         <div className="border-t border-ink-divider">
          <div className="p-4 pb-2">
             <SectionTitle as="h3" className="text-sm font-semibold mb-3">Conversation</SectionTitle>
          </div>
          
          <div
            ref={scrollRef}
            className="max-h-96 overflow-y-auto px-4 pb-4 space-y-3"
          >
            <AnimatePresence>
              {exchanges.map((exchange, index) => {
                const isAvatar1 = exchange.speakerName === conversation.avatar1.name;
                const isCurrentlySpeaking = index === currentExchangeIndex && isPlaying;
                
                return (
                  <motion.div
                    key={`${exchange.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                       "flex gap-3 p-3 rounded-xl transition-all cursor-pointer",
                      isCurrentlySpeaking
                         ? "bg-accent-core/20 border border-accent-core/30"
                        : index === currentExchangeIndex
                         ? "bg-ink-raised"
                         : "hover:bg-ink-raised"
                    )}
                    onClick={() => exchange.audioBase64 && playExchange(index)}
                    data-testid={`exchange-${index}`}
                  >
                    <div className={cn(
                       "w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border-2",
                      isCurrentlySpeaking
                         ? "border-accent-core"
                        : "border-transparent"
                    )}>
                      {isAvatar1 ? (
                        conversation.avatar1.imageUrl ? (
                          <img src={conversation.avatar1.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full bg-accent-deep flex items-center justify-center text-xs text-primary font-bold">
                            {conversation.avatar1.name[0]}
                          </div>
                        )
                      ) : (
                        conversation.avatar2.imageUrl ? (
                          <img src={conversation.avatar2.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full bg-accent-deep flex items-center justify-center text-xs text-primary font-bold">
                            {conversation.avatar2.name[0]}
                          </div>
                        )
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-sm font-medium",
                           "text-accent-bright"
                        )}>
                          {exchange.speakerName}
                        </span>
                        {exchange.isIntroduction && (
                           <span className="text-xs text-warn bg-warn/10 px-1.5 py-0.5 rounded-xl">
                            Intro
                          </span>
                        )}
                        {isCurrentlySpeaking && (
                          <span className="flex items-center gap-1">
                             <span className="w-1.5 h-1.5 bg-gain rounded-full animate-pulse" />
                             <span className="w-1.5 h-1.5 bg-gain rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                             <span className="w-1.5 h-1.5 bg-gain rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm",
                         isCurrentlySpeaking ? "text-primary" : "text-body"
                      )}>
                        {exchange.content}
                      </p>
                    </div>

                    {exchange.audioBase64 && !isCurrentlySpeaking && (
                      <div className="flex-shrink-0">
                         <Play className="w-4 h-4 text-muted" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {exchanges.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted">Waiting for conversation to begin...</p>
              </div>
            )}
          </div>
        </div>
      </Surface>
    </div>
  );
}
