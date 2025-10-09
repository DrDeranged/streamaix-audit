import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const activityData = [
    { date: 'Mon', bounties: 12, summaries: 8, tips: 450 },
    { date: 'Tue', bounties: 19, summaries: 14, tips: 680 },
    { date: 'Wed', bounties: 15, summaries: 11, tips: 520 },
    { date: 'Thu', bounties: 22, summaries: 18, tips: 890 },
    { date: 'Fri', bounties: 28, summaries: 22, tips: 1200 },
    { date: 'Sat', bounties: 18, summaries: 15, tips: 750 },
    { date: 'Sun', bounties: 14, summaries: 9, tips: 580 },
  ];

  const categoryData = [
    { name: 'DeFi', value: 35, color: '#8b5cf6' },
    { name: 'NFT', value: 25, color: '#3b82f6' },
    { name: 'Gaming', value: 20, color: '#10b981' },
    { name: 'Layer2', value: 15, color: '#f59e0b' },
    { name: 'Infrastructure', value: 5, color: '#ef4444' },
  ];

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

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="h-10 w-10 text-purple-400" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Track platform performance and user engagement metrics
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Active Bounties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.activeBounties || 0}</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {(stats.totalRewards || 0).toLocaleString()} STREAM
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>+28% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Math.floor(Math.random() * 500) + 250}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>+18% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {bounties.filter(b => b.status === 'completed').length}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>+15% this week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="7d" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-7d">
              7 Days
            </TabsTrigger>
            <TabsTrigger value="30d" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-30d">
              30 Days
            </TabsTrigger>
            <TabsTrigger value="90d" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-90d">
              90 Days
            </TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
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
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="bounties" stroke="#8b5cf6" strokeWidth={2} />
                      <Line type="monotone" dataKey="summaries" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
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
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
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
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Engagement Metrics
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Platform engagement statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {engagementData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.metric === 'Views' && <Eye className="h-5 w-5 text-blue-400" />}
                        {item.metric === 'Tips' && <DollarSign className="h-5 w-5 text-green-400" />}
                        {item.metric === 'Comments' && <MessageSquare className="h-5 w-5 text-purple-400" />}
                        {item.metric === 'Shares' && <TrendingUp className="h-5 w-5 text-yellow-400" />}
                        <div>
                          <div className="text-sm text-gray-400">{item.metric}</div>
                          <div className="text-xl font-bold text-white">{item.value.toLocaleString()}</div>
                        </div>
                      </div>
                      <Badge className={item.change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
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
