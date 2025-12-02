import { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Coins, 
  Share2, 
  Heart,
  Send,
  Video,
  TrendingUp,
  Headphones,
  Target,
  Clock,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  streamType: string;
  hostId: string;
  hostUsername?: string;
  hostAvatar?: string;
  status: string;
  currentViewers: number;
  peakViewers?: number;
  totalTipsReceived: number;
  category?: string;
  tags?: string[];
  scheduledStart?: string;
  actualStart?: string;
  roomId?: string;
}

interface StreamMessage {
  id: string;
  userId: string;
  username?: string;
  content: string;
  messageType: string;
  createdAt: string;
}

const streamTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  broadcast: { icon: Video, label: 'Broadcast', color: 'purple' },
  trading_room: { icon: TrendingUp, label: 'Trading Room', color: 'emerald' },
  audio_space: { icon: Headphones, label: 'Audio Space', color: 'cyan' },
  live_bounty: { icon: Target, label: 'Live Bounty', color: 'amber' },
};

export default function StreamViewPage() {
  const [, params] = useRoute('/stream/:id');
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  
  const streamId = params?.id;
  
  const { data: streamData, isLoading } = useQuery<{ stream: LiveStream }>({
    queryKey: ['/api/streams', streamId],
    enabled: !!streamId,
    refetchInterval: 5000,
  });
  
  const { data: messagesData, refetch: refetchMessages } = useQuery<{ messages: StreamMessage[] }>({
    queryKey: ['/api/streams', streamId, 'messages'],
    enabled: !!streamId,
    refetchInterval: 3000,
  });
  
  const stream = streamData?.stream;
  const messages = messagesData?.messages || [];
  const config = stream ? streamTypeConfig[stream.streamType] || streamTypeConfig.broadcast : streamTypeConfig.broadcast;
  const Icon = config.icon;

  const handleSendMessage = async () => {
    if (!message.trim() || !isAuthenticated) return;
    
    try {
      const response = await fetch(`/api/streams/${streamId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: message }),
      });
      
      if (response.ok) {
        setMessage('');
        refetchMessages();
      }
    } catch (error) {
      toast({
        title: "Couldn't send message",
        variant: "destructive",
      });
    }
  };

  const handleTip = async () => {
    if (!tipAmount || !isAuthenticated) return;
    
    const amount = parseInt(tipAmount);
    if (isNaN(amount) || amount < 1) {
      toast({
        title: "Invalid tip amount",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/streams/${streamId}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });
      
      if (response.ok) {
        toast({
          title: "Tip sent!",
          description: `You tipped ${amount} STREAM to the streamer`,
        });
        setTipAmount('');
      } else {
        const data = await response.json();
        toast({
          title: "Couldn't send tip",
          description: data.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Couldn't send tip",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-purple-400">Loading stream...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold text-white">Stream not found</h1>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const isLive = stream.status === 'live';
  const isScheduled = stream.status === 'scheduled';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <Icon className="w-4 h-4 text-purple-400" />
              </div>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                {config.label}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isLive && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />
                LIVE
              </Badge>
            )}
            {isScheduled && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                <Calendar className="w-3 h-3 mr-1" />
                Scheduled
              </Badge>
            )}
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
              <Users className="w-3 h-3 mr-1" />
              {stream.currentViewers}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Area */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 aspect-video">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10">
                {isLive ? (
                  <div className="text-center">
                    <div className="p-6 rounded-full bg-purple-500/20 border border-purple-400/30 mb-4 inline-block">
                      <Icon className="w-12 h-12 text-purple-400" />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">Stream is Live</p>
                    <p className="text-sm text-slate-400">WebRTC integration coming soon</p>
                  </div>
                ) : isScheduled ? (
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-amber-400 mb-4 mx-auto" />
                    <p className="text-lg font-medium text-white mb-2">Stream Scheduled</p>
                    <p className="text-sm text-slate-400">
                      {stream.scheduledStart 
                        ? new Date(stream.scheduledStart).toLocaleString()
                        : 'Time TBD'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Video className="w-12 h-12 text-slate-500 mb-4 mx-auto" />
                    <p className="text-lg font-medium text-slate-400">Stream Ended</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Stream Info */}
            <Card className="p-4 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20">
              <h1 className="text-xl font-bold text-white mb-2">{stream.title}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white">
                    {stream.hostUsername?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">@{stream.hostUsername || 'anonymous'}</p>
                    <p className="text-xs text-slate-500">Host</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400">
                    <Heart className="w-4 h-4 mr-1" />
                    Follow
                  </Button>
                  <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {stream.description && (
                <p className="text-sm text-slate-400">{stream.description}</p>
              )}
              
              {stream.tags && stream.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {stream.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="border-purple-500/20 text-purple-400 text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Chat Sidebar */}
          <div className="space-y-4">
            {/* Tip Section */}
            <Card className="p-4 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                Send a Tip
              </h3>
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="bg-slate-900/50 border-purple-500/20 text-white"
                  min="1"
                />
                <Button 
                  onClick={handleTip}
                  disabled={!isAuthenticated || !tipAmount}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-0"
                >
                  Tip
                </Button>
              </div>
              
              {stream.totalTipsReceived > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  Total tips: {stream.totalTipsReceived.toLocaleString()} STREAM
                </p>
              )}
            </Card>

            {/* Chat */}
            <Card className="bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 border border-purple-500/20 flex flex-col h-[400px]">
              <div className="p-3 border-b border-purple-500/20">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-400" />
                  Live Chat
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No messages yet. Be the first to chat!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-medium text-purple-400">@{msg.username || 'anon'}: </span>
                      <span className="text-slate-300">{msg.content}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-purple-500/20">
                {isAuthenticated ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Send a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-slate-900/50 border-purple-500/20 text-white text-sm"
                    />
                    <Button 
                      size="icon"
                      onClick={handleSendMessage}
                      className="bg-purple-600 hover:bg-purple-500"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Link href="/auth">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500">
                      Sign in to Chat
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
