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
  LayoutDashboard, BarChart3, UserPlus, Award, Zap, Home, Bot, Brain,
  Droplet, Sparkles, Shield, DollarSign, ArrowRightLeft, AlertTriangle,
  Wallet, Coins, ExternalLink, Copy, RefreshCw
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { web3Manager, formatAddress } from '@/lib/web3';
import { contractManager, formatTokenAmount, parseTokenAmount } from '@/lib/contracts';

const ADMIN_USERNAMES = ['arslan'];

export default function NewsletterAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState('');
  const [, setLocation] = useLocation();
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [chainId, setChainId] = useState(0);
  const [streamBalance, setStreamBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [distributionAmount, setDistributionAmount] = useState('1000');

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

  // Fetch autonomous systems status with 10-second auto-refresh
  const { data: systemsData, isLoading: systemsLoading } = useQuery({
    queryKey: ['/api/admin/systems/status'],
    refetchInterval: 10000 // Refresh every 10 seconds
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

  // Web3 wallet connection
  const handleConnectWallet = async () => {
    try {
      const wallet = await web3Manager.connectMetaMask();
      setWalletConnected(true);
      setWalletAddress(wallet.address);
      setChainId(wallet.chainId);
      
      if (wallet.chainId !== 84532 && wallet.chainId !== 8453) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Base Sepolia or Base Mainnet",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${formatAddress(wallet.address)}`,
        });
        await loadContractData(wallet.address);
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadContractData = async (address: string) => {
    try {
      const balance = await contractManager.getStreamBalance(address);
      setStreamBalance(balance);
      
      const supply = await (await contractManager.getStreamTokenContract()).totalSupply();
      setTotalSupply(supply.toString());
    } catch (error: any) {
      console.error('Failed to load contract data:', error);
    }
  };

  const handleDisconnectWallet = () => {
    web3Manager.disconnect();
    setWalletConnected(false);
    setWalletAddress('');
    setChainId(0);
    setStreamBalance('0');
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from wallet",
    });
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  // Fetch AI agents for token distribution
  const { data: aiAgents } = useQuery({
    queryKey: ['/api/users/ai-agents'],
    enabled: walletConnected,
  });

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
            onClick={() => setLocation('/')}
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

        {/* Autonomous Systems Monitoring Section (Collapsible) */}
        <Collapsible open={systemsOpen} onOpenChange={setSystemsOpen}>
          <Card className="neural-glass gradient-border-hot overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 glow-pulse">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Autonomous Systems
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Real-time monitoring of all 10 AI agents and systems
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {systemsData?.platformMetrics && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-sm font-semibold text-cyan-300">
                          {systemsData.platformMetrics.activeSystems}/{systemsData.platformMetrics.totalSystems} Active
                        </span>
                      </div>
                    )}
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      {systemsOpen ? (
                        <ChevronUp className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-6 pb-8">
                {systemsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  </div>
                ) : systemsData?.systems ? (
                  <>
                    {/* Platform Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/40 to-green-900/30 border-2 border-emerald-500/50">
                        <div className="text-2xl font-bold text-white mb-1">
                          {systemsData.platformMetrics.activeSystems}
                        </div>
                        <div className="text-xs text-emerald-200 uppercase tracking-wide">Active Systems</div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/40 to-orange-900/30 border-2 border-amber-500/50">
                        <div className="text-2xl font-bold text-white mb-1">
                          {systemsData.platformMetrics.warningSystems}
                        </div>
                        <div className="text-xs text-amber-200 uppercase tracking-wide">Warning</div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-red-900/40 to-rose-900/30 border-2 border-red-500/50">
                        <div className="text-2xl font-bold text-white mb-1">
                          {systemsData.platformMetrics.errorSystems}
                        </div>
                        <div className="text-xs text-red-200 uppercase tracking-wide">Errors</div>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/40 to-indigo-900/30 border-2 border-blue-500/50">
                        <div className="text-2xl font-bold text-white mb-1">
                          {systemsData.platformMetrics.overallSuccessRate}%
                        </div>
                        <div className="text-xs text-blue-200 uppercase tracking-wide">Success Rate</div>
                      </div>
                    </div>

                    {/* Systems Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {systemsData.systems.map((system: any) => {
                        // Icon mapping for each system
                        const getSystemIcon = (key: string) => {
                          const iconMap: any = {
                            'social_agents': Users,
                            'trading_bots': TrendingUp,
                            'market_resolver': Target,
                            'liquidity_provider': Droplet,
                            'trend_spotter': Sparkles,
                            'content_moderator': Shield,
                            'community_manager': Brain,
                            'treasury_manager': DollarSign,
                            'meta_trader': ArrowRightLeft,
                            'newsletter': Mail,
                          };
                          return iconMap[key] || Bot;
                        };

                        const Icon = getSystemIcon(system.key);
                        
                        // Status styling
                        const statusStyles = {
                          active: {
                            bg: 'bg-gradient-to-br from-emerald-900/40 to-green-900/30',
                            border: 'border-emerald-500/50',
                            badge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
                            icon: 'text-emerald-400',
                            glow: 'shadow-emerald-500/20'
                          },
                          warning: {
                            bg: 'bg-gradient-to-br from-amber-900/40 to-orange-900/30',
                            border: 'border-amber-500/50',
                            badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
                            icon: 'text-amber-400',
                            glow: 'shadow-amber-500/20'
                          },
                          error: {
                            bg: 'bg-gradient-to-br from-red-900/40 to-rose-900/30',
                            border: 'border-red-500/50',
                            badge: 'bg-red-500/20 border-red-500/40 text-red-300',
                            icon: 'text-red-400',
                            glow: 'shadow-red-500/20'
                          },
                          idle: {
                            bg: 'bg-gradient-to-br from-slate-900/40 to-gray-900/30',
                            border: 'border-slate-500/50',
                            badge: 'bg-slate-500/20 border-slate-500/40 text-slate-300',
                            icon: 'text-slate-400',
                            glow: 'shadow-slate-500/20'
                          }
                        };

                        const style = statusStyles[system.status as keyof typeof statusStyles] || statusStyles.idle;

                        return (
                          <Card 
                            key={system.key}
                            className={`neural-glass ${style.bg} border-2 ${style.border} hover:${style.glow} transition-all duration-300`}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50`}>
                                    <Icon className={`w-5 h-5 ${style.icon}`} />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white text-sm mb-1">{system.name}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">{system.description}</p>
                                  </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full ${style.badge} border text-xs font-semibold uppercase tracking-wide`}>
                                  {system.status}
                                </div>
                              </div>

                              {/* Metrics */}
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                  <div className="text-lg font-bold text-white">
                                    {system.metrics.actionsPerHour}
                                  </div>
                                  <div className="text-xs text-slate-400">Actions/hr</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                  <div className="text-lg font-bold text-white">
                                    {system.metrics.successRate}%
                                  </div>
                                  <div className="text-xs text-slate-400">Success</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                  <div className="text-lg font-bold text-white">
                                    {system.metrics.errorCount}
                                  </div>
                                  <div className="text-xs text-slate-400">Errors</div>
                                </div>
                              </div>

                              {/* Recent Activity */}
                              {system.recentActions && system.recentActions.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                                      Recent Activity
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                                    {system.recentActions.slice(0, 3).map((action: any, idx: number) => (
                                      <div 
                                        key={`${system.key}-${action.id}-${idx}`}
                                        className="p-2 rounded-lg bg-slate-900/30 border border-slate-700/20 text-xs"
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-slate-300 font-medium">
                                            {action.actionType || 'Action'}
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                            action.status === 'success' 
                                              ? 'bg-emerald-500/20 text-emerald-300'
                                              : 'bg-red-500/20 text-red-300'
                                          }`}>
                                            {action.status}
                                          </span>
                                        </div>
                                        {action.createdAt && (
                                          <div className="text-[10px] text-slate-500">
                                            {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Last Run Time */}
                              {system.lastRunTime && (
                                <div className="mt-3 pt-3 border-t border-slate-700/30 text-xs text-slate-500">
                                  Last run: {formatDistanceToNow(new Date(system.lastRunTime), { addSuffix: true })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <p className="text-slate-400">No autonomous systems data available</p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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

        {/* Smart Contract Management Section (Collapsible) */}
        <Collapsible open={contractsOpen} onOpenChange={setContractsOpen}>
          <Card className="neural-glass gradient-border-hot overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 glow-pulse">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Smart Contract Management
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Manage STREAM tokens and Base network contracts
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {walletConnected && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-sm font-semibold text-purple-300">
                          Connected
                        </span>
                      </div>
                    )}
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      {contractsOpen ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-6 pb-8">
                {/* Wallet Connection */}
                {!walletConnected ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="p-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 mb-6">
                      <Wallet className="w-12 h-12 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                    <p className="text-slate-400 text-center mb-6 max-w-md">
                      Connect to Base Sepolia testnet to manage smart contracts and distribute STREAM tokens to AI agents
                    </p>
                    <Button
                      onClick={handleConnectWallet}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-6 text-lg"
                      data-testid="button-connect-wallet"
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect MetaMask
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Wallet Info */}
                    <div className="p-6 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/30 border-2 border-purple-500/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-purple-400" />
                          Connected Wallet
                        </h3>
                        <Button
                          onClick={handleDisconnectWallet}
                          variant="outline"
                          size="sm"
                          className="border-red-500/40 hover:border-red-400/60 hover:bg-red-500/10 text-red-300"
                          data-testid="button-disconnect-wallet"
                        >
                          Disconnect
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                          <span className="text-sm text-slate-400">Address</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-purple-300 font-mono">{formatAddress(walletAddress)}</code>
                            <Button
                              onClick={() => handleCopyAddress(walletAddress)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              data-testid="button-copy-address"
                            >
                              <Copy className="w-3 h-3 text-slate-400 hover:text-white" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                          <span className="text-sm text-slate-400">Network</span>
                          <span className="text-sm text-purple-300 font-semibold">
                            {chainId === 84532 ? 'Base Sepolia' : chainId === 8453 ? 'Base Mainnet' : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                          <span className="text-sm text-slate-400">STREAM Balance</span>
                          <span className="text-sm text-purple-300 font-semibold">
                            {formatTokenAmount(streamBalance)} STREAM
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contract Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-900/40 to-violet-900/30 border-2 border-purple-500/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Coins className="w-5 h-5 text-purple-400" />
                          <h4 className="font-semibold text-white">Total Supply</h4>
                        </div>
                        <div className="text-3xl font-bold text-purple-300">
                          {formatTokenAmount(totalSupply)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">STREAM tokens</div>
                      </div>
                      
                      <div className="p-6 rounded-xl bg-gradient-to-br from-pink-900/40 to-rose-900/30 border-2 border-pink-500/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-5 h-5 text-pink-400" />
                          <h4 className="font-semibold text-white">AI Agents</h4>
                        </div>
                        <div className="text-3xl font-bold text-pink-300">
                          {aiAgents?.agents?.length || 100}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Ready for distribution</div>
                      </div>
                    </div>

                    {/* Contract Addresses */}
                    <div className="p-6 rounded-xl bg-gradient-to-r from-slate-900/60 to-purple-900/30 border border-purple-500/20">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ExternalLink className="w-5 h-5 text-purple-400" />
                        Deployed Contracts
                      </h3>
                      <div className="space-y-2">
                        {[
                          { name: 'STREAM Token', address: '0x490520c8c45e444fFC510B35596eB0D4Fb104ff3' },
                          { name: 'Summary NFT', address: '0x74AD35278EF4B3f30Fc42F23860E21256cEd4227' },
                          { name: 'Staking', address: '0x8385D2C8b960A84750bB62101bb64F815901331d' },
                          { name: 'Bounty Board', address: '0x5F0b11E9A1bb2F16B1c03B92a8C2629e7dAfeF1e' },
                          { name: 'Prediction Markets', address: '0x5180AcCa81bde90Be8A52f1618c4F821F35E36aA' }
                        ].map((contract) => (
                          <div key={contract.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
                            <span className="text-sm text-slate-300 font-medium">{contract.name}</span>
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-purple-300 font-mono">{formatAddress(contract.address)}</code>
                              <Button
                                onClick={() => handleCopyAddress(contract.address)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                data-testid={`button-copy-${contract.name.toLowerCase().replace(' ', '-')}`}
                              >
                                <Copy className="w-3 h-3 text-slate-400 hover:text-white" />
                              </Button>
                              <a
                                href={`https://sepolia.basescan.org/address/${contract.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-6 w-6 p-0 flex items-center justify-center hover:bg-purple-500/20 rounded transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-slate-400 hover:text-purple-400" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Agent Token Distribution */}
                    <div className="p-6 rounded-xl bg-gradient-to-r from-amber-900/40 to-orange-900/30 border-2 border-amber-500/50">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Bot className="w-5 h-5 text-amber-400" />
                        Distribute STREAM to AI Agents
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="distribution-amount" className="text-sm text-amber-200 mb-2 block">
                            Amount per Agent (STREAM)
                          </Label>
                          <Input
                            id="distribution-amount"
                            type="number"
                            value={distributionAmount}
                            onChange={(e) => setDistributionAmount(e.target.value)}
                            placeholder="1000"
                            className="bg-slate-900/50 border-amber-500/30 text-white"
                            data-testid="input-distribution-amount"
                          />
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-amber-200">Total Distribution:</span>
                            <span className="text-amber-300 font-bold">
                              {(parseFloat(distributionAmount) * 100).toLocaleString()} STREAM
                            </span>
                          </div>
                        </div>
                        <Button
                          disabled
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold"
                          data-testid="button-distribute-tokens"
                        >
                          <Coins className="w-4 h-4 mr-2" />
                          Distribute to 100 AI Agents (Coming Soon)
                        </Button>
                        <p className="text-xs text-amber-200/60 text-center">
                          This will send {distributionAmount} STREAM to each of the 100 AI agents on the platform
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
