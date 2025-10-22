import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/landing/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Calendar,
  Trophy,
  Users,
  ArrowRight,
  Target,
  Clock,
  Award
} from "lucide-react";
import { format } from "date-fns";

export default function Discover() {
  const { data: summariesData = [], isLoading: summariesLoading } = useQuery({
    queryKey: ['/api/summaries'],
  });

  const { data: bountiesData, isLoading: bountiesLoading } = useQuery({
    queryKey: ['/api/bounties'],
  });

  const { data: marketsData, isLoading: marketsLoading } = useQuery({
    queryKey: ['/api/prediction-markets'],
  });

  const summaries = Array.isArray(summariesData) ? summariesData : [];
  const bounties = (bountiesData as any)?.bounties || [];
  const markets = (marketsData as any)?.markets || [];

  const recentSummaries = summaries
    .filter((s: any) => s.processingStatus === 'completed')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const activeBounties = bounties
    .filter((b: any) => b.status === 'open')
    .sort((a: any, b: any) => b.reward - a.reward)
    .slice(0, 6);

  const activeMarkets = markets
    .filter((m: any) => m.status === 'active')
    .sort((a: any, b: any) => b.totalVolume - a.totalVolume)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              Discover Content
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-orbitron font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
              Explore StreamAiX
            </span>
          </h1>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Browse AI-processed summaries, open bounties, and active prediction markets
          </p>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="summaries" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="summaries" data-testid="tab-summaries">
              <FileText className="w-4 h-4 mr-2" />
              Summaries
            </TabsTrigger>
            <TabsTrigger value="bounties" data-testid="tab-bounties">
              <Target className="w-4 h-4 mr-2" />
              Bounties
            </TabsTrigger>
            <TabsTrigger value="markets" data-testid="tab-markets">
              <TrendingUp className="w-4 h-4 mr-2" />
              Markets
            </TabsTrigger>
          </TabsList>

          {/* Summaries Tab */}
          <TabsContent value="summaries">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summariesLoading ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  Loading summaries...
                </div>
              ) : recentSummaries.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No summaries yet. Create your first one!</p>
                  <Link href="/create-summary">
                    <Button className="mt-4" data-testid="button-create-summary">
                      Create Summary
                    </Button>
                  </Link>
                </div>
              ) : (
                recentSummaries.map((summary: any) => (
                  <Card key={summary.id} className="neural-glass hover:scale-[1.02] transition-transform cursor-pointer" data-testid={`card-summary-${summary.id}`}>
                    <Link href={`/summary/${summary.id}`}>
                      <CardHeader>
                        <CardTitle className="text-lg line-clamp-2 text-white">
                          {summary.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {summary.description || summary.tldrSummary || 'AI-processed content'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {summary.contentType || 'video'}
                          </Badge>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(summary.createdAt), 'MMM d')}</span>
                          </div>
                        </div>
                        {summary.tags && summary.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {summary.tags.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Bounties Tab */}
          <TabsContent value="bounties">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bountiesLoading ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  Loading bounties...
                </div>
              ) : activeBounties.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No active bounties</p>
                  <Link href="/bounties">
                    <Button className="mt-4" data-testid="button-view-bounties">
                      View All Bounties
                    </Button>
                  </Link>
                </div>
              ) : (
                activeBounties.map((bounty: any) => (
                  <Card key={bounty.id} className="neural-glass hover:scale-[1.02] transition-transform cursor-pointer" data-testid={`card-bounty-${bounty.id}`}>
                    <Link href={`/bounties/${bounty.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-2 text-white flex-1">
                            {bounty.title}
                          </CardTitle>
                          <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30 shrink-0">
                            {bounty.reward} STREAM
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {bounty.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            {bounty.difficulty || 'medium'}
                          </Badge>
                          {bounty.deadline && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>{format(new Date(bounty.deadline), 'MMM d')}</span>
                            </div>
                          )}
                        </div>
                        {bounty.category && (
                          <div className="mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {bounty.category}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketsLoading ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  Loading markets...
                </div>
              ) : activeMarkets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No active markets</p>
                  <Link href="/markets">
                    <Button className="mt-4" data-testid="button-view-markets">
                      View All Markets
                    </Button>
                  </Link>
                </div>
              ) : (
                activeMarkets.map((market: any) => (
                  <Card key={market.id} className="neural-glass hover:scale-[1.02] transition-transform cursor-pointer" data-testid={`card-market-${market.id}`}>
                    <Link href={`/markets/${market.id}`}>
                      <CardHeader>
                        <CardTitle className="text-lg line-clamp-2 text-white">
                          {market.question}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {market.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-green-400">
                              {Math.round((market.yesPrice / 10000) * 100)}%
                            </div>
                            <span className="text-gray-400 text-sm">YES</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">NO</span>
                            <div className="text-2xl font-bold text-red-400">
                              {Math.round((market.noPrice / 10000) * 100)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {market.category}
                          </Badge>
                          {market.deadline && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(market.deadline), 'MMM d')}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link href="/create-summary">
            <Card className="neural-glass hover:scale-[1.02] transition-transform cursor-pointer" data-testid="card-create-summary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Create Summary</h3>
                    <p className="text-sm text-gray-400">Process new content with AI</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/bounties">
            <Card className="neural-glass hover:scale-[1.02] transition-transform cursor-pointer" data-testid="card-browse-bounties">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                    <Trophy className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Browse Bounties</h3>
                    <p className="text-sm text-gray-400">Earn STREAM tokens</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/markets">
            <Card className="neural-glass hover:scale-[1.02] transition-transform cursor-pointer" data-testid="card-trade-markets">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Trade Markets</h3>
                    <p className="text-sm text-gray-400">Predict future events</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
