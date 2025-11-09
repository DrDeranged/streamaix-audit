import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Send, Eye, Mail, Calendar, CheckCircle, XCircle, ShieldAlert,
  Users, FileText, Target, TrendingUp, Activity, ChevronDown, ChevronUp,
  LayoutDashboard, BarChart3, UserPlus, Award, Zap, Home
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const ADMIN_USERNAMES = ['arslan'];

export default function NewsletterAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState('');
  const [, setLocation] = useLocation();
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  // Fetch current user
  const { user, isLoading: userLoading } = useAuth();

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!userLoading && user) {
      const isAdmin = ADMIN_USERNAMES.includes(user.username);
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive"
        });
        setLocation('/dashboard');
      }
    }
  }, [user, userLoading, setLocation, toast]);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch admin activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/admin/activity'],
  });

  // Fetch newsletter status
  const { data: status } = useQuery({
    queryKey: ['/api/newsletter/status'],
    refetchInterval: 30000
  });

  // Fetch newsletter history
  const { data: history } = useQuery({
    queryKey: ['/api/newsletter/history'],
  });

  // Send test newsletter mutation
  const sendTestMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('/api/newsletter/test', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test newsletter",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test newsletter",
        variant: "destructive"
      });
    }
  });

  // Send newsletter to all mutation
  const sendAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/newsletter/send', {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Newsletter Sent",
        description: `Sent to ${data.sentCount} subscribers`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/newsletter/history'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send newsletter",
        variant: "destructive"
      });
    }
  });

  const handleSendTest = () => {
    if (testEmail) {
      sendTestMutation.mutate(testEmail);
    }
  };

  const handleSendAll = () => {
    if (window.confirm('Send newsletter to ALL subscribers? This action cannot be undone.')) {
      sendAllMutation.mutate();
    }
  };

  // Show loading while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Checking permissions...</span>
        </div>
      </div>
    );
  }

  // Show unauthorized if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="neural-glass border-red-500/20 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-6 h-6" />
              Authentication Required
            </CardTitle>
            <CardDescription>Please log in to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation('/auth')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show unauthorized if not admin
  const isAdmin = ADMIN_USERNAMES.includes(user.username);
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <Card className="neural-glass border-red-500/20 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-6 h-6" />
              Access Denied
            </CardTitle>
            <CardDescription>This page is restricted to administrators only</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation('/dashboard')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activities = activityData?.activities || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400">Platform analytics and newsletter management</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="border-purple-500/40 hover:border-purple-400/60 hover:bg-purple-500/10 text-purple-200 font-semibold"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Platform Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="neural-glass border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                {statsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{stats?.stats?.totalUsers || 0}</div>
                    <div className="text-xs text-green-400">+{stats?.stats?.newUsers24h || 0} today</div>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Total Users</h3>
            </CardContent>
          </Card>

          <Card className="neural-glass border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                {statsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{stats?.stats?.totalSummaries || 0}</div>
                    <div className="text-xs text-green-400">+{stats?.stats?.summariesCreated24h || 0} today</div>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-300">AI Summaries</h3>
            </CardContent>
          </Card>

          <Card className="neural-glass border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Target className="w-6 h-6 text-amber-400" />
                </div>
                {statsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{stats?.stats?.totalBounties || 0}</div>
                    <div className="text-xs text-green-400">+{stats?.stats?.bountiesCreated24h || 0} today</div>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Bounties</h3>
            </CardContent>
          </Card>

          <Card className="neural-glass border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                {statsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{stats?.stats?.totalMarkets || 0}</div>
                    <div className="text-xs text-green-400">+{stats?.stats?.marketsCreated24h || 0} today</div>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Prediction Markets</h3>
            </CardContent>
          </Card>
        </div>

        {/* Trading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="neural-glass border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : (stats?.stats?.totalTrades || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">Total Trades</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neural-glass border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <Zap className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : ((stats?.stats?.totalVolume || 0) / 1e18).toFixed(2)} STREAM
                  </div>
                  <div className="text-sm text-slate-400">Trading Volume</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neural-glass border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Activity className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : stats?.stats?.activeUsers24h || 0}
                  </div>
                  <div className="text-sm text-slate-400">Active Users (24h)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <Card className="neural-glass border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Recent Platform Activity
            </CardTitle>
            <CardDescription>Latest actions across all features</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {activities.map((activity: any, index: number) => {
                  const Icon = activity.type === 'user' ? UserPlus :
                               activity.type === 'summary' ? FileText :
                               activity.type === 'bounty' ? Target :
                               activity.type === 'market' ? TrendingUp : Activity;
                  
                  const iconColor = activity.type === 'user' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                   activity.type === 'summary' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                                   activity.type === 'bounty' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

                  return (
                    <div
                      key={`${activity.type}-${activity.id}-${index}`}
                      className="p-4 rounded-lg bg-slate-900/50 border border-purple-500/10 flex items-start gap-4 hover:bg-slate-900/70 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${iconColor} mt-1`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{activity.title}</h4>
                            <p className="text-sm text-slate-300 truncate">{activity.description}</p>
                            {activity.username && (
                              <p className="text-xs text-slate-500 mt-1">by @{activity.username}</p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Newsletter Section (Collapsible) */}
        <Collapsible open={newsletterOpen} onOpenChange={setNewsletterOpen}>
          <Card className="neural-glass gradient-border-hot overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 glow-pulse">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Newsletter Management
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Automated crypto newsletters & manual controls
                      </CardDescription>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    {newsletterOpen ? (
                      <ChevronUp className="w-5 h-5 text-purple-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-8 pt-6 pb-8">
                {/* Scheduler Status - Redesigned */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-900/40 border border-purple-500/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5" />
                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                          <Calendar className="w-5 h-5 text-purple-300" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">Automated Scheduler</h3>
                          <p className="text-sm text-purple-200">Every Monday & Friday at 8am EST</p>
                        </div>
                      </div>
                      {status?.isRunning && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 glow-pulse" />
                          <span className="text-sm font-semibold text-emerald-300">LIVE</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Status Badge */}
                      <div className="relative group">
                        <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          status?.isRunning 
                            ? 'bg-gradient-to-br from-emerald-900/40 to-green-900/30 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                            : 'bg-gradient-to-br from-red-900/40 to-orange-900/30 border-red-500/50'
                        }`}>
                          <div className="flex items-center gap-3 mb-2">
                            {status?.isRunning ? (
                              <CheckCircle className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-400" />
                            )}
                            <span className="font-bold text-white text-lg">
                              {status?.isRunning ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 uppercase tracking-wide">Scheduler Status</p>
                        </div>
                      </div>

                      {/* Next Monday */}
                      <div className="relative group">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/40 to-indigo-900/30 border-2 border-blue-500/50 transition-all duration-300 hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-500/20">
                          <div className="font-bold text-white text-base mb-2">
                            {status?.nextMonday || 'Loading...'}
                          </div>
                          <p className="text-xs text-blue-200 uppercase tracking-wide mb-3">Next Monday Send</p>
                          <Button
                            variant="outline"
                            onClick={() => window.open('/api/newsletter/preview', '_blank')}
                            className="w-full h-8 text-xs border border-blue-500/40 hover:border-blue-400/60 hover:bg-blue-500/10 text-blue-200 font-semibold rounded-lg transition-all duration-300"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>

                      {/* Next Friday */}
                      <div className="relative group">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-900/40 to-teal-900/30 border-2 border-cyan-500/50 transition-all duration-300 hover:border-cyan-400/70 hover:shadow-lg hover:shadow-cyan-500/20">
                          <div className="font-bold text-white text-base mb-2">
                            {status?.nextFriday || 'Loading...'}
                          </div>
                          <p className="text-xs text-cyan-200 uppercase tracking-wide mb-3">Next Friday Send</p>
                          <Button
                            variant="outline"
                            onClick={() => window.open('/api/newsletter/preview', '_blank')}
                            className="w-full h-8 text-xs border border-cyan-500/40 hover:border-cyan-400/60 hover:bg-cyan-500/10 text-cyan-200 font-semibold rounded-lg transition-all duration-300"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions - Redesigned */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Test Newsletter - Vibrant Design */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-900/60 via-indigo-900/50 to-purple-900/60 border-2 border-purple-500/40 backdrop-blur-sm space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/30">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">Test Newsletter</h3>
                          <p className="text-sm text-purple-200">Preview before sending</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="test-email" className="text-purple-200 font-semibold">Email Address</Label>
                        <div className="relative">
                          <Input
                            id="test-email"
                            type="email"
                            placeholder="your@email.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="bg-slate-950/50 border-2 border-purple-500/30 focus:border-purple-400/60 text-white placeholder:text-slate-500 h-12 text-base rounded-xl transition-all duration-300"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Button
                          onClick={handleSendTest}
                          disabled={!testEmail || sendTestMutation.isPending}
                          className="w-full h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-base rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendTestMutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Sending Test...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Send Test Email
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/api/newsletter/preview', '_blank')}
                          className="w-full h-11 border-2 border-purple-500/40 hover:border-purple-400/60 hover:bg-purple-500/10 text-purple-200 font-semibold rounded-xl transition-all duration-300"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Preview in Browser
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Send to All - Bold Warning Design */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 to-orange-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-rose-900/60 via-orange-900/50 to-rose-900/60 border-2 border-rose-500/40 backdrop-blur-sm space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-rose-600 to-orange-600 shadow-lg shadow-rose-500/30 animate-pulse">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">Broadcast Newsletter</h3>
                          <p className="text-sm text-rose-200">Send to all subscribers</p>
                        </div>
                      </div>
                      
                      {/* Warning Banner */}
                      <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-900/40 to-orange-900/40 p-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 animate-pulse" />
                        <div className="relative flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 mt-0.5">
                            <ShieldAlert className="w-5 h-5 text-amber-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-amber-200 mb-1">Critical Action</p>
                            <p className="text-xs text-amber-300/90 leading-relaxed">
                              This will immediately send the newsletter to ALL subscribed waitlist members. This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleSendAll}
                        disabled={sendAllMutation.isPending}
                        className="w-full h-14 bg-gradient-to-r from-rose-600 via-orange-600 to-rose-600 hover:from-rose-500 hover:via-orange-500 hover:to-rose-500 text-white font-bold text-base rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-rose-400/30"
                      >
                        {sendAllMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Broadcasting...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send to All Subscribers
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Newsletter History - Timeline Design */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/60 to-indigo-950/40 border-2 border-indigo-500/30 p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
                  <div className="relative space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
                          <Calendar className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">Send History</h3>
                          <p className="text-sm text-indigo-200">Recent newsletter broadcasts</p>
                        </div>
                      </div>
                      {history?.newsletters?.length > 0 && (
                        <div className="px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                          <span className="text-sm font-semibold text-indigo-300">
                            {history.newsletters.length} Total
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {history?.newsletters?.length > 0 ? (
                      <div className="space-y-3">
                        {history.newsletters.slice(0, 5).map((newsletter: any, index: number) => (
                          <div
                            key={newsletter.id}
                            className="group relative"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 to-purple-500/50" />
                            <div className="pl-6 relative">
                              <div className="absolute left-[-4px] top-3 w-2 h-2 rounded-full bg-indigo-400 border-2 border-indigo-900 group-hover:scale-150 group-hover:bg-indigo-300 transition-all duration-300" />
                              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <h4 className="font-bold text-white text-base truncate">
                                        {newsletter.subject}
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="text-sm text-indigo-200 font-semibold">
                                          {newsletter.recipientCount} recipients
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-xs text-slate-400">
                                          {new Date(newsletter.sentAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                      <span className="text-xs font-bold text-emerald-300">SUCCESS</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                          <Mail className="w-8 h-8 text-indigo-400" />
                        </div>
                        <p className="text-lg font-semibold text-slate-300 mb-1">No newsletters sent yet</p>
                        <p className="text-sm text-slate-500">Your send history will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
