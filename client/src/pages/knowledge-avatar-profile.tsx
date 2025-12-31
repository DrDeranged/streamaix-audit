import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft,
  Users, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Building2,
  DollarSign,
  Activity,
  Target,
  Star,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Twitter,
  Globe,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { EntrepreneurAnalytics } from "@/components/avatars/entrepreneur-analytics";
import { FollowButton } from "@/components/avatars/follow-button";
import { PortfolioSimulator } from "@/components/avatars/portfolio-simulator";
import { AvatarChatButton } from "@/components/avatars/avatar-chat-button";
import { InlineMarketCard } from "@/components/prediction/InlineMarketCard";

interface DatabaseAvatar {
  id: string;
  name: string;
  handle: string;
  bio: string;
  expertise: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  followerCount: number;
  verificationStatus: string;
  primaryInterests: string[];
  investmentFocus: string[];
  notableInvestments: string[];
  philosophicalViews: string[];
  recentThoughts: string[];
  netWorth: string | null;
  portfolioRoi: number | null;
  accuracyPercentage: number | null;
  influenceScore: number | null;
  investmentCount: number | null;
  investmentThesis?: string | null;
  bestCalls?: any[];
  worstCalls?: any[];
  recentActivity?: any[];
  category?: string | null;
  riskScore?: number | null;
  volatility?: number | null;
  marketOutlook?: string | null;
}

const getAvatarGradient = (name: string) => {
  const gradients: Record<string, string> = {
    'Naval Ravikant': 'from-slate-950 via-purple-950 to-slate-950',
    'Vitalik Buterin': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'Michael Saylor': 'from-slate-950 via-purple-950 to-cyan-950',
    'Brian Armstrong': 'from-purple-950 via-cyan-950 to-teal-950',
    'Changpeng Zhao': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'Cathie Wood': 'from-purple-950 via-fuchsia-950 to-purple-950',
    'Tyler Winklevoss': 'from-teal-950 via-cyan-950 to-purple-950',
    'Cameron Winklevoss': 'from-purple-950 via-cyan-950 to-cyan-950',
    'Balaji Srinivasan': 'from-cyan-950 via-purple-950 to-purple-950',
    'Paul Graham': 'from-slate-950 via-gray-950 to-zinc-950',
    'Elon Musk': 'from-slate-950 via-blue-950 to-slate-950',
    'Sam Altman': 'from-emerald-950 via-teal-950 to-cyan-950'
  };
  return gradients[name] || 'from-slate-950 via-gray-950 to-zinc-950';
};

const formatFollowerCount = (count: number | undefined | null) => {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const getAvatarProfileFallback = (name: string) => {
  const profiles: Record<string, any> = {
    'Naval Ravikant': { portfolioRoi: 2800, netWorth: '$1.2B', investmentThesis: 'Seek wealth, not money or status. Wealth is having assets that earn while you sleep.', investmentCount: 200, category: 'VC/Angel', riskScore: 65, volatility: 45, marketOutlook: 'Bullish on AI and crypto long-term' },
    'Vitalik Buterin': { portfolioRoi: 50000, netWorth: '$1.5B', investmentThesis: 'Build technology that empowers individuals and creates positive-sum games for humanity.', investmentCount: 50, category: 'Crypto Founder', riskScore: 80, volatility: 70, marketOutlook: 'Bullish on Ethereum and layer 2 scaling' },
    'Michael Saylor': { portfolioRoi: 400, netWorth: '$4B', investmentThesis: 'Bitcoin is digital property. Store of value for individuals, corporations, and nations.', investmentCount: 15, category: 'Bitcoin Maximalist', riskScore: 90, volatility: 85, marketOutlook: 'Extremely bullish on Bitcoin' },
    'Elon Musk': { portfolioRoi: 12000, netWorth: '$250B', investmentThesis: 'Invest in technologies that will change the trajectory of human civilization.', investmentCount: 30, category: 'Tech Visionary', riskScore: 95, volatility: 90, marketOutlook: 'Bullish on AI, space, and sustainable energy' },
    'Sam Altman': { portfolioRoi: 5000, netWorth: '$2B', investmentThesis: 'AI will be the most transformative technology in human history. Back ambitious founders.', investmentCount: 300, category: 'AI Pioneer', riskScore: 75, volatility: 60, marketOutlook: 'Extremely bullish on AGI development' },
  };
  return profiles[name] || { portfolioRoi: 100, netWorth: '$100M', investmentThesis: 'Strategic investments in emerging technologies.', investmentCount: 25, category: 'Investor', riskScore: 50, volatility: 50, marketOutlook: 'Cautiously optimistic' };
};

const getBestCalls = (name: string): any[] => {
  const bestCalls: Record<string, any[]> = {
    'Naval Ravikant': [
      { name: 'Twitter', date: '2022', entry: '$500M', current: '$44B', exit: '$44B', roi: '+8800%', outcome: 'Sold to Elon Musk. Exceptional exit from angel position.' },
      { name: 'Uber', date: '2009', entry: '$20K', current: '$120B', exit: '$120B', roi: '+600000%', outcome: 'Early angel investment yielded extraordinary returns.' },
      { name: 'Notion', date: '2018', entry: '$50K', current: '$10B', exit: '$10B', roi: '+20000%', outcome: 'Backed productivity platform through Series A.' }
    ],
    'Vitalik Buterin': [
      { name: 'Ethereum', date: '2015', entry: 'Founder', current: '$2.8T', exit: 'N/A', roi: 'Founder', outcome: 'Created Ethereum ecosystem.' },
      { name: 'Uniswap', date: '2018', entry: '$1.5M', current: '$15B', exit: '$15B', roi: '+900%', outcome: 'Early backer of AMM revolution.' }
    ],
    'Michael Saylor': [
      { name: 'Bitcoin', date: '2020', entry: '$2B', current: '$45B', exit: '$45B', roi: '+2150%', outcome: 'MicroStrategy treasury strategy became blueprint.' }
    ],
    'Elon Musk': [
      { name: 'Tesla', date: '2004', entry: '$6.5M', current: '$800B', exit: 'N/A', roi: '+12000000%', outcome: 'Transformed automotive industry with EVs.' },
      { name: 'SpaceX', date: '2002', entry: 'Founder', current: '$350B', exit: 'N/A', roi: 'Founder', outcome: 'Revolutionized space travel.' }
    ],
    'Sam Altman': [
      { name: 'OpenAI', date: '2015', entry: 'Founder', current: '$150B', exit: 'N/A', roi: 'Founder', outcome: 'Created ChatGPT phenomenon.' },
      { name: 'Stripe', date: '2011', entry: '$500K', current: '$95B', exit: '$95B', roi: '+19000%', outcome: 'YC bet on payments infrastructure.' }
    ]
  };
  return bestCalls[name] || [];
};

const getWorstCalls = (name: string): any[] => {
  const worstCalls: Record<string, any[]> = {
    'Naval Ravikant': [
      { name: 'Clubhouse', date: '2020', roi: '-40%', loss: '-$2M', outcome: 'Audio app overhyped during pandemic.' }
    ],
    'Vitalik Buterin': [
      { name: 'OmiseGO', date: '2017', roi: '-85%', loss: '-$8M', outcome: 'Plasma scaling solution failed to gain adoption.' }
    ],
    'Michael Saylor': [
      { name: 'Energy Sector', date: '2022', roi: '-45%', loss: '-$1B', outcome: 'Traditional energy underperformed.' }
    ],
    'Elon Musk': [
      { name: 'Twitter/X', date: '2022', roi: '-50%', loss: '-$22B', outcome: 'Acquisition now valued at half.' }
    ],
    'Sam Altman': [
      { name: 'Worldcoin', date: '2023', roi: '-60%', loss: '-$200M', outcome: 'WLD token crashed from launch.' }
    ]
  };
  return worstCalls[name] || [];
};

const getRecentActivity = (name: string) => {
  const activities: Record<string, Array<{type: string, text: string, time: string, impact: 'high' | 'medium' | 'low'}>> = {
    'Naval Ravikant': [
      { type: 'podcast', text: 'All-In Podcast appearance discussing AI regulation', time: '3d ago', impact: 'high' },
      { type: 'investment', text: 'Angel investment in Anthropic', time: '1w ago', impact: 'high' }
    ],
    'Vitalik Buterin': [
      { type: 'research', text: 'Blog post on Ethereum improvements', time: '1w ago', impact: 'high' },
      { type: 'conference', text: 'ETH Global hackathon keynote', time: '2w ago', impact: 'high' }
    ],
    'Michael Saylor': [
      { type: 'filing', text: 'MicroStrategy bought 5,445 BTC', time: '1w ago', impact: 'high' }
    ],
    'Elon Musk': [
      { type: 'announcement', text: 'xAI released Grok-2 AI model', time: '1w ago', impact: 'high' },
      { type: 'business', text: 'Tesla Cybertruck production hit 2,000/week', time: '2w ago', impact: 'high' }
    ],
    'Sam Altman': [
      { type: 'product', text: 'OpenAI launched advanced voice AI', time: '1w ago', impact: 'high' },
      { type: 'funding', text: 'OpenAI closed $6.6B at $157B valuation', time: '2w ago', impact: 'high' }
    ]
  };
  return activities[name] || [{ type: 'update', text: 'Recent market activity', time: '1w ago', impact: 'medium' }];
};

const getInfluenceScore = (followerCount: number | undefined | null, investments: number | undefined | null) => {
  const followers = followerCount || 0;
  const invCount = investments || 0;
  const followScore = Math.min(followers / 1000000 * 40, 40);
  const investScore = Math.min(invCount * 3, 30);
  const baseScore = 30;
  return Math.round(followScore + investScore + baseScore);
};

function AvatarMarketsSection({ avatarId, avatarName }: { avatarId: string; avatarName: string }) {
  const { data: marketsData, isLoading } = useQuery<{ markets: any[] }>({
    queryKey: ['/api/avatars', avatarId, 'markets'],
    enabled: !!avatarId,
  });

  const markets = marketsData?.markets || [];

  if (isLoading) {
    return (
      <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-500/50" />
            <span className="text-lg font-semibold text-white/50">Loading Markets...</span>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-slate-800/50 rounded-lg"></div>
            <div className="h-20 bg-slate-800/50 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (markets.length === 0) {
    return (
      <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span className="text-lg font-semibold text-white">Prediction Markets</span>
          </div>
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-6 text-center">
            <TrendingUp className="h-8 w-8 text-purple-500/30 mx-auto mb-2" />
            <span className="text-sm text-white/50">No prediction markets created by {avatarName} yet</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span className="text-lg font-semibold text-white">Live Prediction Markets</span>
          </div>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            {markets.length} Active
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {markets.slice(0, 4).map((market) => (
            <InlineMarketCard
              key={market.id}
              market={market}
              variant="mini"
              context="avatar"
            />
          ))}
        </div>
        
        {markets.length > 4 && (
          <div className="mt-4 text-center">
            <Link href="/markets">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                View all {markets.length} markets
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KnowledgeAvatarProfile() {
  const params = useParams();
  const id = params?.id;
  const { user } = useAuth();

  const { data: avatar, isLoading, error, isFetching } = useQuery<DatabaseAvatar>({
    queryKey: [`/api/avatars/by-id/${id}`],
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/80 border-red-500/30 p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Invalid Avatar Link</h2>
            <p className="text-white/60 mb-4">No avatar ID was provided.</p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">Loading avatar profile...</p>
        </div>
      </div>
    );
  }

  if (error || !avatar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/80 border-red-500/30 p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Avatar Not Found</h2>
            <p className="text-white/60 mb-4">The knowledge avatar you're looking for doesn't exist.</p>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const profileFallback = getAvatarProfileFallback(avatar.name);
  const portfolioRoi = avatar.portfolioRoi ?? profileFallback.portfolioRoi;
  const accuracyPercentage = avatar.accuracyPercentage ?? 50;
  const netWorth = avatar.netWorth || profileFallback.netWorth;
  const investmentThesis = avatar.investmentThesis || profileFallback.investmentThesis;
  const category = avatar.category || profileFallback.category;
  const riskScore = avatar.riskScore ?? profileFallback.riskScore;
  const volatility = avatar.volatility ?? profileFallback.volatility;
  const marketOutlook = avatar.marketOutlook || profileFallback.marketOutlook;
  const trend = portfolioRoi >= 0 ? 'up' : 'down';
  const influenceScore = avatar.influenceScore || getInfluenceScore(avatar.followerCount, avatar.notableInvestments?.length);

  const recentActivityData = (avatar.recentActivity && avatar.recentActivity.length > 0) 
    ? avatar.recentActivity 
    : getRecentActivity(avatar.name);
  
  const bestCallsData = (avatar.bestCalls && avatar.bestCalls.length > 0)
    ? avatar.bestCalls
    : getBestCalls(avatar.name);
  
  const worstCallsData = (avatar.worstCalls && avatar.worstCalls.length > 0)
    ? avatar.worstCalls
    : getWorstCalls(avatar.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <ScrollArea className="h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8"
          >
            <div className={`h-48 md:h-64 rounded-2xl bg-gradient-to-br ${getAvatarGradient(avatar.name)} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
              
              {/* Live indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-xs text-emerald-400 font-mono">LIVE</span>
              </div>
            </div>

            {/* Avatar and Info */}
            <div className="absolute bottom-0 left-6 transform translate-y-1/2 flex items-end gap-6">
              <div className="relative">
                <Avatar className="w-28 h-28 md:w-36 md:h-36 ring-4 ring-purple-500/40 border-4 border-slate-950 shadow-2xl">
                  <AvatarImage 
                    src={avatar.imageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                    alt={avatar.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white">
                    {avatar.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {avatar.verificationStatus === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full p-2 shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Name and Actions Bar */}
          <div className="mt-20 md:mt-24 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{avatar.name}</h1>
              <p className="text-purple-400 font-mono">@{avatar.handle}</p>
              <Badge variant="secondary" className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                {avatar.expertise}
              </Badge>
            </div>
            <div className="flex gap-3">
              <FollowButton
                avatarId={avatar.id}
                avatarName={avatar.name}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
              />
              <AvatarChatButton avatar={avatar} />
              {avatar.twitterHandle && (
                <a href={`https://twitter.com/${avatar.twitterHandle}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                    <Twitter className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {avatar.websiteUrl && (
                <a href={avatar.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                    <Globe className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats & Info */}
            <div className="space-y-6">
              {/* Key Stats */}
              <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-xl">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Key Metrics</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-400/80 font-mono uppercase">Portfolio ROI</span>
                        {trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div className={`text-2xl font-bold font-mono ${portfolioRoi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {portfolioRoi >= 0 ? '+' : ''}{portfolioRoi}%
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-400/80 font-mono uppercase">Accuracy</span>
                        <Target className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className={`text-2xl font-bold font-mono ${accuracyPercentage >= 80 ? 'text-emerald-400' : accuracyPercentage >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {accuracyPercentage}%
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-400/80 font-mono uppercase">Influence</span>
                        <Star className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-bold font-mono text-cyan-400">
                        {Math.round(influenceScore)}
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-400/80 font-mono uppercase">Net Worth</span>
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-emerald-400 truncate">
                        {netWorth}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-purple-500/20 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        Followers
                      </span>
                      <span className="font-mono font-bold text-cyan-400">{formatFollowerCount(avatar.followerCount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4" />
                        Investments
                      </span>
                      <span className="font-mono font-bold text-cyan-400">{avatar.notableInvestments?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Investment Thesis */}
              <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Investment Thesis</h3>
                  </div>
                  <p className="text-white/70 leading-relaxed">{investmentThesis}</p>
                  
                  <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <p className="text-sm text-white/50 mb-2">Market Outlook</p>
                    <p className="text-white/80">{marketOutlook}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {recentActivityData.slice(0, 5).map((activity: any, idx: number) => (
                      <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/10">
                        <p className="text-sm text-white/90 mb-2">{activity.text}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/50 font-mono">{activity.time}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              activity.impact === 'high' ? 'border-red-500/50 text-red-400' :
                              activity.impact === 'medium' ? 'border-yellow-500/50 text-yellow-400' :
                              'border-emerald-500/50 text-emerald-400'
                            }`}
                          >
                            {activity.impact}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Analytics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Performance Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-white">{formatFollowerCount(avatar.followerCount)}</span>
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-xs text-white/60">Total Followers</p>
                    <p className="text-xs text-emerald-400">+12.3% this month</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-bold ${portfolioRoi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {portfolioRoi >= 0 ? '+' : ''}{portfolioRoi}%
                      </span>
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-white/60">Portfolio ROI</p>
                    <p className="text-xs text-emerald-400">All-time returns</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-white">{accuracyPercentage}%</span>
                      <Target className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-xs text-white/60">Prediction Accuracy</p>
                    <p className="text-xs text-purple-400">Last 100 predictions</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-white truncate">{netWorth}</span>
                      <PieChart className="h-5 w-5 text-orange-400" />
                    </div>
                    <p className="text-xs text-white/60">Assets Under Management</p>
                    <p className="text-xs text-orange-400">Public portfolio</p>
                  </CardContent>
                </Card>
              </div>

              {/* Prediction Markets Section */}
              <AvatarMarketsSection avatarId={avatar.id} avatarName={avatar.name} />

              {/* Analytics Chart */}
              <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <EntrepreneurAnalytics 
                    entrepreneur={{
                      name: avatar.name,
                      investmentThesis: investmentThesis,
                      bestCalls: bestCallsData,
                      worstCalls: worstCallsData,
                      recentActivity: recentActivityData.map((activity: any) => ({
                        date: activity.time || 'Recent',
                        action: activity.text || 'Activity update',
                        details: `${(activity.type || 'update').toUpperCase()} - Market impact: ${activity.impact || 'medium'}`
                      })),
                      category: category,
                      riskScore: riskScore,
                      volatility: volatility,
                      marketOutlook: marketOutlook,
                      netWorth: netWorth,
                      portfolioRoi: portfolioRoi
                    }}
                    showThesis={false}
                    showMetrics={false}
                  />
                </CardContent>
              </Card>

              {/* Portfolio Simulator */}
              <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-xl">
                <CardContent className="p-6">
                  <PortfolioSimulator 
                    avatars={[{
                      id: avatar.id,
                      name: avatar.name,
                      handle: avatar.handle,
                      portfolioRoi: portfolioRoi,
                      riskScore: riskScore,
                      volatility: volatility,
                      accuracyPercentage: accuracyPercentage
                    }]}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
