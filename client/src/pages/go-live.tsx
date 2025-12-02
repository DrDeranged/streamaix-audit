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
  Radio
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
    description: 'Go live with video & audio to your audience',
    icon: Video,
    color: 'from-purple-500 to-fuchsia-500',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400',
  },
  {
    id: 'trading_room',
    name: 'Trading Room',
    description: 'Live market analysis & trading calls',
    icon: TrendingUp,
    color: 'from-emerald-500 to-cyan-500',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-400',
  },
  {
    id: 'audio_space',
    name: 'Crypto Space',
    description: 'Audio-only discussions with your community',
    icon: Headphones,
    color: 'from-cyan-500 to-blue-500',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-400',
  },
  {
    id: 'live_bounty',
    name: 'Live Bounty',
    description: 'Stream while completing a bounty challenge',
    icon: Target,
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-400',
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
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6">
            <Radio className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 font-orbitron">Go Live on StreamAiX</h1>
          <p className="text-slate-400 mb-6">Sign in to start streaming to your audience</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium px-8">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-white font-orbitron">Go Live</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              <Users className="w-3 h-3 mr-1" />
              {user?.username || 'Creator'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                step >= s 
                  ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white" 
                  : "bg-slate-800 text-slate-500"
              )}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "w-12 h-1 mx-2 rounded-full transition-all",
                  step > s ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" : "bg-slate-800"
                )} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-white mb-2 font-orbitron">Choose Your Stream Type</h2>
            <p className="text-slate-400 mb-6">Select how you want to go live with your audience</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {streamTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                
                return (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={cn(
                        "p-5 cursor-pointer transition-all duration-300",
                        "bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90",
                        isSelected 
                          ? `${type.borderColor} border-2 shadow-lg shadow-purple-500/20` 
                          : "border border-purple-500/20 hover:border-purple-500/40"
                      )}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-xl bg-gradient-to-br",
                          type.color
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{type.name}</h3>
                          <p className="text-sm text-slate-400">{type.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className={cn("w-5 h-5", type.textColor)} />
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedType}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-8"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-white mb-2 font-orbitron">Stream Details</h2>
            <p className="text-slate-400 mb-6">Tell your audience what your stream is about</p>

            <Card className="p-6 bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90 border border-purple-500/20">
              <div className="space-y-6">
                <div>
                  <Label className="text-white mb-2 block">Stream Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Bitcoin Price Analysis & Trading Signals"
                    className="bg-slate-900/50 border-purple-500/30 text-white"
                    maxLength={100}
                  />
                  <p className="text-xs text-slate-500 mt-1">{title.length}/100 characters</p>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will you be covering in this stream?"
                    className="bg-slate-900/50 border-purple-500/30 text-white min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500 mt-1">{description.length}/500 characters</p>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className={cn(
                          "cursor-pointer transition-all capitalize",
                          category === cat
                            ? "bg-purple-500/20 border-purple-500 text-purple-300"
                            : "border-purple-500/20 text-slate-400 hover:border-purple-500/40"
                        )}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Tags (comma separated)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="bitcoin, trading, analysis, crypto"
                    className="bg-slate-900/50 border-purple-500/30 text-white"
                  />
                </div>
              </div>
            </Card>

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-purple-500/30 text-purple-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!title.trim()}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-8"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-white mb-2 font-orbitron">Stream Settings</h2>
            <p className="text-slate-400 mb-6">Configure access and monetization for your stream</p>

            <Card className="p-6 bg-gradient-to-br from-slate-900/90 via-purple-900/10 to-slate-900/90 border border-purple-500/20">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-purple-500/10">
                  <div className="flex items-center gap-3">
                    {isPrivate ? <Lock className="w-5 h-5 text-amber-400" /> : <Globe className="w-5 h-5 text-cyan-400" />}
                    <div>
                      <p className="text-white font-medium">Private Stream</p>
                      <p className="text-sm text-slate-400">Only people with the link can join</p>
                    </div>
                  </div>
                  <Switch
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-purple-500/10">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Require Ticket</p>
                      <p className="text-sm text-slate-400">Viewers must pay STREAM to join</p>
                    </div>
                  </div>
                  <Switch
                    checked={requiresTicket}
                    onCheckedChange={setRequiresTicket}
                  />
                </div>

                {requiresTicket && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pl-12"
                  >
                    <Label className="text-white mb-2 block">Ticket Price (STREAM)</Label>
                    <Input
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      className="bg-slate-900/50 border-purple-500/30 text-white max-w-[200px]"
                      min="1"
                    />
                  </motion.div>
                )}
              </div>
            </Card>

            <Card className="mt-6 p-6 bg-gradient-to-br from-purple-900/30 via-fuchsia-900/20 to-purple-900/30 border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Stream Preview
              </h3>
              
              <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/50 border border-purple-500/20">
                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-br",
                  selectedTypeConfig?.color || 'from-purple-500 to-fuchsia-500'
                )}>
                  <TypeIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">{title || 'Untitled Stream'}</h4>
                  <p className="text-sm text-slate-400 mt-1">{description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 capitalize">
                      {category}
                    </Badge>
                    {isPrivate && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                    {requiresTicket && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                        <Ticket className="w-3 h-3 mr-1" />
                        {ticketPrice} STREAM
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="border-purple-500/30 text-purple-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStartStream}
                disabled={createStreamMutation.isPending}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 px-8 gap-2"
              >
                {createStreamMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
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
