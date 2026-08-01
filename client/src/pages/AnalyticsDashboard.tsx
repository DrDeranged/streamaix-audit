import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/landing/navigation';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Activity,
  Zap,
  Eye,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
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
  Cell,
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

  const COLORS = ['#8B7CF6', '#3DD68C', '#FF7B7B', '#FFB454', '#A99DF8'];

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
    color: COLORS[idx % COLORS.length],
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
    <div className="min-h-[100dvh] bg-ink-page">
      <Navigation />
      <div className="mx-auto max-w-7xl space-y-8 px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Performance · engagement"
          title="Analytics Dashboard"
          icon={<BarChart3 className="h-5 w-5" />}
          subtitle="Track platform performance and user engagement metrics."
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Surface className="p-5">
            <StatValue
              label={<span className="flex items-center gap-2"><Target className="h-4 w-4 text-accent-bright" />Active Bounties</span>}
              value={stats.activeBounties || 0}
              delta={stats.changes?.bounties || 0}
              deltaSuffix="% this week"
            />
          </Surface>

          <Surface className="p-5">
            <StatValue
              label={<span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-accent-bright" />Total Rewards</span>}
              value={`${(stats.totalRewards || 0).toLocaleString()} STREAM`}
              delta={stats.changes?.rewards || 0}
              deltaSuffix="% this week"
            />
          </Surface>

          <Surface className="p-5">
            <StatValue
              label={<span className="flex items-center gap-2"><Users className="h-4 w-4 text-accent-bright" />Active Users</span>}
              value={stats.activeUsers || 0}
              delta={stats.changes?.users || 0}
              deltaSuffix="% this week"
            />
          </Surface>

          <Surface className="p-5">
            <StatValue
              label={<span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-accent-bright" />Completed</span>}
              value={stats.completedBounties || 0}
              delta={stats.changes?.completed || 0}
              deltaSuffix="% this week"
            />
          </Surface>
        </div>

        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full">
          <TabsList className="border border-ink-edge bg-ink-surface">
            <TabsTrigger value="7d" className="data-[state=active]:bg-accent-core data-[state=active]:text-white" data-testid="tab-7d">
              7 Days
            </TabsTrigger>
            <TabsTrigger value="30d" className="data-[state=active]:bg-accent-core data-[state=active]:text-white" data-testid="tab-30d">
              30 Days
            </TabsTrigger>
            <TabsTrigger value="90d" className="data-[state=active]:bg-accent-core data-[state=active]:text-white" data-testid="tab-90d">
              90 Days
            </TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Surface className="p-5">
                <div className="mb-5">
                  <SectionTitle as="h2" className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-accent-bright" />
                    Activity Trends
                  </SectionTitle>
                  <p className="mt-1 text-sm text-secondary">Daily bounties, summaries, and tips over time</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232B45" />
                    <XAxis dataKey="date" stroke="#9BA3B7" />
                    <YAxis stroke="#9BA3B7" />
                    <Tooltip contentStyle={{ backgroundColor: '#10162A', border: '1px solid #232B45', borderRadius: '12px', color: '#C9CEDC' }} />
                    <Legend />
                    <Line type="monotone" dataKey="bounties" stroke="#8B7CF6" strokeWidth={2} />
                    <Line type="monotone" dataKey="summaries" stroke="#3DD68C" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Surface>

              <Surface className="p-5">
                <div className="mb-5">
                  <SectionTitle as="h2" className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent-bright" />
                    Category Distribution
                  </SectionTitle>
                  <p className="mt-1 text-sm text-secondary">Bounty categories breakdown</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8B7CF6" dataKey="value">
                      {categoryData.map((entry: unknown, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#10162A', border: '1px solid #232B45', borderRadius: '12px', color: '#C9CEDC' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Surface>

              <Surface className="p-5">
                <div className="mb-5">
                  <SectionTitle as="h2" className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-accent-bright" />
                    Reward Distribution
                  </SectionTitle>
                  <p className="mt-1 text-sm text-secondary">Bounty rewards by range</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rewardDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232B45" />
                    <XAxis dataKey="range" stroke="#9BA3B7" />
                    <YAxis stroke="#9BA3B7" />
                    <Tooltip contentStyle={{ backgroundColor: '#10162A', border: '1px solid #232B45', borderRadius: '12px', color: '#C9CEDC' }} />
                    <Bar dataKey="count" fill="#8B7CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </Surface>

              <Surface className="p-5">
                <div className="mb-5">
                  <SectionTitle as="h2" className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-accent-bright" />
                    Engagement Metrics
                  </SectionTitle>
                  <p className="mt-1 text-sm text-secondary">Platform engagement statistics</p>
                </div>
                <div className="space-y-2">
                  {engagementData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between rounded-xl border border-ink-divider bg-ink-raised p-3">
                      <div className="flex items-center gap-3">
                        {item.metric === 'Views' && <Eye className="h-5 w-5 text-accent-bright" />}
                        {item.metric === 'Tips' && <DollarSign className="h-5 w-5 text-gain" />}
                        {item.metric === 'Comments' && <MessageSquare className="h-5 w-5 text-accent-bright" />}
                        {item.metric === 'Shares' && <TrendingUp className="h-5 w-5 text-accent-bright" />}
                        <div>
                          <div className="text-sm text-secondary">{item.metric}</div>
                          <div className="tabular text-xl font-semibold text-primary">{item.value.toLocaleString()}</div>
                        </div>
                      </div>
                      <Badge className={item.change > 0 ? 'border border-gain/30 bg-gain/10 text-gain' : 'border border-loss/30 bg-loss/10 text-loss'}>
                        {item.change > 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}