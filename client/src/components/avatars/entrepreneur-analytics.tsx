import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from "lucide-react";
import { 
  LineChart as RechartsLine, 
  Line, 
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

interface BestCall {
  name: string;
  date: string;
  entry?: string;
  current?: string;
  exit?: string;
  roi: string;
  outcome: string;
}

interface WorstCall {
  name: string;
  date: string;
  roi: string;
  outcome: string;
  loss?: string;
  cost?: string;
}

interface RecentActivity {
  date: string;
  action: string;
  details: string;
}

interface EntrepreneurAnalyticsProps {
  entrepreneur: {
    name: string;
    investmentThesis: string;
    bestCalls: BestCall[];
    worstCalls: WorstCall[];
    recentActivity: RecentActivity[];
    category: string;
    riskScore: number;
    volatility: number;
    marketOutlook: string;
    netWorth: string;
    portfolioRoi: number;
  };
  showThesis?: boolean;
  showMetrics?: boolean;
}

export function EntrepreneurAnalytics({ entrepreneur, showThesis = true, showMetrics = true }: EntrepreneurAnalyticsProps) {
  // Parse numeric values from roi strings
  const parseROI = (roi: string): number | null => {
    if (!roi || roi === 'Ongoing' || roi === 'Founder' || roi === 'CEO') return null;
    const match = roi.match(/-?\d+/);
    return match ? parseFloat(match[0]) : null;
  };

  // Prepare chart data from best and worst calls
  const performanceData = [
    ...entrepreneur.bestCalls
      .map(call => ({
        name: call.name.substring(0, 20),
        roi: parseROI(call.roi),
        type: 'Win',
        date: call.date
      }))
      .filter(d => d.roi !== null),
    ...entrepreneur.worstCalls
      .map(call => ({
        name: call.name.substring(0, 20),
        roi: parseROI(call.roi),
        type: 'Loss',
        date: call.date
      }))
      .filter(d => d.roi !== null)
  ].sort((a, b) => (b.roi || 0) - (a.roi || 0));

  // Risk-return scatter data
  const riskReturnData = [{
    x: entrepreneur.riskScore,
    y: entrepreneur.portfolioRoi || 0,
    z: entrepreneur.volatility,
    name: entrepreneur.name
  }];

  // Colors for charts
  const COLORS = {
    win: '#10b981',
    loss: '#ef4444',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4'
  };

  // Risk score interpretation
  const getRiskLevel = (score: number): { level: string; color: string } => {
    if (score >= 80) return { level: 'Very High', color: 'text-red-500' };
    if (score >= 60) return { level: 'High', color: 'text-orange-500' };
    if (score >= 40) return { level: 'Moderate', color: 'text-yellow-500' };
    return { level: 'Conservative', color: 'text-green-500' };
  };

  const riskAssessment = getRiskLevel(entrepreneur.riskScore);

  return (
    <div className="space-y-3">
      {/* Investment Thesis Section */}
      {showThesis && (
        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Investment Thesis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {entrepreneur.investmentThesis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${entrepreneur.netWorth}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-${entrepreneur.portfolioRoi && entrepreneur.portfolioRoi >= 0 ? 'blue' : 'red'}-500/20 bg-${entrepreneur.portfolioRoi && entrepreneur.portfolioRoi >= 0 ? 'blue' : 'red'}-500/5`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Portfolio ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${entrepreneur.portfolioRoi && entrepreneur.portfolioRoi >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {entrepreneur.portfolioRoi && entrepreneur.portfolioRoi >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              {entrepreneur.portfolioRoi ? `${entrepreneur.portfolioRoi > 0 ? '+' : ''}${entrepreneur.portfolioRoi}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-${riskAssessment.color.includes('red') ? 'red' : riskAssessment.color.includes('orange') ? 'orange' : riskAssessment.color.includes('yellow') ? 'yellow' : 'green'}-500/20 bg-${riskAssessment.color.includes('red') ? 'red' : riskAssessment.color.includes('orange') ? 'orange' : riskAssessment.color.includes('yellow') ? 'yellow' : 'green'}-500/5`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskAssessment.color}`}>
              {entrepreneur.riskScore}/100
            </div>
            <p className={`text-xs mt-1 ${riskAssessment.color}`}>{riskAssessment.level}</p>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Tabbed Analytics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 text-[10px] md:text-sm">
          <TabsTrigger value="performance" className="px-1 md:px-3">Performance</TabsTrigger>
          <TabsTrigger value="best" className="px-1 md:px-3">Best Calls</TabsTrigger>
          <TabsTrigger value="worst" className="px-1 md:px-3">Worst Calls</TabsTrigger>
          <TabsTrigger value="activity" className="px-1 md:px-3">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Performance Chart */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Investment Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200} className="md:!h-[300px]">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="roi" 
                      name="ROI (%)"
                      fill="url(#colorGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                  No quantifiable performance data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk/Volatility Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Risk Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Risk Tolerance</span>
                    <Badge variant={entrepreneur.riskScore > 70 ? "destructive" : "default"}>
                      {entrepreneur.riskScore}/100
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        entrepreneur.riskScore > 70 ? 'bg-red-500' : 
                        entrepreneur.riskScore > 50 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${entrepreneur.riskScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Volatility Index</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market Volatility</span>
                    <Badge variant={entrepreneur.volatility > 70 ? "destructive" : "secondary"}>
                      {entrepreneur.volatility}/100
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                      style={{ width: `${entrepreneur.volatility}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Best Calls Tab */}
        <TabsContent value="best" className="space-y-4">
          <div className="grid gap-4">
            {(!entrepreneur.bestCalls || entrepreneur.bestCalls.length === 0) ? (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No notable winning investments recorded yet</p>
                </CardContent>
              </Card>
            ) : entrepreneur.bestCalls.map((call, idx) => (
              <Card key={idx} className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <h3 className="font-semibold text-lg">{call.name}</h3>
                    </div>
                    {parseROI(call.roi) !== null && (
                      <Badge className="bg-green-500 text-white font-bold text-sm">
                        +{call.roi}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                    {call.date && (
                      <div>
                        <p className="text-muted-foreground text-xs">Date</p>
                        <p className="font-medium">{call.date}</p>
                      </div>
                    )}
                    {call.entry && (
                      <div>
                        <p className="text-muted-foreground text-xs">Entry</p>
                        <p className="font-medium">{call.entry}</p>
                      </div>
                    )}
                    {call.current && (
                      <div>
                        <p className="text-muted-foreground text-xs">Current</p>
                        <p className="font-medium">{call.current}</p>
                      </div>
                    )}
                    {call.exit && (
                      <div>
                        <p className="text-muted-foreground text-xs">Exit</p>
                        <p className="font-medium">{call.exit}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {call.outcome}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Worst Calls Tab */}
        <TabsContent value="worst" className="space-y-4">
          <div className="grid gap-4">
            {(!entrepreneur.worstCalls || entrepreneur.worstCalls.length === 0) ? (
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-500/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No notable losing investments recorded yet</p>
                </CardContent>
              </Card>
            ) : entrepreneur.worstCalls.map((call, idx) => (
              <Card key={idx} className="border-red-500/20 bg-red-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <h3 className="font-semibold text-lg">{call.name}</h3>
                    </div>
                    {parseROI(call.roi) !== null && (
                      <Badge variant="destructive" className="font-bold text-sm">
                        {call.roi}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Date</p>
                      <p className="font-medium">{call.date}</p>
                    </div>
                    {(call.loss || call.cost) && (
                      <div>
                        <p className="text-muted-foreground text-xs">Impact</p>
                        <p className="font-medium text-red-600">{call.loss || call.cost}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {call.outcome}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Recent Moves & Statements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(!entrepreneur.recentActivity || entrepreneur.recentActivity.length === 0) ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-blue-500/50 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No recent activity recorded yet</p>
                  </div>
                ) : entrepreneur.recentActivity.map((activity, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/10"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-sm">{activity.action}</h4>
                        <Badge variant="outline" className="text-xs">
                          {activity.date}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {activity.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Outlook */}
          <Card className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-purple-500" />
                Market Outlook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {entrepreneur.marketOutlook}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
