import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Sparkles, Target, Zap, Clock, Trophy, Users, Eye } from 'lucide-react';

interface DiscoveryContent {
  id: string;
  type: 'summary' | 'bounty' | 'insight';
  title: string;
  description: string;
  category: string;
  score: number;
  engagement: {
    views: number;
    tips: number;
    comments: number;
  };
  author?: {
    username: string;
    avatar: string;
  };
  reward?: number;
  tokenType?: string;
  createdAt: string;
}

export default function DiscoveryPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('trending');

  const { data: trendingData, isLoading: trendingLoading } = useQuery<{ bounties: any[] }>({
    queryKey: ['/api/bounties/trending'],
  });

  const { data: summariesData, isLoading: summariesLoading } = useQuery<{ summaries: any[] }>({
    queryKey: ['/api/summaries'],
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getRecommendedContent = (): DiscoveryContent[] => {
    const summaries = summariesData?.summaries || [];
    const bounties = trendingData?.bounties || [];

    const allContent: DiscoveryContent[] = [
      ...summaries.slice(0, 3).map((s: any) => ({
        id: s.id,
        type: 'summary' as const,
        title: s.title || 'Untitled Summary',
        description: s.summary?.slice(0, 150) + '...' || '',
        category: s.category || 'General',
        score: Math.random() * 100,
        engagement: {
          views: Math.floor(Math.random() * 5000),
          tips: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50),
        },
        author: {
          username: 'AI Hunter',
          avatar: '🤖',
        },
        createdAt: s.createdAt,
      })),
      ...bounties.slice(0, 3).map((b: any) => ({
        id: b.id,
        type: 'bounty' as const,
        title: b.title || 'Untitled Bounty',
        description: b.description?.slice(0, 150) + '...' || '',
        category: b.category || 'General',
        score: Math.random() * 100,
        engagement: {
          views: Math.floor(Math.random() * 3000),
          tips: b.totalTips || 0,
          comments: 0,
        },
        reward: b.reward,
        tokenType: b.tokenType || 'STREAM',
        createdAt: b.createdAt,
      })),
    ];

    return allContent.sort((a, b) => b.score - a.score);
  };

  const getTrendingContent = (): DiscoveryContent[] => {
    const bounties = trendingData?.bounties || [];
    return bounties.slice(0, 6).map((b: any) => ({
      id: b.id,
      type: 'bounty' as const,
      title: b.title || 'Untitled Bounty',
      description: b.description?.slice(0, 150) + '...' || '',
      category: b.category || 'General',
      score: b.trendingScore || 0,
      engagement: {
        views: b.viewCount || 0,
        tips: b.totalTips || 0,
        comments: 0,
      },
      reward: b.reward,
      tokenType: b.tokenType || 'STREAM',
      createdAt: b.createdAt,
    }));
  };

  const renderContentCard = (content: DiscoveryContent) => (
    <Card
      key={content.id}
      className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-fuchsia-500/50 transition-all duration-300 cursor-pointer group"
      onClick={() => {
        if (content.type === 'bounty') {
          setLocation(`/bounties/${content.id}`);
        } else {
          setLocation(`/summaries/${content.id}`);
        }
      }}
      data-testid={`card-${content.type}-${content.id}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
            {content.category}
          </Badge>
          <div className="flex items-center gap-2">
            {content.type === 'bounty' && (
              <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30">
                <Trophy className="h-3 w-3 mr-1" />
                Bounty
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Zap className="h-3 w-3 text-cyan-400" />
              {Math.round(content.score)}
            </div>
          </div>
        </div>
        <CardTitle className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent group-hover:from-fuchsia-400 group-hover:to-cyan-400 transition-all">
          {content.title}
        </CardTitle>
        <CardDescription className="text-gray-400 line-clamp-2">
          {content.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {content.reward && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 rounded-lg border border-purple-500/30">
              <Trophy className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Reward:</span>
              <span className="font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {content.reward} {content.tokenType}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-purple-400" />
                <span>{formatNumber(content.engagement.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-fuchsia-400" />
                <span>{formatNumber(content.engagement.tips)}</span>
              </div>
            </div>
            {content.author && (
              <div className="flex items-center gap-2">
                <span className="text-xl">{content.author.avatar}</span>
                <span className="text-cyan-400">{content.author.username}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const isLoading = trendingLoading || summariesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <Brain className="h-10 w-10 text-purple-400" />
              AI Discovery
            </h1>
            <p className="text-gray-400 mt-2">
              Personalized content recommendations powered by AI
            </p>
          </div>
          <Button
            onClick={() => setLocation('/bounties/create')}
            className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-cyan-700"
            data-testid="button-create-bounty"
          >
            <Target className="mr-2 h-4 w-4" />
            Create Bounty
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Trending Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                {trendingData?.bounties?.length || 0}
              </div>
              <p className="text-sm text-gray-400">Hot bounties today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                <Users className="h-5 w-5 text-fuchsia-400" />
                Active Hunters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {Math.floor(Math.random() * 500) + 100}
              </div>
              <p className="text-sm text-gray-400">Contributors online</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                {Math.floor(Math.random() * 12) + 1}h
              </div>
              <p className="text-sm text-gray-400">Average completion</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-purple-900/20 border border-purple-500/30">
            <TabsTrigger
              value="trending"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white"
              data-testid="tab-trending"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="recommended"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white"
              data-testid="tab-recommended"
            >
              <Brain className="h-4 w-4 mr-2" />
              For You
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getTrendingContent().map(renderContentCard)}
            </div>
          </TabsContent>

          <TabsContent value="recommended" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getRecommendedContent().map(renderContentCard)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
