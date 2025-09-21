import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import CountdownTimer from '@/components/CountdownTimer';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Clock, 
  Eye, 
  Heart, 
  MessageSquare, 
  Repeat2,
  Globe,
  DollarSign,
  BarChart3,
  Flame,
  Star,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Filter,
  Search,
  Bell,
  Target,
  Users,
  Calendar,
  Newspaper,
  Video,
  RefreshCw,
  Sparkles,
  Brain,
  Shield,
  AlertTriangle,
  TrendingDownIcon,
  Gauge,
  PieChart,
  Scale,
  Calculator,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  LineChart,
  TrendingUpIcon,
  TriangleIcon as Triangle,
  CircleIcon as Circle,
  SquareIcon as Square,
  HexagonIcon as Hexagon,
  Crosshair,
  BarChart2,
  Layers
} from 'lucide-react';

// Types for pattern recognition
interface ChartPattern {
  id: string;
  symbol: string;
  patternType: string;
  timeframe: string;
  confidence: number;
  status: 'active' | 'completed' | 'failed';
  detectedAt: string;
  targetPrice?: number;
  stopLoss?: number;
  description: string;
}

interface TrendAnalysis {
  symbol: string;
  primaryTrend: {
    direction: 'bullish' | 'bearish' | 'sideways';
    strength: number;
    duration: string;
  };
  technicalIndicators: {
    rsi: number;
    macd: { line: number; signal: number; histogram: number };
    adx: number;
    bollingerBands: { upper: number; middle: number; lower: number };
    volume: { trend: string; strength: number };
  };
  supportResistance: Array<{
    level: number;
    type: 'support' | 'resistance';
    strength: number;
  }>;
}

interface MarketCycle {
  phase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  confidence: number;
  duration: string;
  nextPhaseEstimate: string;
}

interface PatternAlert {
  id: string;
  symbol: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

interface TradingSetup {
  id: string;
  symbol: string;
  setupType: string;
  direction: 'long' | 'short';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  riskReward: number;
  timeframe: string;
  rationale: string;
}

// Volatility Forecasting Section Component
const VolatilityForecastingSection = () => {
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [activeVolTab, setActiveVolTab] = useState<string>('overview');

  // Volatility forecasting queries
  const { data: volatilityAnalysis, isLoading: volatilityLoading } = useQuery({
    queryKey: ['/api/volatility-forecasting/discover-analysis'],
    staleTime: 60 * 1000, // 1 minute
    retry: 1
  });

  const { data: assetForecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['/api/volatility-forecasting/forecast', selectedAsset],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: stressIndicators, isLoading: stressLoading } = useQuery({
    queryKey: ['/api/volatility-forecasting/stress-indicators'],
    staleTime: 30 * 1000, // 30 seconds
    retry: 1
  });

  const { data: riskRegime, isLoading: regimeLoading } = useQuery({
    queryKey: ['/api/volatility-forecasting/risk-regime'],
    staleTime: 60 * 1000, // 1 minute
    retry: 1
  });

  const { data: crisisIndicators, isLoading: crisisLoading } = useQuery({
    queryKey: ['/api/volatility-forecasting/crisis-indicators'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: volatilityAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/volatility-forecasting/alerts'],
    staleTime: 30 * 1000, // 30 seconds
    retry: 1
  });

  // Helper functions
  const getStressColor = (level: number) => {
    if (level >= 80) return 'text-red-400 bg-red-500/20 border-red-400/30';
    if (level >= 60) return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
    if (level >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
    return 'text-green-400 bg-green-500/20 border-green-400/30';
  };

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'risk_on': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'risk_off': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'crisis': return 'text-red-600 bg-red-600/30 border-red-500/40';
      case 'recovery': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'accumulation': return 'text-cyan-400 bg-cyan-500/20 border-cyan-400/30';
      case 'distribution': return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-400" />;
      default: return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    }
  };

  const getVolatilityIcon = (regime: string) => {
    switch (regime) {
      case 'extreme': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-400" />;
      case 'normal': return <Activity className="h-4 w-4 text-green-400" />;
      default: return <Gauge className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Volatility Overview Cards */}
      {volatilityAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Stress Level */}
          <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm font-medium">Market Stress</p>
                  <p className="text-white text-2xl font-bold">{volatilityAnalysis.overview.overallStressLevel}</p>
                  <p className="text-gray-400 text-xs">0-100 Scale</p>
                </div>
                <div className={`p-3 rounded-full ${getStressColor(volatilityAnalysis.overview.overallStressLevel)}`}>
                  <Gauge className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Regime */}
          <Card className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Risk Regime</p>
                  <p className="text-white text-lg font-bold capitalize">{volatilityAnalysis.riskRegime.current}</p>
                  <p className="text-gray-400 text-xs">{volatilityAnalysis.riskRegime.confidence}% confidence</p>
                </div>
                <div className={`p-3 rounded-full ${getRegimeColor(volatilityAnalysis.riskRegime.current)}`}>
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crisis Probability */}
          <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Crisis Risk</p>
                  <p className="text-white text-2xl font-bold">{volatilityAnalysis.crisisWatch.highestProbability.toFixed(0)}%</p>
                  <p className="text-gray-400 text-xs capitalize">{volatilityAnalysis.crisisWatch.timeframe}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  volatilityAnalysis.crisisWatch.highestProbability > 50 ? 'bg-red-500/20 border-red-400/30' : 'bg-purple-500/20 border-purple-400/30'
                }`}>
                  <AlertTriangle className={`h-6 w-6 ${
                    volatilityAnalysis.crisisWatch.highestProbability > 50 ? 'text-red-400' : 'text-purple-400'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Active Alerts</p>
                  <p className="text-white text-2xl font-bold">{volatilityAnalysis.overview.activeAlertsCount}</p>
                  <p className="text-gray-400 text-xs">Need attention</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/20 border-yellow-400/30">
                  <Bell className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Volatility Analysis */}
      <Tabs value={activeVolTab} onValueChange={setActiveVolTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
            Overview
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
            Forecasts
          </TabsTrigger>
          <TabsTrigger value="stress" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
            Stress Analysis
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {volatilityAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volatility Heatmap */}
              <Card className="bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-red-300 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Volatility Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {volatilityAnalysis.volatilityHeatmap.map((asset: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getVolatilityIcon(asset.regime) ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                          {getVolatilityIcon(asset.regime)}
                        </div>
                        <div>
                          <span className="text-white font-medium">{asset.symbol}</span>
                          <p className="text-gray-400 text-xs">Current: {asset.currentVol.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          asset.change > 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {asset.forecastVol.toFixed(1)}%
                        </p>
                        <p className="text-gray-400 text-xs">
                          {asset.change > 0 ? '+' : ''}{asset.change.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Regime Analysis */}
              <Card className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-blue-300 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Regime Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Current Regime:</span>
                    <Badge className={`${getRegimeColor(volatilityAnalysis.riskRegime.current)} border-0`}>
                      {(volatilityAnalysis.riskRegime?.current || 'unknown').replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Duration:</span>
                    <span className="text-white">{volatilityAnalysis.riskRegime.duration} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Confidence:</span>
                    <span className="text-white">{volatilityAnalysis.riskRegime.confidence}%</span>
                  </div>
                  <div className="pt-3 border-t border-blue-500/20">
                    <p className="text-blue-300 text-sm font-medium mb-2">Recommendation:</p>
                    <p className="text-gray-300 text-sm capitalize">
                      {volatilityAnalysis.riskRegime.recommendations}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Stress Indicators */}
          {volatilityAnalysis && volatilityAnalysis.stressIndicators && (
            <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-orange-300 flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Top Stress Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {volatilityAnalysis.stressIndicators.map((indicator: any, index: number) => (
                    <div key={index} className="p-3 bg-black/20 rounded-lg border border-orange-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{indicator.name}</span>
                        <Badge className={`text-xs border-0 ${getStressColor(indicator.normalizedValue)}`}>
                          {(indicator.level || 'unknown').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Value:</span>
                        <span className="text-white text-sm">{indicator.normalizedValue.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Percentile:</span>
                        <span className="text-gray-300 text-xs">{indicator.percentile.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-6">
          <div className="flex gap-4 mb-4">
            <select 
              value={selectedAsset} 
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              {['BTC', 'ETH', 'SOL', 'SPY', 'QQQ'].map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>

          {assetForecast && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volatility Predictions */}
              <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-purple-300 flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Volatility Predictions - {selectedAsset}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assetForecast.predictions.map((pred: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20">
                      <div>
                        <span className="text-white font-medium">{pred.horizon}</span>
                        <p className="text-gray-400 text-xs">{pred.confidence}% confidence</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{pred.expectedVolatility.toFixed(1)}%</p>
                        <p className="text-gray-400 text-xs">
                          {pred.range.lower.toFixed(1)}% - {pred.range.upper.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Metrics */}
              <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-red-300 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Metrics - {selectedAsset}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">VaR 95%</p>
                      <p className="text-red-400 font-bold text-lg">{assetForecast.riskMetrics.var95.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">VaR 99%</p>
                      <p className="text-red-400 font-bold text-lg">{assetForecast.riskMetrics.var99.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Expected Shortfall</p>
                      <p className="text-orange-400 font-bold text-lg">{assetForecast.riskMetrics.expectedShortfall.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Max Drawdown Risk</p>
                      <p className="text-yellow-400 font-bold text-lg">{assetForecast.riskMetrics.maxDrawdownProbability.toFixed(0)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Stress Analysis Tab */}
        <TabsContent value="stress" className="space-y-6">
          {stressIndicators && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stressIndicators.indicators.map((indicator: any, index: number) => (
                <Card key={index} className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-orange-300 flex items-center gap-2 text-base">
                      <Gauge className="h-4 w-4" />
                      {indicator.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Level:</span>
                      <Badge className={`text-xs border-0 ${getStressColor(indicator.normalizedValue)}`}>
                        {(indicator.level || 'unknown').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Value:</span>
                      <span className="text-white font-medium">{indicator.normalizedValue.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Percentile:</span>
                      <span className="text-gray-300">{indicator.percentile.toFixed(0)}%</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">{indicator.interpretation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Crisis Indicators */}
          {crisisIndicators && (
            <Card className="bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Crisis Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {crisisIndicators.indicators.map((indicator: any, index: number) => (
                    <div key={index} className="p-4 bg-black/20 rounded-lg border border-red-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">{indicator.name}</span>
                        <Badge className={`text-xs border-0 ${
                          indicator.probability > 70 ? 'bg-red-500/30 text-red-300' :
                          indicator.probability > 40 ? 'bg-orange-500/30 text-orange-300' :
                          'bg-yellow-500/30 text-yellow-300'
                        }`}>
                          {indicator.probability.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Type:</span>
                          <span className="text-gray-300 text-sm capitalize">{indicator.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Severity:</span>
                          <span className="text-gray-300 text-sm capitalize">{indicator.severity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Timeframe:</span>
                          <span className="text-gray-300 text-sm">{indicator.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {volatilityAlerts && volatilityAlerts.alerts && volatilityAlerts.alerts.length > 0 ? (
            <div className="space-y-4">
              {volatilityAlerts.alerts.map((alert: any, index: number) => (
                <Card key={index} className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityIcon(alert.severity)}
                          <span className="text-white font-medium">{alert.title}</span>
                          <Badge className={`text-xs border-0 ${
                            alert.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                            alert.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                            alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {(alert.severity || 'unknown').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{alert.description}</p>
                        {alert.symbol && (
                          <p className="text-gray-400 text-xs">Asset: {alert.symbol}</p>
                        )}
                        <p className="text-gray-400 text-xs">
                          Current: {alert.currentValue} | Threshold: {alert.thresholdValue} | 
                          Deviation: {alert.deviationPercent > 0 ? '+' : ''}{alert.deviationPercent.toFixed(1)}%
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-3 border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/20"
                        data-testid={`button-acknowledge-vol-alert-${alert.id}`}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-300">No active volatility alerts</p>
                <p className="text-gray-400 text-sm mt-2">All systems operating within normal parameters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Pattern Recognition Section Component
const PatternRecognitionSection = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('4h');
  const [activeTab, setActiveTab] = useState<string>('patterns');

  // Pattern recognition queries
  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['/api/patterns/detect', selectedSymbol, selectedTimeframe],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: trendAnalysis, isLoading: trendLoading } = useQuery({
    queryKey: ['/api/patterns/trend', selectedSymbol, selectedTimeframe],
    staleTime: 30 * 1000, // 30 seconds
    retry: 1
  });

  const { data: marketCycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['/api/patterns/cycles', selectedSymbol],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const { data: patternAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/patterns/alerts'],
    staleTime: 30 * 1000, // 30 seconds
    retry: 1
  });

  const { data: tradingSetups, isLoading: setupsLoading } = useQuery({
    queryKey: ['/api/patterns/setups', selectedSymbol, selectedTimeframe],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: patternSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/patterns/summary'],
    staleTime: 60 * 1000, // 1 minute
    retry: 1
  });

  // Get pattern icon based on pattern type
  const getPatternIcon = (patternType: string) => {
    switch (patternType.toLowerCase()) {
      case 'triangle':
      case 'ascending_triangle':
      case 'descending_triangle':
        return Triangle;
      case 'head_and_shoulders':
      case 'inverse_head_and_shoulders':
        return Hexagon;
      case 'double_top':
      case 'double_bottom':
        return Square;
      case 'flag':
      case 'pennant':
        return Circle;
      default:
        return BarChart2;
    }
  };

  // Pattern confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400 bg-green-500/20 border-green-400/30';
    if (confidence >= 60) return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
    return 'text-red-400 bg-red-500/20 border-red-400/30';
  };

  // Trend direction color and icon
  const getTrendDisplay = (direction: string, strength: number) => {
    if (direction === 'bullish') {
      return {
        icon: TrendingUp,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-400/30'
      };
    } else if (direction === 'bearish') {
      return {
        icon: TrendingDown,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-400/30'
      };
    } else {
      return {
        icon: Activity,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-400/30'
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Asset and Timeframe Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-cyan-300 text-sm font-medium">Asset:</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-black/20 border border-cyan-500/30 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              data-testid="select-pattern-symbol"
            >
              {['BTC', 'ETH', 'SOL', 'LINK', 'UNI', 'AAVE', 'TSLA', 'NVDA'].map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-cyan-300 text-sm font-medium">Timeframe:</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-black/20 border border-cyan-500/30 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              data-testid="select-pattern-timeframe"
            >
              <option value="1h">1H</option>
              <option value="4h">4H</option>
              <option value="1d">1D</option>
              <option value="1w">1W</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30">
            <Activity className="h-3 w-3 mr-1" />
            Live Analysis
          </Badge>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-black/20 border border-gray-500/30">
          <TabsTrigger value="patterns" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            Patterns
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            Trends
          </TabsTrigger>
          <TabsTrigger value="cycles" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            Cycles
          </TabsTrigger>
          <TabsTrigger value="setups" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            Setups
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Chart Patterns Tab */}
        <TabsContent value="patterns" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {patternsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-20 bg-gray-600 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : patterns?.patterns?.length ? (
              patterns.patterns.map((pattern: ChartPattern, index: number) => {
                const PatternIcon = getPatternIcon(pattern.patternType);
                return (
                  <Card key={pattern.id} className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-cyan-300 flex items-center gap-2 text-lg">
                        <PatternIcon className="h-5 w-5" />
                        {(pattern.patternType || 'unknown').replace(/_/g, ' ').toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getConfidenceColor(pattern.confidence)}`}>
                            {pattern.confidence}% Confidence
                          </Badge>
                          <Badge className={`text-xs ${
                            pattern.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                            pattern.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                            'bg-red-500/20 text-red-300 border-red-400/30'
                          }`}>
                            {(pattern.status || 'unknown').toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-gray-400 text-xs">{pattern.timeframe}</span>
                      </div>
                      
                      {pattern.targetPrice && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Target</p>
                            <p className="text-green-400 font-medium">${pattern.targetPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Stop Loss</p>
                            <p className="text-red-400 font-medium">${pattern.stopLoss?.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-gray-300 text-sm">{pattern.description}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
                        <span className="text-gray-400 text-xs">
                          {new Date(pattern.detectedAt).toLocaleString()}
                        </span>
                        <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                          <Crosshair className="h-3 w-3 mr-1" />
                          View Chart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">No patterns detected for {selectedSymbol}</p>
                    <p className="text-gray-400 text-sm mt-2">Try a different timeframe or asset</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Trend Analysis Tab */}
        <TabsContent value="trends" className="mt-6">
          {trendLoading ? (
            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-700 rounded mb-4"></div>
                <div className="h-32 bg-gray-600 rounded"></div>
              </CardContent>
            </Card>
          ) : trendAnalysis?.data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Primary Trend */}
              <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-300 flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5" />
                    Primary Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const trendDisplay = getTrendDisplay(trendAnalysis.data.primaryTrend.direction, trendAnalysis.data.primaryTrend.strength);
                    const TrendIcon = trendDisplay.icon;
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${trendDisplay.bgColor} ${trendDisplay.borderColor} border`}>
                            <TrendIcon className={`h-6 w-6 ${trendDisplay.color}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${trendDisplay.color}`}>
                              {(trendAnalysis.data?.primaryTrend?.direction || 'unknown').toUpperCase()}
                            </p>
                            <p className="text-gray-400 text-sm">{trendAnalysis.data.primaryTrend.duration}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">{trendAnalysis.data.primaryTrend.strength}%</p>
                          <p className="text-gray-400 text-xs">Strength</p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        trendAnalysis.data.primaryTrend.direction === 'bullish' ? 'bg-green-500' :
                        trendAnalysis.data.primaryTrend.direction === 'bearish' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${trendAnalysis.data.primaryTrend.strength}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Indicators */}
              <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-300 flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Technical Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-black/20 rounded-lg border border-cyan-500/20">
                      <p className="text-gray-400 text-xs">RSI</p>
                      <p className={`font-bold text-lg ${
                        trendAnalysis.data.technicalIndicators.rsi > 70 ? 'text-red-400' :
                        trendAnalysis.data.technicalIndicators.rsi < 30 ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {trendAnalysis.data.technicalIndicators.rsi.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-black/20 rounded-lg border border-cyan-500/20">
                      <p className="text-gray-400 text-xs">ADX</p>
                      <p className={`font-bold text-lg ${
                        trendAnalysis.data.technicalIndicators.adx > 50 ? 'text-green-400' :
                        trendAnalysis.data.technicalIndicators.adx > 25 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {trendAnalysis.data.technicalIndicators.adx.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-black/20 rounded-lg border border-cyan-500/20">
                      <p className="text-gray-400 text-xs">MACD</p>
                      <p className={`font-bold text-lg ${
                        trendAnalysis.data.technicalIndicators.macd.line > trendAnalysis.data.technicalIndicators.macd.signal ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trendAnalysis.data.technicalIndicators.macd.line.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-black/20 rounded-lg border border-cyan-500/20">
                      <p className="text-gray-400 text-xs">Volume</p>
                      <p className={`font-bold text-lg ${
                        trendAnalysis.data.technicalIndicators.volume.trend === 'increasing' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trendAnalysis.data.technicalIndicators.volume.strength}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support & Resistance */}
              <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-cyan-300 flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Support & Resistance Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {trendAnalysis.data.supportResistance.slice(0, 4).map((level: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        level.type === 'support' ? 'bg-green-500/10 border-green-400/30' : 'bg-red-500/10 border-red-400/30'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${level.type === 'support' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <p className={`text-xs font-medium ${level.type === 'support' ? 'text-green-400' : 'text-red-400'}`}>
                            {(level.type || 'unknown').toUpperCase()}
                          </p>
                        </div>
                        <p className="text-white font-bold">${level.level.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">{level.strength}% strength</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <TrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">Trend analysis unavailable</p>
                <p className="text-gray-400 text-sm mt-2">Technical analysis will resume shortly</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Market Cycles Tab */}
        <TabsContent value="cycles" className="mt-6">
          {cyclesLoading ? (
            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-700 rounded mb-4"></div>
                <div className="h-24 bg-gray-600 rounded"></div>
              </CardContent>
            </Card>
          ) : marketCycles?.data ? (
            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Market Cycle Analysis - {selectedSymbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${
                      marketCycles.data.phase === 'accumulation' ? 'bg-blue-500/20 text-blue-300' :
                      marketCycles.data.phase === 'markup' ? 'bg-green-500/20 text-green-300' :
                      marketCycles.data.phase === 'distribution' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        marketCycles.data.phase === 'accumulation' ? 'bg-blue-400' :
                        marketCycles.data.phase === 'markup' ? 'bg-green-400' :
                        marketCycles.data.phase === 'distribution' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}></div>
                      {(marketCycles.data?.phase || 'unknown').toUpperCase()}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">Current Phase</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{marketCycles.data.confidence}%</p>
                    <p className="text-gray-400 text-sm">Confidence</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-300">{marketCycles.data.duration}</p>
                    <p className="text-gray-400 text-sm">Duration</p>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-lg p-4 border border-cyan-500/20">
                  <p className="text-cyan-300 font-medium mb-2">Phase Transition Estimate:</p>
                  <p className="text-gray-300">{marketCycles.data.nextPhaseEstimate}</p>
                </div>
                
                {/* Cycle Phases Visual */}
                <div className="grid grid-cols-4 gap-2">
                  {['accumulation', 'markup', 'distribution', 'markdown'].map((phase, index) => (
                    <div key={phase} className={`text-center p-3 rounded-lg border transition-all duration-300 ${
                      marketCycles.data.phase === phase 
                        ? 'border-cyan-400 bg-cyan-500/20' 
                        : 'border-gray-600 bg-gray-500/10'
                    }`}>
                      <p className={`text-xs font-medium ${
                        marketCycles.data.phase === phase ? 'text-cyan-300' : 'text-gray-400'
                      }`}>
                        {phase.charAt(0).toUpperCase() + phase.slice(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">Market cycle analysis unavailable</p>
                <p className="text-gray-400 text-sm mt-2">Cycle detection will resume shortly</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trading Setups Tab */}
        <TabsContent value="setups" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {setupsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-20 bg-gray-600 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : tradingSetups?.setups?.length ? (
              tradingSetups.setups.map((setup: TradingSetup) => (
                <Card key={setup.id} className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      {(setup.setupType || 'unknown').replace(/_/g, ' ').toUpperCase()}
                      <Badge className={`ml-auto ${setup.direction === 'long' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {(setup.direction || 'unknown').toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={`${getConfidenceColor(setup.confidence)}`}>
                        {setup.confidence}% Confidence
                      </Badge>
                      <span className="text-gray-400 text-sm">{setup.timeframe}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Entry</p>
                        <p className="text-blue-400 font-medium">${setup.entryPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Target</p>
                        <p className="text-green-400 font-medium">${setup.targetPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Stop</p>
                        <p className="text-red-400 font-medium">${setup.stopLoss.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-3 border border-cyan-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-300 text-xs font-medium">Risk/Reward Ratio</span>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                          1:{setup.riskReward.toFixed(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm">{setup.rationale}</p>
                    </div>
                    
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" data-testid={`button-setup-${setup.id}`}>
                      <Target className="h-4 w-4 mr-2" />
                      Execute Setup
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">No trading setups available for {selectedSymbol}</p>
                    <p className="text-gray-400 text-sm mt-2">Check back later for AI-generated opportunities</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Pattern Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <div className="space-y-4">
            {alertsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : patternAlerts?.alerts?.length ? (
              patternAlerts.alerts.map((alert: PatternAlert) => (
                <Card key={alert.id} className={`bg-gradient-to-br border backdrop-blur-sm ${
                  alert.severity === 'critical' ? 'from-red-900/30 to-red-800/20 border-red-500/50' :
                  alert.severity === 'high' ? 'from-orange-900/30 to-orange-800/20 border-orange-500/50' :
                  alert.severity === 'medium' ? 'from-yellow-900/30 to-yellow-800/20 border-yellow-500/50' :
                  'from-blue-900/30 to-blue-800/20 border-blue-500/50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Bell className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-400' :
                          alert.severity === 'high' ? 'text-orange-400' :
                          alert.severity === 'medium' ? 'text-yellow-400' :
                          'text-blue-400'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-gray-500/20 text-gray-300 text-xs">{alert.symbol}</Badge>
                            <Badge className={`text-xs ${
                              alert.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                              alert.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                              alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {(alert.severity || 'unknown').toUpperCase()}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge className="bg-green-500/20 text-green-300 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Acknowledged
                              </Badge>
                            )}
                          </div>
                          <p className="text-white font-medium">{alert.message}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">No active pattern alerts</p>
                  <p className="text-gray-400 text-sm mt-2">Pattern monitoring is active across all assets</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pattern Summary Dashboard */}
      {patternSummary?.data && (
        <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-gray-300 flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pattern Recognition Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs">Total Symbols</p>
                <p className="text-white font-bold text-lg">{patternSummary.data.overview.totalSymbols}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Avg Patterns</p>
                <p className="text-cyan-400 font-bold text-lg">{patternSummary.data.overview.avgPatternCount}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Avg Confidence</p>
                <p className="text-blue-400 font-bold text-lg">{(patternSummary.data.overview.avgConfidence * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Bullish</p>
                <p className="text-green-400 font-bold text-lg">{patternSummary.data.overview.bullishCount}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Bearish</p>
                <p className="text-red-400 font-bold text-lg">{patternSummary.data.overview.bearishCount}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs">Neutral</p>
                <p className="text-gray-400 font-bold text-lg">{patternSummary.data.overview.neutralCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Types for market data
interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  category: 'crypto' | 'stock' | 'commodity';
  momentum: 'bullish' | 'bearish' | 'neutral';
}

interface TrendingStory {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceType: 'farcaster' | 'youtube' | 'news' | 'summary';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    score: number;
  };
  metadata: {
    publishedAt: string;
    author: string;
    tags: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    trendingScore: number;
  };
  url?: string;
  thumbnail?: string;
}

interface SectorData {
  name: string;
  performance: number;
  volume: number;
  assets: number;
  trend: 'up' | 'down' | 'stable';
  sentiment: number;
}

// Institutional Analytics Components
const InstitutionalAnalyticsOverview = () => {
  const { data: institutionalOverview, isLoading } = useQuery({
    queryKey: ['/api/institutional/overview'],
    refetchInterval: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-emerald-900/20 via-teal-900/20 to-emerald-900/20 border-emerald-500/30 backdrop-blur-sm animate-pulse">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!institutionalOverview?.overview) return null;

  const overview = institutionalOverview.overview;
  const sentiment = overview.sentiment;
  const smartMoney = overview.smartMoneyMovements || [];
  const fundFlows = overview.fundFlows || [];
  
  const totalFlowValue = fundFlows.reduce((sum: number, flow: any) => sum + Math.abs(flow.value), 0);
  const smartMoneyVolume = smartMoney.reduce((sum: number, tx: any) => sum + tx.value, 0);

  return (
    <Card className="bg-gradient-to-r from-emerald-900/20 via-teal-900/20 to-emerald-900/20 border-emerald-500/30 backdrop-blur-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Smart Money Volume 24h</p>
            <p className="text-white font-bold text-lg">
              ${(smartMoneyVolume / 1e6).toFixed(1)}M
            </p>
            <p className="text-emerald-400 text-xs">{smartMoney.length} transactions</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Fund Flows 24h</p>
            <p className="text-white font-bold text-lg">
              ${(totalFlowValue / 1e6).toFixed(1)}M
            </p>
            <p className="text-cyan-400 text-xs">{fundFlows.length} flows tracked</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Institutional Sentiment</p>
            <p className={`font-bold text-lg ${sentiment?.overall > 0 ? 'text-green-400' : sentiment?.overall < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {sentiment ? (sentiment.overall * 100).toFixed(1) : 'N/A'}%
            </p>
            <p className="text-gray-400 text-xs">{sentiment?.trend || 'Unknown'}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Confidence Score</p>
            <p className="text-white font-bold text-lg">
              {sentiment?.confidence?.toFixed(0) || 'N/A'}%
            </p>
            <p className="text-purple-400 text-xs">Analysis strength</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SmartMoneyMovements = () => {
  const { data: smartMoney, isLoading } = useQuery({
    queryKey: ['/api/institutional/smart-money'],
    refetchInterval: 15000, // 15 seconds
  });

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-emerald-300 flex items-center gap-2">
          🧠 Smart Money Movements
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
            High Confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : smartMoney?.smartMoneyMovements?.length > 0 ? (
          <div className="space-y-3">
            {smartMoney.smartMoneyMovements.slice(0, 5).map((tx: any, idx: number) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-black/30 rounded-lg p-3 border-l-2 border-emerald-500/50"
                data-testid={`smart-money-${idx}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{tx.asset}</span>
                      <Badge className={`text-xs ${
                        tx.type === 'accumulation' ? 'bg-green-500/20 text-green-300' :
                        tx.type === 'distribution' ? 'bg-red-500/20 text-red-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {tx.type}
                      </Badge>
                      <Badge className={`text-xs ${
                        tx.impact === 'critical' ? 'bg-red-500/20 text-red-300' :
                        tx.impact === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {tx.impact}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-xs mb-1">
                      ${(tx.value / 1e6).toFixed(2)}M • {tx.strategy || 'Unknown Strategy'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.timestamp).toLocaleTimeString()} • Confidence: {tx.confidence}%
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No smart money movements detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const InstitutionalFundFlows = () => {
  const { data: fundFlows, isLoading } = useQuery({
    queryKey: ['/api/institutional/fund-flows'],
    refetchInterval: 30000, // 30 seconds
  });

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 flex items-center gap-2">
          💰 Fund Flows
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30">
            Exchange Tracking
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : fundFlows?.fundFlows?.length > 0 ? (
          <div className="space-y-3">
            {fundFlows.fundFlows.slice(0, 5).map((flow: any, idx: number) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-black/30 rounded-lg p-3 border-l-2 border-cyan-500/50"
                data-testid={`fund-flow-${idx}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{flow.asset}</span>
                      <Badge className={`text-xs ${
                        flow.flowType === 'inflow' ? 'bg-green-500/20 text-green-300' :
                        flow.flowType === 'outflow' ? 'bg-red-500/20 text-red-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {flow.flowType}
                      </Badge>
                      <Badge className={`text-xs ${
                        flow.significance === 'critical' ? 'bg-red-500/20 text-red-300' :
                        flow.significance === 'major' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {flow.significance}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-xs mb-1">
                      {flow.sourceExchange} → {flow.destinationExchange}
                    </p>
                    <p className="text-gray-300 text-xs mb-1">
                      ${(flow.value / 1e6).toFixed(2)}M • {flow.amount.toLocaleString()} {flow.asset}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(flow.timestamp).toLocaleTimeString()} • Score: {flow.institutionalScore}%
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No institutional flows detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const InstitutionalSentiment = () => {
  const { data: sentimentData, isLoading } = useQuery({
    queryKey: ['/api/institutional/sentiment'],
    refetchInterval: 60000, // 1 minute
  });

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-purple-300 flex items-center gap-2">
          📊 Institutional Sentiment
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
            7D Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-800 rounded"></div>
              <div className="h-3 bg-gray-800 rounded w-3/4"></div>
            </div>
          </div>
        ) : sentimentData?.sentiment ? (
          <div className="space-y-4">
            {/* Overall Sentiment */}
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                sentimentData.sentiment.overall > 0.3 ? 'text-green-400' :
                sentimentData.sentiment.overall < -0.3 ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {(sentimentData.sentiment.overall * 100).toFixed(1)}%
              </div>
              <p className="text-gray-400 text-sm mb-1">Overall Sentiment</p>
              <Badge className={`text-xs ${
                sentimentData.sentiment.trend === 'increasingly_bullish' ? 'bg-green-500/20 text-green-300' :
                sentimentData.sentiment.trend === 'increasingly_bearish' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {sentimentData.sentiment.trend.replace('_', ' ')}
              </Badge>
            </div>

            {/* Sentiment Indicators */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Accumulation</span>
                <span className="text-green-400 text-xs">
                  {sentimentData.sentiment.indicators.accumulation_score}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Distribution</span>
                <span className="text-red-400 text-xs">
                  {sentimentData.sentiment.indicators.distribution_score}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Exchange Flows</span>
                <span className="text-cyan-400 text-xs">
                  {sentimentData.sentiment.indicators.exchange_flows}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Whale Activity</span>
                <span className="text-purple-400 text-xs">
                  {sentimentData.sentiment.indicators.whale_activity}%
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-gray-500 text-xs">
                Confidence: {sentimentData.sentiment.confidence}% • 
                Updated: {new Date(sentimentData.sentiment.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sentiment analysis unavailable</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const InstitutionalPositioning = () => {
  const { data: positioningData, isLoading } = useQuery({
    queryKey: ['/api/institutional/positioning'],
    refetchInterval: 60000, // 1 minute
  });

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-orange-300 flex items-center gap-2">
          🎯 Asset Positioning
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
            Net Flows
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : positioningData?.positioning?.length > 0 ? (
          <div className="space-y-4">
            {positioningData.positioning.map((pos: any, idx: number) => (
              <motion.div
                key={pos.asset}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-black/30 rounded-lg p-4"
                data-testid={`positioning-${pos.asset}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{pos.asset}</span>
                  <Badge className={`text-xs ${
                    pos.sentiment === 'accumulating' ? 'bg-green-500/20 text-green-300' :
                    pos.sentiment === 'distributing' ? 'bg-red-500/20 text-red-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {pos.sentiment}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Net Flow 7d:</span>
                    <span className={pos.netFlow > 0 ? 'text-green-400' : pos.netFlow < 0 ? 'text-red-400' : 'text-gray-400'}>
                      {pos.netFlow > 0 ? '+' : ''}${(pos.netFlow / 1e6).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Flow 24h:</span>
                    <span className="text-cyan-400">${(pos.flow24h / 1e6).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Concentration:</span>
                    <span className="text-purple-400">{pos.concentration}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Signal Strength:</span>
                    <span className="text-yellow-400">{pos.strength}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No positioning data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const WalletAnalysis = () => {
  const { data: walletData, isLoading } = useQuery({
    queryKey: ['/api/institutional/wallet-analysis'],
    refetchInterval: 300000, // 5 minutes
  });

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-indigo-300 flex items-center gap-2">
          🏛️ Wallet Analysis
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30">
            Categorized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-800 rounded w-3/4"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
          </div>
        ) : walletData?.walletAnalysis ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  {walletData.walletAnalysis.totalWallets}
                </div>
                <p className="text-gray-400 text-xs">Total Tracked</p>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">
                  {walletData.walletAnalysis.categorized}
                </div>
                <p className="text-gray-400 text-xs">Verified</p>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <p className="text-gray-400 text-xs font-medium mb-2">Categories:</p>
              {Object.entries(walletData.walletAnalysis.categories || {}).map(([category, count]) => (
                <div key={category} className="flex justify-between text-xs">
                  <span className="text-gray-300 capitalize">{category.replace('_', ' ')}</span>
                  <span className="text-white">{count as number}</span>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            {walletData.walletAnalysis.recentActivity?.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-400 text-xs font-medium">Recent Activity:</p>
                {walletData.walletAnalysis.recentActivity.slice(0, 3).map((wallet: any, idx: number) => (
                  <div key={wallet.address} className="bg-black/30 rounded p-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs">
                        {wallet.type}
                      </Badge>
                      <span className="text-white text-xs font-medium">{wallet.name}</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(wallet.lastActivity).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Wallet analysis unavailable</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const FlowTrends = () => {
  const { data: flowData, isLoading } = useQuery({
    queryKey: ['/api/institutional/fund-flows'],
    refetchInterval: 60000, // 1 minute
  });

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-pink-300 flex items-center gap-2">
          📈 Flow Trends
          <Badge className="bg-pink-500/20 text-pink-300 border-pink-400/30">
            Trending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : flowData?.fundFlows?.length > 0 ? (
          <div className="space-y-4">
            {/* Flow Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-green-400 font-bold text-sm">
                  {flowData.fundFlows.filter((f: any) => f.flowType === 'inflow').length}
                </div>
                <p className="text-gray-400 text-xs">Inflows</p>
              </div>
              <div>
                <div className="text-red-400 font-bold text-sm">
                  {flowData.fundFlows.filter((f: any) => f.flowType === 'outflow').length}
                </div>
                <p className="text-gray-400 text-xs">Outflows</p>
              </div>
              <div>
                <div className="text-blue-400 font-bold text-sm">
                  {flowData.fundFlows.filter((f: any) => f.flowType === 'internal_transfer').length}
                </div>
                <p className="text-gray-400 text-xs">Internal</p>
              </div>
            </div>

            {/* Market Timing Analysis */}
            <div className="space-y-2">
              <p className="text-gray-400 text-xs font-medium">Market Timing:</p>
              {['pre_pump', 'accumulation', 'distribution'].map(timing => {
                const count = flowData.fundFlows.filter((f: any) => f.marketTiming === timing).length;
                return count > 0 ? (
                  <div key={timing} className="flex justify-between text-xs">
                    <span className="text-gray-300 capitalize">{timing.replace('_', ' ')}</span>
                    <span className="text-white">{count}</span>
                  </div>
                ) : null;
              })}
            </div>

            {/* Significance Levels */}
            <div className="space-y-2">
              <p className="text-gray-400 text-xs font-medium">Significance:</p>
              {['critical', 'major', 'moderate'].map(significance => {
                const count = flowData.fundFlows.filter((f: any) => f.significance === significance).length;
                return count > 0 ? (
                  <div key={significance} className="flex justify-between text-xs">
                    <span className="text-gray-300 capitalize">{significance}</span>
                    <Badge className={`text-xs ${
                      significance === 'critical' ? 'bg-red-500/20 text-red-300' :
                      significance === 'major' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {count}
                    </Badge>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No flow trends available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// =============================================================================
// MARKET EVENT MODELING COMPONENTS - Phase 3 Feature
// =============================================================================

const UpcomingEventsCard = () => {
  const { data: upcomingEvents, isLoading } = useQuery({
    queryKey: ['/api/events/upcoming'],
    refetchInterval: 60000, // 1 minute
  });

  return (
    <Card className="bg-gradient-to-r from-amber-900/20 via-yellow-900/20 to-amber-900/20 border-amber-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-amber-300 flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          Upcoming High-Impact Events
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs">
            Next 7 Days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : upcomingEvents?.events ? (
          <div className="space-y-3">
            {upcomingEvents.events.slice(0, 4).map((event: any) => (
              <div key={event.id} className="p-3 bg-black/20 rounded-lg border border-amber-500/20 hover:border-amber-400/40 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm line-clamp-1">{event.title}</h4>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{event.description}</p>
                  </div>
                  <Badge className={`text-xs ml-2 ${
                    event.impact === 'critical' ? 'bg-red-500/20 text-red-300' :
                    event.impact === 'high' ? 'bg-orange-500/20 text-orange-300' :
                    event.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {event.impact === 'critical' ? '🚨' :
                     event.impact === 'high' ? '⚡' :
                     event.impact === 'medium' ? '📊' : '📈'}
                    {event.impact}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                      {event.category?.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-gray-400 text-xs">
                      {event.timeToEvent && event.timeToEvent < 86400000 ? 
                        `${Math.round(event.timeToEvent / 3600000)}h` : 
                        new Date(event.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 text-xs">Impact:</span>
                    <span className="text-white text-xs font-medium">{event.marketRelevance || 85}%</span>
                  </div>
                </div>
                {event.affectedAssets && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.affectedAssets.slice(0, 4).map((asset: string) => (
                      <span key={asset} className="text-xs bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded">
                        {asset}
                      </span>
                    ))}
                    {event.affectedAssets.length > 4 && (
                      <span className="text-xs text-gray-400">+{event.affectedAssets.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EventPredictionsCard = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const { data: upcomingEvents } = useQuery({
    queryKey: ['/api/events/upcoming'],
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['/api/events/predictions', selectedEvent],
    enabled: !!selectedEvent,
    refetchInterval: 300000, // 5 minutes
  });

  const handleEventSelect = async (eventId: string) => {
    setSelectedEvent(eventId);
    try {
      const response = await apiRequest(`/api/events/${eventId}/predictions`, { method: 'POST' });
      // Predictions will be fetched by the query
    } catch (error) {
      console.error('Failed to generate predictions:', error);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-purple-900/20 border-purple-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-purple-300 flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Impact Predictions
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
            ML Models
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedEvent ? (
          <div className="space-y-2">
            <p className="text-gray-400 text-xs mb-3">Select an event to see AI predictions:</p>
            {upcomingEvents?.events?.slice(0, 3).map((event: any) => (
              <button
                key={event.id}
                onClick={() => handleEventSelect(event.id)}
                className="w-full p-2 text-left bg-black/20 rounded border border-purple-500/20 hover:border-purple-400/40 transition-all"
              >
                <div className="text-white text-sm font-medium">{event.title}</div>
                <div className="text-gray-400 text-xs">{event.category?.replace('_', ' ')}</div>
              </button>
            ))}
          </div>
        ) : predictionsLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
          </div>
        ) : predictions?.predictions ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-purple-400 text-xs hover:text-purple-300"
              >
                ← Back to Events
              </button>
              <Badge className="bg-green-500/20 text-green-300 text-xs">
                Avg Confidence: {predictions.averageConfidence?.toFixed(1)}%
              </Badge>
            </div>
            
            {predictions.predictions.slice(0, 2).map((prediction: any) => (
              <div key={prediction.id} className="p-3 bg-black/20 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${
                      prediction.predictedDirection === 'bullish' ? 'bg-green-500/20 text-green-300' :
                      prediction.predictedDirection === 'bearish' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {prediction.predictedDirection === 'bullish' ? '📈' :
                       prediction.predictedDirection === 'bearish' ? '📉' : '➡️'}
                      {prediction.predictedDirection}
                    </Badge>
                    <span className="text-purple-300 text-xs">{prediction.algorithm}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium text-sm">
                      {prediction.magnitude.expectedMove.toFixed(1)}%
                    </div>
                    <div className="text-gray-400 text-xs">
                      Confidence: {prediction.confidence}%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Impact Timing</span>
                    <div className="flex gap-2">
                      <span className="text-green-400">1h: {prediction.impactTiming.immediate}%</span>
                      <span className="text-blue-400">24h: {prediction.impactTiming.shortTerm}%</span>
                    </div>
                  </div>
                  
                  {prediction.assetPredictions?.slice(0, 3).map((asset: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{asset.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className={`${asset.predictedMove > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.predictedMove > 0 ? '+' : ''}{asset.predictedMove.toFixed(1)}%
                        </span>
                        <span className="text-gray-400">{asset.confidence.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No predictions available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EventTradingSignalsCard = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const { data: upcomingEvents } = useQuery({
    queryKey: ['/api/events/upcoming'],
  });

  const { data: signals, isLoading: signalsLoading } = useQuery({
    queryKey: ['/api/events/signals', selectedEvent],
    enabled: !!selectedEvent,
    refetchInterval: 300000, // 5 minutes
  });

  const handleGenerateSignals = async (eventId: string) => {
    setSelectedEvent(eventId);
    try {
      await apiRequest(`/api/events/${eventId}/signals`, {
        method: 'POST',
        body: JSON.stringify({ minConfidence: 65, maxSignals: 5 })
      });
    } catch (error) {
      console.error('Failed to generate signals:', error);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-green-900/20 border-green-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-300 flex items-center gap-2 text-sm">
          <Target className="h-4 w-4" />
          Event Trading Signals
          <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
            High Confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedEvent ? (
          <div className="space-y-2">
            <p className="text-gray-400 text-xs mb-3">Select an event to generate trading signals:</p>
            {upcomingEvents?.events?.slice(0, 3).map((event: any) => (
              <button
                key={event.id}
                onClick={() => handleGenerateSignals(event.id)}
                className="w-full p-2 text-left bg-black/20 rounded border border-green-500/20 hover:border-green-400/40 transition-all"
                data-testid={`button-generate-signals-${event.id}`}
              >
                <div className="text-white text-sm font-medium">{event.title}</div>
                <div className="text-gray-400 text-xs">Generate signals for {event.affectedAssets?.length || 0} assets</div>
              </button>
            ))}
          </div>
        ) : signalsLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        ) : signals?.signals ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-green-400 text-xs hover:text-green-300"
              >
                ← Back to Events
              </button>
              <Badge className="bg-green-500/20 text-green-300 text-xs">
                {signals.count} Signals Generated
              </Badge>
            </div>
            
            {signals.signals.slice(0, 3).map((signal: any) => (
              <div key={signal.id} className="p-3 bg-black/20 rounded-lg border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${
                      signal.action === 'buy' ? 'bg-green-500/20 text-green-300' :
                      signal.action === 'sell' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {signal.action === 'buy' ? '🟢' : '🔴'} {(signal.action || 'unknown').toUpperCase()}
                    </Badge>
                    <span className="text-white font-medium text-sm">{signal.symbol}</span>
                    <Badge className={`text-xs ${
                      signal.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      signal.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {signal.priority}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-medium text-sm">
                      {signal.strength}% Strength
                    </div>
                    <div className="text-gray-400 text-xs">
                      {signal.confidence}% Confidence
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Entry:</span>
                    <span className="text-white ml-1">${signal.entryPrice?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Target:</span>
                    <span className="text-green-400 ml-1">${signal.targetPrice?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stop:</span>
                    <span className="text-red-400 ml-1">${signal.stopLoss?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">R/R:</span>
                    <span className="text-white ml-1">{signal.riskRewardRatio?.toFixed(1)}:1</span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="text-gray-400 text-xs mb-1">Reasoning:</div>
                  <div className="text-gray-300 text-xs">
                    {signal.reasoning?.[0] || 'ML model indicates significant impact expected'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No signals generated</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const HistoricalAnalysisCard = () => {
  const [selectedEventType, setSelectedEventType] = useState<string>('fomc_meeting');
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['/api/events/historical', selectedEventType],
    refetchInterval: 1800000, // 30 minutes
  });

  const eventTypes = [
    { value: 'fomc_meeting', label: 'FOMC Meetings', icon: '🏛️' },
    { value: 'earnings_release', label: 'Earnings', icon: '📊' },
    { value: 'crypto_upgrade', label: 'Crypto Events', icon: '⚡' },
    { value: 'regulatory_announcement', label: 'Regulation', icon: '📜' }
  ];

  return (
    <Card className="bg-gradient-to-r from-blue-900/20 via-cyan-900/20 to-blue-900/20 border-blue-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-300 flex items-center gap-2 text-sm">
          <LineChart className="h-4 w-4" />
          Historical Impact Analysis
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
            2Y Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-1 mb-3">
          {eventTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedEventType(type.value)}
              className={`p-2 text-xs rounded border transition-all ${
                selectedEventType === type.value
                  ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                  : 'bg-black/20 border-blue-500/20 text-gray-400 hover:text-blue-400'
              }`}
              data-testid={`button-event-type-${type.value}`}
            >
              <div>{type.icon} {type.label}</div>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
          </div>
        ) : historicalData?.analysis ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-gray-400">Average Impact</div>
                <div className="text-blue-400 font-bold text-lg">
                  {historicalData.analysis.averageImpact.oneDay.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">24h timeframe</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-gray-400">Events Analyzed</div>
                <div className="text-white font-bold text-lg">
                  {historicalData.analysis.analysisWindow.eventCount}
                </div>
                <div className="text-xs text-gray-500">Last 2 years</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-1">Outcome Distribution:</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-green-400">Bullish:</span>
                  <span className="text-white">{historicalData.analysis.outcomesDistribution.bullish}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">Bearish:</span>
                  <span className="text-white">{historicalData.analysis.outcomesDistribution.bearish}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Neutral:</span>
                  <span className="text-white">{historicalData.analysis.outcomesDistribution.neutral}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-1">Volatility Analysis:</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Avg Vol Spike:</span>
                <span className="text-orange-400">{historicalData.analysis.volatilityAnalysis.averageVolSpike}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Max Vol Spike:</span>
                <span className="text-red-400">{historicalData.analysis.volatilityAnalysis.maxVolSpike}%</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <div className="text-xs text-gray-400 mb-1">Market Regime Impact:</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-400">Bull Market:</span>
                  <span className="text-white">{historicalData.analysis.regimeAnalysis.bullMarket.averageImpact.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-400">Bear Market:</span>
                  <span className="text-white">{historicalData.analysis.regimeAnalysis.bearMarket.averageImpact.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <LineChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No historical data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ModelPerformanceCard = () => {
  const { data: modelStatus, isLoading } = useQuery({
    queryKey: ['/api/events/models/status'],
    refetchInterval: 300000, // 5 minutes
  });

  return (
    <Card className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-indigo-900/20 border-indigo-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-indigo-300 flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          ML Model Performance
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs">
            Live Status
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
          </div>
        ) : modelStatus?.modelStatus ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-gray-400">Active Models</div>
                <div className="text-indigo-400 font-bold text-lg">
                  {modelStatus.modelStatus.activeModels}/{modelStatus.modelStatus.totalModels}
                </div>
                <div className="text-xs text-gray-500">Operational</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-xs text-gray-400">Avg Accuracy</div>
                <div className="text-green-400 font-bold text-lg">
                  {modelStatus.modelStatus.averageAccuracy.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Cross-validation</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-1">Recent Performance:</div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Predictions Made:</span>
                <span className="text-white">{modelStatus.modelStatus.recentPredictions}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">Prediction Accuracy:</span>
                <span className="text-green-400">{modelStatus.modelStatus.predictionAccuracy.toFixed(1)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-1">Top Performing Models:</div>
              {modelStatus.modelStatus.modelsHealth?.slice(0, 3).map((model: any) => (
                <div key={model.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      model.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-gray-300">{model.name.split(' ')[0]}</span>
                  </div>
                  <span className="text-white">{model.accuracy.toFixed(1)}%</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-500/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Last Retrained:</span>
                <span className="text-white">
                  {new Date(modelStatus.modelStatus.lastRetrained).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Model status unavailable</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EventRiskMonitoringCard = () => {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/events/alerts'],
    refetchInterval: 30000, // 30 seconds
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['/api/events/upcoming'],
  });

  // Calculate risk score based on upcoming events
  const calculateRiskScore = () => {
    if (!upcomingEvents?.events) return 25;
    
    const highImpactEvents = upcomingEvents.events.filter((e: any) => 
      e.impact === 'high' || e.impact === 'critical'
    );
    
    const nearTermEvents = upcomingEvents.events.filter((e: any) => 
      e.timeToEvent && e.timeToEvent < 86400000 // Less than 24 hours
    );
    
    return Math.min(100, (highImpactEvents.length * 15) + (nearTermEvents.length * 10) + 25);
  };

  const riskScore = calculateRiskScore();
  const riskLevel = riskScore > 75 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low';

  return (
    <Card className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 border-red-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-red-300 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Event Risk Monitoring
          <Badge className={`text-xs ${
            riskLevel === 'critical' ? 'bg-red-500/20 text-red-300' :
            riskLevel === 'high' ? 'bg-orange-500/20 text-orange-300' :
            riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {riskLevel === 'critical' ? '🚨' :
             riskLevel === 'high' ? '⚡' :
             riskLevel === 'medium' ? '⚠️' : '✅'}
            {riskLevel.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">Current Risk Score</span>
              <Badge className={`text-xs ${
                riskScore > 75 ? 'bg-red-500/20 text-red-300' :
                riskScore > 50 ? 'bg-orange-500/20 text-orange-300' :
                riskScore > 30 ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                {riskLevel.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-bold ${
                riskScore > 75 ? 'text-red-400' :
                riskScore > 50 ? 'text-orange-400' :
                riskScore > 30 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {riskScore}
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      riskScore > 75 ? 'bg-red-500' :
                      riskScore > 50 ? 'bg-orange-500' :
                      riskScore > 30 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${riskScore}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Based on {upcomingEvents?.events?.length || 0} upcoming events
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-1">Near-term Risks:</div>
            {upcomingEvents?.events?.filter((e: any) => e.timeToEvent && e.timeToEvent < 86400000)
              .slice(0, 3).map((event: any) => (
              <div key={event.id} className="flex items-center justify-between p-2 bg-black/20 rounded text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    event.impact === 'critical' ? 'bg-red-400' :
                    event.impact === 'high' ? 'bg-orange-400' :
                    'bg-yellow-400'
                  }`}></div>
                  <span className="text-gray-300">{event.title.split(' ').slice(0, 3).join(' ')}</span>
                </div>
                <span className="text-white">
                  {Math.round(event.timeToEvent / 3600000)}h
                </span>
              </div>
            ))}
            
            {!upcomingEvents?.events?.some((e: any) => e.timeToEvent && e.timeToEvent < 86400000) && (
              <div className="text-center py-4 text-gray-400">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No immediate risks detected</p>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-1">
              <div className="h-3 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          ) : alerts?.alerts?.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-1">Active Alerts:</div>
              {alerts.alerts.slice(0, 2).map((alert: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-black/20 rounded text-xs">
                  <AlertCircle className="h-3 w-3 text-orange-400" />
                  <span className="text-gray-300 flex-1">Event monitoring alert</span>
                  <span className="text-orange-400">Active</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-gray-400">No active alerts</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Cross-Market Signal Generation Section Component - Phase 3 Final Feature
const CrossMarketSignalSection = () => {
  const [activeSignalTab, setActiveSignalTab] = useState<string>('dashboard');
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [signalFilter, setSignalFilter] = useState<string>('all');

  // Cross-market signal queries
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/cross-market-signals/dashboard'],
    staleTime: 30 * 1000, // 30 seconds
    retry: 2
  });

  const { data: unifiedSignals, isLoading: signalsLoading } = useQuery({
    queryKey: ['/api/cross-market-signals/unified-signals'],
    staleTime: 60 * 1000, // 1 minute
    retry: 2
  });

  const { data: crossMarketAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/cross-market-signals/alerts'],
    staleTime: 30 * 1000, // 30 seconds
    retry: 2
  });

  const { data: correlationData, isLoading: correlationsLoading } = useQuery({
    queryKey: ['/api/cross-market-signals/correlations'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  const { data: tradingRecommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/cross-market-signals/recommendations'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  const { data: discoverAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/cross-market-signals/discover-analysis'],
    staleTime: 60 * 1000, // 1 minute
    retry: 2
  });

  // Helper functions
  const getSignalStrengthColor = (strength: number) => {
    if (strength >= 90) return 'text-violet-400 bg-violet-500/20 border-violet-400/30';
    if (strength >= 75) return 'text-cyan-400 bg-cyan-500/20 border-cyan-400/30';
    if (strength >= 60) return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
    if (strength >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish': return TrendingUp;
      case 'bearish': return TrendingDown;
      default: return Activity;
    }
  };

  const getSignalTypeIcon = (signalType: string) => {
    switch (signalType) {
      case 'unified_trade_signal': return Target;
      case 'cross_market_alert': return Bell;
      case 'regime_shift_signal': return RefreshCw;
      case 'correlation_break_signal': return AlertTriangle;
      case 'composite_risk_signal': return Shield;
      default: return Crosshair;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'strong_buy': return 'text-green-500 bg-green-500/20';
      case 'buy': return 'text-green-400 bg-green-400/20';
      case 'hold': return 'text-yellow-400 bg-yellow-400/20';
      case 'sell': return 'text-red-400 bg-red-400/20';
      case 'strong_sell': return 'text-red-500 bg-red-500/20';
      case 'hedge': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Dashboard */}
      <Card className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 border-violet-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-violet-300 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Unified Signal Dashboard
            {discoverAnalysis?.overview && (
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30 text-xs ml-2">
                {discoverAnalysis.overview.totalActiveSignals} Active Signals
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : discoverAnalysis?.overview ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Active Signals</p>
                <p className="text-violet-400 font-bold text-2xl">{discoverAnalysis.overview.totalActiveSignals}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Avg Confidence</p>
                <p className="text-cyan-400 font-bold text-2xl">{discoverAnalysis.overview.avgConfidenceScore}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">High Priority</p>
                <p className="text-orange-400 font-bold text-2xl">{discoverAnalysis.overview.highPriorityAlerts}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Success Rate</p>
                <p className="text-green-400 font-bold text-2xl">{discoverAnalysis.overview.successRateToday}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Market Regime</p>
                <p className="text-blue-400 font-bold text-sm">{discoverAnalysis.overview.marketRegime?.toUpperCase()}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Stress Level</p>
                <p className={`${getSignalStrengthColor(discoverAnalysis.overview.stressLevel).split(' ')[0]} font-bold text-2xl`}>
                  {discoverAnalysis.overview.stressLevel}%
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Crosshair className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">Signal dashboard loading...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signal Tabs */}
      <Tabs value={activeSignalTab} onValueChange={setActiveSignalTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-black/20 border border-violet-500/30">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="signals" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            Signals
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            Alerts
          </TabsTrigger>
          <TabsTrigger value="correlations" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            Correlations
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            Trading
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Top Signals */}
            <Card className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 border-violet-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-violet-300 flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Top Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : discoverAnalysis?.topSignals?.length ? (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {discoverAnalysis.topSignals.slice(0, 5).map((signal: any, index: number) => {
                      const DirectionIcon = getDirectionIcon(signal.direction);
                      const SignalIcon = getSignalTypeIcon(signal.signalType);
                      return (
                        <div key={signal.id} className="p-3 bg-black/20 rounded-lg border border-violet-400/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <SignalIcon className="h-4 w-4 text-violet-400" />
                              <span className="text-white font-semibold text-sm">{signal.symbol}</span>
                              <Badge className={`${getPriorityColor(signal.priority)} text-xs`}>
                                {signal.priority?.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <DirectionIcon className={`h-4 w-4 ${signal.direction === 'bullish' ? 'text-green-400' : signal.direction === 'bearish' ? 'text-red-400' : 'text-gray-400'}`} />
                              <span className={`text-sm font-bold ${getSignalStrengthColor(signal.overallScore).split(' ')[0]}`}>
                                {signal.overallScore}%
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-300 text-xs mb-2">{signal.summary}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`${getActionColor(signal.primaryAction)} px-2 py-1 rounded text-xs font-medium`}>
                              {signal.primaryAction?.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-gray-400">{signal.timeframe}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No signals available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Critical Alerts */}
            <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : discoverAnalysis?.criticalAlerts?.length ? (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {discoverAnalysis.criticalAlerts.map((alert: any, index: number) => (
                      <div key={alert.id} className="p-3 bg-black/20 rounded-lg border border-red-400/20">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`${getPriorityColor(alert.severity)} text-xs`}>
                            {alert.severity?.toUpperCase()}
                          </Badge>
                          <span className="text-gray-400 text-xs">
                            {new Date(alert.triggeredAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className="text-white font-medium text-sm mb-1">{alert.title}</h4>
                        <p className="text-gray-300 text-xs mb-2">{alert.message}</p>
                        {alert.affectedAssets?.length && (
                          <div className="flex flex-wrap gap-1">
                            {alert.affectedAssets.slice(0, 3).map((asset: string) => (
                              <Badge key={asset} className="bg-gray-500/20 text-gray-300 text-xs">
                                {asset}
                              </Badge>
                            ))}
                            {alert.affectedAssets.length > 3 && (
                              <Badge className="bg-gray-500/20 text-gray-300 text-xs">
                                +{alert.affectedAssets.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No critical alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-3 bg-gray-700 rounded mb-1"></div>
                        <div className="h-6 bg-gray-600 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : discoverAnalysis?.performance ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Today's Performance</p>
                      <p className={`text-lg font-bold ${discoverAnalysis.performance.todayPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {discoverAnalysis.performance.todayPerformance >= 0 ? '+' : ''}{discoverAnalysis.performance.todayPerformance}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Week Performance</p>
                      <p className={`text-lg font-bold ${discoverAnalysis.performance.weekPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {discoverAnalysis.performance.weekPerformance >= 0 ? '+' : ''}{discoverAnalysis.performance.weekPerformance}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Month Performance</p>
                      <p className={`text-lg font-bold ${discoverAnalysis.performance.monthPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {discoverAnalysis.performance.monthPerformance >= 0 ? '+' : ''}{discoverAnalysis.performance.monthPerformance}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Best Signal</p>
                      <p className="text-cyan-400 font-medium text-sm">
                        {discoverAnalysis.performance.bestPerformingSignal?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Performance data loading...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Unified Signals Tab */}
        <TabsContent value="signals" className="mt-6">
          <div className="space-y-6">
            {/* Filter Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Filter:</span>
                <select 
                  value={signalFilter} 
                  onChange={(e) => setSignalFilter(e.target.value)}
                  className="bg-black/20 border border-violet-500/30 text-violet-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Signals</option>
                  <option value="critical">Critical Priority</option>
                  <option value="high">High Priority</option>
                  <option value="bullish">Bullish Only</option>
                  <option value="bearish">Bearish Only</option>
                </select>
              </div>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30 text-xs">
                {unifiedSignals?.signals?.length || 0} Total Signals
              </Badge>
            </div>

            {/* Signals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {signalsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 border-violet-500/30 backdrop-blur-sm animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-700 rounded mb-4"></div>
                      <div className="h-20 bg-gray-600 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : unifiedSignals?.signals?.length ? (
                unifiedSignals.signals
                  .filter((signal: any) => {
                    if (signalFilter === 'all') return true;
                    if (signalFilter === 'critical') return signal.priority === 'critical';
                    if (signalFilter === 'high') return signal.priority === 'high';
                    if (signalFilter === 'bullish') return signal.affectedAssets?.[0]?.direction === 'bullish';
                    if (signalFilter === 'bearish') return signal.affectedAssets?.[0]?.direction === 'bearish';
                    return true;
                  })
                  .map((signal: any, index: number) => {
                    const DirectionIcon = getDirectionIcon(signal.affectedAssets?.[0]?.direction);
                    const SignalIcon = getSignalTypeIcon(signal.signalType);
                    return (
                      <Card key={signal.id} className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 border-violet-500/30 backdrop-blur-sm hover:border-violet-400/50 transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="text-violet-300 flex items-center gap-2 text-lg">
                            <SignalIcon className="h-5 w-5" />
                            {signal.title}
                            <Badge className={`${getPriorityColor(signal.priority)} text-xs ml-auto`}>
                              {signal.priority?.toUpperCase()}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">
                                {signal.affectedAssets?.[0]?.symbol}
                              </span>
                              <DirectionIcon className={`h-4 w-4 ${signal.affectedAssets?.[0]?.direction === 'bullish' ? 'text-green-400' : signal.affectedAssets?.[0]?.direction === 'bearish' ? 'text-red-400' : 'text-gray-400'}`} />
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${getSignalStrengthColor(signal.compositeScore?.overall || 0).split(' ')[0]}`}>
                                {signal.compositeScore?.overall || 0}% Signal
                              </p>
                              <p className="text-xs text-gray-400">
                                {signal.compositeScore?.confidence || 0}% Confidence
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-gray-300 text-sm">{signal.summary}</p>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-gray-400 mb-1">Expected Move</p>
                                <p className="text-cyan-400 font-semibold">
                                  {signal.affectedAssets?.[0]?.expectedMove || 0}%
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">Timeframe</p>
                                <p className="text-blue-400 font-semibold">
                                  {signal.affectedAssets?.[0]?.timeframe || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">Risk Level</p>
                                <p className={`${getRiskLevelColor(signal.affectedAssets?.[0]?.riskLevel)} font-semibold`}>
                                  {signal.affectedAssets?.[0]?.riskLevel?.toUpperCase() || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">Action</p>
                                <Badge className={`${getActionColor(signal.tradingRecommendations?.primaryAction)} text-xs`}>
                                  {signal.tradingRecommendations?.primaryAction?.replace('_', ' ').toUpperCase() || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Component Scores */}
                          <div className="space-y-2">
                            <p className="text-gray-400 text-xs font-medium">AI Component Scores</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Event:</span>
                                <span className="text-cyan-400">{signal.compositeScore?.components?.eventModelingScore || 0}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Pattern:</span>
                                <span className="text-green-400">{signal.compositeScore?.components?.patternRecognitionScore || 0}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Volatility:</span>
                                <span className="text-orange-400">{signal.compositeScore?.components?.volatilityForecastScore || 0}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Correlation:</span>
                                <span className="text-purple-400">{signal.compositeScore?.components?.correlationAnalysisScore || 0}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
                            <span className="text-gray-400 text-xs">
                              Valid until: {new Date(signal.validUntil).toLocaleDateString()}
                            </span>
                            <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 text-xs">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              ) : (
                <div className="col-span-full">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-8 text-center">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No unified signals available</p>
                      <p className="text-gray-400 text-sm mt-2">Signal generation will resume shortly</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {alertsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-16 bg-gray-600 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : crossMarketAlerts?.alerts?.length ? (
              crossMarketAlerts.alerts.map((alert: any, index: number) => (
                <Card key={alert.id} className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30 backdrop-blur-sm hover:border-red-400/50 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-red-300 flex items-center gap-2 text-lg">
                      <Bell className="h-5 w-5" />
                      {alert.title}
                      <Badge className={`${getPriorityColor(alert.severity)} text-xs ml-auto`}>
                        {alert.severity?.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">{alert.message}</p>
                    
                    {alert.affectedAssets?.length && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Affected Assets:</p>
                        <div className="flex flex-wrap gap-1">
                          {alert.affectedAssets.map((asset: string) => (
                            <Badge key={asset} className="bg-red-500/20 text-red-300 text-xs">
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.urgentActions?.length && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Recommended Actions:</p>
                        <ul className="space-y-1">
                          {alert.urgentActions.slice(0, 3).map((action: any, idx: number) => (
                            <li key={idx} className="text-gray-300 text-xs flex items-start gap-2">
                              <span className="text-orange-400 mt-1">•</span>
                              <span>{action.action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
                      <span className="text-gray-400 text-xs">
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs">
                          Acknowledge
                        </Button>
                        <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 text-xs">
                          Act Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-300">No active alerts</p>
                    <p className="text-gray-400 text-sm mt-2">All systems operating normally</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations" className="mt-6">
          <div className="space-y-6">
            {/* Correlation Summary */}
            {discoverAnalysis?.correlationSummary && (
              <Card className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-blue-300 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Market Correlation Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">Current Regime</p>
                      <Badge className={`${getSignalStrengthColor(discoverAnalysis.correlationSummary.confidence)} text-sm`}>
                        {discoverAnalysis.correlationSummary.regime?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">Confidence</p>
                      <p className="text-cyan-400 font-bold text-xl">{discoverAnalysis.correlationSummary.confidence}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">Duration</p>
                      <p className="text-blue-400 font-bold text-xl">{discoverAnalysis.correlationSummary.duration}d</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">Notable Changes</p>
                      <p className="text-orange-400 font-bold text-xl">{discoverAnalysis.correlationSummary.significantChanges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Correlations */}
            <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Key Market Relationships
                </CardTitle>
              </CardHeader>
              <CardContent>
                {correlationsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : discoverAnalysis?.correlationSummary?.topCorrelations?.length ? (
                  <div className="space-y-4">
                    {discoverAnalysis.correlationSummary.topCorrelations.map((corr: any, index: number) => (
                      <div key={index} className="p-4 bg-black/20 rounded-lg border border-cyan-400/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold text-sm">{corr.assetPair}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${corr.correlation > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(corr.correlation * 100).toFixed(1)}%
                            </span>
                            <Badge className={`${getSignalStrengthColor(100 - corr.breakdownRisk)} text-xs`}>
                              {corr.strength?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Breakdown Risk: {corr.breakdownRisk}%</span>
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${corr.correlation > 0 ? 'bg-green-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BarChart2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Correlation data loading...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trading Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {recommendationsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30 backdrop-blur-sm animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-700 rounded mb-4"></div>
                      <div className="h-20 bg-gray-600 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : tradingRecommendations?.recommendations?.length ? (
                tradingRecommendations.recommendations.slice(0, 9).map((rec: any, index: number) => {
                  const DirectionIcon = getDirectionIcon(rec.direction);
                  return (
                    <Card key={`${rec.symbol}-${index}`} className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-green-300 flex items-center gap-2 text-lg">
                          <Target className="h-5 w-5" />
                          {rec.symbol}
                          <Badge className={`${getActionColor(rec.primaryAction)} text-xs ml-auto`}>
                            {rec.primaryAction?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DirectionIcon className={`h-4 w-4 ${rec.direction === 'bullish' ? 'text-green-400' : rec.direction === 'bearish' ? 'text-red-400' : 'text-gray-400'}`} />
                            <span className="text-gray-400 text-sm">{rec.direction?.toUpperCase()}</span>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${getSignalStrengthColor(rec.signalStrength).split(' ')[0]}`}>
                              {rec.signalStrength}% Signal
                            </p>
                            <p className="text-xs text-gray-400">{rec.confidence}% Confidence</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400 mb-1">Expected Move</p>
                            <p className="text-cyan-400 font-semibold">{rec.expectedMove}%</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Timeframe</p>
                            <p className="text-blue-400 font-semibold">{rec.timeframe}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Risk Level</p>
                            <p className={`${getRiskLevelColor(rec.riskLevel)} font-semibold`}>
                              {rec.riskLevel?.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Position Size</p>
                            <p className="text-purple-400 font-semibold">{rec.positionSizing}%</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Entry:</span>
                            <span className="text-green-400 font-semibold">${rec.entryPrice?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Stop Loss:</span>
                            <span className="text-red-400 font-semibold">${rec.stopLoss?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Take Profit:</span>
                            <span className="text-cyan-400 font-semibold">
                              ${rec.takeProfit?.[0]?.toFixed(2)} - ${rec.takeProfit?.[1]?.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-xs leading-relaxed">
                          {rec.rationale}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
                          <span className="text-gray-400 text-xs">
                            Updated: {new Date(rec.lastUpdated).toLocaleDateString()}
                          </span>
                          <Button size="sm" variant="outline" className="border-green-500/30 text-green-300 hover:bg-green-500/10 text-xs">
                            Execute Trade
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-8 text-center">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No trading recommendations available</p>
                      <p className="text-gray-400 text-sm mt-2">Recommendations will be generated based on signal analysis</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function Discover() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const timeFilter = '24h'; // Fixed to 24h only
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [storyFilter, setStoryFilter] = useState<'all' | 'farcaster' | 'youtube' | 'news'>('all');
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [selectedDerivativesAsset, setSelectedDerivativesAsset] = useState<string>('BTC');
  const pageStartTime = useRef<number>(Date.now());

  // Predictive analytics queries
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/analytics/recommendations'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const { data: marketAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/analytics/market-alerts'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: sectorPredictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['/api/analytics/sector-trends', selectedSector || 'DeFi'],
    enabled: !!selectedSector,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  // Federal Reserve monitoring queries
  const { data: fedCommunications, isLoading: fedCommLoading } = useQuery({
    queryKey: ['/api/fed/communications'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const { data: fedAnalytics, isLoading: fedAnalyticsLoading } = useQuery({
    queryKey: ['/api/fed/analytics'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  const { data: fedPolicyAlerts, isLoading: fedAlertsLoading } = useQuery({
    queryKey: ['/api/fed/policy-alerts'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: fedCalendar, isLoading: fedCalendarLoading } = useQuery({
    queryKey: ['/api/fed/calendar'],
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1
  });

  // Derivatives analytics queries
  const { data: derivativesOverview, isLoading: derivativesOverviewLoading } = useQuery({
    queryKey: ['/api/derivatives/overview'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: derivativesAnalytics, isLoading: derivativesAnalyticsLoading } = useQuery({
    queryKey: ['/api/derivatives/analytics', selectedDerivativesAsset],
    staleTime: 30 * 1000, // 30 seconds for real-time data
    retry: 1
  });

  const { data: optionsFlow, isLoading: optionsFlowLoading } = useQuery({
    queryKey: ['/api/derivatives/options-flow', selectedDerivativesAsset],
    staleTime: 60 * 1000, // 1 minute
    retry: 1
  });

  const { data: liquidationsData, isLoading: liquidationsLoading } = useQuery({
    queryKey: ['/api/derivatives/liquidations', selectedDerivativesAsset],
    staleTime: 10 * 1000, // 10 seconds for liquidation data
    retry: 1
  });

  // Risk assessment queries
  const { data: riskDashboard, isLoading: riskDashboardLoading } = useQuery({
    queryKey: ['/api/risk/dashboard'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  const { data: riskAlerts, isLoading: riskAlertsLoading } = useQuery({
    queryKey: ['/api/risk/alerts'],
    staleTime: 30 * 1000, // 30 seconds for alerts
    retry: 1
  });

  const { data: stressTests, isLoading: stressTestsLoading } = useQuery({
    queryKey: ['/api/risk/stress-tests'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const { data: positionSizing, isLoading: positionSizingLoading } = useQuery({
    queryKey: ['/api/risk/position-sizing'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  // Interaction tracking mutation
  const trackInteraction = useMutation({
    mutationFn: async (interactionData: {
      interactionType: string;
      targetType?: string;
      targetId?: string;
      metadata?: any;
    }) => {
      if (!user) return; // Only track for logged-in users
      
      console.log('📡 Sending interaction tracking request:', interactionData);
      
      const response = await apiRequest('/api/interactions/track', {
        method: 'POST',
        body: JSON.stringify(interactionData)
      });
      
      console.log('✅ Interaction tracking response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Interaction tracked successfully:', data);
    },
    onError: (error) => {
      console.error('❌ Failed to track interaction:', error);
    }
  });

  // Helper function to track interactions
  const trackUserInteraction = (
    interactionType: string,
    targetType?: string,
    targetId?: string,
    metadata?: any
  ) => {
    console.log(`🔍 Tracking interaction: ${interactionType} ${targetType}:${targetId}`, { user: !!user, metadata });
    
    // Try to track interaction, but don't block functionality if it fails
    if (user) {
      try {
        trackInteraction.mutate({
          interactionType,
          targetType,
          targetId,
          metadata
        });
      } catch (error) {
        console.warn('⚠️ Failed to track interaction, continuing anyway:', error);
      }
    } else {
      console.log('ℹ️ User not authenticated - interaction logged locally only');
    }
  };

  // Track page view on mount
  useEffect(() => {
    trackUserInteraction('view', 'page', 'discover', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    // Track time spent on page when leaving
    return () => {
      const timeSpent = Date.now() - pageStartTime.current;
      if (timeSpent > 5000) { // Only track if spent more than 5 seconds
        trackUserInteraction('time_spent', 'page', 'discover', {
          duration: timeSpent,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [user]);

  // Track time filter changes
  // Removed time filter handler - now using fixed 24h period

  // Track sector clicks
  const handleSectorClick = (sectorName: string, sectorData: any) => {
    const newSelectedSector = selectedSector === sectorName ? null : sectorName;
    setSelectedSector(newSelectedSector);
    
    trackUserInteraction(
      newSelectedSector ? 'sector_click' : 'sector_unclick', 
      'sector', 
      sectorName,
      {
        sectorPerformance: sectorData.performance,
        sectorSentiment: sectorData.sentiment,
        sectorTrend: sectorData.trend,
        timestamp: new Date().toISOString()
      }
    );
  };

  // Track story clicks  
  const handleStoryClick = (story: any, action: 'view' | 'tag_click' = 'view') => {
    trackUserInteraction('story_click', 'story', story.id, {
      storyTitle: story.title,
      storySource: story.source,
      storySourceType: story.sourceType,
      storyEngagement: story.engagement,
      storySentiment: story.metadata.sentiment,
      storyTags: story.metadata.tags,
      action,
      selectedSector,
      timestamp: new Date().toISOString()
    });
  };

  // Market data queries
  const { data: marketData } = useQuery({
    queryKey: [`/api/market/overview?timeFilter=${timeFilter}`],
    refetchInterval: 30000, // 30 seconds
  });

  const { data: trendingData } = useQuery({
    queryKey: [`/api/discover/trending?timeFilter=${timeFilter}&storyFilter=${storyFilter}`],
    refetchInterval: 45000, // 45 seconds
  });

  const { data: sectorsData } = useQuery({
    queryKey: [`/api/market/sectors?timeFilter=${timeFilter}`],
    refetchInterval: 60000, // 1 minute
  });

  const { data: socialData } = useQuery({
    queryKey: [`/api/social/trending`],
    refetchInterval: 30000,
  });

  // Economic Calendar data queries
  const { data: economicCalendarData } = useQuery({
    queryKey: ['/api/market/economic-calendar?timeRange=30d&onlyUpcoming=true'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: highImpactEvents } = useQuery({
    queryKey: ['/api/market/high-impact-events'],
    refetchInterval: 120000, // 2 minutes
  });

  // On-chain Analytics queries
  const { data: whaleMovements, isLoading: whalesLoading } = useQuery({
    queryKey: ['/api/onchain/whale-movements?symbols=BTC,ETH,USDT,USDC&minAmount=1000000'],
    refetchInterval: 60000, // 1 minute for real-time whale data
  });

  const { data: exchangeFlows, isLoading: exchangeFlowsLoading } = useQuery({
    queryKey: ['/api/onchain/exchange-flows?exchanges=Binance,Coinbase,Kraken,OKX'],
    refetchInterval: 90000, // 1.5 minutes
  });

  const { data: networkMetrics, isLoading: networkLoading } = useQuery({
    queryKey: ['/api/onchain/network-metrics?networks=ethereum,bitcoin,binance_smart_chain'],
    refetchInterval: 120000, // 2 minutes
  });

  const { data: onChainAlerts, isLoading: onChainAlertsLoading } = useQuery({
    queryKey: ['/api/onchain/alerts?severity=all&limit=10'],
    refetchInterval: 30000, // 30 seconds for alerts
  });

  const { data: defiMetrics, isLoading: defiLoading } = useQuery({
    queryKey: ['/api/onchain/defi-metrics?protocols=Uniswap,Aave,Compound,MakerDAO'],
    refetchInterval: 180000, // 3 minutes
  });

  // Correlation Analysis queries
  const [correlationTimeframe, setCorrelationTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { data: correlationMatrix, isLoading: correlationLoading } = useQuery({
    queryKey: [`/api/correlation/matrix?timeframe=${correlationTimeframe}`],
    refetchInterval: 300000, // 5 minutes - correlations change slowly
    retry: 1
  });

  const { data: marketRegime, isLoading: regimeLoading } = useQuery({
    queryKey: ['/api/correlation/market-regime'],
    refetchInterval: 180000, // 3 minutes
    retry: 1
  });

  const { data: riskSentiment, isLoading: riskSentimentLoading } = useQuery({
    queryKey: [`/api/correlation/risk-sentiment?timeframe=${correlationTimeframe === '90d' ? '30d' : '7d'}`],
    refetchInterval: 120000, // 2 minutes
    retry: 1
  });

  const { data: correlationSummary, isLoading: correlationSummaryLoading } = useQuery({
    queryKey: [`/api/correlation/summary?timeframe=${correlationTimeframe}`],
    refetchInterval: 240000, // 4 minutes
    retry: 1
  });

  // Phase 1: Market Pulse Data
  // Enhanced market movers with priority levels and risk assessment
  const rawMarketMovers: MarketMover[] = (marketData as any)?.movers || [
    // Robust fallback data with priority levels
    { symbol: 'BTC', name: 'Bitcoin', price: 67420, change24h: 2.5, changePercent: 3.85, volume: 28000000000, category: 'crypto', momentum: 'bullish' },
    { symbol: 'ETH', name: 'Ethereum', price: 3780, change24h: -1.2, changePercent: -1.82, volume: 15000000000, category: 'crypto', momentum: 'bearish' },
    { symbol: 'MSTR', name: 'MicroStrategy', price: 245.80, change24h: 8.5, changePercent: 3.58, volume: 892000000, category: 'stock', momentum: 'bullish' },
    { symbol: 'SOL', name: 'Solana', price: 240.72, change24h: 3.2, changePercent: 1.42, volume: 4200000000, category: 'crypto', momentum: 'neutral' },
    { symbol: 'TSLA', name: 'Tesla', price: 426.07, change24h: 9.1, changePercent: 2.21, volume: 456000000, category: 'stock', momentum: 'bullish' },
    { symbol: 'HUT', name: 'Hut 8 Mining', price: 36.24, change24h: -1.8, changePercent: -3.05, volume: 89000000, category: 'stock', momentum: 'bearish' }
  ];

  const marketMovers = rawMarketMovers.map((mover: any, index: number) => ({
    ...mover,
    priority: Math.abs(mover.changePercent) > 5 ? 'critical' : Math.abs(mover.changePercent) > 2 ? 'high' : 'medium',
    urgencyScore: Math.abs(mover.changePercent) * 10,
    volatilityRisk: Math.abs(mover.changePercent) > 10 ? 'extreme' : Math.abs(mover.changePercent) > 5 ? 'high' : 'moderate',
    rank: index + 1
  }));

  // Enhanced trending stories with priority levels and AI ranking
  const rawTrendingStories: TrendingStory[] = (trendingData as any)?.stories || [
    // Fallback content when API returns empty due to rate limits
    {
      id: 'fallback-1',
      title: 'Bitcoin Hits New All-Time High as Institutional Adoption Accelerates',
      description: 'Major corporations continue to add Bitcoin to their treasury reserves, driving unprecedented price discovery.',
      source: 'CryptoNews',
      sourceType: 'news' as const,
      engagement: { likes: 1240, comments: 180, shares: 95, views: 15600, score: 8.7 },
      metadata: {
        publishedAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
        author: 'Financial Analysis Team',
        tags: ['Bitcoin', 'Institutional', 'DeFi'],
        sentiment: 'positive' as const,
        trendingScore: 95
      },
      url: '#',
      thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=300&fit=crop'
    },
    {
      id: 'fallback-2', 
      title: 'Layer 2 Solutions See Record Trading Volume This Week',
      description: 'Ethereum Layer 2 networks process over $2B in daily volume, showcasing scalability improvements.',
      source: 'DeFi Pulse',
      sourceType: 'news' as const,
      engagement: { likes: 890, comments: 120, shares: 65, views: 11200, score: 7.8 },
      metadata: {
        publishedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        author: 'Layer2 Research',
        tags: ['Layer2', 'Ethereum', 'Scaling'],
        sentiment: 'positive' as const,
        trendingScore: 88
      },
      url: '#'
    },
    {
      id: 'fallback-3',
      title: 'Gaming Tokens Rally as Metaverse Adoption Grows',
      description: 'Play-to-earn gaming platforms see surge in user activity and token values.',
      source: 'GameFi Weekly',
      sourceType: 'news' as const,
      engagement: { likes: 560, comments: 78, shares: 42, views: 8900, score: 6.9 },
      metadata: {
        publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        author: 'Gaming Analyst',
        tags: ['Gaming', 'Metaverse', 'NFT'],
        sentiment: 'positive' as const,
        trendingScore: 78
      },
      url: '#'
    }
  ];

  const trendingStories = rawTrendingStories.map((story: any, index: number) => ({
    ...story,
    priority: index < 3 ? 'critical' : index < 8 ? 'high' : index < 15 ? 'medium' : 'low',
    urgencyScore: Math.max(0, 100 - index * 5),
    relevanceScore: story.engagement?.score || 0,
    aiRank: index + 1,
    freshness: new Date().getTime() - new Date(story.metadata.publishedAt).getTime() < 3600000 ? 'fresh' : 'recent'
  }));
  const sectors: SectorData[] = (sectorsData as any)?.sectors || [
    // Robust fallback sector data with priority levels
    { 
      name: 'DeFi', 
      performance: +8.33, 
      assets: 245, 
      volume: 4830000000, 
      sentiment: 0.78, 
      trend: 'up' as const,
      priority: 'high',
      urgencyScore: 85
    },
    { 
      name: 'Layer 1', 
      performance: +5.21, 
      assets: 89, 
      volume: 5400000000, 
      sentiment: 0.71, 
      trend: 'up' as const,
      priority: 'high',
      urgencyScore: 82
    },
    { 
      name: 'Layer 2', 
      performance: +9.81, 
      assets: 156, 
      volume: 2680000000, 
      sentiment: 0.84, 
      trend: 'up' as const,
      priority: 'high',
      urgencyScore: 90
    },
    { 
      name: 'Gaming', 
      performance: -2.45, 
      assets: 67, 
      volume: 890000000, 
      sentiment: 0.45, 
      trend: 'down' as const,
      priority: 'medium',
      urgencyScore: 35
    },
    { 
      name: 'AI & Data', 
      performance: +12.67, 
      assets: 23, 
      volume: 1200000000, 
      sentiment: 0.92, 
      trend: 'up' as const,
      priority: 'critical',
      urgencyScore: 95
    },
    { 
      name: 'Memecoins', 
      performance: -8.55, 
      assets: 45, 
      volume: 670000000, 
      sentiment: 0.28, 
      trend: 'down' as const,
      priority: 'low',
      urgencyScore: 15
    }
  ];

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `$${(volume / 1000000000).toFixed(1)}B`;
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    return `$${volume.toFixed(0)}`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Navigation Header */}
      <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Discover
              </h1>
              
              {/* Fixed to 24h display - no time filter buttons */}
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                24h View
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
                className={`border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all ${
                  showInsights ? 'bg-purple-500/20 border-purple-400' : ''
                }`}
                data-testid="button-toggle-insights"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
                {showInsights && <span className="ml-1 text-xs">⌄</span>}
                {!showInsights && <span className="ml-1 text-xs">⌃</span>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <Button
                onClick={() => setLocation('/dashboard')}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="button-dashboard"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Insights Panel */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-purple-900/20 backdrop-blur-sm border-b border-purple-500/20"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Personalized Recommendations */}
                <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      For You
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendationsLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    ) : (recommendations as any)?.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-300 hover:text-white transition-colors cursor-pointer">
                        <div className="font-medium text-white">{rec.title}</div>
                        <div className="text-gray-400 truncate">{rec.description}</div>
                        <div className="flex gap-1 mt-1">
                          {rec.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )) || (
                      <div className="text-xs text-gray-400">
                        {user ? 'Building your recommendations...' : 'Sign in for personalized content'}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Market Alerts */}
                <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-orange-300 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Smart Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {onChainAlertsLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ) : (marketAlerts as any)?.alerts?.slice(0, 3).map((alert: any, idx: number) => (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.severity === 'high' ? 'bg-red-400' :
                            alert.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                          }`}></div>
                          <span className="text-white font-medium">{alert.title}</span>
                        </div>
                        <div className="text-gray-400 truncate ml-4">{alert.message}</div>
                        {alert.probability && (
                          <div className="text-xs text-cyan-400 ml-4 mt-1">
                            {Math.round(alert.probability * 100)}% confidence
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="text-xs text-gray-400">No alerts at this time</div>
                    )}
                  </CardContent>
                </Card>

                {/* Sector Predictions */}
                <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedSector ? (
                      <>
                        {predictionsLoading ? (
                          <div className="animate-pulse space-y-2">
                            <div className="h-3 bg-gray-700 rounded"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                          </div>
                        ) : (sectorPredictions as any)?.predictions ? (
                          <div className="space-y-2">
                            <div className="text-xs">
                              <div className="text-white font-medium">{selectedSector} Outlook</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`text-lg font-bold ${
                                  (sectorPredictions as any)?.predictions?.prediction > 0 ? 'text-green-400' :
                                  (sectorPredictions as any)?.predictions?.prediction < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                  {(sectorPredictions as any)?.predictions?.prediction > 0 ? '+' : ''}
                                  {((sectorPredictions as any)?.predictions?.prediction * 100)?.toFixed(1) || '0.0'}%
                                </div>
                                <div className="text-xs text-gray-400">
                                  {Math.round(((sectorPredictions as any)?.predictions?.confidence || 0) * 100)}% confidence
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {(sectorPredictions as any)?.predictions?.reasoning?.slice(0, 2).map((reason: string, idx: number) => (
                                <div key={idx} className="text-xs text-gray-400">• {reason}</div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Generating predictions...</div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">Select a sector to see predictions</div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Phase 1: Market Pulse Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Market Pulse
            </h2>
            <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
              Live
            </Badge>
          </div>

          {/* Market Movers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {marketMovers.slice(0, 6).map((mover) => (
              <Card key={mover.symbol} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">{mover.symbol}</h3>
                      <p className="text-gray-400 text-sm">{mover.name}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={`${mover.momentum === 'bullish' ? 'bg-green-500/20 text-green-300' : 
                                       mover.momentum === 'bearish' ? 'bg-red-500/20 text-red-300' : 
                                       'bg-gray-500/20 text-gray-300'} border-0 text-xs`}>
                        {mover.momentum === 'bullish' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                         mover.momentum === 'bearish' ? <TrendingDown className="h-3 w-3 mr-1" /> :
                         <Activity className="h-3 w-3 mr-1" />}
                        {mover.momentum}
                      </Badge>
                      <Badge className={`text-xs border-0 ${
                        (mover as any).priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                        (mover as any).priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        (mover as any).priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {(mover as any).priority === 'critical' ? '🚨' :
                         (mover as any).priority === 'high' ? '⚡' :
                         (mover as any).priority === 'medium' ? '📊' : '📈'}
                        {(mover as any).priority || 'low'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{formatPrice(mover.price)}</span>
                      <span className={`font-medium ${getChangeColor(mover.changePercent)}`}>
                        {mover.changePercent > 0 ? '+' : ''}{mover.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      Vol: {formatVolume(mover.volume)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Phase 2: Sector Intelligence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Sector Intelligence
            </h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
              Real-time Correlations
            </Badge>
          </div>

          {/* Sector Performance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sectors.slice(0, 6).map((sector) => (
              <Card 
                key={sector.name} 
                className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer ${
                  selectedSector === sector.name ? 'ring-2 ring-blue-400/50 border-blue-400/30' : ''
                }`}
                onClick={() => handleSectorClick(sector.name, sector)}
                data-testid={`sector-card-${sector.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-white font-semibold">{sector.name}</h3>
                      <Badge className={`text-xs border-0 w-fit ${
                        (sector as any).priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                        (sector as any).priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        (sector as any).priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {(sector as any).priority === 'critical' ? '🚨' :
                         (sector as any).priority === 'high' ? '⚡' :
                         (sector as any).priority === 'medium' ? '📊' : '📈'}
                        {(sector as any).priority || 'low'} Priority
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {sector.trend === 'up' ? <ArrowUp className="h-4 w-4 text-green-400" /> :
                         sector.trend === 'down' ? <ArrowDown className="h-4 w-4 text-red-400" /> :
                         <Activity className="h-4 w-4 text-gray-400" />}
                        <span className={`text-sm font-medium ${getChangeColor(sector.performance)}`}>
                          {sector.performance > 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                        </span>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                        Score: {(sector as any).urgencyScore || Math.round(Math.abs(sector.performance) * 10)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Assets</span>
                      <span>{sector.assets}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Volume</span>
                      <span>{formatVolume(sector.volume)}</span>
                    </div>
                    
                    {/* Sentiment Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Sentiment</span>
                        <span>{Math.round(sector.sentiment * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            sector.sentiment > 0.6 ? 'bg-green-400' : 
                            sector.sentiment > 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${sector.sentiment * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Phase 2.5: Derivatives Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Derivatives Analytics
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 ml-2">
                <Zap className="h-3 w-3 mr-1" />
                Live Options & Futures
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              {/* Asset Selector */}
              <select
                value={selectedDerivativesAsset}
                onChange={(e) => setSelectedDerivativesAsset(e.target.value)}
                className="bg-black/40 border border-purple-500/30 text-purple-300 text-sm rounded-lg px-3 py-1 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                data-testid="derivatives-asset-selector"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
              </select>
            </div>
          </div>

          {/* Derivatives Overview Banner */}
          {!derivativesOverviewLoading && derivativesOverview?.overview && (
            <Card className="bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-purple-900/20 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Options Volume 24h</p>
                    <p className="text-white font-bold text-lg">
                      ${((derivativesOverview.overview.totalOptionsVolume24h || 0) / 1e6).toFixed(1)}M
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Futures Volume 24h</p>
                    <p className="text-white font-bold text-lg">
                      ${((derivativesOverview.overview.totalFuturesVolume24h || 0) / 1e9).toFixed(2)}B
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Avg IV</p>
                    <p className="text-white font-bold text-lg">
                      {((derivativesOverview.overview.averageImpliedVolatility || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Fear/Greed</p>
                    <p className={`font-bold text-lg ${
                      (derivativesOverview.overview.fearGreedIndex || 50) > 60 ? 'text-green-400' :
                      (derivativesOverview.overview.fearGreedIndex || 50) < 40 ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {derivativesOverview.overview.fearGreedIndex || 50}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Derivatives Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Options Flow Analysis */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-300 flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Options Flow
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                    24h Analysis
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {optionsFlowLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ) : optionsFlow?.flow?.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {optionsFlow.flow.slice(0, 5).map((flow: any, idx: number) => (
                      <div key={idx} className="bg-black/30 rounded p-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${
                              flow.sentiment === 'bullish' ? 'bg-green-500/20 text-green-300' :
                              flow.sentiment === 'bearish' ? 'bg-red-500/20 text-red-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {flow.type.toUpperCase()}
                            </Badge>
                            <span className="text-white font-medium">
                              ${flow.strike}
                            </span>
                          </div>
                          <span className={`font-medium ${
                            flow.sentiment === 'bullish' ? 'text-green-400' :
                            flow.sentiment === 'bearish' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {flow.side === 'buy' ? '↗' : '↘'} {flow.size.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          IV: {(flow.impliedVolatility * 100).toFixed(1)}% • 
                          ${(flow.notionalValue / 1000).toFixed(0)}K notional
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No options flow data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Futures Positioning */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-300 flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Futures Positioning
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                    Open Interest
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {derivativesAnalyticsLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ) : derivativesAnalytics?.futures?.positioning ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Long/Short Ratio</span>
                      <span className="text-white font-medium">
                        {derivativesAnalytics.futures.positioning.longShortRatio.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total OI</span>
                      <span className="text-white font-medium">
                        ${((derivativesAnalytics.futures.positioning.totalLongOI + 
                           derivativesAnalytics.futures.positioning.totalShortOI) / 1e6).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Top Trader Long %</span>
                      <span className="text-white font-medium">
                        {(derivativesAnalytics.futures.positioning.topTraderLongRatio * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* OI Change Indicator */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>OI Change 24h</span>
                        <span className={`${
                          derivativesAnalytics.futures.positioning.oiChange24h > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {derivativesAnalytics.futures.positioning.oiChange24h > 0 ? '+' : ''}
                          {derivativesAnalytics.futures.positioning.oiChange24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No positioning data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Liquidation Heatmap */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-300 flex items-center gap-2 text-sm">
                  <Flame className="h-4 w-4" />
                  Liquidation Heatmap
                  <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-xs">
                    Risk Levels
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {liquidationsLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ) : liquidationsData?.liquidations ? (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">24h Liquidations</span>
                        <span className="text-white font-medium">
                          {liquidationsData.liquidations.liquidations24h.total}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-red-500/10 rounded p-2">
                          <div className="text-red-300">Longs</div>
                          <div className="text-white font-medium">
                            {liquidationsData.liquidations.liquidations24h.long}
                          </div>
                        </div>
                        <div className="bg-green-500/10 rounded p-2">
                          <div className="text-green-300">Shorts</div>
                          <div className="text-white font-medium">
                            {liquidationsData.liquidations.liquidations24h.short}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Heatmap Visualization */}
                    <div className="mt-3">
                      <div className="text-xs text-gray-400 mb-2">Price Levels</div>
                      <div className="space-y-1">
                        {liquidationsData.liquidations.heatmap?.slice(0, 6).map((level: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">
                              ${level.price.toFixed(0)}
                            </span>
                            <div className="flex items-center gap-2">
                              <div 
                                className={`h-2 rounded ${
                                  level.side === 'long' ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${Math.max(10, level.intensity)}px`,
                                  opacity: Math.max(0.3, level.intensity / 100)
                                }}
                              />
                              <span className="text-white text-[10px] w-8">
                                {level.intensity.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Flame className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No liquidation data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Options Market Sentiment */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm lg:col-span-2 xl:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-300 flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4" />
                  Options Market Sentiment
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs">
                    Gamma Exposure
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {derivativesAnalyticsLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                ) : derivativesAnalytics?.options?.sentiment ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Put/Call Ratio</div>
                      <div className="text-white font-bold">
                        {derivativesAnalytics.options.sentiment.putCallRatio.volume.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Volume Based</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Flow Sentiment</div>
                      <div className={`font-bold ${
                        derivativesAnalytics.options.sentiment.flowSentiment.score > 20 ? 'text-green-400' :
                        derivativesAnalytics.options.sentiment.flowSentiment.score < -20 ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {derivativesAnalytics.options.sentiment.flowSentiment.score.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">-100 to +100</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Max Pain</div>
                      <div className="text-white font-bold">
                        ${derivativesAnalytics.options.sentiment.maxPain.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">Price Level</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Total Gamma</div>
                      <div className="text-white font-bold">
                        {(derivativesAnalytics.options.sentiment.gexExposure.totalGamma / 1e6).toFixed(1)}M
                      </div>
                      <div className="text-xs text-gray-500">Exposure</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sentiment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </motion.div>

        {/* Phase 3: Market Event Modeling & Prediction System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              Event Impact Modeling
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 ml-2">
                <Brain className="h-3 w-3 mr-1" />
                AI-Powered Predictions
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                🎯 Event Forecasting
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs">
                📊 Impact Analysis
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                💡 Trading Signals
              </Badge>
            </div>
          </div>

          {/* Event Modeling Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Upcoming High-Impact Events */}
            <UpcomingEventsCard />

            {/* Event Impact Predictions */}
            <EventPredictionsCard />

            {/* Trading Signals from Events */}
            <EventTradingSignalsCard />

            {/* Historical Impact Analysis */}
            <HistoricalAnalysisCard />

            {/* Model Performance Dashboard */}
            <ModelPerformanceCard />

            {/* Event Risk Monitoring */}
            <EventRiskMonitoringCard />

          </div>

        </motion.div>

        {/* Institutional Flow Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Institutional Flow Analytics
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 ml-2">
                <Brain className="h-3 w-3 mr-1" />
                Smart Money Tracking
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                🏛️ Institutional Flows
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs">
                🧠 Smart Money
              </Badge>
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs">
                💰 Fund Movements
              </Badge>
            </div>
          </div>

          {/* Institutional Analytics Overview */}
          <InstitutionalAnalyticsOverview />

          {/* Institutional Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Smart Money Movements */}
            <SmartMoneyMovements />

            {/* Institutional Fund Flows */}
            <InstitutionalFundFlows />

            {/* Institutional Sentiment */}
            <InstitutionalSentiment />

            {/* Institutional Positioning */}
            <InstitutionalPositioning />

            {/* Wallet Analysis */}
            <WalletAnalysis />

            {/* Flow Trends */}
            <FlowTrends />

          </div>
        </motion.div>

        {/* On-Chain Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-400" />
              On-Chain Analytics
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30 ml-2">
                <Zap className="h-3 w-3 mr-1" />
                Real-time
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                🐋 Whale Activity
              </Badge>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs">
                🏦 Exchange Flows
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                ⚡ Network Health
              </Badge>
            </div>
          </div>

          {/* On-Chain Alerts Banner */}
          {!onChainAlertsLoading && onChainAlerts?.alerts?.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-900/20 via-red-900/20 to-orange-900/20 border-orange-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-orange-300 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Live On-Chain Alerts
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 ml-2">
                    {onChainAlerts.alerts.filter((alert: any) => alert.severity === 'critical').length} Critical
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onChainAlerts.alerts.slice(0, 6).map((alert: any) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-black/30 rounded-lg p-4 border ${
                        alert.severity === 'critical' ? 'border-red-500/40' :
                        alert.severity === 'high' ? 'border-orange-500/40' :
                        'border-yellow-500/40'
                      }`}
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm line-clamp-2">{alert.title}</h4>
                          <p className="text-gray-300 text-xs mt-1 line-clamp-2">{alert.description}</p>
                        </div>
                        <Badge className={`text-xs ml-2 flex-shrink-0 ${
                          alert.severity === 'critical' ? 'bg-red-500/30 text-red-200' :
                          alert.severity === 'high' ? 'bg-orange-500/30 text-orange-200' :
                          'bg-yellow-500/30 text-yellow-200'
                        }`}>
                          {alert.severity === 'critical' ? '🚨' :
                           alert.severity === 'high' ? '⚡' : '⚠️'}
                          {alert.severity}
                        </Badge>
                      </div>
                      
                      {alert.amount_usd && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-white font-medium">
                            {alert.amount_usd >= 1e9 ? `$${(alert.amount_usd / 1e9).toFixed(1)}B` :
                             alert.amount_usd >= 1e6 ? `$${(alert.amount_usd / 1e6).toFixed(1)}M` :
                             `$${(alert.amount_usd / 1e3).toFixed(1)}K`}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                        <span>{alert.token_symbol || 'Multiple'}</span>
                        <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main On-Chain Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Whale Movements */}
            <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-purple-300 flex items-center gap-2">
                  🐋 Whale Movements
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                    {'>'} $1M Transactions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {whalesLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-600 rounded w-24"></div>
                            <div className="h-3 bg-gray-700 rounded w-32"></div>
                          </div>
                          <div className="h-6 bg-gray-600 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : whaleMovements?.whaleMovements?.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {whaleMovements.whaleMovements.slice(0, 8).map((whale: any) => (
                      <motion.div 
                        key={whale.transaction_hash || whale.hash}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                        data-testid={`whale-movement-${whale.transaction_hash || whale.hash}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              whale.whale_tier === 'mega' ? 'bg-red-400' :
                              whale.whale_tier === 'large' ? 'bg-orange-400' :
                              'bg-yellow-400'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-sm">
                                  {whale.token_symbol || 'ETH'}
                                </span>
                                <Badge className={`text-xs ${
                                  whale.transaction_type === 'buy' ? 'bg-green-500/20 text-green-300' :
                                  whale.transaction_type === 'sell' ? 'bg-red-500/20 text-red-300' :
                                  'bg-blue-500/20 text-blue-300'
                                }`}>
                                  {whale.transaction_type}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-400 font-mono">
                                {whale.whale_address ? `${whale.whale_address.slice(0, 6)}...${whale.whale_address.slice(-4)}` :
                                 whale.from ? `${whale.from.slice(0, 6)}...${whale.from.slice(-4)}` : 'Unknown'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-white font-bold text-sm">
                              {whale.amount_usd || whale.valueUsd ? 
                                `$${((whale.amount_usd || whale.valueUsd) / 1e6).toFixed(1)}M` : 
                                'Unknown'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {whale.timestamp ? new Date(whale.timestamp).toLocaleTimeString() : 'Recent'}
                            </div>
                          </div>
                        </div>
                        
                        {whale.exchange && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Exchange: {whale.exchange}</span>
                            {whale.gas_used && <span>Gas: {whale.gas_used} gwei</span>}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No whale movements detected</p>
                    <p className="text-xs">Monitoring transactions {'>'} $1M</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Network Status */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-green-300 flex items-center gap-2">
                  ⚡ Network Health
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {networkLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse">
                        <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : networkMetrics?.networkStatus?.length > 0 ? (
                  <div className="space-y-4">
                    {networkMetrics.networkStatus.map((network: any) => (
                      <motion.div 
                        key={network.network}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 rounded-lg p-3"
                        data-testid={`network-${network.network.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold text-sm">{network.network}</h4>
                          <Badge className={`text-xs ${
                            network.congestionLevel === 'low' ? 'bg-green-500/20 text-green-300' :
                            network.congestionLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {network.congestionLevel === 'low' ? '🟢' :
                             network.congestionLevel === 'medium' ? '🟡' : '🔴'}
                            {network.congestionLevel}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-gray-400">
                            <span>Gas (Fast):</span>
                            <span className="text-white">{network.gasPrice?.fast || 'N/A'} gwei</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Block Time:</span>
                            <span className="text-white">{network.blockTime || 'N/A'}s</span>
                          </div>
                          {network.tps_current && (
                            <div className="flex justify-between text-gray-400">
                              <span>TPS:</span>
                              <span className="text-white">{network.tps_current}</span>
                            </div>
                          )}
                        </div>

                        {/* Gas Price Bar */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                (network.gasPrice?.fast || 0) > 100 ? 'bg-red-400' :
                                (network.gasPrice?.fast || 0) > 50 ? 'bg-yellow-400' :
                                'bg-green-400'
                              }`}
                              style={{ 
                                width: `${Math.min(100, ((network.gasPrice?.fast || 0) / 150) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Globe className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Network data loading...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Exchange Flows */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                🏦 Exchange Flows
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30">
                  24h Activity
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exchangeFlowsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-600 rounded w-20 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : exchangeFlows?.exchangeFlows?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {exchangeFlows.exchangeFlows.map((flow: any) => (
                    <motion.div 
                      key={flow.exchange_name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all"
                      data-testid={`exchange-flow-${flow.exchange_name.toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">{flow.exchange_name}</h4>
                        <Badge className={`text-xs ${
                          flow.net_flow_24h > 0 ? 'bg-green-500/20 text-green-300' :
                          flow.net_flow_24h < 0 ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {flow.net_flow_24h > 0 ? '📈 Inflow' :
                           flow.net_flow_24h < 0 ? '📉 Outflow' : '➡️ Neutral'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Net Flow:</span>
                          <span className={`font-medium ${
                            flow.net_flow_24h > 0 ? 'text-green-300' :
                            flow.net_flow_24h < 0 ? 'text-red-300' : 'text-white'
                          }`}>
                            {flow.net_flow_24h >= 1e6 ? `$${(Math.abs(flow.net_flow_24h) / 1e6).toFixed(1)}M` :
                             flow.net_flow_24h >= 1e3 ? `$${(Math.abs(flow.net_flow_24h) / 1e3).toFixed(1)}K` :
                             `$${Math.abs(flow.net_flow_24h || 0).toFixed(0)}`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-gray-400">
                          <span>Large TXs:</span>
                          <span className="text-white">{flow.large_transactions || 0}</span>
                        </div>

                        {flow.flow_change_percentage !== 0 && (
                          <div className="flex justify-between text-gray-400">
                            <span>24h Change:</span>
                            <span className={`${
                              flow.flow_change_percentage > 0 ? 'text-green-300' : 'text-red-300'
                            }`}>
                              {flow.flow_change_percentage > 0 ? '+' : ''}{flow.flow_change_percentage.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No exchange flow data available</p>
                  <p className="text-xs">Monitoring major exchanges</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Economic Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              Economic Calendar
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 ml-2">
                <Bell className="h-3 w-3 mr-1" />
                Live Events
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-xs">
                🔥 High Impact
              </Badge>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30 text-xs">
                ⚡ Medium Impact
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                📊 Low Impact
              </Badge>
            </div>
          </div>

          {/* High Impact Events Row */}
          {(highImpactEvents as any)?.events?.length > 0 && (
            <Card className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 border-red-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  High-Impact Events
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 ml-2">
                    Market Moving
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(highImpactEvents as any)?.events?.slice(0, 3).map((event: any) => (
                    <div key={event.id} className="bg-black/30 rounded-lg p-4 border border-red-500/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm line-clamp-2">{event.title}</h4>
                          <p className="text-gray-300 text-xs mt-1">{event.description}</p>
                        </div>
                        <Badge className="bg-red-500/30 text-red-200 text-xs ml-2 flex-shrink-0">
                          {event.impact.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {/* Countdown Timer */}
                      <CountdownTimer 
                        targetDate={event.scheduledDate} 
                        isCompleted={event.isCompleted}
                        className="mb-3"
                      />
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {event.country}
                          </span>
                          <span>•</span>
                          <span>{event.source}</span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Target className="h-3 w-3" />
                          <span>{event.marketRelevance}%</span>
                        </div>
                      </div>
                      
                      {event.relatedSymbols && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {event.relatedSymbols.slice(0, 3).map((symbol: string) => (
                            <Badge key={symbol} variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                              {symbol}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Economic Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            <Card className="lg:col-span-2 bg-black/40 border-cyan-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-cyan-300 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming Events
                  <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-400/30 ml-2">
                    Next 30 Days
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                {(economicCalendarData as any)?.events?.length > 0 ? (
                  (economicCalendarData as any).events.slice(0, 8).map((event: any) => (
                    <div 
                      key={event.id} 
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer hover:bg-white/5 ${
                        event.impact === 'high' ? 'border-red-500/30 bg-red-500/5' :
                        event.impact === 'medium' ? 'border-orange-500/30 bg-orange-500/5' :
                        'border-blue-500/30 bg-blue-500/5'
                      }`}
                      onClick={() => trackUserInteraction('economic_event_click', 'event', event.id, {
                        eventType: event.eventType,
                        impact: event.impact,
                        timeToEvent: event.timeToEvent
                      })}
                      data-testid={`economic-event-${event.id}`}
                    >
                      {/* Impact Indicator */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        event.impact === 'high' ? 'bg-red-400' :
                        event.impact === 'medium' ? 'bg-orange-400' :
                        'bg-blue-400'
                      }`}></div>
                      
                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-sm truncate">{event.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span>{event.country}</span>
                              <span>•</span>
                              <span>{event.category.replace('_', ' ')}</span>
                              {event.forecast && (
                                <>
                                  <span>•</span>
                                  <span className="text-cyan-400">Est: {event.forecast}{event.unit || ''}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Mini Countdown */}
                          <CountdownTimer 
                            targetDate={event.scheduledDate} 
                            isCompleted={event.isCompleted}
                            compact={true}
                            className="ml-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Loading economic events...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Categories */}
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-purple-300 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Event Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: 'fomc', label: 'FOMC Meetings', icon: '🏛️', count: 2 },
                  { type: 'cpi', label: 'Inflation Data', icon: '📊', count: 1 },
                  { type: 'employment', label: 'Employment', icon: '👥', count: 1 },
                  { type: 'gdp', label: 'GDP Reports', icon: '💰', count: 1 },
                  { type: 'earnings', label: 'Earnings', icon: '📈', count: 3 }
                ].map((category) => (
                  <div 
                    key={category.type}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => trackUserInteraction('category_filter', 'economic_category', category.type)}
                    data-testid={`economic-category-${category.type}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="text-white font-medium text-sm">{category.label}</div>
                        <div className="text-gray-400 text-xs">{category.count} upcoming</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Correlation Analysis Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              Cross-Asset Correlation Analysis
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 ml-2">
                <Activity className="h-3 w-3 mr-1" />
                Live Correlations
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                {(['7d', '30d', '90d'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setCorrelationTimeframe(timeframe)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      correlationTimeframe === timeframe
                        ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/50'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    data-testid={`timeframe-${timeframe}`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                📊 Matrix View
              </Badge>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30 text-xs">
                🎯 Regime Detection
              </Badge>
            </div>
          </div>

          {/* Market Regime & Risk Sentiment Banner */}
          {(!regimeLoading && marketRegime?.data) && (
            <Card className={`bg-gradient-to-r backdrop-blur-sm ${
              marketRegime.data.regime === 'risk_on' 
                ? 'from-green-900/20 via-emerald-900/20 to-green-900/20 border-green-500/30'
                : marketRegime.data.regime === 'risk_off'
                ? 'from-red-900/20 via-rose-900/20 to-red-900/20 border-red-500/30'
                : marketRegime.data.regime === 'decoupled'
                ? 'from-purple-900/20 via-indigo-900/20 to-purple-900/20 border-purple-500/30'
                : 'from-yellow-900/20 via-amber-900/20 to-yellow-900/20 border-yellow-500/30'
            }`}>
              <CardHeader className="pb-4">
                <CardTitle className={`flex items-center gap-2 ${
                  marketRegime.data.regime === 'risk_on' ? 'text-green-300'
                  : marketRegime.data.regime === 'risk_off' ? 'text-red-300'
                  : marketRegime.data.regime === 'decoupled' ? 'text-purple-300'
                  : 'text-yellow-300'
                }`}>
                  <Target className="h-4 w-4" />
                  Market Regime: {marketRegime.data.regime.replace('_', '-').toUpperCase()}
                  <Badge className={`ml-2 ${
                    marketRegime.data.confidence > 0.8 ? 'bg-green-500/30 text-green-200 border-green-400/50'
                    : marketRegime.data.confidence > 0.6 ? 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50'
                    : 'bg-red-500/30 text-red-200 border-red-400/50'
                  }`}>
                    {Math.round(marketRegime.data.confidence * 100)}% Confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Regime Description */}
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {marketRegime.data.description}
                    </p>
                    
                    {/* Key Indicators */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Crypto-Stock Correlation</div>
                        <div className="text-sm font-medium text-white">
                          {(marketRegime.data.characteristics.cryptoTradStockCorr * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Risk Sentiment</div>
                        <div className="text-sm font-medium text-white">
                          {marketRegime.data.characteristics.riskSentiment > 0 ? '+' : ''}{(marketRegime.data.characteristics.riskSentiment * 100).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actionable Insights */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">💡 Actionable Insights</h4>
                    <div className="space-y-2">
                      {marketRegime.data.actionableInsights.slice(0, 3).map((insight: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Correlation Matrix & Risk Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Correlation Heatmap */}
            <Card className="lg:col-span-2 bg-black/40 border-indigo-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-indigo-300 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Correlation Heatmap ({correlationTimeframe})
                  <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 ml-2">
                    Cross-Asset Matrix
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {correlationLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                    <p>Loading correlation matrix...</p>
                  </div>
                ) : correlationMatrix?.success && correlationMatrix.data ? (
                  <div className="space-y-4">
                    {/* Top Correlations Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {correlationMatrix.data.matrix
                        .sort((a: any, b: any) => Math.abs(b.correlation) - Math.abs(a.correlation))
                        .slice(0, 3)
                        .map((pair: any) => (
                          <div key={`${pair.asset1}-${pair.asset2}`} className="bg-black/30 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-400 mb-1">{pair.asset1} × {pair.asset2}</div>
                            <div className={`text-sm font-medium ${
                              pair.correlation > 0.5 ? 'text-green-400' 
                              : pair.correlation < -0.5 ? 'text-red-400' 
                              : 'text-yellow-400'
                            }`}>
                              {pair.correlation > 0 ? '+' : ''}{(pair.correlation * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500 capitalize">{pair.strength}</div>
                          </div>
                        ))}
                    </div>

                    {/* Simplified Correlation Grid */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {correlationMatrix.data.assets.slice(0, 8).map((asset1: any) => (
                        <div key={asset1.symbol} className="grid grid-cols-9 gap-1 items-center">
                          <div className="text-xs font-medium text-white w-12 truncate">
                            {asset1.symbol}
                          </div>
                          {correlationMatrix.data.assets.slice(0, 8).map((asset2: any) => {
                            if (asset1.symbol === asset2.symbol) {
                              return <div key={asset2.symbol} className="w-6 h-6 bg-white/20 rounded text-xs flex items-center justify-center text-white">1</div>;
                            }
                            
                            const correlation = correlationMatrix.data.matrix.find((pair: any) => 
                              (pair.asset1 === asset1.symbol && pair.asset2 === asset2.symbol) ||
                              (pair.asset1 === asset2.symbol && pair.asset2 === asset1.symbol)
                            );
                            
                            const corrValue = correlation?.correlation || 0;
                            const intensity = Math.abs(corrValue);
                            
                            return (
                              <div 
                                key={asset2.symbol} 
                                className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white text-[10px] font-medium ${
                                  corrValue > 0.5 ? 'bg-green-500' 
                                  : corrValue > 0.2 ? 'bg-green-500/60'
                                  : corrValue < -0.5 ? 'bg-red-500'
                                  : corrValue < -0.2 ? 'bg-red-500/60'
                                  : 'bg-gray-500/40'
                                }`}
                                style={{ opacity: Math.max(0.3, intensity) }}
                                title={`${asset1.symbol} × ${asset2.symbol}: ${(corrValue * 100).toFixed(1)}%`}
                              >
                                {Math.round(corrValue * 10)}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No correlation data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Sentiment Indicator */}
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-purple-300 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Risk Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskSentimentLoading ? (
                  <div className="text-center py-6 text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                    <p className="text-xs">Loading sentiment...</p>
                  </div>
                ) : riskSentiment?.success && riskSentiment.data ? (
                  <>
                    {/* Sentiment Score */}
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{
                        color: riskSentiment.data.score > 40 ? '#10b981' 
                             : riskSentiment.data.score > 0 ? '#f59e0b'
                             : riskSentiment.data.score > -40 ? '#f97316'
                             : '#ef4444'
                      }}>
                        {riskSentiment.data.score > 0 ? '+' : ''}{riskSentiment.data.score}
                      </div>
                      <div className="text-xs text-gray-400 capitalize mb-2">
                        {riskSentiment.data.sentiment.replace('_', ' ')}
                      </div>
                      
                      {/* Sentiment Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.abs(riskSentiment.data.score)}%`,
                            backgroundColor: riskSentiment.data.score > 0 ? '#10b981' : '#ef4444',
                            marginLeft: riskSentiment.data.score < 0 ? `${100 - Math.abs(riskSentiment.data.score)}%` : '0'
                          }}
                        />
                      </div>
                    </div>

                    {/* Components Breakdown */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-white mb-2">Component Analysis</div>
                      {[
                        { label: 'Crypto-Traditional', value: riskSentiment.data.components.cryptoTraditionalCorr },
                        { label: 'Volatility Spreads', value: riskSentiment.data.components.volatilitySpreads },
                        { label: 'Safe Haven Demand', value: riskSentiment.data.components.safeHavenDemand },
                        { label: 'Momentum Alignment', value: riskSentiment.data.components.momentumAlignment }
                      ].map((component) => (
                        <div key={component.label} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{component.label}</span>
                          <span className={`font-medium ${
                            component.value > 20 ? 'text-green-400' 
                            : component.value > 0 ? 'text-yellow-400'
                            : component.value > -20 ? 'text-orange-400'
                            : 'text-red-400'
                          }`}>
                            {component.value > 0 ? '+' : ''}{component.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Signals */}
                    {riskSentiment.data.signals.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-white">Active Signals</div>
                        <div className="space-y-1">
                          {riskSentiment.data.signals.slice(0, 3).map((signal: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 text-xs text-gray-300">
                              <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                              <span>{signal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No sentiment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Federal Reserve Communication Monitoring Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              🏛️ Federal Reserve Monitor
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 ml-2">
                <Activity className="h-3 w-3 mr-1" />
                Policy Insights
              </Badge>
            </h2>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                📈 Sentiment Analysis
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs">
                🗣️ Communications
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                ⚠️ Policy Alerts
              </Badge>
            </div>
          </div>

          {/* Fed Policy Alerts Banner */}
          {!fedAlertsLoading && fedPolicyAlerts?.success && fedPolicyAlerts.alerts?.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-blue-900/20 border-blue-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-300 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Fed Policy Alerts
                  <Badge className="bg-red-500/30 text-red-200 border-red-400/50 ml-2">
                    {fedPolicyAlerts.alerts.filter((alert: any) => alert.severity === 'high' || alert.severity === 'critical').length} High Priority
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fedPolicyAlerts.alerts.slice(0, 4).map((alert: any) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-black/30 rounded-lg p-4 border ${
                        alert.severity === 'critical' ? 'border-red-500/40' :
                        alert.severity === 'high' ? 'border-orange-500/40' :
                        'border-blue-500/40'
                      }`}
                      onClick={() => trackUserInteraction('fed_alert_click', 'alert', alert.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`text-xs ${
                          alert.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                          alert.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {alert.alertType.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(alert.dateCreated).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1">{alert.title}</h4>
                      <p className="text-gray-300 text-xs line-clamp-2">{alert.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-400">by {alert.officialName}</span>
                        <div className="flex gap-1">
                          {alert.expectedImpact.stocks === 'bullish' && <span className="text-green-400">📈</span>}
                          {alert.expectedImpact.stocks === 'bearish' && <span className="text-red-400">📉</span>}
                          {alert.expectedImpact.bonds === 'bullish' && <span className="text-blue-400">🏦</span>}
                          {alert.expectedImpact.dollar === 'bullish' && <span className="text-green-400">💵</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Fed Monitoring Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Fed Communications */}
            <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-blue-300 flex items-center gap-2">
                  🗣️ Recent Communications
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    Sentiment Analysis
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fedCommLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : fedCommunications?.success ? (
                  <div className="space-y-4">
                    {fedCommunications.communications.slice(0, 5).map((comm: any) => (
                      <motion.div 
                        key={comm.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/20 rounded-lg p-4 hover:bg-black/30 transition-colors cursor-pointer"
                        onClick={() => trackUserInteraction('fed_communication_click', 'communication', comm.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${
                              comm.sentiment.stance === 'hawkish' ? 'bg-red-500/20 text-red-300' :
                              comm.sentiment.stance === 'dovish' ? 'bg-green-500/20 text-green-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {comm.sentiment.stance === 'hawkish' ? '🦅 Hawkish' :
                               comm.sentiment.stance === 'dovish' ? '🕊️ Dovish' :
                               '⚖️ Neutral'}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                              {comm.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {comm.isHighImpact && (
                              <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                                <Flame className="h-3 w-3 mr-1" />
                                High Impact
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(comm.date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 className="text-white font-medium mb-2 text-sm">{comm.title}</h4>
                        <p className="text-gray-300 text-xs line-clamp-2 mb-3">{comm.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">by {comm.officialName}</span>
                            <div className="flex items-center gap-1">
                              {comm.keyTopics.slice(0, 2).map((topic: string) => (
                                <Badge key={topic} className="bg-purple-500/20 text-purple-300 text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              Market Relevance: {comm.marketRelevance}%
                            </span>
                            <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  comm.marketRelevance >= 80 ? 'bg-red-400' :
                                  comm.marketRelevance >= 60 ? 'bg-orange-400' :
                                  'bg-blue-400'
                                }`}
                                style={{ width: `${comm.marketRelevance}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>Fed communications will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fed Analytics Summary & Calendar */}
            <div className="space-y-6">
              
              {/* Fed Analytics Summary */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-green-300 flex items-center gap-2">
                    📊 Policy Insights
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                      30D Trend
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fedAnalyticsLoading ? (
                    <div className="space-y-3">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ) : fedAnalytics?.success ? (
                    <div className="space-y-4">
                      {/* Sentiment Trend */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Overall Sentiment</span>
                          <Badge className={`text-xs ${
                            fedAnalytics.summary.sentimentTrend.direction === 'increasingly_hawkish' ? 'bg-red-500/20 text-red-300' :
                            fedAnalytics.summary.sentimentTrend.direction === 'increasingly_dovish' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {fedAnalytics.summary.sentimentTrend.direction.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              fedAnalytics.summary.sentimentTrend.direction === 'increasingly_hawkish' ? 'bg-red-400' :
                              fedAnalytics.summary.sentimentTrend.direction === 'increasingly_dovish' ? 'bg-green-400' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${fedAnalytics.summary.sentimentTrend.strength}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Dovish</span>
                          <span>Neutral</span>
                          <span>Hawkish</span>
                        </div>
                      </div>

                      {/* Key Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-300">{fedAnalytics.summary.totalCommunications}</div>
                          <div className="text-xs text-gray-400">Communications</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="text-2xl font-bold text-orange-300">{fedAnalytics.summary.highImpactCommunications}</div>
                          <div className="text-xs text-gray-400">High Impact</div>
                        </div>
                      </div>

                      {/* Market Implications */}
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2">Market Implications</h4>
                        <div className="space-y-1">
                          {fedAnalytics.summary.marketImplications.shortTerm.slice(0, 2).map((implication: string, index: number) => (
                            <div key={index} className="text-xs text-gray-300 flex items-start gap-2">
                              <ChevronRight className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{implication}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-xs">Analytics loading...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Fed Events */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-purple-300 flex items-center gap-2">
                    📅 Upcoming Events
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                      Calendar
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fedCalendarLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-3 bg-gray-700 rounded w-full mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : fedCalendar?.success ? (
                    <div className="space-y-3">
                      {fedCalendar.events.slice(0, 3).map((event: any) => (
                        <motion.div 
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-black/20 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                              {event.eventType.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(event.scheduledDate).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-white font-medium text-sm mb-1">{event.title}</h4>
                          {event.officialName && (
                            <p className="text-gray-300 text-xs">Speaker: {event.officialName}</p>
                          )}
                          <div className="mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-400" />
                              <span className="text-xs text-gray-400">
                                Market Relevance: {event.marketRelevance}%
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <Calendar className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-xs">No upcoming events</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Phase 2: Enhanced Trending Stories Hub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              Content Intelligence
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 ml-2">
                <Brain className="h-3 w-3 mr-1" />
                AI-Ranked
              </Badge>
            </h2>
            
            {/* Enhanced Story Type Filter */}
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all', label: 'All Sources', icon: Globe },
                { key: 'farcaster', label: 'Social', icon: MessageSquare },
                { key: 'youtube', label: 'Videos', icon: Video },
                { key: 'news', label: 'News', icon: Newspaper }
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setStoryFilter(key)}
                  className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                    storyFilter === key
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                  data-testid={`story-filter-${key}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Story Clustering Indicator */}
          {selectedSector && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-400/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-white font-medium">Sector Focus: {selectedSector}</h3>
                    <p className="text-gray-300 text-sm">Stories and discussions related to {selectedSector} sector</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSector(null);
                      trackUserInteraction('sector_unclick', 'sector', selectedSector);
                    }}
                    className="ml-auto text-gray-400 hover:text-white transition-colors"
                    data-testid="button-clear-sector"
                  >
                    ×
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phase 2: Smart Story Clustering */}
          <div className="space-y-4">
            {/* Always show content - no more infinite loading */}
            {trendingStories.length > 0 ? (
              <>
                {/* Story clusters with enhanced ranking */}
                {trendingStories.slice(0, 12).map((story, index) => (
                  <Card 
                    key={story.id} 
                    className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer ${
                      index < 3 ? 'ring-1 ring-orange-400/30' : ''
                    }`}
                    onClick={() => handleStoryClick(story, 'view')}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        {story.thumbnail && (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={story.thumbnail} 
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Priority indicator for top stories */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {index < 3 && (
                                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Hot Trend #{index + 1}
                                  </Badge>
                                )}
                                <Badge className={`text-xs border-0 ${
                                  (story as any).priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                                  (story as any).priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                  (story as any).priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {(story as any).priority === 'critical' ? '🔥' :
                                   (story as any).priority === 'high' ? '⚡' :
                                   (story as any).priority === 'medium' ? '📈' : '📊'}
                                  {(story as any).priority || 'low'} Priority
                                </Badge>
                                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  AI Rank #{(story as any).aiRank || index + 1}
                                </Badge>
                              </div>
                              
                              <h3 className="text-white font-semibold text-base sm:text-lg line-clamp-2">{story.title}</h3>
                              <p className="text-gray-300 text-xs sm:text-sm mt-1 line-clamp-2">{story.description}</p>
                              
                              {/* Sector correlation indicator */}
                              {selectedSector && story.metadata.tags.some((tag: string) => 
                                tag.toLowerCase().includes(selectedSector.toLowerCase())
                              ) && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 mt-2">
                                  <Target className="h-3 w-3 mr-1" />
                                  {selectedSector} Related
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30">
                                <Star className="h-3 w-3 mr-1" />
                                {story.metadata.trendingScore}
                              </Badge>
                              
                              {/* Sentiment indicator */}
                              <Badge className={`${
                                story.metadata.sentiment === 'positive' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                                story.metadata.sentiment === 'negative' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                                'bg-gray-500/20 text-gray-300 border-gray-400/30'
                              }`}>
                                {story.metadata.sentiment === 'positive' ? '📈' :
                                 story.metadata.sentiment === 'negative' ? '📉' : '➖'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {story.source}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTimeAgo(story.metadata.publishedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {story.metadata.author}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {story.engagement.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {story.engagement.comments}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {story.engagement.views}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {story.metadata.tags.slice(0, 4).map((tag: string) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className={`text-xs bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 cursor-pointer ${
                                  selectedSector && tag.toLowerCase().includes(selectedSector.toLowerCase()) ?
                                  'border-blue-400/30 text-blue-300' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering story click
                                  handleStoryClick(story, 'tag_click');
                                  setSelectedSector(tag);
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load more indicator */}
                {trendingStories.length > 12 && (
                  <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-400/20 hover:bg-purple-500/20 transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-purple-300">
                        <ChevronRight className="h-4 w-4" />
                        <span>Load {trendingStories.length - 12} more stories</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-300">Loading trending stories...</p>
                  <p className="text-gray-400 text-sm mt-2">Analyzing content intelligence across platforms...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Risk Assessment and Portfolio Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-400" />
              Risk Assessment & Portfolio Analysis
            </h2>
            {!riskDashboardLoading && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                Live Analytics
              </Badge>
            )}
          </div>

          {riskDashboardLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-gray-700/50 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-8 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : riskDashboard?.data ? (
            <div className="space-y-6">
              {/* Risk Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Portfolio Value */}
                <Card className="bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-300 text-sm font-medium">Portfolio Value</p>
                        <p className="text-white text-xl font-bold">
                          ${riskDashboard.data.portfolio.totalValue.toLocaleString()}
                        </p>
                        <p className="text-emerald-400 text-xs">
                          {riskDashboard.data.portfolio.totalAllocated.toFixed(1)}% allocated
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Value at Risk */}
                <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-300 text-sm font-medium">VaR (95% 1d)</p>
                        <p className="text-white text-xl font-bold">
                          {riskDashboard.data.riskMetrics.var95_1d.toFixed(2)}%
                        </p>
                        <p className="text-red-400 text-xs">
                          ${(riskDashboard.data.portfolio.totalValue * riskDashboard.data.riskMetrics.var95_1d / 100).toLocaleString()}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Sharpe Ratio */}
                <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-300 text-sm font-medium">Sharpe Ratio</p>
                        <p className="text-white text-xl font-bold">
                          {riskDashboard.data.riskMetrics.sharpeRatio.toFixed(2)}
                        </p>
                        <p className={`text-xs ${
                          riskDashboard.data.riskMetrics.sharpeRatio > 1 ? 'text-green-400' :
                          riskDashboard.data.riskMetrics.sharpeRatio > 0.5 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {riskDashboard.data.riskMetrics.sharpeRatio > 1 ? 'Excellent' :
                           riskDashboard.data.riskMetrics.sharpeRatio > 0.5 ? 'Good' : 'Poor'} Risk-Adjusted Return
                        </p>
                      </div>
                      <Scale className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Diversification Score */}
                <Card className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-300 text-sm font-medium">Diversification</p>
                        <p className="text-white text-xl font-bold">
                          {riskDashboard.data.riskMetrics.diversificationScore.toFixed(0)}/100
                        </p>
                        <p className={`text-xs ${
                          riskDashboard.data.riskMetrics.diversificationScore > 75 ? 'text-green-400' :
                          riskDashboard.data.riskMetrics.diversificationScore > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {riskDashboard.data.riskMetrics.diversificationScore > 75 ? 'Well Diversified' :
                           riskDashboard.data.riskMetrics.diversificationScore > 50 ? 'Moderately Diversified' : 'Concentrated'}
                        </p>
                      </div>
                      <PieChart className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Alerts */}
              {riskAlerts?.data?.alerts && riskAlerts.data.alerts.length > 0 && (
                <Card className="bg-gradient-to-r from-red-900/10 to-orange-900/10 border-red-500/20 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-red-300 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Active Risk Alerts ({riskAlerts.data.summary.activeAlerts})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {riskAlerts.data.alerts.slice(0, 3).map((alert: any) => (
                      <div key={alert.id} className="flex items-start justify-between p-3 bg-black/20 rounded-lg border border-red-500/20">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs border-0 ${
                              alert.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                              alert.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                              alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {(alert.severity || 'unknown').toUpperCase()}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                              {alert.alertType.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <h4 className="text-white font-medium text-sm">{alert.title}</h4>
                          <p className="text-gray-300 text-xs mt-1">{alert.description}</p>
                          {alert.affectedPositions.length > 0 && (
                            <p className="text-gray-400 text-xs mt-1">
                              Affected: {alert.affectedPositions.join(', ')}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-3 border-red-400/30 text-red-300 hover:bg-red-500/20"
                          onClick={() => trackUserInteraction('risk_alert_acknowledge', 'alert', alert.id)}
                          data-testid={`button-acknowledge-alert-${alert.id}`}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Portfolio Composition and Stress Tests */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Portfolio Composition */}
                <Card className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-cyan-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Portfolio Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Asset Allocation */}
                    <div className="space-y-3">
                      {Object.entries(riskDashboard.data.composition.assetAllocation).map(([asset, data]: [string, any]) => (
                        <div key={asset} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              asset === 'crypto' ? 'bg-orange-400' :
                              asset === 'stocks' ? 'bg-blue-400' :
                              asset === 'commodities' ? 'bg-yellow-400' : 'bg-green-400'
                            }`}></div>
                            <span className="text-white capitalize text-sm">{asset}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium text-sm">{data.allocation.toFixed(1)}%</p>
                            <p className="text-gray-400 text-xs">${data.value.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Rebalancing Needs */}
                    {riskDashboard.data.composition.rebalancingNeeds.length > 0 && (
                      <div className="pt-4 border-t border-cyan-500/20">
                        <p className="text-cyan-300 text-sm font-medium mb-2">Rebalancing Recommendations</p>
                        <div className="space-y-2">
                          {riskDashboard.data.composition.rebalancingNeeds.slice(0, 3).map((rebalance: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-300">{rebalance.position}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${
                                  rebalance.action === 'buy' ? 'bg-green-500/20 text-green-300' :
                                  rebalance.action === 'sell' ? 'bg-red-500/20 text-red-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {rebalance.action.toUpperCase()}
                                </Badge>
                                <span className={`text-xs ${
                                  rebalance.urgency === 'high' ? 'text-red-400' :
                                  rebalance.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                  {rebalance.deviation > 0 ? '+' : ''}{rebalance.deviation.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stress Testing Results */}
                <Card className="bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-red-300 flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Stress Test Scenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stressTests?.data?.stressTests?.slice(0, 4).map((test: any, index: number) => (
                      <div key={index} className="p-3 bg-black/20 rounded-lg border border-red-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs border-0 ${
                              test.scenario.severity === 'extreme' ? 'bg-red-500/30 text-red-300' :
                              test.scenario.severity === 'severe' ? 'bg-orange-500/30 text-orange-300' :
                              test.scenario.severity === 'moderate' ? 'bg-yellow-500/30 text-yellow-300' :
                              'bg-gray-500/30 text-gray-300'
                            }`}>
                              {test.scenario.severity.toUpperCase()}
                            </Badge>
                            <span className="text-white text-sm font-medium">{test.scenario.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-red-400 font-medium text-sm">
                              -{test.portfolioImpact.totalLossPercent.toFixed(1)}%
                            </p>
                            <p className="text-gray-400 text-xs">
                              ${test.portfolioImpact.totalLoss.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-xs">{test.scenario.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-gray-400 text-xs">Recovery: {test.portfolioImpact.timeToRecover} days</span>
                          <span className="text-gray-400 text-xs">Worst Day: -{test.portfolioImpact.worstDayLoss.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Position Sizing Recommendations */}
              {positionSizing?.data?.recommendations && positionSizing.data.recommendations.length > 0 && (
                <Card className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-indigo-300 flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Position Sizing Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {positionSizing.data.recommendations.slice(0, 6).map((rec: any, index: number) => (
                        <div key={index} className="p-3 bg-black/20 rounded-lg border border-indigo-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm">{rec.symbol}</span>
                              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs">
                                {rec.assetType.toUpperCase()}
                              </Badge>
                            </div>
                            <Badge className={`text-xs border-0 ${
                              rec.confidence > 80 ? 'bg-green-500/20 text-green-300' :
                              rec.confidence > 60 ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {rec.confidence}% Confidence
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Current:</span>
                              <span className="text-gray-300">{rec.currentAllocation.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Recommended:</span>
                              <span className={`font-medium ${
                                rec.recommendedAllocation > rec.currentAllocation ? 'text-green-400' :
                                rec.recommendedAllocation < rec.currentAllocation ? 'text-red-400' : 'text-gray-300'
                              }`}>
                                {rec.recommendedAllocation.toFixed(1)}%
                                {rec.recommendedAllocation !== rec.currentAllocation && (
                                  <span className="ml-1">
                                    ({rec.recommendedAllocation > rec.currentAllocation ? '+' : ''}
                                    {(rec.recommendedAllocation - rec.currentAllocation).toFixed(1)})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Risk Score:</span>
                              <span className={`${
                                rec.riskScore > 70 ? 'text-red-400' :
                                rec.riskScore > 40 ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {rec.riskScore}/100
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-300 text-xs mt-2">{rec.rationale}</p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                              {rec.sizingMethod.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-gray-400 text-xs">{rec.timeHorizon}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risk Metrics Summary */}
              <Card className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border-gray-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-gray-300 flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Detailed Risk Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                      { label: 'Portfolio Volatility', value: `${riskDashboard.data.riskMetrics.portfolioVolatility.toFixed(2)}%`, color: 'text-orange-400' },
                      { label: 'Max Drawdown', value: `${riskDashboard.data.riskMetrics.maxDrawdown.toFixed(2)}%`, color: 'text-red-400' },
                      { label: 'Calmar Ratio', value: riskDashboard.data.riskMetrics.calmarRatio.toFixed(2), color: 'text-green-400' },
                      { label: 'Sortino Ratio', value: riskDashboard.data.riskMetrics.sortinoRatio.toFixed(2), color: 'text-blue-400' },
                      { label: 'Portfolio Beta', value: riskDashboard.data.riskMetrics.beta.toFixed(2), color: 'text-purple-400' },
                      { label: 'Portfolio Alpha', value: `${riskDashboard.data.riskMetrics.alpha.toFixed(2)}%`, color: 'text-cyan-400' }
                    ].map((metric, index) => (
                      <div key={index} className="text-center">
                        <p className="text-gray-400 text-xs">{metric.label}</p>
                        <p className={`${metric.color} font-bold text-lg`}>{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">Risk assessment data temporarily unavailable</p>
                <p className="text-gray-400 text-sm mt-2">Portfolio analysis will resume shortly</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Pattern Recognition and Trend Analysis - Phase 3 Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Brain className="h-7 w-7 text-cyan-400" />
              Pattern Recognition & Trend Analysis
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-xs">
                AI-Powered
              </Badge>
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                <Target className="h-4 w-4 mr-1" />
                Screen All
              </Button>
              <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                <Bell className="h-4 w-4 mr-1" />
                Alerts
              </Button>
            </div>
          </div>

          <PatternRecognitionSection />
        </motion.div>

        {/* Volatility Forecasting and Stress Monitoring - Phase 3 Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="h-7 w-7 text-red-400" />
              Volatility Forecasting & Stress Monitoring
              <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-xs">
                Real-Time
              </Badge>
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-red-500/30 text-red-300 hover:bg-red-500/10">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Stress Test
              </Button>
              <Button variant="outline" size="sm" className="border-red-500/30 text-red-300 hover:bg-red-500/10">
                <Gauge className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </div>
          </div>

          <VolatilityForecastingSection />
        </motion.div>

        {/* Cross-Market Signal Generation - Phase 3 Final Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Crosshair className="h-7 w-7 text-violet-400" />
              Cross-Market Signal Generation
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30 text-xs">
                AI-Unified
              </Badge>
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                <Layers className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <Button variant="outline" size="sm" className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                <Bell className="h-4 w-4 mr-1" />
                Alerts
              </Button>
            </div>
          </div>

          <CrossMarketSignalSection />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-wrap gap-4"
        >
          <Button
            onClick={() => setLocation('/create-summary')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            data-testid="button-create-summary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create AI Summary
          </Button>
          
          <Button
            onClick={() => setLocation('/farcaster-activity')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="button-social-activity"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Social Activity
          </Button>
          
          <Button
            onClick={() => setLocation('/defi-dashboard')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="button-defi-dashboard"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            DeFi Analytics
          </Button>
        </motion.div>
      </div>
    </div>
  );
}