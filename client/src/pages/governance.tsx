import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation } from '@/components/ui/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Vote as VoteIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  proposerUsername?: string;
  proposerAvatar?: string;
  proposerEnsName?: string;
  proposerAddress?: string;
  category: 'PROTOCOL' | 'TREASURY' | 'GOVERNANCE' | 'COMMUNITY' | 'TECHNICAL';
  status: 'DRAFT' | 'ACTIVE' | 'SUCCEEDED' | 'FAILED' | 'EXECUTED' | 'CANCELLED';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorumRequired: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface Vote {
  id: string;
  proposalId: string;
  voterId: string;
  support: 'FOR' | 'AGAINST' | 'ABSTAIN';
  votingPower: number;
  reason?: string;
  createdAt: string;
  proposalTitle?: string;
  proposalStatus?: string;
}

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  participationRate: number;
  successRate: number;
}

export default function GovernancePage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteReason, setVoteReason] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: '', description: '', category: 'COMMUNITY' });

  // Fetch proposals (public, no auth required)
  const { data: proposalsData, isLoading: isLoadingProposals } = useQuery<{ proposals: Proposal[] }>({
    queryKey: ['/api/governance/proposals'],
    staleTime: 30000,
  });

  // Fetch governance stats
  const { data: statsData } = useQuery<{ stats: GovernanceStats }>({
    queryKey: ['/api/governance/stats'],
    staleTime: 60000,
  });

  // Fetch user's voting history (only if authenticated)
  const { data: votesData } = useQuery<{ votes: Vote[] }>({
    queryKey: ['/api/governance/my-votes'],
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const proposals = proposalsData?.proposals || [];
  const stats = statsData?.stats;
  const votingHistory = votesData?.votes || [];

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string }) => {
      return apiRequest('/api/governance/proposals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/stats'] });
      setIsCreateOpen(false);
      setNewProposal({ title: '', description: '', category: 'COMMUNITY' });
      toast({
        title: 'Proposal Created',
        description: 'Your proposal has been submitted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create proposal',
        variant: 'destructive',
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, support, reason }: { proposalId: string; support: string; reason?: string }) => {
      return apiRequest(`/api/governance/proposals/${proposalId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ support, reason }),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/my-votes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/stats'] });
      setVoteReason('');
      toast({
        title: 'Vote Submitted',
        description: `Your vote has been recorded with ${data.votingPower} voting power.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Voting Failed',
        description: error.message || 'Failed to submit vote',
        variant: 'destructive',
      });
    },
  });

  const handleVote = (proposalId: string, support: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    voteMutation.mutate({ proposalId, support, reason: voteReason });
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'SUCCEEDED': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'FAILED': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'EXECUTED': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: Proposal['category']) => {
    switch (category) {
      case 'PROTOCOL': return 'bg-blue-500/20 text-blue-300';
      case 'TREASURY': return 'bg-green-500/20 text-green-300';
      case 'GOVERNANCE': return 'bg-purple-500/20 text-purple-300';
      case 'COMMUNITY': return 'bg-yellow-500/20 text-yellow-300';
      case 'TECHNICAL': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Voting ended';
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getVotingProgress = (proposal: Proposal) => {
    const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
    return {
      forPercentage: totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0,
      againstPercentage: totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0,
      abstainPercentage: totalVotes > 0 ? (proposal.votesAbstain / totalVotes) * 100 : 0,
      quorumProgress: (totalVotes / proposal.quorumRequired) * 100,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        {/* Header Section - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-1 sm:mb-2">
                DAO Governance
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">Participate in community-driven decisions</p>
            </div>
            {isAuthenticated ? (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500"
                    data-testid="button-create-proposal"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Proposal
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-purple-500/30 text-white max-w-[95vw] sm:max-w-lg mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white text-lg">Create New Proposal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-white text-sm">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter proposal title..."
                        value={newProposal.title}
                        onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                        className="bg-purple-900/20 border-purple-500/30 text-white mt-2"
                        data-testid="input-proposal-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-white text-sm">Category</Label>
                      <Select
                        value={newProposal.category}
                        onValueChange={(v) => setNewProposal({ ...newProposal, category: v })}
                      >
                        <SelectTrigger className="bg-purple-900/20 border-purple-500/30 text-white mt-2">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-purple-500/30">
                          <SelectItem value="PROTOCOL">Protocol</SelectItem>
                          <SelectItem value="TREASURY">Treasury</SelectItem>
                          <SelectItem value="GOVERNANCE">Governance</SelectItem>
                          <SelectItem value="COMMUNITY">Community</SelectItem>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-white text-sm">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your proposal in detail..."
                        value={newProposal.description}
                        onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                        className="bg-purple-900/20 border-purple-500/30 text-white mt-2 min-h-[100px] sm:min-h-[120px]"
                        data-testid="input-proposal-description"
                      />
                    </div>
                    <Button
                      onClick={() => createProposalMutation.mutate(newProposal)}
                      disabled={createProposalMutation.isPending || !newProposal.title || !newProposal.description}
                      className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:opacity-90"
                      data-testid="button-submit-proposal"
                    >
                      {createProposalMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Submit Proposal'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                onClick={() => toast({ title: 'Sign In Required', description: 'Please sign in to create proposals' })}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            )}
          </div>
        </motion.div>

        {/* Governance Stats - Mobile Optimized Grid */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8"
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-white text-xs sm:text-sm font-medium">Active Proposals</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.activeProposals}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">of {stats.totalProposals} total</p>
                  </div>
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-fuchsia-400 hidden xs:block" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-white text-xs sm:text-sm font-medium">Participation</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{(stats.participationRate * 100).toFixed(1)}%</p>
                    <p className="text-cyan-400 text-xs sm:text-sm">of users</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400 hidden xs:block" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-white text-xs sm:text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{(stats.successRate * 100).toFixed(1)}%</p>
                    <p className="text-purple-400 text-xs sm:text-sm">passed</p>
                  </div>
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 hidden xs:block" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-white text-xs sm:text-sm font-medium">Total Voters</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalVoters.toLocaleString()}</p>
                    <p className="text-fuchsia-400 text-xs sm:text-sm">members</p>
                  </div>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-fuchsia-400 hidden xs:block" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs - Mobile Optimized */}
        <Tabs defaultValue="proposals" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full sm:w-auto bg-gradient-to-r from-purple-900/20 to-purple-800/10 border border-purple-500/30 grid grid-cols-2 sm:flex">
            <TabsTrigger 
              value="proposals" 
              className="text-white text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-fuchsia-500 data-[state=active]:to-cyan-500" 
              data-testid="tab-proposals"
            >
              <VoteIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Proposals
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="text-white text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-fuchsia-500 data-[state=active]:to-cyan-500" 
              data-testid="tab-history"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              My Votes
            </TabsTrigger>
          </TabsList>

          {/* Active Proposals */}
          <TabsContent value="proposals" className="space-y-4 sm:space-y-6">
            {isLoadingProposals ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                    <CardContent className="p-4 sm:p-6">
                      <div className="animate-pulse space-y-3 sm:space-y-4">
                        <div className="h-5 sm:h-6 bg-purple-500/20 rounded w-3/4"></div>
                        <div className="h-3 sm:h-4 bg-purple-500/20 rounded w-full"></div>
                        <div className="h-3 sm:h-4 bg-purple-500/20 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : proposals.length === 0 ? (
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                <CardContent className="p-6 sm:p-8 text-center">
                  <VoteIcon className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Proposals Yet</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Be the first to create a governance proposal!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {proposals.map((proposal, index) => {
                  const progress = getVotingProgress(proposal);
                  return (
                    <motion.div
                      key={proposal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg hover:from-purple-900/30 hover:to-purple-800/20 transition-all duration-300" data-testid={`card-proposal-${proposal.id}`}>
                        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                          <div className="flex flex-col gap-2">
                            {/* Title */}
                            <h3 className="text-white text-base sm:text-lg font-semibold leading-tight">
                              {proposal.title}
                            </h3>
                            
                            {/* Badges Row */}
                            <div className="flex flex-wrap gap-2">
                              <Badge className={`${getStatusColor(proposal.status)} text-xs`}>
                                {proposal.status}
                              </Badge>
                              <Badge className={`${getCategoryColor(proposal.category)} text-xs`}>
                                {proposal.category}
                              </Badge>
                            </div>
                            
                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                              <span>by @{proposal.proposerUsername || 'anonymous'}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatTimeRemaining(proposal.endTime)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-2 sm:mt-3">
                            {proposal.description.length > 150 
                              ? proposal.description.slice(0, 150) + '...' 
                              : proposal.description
                            }
                          </p>
                        </CardHeader>
                        
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                          {/* Voting Progress */}
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-400">Voting Progress</span>
                              <span className="text-white text-xs sm:text-sm">
                                Quorum: {progress.quorumProgress.toFixed(0)}%
                              </span>
                            </div>
                            
                            {/* For Votes */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-green-400 text-xs sm:text-sm flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  <span className="hidden xs:inline">For</span> ({progress.forPercentage.toFixed(0)}%)
                                </span>
                                <span className="text-green-400 text-xs sm:text-sm">
                                  {proposal.votesFor.toLocaleString()}
                                </span>
                              </div>
                              <Progress value={progress.forPercentage} className="h-1.5 sm:h-2 bg-white/10" />
                            </div>

                            {/* Against Votes */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-red-400 text-xs sm:text-sm flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  <span className="hidden xs:inline">Against</span> ({progress.againstPercentage.toFixed(0)}%)
                                </span>
                                <span className="text-red-400 text-xs sm:text-sm">
                                  {proposal.votesAgainst.toLocaleString()}
                                </span>
                              </div>
                              <Progress value={progress.againstPercentage} className="h-1.5 sm:h-2 bg-white/10" />
                            </div>

                            {/* Abstain Votes - Only show if there are any */}
                            {progress.abstainPercentage > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="hidden xs:inline">Abstain</span> ({progress.abstainPercentage.toFixed(0)}%)
                                  </span>
                                  <span className="text-gray-400 text-xs sm:text-sm">
                                    {proposal.votesAbstain.toLocaleString()}
                                  </span>
                                </div>
                                <Progress value={progress.abstainPercentage} className="h-1.5 sm:h-2 bg-white/10" />
                              </div>
                            )}
                          </div>

                          {/* Voting Actions - Mobile Optimized */}
                          {proposal.status === 'ACTIVE' && (
                            <div className="pt-3 sm:pt-4 border-t border-white/10">
                              {isAuthenticated ? (
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:opacity-90 text-xs sm:text-sm"
                                        onClick={() => setSelectedProposal(proposal)}
                                        data-testid={`button-vote-for-${proposal.id}`}
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Vote For
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-950 border-purple-500/30 text-white max-w-[95vw] sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="text-white">Vote For Proposal</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p className="text-gray-300 text-sm">
                                          You are voting <strong className="text-fuchsia-400">FOR</strong> this proposal.
                                        </p>
                                        <div>
                                          <Label htmlFor="reason" className="text-white text-sm">
                                            Reason (Optional)
                                          </Label>
                                          <Textarea
                                            id="reason"
                                            placeholder="Explain why you support this proposal..."
                                            value={voteReason}
                                            onChange={(e) => setVoteReason(e.target.value)}
                                            className="bg-purple-900/20 border-purple-500/30 text-white mt-2 min-h-[80px]"
                                          />
                                        </div>
                                        <DialogClose asChild>
                                          <Button
                                            onClick={() => handleVote(proposal.id, 'FOR')}
                                            disabled={voteMutation.isPending}
                                            className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:opacity-90"
                                          >
                                            {voteMutation.isPending ? (
                                              <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting...
                                              </>
                                            ) : (
                                              'Submit Vote'
                                            )}
                                          </Button>
                                        </DialogClose>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 sm:flex-none border-purple-500/30 text-purple-300 hover:bg-purple-900/20 text-xs sm:text-sm"
                                        onClick={() => setSelectedProposal(proposal)}
                                        data-testid={`button-vote-against-${proposal.id}`}
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Vote Against
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-950 border-purple-500/30 text-white max-w-[95vw] sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="text-white">Vote Against Proposal</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p className="text-gray-300 text-sm">
                                          You are voting <strong className="text-purple-400">AGAINST</strong> this proposal.
                                        </p>
                                        <div>
                                          <Label htmlFor="reason-against" className="text-white text-sm">
                                            Reason (Optional)
                                          </Label>
                                          <Textarea
                                            id="reason-against"
                                            placeholder="Explain why you oppose this proposal..."
                                            value={voteReason}
                                            onChange={(e) => setVoteReason(e.target.value)}
                                            className="bg-purple-900/20 border-purple-500/30 text-white mt-2 min-h-[80px]"
                                          />
                                        </div>
                                        <DialogClose asChild>
                                          <Button
                                            onClick={() => handleVote(proposal.id, 'AGAINST')}
                                            disabled={voteMutation.isPending}
                                            className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:opacity-90"
                                          >
                                            {voteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
                                          </Button>
                                        </DialogClose>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="flex-1 sm:flex-none text-gray-400 hover:bg-purple-900/20 text-xs sm:text-sm"
                                    onClick={() => handleVote(proposal.id, 'ABSTAIN')}
                                    disabled={voteMutation.isPending}
                                    data-testid={`button-abstain-${proposal.id}`}
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Abstain
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
                                  Sign in to vote on this proposal
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Voting History - Mobile Optimized */}
          <TabsContent value="history" className="space-y-4 sm:space-y-6">
            {!isAuthenticated ? (
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                <CardContent className="p-6 sm:p-8 text-center">
                  <Users className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Sign In Required</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Please sign in to view your voting history.</p>
                </CardContent>
              </Card>
            ) : votingHistory.length === 0 ? (
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                <CardContent className="p-6 sm:p-8 text-center">
                  <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Votes Yet</h3>
                  <p className="text-gray-400 text-sm sm:text-base">You haven't voted on any proposals yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {votingHistory.map((vote, index) => (
                  <motion.div
                    key={vote.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-lg">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm sm:text-base truncate">
                              {vote.proposalTitle}
                            </h4>
                            <p className="text-gray-400 text-xs sm:text-sm">
                              Voted on {new Date(vote.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <Badge className={`text-xs ${
                              vote.support === 'FOR' 
                                ? 'bg-green-500/20 text-green-300' 
                                : vote.support === 'AGAINST'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {vote.support}
                            </Badge>
                            <span className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                              {vote.votingPower} power
                            </span>
                          </div>
                        </div>
                        {vote.reason && (
                          <p className="text-gray-300 text-xs sm:text-sm mt-2 italic line-clamp-2">
                            "{vote.reason}"
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
