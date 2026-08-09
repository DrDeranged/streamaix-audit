import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";
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
import { PageHeader } from "@/components/PageHeader";

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
    'Naval Ravikant': 'grad-surface',
    'Vitalik Buterin': 'grad-surface',
    'Michael Saylor': 'grad-surface',
    'Brian Armstrong': 'grad-surface',
    'Changpeng Zhao': 'grad-surface',
    'Cathie Wood': 'grad-surface',
    'Tyler Winklevoss': 'grad-surface',
    'Cameron Winklevoss': 'grad-surface',
    'Balaji Srinivasan': 'grad-surface',
    'Paul Graham': 'grad-surface',
    'Elon Musk': 'grad-surface',
    'Sam Altman': 'grad-surface'
  };
  return gradients[name] || 'grad-surface';
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
      <Surface className="p-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-accent-bright/50" />
            <span className="text-lg font-semibold text-secondary">Loading Markets...</span>
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-ink-raised rounded-xl"></div>
            <div className="h-20 bg-ink-raised rounded-xl"></div>
          </div>
        </CardContent>
      </Surface>
    );
  }

  if (markets.length === 0) {
    return (
      <Surface className="p-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-accent-bright" />
            <span className="text-lg font-semibold text-primary">Prediction Markets</span>
          </div>
          <div className="bg-ink-raised border border-ink-edge rounded-xl p-6 text-center">
            <TrendingUp className="h-8 w-8 text-accent-bright/30 mx-auto mb-2" />
            <span className="text-sm text-secondary">No prediction markets created by {avatarName} yet</span>
          </div>
        </CardContent>
      </Surface>
    );
  }

  return (
    <Surface className="p-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-bright" />
            <span className="text-lg font-semibold text-primary">Live Prediction Markets</span>
          </div>
          <Badge variant="outline" className="bg-accent-core/10 text-accent-bright border-accent-core/30">
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
              <Button variant="ghost" size="sm" className="text-accent-bright hover:text-primary">
                View all {markets.length} markets
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Surface>
  );
}

export default function KnowledgeAvatarProfile() {
  const params = useParams();
  const id = params?.id;
  useAuth();

  const { data: avatar, isLoading, error, isFetching } = useQuery<DatabaseAvatar>({
    queryKey: [`/api/avatars/by-id/${id}`],
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <Surface className="max-w-md p-8">
          <div className="text-center">
            <SectionTitle as="h2" className="mb-2">Invalid Avatar Link</SectionTitle>
            <p className="text-secondary mb-4">No avatar ID was provided.</p>
            <Button 
              className="grad-accent glow-accent text-primary"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </Surface>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-accent-bright mx-auto mb-4" />
          <p className="text-secondary">Loading avatar profile...</p>
        </div>
      </div>
    );
  }

  if (error || !avatar) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <Surface className="max-w-md p-8">
          <div className="text-center">
            <SectionTitle as="h2" className="mb-2">Avatar Not Found</SectionTitle>
            <p className="text-secondary mb-4">The knowledge avatar you're looking for doesn't exist.</p>
            <Button 
              className="grad-accent glow-accent text-primary"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </Surface>
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
    <div className="min-h-screen bg-ink-page">
      <ScrollArea className="h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="text-secondary hover:text-primary hover:bg-ink-raised"
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
            <div className={`h-48 md:h-64 rounded-2xl ${getAvatarGradient(avatar.name)} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-ink-page/40" />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-ink-page/70" />
              
              {/* Live indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-gain rounded-full animate-pulse shadow-lg shadow-gain/50" />
                <span className="text-xs text-gain font-mono">LIVE</span>
              </div>
            </div>

            {/* Avatar and Info */}
            <div className="absolute bottom-0 left-6 transform translate-y-1/2 flex items-end gap-6">
              <div className="relative">
                <Avatar className="w-28 h-28 md:w-36 md:h-36 ring-4 ring-accent-core/40 border-4 border-ink-edge shadow-2xl">
                  <AvatarImage 
                    src={avatar.imageUrl || undefined}
                    alt={avatar.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-accent-core text-primary">
                    {avatar.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {avatar.verificationStatus === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 bg-accent-core rounded-full p-2 shadow-lg">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Name and Actions Bar */}
          <div className="mt-20 md:mt-24 mb-8">
            <PageHeader
              eyebrow={
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono text-accent-bright">@{avatar.handle}</span>
                  <Badge variant="secondary" className="bg-accent-core/20 text-accent-bright border-accent-core/30">
                    {avatar.expertise}
                  </Badge>
                </span>
              }
              title={avatar.name}
              actions={
                <>
                  <FollowButton
                    avatarId={avatar.id}
                    avatarName={avatar.name}
                    className="grad-accent glow-accent"
                  />
                  <AvatarChatButton avatar={avatar} />
                  {avatar.twitterHandle && (
                    <a href={`https://twitter.com/${avatar.twitterHandle}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-ink-edge text-primary hover:bg-ink-raised">
                        <Twitter className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {avatar.websiteUrl && (
                    <a href={avatar.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-ink-edge text-primary hover:bg-ink-raised">
                        <Globe className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </>
              }
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats & Info */}
            <div className="space-y-6">
              {/* Key Stats */}
              <Surface className="p-0">
                <CardContent className="p-6 space-y-4">
                  <SectionTitle as="h3" className="mb-4">Key Metrics</SectionTitle>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Surface variant="raised" className="rounded-xl p-4 border border-ink-edge">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted font-mono uppercase">Portfolio ROI</span>
                        {trend === 'up' ? (
                           <ArrowUpRight className="h-4 w-4 text-gain" />
                        ) : (
                           <ArrowDownRight className="h-4 w-4 text-loss" />
                        )}
                      </div>
                      <div className={`tabular text-2xl font-bold font-mono ${portfolioRoi >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {portfolioRoi >= 0 ? '+' : ''}{portfolioRoi.toFixed(2)}%
                      </div>
                    </Surface>
                    
                    <Surface variant="raised" className="rounded-xl p-4 border border-ink-edge">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted font-mono uppercase">Accuracy</span>
                        <Target className="h-4 w-4 text-accent-bright" />
                      </div>
                      <div className={`tabular text-2xl font-bold font-mono ${accuracyPercentage >= 80 ? 'text-gain' : accuracyPercentage >= 60 ? 'text-warn' : 'text-loss'}`}>
                        {accuracyPercentage.toFixed(2)}%
                      </div>
                    </Surface>
                    
                    <Surface variant="raised" className="rounded-xl p-4 border border-ink-edge">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted font-mono uppercase">Influence</span>
                        <Star className="h-4 w-4 text-accent-bright" />
                      </div>
                      <div className="tabular text-2xl font-bold font-mono text-accent-bright">
                        {Math.round(influenceScore)}
                      </div>
                    </Surface>
                    
                    <Surface variant="raised" className="rounded-xl p-4 border border-ink-edge">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted font-mono uppercase">Net Worth</span>
                        <DollarSign className="h-4 w-4 text-gain" />
                      </div>
                      <div className="tabular text-xl font-bold font-mono text-gain truncate">
                        {netWorth}
                      </div>
                    </Surface>
                  </div>

                  <div className="border-t border-ink-divider pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        Followers
                      </span>
                      <span className="tabular font-mono font-bold text-accent-bright">{formatFollowerCount(avatar.followerCount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4" />
                        Investments
                      </span>
                      <span className="tabular font-mono font-bold text-accent-bright">{avatar.notableInvestments?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Surface>

              {/* Investment Thesis */}
              <Surface className="p-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-accent-bright" />
                    <SectionTitle as="h3">Investment Thesis</SectionTitle>
                  </div>
                  <p className="text-body leading-relaxed">{investmentThesis}</p>
                  
                  <div className="mt-4 pt-4 border-t border-ink-divider">
                    <p className="text-sm text-muted mb-2">Market Outlook</p>
                    <p className="text-body">{marketOutlook}</p>
                  </div>
                </CardContent>
              </Surface>

              {/* Recent Activity */}
              <Surface className="p-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-accent-bright" />
                    <SectionTitle as="h3">Recent Activity</SectionTitle>
                  </div>
                  <div className="space-y-3">
                    {recentActivityData.slice(0, 5).map((activity: any, idx: number) => (
                      <Surface key={idx} variant="raised" className="rounded-xl p-3 border border-ink-edge">
                        <p className="text-sm text-body mb-2">{activity.text}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted font-mono">{activity.time}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              activity.impact === 'high' ? 'border-loss/50 text-loss' :
                              activity.impact === 'medium' ? 'border-warn/50 text-warn' :
                              'border-gain/50 text-gain'
                            }`}
                          >
                            {activity.impact}
                          </Badge>
                        </div>
                      </Surface>
                    ))}
                  </div>
                </CardContent>
              </Surface>
            </div>

            {/* Right Column - Analytics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Performance Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Surface variant="raised" className="border border-ink-edge">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="tabular text-lg font-bold text-primary">{formatFollowerCount(avatar.followerCount)}</span>
                      <Users className="h-5 w-5 text-accent-bright" />
                    </div>
                    <p className="text-xs text-muted">Total Followers</p>
                    <p className="tabular text-xs text-gain">+12.30% this month</p>
                  </CardContent>
                </Surface>
                
                <Surface variant="raised" className="border border-ink-edge">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`tabular text-lg font-bold ${portfolioRoi >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {portfolioRoi >= 0 ? '+' : ''}{portfolioRoi.toFixed(2)}%
                      </span>
                      <TrendingUp className="h-5 w-5 text-gain" />
                    </div>
                    <p className="text-xs text-muted">Portfolio ROI</p>
                    <p className="text-xs text-gain">All-time returns</p>
                  </CardContent>
                </Surface>
                
                <Surface variant="raised" className="border border-ink-edge">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="tabular text-lg font-bold text-primary">{accuracyPercentage.toFixed(2)}%</span>
                      <Target className="h-5 w-5 text-accent-bright" />
                    </div>
                    <p className="text-xs text-muted">Prediction Accuracy</p>
                    <p className="text-xs text-accent-bright">Last 100 predictions</p>
                  </CardContent>
                </Surface>
                
                <Surface variant="raised" className="border border-ink-edge">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="tabular text-base font-bold text-primary truncate">{netWorth}</span>
                      <PieChart className="h-5 w-5 text-warn" />
                    </div>
                    <p className="text-xs text-muted">Assets Under Management</p>
                    <p className="text-xs text-warn">Public portfolio</p>
                  </CardContent>
                </Surface>
              </div>

              {/* Prediction Markets Section */}
              <AvatarMarketsSection avatarId={avatar.id} avatarName={avatar.name} />

              {/* Analytics Chart */}
              <Surface className="p-0">
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
              </Surface>

              {/* Portfolio Simulator */}
              <Surface className="p-0">
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
              </Surface>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
