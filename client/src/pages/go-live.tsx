import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Video, 
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
  ChevronRight
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

const streamTypes = [
  {
    id: 'broadcast',
    name: 'Creator Broadcast',
    description: 'Go live with video & audio',
    icon: Video,
    color: 'from-purple-500 to-fuchsia-500',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  {
    id: 'trading_room',
    name: 'Trading Room',
    description: 'Live market analysis',
    icon: TrendingUp,
    color: 'from-emerald-500 to-cyan-500',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  {
    id: 'audio_space',
    name: 'Crypto Space',
    description: 'Audio-only discussions',
    icon: Headphones,
    color: 'from-cyan-500 to-blue-500',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  {
    id: 'live_bounty',
    name: 'Live Bounty',
    description: 'Stream while doing bounty',
    icon: Target,
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
  },
];

const categories = [
  'crypto', 'trading', 'defi', 'nft', 'education', 'ama', 'news', 'analysis', 'gaming', 'other'
];

export default function GoLivePage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('crypto');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresTicket, setRequiresTicket] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('100');

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/streams', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          streamType: selectedType,
          category,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
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
        description: error.message || "Something went wrong on our end. Please try again later.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex flex-col items-center justify-center gap-6 px-4 safe-area-inset">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 font-orbitron">Go Live on StreamAiX</h1>
          <p className="text-sm sm:text-base text-slate-400 mb-6">Sign in to start streaming to your audience</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium px-8 h-12 text-base">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 safe-area-inset">
      {/* Mobile-optimized Header */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-10 w-10 sm:w-auto sm:h-9 p-0 sm:px-3">
                <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-2">Back</span>
              </Button>
            </Link>
            <h1 className="text-base sm:text-lg font-bold text-white font-orbitron">Go Live</h1>
          </div>
          
          <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs sm:text-sm">
            <Users className="w-3 h-3 mr-1" />
            <span className="max-w-[80px] truncate">{user?.username || 'Creator'}</span>
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24">
        {/* Progress Steps - Mobile Optimized */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all",
                step >= s 
                  ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white" 
                  : "bg-slate-800 text-slate-500"
              )}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "w-8 sm:w-12 h-1 mx-1 sm:mx-2 rounded-full transition-all",
                  step > s ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" : "bg-slate-800"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Stream Type */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 font-orbitron">Choose Stream Type</h2>
            <p className="text-sm text-slate-400 mb-4 sm:mb-6">Select how you want to go live</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {streamTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                
                return (
                  <motion.div
                    key={type.id}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={cn(
                        "p-4 sm:p-5 cursor-pointer transition-all duration-300 active:scale-[0.98]",
                        "bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90",
                        isSelected 
                          ? `${type.borderColor} border-2 shadow-lg shadow-purple-500/20` 
                          : "border border-purple-500/20 hover:border-purple-500/40"
                      )}
                      onClick={() => setSelectedType(type.id)}
                      data-testid={`stream-type-${type.id}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={cn(
                          "p-2.5 sm:p-3 rounded-xl bg-gradient-to-br flex-shrink-0",
                          type.color
                        )}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-white">{type.name}</h3>
                          <p className="text-xs sm:text-sm text-slate-400 truncate">{type.description}</p>
                        </div>
                        {isSelected ? (
                          <CheckCircle className={cn("w-5 h-5 flex-shrink-0", type.textColor)} />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 sm:mt-8 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedType}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 h-12 sm:h-10 text-base sm:text-sm px-8"
                data-testid="continue-step-1"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Stream Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 font-orbitron">Stream Details</h2>
            <p className="text-sm text-slate-400 mb-4 sm:mb-6">Tell your audience what your stream is about</p>

            <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90 border border-purple-500/20">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <Label className="text-white mb-2 block text-sm sm:text-base">Stream Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Bitcoin Price Analysis"
                    className="bg-slate-900/50 border-purple-500/30 text-white h-12 sm:h-10 text-base sm:text-sm"
                    maxLength={100}
                    data-testid="input-title"
                  />
                  <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
                </div>

                <div>
                  <Label className="text-white mb-2 block text-sm sm:text-base">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will you be covering?"
                    className="bg-slate-900/50 border-purple-500/30 text-white min-h-[80px] sm:min-h-[100px] text-base sm:text-sm"
                    maxLength={500}
                    data-testid="input-description"
                  />
                  <p className="text-xs text-slate-500 mt-1">{description.length}/500</p>
                </div>

                <div>
                  <Label className="text-white mb-2 block text-sm sm:text-base">Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className={cn(
                          "cursor-pointer transition-all capitalize py-2 px-3 text-xs sm:text-sm",
                          category === cat
                            ? "bg-purple-500/20 border-purple-500 text-purple-300"
                            : "border-purple-500/20 text-slate-400 hover:border-purple-500/40"
                        )}
                        onClick={() => setCategory(cat)}
                        data-testid={`category-${cat}`}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block text-sm sm:text-base">Tags (comma separated)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="bitcoin, trading, analysis"
                    className="bg-slate-900/50 border-purple-500/30 text-white h-12 sm:h-10 text-base sm:text-sm"
                    data-testid="input-tags"
                  />
                </div>
              </div>
            </Card>

            <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-purple-500/30 text-purple-400 h-12 sm:h-10"
                data-testid="back-step-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!title.trim()}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 h-12 sm:h-10 px-8"
                data-testid="continue-step-2"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Stream Settings */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 font-orbitron">Stream Settings</h2>
            <p className="text-sm text-slate-400 mb-4 sm:mb-6">Configure access and monetization</p>

            <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90 border border-purple-500/20">
              <div className="space-y-4">
                {/* Private Stream Toggle */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/10 min-h-[72px]"
                  onClick={() => setIsPrivate(!isPrivate)}
                >
                  <div className="flex items-center gap-3">
                    {isPrivate ? <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" /> : <Globe className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">Private Stream</p>
                      <p className="text-xs sm:text-sm text-slate-400">Only people with the link can join</p>
                    </div>
                  </div>
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                    className="flex-shrink-0"
                    data-testid="switch-private"
                  />
                </div>

                {/* Require Ticket Toggle */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/10 min-h-[72px]"
                  onClick={() => setRequiresTicket(!requiresTicket)}
                >
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">Require Ticket</p>
                      <p className="text-xs sm:text-sm text-slate-400">Viewers must pay STREAM to join</p>
                    </div>
                  </div>
                  <Switch
                    checked={requiresTicket}
                    onCheckedChange={setRequiresTicket}
                    className="flex-shrink-0"
                    data-testid="switch-ticket"
                  />
                </div>

                {requiresTicket && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pl-4 sm:pl-12"
                  >
                    <Label className="text-white mb-2 block text-sm">Ticket Price (STREAM)</Label>
                    <Input
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      className="bg-slate-900/50 border-purple-500/30 text-white h-12 sm:h-10 max-w-[150px] sm:max-w-[200px]"
                      min="1"
                      data-testid="input-ticket-price"
                    />
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Stream Preview */}
            <Card className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-purple-900/30 via-fuchsia-900/20 to-purple-900/30 border border-purple-500/30">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Stream Preview
              </h3>
              
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-purple-500/20">
                <div className={cn(
                  "p-2.5 sm:p-3 rounded-xl bg-gradient-to-br flex-shrink-0",
                  selectedTypeConfig?.color || 'from-purple-500 to-fuchsia-500'
                )}>
                  <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-sm sm:text-base truncate">{title || 'Untitled Stream'}</h4>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">{description || 'No description'}</p>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 capitalize text-xs">
                      {category}
                    </Badge>
                    {isPrivate && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                    {requiresTicket && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                        <Ticket className="w-3 h-3 mr-1" />
                        {ticketPrice}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="border-purple-500/30 text-purple-400 h-12 sm:h-10"
                data-testid="back-step-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStartStream}
                disabled={createStreamMutation.isPending}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 h-14 sm:h-11 px-8 gap-2 text-base sm:text-sm font-semibold"
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
                    Go Live Now
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
