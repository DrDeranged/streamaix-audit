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
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useMediaStream } from '@/hooks/useMediaStream';

const streamTypes = [
  {
    id: 'broadcast',
    name: 'Video',
    icon: Video,
    color: 'from-purple-500 to-fuchsia-500',
  },
  {
    id: 'trading_room',
    name: 'Trading',
    icon: TrendingUp,
    color: 'from-emerald-500 to-cyan-500',
  },
  {
    id: 'audio_space',
    name: 'Audio',
    icon: Headphones,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'live_bounty',
    name: 'Bounty',
    icon: Target,
    color: 'from-amber-500 to-orange-500',
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
  
  const {
    stream,
    videoEnabled,
    audioEnabled,
    error: mediaError,
    devices,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
    switchCamera,
  } = useMediaStream();

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
    };
  }, []);

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
      toast({
        title: "You're live!",
        description: "Your stream has started successfully",
      });
      setLocation(`/stream/${data.stream.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't start stream",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex flex-col items-center justify-center gap-6 px-4 safe-area-inset">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2 font-orbitron">Go Live on StreamAiX</h1>
          <p className="text-sm text-slate-400 mb-6">Sign in to start streaming</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium px-8 h-12">
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
    createStreamMutation.mutate();
  };

  const selectedTypeConfig = streamTypes.find(t => t.id === selectedType);
  const TypeIcon = selectedTypeConfig?.icon || Video;
  const isAudioOnly = selectedType === 'audio_space';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset">
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
              className="text-slate-400 hover:text-white h-10 w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-white font-orbitron">Go Live</h1>
          </div>
          
          <div className="flex items-center gap-1.5">
            {[1, 2].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  step >= s ? "bg-purple-500" : "bg-slate-700"
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
                        ? "border-purple-500 bg-purple-500/10" 
                        : "border-slate-700 bg-slate-800/50"
                    )}
                    data-testid={`stream-type-${type.id}`}
                  >
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-br",
                      isSelected ? type.color : "from-slate-700 to-slate-600"
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-white" : "text-slate-400"
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
                className="bg-slate-900/50 border-purple-500/30 text-white h-12 text-base"
                maxLength={100}
                autoFocus
                data-testid="input-title"
              />
            </div>

            <Card className="overflow-hidden bg-slate-900 border border-purple-500/20">
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
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
                            "p-5 rounded-full",
                            audioEnabled && stream ? "bg-cyan-500/20" : "bg-slate-700/50"
                          )}
                        >
                          {audioEnabled && stream ? (
                            <Mic className="w-10 h-10 text-cyan-400" />
                          ) : (
                            <MicOff className="w-10 h-10 text-slate-400" />
                          )}
                        </motion.div>
                        <p className="text-sm text-slate-400">
                          {stream ? (audioEnabled ? 'Mic ready' : 'Mic muted') : 'Tap below to enable mic'}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="p-5 rounded-full bg-slate-700/50">
                          <VideoOff className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400">
                          {stream ? 'Camera off' : 'Tap below to enable camera'}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {stream && !isAudioOnly && (
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleVideo}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        videoEnabled ? "bg-white/10 text-white" : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleAudio}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        audioEnabled ? "bg-white/10 text-white" : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </motion.button>

                    {devices.videoDevices.length > 1 && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={switchCamera}
                        className="p-2 rounded-full bg-white/10 text-white"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <AnimatePresence>
              {mediaError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{mediaError}</p>
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
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 h-12"
                data-testid="button-enable-camera"
              >
                <Camera className="w-5 h-5 mr-2" />
                {isAudioOnly ? 'Enable Microphone' : 'Enable Camera'}
              </Button>
            )}

            {stream && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">
                  {isAudioOnly ? 'Microphone ready' : 'Camera & microphone ready'}
                </span>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!title.trim() || !stream}
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 h-12 text-base"
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
            <Card className="p-4 bg-gradient-to-br from-purple-900/30 via-fuchsia-900/20 to-purple-900/30 border border-purple-500/30">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl bg-gradient-to-br flex-shrink-0",
                  selectedTypeConfig?.color || 'from-purple-500 to-fuchsia-500'
                )}>
                  <TypeIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{title}</h3>
                  <p className="text-sm text-slate-400 capitalize mt-0.5">{selectedType?.replace('_', ' ')}</p>
                </div>
              </div>
            </Card>

            <div>
              <Label className="text-white mb-2 block text-sm">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers what you'll cover..."
                className="bg-slate-900/50 border-purple-500/30 text-white min-h-[80px]"
                maxLength={500}
                data-testid="input-description"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block text-sm">Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all capitalize py-1.5 px-3",
                      category === cat
                        ? "bg-purple-500/20 border-purple-500 text-purple-300"
                        : "border-purple-500/20 text-slate-400"
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
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
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
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-purple-500/10"
                    onClick={() => setIsPrivate(!isPrivate)}
                  >
                    <div className="flex items-center gap-3">
                      {isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-cyan-400" />}
                      <div>
                        <p className="text-white font-medium text-sm">Private Stream</p>
                        <p className="text-xs text-slate-400">Only people with link can join</p>
                      </div>
                    </div>
                    <Switch
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                      data-testid="switch-private"
                    />
                  </div>

                  <div 
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-purple-500/10"
                    onClick={() => setRequiresTicket(!requiresTicket)}
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-white font-medium text-sm">Require Ticket</p>
                        <p className="text-xs text-slate-400">Viewers pay STREAM to join</p>
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
                      <Label className="text-white mb-1.5 block text-sm">Price (STREAM)</Label>
                      <Input
                        type="number"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        className="bg-slate-900/50 border-purple-500/30 text-white h-10 max-w-[120px]"
                        min="1"
                        data-testid="input-ticket-price"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-purple-500/30 text-purple-400 h-12"
                data-testid="back-step-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStartStream}
                disabled={createStreamMutation.isPending}
                className="flex-[2] bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 h-12 gap-2 font-semibold"
                data-testid="button-go-live"
              >
                {createStreamMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
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
