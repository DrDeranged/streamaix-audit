import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
 Wallet, Coins, ExternalLink, Copy, RefreshCw, Radio
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { web3Manager, formatAddress } from '@/lib/web3';
import { contractManager, formatTokenAmount, parseTokenAmount } from '@/lib/contracts';
import { useAdminWebSocket } from '@/hooks/useAdminWebSocket';
import Surface from '@/components/ds/Surface';

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

 // Real-time WebSocket updates for admin dashboard
 const handleNewUser = useCallback((newUser: { id: number; username: string; email: string; createdAt: string; streamBalance: string }) => {
 toast({
 title: 'New User Joined!',
 description: `@${newUser.username} just registered`,
 });
 // Invalidate user breakdown to refresh the list
 queryClient.invalidateQueries({ queryKey: ['/api/admin/user-breakdown'] });
 queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
 }, [toast, queryClient]);

 const { isConnected: wsConnected } = useAdminWebSocket({
 onNewUser: handleNewUser,
 });

 // Fetch current user
 const { user, isLoading: userLoading } = useAuth();

 // Check if user is admin and redirect if not
 useEffect(() => {
 if (!userLoading && user) {
 const isAdmin = ADMIN_USERNAMES.includes(user.username);
 if (!isAdmin) {
 toast({
 title:"Access Denied",
 description:"You don't have permission to access this page",
 variant:"destructive"
 });
 setLocation('/dashboard');
 }
 }
 }, [user, userLoading, setLocation, toast]);

 // Fetch admin stats
 const { data: stats, isLoading: statsLoading } = useQuery<{
 stats: {
 totalUsers: number;
 activeUsers: number;
 activeUsers24h?: number;
 newUsers24h?: number;
 totalBounties: number;
 completedBounties: number;
 bountiesCreated24h?: number;
 totalMarkets: number;
 activeMarkets: number;
 marketsCreated24h?: number;
 totalVolume: number;
 totalTrades?: number;
 aiAgentsCount: number;
 totalSummaries?: number;
 summariesCreated24h?: number;
 }
 }>({
 queryKey: ['/api/admin/stats'],
 refetchInterval: 30000
 });

 // Fetch admin activity
 const { data: activityData, isLoading: activityLoading } = useQuery<{
 activities: Array<{
 id: string;
 type: string;
 description: string;
 createdAt: string;
 userId?: string;
 metadata?: Record<string, any>;
 }>
 }>({
 queryKey: ['/api/admin/activity'],
 });

 // Fetch newsletter status
 const { data: status } = useQuery<{
 isRunning: boolean;
 nextMorning: string;
 nextAfternoon: string;
 subscriberCount: number;
 schedule: string;
 }>({
 queryKey: ['/api/newsletter/status'],
 refetchInterval: 30000
 });

 // Fetch user breakdown (real humans vs AI agents)
 const { data: userBreakdown, isLoading: userBreakdownLoading } = useQuery<{
 breakdown: {
 total: number;
 realHumans: {
 total: number;
 new24h: number;
 new7d: number;
 new30d: number;
 active24h: number;
 active7d: number;
 users: Array<{
 id: number;
 username: string;
 email: string;
 createdAt: string;
 lastLoginAt: string | null;
 streamBalance: string;
 }>;
 };
 aiAgents: {
 total: number;
 };
 newsletter: {
 subscribers: number;
 entries: Array<{
 id: number;
 email: string;
 name: string;
 createdAt: string;
 }>;
 };
 };
 }>({
 queryKey: ['/api/admin/user-breakdown'],
 refetchInterval: 60000
 });

 // Fetch API costs
 const { data: apiCosts, isLoading: apiCostsLoading } = useQuery<{
 costs: {
 currentMonth: {
 total: number;
 breakdown: Record<string, number>;
 };
 projectedMonth: number;
 budget: {
 openai: number;
 coingecko: number;
 total: number;
 };
 };
 }>({
 queryKey: ['/api/admin/api-costs'],
 refetchInterval: 60000
 });

 // Fetch newsletter history
 const { data: history } = useQuery<{
 newsletters: Array<{
 id: string;
 subject: string;
 sentAt: string;
 recipientCount: number;
 openRate?: number;
 }>
 }>({
 queryKey: ['/api/newsletter/history'],
 });

 // Fetch autonomous systems status with 30-second auto-refresh (optimized)
 const { data: systemsData, isLoading: systemsLoading } = useQuery<{
 systems: Array<{
 name: string;
 status: string;
 lastRun?: string;
 nextRun?: string;
 }>;
 platformMetrics: {
 totalStreams: number;
 activeStreams: number;
 totalAvatars: number;
 totalAgents: number;
 totalSystems?: number;
 activeSystems?: number;
 warningSystems?: number;
 errorSystems?: number;
 overallSuccessRate?: number;
 }
 }>({
 queryKey: ['/api/admin/systems/status'],
 refetchInterval: 30000,
 staleTime: 15000,
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
 title:"Test Email Sent",
 description:"Check your inbox for the test newsletter",
 });
 },
 onError: () => {
 toast({
 title:"Unable to send test email",
 description:"Please check the email address and try again.",
 variant:"destructive"
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
 title:"Newsletter Sent",
 description: `Sent to ${data.sentCount} subscribers`,
 });
 queryClient.invalidateQueries({ queryKey: ['/api/newsletter/history'] });
 },
 onError: () => {
 toast({
 title:"Unable to send newsletter",
 description:"Please try again later.",
 variant:"destructive"
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
 title:"Wrong Network",
 description:"Please switch to Base Sepolia or Base Mainnet",
 variant:"destructive"
 });
 } else {
 toast({
 title:"Wallet Connected",
 description: `Connected to ${formatAddress(wallet.address)}`,
 });
 await loadContractData(wallet.address);
 }
 } catch (error: any) {
 toast({
 title:"Unable to connect wallet",
 description:"Please check your wallet and try again.",
 variant:"destructive"
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
 title:"Wallet Disconnected",
 description:"Successfully disconnected from wallet",
 });
 };

 const handleCopyAddress = (address: string) => {
 navigator.clipboard.writeText(address);
 toast({
 title:"Copied",
 description:"Address copied to clipboard",
 });
 };

 // Fetch AI agents for token distribution
 const { data: aiAgents } = useQuery<{
 agents: Array<{
 id: string;
 name: string;
 walletAddress?: string;
 }>
 }>({
 queryKey: ['/api/users/ai-agents'],
 enabled: walletConnected,
 });

 // Show loading while checking auth
 if (userLoading) {
 return (
 <div className="min-h-screen bg-ink-page bg-ink-surface flex items-center justify-center">
 <div className="flex items-center gap-3 text-primary">
 <Loader2 className="w-6 h-6 animate-spin" />
 <span>Checking permissions...</span>
 </div>
 </div>
 );
 }

 // Show unauthorized if not logged in
 if (!user) {
 return (
 <div className="min-h-screen bg-ink-page bg-ink-surface flex items-center justify-center p-6">
 <Surface className="neural-glass border-loss max-w-md">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-loss">
 <ShieldAlert className="w-6 h-6" />
 Authentication Required
 </CardTitle>
 <CardDescription>Please log in to access this page</CardDescription>
 </CardHeader>
 <CardContent>
 <Button
 onClick={() => setLocation('/auth')}
 className="w-full grad-accent"
 >
 Go to Login
 </Button>
 </CardContent>
 </Surface>
 </div>
 );
 }

 // Show unauthorized if not admin
 const isAdmin = ADMIN_USERNAMES.includes(user.username);
 if (!isAdmin) {
 return (
 <div className="min-h-screen bg-ink-page bg-ink-surface flex items-center justify-center p-6">
 <Surface className="neural-glass border-loss max-w-md">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-loss">
 <ShieldAlert className="w-6 h-6" />
 Access Denied
 </CardTitle>
 <CardDescription>This page is restricted to administrators only</CardDescription>
 </CardHeader>
 <CardContent>
 <Button
 onClick={() => setLocation('/dashboard')}
 className="w-full grad-accent"
 >
 Go to Dashboard
 </Button>
 </CardContent>
 </Surface>
 </div>
 );
 }

 const activities = activityData?.activities || [];

 return (
 <div className="min-h-screen bg-ink-page bg-ink-surface p-4 md:p-6">
 <div className="max-w-7xl mx-auto space-y-6">
 {/* Enhanced Header with Neural Network Effect */}
 <div className="relative overflow-hidden rounded-xl bg-ink-surface border border-accent-core p-6 md:p-8">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] bg-ink-surface" />
 <div className="absolute top-0 right-0 w-64 h-64 bg-ink-surface blur-3xl" />
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-ink-surface blur-3xl" />
 
 <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="p-4 rounded-xl bg-ink-surface shadow-lg shadow-accent-core/30">
 <LayoutDashboard className="w-8 h-8 text-primary" />
 </div>
 <div>
 <h1 className="text-3xl md:text-4xl font-bold bg-ink-surface bg-clip-text text-transparent">
 Admin Command Center
 </h1>
 <p className="text-secondary mt-1">Real-time platform analytics • AI systems monitoring • Newsletter control</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gain/10 border border-gain">
 <div className="w-2 h-2 rounded-full bg-gain/10 animate-pulse" />
 <span className="text-sm font-semibold text-gain">LIVE</span>
 </div>
 <Button
 onClick={() => setLocation('/')}
 variant="outline"
 className="border-accent-core hover:border-accent-core hover:bg-ink-raised text-accent-bright font-semibold"
 >
 <Home className="w-4 h-4 mr-2" />
 Back to Home
 </Button>
 </div>
 </div>
 </div>

 {/* Platform Overview Stats - Enhanced Design */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="relative group overflow-hidden rounded-xl bg-ink-surface border border-accent-core p-5 hover:border-accent-core/50 transition-all duration-300">
 <div className="absolute inset-0 bg-ink-surface opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="relative">
 <div className="flex items-center justify-between mb-4">
 <div className="p-3 rounded-xl bg-accent-core/10 border border-accent-core">
 <Users className="w-6 h-6 text-accent-bright" />
 </div>
 {stats?.stats?.newUsers24h ? (
 <div className="px-2 py-1 rounded-full bg-gain/10 border border-gain">
 <span className="text-xs font-semibold text-gain">+{stats.stats.newUsers24h} today</span>
 </div>
 ) : null}
 </div>
 {statsLoading ? (
 <Loader2 className="w-6 h-6 animate-spin text-accent-bright" />
 ) : (
 <div className="text-3xl font-bold text-primary mb-1">{(stats?.stats?.totalUsers || 0).toLocaleString()}</div>
 )}
 <h3 className="text-sm font-medium text-accent-bright">Total Users</h3>
 </div>
 </div>

 <div className="relative group overflow-hidden rounded-xl bg-ink-surface border border-accent-core p-5 hover:border-accent-core/50 transition-all duration-300">
 <div className="absolute inset-0 bg-ink-surface opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="relative">
 <div className="flex items-center justify-between mb-4">
 <div className="p-3 rounded-xl bg-accent-core/10 border border-accent-core">
 <FileText className="w-6 h-6 text-accent-bright" />
 </div>
 {stats?.stats?.summariesCreated24h ? (
 <div className="px-2 py-1 rounded-full bg-gain/10 border border-gain">
 <span className="text-xs font-semibold text-gain">+{stats.stats.summariesCreated24h} today</span>
 </div>
 ) : null}
 </div>
 {statsLoading ? (
 <Loader2 className="w-6 h-6 animate-spin text-accent-bright" />
 ) : (
 <div className="text-3xl font-bold text-primary mb-1">{(stats?.stats?.totalSummaries || 0).toLocaleString()}</div>
 )}
 <h3 className="text-sm font-medium text-accent-bright">AI Summaries</h3>
 </div>
 </div>

 <div className="relative group overflow-hidden rounded-xl bg-ink-surface border border-warn p-5 hover:border-warn/50 transition-all duration-300">
 <div className="absolute inset-0 bg-ink-surface opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="relative">
 <div className="flex items-center justify-between mb-4">
 <div className="p-3 rounded-xl bg-warn/10 border border-warn">
 <Target className="w-6 h-6 text-warn" />
 </div>
 {stats?.stats?.bountiesCreated24h ? (
 <div className="px-2 py-1 rounded-full bg-gain/10 border border-gain">
 <span className="text-xs font-semibold text-gain">+{stats.stats.bountiesCreated24h} today</span>
 </div>
 ) : null}
 </div>
 {statsLoading ? (
 <Loader2 className="w-6 h-6 animate-spin text-warn" />
 ) : (
 <div className="text-3xl font-bold text-primary mb-1">{(stats?.stats?.totalBounties || 0).toLocaleString()}</div>
 )}
 <h3 className="text-sm font-medium text-warn">Bounties</h3>
 </div>
 </div>

 <div className="relative group overflow-hidden rounded-xl bg-ink-surface border border-accent-core p-5 hover:border-accent-core/50 transition-all duration-300">
 <div className="absolute inset-0 bg-ink-surface opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="relative">
 <div className="flex items-center justify-between mb-4">
 <div className="p-3 rounded-xl bg-accent-core/10 border border-accent-core">
 <TrendingUp className="w-6 h-6 text-accent-bright" />
 </div>
 {stats?.stats?.marketsCreated24h ? (
 <div className="px-2 py-1 rounded-full bg-gain/10 border border-gain">
 <span className="text-xs font-semibold text-gain">+{stats.stats.marketsCreated24h} today</span>
 </div>
 ) : null}
 </div>
 {statsLoading ? (
 <Loader2 className="w-6 h-6 animate-spin text-accent-bright" />
 ) : (
 <div className="text-3xl font-bold text-primary mb-1">{(stats?.stats?.totalMarkets || 0).toLocaleString()}</div>
 )}
 <h3 className="text-sm font-medium text-accent-bright">Prediction Markets</h3>
 </div>
 </div>
 </div>

 {/* Trading Stats - Enhanced Row */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="relative group overflow-hidden rounded-xl bg-ink-surface border border-gain p-5 hover:border-gain/50 transition-all duration-300">
 <div className="absolute inset-0 bg-ink-surface opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="relative flex items-center gap-4">
 <div className="p-3 rounded-xl bg-gain/10 border border-gain">
 <BarChart3 className="w-6 h-6 text-gain" />
 </div>
 <div>
 <div className="text-2xl font-bold text-primary">
 {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (stats?.stats?.totalTrades || 0).toLocaleString()}
 </div>
 <div className="text-sm text-gain">Total Trades</div>
 </div>
 </div>
 </div>

 <div className="relative group overflow-hidden rounded-xl bg-ink-surface border border-accent-core p-5 hover:border-accent-core/50 transition-all duration-300">
 <div className="absolute inset-0 bg-ink-surface opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="relative flex items-center gap-4">
 <div className="p-3 rounded-xl bg-accent-core/10 border border-accent-core">
 <Zap className="w-6 h-6 text-accent-bright" />
 </div>
 <div>
 <div className="text-2xl font-bold text-primary">
 {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${((stats?.stats?.totalVolume || 0)).toLocaleString()} STREAM`}
 </div>
 <div className="text-sm text-accent-bright">Trading Volume</div>
 </div>
 </div>
 </div>

 <div className="relative group overflow-hidden rounded-xl bg-ink-surface border border-accent-core p-5 hover:border-indigo-400/50 transition-all duration-300">
 <div className="absolute inset-0 bg-ink-surface opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="relative flex items-center gap-4">
 <div className="p-3 rounded-xl bg-accent-core/10 border border-accent-core">
 <Activity className="w-6 h-6 text-accent-bright" />
 </div>
 <div>
 <div className="text-2xl font-bold text-primary">
 {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.stats?.activeUsers24h || 0}
 </div>
 <div className="text-sm text-accent-bright">Active Users (24h)</div>
 </div>
 </div>
 </div>
 </div>

 {/* Real Human Users Section */}
 <Surface className="neural-glass border-gain">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Users className="w-5 h-5 text-gain" />
 Real Human Users
 {wsConnected && (
 <span className="ml-2 flex items-center gap-1 text-xs font-normal text-gain">
 <Radio className="w-3 h-3 animate-pulse" />
 Live
 </span>
 )}
 </CardTitle>
 <CardDescription>Focus on real user signups and engagement</CardDescription>
 </CardHeader>
 <CardContent>
 {userBreakdownLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loader2 className="w-6 h-6 animate-spin text-gain" />
 </div>
 ) : (
 <div className="space-y-6">
 {/* Stats Grid */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="p-4 rounded-xl bg-ink-surface border border-gain">
 <div className="text-3xl font-bold text-primary mb-1">
 {userBreakdown?.breakdown?.realHumans?.total || 0}
 </div>
 <div className="text-sm text-gain">Total Real Users</div>
 </div>
 <div className="p-4 rounded-xl bg-ink-surface border border-gain">
 <div className="text-3xl font-bold text-primary mb-1">
 {userBreakdown?.breakdown?.realHumans?.new7d || 0}
 </div>
 <div className="text-sm text-gain">New This Week</div>
 </div>
 <div className="p-4 rounded-xl bg-ink-surface border border-gain">
 <div className="text-3xl font-bold text-primary mb-1">
 {userBreakdown?.breakdown?.realHumans?.active24h || 0}
 </div>
 <div className="text-sm text-gain">Active Today</div>
 </div>
 <div className="p-4 rounded-xl bg-ink-surface border border-accent-core">
 <div className="text-3xl font-bold text-primary mb-1">
 {userBreakdown?.breakdown?.newsletter?.subscribers || 0}
 </div>
 <div className="text-sm text-accent-bright">Newsletter Subs</div>
 </div>
 </div>

 {/* Real Users Table */}
 {userBreakdown?.breakdown?.realHumans?.users && userBreakdown.breakdown.realHumans.users.length > 0 && (
 <div className="rounded-xl bg-ink-surface border border-gain overflow-hidden">
 <div className="px-4 py-3 bg-gain/10 border-b border-gain">
 <h4 className="font-semibold text-gain text-sm">Registered Users ({userBreakdown.breakdown.realHumans.users.length})</h4>
 </div>
 <div className="max-h-64 overflow-y-auto">
 <table className="w-full text-sm">
 <thead className="bg-ink-surface sticky top-0">
 <tr>
 <th className="px-4 py-2 text-left text-secondary font-medium">Username</th>
 <th className="px-4 py-2 text-left text-secondary font-medium">Email</th>
 <th className="px-4 py-2 text-left text-secondary font-medium">Joined</th>
 <th className="px-4 py-2 text-right text-secondary font-medium">STREAM</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-ink-divider">
 {userBreakdown.breakdown.realHumans.users.map((user) => (
 <tr key={user.id} className="hover:bg-ink-raised">
 <td className="px-4 py-2 text-primary font-medium">@{user.username}</td>
 <td className="px-4 py-2 text-secondary">{user.email}</td>
 <td className="px-4 py-2 text-secondary">
 {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'N/A'}
 </td>
 <td className="px-4 py-2 text-right text-gain font-mono">
 {Number(user.streamBalance || 0).toLocaleString()}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Newsletter Subscribers Table */}
 {userBreakdown?.breakdown?.newsletter?.entries && userBreakdown.breakdown.newsletter.entries.length > 0 && (
 <div className="rounded-xl bg-ink-surface border border-accent-core overflow-hidden">
 <div className="px-4 py-3 bg-accent-core/10 border-b border-accent-core">
 <h4 className="font-semibold text-accent-bright text-sm">Newsletter Subscribers ({userBreakdown.breakdown.newsletter.entries.length})</h4>
 </div>
 <div className="max-h-64 overflow-y-auto">
 <table className="w-full text-sm">
 <thead className="bg-ink-surface sticky top-0">
 <tr>
 <th className="px-4 py-2 text-left text-secondary font-medium">Name</th>
 <th className="px-4 py-2 text-left text-secondary font-medium">Email</th>
 <th className="px-4 py-2 text-left text-secondary font-medium">Subscribed</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-ink-divider">
 {userBreakdown.breakdown.newsletter.entries.map((entry) => (
 <tr key={entry.id} className="hover:bg-ink-raised">
 <td className="px-4 py-2 text-primary">{entry.name}</td>
 <td className="px-4 py-2 text-secondary">{entry.email}</td>
 <td className="px-4 py-2 text-secondary">
 {entry.createdAt ? formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }) : 'N/A'}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}
 
 {/* AI Agents Summary (Secondary) */}
 {!userBreakdownLoading && (
 <div className="mt-4 p-3 rounded-xl bg-ink-surface border border-ink-edge flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Bot className="w-4 h-4 text-secondary" />
 <span className="text-sm text-secondary">AI Agents</span>
 </div>
 <span className="text-sm font-semibold text-secondary">
 {userBreakdown?.breakdown?.aiAgents?.total || 100} active
 </span>
 </div>
 )}
 </CardContent>
 </Surface>

 {/* API Cost Tracking Section */}
 <Surface className="neural-glass border-warn">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <DollarSign className="w-5 h-5 text-warn" />
 API Cost Tracking
 </CardTitle>
 <CardDescription>Monitor spending across all external APIs</CardDescription>
 </CardHeader>
 <CardContent>
 {apiCostsLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loader2 className="w-6 h-6 animate-spin text-warn" />
 </div>
 ) : (
 <div className="space-y-4">
 {/* Cost Overview */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="p-4 rounded-xl bg-ink-surface border border-warn">
 <div className="text-2xl font-bold text-primary mb-1">
 ${(apiCosts?.costs?.currentMonth?.total || 0).toFixed(2)}
 </div>
 <div className="text-sm text-warn">Current Month</div>
 </div>
 <div className="p-4 rounded-xl bg-ink-surface border border-warn">
 <div className="text-2xl font-bold text-primary mb-1">
 ${(apiCosts?.costs?.projectedMonth || 0).toFixed(2)}
 </div>
 <div className="text-sm text-warn">Projected Month</div>
 </div>
 <div className="p-4 rounded-xl bg-ink-surface border border-loss">
 <div className="text-2xl font-bold text-primary mb-1">
 ${apiCosts?.costs?.budget?.total || 154}
 </div>
 <div className="text-sm text-loss">Monthly Budget</div>
 </div>
 </div>
 
 {/* Cost Breakdown */}
 <div className="p-4 rounded-xl bg-ink-surface border border-ink-edge">
 <h4 className="font-semibold text-primary mb-3">Cost Breakdown</h4>
 <div className="space-y-2">
 {Object.entries(apiCosts?.costs?.currentMonth?.breakdown || {}).map(([service, cost]) => (
 <div key={service} className="flex items-center justify-between">
 <span className="text-sm text-secondary">{service}</span>
 <span className="text-sm font-semibold text-secondary">
 ${typeof cost === 'number' ? cost.toFixed(2) : '0.00'}
 </span>
 </div>
 ))}
 {Object.keys(apiCosts?.costs?.currentMonth?.breakdown || {}).length === 0 && (
 <>
 <div className="flex items-center justify-between">
 <span className="text-sm text-secondary">OpenAI (estimated)</span>
 <span className="text-sm font-semibold text-secondary">$15-25/mo</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-secondary">CoinGecko Pro</span>
 <span className="text-sm font-semibold text-secondary">$129/mo</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-secondary">Resend (emails)</span>
 <span className="text-sm font-semibold text-secondary">~$1/mo</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-sm text-secondary">Finnhub (stocks)</span>
 <span className="text-sm font-semibold text-secondary">Free tier</span>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 )}
 </CardContent>
 </Surface>

 {/* Recent Activity Feed */}
 <Surface className="neural-glass border-accent-core">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Activity className="w-5 h-5 text-accent-bright" />
 Recent Platform Activity
 </CardTitle>
 <CardDescription>Latest actions across all features</CardDescription>
 </CardHeader>
 <CardContent>
 {activityLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loader2 className="w-6 h-6 animate-spin text-accent-bright" />
 </div>
 ) : activities.length > 0 ? (
 <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
 {activities.map((activity: any, index: number) => {
 const Icon = activity.type === 'user' ? UserPlus :
 activity.type === 'summary' ? FileText :
 activity.type === 'bounty' ? Target :
 activity.type === 'market' ? TrendingUp : Activity;
 
 const iconColor = activity.type === 'user' ? 'text-accent-bright bg-accent-core/10 border-accent-core/20' :
 activity.type === 'summary' ? 'text-accent-bright bg-accent-core/10 border-accent-core/20' :
 activity.type === 'bounty' ? 'text-warn bg-warn/10 border-warn/20' :
 'text-accent-bright bg-accent-core/10 border-accent-core/20';

 return (
 <div
 key={`${activity.type}-${activity.id}-${index}`}
 className="p-4 rounded-xl bg-ink-surface border border-accent-core flex items-start gap-4 hover:bg-ink-raised transition-colors"
 >
 <div className={`p-2 rounded-xl ${iconColor} mt-1`}>
 <Icon className="w-4 h-4" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <div className="flex-1">
 <h4 className="font-semibold text-primary text-sm">{activity.title}</h4>
 <p className="text-sm text-secondary truncate">{activity.description}</p>
 {activity.username && (
 <p className="text-xs text-secondary mt-1">by @{activity.username}</p>
 )}
 </div>
 <span className="text-xs text-secondary whitespace-nowrap">
 {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <p className="text-center text-secondary py-8">No recent activity</p>
 )}
 </CardContent>
 </Surface>

 {/* Autonomous Systems Monitoring Section (Collapsible) */}
 <Collapsible open={systemsOpen} onOpenChange={setSystemsOpen}>
 <Surface className="neural-glass gradient-border-hot overflow-hidden">
 <CollapsibleTrigger className="w-full">
 <CardHeader className="cursor-pointer hover:bg-ink-raised transition-all duration-300">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-xl bg-ink-surface glow-pulse">
 <Bot className="w-6 h-6 text-primary" />
 </div>
 <div className="text-left">
 <CardTitle className="text-xl bg-ink-surface bg-clip-text text-transparent">
 Autonomous Systems
 </CardTitle>
 <CardDescription className="text-secondary">
 Real-time monitoring of all 10 AI agents and systems
 </CardDescription>
 </div>
 </div>
 <div className="flex items-center gap-3">
 {systemsData?.platformMetrics && (
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-core/10 border border-accent-core">
 <div className="w-2 h-2 rounded-full bg-accent-core/10 animate-pulse" />
 <span className="text-sm font-semibold text-accent-bright">
 {systemsData.platformMetrics.activeSystems}/{systemsData.platformMetrics.totalSystems} Active
 </span>
 </div>
 )}
 <div className="p-2 rounded-xl bg-accent-core/10 border border-accent-core">
 {systemsOpen ? (
 <ChevronUp className="w-5 h-5 text-accent-bright" />
 ) : (
 <ChevronDown className="w-5 h-5 text-accent-bright" />
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
 <Loader2 className="w-8 h-8 animate-spin text-accent-bright" />
 </div>
 ) : systemsData?.systems ? (
 <>
 {/* Platform Overview */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
 <div className="p-4 rounded-xl bg-ink-surface border-2 border-gain">
 <div className="text-2xl font-bold text-primary mb-1">
 {systemsData.platformMetrics.activeSystems}
 </div>
 <div className="text-xs text-gain uppercase tracking-wide">Active Systems</div>
 </div>
 <div className="p-4 rounded-xl bg-ink-surface border-2 border-warn">
 <div className="text-2xl font-bold text-primary mb-1">
 {systemsData.platformMetrics.warningSystems}
 </div>
 <div className="text-xs text-warn uppercase tracking-wide">Warning</div>
 </div>
 <div className="p-4 rounded-xl bg-ink-surface border-2 border-loss">
 <div className="text-2xl font-bold text-primary mb-1">
 {systemsData.platformMetrics.errorSystems}
 </div>
 <div className="text-xs text-loss uppercase tracking-wide">Errors</div>
 </div>
 <div className="p-4 rounded-xl bg-ink-surface border-2 border-accent-core">
 <div className="text-2xl font-bold text-primary mb-1">
 {systemsData.platformMetrics.overallSuccessRate}%
 </div>
 <div className="text-xs text-accent-bright uppercase tracking-wide">Success Rate</div>
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
 bg: 'bg-ink-surface',
 border: 'border-gain/50',
 badge: 'bg-gain/20 border-gain/40 text-gain',
 icon: 'text-gain',
 glow: 'shadow-gain/20'
 },
 warning: {
 bg: 'bg-ink-surface',
 border: 'border-warn/50',
 badge: 'bg-warn/20 border-warn/40 text-warn',
 icon: 'text-warn',
 glow: ''
 },
 error: {
 bg: 'bg-ink-surface',
 border: 'border-loss/50',
 badge: 'bg-loss/20 border-loss/40 text-loss',
 icon: 'text-loss',
 glow: 'shadow-loss/20'
 },
 idle: {
 bg: 'bg-ink-surface',
 border: 'border-ink-edge',
 badge: 'bg-ink-raised border-ink-edge text-body',
 icon: 'text-secondary',
 glow: 'shadow-ink-edge/20'
 }
 };

 const style = statusStyles[system.status as keyof typeof statusStyles] || statusStyles.idle;

 return (
 <Surface 
 key={system.key}
 className={`neural-glass ${style.bg} border-2 ${style.border} hover:${style.glow} transition-all duration-300`}
 >
 <CardContent className="p-5">
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-start gap-3">
 <div className={`p-2.5 rounded-xl bg-ink-surface border border-ink-edge`}>
 <Icon className={`w-5 h-5 ${style.icon}`} />
 </div>
 <div>
 <h3 className="font-bold text-primary text-sm mb-1">{system.name}</h3>
 <p className="text-xs text-secondary leading-relaxed">{system.description}</p>
 </div>
 </div>
 <div className={`px-2.5 py-1 rounded-full ${style.badge} border text-xs font-semibold uppercase tracking-wide`}>
 {system.status}
 </div>
 </div>

 {/* Metrics */}
 <div className="grid grid-cols-3 gap-3 mb-4">
 <div className="p-2.5 rounded-xl bg-ink-surface border border-ink-edge">
 <div className="text-lg font-bold text-primary">
 {system.metrics.actionsPerHour}
 </div>
 <div className="text-xs text-secondary">Actions/hr</div>
 </div>
 <div className="p-2.5 rounded-xl bg-ink-surface border border-ink-edge">
 <div className="text-lg font-bold text-primary">
 {system.metrics.successRate}%
 </div>
 <div className="text-xs text-secondary">Success</div>
 </div>
 <div className="p-2.5 rounded-xl bg-ink-surface border border-ink-edge">
 <div className="text-lg font-bold text-primary">
 {system.metrics.errorCount}
 </div>
 <div className="text-xs text-secondary">Errors</div>
 </div>
 </div>

 {/* Recent Activity */}
 {system.recentActions && system.recentActions.length > 0 && (
 <div className="space-y-2">
 <div className="flex items-center gap-2 mb-2">
 <Activity className="w-3.5 h-3.5 text-secondary" />
 <span className="text-xs text-secondary font-semibold uppercase tracking-wide">
 Recent Activity
 </span>
 </div>
 <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
 {system.recentActions.slice(0, 3).map((action: any, idx: number) => (
 <div 
 key={`${system.key}-${action.id}-${idx}`}
 className="p-2 rounded-xl bg-ink-surface border border-ink-edge text-xs"
 >
 <div className="flex items-center justify-between mb-1">
 <span className="text-secondary font-medium">
 {action.actionType || 'Action'}
 </span>
 <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
 action.status === 'success' 
 ? 'bg-gain/20 text-gain'
 : 'bg-loss/20 text-loss'
 }`}>
 {action.status}
 </span>
 </div>
 {action.createdAt && (
 <div className="text-[10px] text-secondary">
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
 <div className="mt-3 pt-3 border-t border-ink-edge text-xs text-secondary">
 Last run: {formatDistanceToNow(new Date(system.lastRunTime), { addSuffix: true })}
 </div>
 )}
 </CardContent>
 </Surface>
 );
 })}
 </div>
 </>
 ) : (
 <div className="text-center py-12">
 <AlertTriangle className="w-12 h-12 text-warn mx-auto mb-3" />
 <p className="text-secondary">No autonomous systems data available</p>
 </div>
 )}
 </CardContent>
 </CollapsibleContent>
 </Surface>
 </Collapsible>

 {/* Newsletter Section (Collapsible) */}
 <Collapsible open={newsletterOpen} onOpenChange={setNewsletterOpen}>
 <Surface className="neural-glass gradient-border-hot overflow-hidden">
 <CollapsibleTrigger className="w-full">
 <CardHeader className="cursor-pointer hover:bg-ink-raised transition-all duration-300">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-xl bg-ink-surface glow-pulse">
 <Mail className="w-6 h-6 text-primary" />
 </div>
 <div className="text-left">
 <CardTitle className="text-xl bg-ink-surface bg-clip-text text-transparent">
 Newsletter Management
 </CardTitle>
 <CardDescription className="text-secondary">
 Automated crypto newsletters & manual controls
 </CardDescription>
 </div>
 </div>
 <div className="p-2 rounded-xl bg-accent-core/10 border border-accent-core">
 {newsletterOpen ? (
 <ChevronUp className="w-5 h-5 text-accent-bright" />
 ) : (
 <ChevronDown className="w-5 h-5 text-accent-bright" />
 )}
 </div>
 </div>
 </CardHeader>
 </CollapsibleTrigger>
 
 <CollapsibleContent>
 <CardContent className="space-y-8 pt-6 pb-8">
 {/* Scheduler Status - Redesigned */}
 <div className="relative overflow-hidden rounded-xl bg-ink-surface border border-accent-core p-6">
 <div className="absolute inset-0 bg-ink-surface" />
 <div className="relative space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-ink-surface border border-accent-core">
 <Calendar className="w-5 h-5 text-accent-bright" />
 </div>
 <div>
 <h3 className="font-bold text-primary text-lg">Automated Scheduler</h3>
 <p className="text-sm text-accent-bright">Every Monday & Friday at 8am EST</p>
 </div>
 </div>
 {status?.isRunning && (
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gain/10 border border-gain animate-pulse">
 <div className="w-2 h-2 rounded-full bg-gain/10 glow-pulse" />
 <span className="text-sm font-semibold text-gain">LIVE</span>
 </div>
 )}
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Status Badge */}
 <div className="relative group">
 <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
 status?.isRunning 
 ? 'bg-ink-surface border-gain/50 shadow-lg shadow-gain/20' 
 : 'bg-ink-surface border-loss/50'
 }`}>
 <div className="flex items-center gap-3 mb-2">
 {status?.isRunning ? (
 <CheckCircle className="w-6 h-6 text-gain" />
 ) : (
 <XCircle className="w-6 h-6 text-loss" />
 )}
 <span className="font-bold text-primary text-lg">
 {status?.isRunning ? 'Active' : 'Inactive'}
 </span>
 </div>
 <p className="text-xs text-secondary uppercase tracking-wide">Scheduler Status</p>
 </div>
 </div>

 {/* Morning Send (8am EST) */}
 <div className="relative group">
 <div className="p-4 rounded-xl bg-ink-surface border-2 border-accent-core transition-all duration-300 hover:border-accent-core/70 hover:shadow-lg hover:shadow-accent-core/20">
 <div className="font-bold text-primary text-base mb-2">
 {status?.nextMorning || 'Loading...'}
 </div>
 <p className="text-xs text-accent-bright uppercase tracking-wide mb-3">Morning Alpha (8am EST)</p>
 <Button
 variant="outline"
 onClick={() => window.open('/api/newsletter/preview', '_blank')}
 className="w-full h-8 text-xs border border-accent-core hover:border-accent-core/60 hover:bg-accent-core/10 text-accent-bright font-semibold rounded-xl transition-all duration-300"
 >
 <Eye className="w-3 h-3 mr-1" />
 Preview
 </Button>
 </div>
 </div>

 {/* Afternoon Send (4pm EST) */}
 <div className="relative group">
 <div className="p-4 rounded-xl bg-ink-surface border-2 border-accent-core transition-all duration-300 hover:border-accent-core/70 hover:shadow-lg hover:shadow-accent-core/20">
 <div className="font-bold text-primary text-base mb-2">
 {status?.nextAfternoon || 'Loading...'}
 </div>
 <p className="text-xs text-accent-bright uppercase tracking-wide mb-3">Market Close Recap (4pm EST)</p>
 <Button
 variant="outline"
 onClick={() => window.open('/api/newsletter/preview', '_blank')}
 className="w-full h-8 text-xs border border-accent-core hover:border-accent-core/60 hover:bg-accent-core/10 text-accent-bright font-semibold rounded-xl transition-all duration-300"
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
 <div className="absolute inset-0 bg-ink-surface rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
 <div className="relative p-6 rounded-xl bg-ink-surface border-2 border-accent-core backdrop-blur-sm space-y-5">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-xl bg-ink-surface shadow-lg">
 <Eye className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h3 className="font-bold text-primary text-lg">Test Newsletter</h3>
 <p className="text-sm text-accent-bright">Preview before sending</p>
 </div>
 </div>
 
 <div className="space-y-3">
 <Label htmlFor="test-email" className="text-accent-bright font-semibold">Email Address</Label>
 <div className="relative">
 <Input
 id="test-email"
 type="email"
 placeholder="your@email.com"
 value={testEmail}
 onChange={(e) => setTestEmail(e.target.value)}
 className="bg-ink-surface border-2 border-accent-core focus:border-accent-core/60 text-primary placeholder:text-muted h-12 text-base rounded-xl transition-all duration-300"
 />
 </div>
 </div>
 
 <div className="space-y-3">
 <Button
 onClick={handleSendTest}
 disabled={!testEmail || sendTestMutation.isPending}
 className="w-full h-12 grad-accent text-primary font-bold text-base rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
 className="w-full h-11 border-2 border-accent-core hover:border-accent-core hover:bg-ink-raised text-accent-bright font-semibold rounded-xl transition-all duration-300"
 >
 <Eye className="w-5 h-5 mr-2" />
 Preview in Browser
 </Button>
 </div>
 </div>
 </div>

 {/* Send to All - Bold Warning Design */}
 <div className="relative group">
 <div className="absolute inset-0 bg-ink-surface rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
 <div className="relative p-6 rounded-xl bg-ink-surface border-2 border-loss backdrop-blur-sm space-y-5">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-xl bg-ink-surface shadow-lg animate-pulse">
 <Mail className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h3 className="font-bold text-primary text-lg">Broadcast Newsletter</h3>
 <p className="text-sm text-loss">Send to all subscribers</p>
 </div>
 </div>
 
 {/* Warning Banner */}
 <div className="relative overflow-hidden rounded-xl border-2 border-warn bg-ink-surface p-4">
 <div className="absolute inset-0 bg-ink-surface animate-pulse" />
 <div className="relative flex items-start gap-3">
 <div className="p-1.5 rounded-xl bg-warn/10 border border-warn mt-0.5">
 <ShieldAlert className="w-5 h-5 text-warn" />
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-warn mb-1">Critical Action</p>
 <p className="text-xs text-warn leading-relaxed">
 This will immediately send the newsletter to ALL subscribed waitlist members. This action cannot be undone.
 </p>
 </div>
 </div>
 </div>
 
 <Button
 onClick={handleSendAll}
 disabled={sendAllMutation.isPending}
 className="w-full h-14 grad-accent text-primary font-bold text-base rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-loss"
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
 <div className="relative overflow-hidden rounded-xl bg-ink-surface border-2 border-accent-core p-6">
 <div className="absolute inset-0 bg-ink-surface" />
 <div className="relative space-y-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-ink-surface border border-accent-core">
 <Calendar className="w-5 h-5 text-accent-bright" />
 </div>
 <div>
 <h3 className="font-bold text-primary text-lg">Send History</h3>
 <p className="text-sm text-accent-bright">Recent newsletter broadcasts</p>
 </div>
 </div>
 {(history?.newsletters?.length ?? 0) > 0 && (
 <div className="px-3 py-1.5 rounded-full bg-accent-core/10 border border-accent-core">
 <span className="text-sm font-semibold text-accent-bright">
 {history?.newsletters?.length ?? 0} Total
 </span>
 </div>
 )}
 </div>
 
 {(history?.newsletters?.length ?? 0) > 0 ? (
 <div className="space-y-3">
 {history?.newsletters?.slice(0, 5).map((newsletter: any, index: number) => (
 <div
 key={newsletter.id}
 className="group relative"
 >
 <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-ink-surface" />
 <div className="pl-6 relative">
 <div className="absolute left-[-4px] top-3 w-2 h-2 rounded-full bg-accent-core/10 border-2 border-accent-core group-hover:scale-150 group-hover:bg-accent-core transition-all duration-300" />
 <div className="p-4 rounded-xl bg-ink-surface border border-accent-core hover:border-indigo-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent-core/10">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-2">
 <CheckCircle className="w-4 h-4 text-gain flex-shrink-0" />
 <h4 className="font-bold text-primary text-base truncate">
 {newsletter.subject}
 </h4>
 </div>
 <div className="flex items-center gap-4 flex-wrap">
 <div className="flex items-center gap-2">
 <Users className="w-3.5 h-3.5 text-accent-bright" />
 <span className="text-sm text-accent-bright font-semibold">
 {newsletter.recipientCount} recipients
 </span>
 </div>
 <div className="flex items-center gap-2">
 <Calendar className="w-3.5 h-3.5 text-accent-bright" />
 <span className="text-xs text-secondary">
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
 <div className="px-3 py-1.5 rounded-xl bg-gain/10 border border-gain">
 <span className="text-xs font-bold text-gain">SUCCESS</span>
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
 <div className="p-4 rounded-full bg-accent-core/10 border border-accent-core mb-4">
 <Mail className="w-8 h-8 text-accent-bright" />
 </div>
 <p className="text-lg font-semibold text-secondary mb-1">No newsletters sent yet</p>
 <p className="text-sm text-secondary">Your send history will appear here</p>
 </div>
 )}
 </div>
 </div>
 </CardContent>
 </CollapsibleContent>
 </Surface>
 </Collapsible>

 {/* Smart Contract Management Section (Collapsible) */}
 <Collapsible open={contractsOpen} onOpenChange={setContractsOpen}>
 <Surface className="neural-glass gradient-border-hot overflow-hidden">
 <CollapsibleTrigger className="w-full">
 <CardHeader className="cursor-pointer hover:bg-ink-raised transition-all duration-300">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-xl bg-ink-surface glow-pulse">
 <Coins className="w-6 h-6 text-primary" />
 </div>
 <div className="text-left">
 <CardTitle className="text-xl bg-ink-surface bg-clip-text text-transparent">
 Smart Contract Management
 </CardTitle>
 <CardDescription className="text-secondary">
 Manage STREAM tokens and Base network contracts
 </CardDescription>
 </div>
 </div>
 <div className="flex items-center gap-3">
 {walletConnected && (
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-core/10 border border-accent-core">
 <div className="w-2 h-2 rounded-full bg-accent-core/10 animate-pulse" />
 <span className="text-sm font-semibold text-accent-bright">
 Connected
 </span>
 </div>
 )}
 <div className="p-2 rounded-xl bg-accent-core/10 border border-accent-core">
 {contractsOpen ? (
 <ChevronUp className="w-5 h-5 text-accent-bright" />
 ) : (
 <ChevronDown className="w-5 h-5 text-accent-bright" />
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
 <div className="p-6 rounded-full bg-ink-surface border-2 border-accent-core mb-6">
 <Wallet className="w-12 h-12 text-accent-bright" />
 </div>
 <h3 className="text-xl font-bold text-primary mb-2">Connect Your Wallet</h3>
 <p className="text-secondary text-center mb-6 max-w-md">
 Connect to Base Sepolia testnet to manage smart contracts and distribute STREAM tokens to AI agents
 </p>
 <Button
 onClick={handleConnectWallet}
 className="grad-accent text-primary font-semibold px-8 py-6 text-lg"
 data-testid="button-connect-wallet"
 >
 <Wallet className="w-5 h-5 mr-2" />
 Connect MetaMask
 </Button>
 </div>
 ) : (
 <>
 {/* Wallet Info */}
 <div className="p-6 rounded-xl bg-ink-surface border-2 border-accent-core">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-bold text-primary flex items-center gap-2">
 <Wallet className="w-5 h-5 text-accent-bright" />
 Connected Wallet
 </h3>
 <Button
 onClick={handleDisconnectWallet}
 variant="outline"
 size="sm"
 className="border-loss hover:border-loss/60 hover:bg-loss/10 text-loss"
 data-testid="button-disconnect-wallet"
 >
 Disconnect
 </Button>
 </div>
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 rounded-xl bg-ink-surface">
 <span className="text-sm text-secondary">Address</span>
 <div className="flex items-center gap-2">
 <code className="text-sm text-accent-bright font-mono">{formatAddress(walletAddress)}</code>
 <Button
 onClick={() => handleCopyAddress(walletAddress)}
 variant="ghost"
 size="sm"
 className="h-6 w-6 p-0"
 data-testid="button-copy-address"
 >
 <Copy className="w-3 h-3 text-secondary hover:text-white" />
 </Button>
 </div>
 </div>
 <div className="flex items-center justify-between p-3 rounded-xl bg-ink-surface">
 <span className="text-sm text-secondary">Network</span>
 <span className="text-sm text-accent-bright font-semibold">
 {chainId === 84532 ? 'Base Sepolia' : chainId === 8453 ? 'Base Mainnet' : 'Unknown'}
 </span>
 </div>
 <div className="flex items-center justify-between p-3 rounded-xl bg-ink-surface">
 <span className="text-sm text-secondary">STREAM Balance</span>
 <span className="text-sm text-accent-bright font-semibold">
 {formatTokenAmount(streamBalance)} STREAM
 </span>
 </div>
 </div>
 </div>

 {/* Contract Stats */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-6 rounded-xl bg-ink-surface border-2 border-accent-core">
 <div className="flex items-center gap-3 mb-2">
 <Coins className="w-5 h-5 text-accent-bright" />
 <h4 className="font-semibold text-primary">Total Supply</h4>
 </div>
 <div className="text-3xl font-bold text-accent-bright">
 {formatTokenAmount(totalSupply)}
 </div>
 <div className="text-xs text-secondary mt-1">STREAM tokens</div>
 </div>
 
 <div className="p-6 rounded-xl bg-ink-surface border-2 border-accent-core">
 <div className="flex items-center gap-3 mb-2">
 <Users className="w-5 h-5 text-accent-bright" />
 <h4 className="font-semibold text-primary">AI Agents</h4>
 </div>
 <div className="text-3xl font-bold text-accent-bright">
 {aiAgents?.agents?.length || 100}
 </div>
 <div className="text-xs text-secondary mt-1">Ready for distribution</div>
 </div>
 </div>

 {/* Contract Addresses */}
 <div className="p-6 rounded-xl bg-ink-surface border border-accent-core">
 <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
 <ExternalLink className="w-5 h-5 text-accent-bright" />
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
 <div key={contract.name} className="flex items-center justify-between p-3 rounded-xl bg-ink-surface hover:bg-ink-raised transition-colors">
 <span className="text-sm text-secondary font-medium">{contract.name}</span>
 <div className="flex items-center gap-2">
 <code className="text-xs text-accent-bright font-mono">{formatAddress(contract.address)}</code>
 <Button
 onClick={() => handleCopyAddress(contract.address)}
 variant="ghost"
 size="sm"
 className="h-6 w-6 p-0"
 data-testid={`button-copy-${contract.name.toLowerCase().replace(' ', '-')}`}
 >
 <Copy className="w-3 h-3 text-secondary hover:text-white" />
 </Button>
 <a
 href={`https://sepolia.basescan.org/address/${contract.address}`}
 target="_blank"
 rel="noopener noreferrer"
 className="h-6 w-6 p-0 flex items-center justify-center hover:bg-ink-raised rounded transition-colors"
 >
 <ExternalLink className="w-3 h-3 text-secondary hover:text-accent-bright" />
 </a>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* AI Agent Token Distribution */}
 <div className="p-6 rounded-xl bg-ink-surface border-2 border-warn">
 <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
 <Bot className="w-5 h-5 text-warn" />
 Distribute STREAM to AI Agents
 </h3>
 <div className="space-y-4">
 <div>
 <Label htmlFor="distribution-amount" className="text-sm text-warn mb-2 block">
 Amount per Agent (STREAM)
 </Label>
 <Input
 id="distribution-amount"
 type="number"
 value={distributionAmount}
 onChange={(e) => setDistributionAmount(e.target.value)}
 placeholder="1000"
 className="bg-ink-surface border-warn text-primary"
 data-testid="input-distribution-amount"
 />
 </div>
 <div className="p-3 rounded-xl bg-warn/10 border border-warn">
 <div className="flex items-center justify-between text-sm">
 <span className="text-warn">Total Distribution:</span>
 <span className="text-warn font-bold">
 {(parseFloat(distributionAmount) * 100).toLocaleString()} STREAM
 </span>
 </div>
 </div>
 <Button
 disabled
 className="w-full grad-accent text-primary font-semibold"
 data-testid="button-distribute-tokens"
 >
 <Coins className="w-4 h-4 mr-2" />
 Distribute to 100 AI Agents (Coming Soon)
 </Button>
 <p className="text-xs text-warn text-center">
 This will send {distributionAmount} STREAM to each of the 100 AI agents on the platform
 </p>
 </div>
 </div>
 </>
 )}
 </CardContent>
 </CollapsibleContent>
 </Surface>
 </Collapsible>
 </div>
 </div>
 );
}
