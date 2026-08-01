import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Video, 
  VideoOff,
  TrendingUp, 
  Headphones, 
  Target,
  Sparkles,
  Users,
  Lock,
  Globe,
  Ticket,
  CheckCircle,
  Loader2,
  Radio,
  ChevronRight,
  Mic,
  MicOff,
  SwitchCamera,
  AlertCircle,
  Camera,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useLiveKitStream } from '@/hooks/useLiveKitStream';

const streamTypes = [
  {
    id: 'broadcast',
    name: 'Video',
    icon: Video,
    color: 'bg-accent-core',
  },
  {
    id: 'trading_room',
    name: 'Trading',
    icon: TrendingUp,
    color: 'bg-gain',
  },
  {
    id: 'audio_space',
    name: 'Audio',
    icon: Headphones,
    color: 'bg-accent-deep',
  },
  {
    id: 'live_bounty',
    name: 'Bounty',
    icon: Target,
    color: 'bg-warn',
  },
];

const categories = [
  'crypto', 'trading', 'defi', 'nft', 'education', 'ama', 'news', 'analysis'
];

export default function GoLivePage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('broadcast');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('crypto');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [requiresTicket, setRequiresTicket] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('100');
  const [createdStreamId, setCreatedStreamId] = useState<string | null>(null);
  const [isGoingLive, setIsGoingLive] = useState(false);
  
  const {
    stream,
    videoEnabled: mediaVideoEnabled,
    audioEnabled: mediaAudioEnabled,
    error: mediaError,
    devices,
    startStream,
    stopStream,
    toggleVideo: mediaToggleVideo,
    toggleAudio: mediaToggleAudio,
    switchCamera,
  } = useMediaStream();
  
  const {
    isConnected: liveKitConnected,
    isPublishing,
    localVideoTrack,
    localAudioTrack,
    error: liveKitError,
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
    toggleVideo: liveKitToggleVideo,
    toggleAudio: liveKitToggleAudio,
    videoEnabled: liveKitVideoEnabled,
    audioEnabled: liveKitAudioEnabled,
    participantCount,
  } = useLiveKitStream(createdStreamId);
  
  const videoEnabled = createdStreamId ? liveKitVideoEnabled : mediaVideoEnabled;
  const audioEnabled = createdStreamId ? liveKitAudioEnabled : mediaAudioEnabled;
  const toggleVideo = createdStreamId ? liveKitToggleVideo : mediaToggleVideo;
  const toggleAudio = createdStreamId ? liveKitToggleAudio : mediaToggleAudio;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stopStream();
      }
      if (liveKitConnected) {
        disconnectLiveKit();
      }
    };
  }, [stream, liveKitConnected, stopStream, disconnectLiveKit]);

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/streams', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          streamType: selectedType,
          category,
          tags: [],
          isPrivate,
          requiresTicket,
          ticketPrice: requiresTicket ? parseInt(ticketPrice) : 0,
          status: 'live',
        }),
      });
      return response;
    },
    onSuccess: (data) => {
      setCreatedStreamId(data.stream.id);
    },
    onError: (error: any) => {
      setIsGoingLive(false);
      toast({
        title: "Couldn't start stream",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  useEffect(() => {
    if (createdStreamId && !liveKitConnected && !liveKitError) {
      console.log('[GoLive] Connecting to LiveKit for stream:', createdStreamId);
      connectLiveKit();
    }
  }, [createdStreamId, liveKitConnected, liveKitError, connectLiveKit]);
  
  useEffect(() => {
    if (isPublishing && createdStreamId) {
      toast({
        title: "You're live!",
        description: "Your stream has started successfully",
      });
      stopStream();
      setLocation(`/stream/${createdStreamId}`);
    }
  }, [isPublishing, createdStreamId, toast, stopStream, setLocation]);
  
  useEffect(() => {
    if (liveKitError && createdStreamId) {
      toast({
        title: "Connection failed",
        description: liveKitError,
        variant: "destructive",
      });
      setIsGoingLive(false);
    }
  }, [liveKitError, createdStreamId, toast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ink-page flex flex-col items-center justify-center gap-6 px-4 safe-area-inset">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-xl bg-accent-core flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-primary" />
          </div>
          <SectionTitle as="h1" className="mb-2 text-xl font-bold">Go Live on StreamAiX</SectionTitle>
          <p className="text-sm text-secondary mb-6">Sign in to start streaming</p>
          <Link href="/auth">
            <Button className="grad-accent glow-accent text-primary font-medium px-8 h-12 rounded-xl">
              Sign In to Stream
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleStartStream = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your stream",
        variant: "destructive",
      });
      return;
    }
    setIsGoingLive(true);
    createStreamMutation.mutate();
  };

  const selectedTypeConfig = streamTypes.find(t => t.id === selectedType);
  const TypeIcon = selectedTypeConfig?.icon || Video;
  const isAudioOnly = selectedType === 'audio_space';

  return (
    <div className="min-h-screen bg-ink-page safe-area-inset">
      <div className="border-b border-ink-divider bg-ink-surface/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
              className="text-secondary hover:text-primary h-10 w-10 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <SectionTitle as="h1" className="text-lg font-bold">Go Live</SectionTitle>
          </div>
          
          <div className="flex items-center gap-1.5">
            {[1, 2].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                   step >= s ? "bg-accent-core glow-accent" : "bg-ink-raised"
                )} 
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="flex gap-2">
              {streamTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                
                return (
                  <motion.button
                    key={type.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5",
                       isSelected
                         ? "border-accent-core bg-accent-core/10 glow-accent"
                         : "border-ink-edge bg-ink-surface"
                    )}
                    data-testid={`stream-type-${type.id}`}
                  >
                    <div className={cn(
                       "p-2 rounded-xl",
                       isSelected ? type.color : "bg-ink-surface"
                    )}>
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                       isSelected ? "text-primary" : "text-secondary"
                    )}>
                      {type.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your stream about?"
                 className="bg-ink-surface border-ink-edge text-primary h-12 text-base rounded-xl"
                maxLength={100}
                autoFocus
                data-testid="input-title"
              />
            </div>

             <Surface className="overflow-hidden">
               <div className="relative aspect-video bg-ink-raised">
                {stream && videoEnabled && !isAudioOnly ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {isAudioOnly ? (
                      <>
                        <motion.div
                          animate={audioEnabled && stream ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className={cn(
                             "p-5 rounded-xl",
                             audioEnabled && stream ? "bg-accent-core/20" : "bg-ink-surface"
                          )}
                        >
                          {audioEnabled && stream ? (
                             <Mic className="w-10 h-10 text-accent-bright" />
                          ) : (
                             <MicOff className="w-10 h-10 text-secondary" />
                          )}
                        </motion.div>
                         <p className="text-sm text-secondary">
                          {stream ? (audioEnabled ? 'Mic ready' : 'Mic muted') : 'Tap below to enable mic'}
                        </p>
                      </>
                    ) : (
                      <>
                         <div className="p-5 rounded-xl bg-ink-surface">
                           <VideoOff className="w-10 h-10 text-secondary" />
                        </div>
                         <p className="text-sm text-secondary">
                          {stream ? 'Camera off' : 'Tap below to enable camera'}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {stream && !isAudioOnly && (
                   <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-ink-page/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleVideo}
                      className={cn(
                        "p-2 rounded-full transition-all",
                         videoEnabled ? "bg-ink-raised text-primary" : "bg-loss/20 text-loss"
                      )}
                    >
                      {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleAudio}
                      className={cn(
                        "p-2 rounded-full transition-all",
                         audioEnabled ? "bg-ink-raised text-primary" : "bg-loss/20 text-loss"
                      )}
                    >
                      {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </motion.button>

                    {devices.videoDevices.length > 1 && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={switchCamera}
                         className="p-2 rounded-xl bg-ink-raised text-primary"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
             </Surface>

            <AnimatePresence>
              {mediaError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                   className="p-3 rounded-xl bg-loss/10 border border-loss/30 flex items-center gap-3"
                >
                   <AlertCircle className="w-5 h-5 text-loss flex-shrink-0" />
                   <p className="text-sm text-loss">{mediaError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!stream && (
              <Button
                onClick={async () => {
                  const constraints = isAudioOnly 
                    ? { video: false, audio: { echoCancellation: true, noiseSuppression: true } }
                    : undefined;
                  await startStream(constraints);
                }}
                 className="w-full bg-accent-deep hover:bg-accent-core h-12 rounded-xl"
                data-testid="button-enable-camera"
              >
                <Camera className="w-5 h-5 mr-2" />
                {isAudioOnly ? 'Enable Microphone' : 'Enable Camera'}
              </Button>
            )}

            {stream && (
                 <div className="flex items-center gap-2 p-3 rounded-xl bg-gain/10 border border-gain/30">
                 <CheckCircle className="w-5 h-5 text-gain" />
                 <span className="text-sm text-gain font-medium">
                  {isAudioOnly ? 'Microphone ready' : 'Camera & microphone ready'}
                </span>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!title.trim() || !stream}
                 className="w-full grad-accent glow-accent hover:bg-accent-deep h-12 text-base rounded-xl"
                data-testid="continue-step-1"
              >
                Next: Review & Go Live
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
             <Surface className="p-4 grad-surface">
              <div className="flex items-start gap-3">
                <div className={cn(
                   "p-2.5 rounded-xl flex-shrink-0",
                   selectedTypeConfig?.color || 'bg-accent-core'
                )}>
                  <TypeIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="text-primary font-semibold truncate">{title}</h3>
                   <p className="text-sm text-secondary capitalize mt-0.5">{selectedType?.replace('_', ' ')}</p>
                </div>
              </div>
             </Surface>

            <div>
               <Label className="text-primary mb-2 block text-sm">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers what you'll cover..."
                 className="bg-ink-surface border-ink-edge text-primary min-h-[80px] rounded-xl"
                maxLength={500}
                data-testid="input-description"
              />
            </div>

            <div>
               <Label className="text-primary mb-2 block text-sm">Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all capitalize py-1.5 px-3",
                      category === cat
                         ? "bg-accent-core/20 border-accent-core text-accent-bright"
                         : "border-ink-edge text-secondary"
                    )}
                    onClick={() => setCategory(cat)}
                    data-testid={`category-${cat}`}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
               className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
              data-testid="button-toggle-advanced"
            >
              <Settings2 className="w-4 h-4" />
              Advanced settings
              <ChevronRight className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-90")} />
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div 
                     className="flex items-center justify-between p-3 rounded-xl bg-ink-raised border border-ink-edge"
                    onClick={() => setIsPrivate(!isPrivate)}
                  >
                    <div className="flex items-center gap-3">
                       {isPrivate ? <Lock className="w-4 h-4 text-warn" /> : <Globe className="w-4 h-4 text-accent-bright" />}
                      <div>
                         <p className="text-primary font-medium text-sm">Private Stream</p>
                         <p className="text-xs text-secondary">Only people with link can join</p>
                      </div>
                    </div>
                    <Switch
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                      data-testid="switch-private"
                    />
                  </div>

                  <div 
                     className="flex items-center justify-between p-3 rounded-xl bg-ink-raised border border-ink-edge"
                    onClick={() => setRequiresTicket(!requiresTicket)}
                  >
                    <div className="flex items-center gap-3">
                       <Ticket className="w-4 h-4 text-warn" />
                      <div>
                         <p className="text-primary font-medium text-sm">Require Ticket</p>
                         <p className="text-xs text-secondary">Viewers pay STREAM to join</p>
                      </div>
                    </div>
                    <Switch
                      checked={requiresTicket}
                      onCheckedChange={setRequiresTicket}
                      data-testid="switch-ticket"
                    />
                  </div>

                  {requiresTicket && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pl-10"
                    >
                       <Label className="text-primary mb-1.5 block text-sm">Price (STREAM)</Label>
                      <Input
                        type="number"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                         className="bg-ink-surface border-ink-edge text-primary h-10 max-w-[120px] rounded-xl"
                        min="1"
                        data-testid="input-ticket-price"
                      />
                      {isAuthenticated && user && (
                         <p className="text-xs text-secondary mt-1.5">
                           Your balance: <span className="text-accent-bright font-medium tabular">{Number(user.streamPoints || 0).toLocaleString()} STREAM</span>
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                 className="flex-1 border-ink-edge text-accent-bright h-12 rounded-xl"
                data-testid="back-step-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStartStream}
                disabled={isGoingLive || createStreamMutation.isPending}
                 className="flex-[2] bg-loss hover:bg-loss/80 h-12 gap-2 font-semibold rounded-xl"
                data-testid="button-go-live"
              >
                {isGoingLive ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {createdStreamId ? 'Connecting to LiveKit...' : 'Creating stream...'}
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5" />
                    Go Live
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
