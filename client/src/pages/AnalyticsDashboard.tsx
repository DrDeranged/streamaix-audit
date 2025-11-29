import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/landing/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Activity,
  Award,
  Zap,
  Eye,
  Heart,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Trophy
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('7d');

  const { data: bountiesData } = useQuery<{ bounties: any[] }>({
    queryKey: ['/api/bounties'],
  });

  const { data: summariesData } = useQuery<{ summaries: any[] }>({
    queryKey: ['/api/summaries'],
  });

  const { data: statsData } = useQuery<{ stats: any }>({
    queryKey: ['/api/bounties/stats'],
  });

  const bounties = bountiesData?.bounties || [];
  const summaries = summariesData?.summaries || [];
  const stats = statsData?.stats || {};
  
  const COLORS = ['#a78bfa', '#e879f9', '#22d3ee', '#c084fc', '#d946ef'];

  // Use real activity data from API, or fallback to empty
  const activityData = stats.activityData || [
    { date: 'Mon', bounties: 0, summaries: 0, tips: 0 },
    { date: 'Tue', bounties: 0, summaries: 0, tips: 0 },
    { date: 'Wed', bounties: 0, summaries: 0, tips: 0 },
    { date: 'Thu', bounties: 0, summaries: 0, tips: 0 },
    { date: 'Fri', bounties: 0, summaries: 0, tips: 0 },
    { date: 'Sat', bounties: 0, summaries: 0, tips: 0 },
    { date: 'Sun', bounties: 0, summaries: 0, tips: 0 },
  ];

  // Use real category distribution from API
  const categoryData = (stats.categoryDistribution || []).map((cat: any, idx: number) => ({
    name: cat.name,
    value: cat.value,
    color: COLORS[idx % COLORS.length]
  }));

  const rewardDistribution = [
    { range: '0-500', count: 15 },
    { range: '500-1000', count: 25 },
    { range: '1000-2000', count: 18 },
    { range: '2000-5000', count: 12 },
    { range: '5000+', count: 5 },
  ];

  const engagementData = [
    { metric: 'Views', value: 12450, change: 12.5 },
    { metric: 'Tips', value: 3280, change: 8.3 },
    { metric: 'Comments', value: 1890, change: -2.1 },
    { metric: 'Shares', value: 945, change: 15.7 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navigation />
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <BarChart3 className="h-10 w-10 text-purple-400" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Track platform performance and user engagement metrics
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-400" />
                Active Bounties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">{stats.activeBounties || 0}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 ${(stats.changes?.bounties || 0) >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                {(stats.changes?.bounties || 0) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{(stats.changes?.bounties || 0) >= 0 ? '+' : ''}{stats.changes?.bounties || 0}% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-fuchsia-400" />
                Total Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                {(stats.totalRewards || 0).toLocaleString()} STREAM
              </div>
              <div className={`flex items-center gap-1 text-xs mt-1 ${(stats.changes?.rewards || 0) >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                {(stats.changes?.rewards || 0) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{(stats.changes?.rewards || 0) >= 0 ? '+' : ''}{stats.changes?.rewards || 0}% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {stats.activeUsers || 0}
              </div>
              <div className={`flex items-center gap-1 text-xs mt-1 ${(stats.changes?.users || 0) >= 0 ? 'text-fuchsia-400' : 'text-red-400'}`}>
                {(stats.changes?.users || 0) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{(stats.changes?.users || 0) >= 0 ? '+' : ''}{stats.changes?.users || 0}% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-purple-400" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                {stats.completedBounties || 0}
              </div>
              <div className={`flex items-center gap-1 text-xs mt-1 ${(stats.changes?.completed || 0) >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                {(stats.changes?.completed || 0) >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{(stats.changes?.completed || 0) >= 0 ? '+' : ''}{stats.changes?.completed || 0}% this week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full">
          <TabsList className="bg-purple-900/20 border border-purple-500/30">
            <TabsTrigger value="7d" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white" data-testid="tab-7d">
              7 Days
            </TabsTrigger>
            <TabsTrigger value="30d" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white" data-testid="tab-30d">
              30 Days
            </TabsTrigger>
            <TabsTrigger value="90d" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white" data-testid="tab-90d">
              90 Days
            </TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-400" />
                    Activity Trends
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Daily bounties, summaries, and tips over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #a78bfa',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="bounties" stroke="#a78bfa" strokeWidth={2} />
                      <Line type="monotone" dataKey="summaries" stroke="#e879f9" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Target className="h-5 w-5 text-fuchsia-400" />
                    Category Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Bounty categories breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #e879f9',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-cyan-400" />
                    Reward Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Bounty rewards by range
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rewardDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="range" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #22d3ee',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="url(#purpleGradient)" />
                      <defs>
                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#e879f9" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Zap className="h-5 w-5 text-fuchsia-400" />
                    Engagement Metrics
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Platform engagement statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {engagementData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-3">
                        {item.metric === 'Views' && <Eye className="h-5 w-5 text-purple-400" />}
                        {item.metric === 'Tips' && <DollarSign className="h-5 w-5 text-fuchsia-400" />}
                        {item.metric === 'Comments' && <MessageSquare className="h-5 w-5 text-cyan-400" />}
                        {item.metric === 'Shares' && <TrendingUp className="h-5 w-5 text-purple-400" />}
                        <div>
                          <div className="text-sm text-gray-400">{item.metric}</div>
                          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">{item.value.toLocaleString()}</div>
                        </div>
                      </div>
                      <Badge className={item.change > 0 ? 'bg-purple-500/20 text-purple-400 border-purple-400/30' : 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-400/30'}>
                        {item.change > 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(item.change)}%
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
