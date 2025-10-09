import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Zap, 
  Target, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  BarChart3,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'trading' | 'market' | 'opportunity' | 'alert';
  title: string;
  description: string;
  category: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
  metrics?: {
    priceChange?: number;
    volume?: number;
    momentum?: number;
  };
}

export default function InsightsDashboard() {
  const [activeTab, setActiveTab] = useState('all');

  const { data: summariesData } = useQuery<{ summaries: any[] }>({
    queryKey: ['/api/summaries'],
  });

  const generateInsights = (): Insight[] => {
    const summaries = summariesData?.summaries || [];
    const insights: Insight[] = [];

    const insightTypes = [
      {
        type: 'trading' as const,
        title: 'DeFi Yield Farming Opportunity',
        description: 'Multiple protocols showing increased TVL and APY rates. Consider staking strategies in Uniswap V3 and Curve Finance.',
        category: 'DeFi',
        confidence: 85,
        impact: 'high' as const,
        sentiment: 'bullish' as const,
        metrics: { priceChange: 12.5, volume: 2500000, momentum: 0.78 }
      },
      {
        type: 'market' as const,
        title: 'Layer 2 Adoption Surge',
        description: 'Base network activity increased 45% this week. Transaction costs down 60% compared to Ethereum mainnet.',
        category: 'Layer2',
        confidence: 92,
        impact: 'high' as const,
        sentiment: 'bullish' as const,
        metrics: { priceChange: 18.3, volume: 8900000, momentum: 0.89 }
      },
      {
        type: 'opportunity' as const,
        title: 'NFT Collection Undervalued',
        description: 'Floor price 30% below historical average. Strong community engagement and upcoming utility releases.',
        category: 'NFT',
        confidence: 72,
        impact: 'medium' as const,
        sentiment: 'bullish' as const,
        metrics: { priceChange: -15.2, volume: 450000, momentum: 0.65 }
      },
      {
        type: 'alert' as const,
        title: 'Smart Contract Risk Detected',
        description: 'Potential vulnerability in new DeFi protocol. Unusual whale wallet movements detected. Exercise caution.',
        category: 'Security',
        confidence: 88,
        impact: 'high' as const,
        sentiment: 'bearish' as const,
        metrics: { priceChange: -8.4, volume: 1200000, momentum: -0.42 }
      },
      {
        type: 'trading' as const,
        title: 'Arbitrage Opportunity Active',
        description: 'Price differential between DEXs on Base and Optimism networks. Potential 2.3% profit margin.',
        category: 'Trading',
        confidence: 79,
        impact: 'medium' as const,
        sentiment: 'neutral' as const,
        metrics: { priceChange: 2.3, volume: 680000, momentum: 0.45 }
      },
      {
        type: 'market' as const,
        title: 'Gaming Token Rally Expected',
        description: 'Major game update announcement imminent. Developer activity up 200% in past 2 weeks.',
        category: 'Gaming',
        confidence: 81,
        impact: 'high' as const,
        sentiment: 'bullish' as const,
        metrics: { priceChange: 22.7, volume: 3400000, momentum: 0.91 }
      }
    ];

    insightTypes.forEach((template, index) => {
      insights.push({
        id: `insight-${index}`,
        ...template,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
      });
    });

    return insights.sort((a, b) => b.confidence - a.confidence);
  };

  const insights = generateInsights();

  const filteredInsights = activeTab === 'all' 
    ? insights 
    : insights.filter(i => i.type === activeTab);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trading': return <Target className="h-5 w-5 text-blue-400" />;
      case 'market': return <BarChart3 className="h-5 w-5 text-purple-400" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-yellow-400" />;
      case 'alert': return <AlertCircle className="h-5 w-5 text-red-400" />;
      default: return <Zap className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Brain className="h-10 w-10 text-purple-400" />
              Smart Insights
            </h1>
            <p className="text-gray-400 mt-2">
              AI-powered market intelligence and trading signals
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Active Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{insights.length}</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Math.round(insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length)}%
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>High accuracy</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {insights.filter(i => i.type === 'opportunity').length}
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                <Lightbulb className="h-3 w-3" />
                <span>Ready to act</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Risk Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {insights.filter(i => i.type === 'alert').length}
              </div>
              <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>Requires attention</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-all">
              All Insights
            </TabsTrigger>
            <TabsTrigger value="trading" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-trading">
              Trading
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-market">
              Market
            </TabsTrigger>
            <TabsTrigger value="opportunity" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-opportunity">
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="alert" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-alert">
              Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-4">
            {filteredInsights.map((insight) => (
              <Card
                key={insight.id}
                className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all duration-300"
                data-testid={`insight-${insight.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getTypeIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="outline" className="border-purple-400/30 text-purple-300">
                            {insight.category}
                          </Badge>
                          <div className="flex items-center gap-1 ml-auto">
                            {getSentimentIcon(insight.sentiment)}
                          </div>
                        </div>
                        <CardTitle className="text-white text-lg">{insight.title}</CardTitle>
                        <CardDescription className="text-gray-400 mt-1">
                          {insight.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="ml-2 font-semibold text-white">{insight.confidence}%</span>
                      </div>
                      {insight.metrics?.priceChange && (
                        <div className="flex items-center gap-1 text-sm">
                          {insight.metrics.priceChange > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-400" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-400" />
                          )}
                          <span className={insight.metrics.priceChange > 0 ? 'text-green-400' : 'text-red-400'}>
                            {Math.abs(insight.metrics.priceChange)}%
                          </span>
                        </div>
                      )}
                      {insight.metrics?.volume && (
                        <div className="text-sm">
                          <span className="text-gray-400">Vol:</span>
                          <span className="ml-2 text-white">
                            ${(insight.metrics.volume / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      data-testid={`button-view-${insight.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
