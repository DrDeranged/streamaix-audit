import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  AlertCircle,
  Clock,
  Zap,
  Target,
  Waves,
  Radio,
  ExternalLink,
  MessageSquare,
  Heart,
  Share2,
  Eye,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";

export default function Discover() {
  const [timeFilter, setTimeFilter] = useState('24h');
  const [sectorTimeFilter, setSectorTimeFilter] = useState('24h');
  const [contentFilter, setContentFilter] = useState('all');

  // API Queries
  const { data: marketPulseData, isLoading: pulseLoading } = useQuery({
    queryKey: ['/api/analytics/live/crypto', timeFilter],
  });

  const { data: sectorsData, isLoading: sectorsLoading } = useQuery({
    queryKey: ['/api/market/sectors', sectorTimeFilter],
  });

  const { data: trendingContent, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/discover/trending', contentFilter],
  });

  const { data: correlationData } = useQuery({
    queryKey: ['/api/analytics/correlation-matrix', '24h'],
  });

  const { data: volatilityData } = useQuery({
    queryKey: ['/api/volatility/dashboard'],
  });

  const { data: patternData } = useQuery({
    queryKey: ['/api/patterns/dashboard'],
  });

  const { data: signalsData } = useQuery({
    queryKey: ['/api/cross-market/signals'],
  });

  const cryptoAssets = (marketPulseData as any)?.assets || [];
  const sectors = (sectorsData as any)?.sectors || [];
  const stories = (trendingContent as any)?.stories || [];
  const correlationMatrix = (correlationData as any)?.correlationMatrix || [];
  const volatilityAlerts = (volatilityData as any)?.alerts || [];
  const patterns = (patternData as any)?.recentPatterns || [];
  const signals = (signalsData as any)?.signals || [];

  const timeFilters = [
    { label: '1h', value: '1h' },
    { label: '8h', value: '8h' },
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-orbitron font-bold text-white">Discover</h1>
              <p className="text-sm text-gray-400 mt-1">Advanced Market Intelligence & Analytics</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time Filter */}
              <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-1">
                {timeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setTimeFilter(filter.value)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      timeFilter === filter.value
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    data-testid={`filter-${filter.value}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Radio className="w-3 h-3 mr-1 animate-pulse" />
                Live
              </Badge>

              <Button variant="outline" size="sm" data-testid="button-alerts">
                <AlertCircle className="w-4 h-4 mr-2" />
                Alerts
              </Button>

              <Button variant="default" size="sm" data-testid="button-dashboard">
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Market Pulse */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-orbitron font-bold text-white">Market Pulse</h2>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pulseLoading ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                Loading market data...
              </div>
            ) : cryptoAssets.slice(0, 6).map((asset: any) => (
              <Card key={asset.symbol} className="bg-slate-900/50 border-purple-500/20 hover:border-purple-500/40 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{asset.symbol}</h3>
                      <p className="text-sm text-gray-400">{asset.name}</p>
                    </div>
                    <Badge variant={asset.changePercent >= 0 ? 'default' : 'destructive'} className="text-xs">
                      {asset.changePercent >= 0 ? '↗ bearish' : '↘ bearish'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        ${asset.price?.toFixed(2)}
                      </span>
                      <span className={`text-sm font-medium ${asset.changePercent >= 0 ? 'text-red-400' : 'text-red-400'}`}>
                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent?.toFixed(2)}%
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      Vol: ${(asset.volume / 1e9)?.toFixed(2)}B
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Sector Intelligence */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-orbitron font-bold text-white">Sector Intelligence</h2>
            </div>
            <Button variant="ghost" size="sm" data-testid="button-correlations">
              Real-time correlations
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectorsLoading ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                Loading sector data...
              </div>
            ) : sectors.slice(0, 6).map((sector: any) => (
              <Card key={sector.name} className="bg-slate-900/50 border-purple-500/20 hover:border-cyan-500/40 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{sector.name}</h3>
                      <p className="text-xs text-gray-400">{sector.assets} Assets</p>
                    </div>
                    <Badge variant={sector.performance >= 0 ? 'default' : 'destructive'} className="text-xs">
                      {sector.performance >= 0 ? '↗' : '↘'} {Math.abs(sector.performance)?.toFixed(2)}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Volume</span>
                      <span className="text-white font-medium">
                        ${(sector.volume / 1e6)?.toFixed(2)}M
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Sentiment</span>
                      <span className="text-white font-medium">
                        {(sector.sentiment * 100)?.toFixed(0)}%
                      </span>
                    </div>

                    {/* Sentiment Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
                        style={{ width: `${sector.sentiment * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Content Intelligence */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-fuchsia-400" />
            <h2 className="text-2xl font-orbitron font-bold text-white">Content Intelligence</h2>
          </div>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <Tabs value={contentFilter} onValueChange={setContentFilter}>
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="all" data-testid="content-all">
                    All Sources
                  </TabsTrigger>
                  <TabsTrigger value="twitter" data-testid="content-social">
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="youtube" data-testid="content-videos">
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="news" data-testid="content-news">
                    News
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="space-y-4">
              {contentLoading ? (
                <div className="text-center py-8 text-gray-400">
                  Loading trending content...
                </div>
              ) : stories.slice(0, 5).map((story: any) => (
                <div 
                  key={story.id}
                  className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1 line-clamp-2">
                        {story.title}
                      </h4>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {story.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {story.engagement?.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {story.engagement?.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        {story.engagement?.shares}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {story.engagement?.views}
                      </span>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {story.source}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Advanced Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Correlation Analysis */}
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white">Correlation Analysis</CardTitle>
              </div>
              <CardDescription>Asset pair correlations and market regime</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {correlationMatrix.slice(0, 5).map((pair: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded bg-slate-800/50">
                    <div>
                      <span className="text-white font-medium">{pair.asset1} / {pair.asset2}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${
                            pair.correlation > 0.7 ? 'bg-green-500' : 
                            pair.correlation > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(pair.correlation) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-white w-12 text-right">
                        {pair.correlation?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Volatility Forecasting */}
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <CardTitle className="text-white">Volatility Forecasting</CardTitle>
              </div>
              <CardDescription>Stress indicators and crisis detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {volatilityAlerts.length > 0 ? (
                  volatilityAlerts.slice(0, 5).map((alert: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded bg-slate-800/50">
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                        alert.severity === 'high' ? 'text-red-400' : 
                        alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                      }`} />
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{alert.symbol}</h4>
                        <p className="text-xs text-gray-400">{alert.message}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No volatility alerts at this time
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pattern Recognition */}
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-white">Pattern Recognition</CardTitle>
              </div>
              <CardDescription>Chart patterns and trading setups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patterns.length > 0 ? (
                  patterns.slice(0, 5).map((pattern: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded bg-slate-800/50">
                      <div>
                        <h4 className="text-white font-medium text-sm">{pattern.symbol}</h4>
                        <p className="text-xs text-gray-400">{pattern.patternType}</p>
                      </div>
                      <Badge 
                        variant={pattern.confidence > 0.7 ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {(pattern.confidence * 100).toFixed(0)}% confident
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No active patterns detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cross-Market Signals */}
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">Cross-Market Signals</CardTitle>
              </div>
              <CardDescription>Unified trading signals across markets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {signals.length > 0 ? (
                  signals.slice(0, 5).map((signal: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        {signal.direction === 'bullish' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <h4 className="text-white font-medium text-sm">{signal.symbol}</h4>
                          <p className="text-xs text-gray-400">{signal.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={signal.direction === 'bullish' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {signal.direction}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {signal.confidence}% confidence
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No active signals
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
