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
  Zap,
  Target,
  Waves,
  Radio,
  ChevronDown,
  ChevronUp,
  Calendar,
  Newspaper,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUpIcon,
  Building,
  LineChart,
  Flame,
  Users,
  Droplet,
  Scale,
  CircleDollarSign,
  Wallet,
  Link as LinkIcon
} from "lucide-react";

export default function Discover() {
  const [pulseExpanded, setPulseExpanded] = useState(true);
  const [macroExpanded, setMacroExpanded] = useState(false);
  const [sectorExpanded, setSectorExpanded] = useState(false);
  const [newsExpanded, setNewsExpanded] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(true);
  const [contentFilter, setContentFilter] = useState('all');

  // Market Data Queries - 24h only as requested
  const { data: cryptoData } = useQuery({
    queryKey: ['/api/analytics/live/crypto'],
  });

  const { data: stocksData } = useQuery({
    queryKey: ['/api/analytics/live/stocks'],
  });

  const { data: sectorsData } = useQuery({
    queryKey: ['/api/market/sectors'],
  });

  const { data: marketOverview } = useQuery({
    queryKey: ['/api/market/overview'],
  });

  // Macro Economic Data
  const { data: economicCalendar } = useQuery({
    queryKey: ['/api/market/economic-calendar'],
  });

  const { data: fomcMeetings } = useQuery({
    queryKey: ['/api/market/fomc-meetings'],
  });

  const { data: highImpactEvents } = useQuery({
    queryKey: ['/api/market/high-impact-events'],
  });

  // News & Content
  const { data: marketNews } = useQuery({
    queryKey: ['/api/market/news'],
  });

  const { data: trendingContent } = useQuery({
    queryKey: ['/api/discover/trending', contentFilter],
  });

  // Advanced Analytics
  const { data: correlationData } = useQuery({
    queryKey: ['/api/correlation/summary'],
  });

  const { data: marketRegime } = useQuery({
    queryKey: ['/api/correlation/market-regime'],
  });

  const { data: riskSentiment } = useQuery({
    queryKey: ['/api/correlation/risk-sentiment'],
  });

  const { data: volatilityDashboard } = useQuery({
    queryKey: ['/api/volatility-forecasting/dashboard'],
  });

  const { data: stressIndicators } = useQuery({
    queryKey: ['/api/volatility-forecasting/stress-indicators'],
  });

  const { data: crisisIndicators } = useQuery({
    queryKey: ['/api/volatility-forecasting/crisis-indicators'],
  });

  const { data: patternDashboard } = useQuery({
    queryKey: ['/api/patterns/dashboard'],
  });

  const { data: patternAlerts } = useQuery({
    queryKey: ['/api/patterns/alerts'],
  });

  // Extract data
  const cryptoAssets = (cryptoData as any)?.assets || [];
  const stockAssets = (stocksData as any)?.assets || [];
  const sectors = (sectorsData as any)?.sectors || [];
  const movers = (marketOverview as any)?.movers || [];
  const events = (economicCalendar as any)?.events || [];
  const fomcEvents = (fomcMeetings as any)?.meetings || [];
  const highImpact = (highImpactEvents as any)?.events || [];
  const news = (marketNews as any)?.news || [];
  const stories = (trendingContent as any)?.stories || [];
  const correlationMatrix = (correlationData as any)?.correlationMatrix || [];
  const regime = (marketRegime as any)?.regime || {};
  const sentiment = (riskSentiment as any)?.sentiment || {};
  const volatilityAlerts = (volatilityDashboard as any)?.alerts || [];
  const stress = (stressIndicators as any)?.indicators || [];
  const crisis = (crisisIndicators as any)?.indicators || [];
  const patterns = (patternDashboard as any)?.recentPatterns || [];
  const alerts = (patternAlerts as any)?.alerts || [];

  // Mock advanced metrics (these would come from real APIs in production)
  const fearGreedIndex = 65; // 0-100
  const btcDominance = 42.3;
  const ethDominance = 18.7;
  const gasPrice = 15; // Gwei
  const fundingRates = [
    { exchange: 'Binance', symbol: 'BTC', rate: 0.0100 },
    { exchange: 'Bybit', symbol: 'ETH', rate: 0.0075 },
    { exchange: 'OKX', symbol: 'SOL', rate: -0.0050 }
  ];

  const toggleSection = (section: string) => {
    switch(section) {
      case 'pulse': setPulseExpanded(!pulseExpanded); break;
      case 'macro': setMacroExpanded(!macroExpanded); break;
      case 'sector': setSectorExpanded(!sectorExpanded); break;
      case 'news': setNewsExpanded(!newsExpanded); break;
      case 'content': setContentExpanded(!contentExpanded); break;
      case 'metrics': setMetricsExpanded(!metricsExpanded); break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950">
      {/* Minimal Header - Mobile Optimized */}
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-purple-500/10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-orbitron font-bold text-white tracking-tight">Discover</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Advanced Market Intelligence & Analytics</p>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-2 sm:px-3 py-1 sm:py-1.5 text-xs">
                <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5 animate-pulse" />
                <span className="hidden sm:inline">Live</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-slate-900/50 border-purple-500/20 hover:border-purple-500/40 text-white h-7 sm:h-9 px-2 sm:px-3 text-xs"
                data-testid="button-alerts"
              >
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Alerts</span>
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 h-7 sm:h-9 px-2 sm:px-3 text-xs hidden sm:inline-flex"
                data-testid="button-dashboard"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Market Pulse - Stocks + Crypto - Mobile Optimized */}
        <section>
          <div
            onClick={() => toggleSection('pulse')}
            className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer group"
            data-testid="toggle-market-pulse"
          >
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <h2 className="text-base sm:text-xl font-orbitron font-bold text-white">Market Pulse</h2>
            {pulseExpanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            )}
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              <Radio className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>

          {pulseExpanded && (
            <div className="space-y-3 sm:space-y-4">
              {/* Top Movers */}
              {movers.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3 uppercase tracking-wide">Top Movers (24h)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    {movers.slice(0, 12).map((asset: any, idx: number) => (
                      <Card 
                        key={idx}
                        className="bg-slate-900/30 border-purple-500/10 hover:border-purple-500/30 transition-all backdrop-blur-sm"
                      >
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-white text-xs sm:text-sm truncate">{asset.symbol}</h3>
                              <p className="text-xs text-gray-500 truncate hidden sm:block">{asset.category}</p>
                            </div>
                            {asset.changePercent >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 flex-shrink-0" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-sm sm:text-lg font-bold text-white mb-0.5">
                            ${typeof asset.price === 'number' ? asset.price.toFixed(asset.price > 1000 ? 0 : 2) : '0.00'}
                          </div>
                          <div className={`text-xs font-medium ${asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent?.toFixed(2)}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Stocks */}
              {stockAssets.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3 uppercase tracking-wide">Stocks</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    {stockAssets.slice(0, 12).map((asset: any) => (
                      <Card 
                        key={asset.symbol}
                        className="bg-slate-900/30 border-cyan-500/10 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
                      >
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-white text-xs sm:text-sm truncate">{asset.symbol}</h3>
                              <p className="text-xs text-gray-500 truncate hidden sm:block">{asset.name}</p>
                            </div>
                          </div>
                          <div className="text-sm sm:text-lg font-bold text-white mb-0.5">
                            ${typeof asset.price === 'number' ? asset.price.toFixed(2) : '0.00'}
                          </div>
                          <div className={`text-xs font-medium ${(asset.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(asset.changePercent || 0) >= 0 ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Crypto */}
              {cryptoAssets.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3 uppercase tracking-wide">Crypto</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    {cryptoAssets.slice(0, 12).map((asset: any) => (
                      <Card 
                        key={asset.symbol}
                        className="bg-slate-900/30 border-fuchsia-500/10 hover:border-fuchsia-500/30 transition-all backdrop-blur-sm"
                      >
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-white text-xs sm:text-sm truncate">{asset.symbol}</h3>
                              <p className="text-xs text-gray-500 truncate hidden sm:block">{asset.name}</p>
                            </div>
                          </div>
                          <div className="text-sm sm:text-lg font-bold text-white mb-0.5">
                            ${typeof asset.price === 'number' ? asset.price.toFixed(asset.price > 1000 ? 0 : 2) : '0.00'}
                          </div>
                          <div className={`text-xs font-medium ${(asset.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(asset.changePercent || 0) >= 0 ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Advanced Market Metrics - NEW */}
        <section>
          <div
            onClick={() => toggleSection('metrics')}
            className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer group"
            data-testid="toggle-advanced-metrics"
          >
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            <h2 className="text-base sm:text-xl font-orbitron font-bold text-white">Advanced Market Metrics</h2>
            {metricsExpanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            )}
          </div>

          {metricsExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {/* Fear & Greed Index */}
              <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Fear & Greed
                  </CardTitle>
                  <CardDescription className="text-xs">Market sentiment index</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl sm:text-4xl font-bold text-white">{fearGreedIndex}</div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full ${
                          fearGreedIndex > 75 ? 'bg-green-500' : 
                          fearGreedIndex > 50 ? 'bg-yellow-500' : 
                          fearGreedIndex > 25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${fearGreedIndex}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {fearGreedIndex > 75 ? 'Extreme Greed' : 
                       fearGreedIndex > 50 ? 'Greed' : 
                       fearGreedIndex > 25 ? 'Fear' : 'Extreme Fear'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Crypto Dominance */}
              <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
                    <CircleDollarSign className="w-4 h-4" />
                    Dominance
                  </CardTitle>
                  <CardDescription className="text-xs">Market share distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">BTC</span>
                    <span className="text-sm font-bold text-white">{btcDominance}%</span>
                  </div>
                  <div className="w-full bg-slate-800/50 rounded-full h-1.5">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${btcDominance}%` }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">ETH</span>
                    <span className="text-sm font-bold text-white">{ethDominance}%</span>
                  </div>
                  <div className="w-full bg-slate-800/50 rounded-full h-1.5">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${ethDominance}%` }} />
                  </div>
                </CardContent>
              </Card>

              {/* Gas Tracker */}
              <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
                    <Droplet className="w-4 h-4" />
                    Gas Tracker
                  </CardTitle>
                  <CardDescription className="text-xs">Ethereum network fees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-bold text-white">{gasPrice}</span>
                      <span className="text-xs text-gray-400">Gwei</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <div className="bg-slate-800/30 p-1.5 rounded">
                        <div className="text-gray-400">Low</div>
                        <div className="text-white font-semibold">{gasPrice - 5}</div>
                      </div>
                      <div className="bg-slate-800/30 p-1.5 rounded">
                        <div className="text-gray-400">Avg</div>
                        <div className="text-white font-semibold">{gasPrice}</div>
                      </div>
                      <div className="bg-slate-800/30 p-1.5 rounded">
                        <div className="text-gray-400">High</div>
                        <div className="text-white font-semibold">{gasPrice + 10}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Funding Rates */}
              <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Funding Rates
                  </CardTitle>
                  <CardDescription className="text-xs">Perpetual contract rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {fundingRates.map((rate, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-800/30 p-1.5 rounded">
                      <span className="text-gray-400">{rate.symbol}</span>
                      <span className={`font-semibold ${rate.rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {rate.rate >= 0 ? '+' : ''}{(rate.rate * 100).toFixed(3)}%
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Macro Economic Dashboard */}
        <section>
          <div
            onClick={() => toggleSection('macro')}
            className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer group"
            data-testid="toggle-macro-dashboard"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <h2 className="text-base sm:text-xl font-orbitron font-bold text-white">Macro Economic Dashboard</h2>
            {macroExpanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            )}
          </div>

          {macroExpanded && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Economic Calendar */}
              <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Economic Calendar
                  </CardTitle>
                  <CardDescription className="text-xs">Upcoming economic events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No upcoming events</p>
                  ) : (
                    events.slice(0, 8).map((event: any, idx: number) => (
                      <div key={idx} className="p-1.5 sm:p-2 rounded bg-slate-800/30 text-xs">
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-white text-xs">{event.title}</span>
                          <Badge variant="outline" className="text-xs">{event.impact}</Badge>
                        </div>
                        <p className="text-gray-400 text-xs">{event.date}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* FOMC Meetings */}
              <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    FOMC Meetings
                  </CardTitle>
                  <CardDescription className="text-xs">Federal Reserve meetings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {fomcEvents.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No scheduled meetings</p>
                  ) : (
                    fomcEvents.slice(0, 5).map((meeting: any, idx: number) => (
                      <div key={idx} className="p-1.5 sm:p-2 rounded bg-slate-800/30 text-xs">
                        <div className="font-medium text-white mb-1 text-xs">{meeting.title}</div>
                        <p className="text-gray-400 text-xs">{meeting.date}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* High Impact Events */}
              <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    High Impact Events
                  </CardTitle>
                  <CardDescription className="text-xs">Critical market-moving events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {highImpact.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No high impact events</p>
                  ) : (
                    highImpact.slice(0, 5).map((event: any, idx: number) => (
                      <div key={idx} className="p-1.5 sm:p-2 rounded bg-red-900/20 border border-red-500/20 text-xs">
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-white text-xs">{event.title}</span>
                          <Badge variant="destructive" className="text-xs">High</Badge>
                        </div>
                        <p className="text-gray-400 text-xs">{event.date}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Sector Intelligence */}
        <section>
          <div
            onClick={() => toggleSection('sector')}
            className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer group"
            data-testid="toggle-sector-intelligence"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <h2 className="text-base sm:text-xl font-orbitron font-bold text-white">Sector Intelligence</h2>
            {sectorExpanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            )}
          </div>

          {sectorExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {sectors.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-400 text-xs sm:text-sm">
                  Loading sector data...
                </div>
              ) : (
                sectors.map((sector: any) => (
                  <Card 
                    key={sector.name}
                    className="bg-slate-900/30 border-purple-500/10 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div>
                          <h3 className="font-semibold text-white text-xs sm:text-sm">{sector.name}</h3>
                          <p className="text-xs text-gray-500">{sector.assets} Assets</p>
                        </div>
                        <Badge 
                          variant={(sector.performance || 0) >= 0 ? 'default' : 'destructive'} 
                          className="text-xs bg-opacity-20"
                        >
                          {(sector.performance || 0) >= 0 ? '↗' : '↘'} {Math.abs(sector.performance || 0).toFixed(2)}%
                        </Badge>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Volume</span>
                          <span className="text-white font-medium">
                            ${((sector.volume || 0) / 1e9).toFixed(2)}B
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Sentiment</span>
                          <span className="text-white font-medium">
                            {((sector.sentiment || 0.5) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800/50 rounded-full h-1 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                            style={{ width: `${(sector.sentiment || 0.5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </section>

        {/* Market News & Intelligence */}
        <section>
          <div
            onClick={() => toggleSection('news')}
            className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer group"
            data-testid="toggle-news"
          >
            <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <h2 className="text-base sm:text-xl font-orbitron font-bold text-white">Market News & Intelligence</h2>
            {newsExpanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            )}
          </div>

          {newsExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {news.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-400 text-xs sm:text-sm">
                  Loading news...
                </div>
              ) : (
                news.slice(0, 6).map((item: any, idx: number) => (
                  <Card 
                    key={idx}
                    className="bg-slate-900/30 border-purple-500/10 hover:border-blue-500/30 transition-all backdrop-blur-sm"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-xs sm:text-sm line-clamp-2 flex-1">
                          {item.title || item.headline}
                        </h4>
                        <Badge variant="outline" className="text-xs ml-2 whitespace-nowrap">
                          {item.source}
                        </Badge>
                      </div>
                      {item.summary && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                          {item.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {item.date || 'Recent'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </section>

        {/* Content Intelligence */}
        <section>
          <div
            onClick={() => toggleSection('content')}
            className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer group"
            data-testid="toggle-content-intelligence"
          >
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
            <h2 className="text-base sm:text-xl font-orbitron font-bold text-white">Content Intelligence</h2>
            {contentExpanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            ) : (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-auto" />
            )}
          </div>

          {contentExpanded && (
            <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <Tabs value={contentFilter} onValueChange={setContentFilter}>
                  <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                    <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 text-xs" data-testid="content-all">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="twitter" className="data-[state=active]:bg-purple-600 text-xs" data-testid="content-social">
                      Social
                    </TabsTrigger>
                    <TabsTrigger value="youtube" className="data-[state=active]:bg-purple-600 text-xs" data-testid="content-videos">
                      Videos
                    </TabsTrigger>
                    <TabsTrigger value="news" className="data-[state=active]:bg-purple-600 text-xs" data-testid="content-news">
                      News
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto">
                {stories.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs sm:text-sm">
                    No content available
                  </div>
                ) : (
                  stories.slice(0, 8).map((story: any) => (
                    <div 
                      key={story.id}
                      className="p-2 sm:p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-all border border-slate-700/30 hover:border-purple-500/30"
                    >
                      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                        <h4 className="font-medium text-white text-xs sm:text-sm line-clamp-2 flex-1">
                          {story.title}
                        </h4>
                        <Badge variant="outline" className="text-xs ml-2 whitespace-nowrap">
                          {story.source}
                        </Badge>
                      </div>
                      {story.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
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

        {/* Advanced Analytics Grid - 2x4 Layout - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
          {/* Market Regime */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <CardTitle className="text-white text-sm sm:text-base">Market Regime</CardTitle>
              </div>
              <CardDescription className="text-xs">Current market conditions</CardDescription>
            </CardHeader>
            <CardContent>
              {regime.currentRegime ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 rounded bg-purple-900/20 border border-purple-500/20">
                    <span className="text-white font-medium text-xs sm:text-sm">Regime</span>
                    <Badge className="bg-purple-600 text-xs">{regime.currentRegime}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-slate-800/30 text-xs sm:text-sm">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-white">{((regime.confidence || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No regime data</div>
              )}
            </CardContent>
          </Card>

          {/* Risk Sentiment */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <CardTitle className="text-white text-sm sm:text-base">Risk Sentiment</CardTitle>
              </div>
              <CardDescription className="text-xs">Market risk appetite</CardDescription>
            </CardHeader>
            <CardContent>
              {sentiment.sentiment ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 rounded bg-slate-800/30">
                    <span className="text-white font-medium text-xs sm:text-sm">Sentiment</span>
                    <Badge variant={sentiment.sentiment === 'risk-on' ? 'default' : 'destructive'} className="text-xs">
                      {sentiment.sentiment}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-800/50 rounded-full h-1.5 sm:h-2">
                    <div 
                      className={`h-full rounded-full ${sentiment.sentiment === 'risk-on' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${(sentiment.score || 0.5) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No sentiment data</div>
              )}
            </CardContent>
          </Card>

          {/* Correlation Analysis */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <CardTitle className="text-white text-sm sm:text-base">Correlation Analysis</CardTitle>
              </div>
              <CardDescription className="text-xs">Asset pair correlations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2">
              {correlationMatrix.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No correlation data</div>
              ) : (
                correlationMatrix.slice(0, 5).map((pair: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-slate-800/30 text-xs sm:text-sm">
                    <span className="text-white font-medium text-xs">
                      {pair.asset1} / {pair.asset2}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 sm:w-16 bg-slate-700/50 rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full ${
                            pair.correlation > 0.7 ? 'bg-green-500' : 
                            pair.correlation > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(pair.correlation) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white w-8 text-right font-mono">
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
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                <CardTitle className="text-white text-sm sm:text-base">Volatility Alerts</CardTitle>
              </div>
              <CardDescription className="text-xs">Real-time monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2">
              {volatilityAlerts.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No volatility alerts</div>
              ) : (
                volatilityAlerts.slice(0, 5).map((alert: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-1.5 sm:p-2 rounded bg-slate-800/30">
                    <AlertCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 ${
                      alert.severity === 'high' ? 'text-red-400' : 
                      alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-xs">{alert.symbol}</h4>
                      <p className="text-xs text-gray-400 line-clamp-1">{alert.message}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Stress Indicators */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                <CardTitle className="text-white text-sm sm:text-base">Market Stress</CardTitle>
              </div>
              <CardDescription className="text-xs">Stress & risk metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2">
              {stress.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No stress indicators</div>
              ) : (
                stress.slice(0, 5).map((indicator: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-slate-800/30 text-xs sm:text-sm">
                    <span className="text-white text-xs">{indicator.name}</span>
                    <Badge variant={indicator.level === 'high' ? 'destructive' : 'outline'} className="text-xs">
                      {indicator.value}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Crisis Indicators */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                <CardTitle className="text-white text-sm sm:text-base">Crisis Detection</CardTitle>
              </div>
              <CardDescription className="text-xs">Early warning signals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2">
              {crisis.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No crisis signals</div>
              ) : (
                crisis.slice(0, 5).map((indicator: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-red-900/20 border border-red-500/20 text-xs sm:text-sm">
                    <span className="text-white text-xs">{indicator.type}</span>
                    <Badge variant="destructive" className="text-xs">{indicator.severity}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pattern Recognition */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <CardTitle className="text-white text-sm sm:text-base">Pattern Recognition</CardTitle>
              </div>
              <CardDescription className="text-xs">Chart patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2">
              {patterns.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No active patterns</div>
              ) : (
                patterns.slice(0, 5).map((pattern: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-slate-800/30 text-xs sm:text-sm">
                    <div>
                      <h4 className="text-white font-medium text-xs">{pattern.symbol}</h4>
                      <p className="text-xs text-gray-400">{pattern.patternType}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {((pattern.confidence || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pattern Alerts */}
          <Card className="bg-slate-900/30 border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <CardTitle className="text-white text-sm sm:text-base">Trading Signals</CardTitle>
              </div>
              <CardDescription className="text-xs">Active pattern signals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2">
              {alerts.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs sm:text-sm">No active signals</div>
              ) : (
                alerts.slice(0, 5).map((alert: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-slate-800/30">
                    <div className="flex items-center gap-2">
                      {alert.direction === 'bullish' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                      )}
                      <div>
                        <h4 className="text-white font-medium text-xs">{alert.symbol}</h4>
                        <p className="text-xs text-gray-400">{alert.pattern}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={alert.direction === 'bullish' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {alert.direction}
                    </Badge>
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
