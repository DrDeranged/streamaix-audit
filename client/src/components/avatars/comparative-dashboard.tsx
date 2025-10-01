import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle, X } from "lucide-react";

interface EntrepreneurData {
  id: string;
  name: string;
  category: string;
  riskScore: number;
  volatility: number;
  portfolioRoi: number;
  accuracyPercentage: number;
  netWorth: string;
  bestCalls?: any[];
  worstCalls?: any[];
}

interface ComparativeDashboardProps {
  entrepreneurs: EntrepreneurData[];
  onRemove: (id: string) => void;
}

export const ComparativeDashboard = memo(function ComparativeDashboard({ entrepreneurs, onRemove }: ComparativeDashboardProps) {
  if (entrepreneurs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Select entrepreneurs from the cards above to compare their performance
      </div>
    );
  }

  // Prepare comparison data
  const performanceData = entrepreneurs.map(e => ({
    name: e.name.split(' ')[0],
    ROI: e.portfolioRoi,
    Accuracy: e.accuracyPercentage,
    Risk: e.riskScore
  }));

  const riskReturnData = entrepreneurs.map(e => ({
    name: e.name.split(' ')[0],
    return: e.portfolioRoi,
    risk: e.riskScore
  }));

  const radarData = [
    {
      metric: 'ROI',
      ...entrepreneurs.reduce((acc, e) => ({ ...acc, [e.name.split(' ')[0]]: e.portfolioRoi }), {})
    },
    {
      metric: 'Accuracy',
      ...entrepreneurs.reduce((acc, e) => ({ ...acc, [e.name.split(' ')[0]]: e.accuracyPercentage }), {})
    },
    {
      metric: 'Risk',
      ...entrepreneurs.reduce((acc, e) => ({ ...acc, [e.name.split(' ')[0]]: 100 - e.riskScore }), {})
    },
    {
      metric: 'Volatility',
      ...entrepreneurs.reduce((acc, e) => ({ ...acc, [e.name.split(' ')[0]]: 100 - e.volatility }), {})
    }
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-4 md:space-y-6 mt-6 md:mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4">
        <h3 className="text-xl md:text-2xl font-bold text-foreground">Comparative Analysis</h3>
        <Badge variant="secondary" className="text-xs md:text-sm">
          Comparing {entrepreneurs.length} Entrepreneur{entrepreneurs.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Quick Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {entrepreneurs.map((entrepreneur, idx) => (
          <Card key={entrepreneur.id} className="relative border-2" style={{ borderColor: colors[idx % colors.length] }}>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => onRemove(entrepreneur.id)}
              data-testid={`button-remove-comparison-${entrepreneur.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{entrepreneur.name}</CardTitle>
              <Badge variant="outline" className="w-fit text-xs">{entrepreneur.category}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Portfolio ROI</span>
                <span className={`text-sm font-bold ${entrepreneur.portfolioRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {entrepreneur.portfolioRoi >= 0 ? '+' : ''}{entrepreneur.portfolioRoi}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Accuracy</span>
                <span className="text-sm font-bold text-foreground">{entrepreneur.accuracyPercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Risk Score</span>
                <span className={`text-sm font-bold ${entrepreneur.riskScore > 70 ? 'text-red-500' : entrepreneur.riskScore > 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {entrepreneur.riskScore}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Net Worth</span>
                <span className="text-sm font-bold text-foreground">{entrepreneur.netWorth}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="ROI" fill="#3b82f6" name="Portfolio ROI %" />
                <Bar dataKey="Accuracy" fill="#10b981" name="Accuracy %" />
                <Bar dataKey="Risk" fill="#f59e0b" name="Risk Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk/Return Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Multi-Dimensional Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis className="text-xs" />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {entrepreneurs.map((e, idx) => (
                  <Radar
                    key={e.id}
                    name={e.name.split(' ')[0]}
                    dataKey={e.name.split(' ')[0]}
                    stroke={colors[idx % colors.length]}
                    fill={colors[idx % colors.length]}
                    fillOpacity={0.3}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Investment Track Record Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Investment Track Record Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entrepreneurs.map((entrepreneur, idx) => (
              <div key={entrepreneur.id} className="border rounded-lg p-4" style={{ borderColor: colors[idx % colors.length] + '40' }}>
                <h4 className="font-semibold text-foreground mb-3">{entrepreneur.name}</h4>
                
                {/* Best Calls */}
                {entrepreneur.bestCalls && entrepreneur.bestCalls.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 text-xs text-green-500 font-medium mb-2">
                      <TrendingUp className="h-3 w-3" />
                      Top Call
                    </div>
                    <div className="text-sm text-foreground">
                      {entrepreneur.bestCalls[0].investment}
                    </div>
                    <div className="text-xs text-green-500 font-semibold">
                      +{entrepreneur.bestCalls[0].return} ROI
                    </div>
                  </div>
                )}

                {/* Worst Calls */}
                {entrepreneur.worstCalls && entrepreneur.worstCalls.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-red-500 font-medium mb-2">
                      <TrendingDown className="h-3 w-3" />
                      Biggest Miss
                    </div>
                    <div className="text-sm text-foreground">
                      {entrepreneur.worstCalls[0].investment}
                    </div>
                    <div className="text-xs text-red-500 font-semibold">
                      {entrepreneur.worstCalls[0].return} ROI
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-lg">Comparative Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Highest ROI</p>
                <p className="text-xs text-muted-foreground">
                  {entrepreneurs.reduce((max, e) => e.portfolioRoi > max.portfolioRoi ? e : max).name} leads with {entrepreneurs.reduce((max, e) => e.portfolioRoi > max.portfolioRoi ? e : max).portfolioRoi}% portfolio returns
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Most Accurate</p>
                <p className="text-xs text-muted-foreground">
                  {entrepreneurs.reduce((max, e) => e.accuracyPercentage > max.accuracyPercentage ? e : max).name} has the highest prediction accuracy at {entrepreneurs.reduce((max, e) => e.accuracyPercentage > max.accuracyPercentage ? e : max).accuracyPercentage}%
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Lowest Risk</p>
                <p className="text-xs text-muted-foreground">
                  {entrepreneurs.reduce((min, e) => e.riskScore < min.riskScore ? e : min).name} offers the most conservative approach with risk score of {entrepreneurs.reduce((min, e) => e.riskScore < min.riskScore ? e : min).riskScore}/100
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
