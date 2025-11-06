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
  LayoutDashboard, BarChart3, UserPlus, Award, Zap
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
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Platform analytics and newsletter management</p>
          </div>
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
          <Card className="neural-glass border-purple-500/20">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-purple-500/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <CardTitle>Newsletter Management</CardTitle>
                  </div>
                  {newsletterOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <CardDescription>Automated crypto newsletters & manual controls</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-6">
                {/* Scheduler Status */}
                <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Scheduler Status</h3>
                  </div>
                  <div className="text-sm text-slate-400 mb-4">Automated sends every Monday & Friday at 8am EST</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        {status?.isRunning ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="font-semibold text-white text-sm">
                          {status?.isRunning ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Scheduler Status</p>
                    </div>

                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="font-semibold text-white text-sm mb-1">
                        {status?.nextMonday || 'Loading...'}
                      </div>
                      <p className="text-xs text-slate-400">Next Monday Send</p>
                    </div>

                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="font-semibold text-white text-sm mb-1">
                        {status?.nextFriday || 'Loading...'}
                      </div>
                      <p className="text-xs text-slate-400">Next Friday Send</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Test Newsletter */}
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-purple-500/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white">Test Newsletter</h3>
                    </div>
                    <p className="text-sm text-slate-400">Send a test newsletter to your email</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="test-email" className="text-slate-300">Test Email Address</Label>
                      <Input
                        id="test-email"
                        type="email"
                        placeholder="your@email.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="bg-slate-900/50 border-purple-500/20"
                      />
                    </div>
                    <Button
                      onClick={handleSendTest}
                      disabled={!testEmail || sendTestMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {sendTestMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Test
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('/api/newsletter/preview', '_blank')}
                      className="w-full border-purple-500/20 hover:bg-purple-500/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview in Browser
                    </Button>
                  </div>

                  {/* Send to All */}
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-purple-500/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-white">Send to Waitlist</h3>
                    </div>
                    <p className="text-sm text-slate-400">Manually trigger newsletter send to all subscribers</p>
                    
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-200">
                        ⚠️ This will send emails to ALL subscribed waitlist members. Use with caution!
                      </p>
                    </div>
                    <Button
                      onClick={handleSendAll}
                      disabled={sendAllMutation.isPending}
                      variant="destructive"
                      className="w-full"
                    >
                      {sendAllMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending to All...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send to All Subscribers
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Newsletter History */}
                <div className="p-4 rounded-lg bg-slate-900/50 border border-purple-500/10">
                  <h3 className="font-semibold text-white mb-2">Send History</h3>
                  <p className="text-sm text-slate-400 mb-4">Recent newsletter sends</p>
                  
                  {history?.newsletters?.length > 0 ? (
                    <div className="space-y-2">
                      {history.newsletters.slice(0, 5).map((newsletter: any) => (
                        <div
                          key={newsletter.id}
                          className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-semibold text-white text-sm">{newsletter.subject}</div>
                            <div className="text-xs text-slate-400">
                              Sent to {newsletter.recipientCount} recipients
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(newsletter.sentAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 py-4">No newsletters sent yet</p>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
