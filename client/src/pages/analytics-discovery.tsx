import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, BarChart3, DollarSign, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

// Types for market data
interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

interface SectorData {
  name: string;
  assets: number;
  volume: number;
  sentiment: number;
  change24h: number;
}

interface MacroIndicator {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  impact: 'high' | 'medium' | 'low';
}

export default function AnalyticsDiscovery() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [activeFilter, setActiveFilter] = useState('All Sources');

  // Market Pulse Data
  const { data: cryptoData, isLoading: cryptoLoading } = useQuery({
    queryKey: ['/api/market/crypto/top-movers'],
    refetchInterval: 30000, // 30 seconds
  });

  // Macro Economic Data
  const { data: macroData, isLoading: macroLoading } = useQuery({
    queryKey: ['/api/market/macro/indicators'],
    refetchInterval: 300000, // 5 minutes
  });

  // Sector Intelligence
  const { data: sectorData, isLoading: sectorLoading } = useQuery({
    queryKey: ['/api/market/sectors/intelligence'],
    refetchInterval: 60000, // 1 minute
  });

  // Content Intelligence
  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content/trending'],
    refetchInterval: 120000, // 2 minutes
  });

  // NEW COMPREHENSIVE ANALYTICS ENDPOINTS
  // Fed Calendar & Policy Intelligence
  const { data: fedCalendar, isLoading: fedLoading } = useQuery({
    queryKey: ['/api/fed/calendar'],
    refetchInterval: 300000, // 5 minutes
  });

  // Advanced Crypto Analytics (Volatility, Correlations, Patterns)
  const { data: advancedCrypto, isLoading: advancedCryptoLoading } = useQuery({
    queryKey: ['/api/market/crypto/advanced-analytics'],
    refetchInterval: 60000, // 1 minute
  });

  // DeFi & On-Chain Analytics
  const { data: defiAnalytics, isLoading: defiLoading } = useQuery({
    queryKey: ['/api/defi/analytics'],
    refetchInterval: 120000, // 2 minutes
  });

  // Risk Assessment & Portfolio Analytics
  const { data: riskAssessment, isLoading: riskLoading } = useQuery({
    queryKey: ['/api/risk/assessment'],
    refetchInterval: 180000, // 3 minutes
  });

  // Derivatives & Options Flow
  const { data: derivativesData, isLoading: derivativesLoading } = useQuery({
    queryKey: ['/api/derivatives/analytics'],
    refetchInterval: 240000, // 4 minutes
  });

  // Market Events & Economic Calendar
  const { data: marketEvents, isLoading: marketEventsLoading } = useQuery({
    queryKey: ['/api/market/events'],
    refetchInterval: 300000, // 5 minutes
  });

  // Mock data while APIs are being restored
  const mockCryptoAssets: CryptoAsset[] = [
    { symbol: 'SUI', name: 'Sui', price: 3.64, change24h: -6.57, volume24h: 1750000000, marketCap: 9800000000 },
    { symbol: 'DOGE', name: 'Dogecoin', price: 0.27, change24h: -4.85, volume24h: 840000000, marketCap: 38000000000 },
    { symbol: 'LINK', name: 'Chainlink', price: 23.50, change24h: -4.80, volume24h: 650000000, marketCap: 14000000000 },
    { symbol: 'HYPE', name: 'Hyperliquid', price: 56.23, change24h: -4.22, volume24h: 320000000, marketCap: 5600000000 },
    { symbol: 'BCH', name: 'Bitcoin Cash', price: 600.61, change24h: -4.11, volume24h: 280000000, marketCap: 12000000000 },
    { symbol: 'AVAX', name: 'Avalanche', price: 33.78, change24h: -4.00, volume24h: 420000000, marketCap: 15000000000 },
  ];

  const mockSectors: SectorData[] = [
    { name: 'DeFi', assets: 2, volume: 712500000, sentiment: -29, change24h: -4.12 },
    { name: 'Layer 1', assets: 8, volume: 892500000, sentiment: -34, change24h: -3.26 },
    { name: 'Layer 2', assets: 6, volume: 405600000, sentiment: 16, change24h: -6.89 },
    { name: 'Gaming', assets: 0, volume: 0, sentiment: 56, change24h: 0.00 },
    { name: 'AI & Data', assets: 0, volume: 0, sentiment: 50, change24h: 0.00 },
    { name: 'Memecoins', assets: 3, volume: 47800000, sentiment: 25, change24h: -5.10 },
  ];

  const mockMacroIndicators: MacroIndicator[] = [
    { name: 'M2 Money Supply', value: '$21.1T', change: '+2.3%', trend: 'up', impact: 'high' },
    { name: 'Federal Funds Rate', value: '5.50%', change: '0.00%', trend: 'neutral', impact: 'high' },
    { name: 'CPI Inflation', value: '3.2%', change: '-0.1%', trend: 'down', impact: 'high' },
    { name: 'Unemployment Rate', value: '3.9%', change: '+0.1%', trend: 'up', impact: 'medium' },
    { name: 'GDP Growth (Q4)', value: '2.8%', change: '+0.3%', trend: 'up', impact: 'high' },
    { name: 'DXY Index', value: '106.2', change: '-0.5%', trend: 'down', impact: 'medium' },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    return { icon, color, value: `${isPositive ? '+' : ''}${change.toFixed(2)}%` };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Discover</h1>
              <p className="text-gray-300 mt-1">Comprehensive Market Analytics & Intelligence</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
              <div className="flex gap-2">
                {['1h', '8h', '24h', '7d'].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={selectedTimeframe === timeframe 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'border-white/20 text-gray-300 hover:bg-white/10'
                    }
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Market Pulse */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Market Pulse</h2>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              Live
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockCryptoAssets.map((asset) => {
              const changeData = formatChange(asset.change24h);
              const ChangeIcon = changeData.icon;
              
              return (
                <Card key={asset.symbol} className="bg-black/40 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{asset.symbol}</h3>
                        <p className="text-gray-400 text-sm">{asset.name}</p>
                      </div>
                      <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                        bearish
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">{formatNumber(asset.price)}</span>
                        <div className={`flex items-center gap-1 ${changeData.color}`}>
                          <ChangeIcon className="w-4 h-4" />
                          <span className="font-medium">{changeData.value}</span>
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        <div>Vol: {formatNumber(asset.volume24h)}</div>
                        <div>MCap: {formatNumber(asset.marketCap)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.section>

        {/* Macro Economic Dashboard */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Macro Economic Indicators</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockMacroIndicators.map((indicator) => {
              const isPositive = indicator.trend === 'up';
              const isNeutral = indicator.trend === 'neutral';
              const color = isNeutral ? 'text-gray-400' : isPositive ? 'text-green-400' : 'text-red-400';
              const bgColor = isNeutral ? 'bg-gray-500/20' : isPositive ? 'bg-green-500/20' : 'bg-red-500/20';
              
              return (
                <Card key={indicator.name} className="bg-black/40 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white text-sm">{indicator.name}</h3>
                      <Badge variant="secondary" className={`${bgColor} ${color} border-current/30`}>
                        {indicator.impact}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-white">{indicator.value}</div>
                      <div className={`text-sm font-medium ${color}`}>
                        {indicator.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.section>

        {/* Sector Intelligence */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Sector Intelligence</h2>
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
              Real-time Correlations
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSectors.map((sector) => {
              const changeData = formatChange(sector.change24h);
              const ChangeIcon = changeData.icon;
              const sentimentColor = sector.sentiment >= 0 ? 'text-green-400' : 'text-red-400';
              
              return (
                <Card key={sector.name} className="bg-black/40 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-white">{sector.name}</h3>
                      <div className={`flex items-center gap-1 ${changeData.color}`}>
                        <ChangeIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{changeData.value}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Assets</span>
                        <span className="font-medium">{sector.assets}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Volume</span>
                        <span className="font-medium">{formatNumber(sector.volume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Sentiment</span>
                        <span className={`font-medium ${sentimentColor}`}>{sector.sentiment}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: '50%' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.section>

        {/* Fed Calendar & Policy Intelligence */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Fed Policy Intelligence</h2>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Live FOMC
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
              View Full Calendar
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(fedCalendar as any)?.calendar?.upcomingMeetings?.slice(0, 2).map((meeting: any, index: number) => (
              <Card key={meeting.id || index} className="bg-black/40 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-white">{meeting.title}</h3>
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {meeting.eventType === 'fomc_meeting' ? 'FOMC' : 'Economic'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-300">{meeting.description}</div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date</span>
                      <span className="font-medium text-white">
                        {new Date(meeting.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="col-span-2">
                <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="animate-pulse text-gray-400">Loading Fed calendar...</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </motion.section>

        {/* Advanced Crypto Analytics */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Advanced Crypto Analytics</h2>
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                AI-Powered
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
              Pattern Analysis
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Volatility Forecast */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Volatility Forecast</h3>
                {(advancedCrypto as any)?.analytics?.volatility?.forecast ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-cyan-400">
                      {((advancedCrypto as any).analytics.volatility.forecast.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-300">
                      Confidence: {((advancedCrypto as any).analytics.volatility.forecast.prediction * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {(advancedCrypto as any).analytics.volatility.forecast.reasoning?.[0] || 'Technical analysis'}
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse text-gray-400">Loading forecast...</div>
                )}
              </CardContent>
            </Card>

            {/* Correlation Matrix */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Correlation Matrix</h3>
                {(advancedCrypto as any)?.analytics?.correlations ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-400">
                      {Object.keys((advancedCrypto as any).analytics.correlations.matrix || {}).length}
                    </div>
                    <div className="text-sm text-gray-300">Active pairs tracked</div>
                    <div className="text-xs text-gray-400">Real-time correlation analysis</div>
                  </div>
                ) : (
                  <div className="animate-pulse text-gray-400">Loading correlations...</div>
                )}
              </CardContent>
            </Card>

            {/* Pattern Recognition */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Pattern Recognition</h3>
                {(advancedCrypto as any)?.analytics?.patterns ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-purple-400">
                      {Array.isArray((advancedCrypto as any).analytics.patterns) ? (advancedCrypto as any).analytics.patterns.length : 0}
                    </div>
                    <div className="text-sm text-gray-300">Patterns detected</div>
                    <div className="text-xs text-gray-400">ML-powered analysis</div>
                  </div>
                ) : (
                  <div className="animate-pulse text-gray-400">Loading patterns...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* DeFi & On-Chain Analytics */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">DeFi Analytics</h2>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                On-Chain
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
              Protocol Deep Dive
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Total Value Locked</h3>
                <div className="text-2xl font-bold text-yellow-400">
                  ${(defiAnalytics as any)?.defi?.totalValueLocked?.current ? 
                    ((defiAnalytics as any).defi.totalValueLocked.current / 1e9).toFixed(1) + 'B' : 
                    '...'
                  }
                </div>
                <div className="text-sm text-gray-300">
                  {(defiAnalytics as any)?.defi?.totalValueLocked?.change24h && (
                    <span className={(defiAnalytics as any).defi.totalValueLocked.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {(defiAnalytics as any).defi.totalValueLocked.change24h >= 0 ? '+' : ''}
                      {(defiAnalytics as any).defi.totalValueLocked.change24h.toFixed(1)}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Top Protocol</h3>
                <div className="text-xl font-bold text-blue-400">
                  {(defiAnalytics as any)?.defi?.totalValueLocked?.topProtocols?.[0]?.name || 'Uniswap'}
                </div>
                <div className="text-sm text-gray-300">
                  ${(defiAnalytics as any)?.defi?.totalValueLocked?.topProtocols?.[0]?.tvl ? 
                    ((defiAnalytics as any).defi.totalValueLocked.topProtocols[0].tvl / 1e9).toFixed(1) + 'B TVL' : 
                    '8.5B TVL'
                  }
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Yield Opportunities</h3>
                <div className="text-xl font-bold text-green-400">
                  {(defiAnalytics as any)?.defi?.yieldOpportunities?.topAPY || '12.5%'}
                </div>
                <div className="text-sm text-gray-300">Highest APY available</div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">DEX Volume</h3>
                <div className="text-xl font-bold text-purple-400">
                  ${(defiAnalytics as any)?.defi?.dexAnalytics?.volume24h ? 
                    ((defiAnalytics as any).defi.dexAnalytics.volume24h / 1e9).toFixed(1) + 'B' : 
                    '2.1B'
                  }
                </div>
                <div className="text-sm text-gray-300">24h trading volume</div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Risk Assessment & Portfolio Analytics */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold text-white">Risk Assessment</h2>
              <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                Real-time
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
              Stress Test
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Portfolio VaR</h3>
                <div className="text-2xl font-bold text-red-400">
                  {(riskAssessment as any)?.risk?.portfolioVaR?.oneDay ? 
                    `${((riskAssessment as any).risk.portfolioVaR.oneDay * 100).toFixed(1)}%` : 
                    '-5.8%'
                  }
                </div>
                <div className="text-sm text-gray-300">1-day VaR @ 95%</div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Market Risk</h3>
                <div className="text-xl font-bold text-orange-400">
                  {(riskAssessment as any)?.risk?.marketRisk?.riskLevel || 'Medium'}
                </div>
                <div className="text-sm text-gray-300">
                  Score: {(riskAssessment as any)?.risk?.marketRisk?.score || 65}/100
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Liquidity Score</h3>
                <div className="text-xl font-bold text-green-400">
                  {(riskAssessment as any)?.risk?.liquidityProfile?.liquidityScore || 85}
                </div>
                <div className="text-sm text-gray-300">
                  Exit: {(riskAssessment as any)?.risk?.liquidityProfile?.timeToExit || '< 1 hour'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Stress Tests</h3>
                <div className="text-xl font-bold text-purple-400">
                  {Array.isArray((riskAssessment as any)?.risk?.stressTest) ? 
                    (riskAssessment as any).risk.stressTest.length : 
                    3
                  }
                </div>
                <div className="text-sm text-gray-300">Scenarios tested</div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Derivatives & Options Analytics */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl font-semibold text-white">Derivatives Analytics</h2>
              <Badge variant="secondary" className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                Options Flow
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
              IV Surface
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Options Flow</h3>
                <div className="text-xl font-bold text-pink-400">
                  {Array.isArray((derivativesData as any)?.derivatives?.optionsFlow) ? 
                    (derivativesData as any).derivatives.optionsFlow.length : 
                    50
                  }
                </div>
                <div className="text-sm text-gray-300">Active contracts</div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Futures Data</h3>
                <div className="text-xl font-bold text-blue-400">
                  {Array.isArray((derivativesData as any)?.derivatives?.futuresData) ? 
                    (derivativesData as any).derivatives.futuresData.length : 
                    25
                  }
                </div>
                <div className="text-sm text-gray-300">Futures tracked</div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Implied Vol</h3>
                <div className="text-xl font-bold text-yellow-400">
                  {(derivativesData as any)?.derivatives?.volSurface?.averageIV ? 
                    `${((derivativesData as any).derivatives.volSurface.averageIV * 100).toFixed(1)}%` : 
                    '65.3%'
                  }
                </div>
                <div className="text-sm text-gray-300">BTC average IV</div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2">Market Events</h3>
                <div className="text-xl font-bold text-cyan-400">
                  {Array.isArray((marketEvents as any)?.events?.thisWeek) ? 
                    (marketEvents as any).events.thisWeek.length : 
                    5
                  }
                </div>
                <div className="text-sm text-gray-300">This week</div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Content Intelligence */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Content Intelligence</h2>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                AI-Ranked
              </Badge>
            </div>
            <div className="flex gap-2">
              {['All Sources', 'Social', 'Videos', 'News'].map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className={activeFilter === filter 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                  }
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
          
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Loading trending stories...</h3>
                <p className="text-gray-400">Analyzing content intelligence across platforms...</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 mt-8"
        >
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Zap className="w-4 h-4 mr-2" />
            Create AI Summary
          </Button>
          <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
            <Users className="w-4 h-4 mr-2" />
            Social Activity
          </Button>
          <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
            <BarChart3 className="w-4 h-4 mr-2" />
            DeFi Analytics
          </Button>
        </motion.div>
      </div>
    </div>
  );
}