import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import UserNotesList from '@/components/UserNotesList';
import { 
  Plus, 
  Play, 
  Clock, 
  TrendingUp, 
  Wallet,
  Star,
  Share,
  Bookmark,
  Eye,
  DollarSign,
  Award,
  Zap,
  BarChart3,
  Users,
  Target,
  ArrowLeft,
  Home,
  BookmarkPlus,
  Activity,
  Calendar,
  MessageSquare,
  FileText,
  Hash,
  Code2
} from 'lucide-react';

interface Summary {
  id: string;
  title: string;
  originalUrl: string;
  contentType: string;
  platform: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  accuracy?: number;
  tags?: string[];
  createdAt: string;
  viewCount: number;
  likes: number;
  summary?: string;
  tldrSummary?: string;
  blogPost?: string;
  bulletPoints?: string[];
  trends?: Array<{
    trend: string;
    strength: 'strong' | 'moderate' | 'weak';
    evidence: string;
  }>;
  financialTrends?: Array<{
    category: string;
    symbol: string;
    company: string;
    relevance: string;
    impact: string;
    reasoning: string;
    timeHorizon: string;
    riskLevel: string;
    analystSource: string;
  }>;
  chapters?: Array<{
    title: string;
    startTime: string;
    endTime: string;
    summary: string;
  }>;
  keyQuotes?: Array<{
    quote: string;
    speaker: string;
    timestamp: string;
    significance?: string;
  }>;
  marketSentiment?: string;
  sourceCredibility?: string;
  rawData?: {
    title: string;
    channel: string;
    duration: string;
    views: string;
    thumbnail: string;
  };
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  deadline?: string;
  createdAt: string;
}

interface UserStats {
  totalSummaries: number;
  totalViews: number;
  totalLikes: number;
  totalEarned: number;
  streakDays: number;
  rank: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user summaries
  const { data: summariesData } = useQuery({
    queryKey: ['summaries', 'user', user?.id],
    queryFn: () => apiRequest(`/api/users/${user?.id}/summaries`),
    enabled: !!user?.id,
  });

  // Fetch user bounties
  const { data: bountiesData } = useQuery({
    queryKey: ['bounties', 'user', user?.id],
    queryFn: () => apiRequest(`/api/users/${user?.id}/bounties`),
    enabled: !!user?.id,
  });

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => apiRequest('/api/wallet/balance'),
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30s
  });

  // Fetch user stats
  const { data: statsData } = useQuery({
    queryKey: ['stats', 'user', user?.id],
    queryFn: () => apiRequest(`/api/users/${user?.id}/stats`),
    enabled: !!user?.id,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Access Restricted</h2>
            <p className="text-gray-300 mb-4">Please log in to view your dashboard</p>
            <Button onClick={() => setLocation('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summaries: Summary[] = summariesData?.summaries || [];
  const bounties: Bounty[] = bountiesData?.bounties || [];
  const balance = walletData?.balance;
  const stats: UserStats = statsData?.stats || {
    totalSummaries: summaries.length,
    totalViews: summaries.reduce((acc, s) => acc + (s.viewCount || 0), 0),
    totalLikes: summaries.reduce((acc, s) => acc + (s.likes || 0), 0),
    totalEarned: balance?.totalEarned || 0,
    streakDays: 5,
    rank: 'Rising Creator'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-200 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pt-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-lg bg-white/5"
              data-testid="button-back-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-gray-300 text-lg">
                Manage your AI summaries and track your progress
              </p>
            </div>
          </div>
          <Button
            onClick={() => setLocation('/create-summary')}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-700/90 hover:to-blue-700/90 backdrop-blur-lg border border-white/20"
            data-testid="button-create-summary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Summary
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Summaries</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-total-summaries">
                    {stats.totalSummaries}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Views</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-total-views">
                    {stats.totalViews.toLocaleString()}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">STREAM Tokens</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-stream-tokens">
                    {balance?.streamTokens?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Creator Rank</p>
                  <p className="text-lg font-bold text-white" data-testid="stat-creator-rank">
                    {stats.rank}
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="summaries" className="data-[state=active]:bg-purple-600">
              My Summaries
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-purple-600">
              My Notes
            </TabsTrigger>
            <TabsTrigger value="bounties" className="data-[state=active]:bg-purple-600">
              Bounties
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-purple-600">
              Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaries.slice(0, 3).map((summary) => (
                  <div key={summary.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{summary.title}</h4>
                      <p className="text-gray-300 text-sm">{summary.platform} • {summary.contentType}</p>
                    </div>
                    <Badge className={getStatusColor(summary.processingStatus)}>
                      {summary.processingStatus}
                    </Badge>
                  </div>
                ))}
                {summaries.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No summaries yet. Create your first one!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg cursor-pointer hover:bg-white/15 transition-colors"
                    onClick={() => setLocation('/create-summary')}
                    data-testid="card-create-summary">
                <CardContent className="p-6 text-center">
                  <Plus className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2" data-testid="text-create-summary-title">Create Summary</h3>
                  <p className="text-gray-300 text-sm" data-testid="text-create-summary-desc">Transform content into AI summaries</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-lg cursor-pointer hover:bg-white/15 transition-colors"
                    onClick={() => setLocation('/wallet-dashboard')}
                    data-testid="card-wallet-dashboard">
                <CardContent className="p-6 text-center">
                  <Wallet className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2" data-testid="text-wallet-title">Wallet Dashboard</h3>
                  <p className="text-gray-300 text-sm" data-testid="text-wallet-desc">Manage tokens and rewards</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-lg cursor-pointer hover:bg-white/15 transition-colors"
                    onClick={() => setActiveTab('bounties')}
                    data-testid="card-browse-bounties">
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2" data-testid="text-bounties-title">Browse Bounties</h3>
                  <p className="text-gray-300 text-sm" data-testid="text-bounties-desc">Find content to summarize</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="summaries" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">My Summaries ({summaries.length})</CardTitle>
                <Button onClick={() => setLocation('/create-summary')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Summary
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {summaries.map((summary) => (
                    <Card key={summary.id} className="bg-white/5 border-white/10 backdrop-blur-lg">
                      {/* Header */}
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(summary.processingStatus)}>
                                {summary.processingStatus}
                              </Badge>
                              {summary.accuracy && (
                                <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-500/30">
                                  {summary.accuracy}% accuracy
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">{summary.title}</h3>
                            <p className="text-gray-300 text-sm mb-3">
                              {summary.platform} • {summary.contentType} • {new Date(summary.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {summary.viewCount || 0} views
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {summary.likes || 0} likes
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              View Full
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {/* Content Analysis Tabs */}
                      {summary.processingStatus === 'completed' && summary.summary && (
                        <CardContent>
                          <Tabs defaultValue="summary" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-white/10">
                              <TabsTrigger value="summary" className="text-white data-[state=active]:bg-white/20">
                                <FileText className="w-4 h-4 mr-1" />
                                Summary
                              </TabsTrigger>
                              <TabsTrigger value="insights" className="text-white data-[state=active]:bg-white/20">
                                <Activity className="w-4 h-4 mr-1" />
                                Insights
                              </TabsTrigger>
                              <TabsTrigger value="market" className="text-white data-[state=active]:bg-white/20">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                Market
                              </TabsTrigger>
                              <TabsTrigger value="structure" className="text-white data-[state=active]:bg-white/20">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Structure
                              </TabsTrigger>
                            </TabsList>

                            {/* Summary Tab */}
                            <TabsContent value="summary" className="mt-4 space-y-4">
                              {summary.tldrSummary && (
                                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                                  <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    TLDR Summary
                                  </h4>
                                  <p className="text-gray-300 text-sm leading-relaxed">{summary.tldrSummary}</p>
                                </div>
                              )}
                              {summary.blogPost && (
                                <div className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Executive Summary
                                  </h4>
                                  <p className="text-gray-300 text-sm leading-relaxed">{summary.blogPost}</p>
                                </div>
                              )}
                            </TabsContent>

                            {/* Insights Tab */}
                            <TabsContent value="insights" className="mt-4 space-y-4">
                              {summary.bulletPoints && summary.bulletPoints.length > 0 && (
                                <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                                  <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Key Insights
                                  </h4>
                                  <ul className="space-y-2 text-sm text-gray-300">
                                    {summary.bulletPoints.map((point, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-yellow-400 mt-1">•</span>
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {summary.keyQuotes && summary.keyQuotes.length > 0 && (
                                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                                  <h4 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Notable Quotes
                                  </h4>
                                  <div className="space-y-3">
                                    {summary.keyQuotes.slice(0, 3).map((quote, index) => (
                                      <div key={index} className="border-l-2 border-purple-400/50 pl-3">
                                        <p className="text-gray-300 text-sm italic mb-1">"{quote.quote}"</p>
                                        <p className="text-xs text-gray-400">— {quote.speaker} at {quote.timestamp}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TabsContent>

                            {/* Market Tab */}
                            <TabsContent value="market" className="mt-4 space-y-4">
                              {summary.marketSentiment && summary.sourceCredibility && (
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                                    <div className="text-2xl font-bold text-green-400 mb-1">{summary.marketSentiment}</div>
                                    <div className="text-xs text-gray-400">Market Sentiment</div>
                                  </div>
                                  <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/20">
                                    <div className="text-2xl font-bold text-purple-400 mb-1">{summary.sourceCredibility}</div>
                                    <div className="text-xs text-gray-400">Source Credibility</div>
                                  </div>
                                </div>
                              )}
                              {summary.financialTrends && summary.financialTrends.length > 0 && (
                                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                                  <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Financial Impact Analysis
                                  </h4>
                                  <div className="grid gap-3">
                                    {summary.financialTrends.slice(0, 3).map((trend, index) => (
                                      <div key={index} className="p-3 bg-white/5 rounded border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">{trend.category}</Badge>
                                            <span className="font-mono text-cyan-400">{trend.symbol}</span>
                                            <span className="text-white font-medium">{trend.company}</span>
                                          </div>
                                          <Badge className={`text-xs ${
                                            trend.impact.toLowerCase().includes('bullish') ? 'bg-green-500/20 text-green-200' :
                                            trend.impact.toLowerCase().includes('bearish') ? 'bg-red-500/20 text-red-200' :
                                            'bg-yellow-500/20 text-yellow-200'
                                          }`}>
                                            {trend.impact}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-2">{trend.relevance}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span>Risk: {trend.riskLevel}</span>
                                          <span>Horizon: {trend.timeHorizon}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TabsContent>

                            {/* Structure Tab */}
                            <TabsContent value="structure" className="mt-4 space-y-4">
                              {summary.chapters && summary.chapters.length > 0 && (
                                <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-lg border border-indigo-500/20">
                                  <h4 className="font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Content Structure
                                  </h4>
                                  <div className="space-y-2">
                                    {summary.chapters.map((chapter, index) => (
                                      <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/10">
                                        <Badge variant="outline" className="text-xs font-mono">
                                          {chapter.startTime}
                                        </Badge>
                                        <div className="flex-1">
                                          <p className="text-white text-sm font-medium">{chapter.title}</p>
                                          <p className="text-xs text-gray-400">{chapter.summary}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {summary.tags && summary.tags.length > 0 && (
                                <div className="p-4 bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-lg border border-gray-500/20">
                                  <h4 className="font-semibold text-gray-400 mb-3 flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    Tags
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {summary.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      )}

                      {/* Processing State */}
                      {summary.processingStatus === 'processing' && (
                        <CardContent>
                          <div className="text-center py-6">
                            <Progress value={65} className="h-2 mb-4" />
                            <p className="text-gray-400 text-sm">AI analysis in progress...</p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                  {summaries.length === 0 && (
                    <div className="text-center py-12">
                      <Play className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-white font-semibold mb-2">No summaries yet</h3>
                      <p className="text-gray-400 mb-4">Create your first AI-powered summary</p>
                      <Button onClick={() => setLocation('/create-summary')}>
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bounties" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white">My Bounties ({bounties.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bounties.map((bounty) => (
                    <div key={bounty.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">{bounty.title}</h3>
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">{bounty.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {bounty.reward} STREAM
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {bounty.deadline ? new Date(bounty.deadline).toLocaleDateString() : 'No deadline'}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(bounty.status)}>
                          {bounty.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {bounties.length === 0 && (
                    <div className="text-center py-12">
                      <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-white font-semibold mb-2">No bounties created</h3>
                      <p className="text-gray-400 mb-4">Create bounties to reward content creators</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Balance Card */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <p className="text-4xl font-bold text-white mb-2">
                      {balance?.streamTokens?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-gray-300">STREAM Tokens</p>
                    <p className="text-sm text-gray-400 mt-1">
                      ≈ ${balance?.usdValue?.toFixed(2) || '0.00'} USD
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-green-400 font-semibold">+${balance?.totalEarned?.toFixed(2) || '0.00'}</p>
                      <p className="text-xs text-gray-400">Total Earned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-400 font-semibold">-${balance?.totalSpent?.toFixed(2) || '0.00'}</p>
                      <p className="text-xs text-gray-400">Total Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setLocation('/wallet-dashboard')}
                    data-testid="button-wallet-dashboard-sidebar"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Wallet Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    onClick={() => navigator.share ? navigator.share({
                      title: 'StreamAiX Profile',
                      text: `Check out ${user?.username}'s AI summaries on StreamAiX`,
                      url: window.location.origin + '/dashboard'
                    }) : navigator.clipboard.writeText(window.location.origin + '/dashboard')}
                    data-testid="button-share-profile"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    onClick={() => alert('Referral program coming soon! Invite friends to earn bonus STREAM tokens.')}
                    data-testid="button-referral-program"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Referral Program
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookmarkPlus className="h-5 w-5" />
                  My Personal Notes
                </CardTitle>
                <p className="text-gray-300 text-sm mt-2">
                  All your personal insights, analysis, and footnotes from AI-processed content
                </p>
              </CardHeader>
              <CardContent>
                <UserNotesList title="" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}