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

        {/* Content Intelligence */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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