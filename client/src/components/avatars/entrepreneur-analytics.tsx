import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Surface from "@/components/ds/Surface";
import StatValue from "@/components/ds/StatValue";
import SectionTitle from "@/components/ds/SectionTitle";
import { 
  TrendingUp, 
  Activity, 
  Target,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  BarChart3,
  LineChart,
  Clock
} from "lucide-react";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
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
    primary: '#7C5CFF'
  };

  // Risk score interpretation
  const getRiskLevel = (score: number): { level: string; color: string } => {
    if (score >= 80) return { level: 'Very High', color: 'text-loss' };
    if (score >= 60) return { level: 'High', color: 'text-warn' };
    if (score >= 40) return { level: 'Moderate', color: 'text-warn' };
    return { level: 'Conservative', color: 'text-gain' };
  };

  const riskAssessment = getRiskLevel(entrepreneur.riskScore);

  return (
    <div className="space-y-3">
      {/* Investment Thesis Section */}
      {showThesis && (
        <Surface className="p-4">
          <div className="mb-3">
            <SectionTitle as="h3" className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent-bright" />
              Investment Thesis
            </SectionTitle>
          </div>
          <div>
            <p className="text-sm leading-relaxed text-body">
              {entrepreneur.investmentThesis}
            </p>
          </div>
        </Surface>
      )}

      {/* Key Metrics Grid */}
      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Surface className="p-4">
          <div className="mb-2">
            <div className="text-sm font-medium flex items-center gap-2 text-secondary">
              <DollarSign className="h-4 w-4 text-gain" />
              Net Worth
            </div>
          </div>
          <div>
            <StatValue label="" value={`$${entrepreneur.netWorth}`} valueClassName="text-gain" />
          </div>
        </Surface>
 
        <Surface className="p-4">
          <div className="mb-2">
            <div className="text-sm font-medium flex items-center gap-2 text-secondary">
              <TrendingUp className="h-4 w-4 text-accent-bright" />
              Portfolio ROI
            </div>
          </div>
          <div>
            <StatValue
              label=""
              value={
                entrepreneur.portfolioRoi
                  ? `${entrepreneur.portfolioRoi > 0 ? '+' : ''}${entrepreneur.portfolioRoi.toFixed(2)}%`
                  : 'N/A'
              }
              valueClassName={entrepreneur.portfolioRoi && entrepreneur.portfolioRoi >= 0 ? 'text-accent-bright' : 'text-loss'}
            />
          </div>
        </Surface>

        <Surface className="p-4">
          <div className="mb-2">
            <div className="text-sm font-medium flex items-center gap-2 text-secondary">
              <AlertTriangle className="h-4 w-4 text-warn" />
              Risk Profile
            </div>
          </div>
          <div>
            <StatValue label="" value={`${entrepreneur.riskScore}/100`} valueClassName={riskAssessment.color} />
            <p className={`text-xs mt-1 ${riskAssessment.color}`}>{riskAssessment.level}</p>
          </div>
        </Surface>
        </div>
      )}

      {/* Tabbed Analytics */}
      <Tabs defaultValue="performance" className="w-full">
        <div className="-mx-1 px-1">
          <TabsList className="grid w-full grid-cols-4 text-[9px] md:text-sm gap-0 bg-ink-surface border border-ink-edge rounded-xl p-1">
            <TabsTrigger value="performance" className="px-1 md:px-3 py-1.5 md:py-2 text-[9px] md:text-sm">Perf</TabsTrigger>
            <TabsTrigger value="best" className="px-1 md:px-3 py-1.5 md:py-2 text-[9px] md:text-sm">Best</TabsTrigger>
            <TabsTrigger value="worst" className="px-1 md:px-3 py-1.5 md:py-2 text-[9px] md:text-sm">Worst</TabsTrigger>
            <TabsTrigger value="activity" className="px-1 md:px-3 py-1.5 md:py-2 text-[9px] md:text-sm">Recent</TabsTrigger>
          </TabsList>
        </div>

        {/* Performance Chart */}
        <TabsContent value="performance" className="space-y-4">
          <Surface className="p-4">
            <div className="mb-3">
              <SectionTitle as="h3" className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent-bright" />
                Investment Performance Overview
              </SectionTitle>
            </div>
            <div>
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
                        borderRadius: '12px',
                        color: '#F2F4FA'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="roi" 
                      name="ROI (%)"
                      fill={COLORS.primary}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] md:h-[300px] flex items-center justify-center text-muted">
                  No quantifiable performance data available
                </div>
              )}
            </div>
          </Surface>

          {/* Risk/Volatility Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Surface className="p-4">
              <div className="mb-3"><h3 className="text-sm font-medium text-primary">Risk Score Distribution</h3></div>
              <div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-body">Risk Tolerance</span>
                    <Badge variant={entrepreneur.riskScore > 70 ? "destructive" : "default"}>
                      {entrepreneur.riskScore}/100
                    </Badge>
                  </div>
                  <div className="w-full bg-ink-raised rounded-xl h-2">
                    <div 
                        className={`h-2 rounded-xl transition-all ${
                         entrepreneur.riskScore > 70 ? 'bg-loss' : 
                         entrepreneur.riskScore > 50 ? 'bg-warn' : 
                         'bg-gain'
                      }`}
                      style={{ width: `${entrepreneur.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </Surface>

            <Surface className="p-4">
              <div className="mb-3"><h3 className="text-sm font-medium text-primary">Volatility Index</h3></div>
              <div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-body">Market Volatility</span>
                    <Badge variant={entrepreneur.volatility > 70 ? "destructive" : "secondary"}>
                      {entrepreneur.volatility}/100
                    </Badge>
                  </div>
                  <div className="w-full bg-ink-raised rounded-xl h-2">
                    <div 
                      className="h-2 rounded-xl bg-accent-core transition-all"
                      style={{ width: `${entrepreneur.volatility}%` }}
                    />
                  </div>
                </div>
              </div>
            </Surface>
          </div>
        </TabsContent>

        {/* Best Calls Tab */}
        <TabsContent value="best" className="space-y-4">
          <div className="grid gap-4">
            {(!entrepreneur.bestCalls || entrepreneur.bestCalls.length === 0) ? (
              <Surface className="p-4 border-gain/20 bg-gain/5 text-center">
                <CheckCircle2 className="h-8 w-8 text-gain/50 mx-auto mb-3" />
                <p className="text-secondary text-sm">No notable winning investments recorded yet</p>
              </Surface>
            ) : entrepreneur.bestCalls.map((call, idx) => (
              <Surface key={idx} className="p-4 border-gain/20 bg-gain/5">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-gain flex-shrink-0" />
                      <h3 className="font-semibold text-lg">{call.name}</h3>
                    </div>
                    {parseROI(call.roi) !== null && (
                      <Badge className="bg-gain text-ink-page font-bold text-sm">
                        +{call.roi}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                    {call.date && (
                      <div>
                        <p className="text-muted text-xs">Date</p>
                        <p className="font-medium">{call.date}</p>
                      </div>
                    )}
                    {call.entry && (
                      <div>
                        <p className="text-muted text-xs">Entry</p>
                        <p className="font-medium">{call.entry}</p>
                      </div>
                    )}
                    {call.current && (
                      <div>
                        <p className="text-muted text-xs">Current</p>
                        <p className="font-medium">{call.current}</p>
                      </div>
                    )}
                    {call.exit && (
                      <div>
                        <p className="text-muted text-xs">Exit</p>
                        <p className="font-medium">{call.exit}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-body leading-relaxed">
                    {call.outcome}
                  </p>
                </div>
              </Surface>
            ))}
          </div>
        </TabsContent>

        {/* Worst Calls Tab */}
        <TabsContent value="worst" className="space-y-4">
          <div className="grid gap-4">
            {(!entrepreneur.worstCalls || entrepreneur.worstCalls.length === 0) ? (
              <Surface className="p-4 border-loss/20 bg-loss/5 text-center">
                <AlertTriangle className="h-8 w-8 text-loss/50 mx-auto mb-3" />
                <p className="text-secondary text-sm">No notable losing investments recorded yet</p>
              </Surface>
            ) : entrepreneur.worstCalls.map((call, idx) => (
              <Surface key={idx} className="p-4 border-loss/20 bg-loss/5">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-loss flex-shrink-0" />
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
                      <p className="text-muted text-xs">Date</p>
                      <p className="font-medium">{call.date}</p>
                    </div>
                    {(call.loss || call.cost) && (
                      <div>
                        <p className="text-muted text-xs">Impact</p>
                        <p className="font-medium text-loss">{call.loss || call.cost}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-body leading-relaxed">
                    {call.outcome}
                  </p>
                </div>
              </Surface>
            ))}
          </div>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Surface className="p-4">
            <div className="mb-3">
              <SectionTitle as="h3" className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent-bright" />
                Recent Moves & Statements
              </SectionTitle>
            </div>
            <div>
              <ScrollArea className="h-[240px] md:h-[320px] pr-4">
                <div className="space-y-4">
                  {(!entrepreneur.recentActivity || entrepreneur.recentActivity.length === 0) ? (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-accent-bright/50 mx-auto mb-3" />
                      <p className="text-secondary text-sm">No recent activity recorded yet</p>
                    </div>
                  ) : entrepreneur.recentActivity.map((activity, idx) => (
                    <div 
                      key={idx} 
                      className="flex gap-4 p-4 rounded-xl bg-ink-raised border border-ink-divider"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-accent-core/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-accent-bright" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-sm">{activity.action}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.date}
                          </Badge>
                        </div>
                        <p className="text-sm text-body leading-relaxed">
                          {activity.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Surface>

          {/* Market Outlook */}
          <Surface className="p-4">
            <div className="mb-3">
              <SectionTitle as="h3" className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-accent-bright" />
                Market Outlook
              </SectionTitle>
            </div>
            <div>
              <p className="text-sm leading-relaxed text-body">
                {entrepreneur.marketOutlook}
              </p>
            </div>
          </Surface>
        </TabsContent>
      </Tabs>
    </div>
  );
}
