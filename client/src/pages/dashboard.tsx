import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  FileText, 
  Gift, 
  Heart, 
  Bookmark, 
  Share, 
  Eye, 
  Plus, 
  Settings,
  Wallet,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { getAuthHeaders } from '@/lib/auth';
import { Navigation } from '@/components/ui/navigation';

interface Summary {
  id: string;
  title: string;
  description?: string;
  originalUrl: string;
  contentType: string;
  platform: string;
  processingStatus: string;
  accuracy?: number;
  createdAt: string;
  tags?: string[];
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
  reward: number;
  status: string;
  deadline?: string;
  createdAt: string;
  tags?: string[];
}

interface Interaction {
  id: string;
  summaryId: string;
  interactionType: string;
  createdAt: string;
  metadata?: any;
}

export default function Dashboard() {
  const { user, stats, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user's summaries
  const { data: summaries = [] } = useQuery({
    queryKey: ['user-summaries', user?.id],
    queryFn: () =>
      fetch(`/api/users/${user?.id}/summaries`, {
        headers: getAuthHeaders(),
      }).then(res => res.json()).then(data => data.summaries),
    enabled: !!user,
  });

  // Fetch user's bounties
  const { data: bounties = [] } = useQuery({
    queryKey: ['user-bounties', user?.id],
    queryFn: () =>
      fetch(`/api/users/${user?.id}/bounties`, {
        headers: getAuthHeaders(),
      }).then(res => res.json()).then(data => data.bounties),
    enabled: !!user,
  });

  // Fetch user's interactions
  const { data: interactions = [] } = useQuery({
    queryKey: ['user-interactions'],
    queryFn: () =>
      fetch('/api/users/me/interactions', {
        headers: getAuthHeaders(),
      }).then(res => res.json()).then(data => data.interactions),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">Please sign in to view your dashboard</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'pending':
        return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-400/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-purple-400">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm sm:text-lg">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{user.username}</h1>
              {user.bio && <p className="text-slate-300 text-sm sm:text-base">{user.bio}</p>}
              {user.walletAddress && (
                <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-400">
                  <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {user.ensName || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/wallet-dashboard">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-purple-400/50 bg-purple-500/20 text-white hover:bg-purple-500/30 hover:border-purple-400 text-xs sm:text-sm"
                onClick={() => {
                  console.log('Wallet button clicked');
                  window.location.href = '/wallet-dashboard';
                }}
              >
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Wallet</span>
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="border-slate-400/50 bg-slate-500/20 text-white hover:bg-slate-500/30 hover:border-slate-400 text-xs sm:text-sm">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Summaries</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats?.summariesCount || 0}</p>
                  </div>
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Bounties</p>
                    <p className="text-2xl font-bold text-white">{stats?.bountiesCount || 0}</p>
                  </div>
                  <Gift className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Interactions</p>
                    <p className="text-2xl font-bold text-white">{stats?.interactionsCount || 0}</p>
                  </div>
                  <Heart className="w-8 h-8 text-pink-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Knowledge Stacks</p>
                    <p className="text-2xl font-bold text-white">{stats?.stacksCount || 0}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card className="backdrop-blur-lg bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Your Dashboard</CardTitle>
            <CardDescription className="text-slate-300">
              Manage your summaries, bounties, and interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-white/10">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="summaries" className="data-[state=active]:bg-white/20">
                  Summaries
                </TabsTrigger>
                <TabsTrigger value="bounties" className="data-[state=active]:bg-white/20">
                  Bounties
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-white/20">
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Summaries */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white text-lg">Recent Summaries</CardTitle>
                      <Link href="/create">
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/20">
                          <Plus className="w-4 h-4 mr-2" />
                          New Summary
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent>
                      {summaries.slice(0, 3).map((summary: Summary) => (
                        <div key={summary.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                          <div className="flex-1">
                            <p className="text-white font-medium truncate">{summary.title}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(summary.processingStatus)}>
                                {summary.processingStatus}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                {new Date(summary.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {summaries.length === 0 && (
                        <p className="text-slate-400 text-center py-8">
                          No summaries yet. Create your first one!
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Bounties */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white text-lg">Recent Bounties</CardTitle>
                      <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/20">
                        <Plus className="w-4 h-4 mr-2" />
                        New Bounty
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {bounties.slice(0, 3).map((bounty: Bounty) => (
                        <div key={bounty.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                          <div className="flex-1">
                            <p className="text-white font-medium truncate">{bounty.title}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                                {bounty.reward} STREAM
                              </Badge>
                              <Badge className={getStatusColor(bounty.status)}>
                                {bounty.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {bounties.length === 0 && (
                        <p className="text-slate-400 text-center py-8">
                          No bounties created yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="summaries" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white text-lg font-semibold">Your Summaries</h3>
                    <Link href="/create">
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Summary
                      </Button>
                    </Link>
                  </div>
                  <div className="grid gap-4">
                    {summaries.map((summary: Summary) => (
                      <Card key={summary.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold mb-2">{summary.title}</h4>
                              {summary.description && (
                                <p className="text-slate-300 text-sm mb-3 line-clamp-2">{summary.description}</p>
                              )}
                              <div className="flex items-center space-x-3 text-sm text-slate-400">
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(summary.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <Zap className="w-4 h-4 mr-1" />
                                  {summary.platform}
                                </span>
                                {summary.accuracy && (
                                  <span className="flex items-center">
                                    <BarChart3 className="w-4 h-4 mr-1" />
                                    {summary.accuracy}% accuracy
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge className={getStatusColor(summary.processingStatus)}>
                                {summary.processingStatus}
                              </Badge>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" className="border-white/20 text-white">
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="border-white/20 text-white">
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bounties" className="mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white text-lg font-semibold">Your Bounties</h3>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Bounty
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {bounties.map((bounty: Bounty) => (
                      <Card key={bounty.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold mb-2">{bounty.title}</h4>
                              <p className="text-slate-300 text-sm mb-3 line-clamp-2">{bounty.description}</p>
                              <div className="flex items-center space-x-3 text-sm text-slate-400">
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(bounty.createdAt).toLocaleDateString()}
                                </span>
                                {bounty.deadline && (
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    Due: {new Date(bounty.deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                                {bounty.reward} STREAM
                              </Badge>
                              <Badge className={getStatusColor(bounty.status)}>
                                {bounty.status}
                              </Badge>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" className="border-white/20 text-white">
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="border-white/20 text-white">
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-white text-lg font-semibold">Recent Activity</h3>
                  <div className="space-y-3">
                    {interactions.map((interaction: Interaction) => (
                      <Card key={interaction.id} className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            {interaction.interactionType === 'like' && <Heart className="w-5 h-5 text-pink-400" />}
                            {interaction.interactionType === 'bookmark' && <Bookmark className="w-5 h-5 text-blue-400" />}
                            {interaction.interactionType === 'share' && <Share className="w-5 h-5 text-green-400" />}
                            {interaction.interactionType === 'view' && <Eye className="w-5 h-5 text-slate-400" />}
                            <div className="flex-1">
                              <p className="text-white text-sm">
                                You {interaction.interactionType}d a summary
                              </p>
                              <p className="text-slate-400 text-xs">
                                {new Date(interaction.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {interactions.length === 0 && (
                      <p className="text-slate-400 text-center py-8">
                        No recent activity.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}