import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity,
  TrendingUp,
  BarChart3,
  Brain,
  AlertCircle,
  Zap,
  Target,
  Waves,
  Radio,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function Discover() {
  const [pulseExpanded, setPulseExpanded] = useState(true);
  const [sectorExpanded, setSectorExpanded] = useState(true);
  const [contentExpanded, setContentExpanded] = useState(true);
  const [contentFilter, setContentFilter] = useState('all');

  // All API calls hardcoded to 24h as requested
  const { data: marketPulseData, isLoading: pulseLoading } = useQuery({
    queryKey: ['/api/analytics/live/crypto', '24h'],
  });

  const { data: sectorsData, isLoading: sectorsLoading } = useQuery({
    queryKey: ['/api/market/sectors', '24h'],
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
  const marketRegime = (correlationData as any)?.marketRegime || {};
  const riskSentiment = (correlationData as any)?.riskSentiment || {};
  const volatilityAlerts = (volatilityData as any)?.alerts || [];
  const stressIndicators = (volatilityData as any)?.stressIndicators || {};
  const patterns = (patternData as any)?.recentPatterns || [];
  const signals = (signalsData as any)?.signals || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950">
      {/* Header - Clean and minimal */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-orbitron font-bold text-white tracking-tight">Discover</h1>
              <p className="text-sm text-gray-400 mt-1">Advanced Market Intelligence & Analytics</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1.5">
                <Radio className="w-3 h-3 mr-1.5 animate-pulse" />
                Live
              </Badge>

              <Button 
                variant="outline" 
                size="sm" 
                className="bg-slate-900/50 border-purple-500/20 hover:border-purple-500/40"
                data-testid="button-alerts"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Alerts
              </Button>

              <Button 
                variant="default" 
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-dashboard"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Market Pulse - Collapsible */}
        <section>
          <button
            onClick={() => setPulseExpanded(!pulseExpanded)}
            className="flex items-center gap-3 mb-4 w-full group"
            data-testid="toggle-market-pulse"
          >
            <Activity className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-orbitron font-bold text-white">Market Pulse</h2>
            {pulseExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            )}
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" />
              Live
            </Badge>
          </button>

          {pulseExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {pulseLoading ? (
                <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                  Loading market data...
                </div>
              ) : cryptoAssets.slice(0, 12).map((asset: any) => (
                <Card 
                  key={asset.symbol} 
                  className="bg-slate-900/30 border-purple-500/10 hover:border-purple-500/30 transition-all backdrop-blur-sm"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-white text-sm">{asset.symbol}</h3>
                        <p className="text-xs text-gray-500">{asset.name}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-lg font-bold text-white">
                        ${asset.price?.toFixed(asset.price > 1000 ? 0 : 2)}
                      </div>
                      <div className={`text-xs font-medium ${asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent?.toFixed(2)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Sector Intelligence - Collapsible */}
        <section>
          <button
            onClick={() => setSectorExpanded(!sectorExpanded)}
            className="flex items-center gap-3 mb-4 w-full group"
            data-testid="toggle-sector-intelligence"
          >
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-orbitron font-bold text-white">Sector Intelligence</h2>
            {sectorExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-gray-400 hover:text-white"
              data-testid="button-correlations"
            >
              Real-time correlations
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </button>

          {sectorExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sectorsLoading ? (
                <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                  Loading sector data...
                </div>
              ) : sectors.map((sector: any) => (
                <Card 
                  key={sector.name} 
                  className="bg-slate-900/30 border-purple-500/10 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm">{sector.name}</h3>
                        <p className="text-xs text-gray-500">{sector.assets} Assets</p>
                      </div>
                      <Badge 
                        variant={sector.performance >= 0 ? 'default' : 'destructive'} 
                        className="text-xs bg-opacity-20"
                      >
                        {sector.performance >= 0 ? '↗' : '↘'} {Math.abs(sector.performance)?.toFixed(2)}%
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Volume</span>
                        <span className="text-white font-medium">
                          ${(sector.volume / 1e9)?.toFixed(2)}B
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Sentiment</span>
                        <span className="text-white font-medium">
                          {(sector.sentiment * 100)?.toFixed(0)}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-800/50 rounded-full h-1 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                          style={{ width: `${sector.sentiment * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Content Intelligence - Collapsible */}
        <section>
          <button
            onClick={() => setContentExpanded(!contentExpanded)}
            className="flex items-center gap-3 mb-4 w-full group"
            data-testid="toggle-content-intelligence"
          >
            <Brain className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-xl font-orbitron font-bold text-white">Content Intelligence</h2>
            {contentExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            )}
          </button>

          {contentExpanded && (
            <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <Tabs value={contentFilter} onValueChange={setContentFilter} className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-4 bg-slate-800/50">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-purple-600 text-xs"
                      data-testid="content-all"
                    >
                      All Sources
                    </TabsTrigger>
                    <TabsTrigger 
                      value="twitter" 
                      className="data-[state=active]:bg-purple-600 text-xs"
                      data-testid="content-social"
                    >
                      Social
                    </TabsTrigger>
                    <TabsTrigger 
                      value="youtube" 
                      className="data-[state=active]:bg-purple-600 text-xs"
                      data-testid="content-videos"
                    >
                      Videos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="news" 
                      className="data-[state=active]:bg-purple-600 text-xs"
                      data-testid="content-news"
                    >
                      News
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {contentLoading ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Loading trending content...
                  </div>
                ) : stories.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No content available
                  </div>
                ) : (
                  stories.slice(0, 8).map((story: any) => (
                    <div 
                      key={story.id}
                      className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-all border border-slate-700/30 hover:border-purple-500/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm line-clamp-2 flex-1">
                          {story.title}
                        </h4>
                        <Badge variant="outline" className="text-xs ml-2 whitespace-nowrap">
                          {story.source}
                        </Badge>
                      </div>
                      
                      {story.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                          {story.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Advanced Analytics Grid - 2x2 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
          {/* Correlation Analysis */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-white text-base">Correlation Analysis</CardTitle>
              </div>
              <CardDescription className="text-xs">Asset pair correlations and market regime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {correlationMatrix.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No correlation data at this time
                </div>
              ) : (
                correlationMatrix.slice(0, 6).map((pair: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-slate-800/30">
                    <span className="text-white text-sm font-medium">
                      {pair.asset1} / {pair.asset2}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-700/50 rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full ${
                            pair.correlation > 0.7 ? 'bg-green-500' : 
                            pair.correlation > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(pair.correlation) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white w-10 text-right font-mono">
                        {pair.correlation?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Volatility Forecasting */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <CardTitle className="text-white text-base">Volatility Forecasting</CardTitle>
              </div>
              <CardDescription className="text-xs">Stress indicators and crisis detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {volatilityAlerts.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No volatility alerts at this time
                </div>
              ) : (
                volatilityAlerts.slice(0, 6).map((alert: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded bg-slate-800/30">
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      alert.severity === 'high' ? 'text-red-400' : 
                      alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm">{alert.symbol}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2">{alert.message}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {alert.severity}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pattern Recognition */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-white text-base">Pattern Recognition</CardTitle>
              </div>
              <CardDescription className="text-xs">Chart patterns and trading setups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {patterns.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No active patterns detected
                </div>
              ) : (
                patterns.slice(0, 6).map((pattern: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-slate-800/30">
                    <div>
                      <h4 className="text-white font-medium text-sm">{pattern.symbol}</h4>
                      <p className="text-xs text-gray-400">{pattern.patternType}</p>
                    </div>
                    <Badge 
                      variant={pattern.confidence > 0.7 ? 'default' : 'outline'}
                      className="text-xs bg-opacity-20"
                    >
                      {(pattern.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Cross-Market Signals */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white text-base">Cross-Market Signals</CardTitle>
              </div>
              <CardDescription className="text-xs">Unified trading signals across markets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {signals.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No active signals
                </div>
              ) : (
                signals.slice(0, 6).map((signal: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      {signal.direction === 'bullish' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <div>
                        <h4 className="text-white font-medium text-sm">{signal.symbol}</h4>
                        <p className="text-xs text-gray-400">{signal.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={signal.direction === 'bullish' ? 'default' : 'destructive'}
                        className="text-xs mb-1 bg-opacity-20"
                      >
                        {signal.direction}
                      </Badge>
                      <p className="text-xs text-gray-400">
                        {signal.confidence}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
