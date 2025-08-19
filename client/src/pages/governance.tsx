import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Navigation } from '@/components/ui/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { governanceManager, type Proposal, type Vote, type GovernanceStats } from '@/lib/governance';
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
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function GovernancePage() {
  const { isAuthenticated } = useAuth();
  const { wallet, isConnected } = useWeb3();
  const { toast } = useToast();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votingHistory, setVotingHistory] = useState<Vote[]>([]);
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteReason, setVoteReason] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    loadGovernanceData();
  }, [isConnected]);

  const loadGovernanceData = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const [proposalsData, statsData, historyData] = await Promise.all([
        governanceManager.getActiveProposals(),
        governanceManager.getGovernanceStats(),
        wallet ? governanceManager.getVotingHistory(wallet.address) : Promise.resolve([])
      ]);

      setProposals(proposalsData);
      setStats(statsData);
      setVotingHistory(historyData);
    } catch (error) {
      console.error('Error loading governance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load governance data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (proposalId: string, support: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    if (!wallet) return;

    setIsVoting(true);
    try {
      const txHash = await governanceManager.vote(proposalId, support, voteReason);
      
      toast({
        title: 'Vote Submitted',
        description: `Your ${support.toLowerCase()} vote has been submitted successfully`,
      });

      // Reload proposals to update vote counts
      setTimeout(loadGovernanceData, 2000);
      setVoteReason('');
    } catch (error: any) {
      toast({
        title: 'Voting Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVoting(false);
    }
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

  const formatTimeRemaining = (endTime: number) => {
    const remaining = governanceManager.getTimeRemaining(endTime);
    if (remaining.isExpired) return 'Voting ended';
    
    if (remaining.days > 0) return `${remaining.days}d ${remaining.hours}h left`;
    if (remaining.hours > 0) return `${remaining.hours}h ${remaining.minutes}m left`;
    return `${remaining.minutes}m left`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Governance Access Required</h2>
              <p className="text-gray-300 mb-6">Please sign in to participate in DAO governance.</p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">DAO Governance</h1>
              <p className="text-gray-400">Participate in community-driven decisions</p>
            </div>
            <Button
              onClick={() => toast({ title: 'Coming Soon', description: 'Proposal creation will be available soon' })}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          </div>
        </motion.div>

        {/* Governance Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium">Active Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.activeProposals}</p>
                    <p className="text-gray-400 text-sm">of {stats.totalProposals} total</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium">Participation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{(stats.participationRate * 100).toFixed(1)}%</p>
                    <p className="text-green-400 text-sm">+5.2% vs last month</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{(stats.successRate * 100).toFixed(1)}%</p>
                    <p className="text-purple-400 text-sm">9 of 12 passed</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium">Total Voters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalVoters.toLocaleString()}</p>
                    <p className="text-yellow-400 text-sm">Community members</p>
                  </div>
                  <Users className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="proposals" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="proposals" className="text-white data-[state=active]:bg-purple-600">
              <VoteIcon className="h-4 w-4 mr-2" />
              Proposals
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white data-[state=active]:bg-purple-600">
              <Clock className="h-4 w-4 mr-2" />
              My Votes
            </TabsTrigger>
          </TabsList>

          {/* Active Proposals */}
          <TabsContent value="proposals" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {proposals.map((proposal, index) => {
                  const progress = governanceManager.getVotingProgress(proposal);
                  return (
                    <motion.div
                      key={proposal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="bg-white/10 border-white/20 backdrop-blur-lg hover:bg-white/15 transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-white text-lg font-semibold">{proposal.title}</h3>
                                <Badge className={getStatusColor(proposal.status)}>
                                  {proposal.status}
                                </Badge>
                                <Badge className={getCategoryColor(proposal.category)}>
                                  {proposal.category}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                <span>by {proposal.proposerEnsName || proposal.proposer.slice(0, 8) + '...'}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatTimeRemaining(proposal.endTime)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {proposal.description.length > 200 
                              ? proposal.description.slice(0, 200) + '...' 
                              : proposal.description
                            }
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Voting Progress */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Voting Progress</span>
                              <span className="text-white">
                                Quorum: {progress.quorumProgress.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-green-400 text-sm flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3" />
                                  For ({progress.forPercentage.toFixed(1)}%)
                                </span>
                                <span className="text-green-400 text-sm">
                                  {parseFloat(proposal.votesFor).toLocaleString()} votes
                                </span>
                              </div>
                              <Progress value={progress.forPercentage} className="h-2 bg-white/10" />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-red-400 text-sm flex items-center gap-2">
                                  <XCircle className="h-3 w-3" />
                                  Against ({progress.againstPercentage.toFixed(1)}%)
                                </span>
                                <span className="text-red-400 text-sm">
                                  {parseFloat(proposal.votesAgainst).toLocaleString()} votes
                                </span>
                              </div>
                              <Progress value={progress.againstPercentage} className="h-2 bg-white/10" />
                            </div>

                            {progress.abstainPercentage > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="h-3 w-3" />
                                    Abstain ({progress.abstainPercentage.toFixed(1)}%)
                                  </span>
                                  <span className="text-gray-400 text-sm">
                                    {parseFloat(proposal.votesAbstain).toLocaleString()} votes
                                  </span>
                                </div>
                                <Progress value={progress.abstainPercentage} className="h-2 bg-white/10" />
                              </div>
                            )}
                          </div>

                          {/* Voting Actions */}
                          {proposal.status === 'ACTIVE' && isConnected && (
                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => setSelectedProposal(proposal)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Vote For
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-white/20 text-white">
                                  <DialogHeader>
                                    <DialogTitle>Vote For Proposal</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-gray-300">
                                      You are voting <strong className="text-green-400">FOR</strong> this proposal.
                                    </p>
                                    <div>
                                      <Label htmlFor="reason" className="text-white">
                                        Reason (Optional)
                                      </Label>
                                      <Textarea
                                        id="reason"
                                        placeholder="Explain why you support this proposal..."
                                        value={voteReason}
                                        onChange={(e) => setVoteReason(e.target.value)}
                                        className="bg-white/5 border-white/20 text-white mt-2"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => handleVote(proposal.id, 'FOR')}
                                      disabled={isVoting}
                                      className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                      {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                                    onClick={() => setSelectedProposal(proposal)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Vote Against
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-white/20 text-white">
                                  <DialogHeader>
                                    <DialogTitle>Vote Against Proposal</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-gray-300">
                                      You are voting <strong className="text-red-400">AGAINST</strong> this proposal.
                                    </p>
                                    <div>
                                      <Label htmlFor="reason-against" className="text-white">
                                        Reason (Optional)
                                      </Label>
                                      <Textarea
                                        id="reason-against"
                                        placeholder="Explain why you oppose this proposal..."
                                        value={voteReason}
                                        onChange={(e) => setVoteReason(e.target.value)}
                                        className="bg-white/5 border-white/20 text-white mt-2"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => handleVote(proposal.id, 'AGAINST')}
                                      disabled={isVoting}
                                      className="w-full bg-red-600 hover:bg-red-700"
                                    >
                                      {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:bg-white/5"
                                onClick={() => handleVote(proposal.id, 'ABSTAIN')}
                                disabled={isVoting}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Abstain
                              </Button>
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

          {/* Voting History */}
          <TabsContent value="history" className="space-y-6">
            {votingHistory.length === 0 ? (
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-8 text-center">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">No Voting History</h3>
                  <p className="text-gray-400">
                    You haven't participated in any governance votes yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {votingHistory.map((vote, index) => (
                  <motion.div
                    key={`${vote.proposalId}-${vote.timestamp}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              vote.support === 'FOR' 
                                ? 'bg-green-500/20 text-green-400' 
                                : vote.support === 'AGAINST'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {vote.support === 'FOR' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : vote.support === 'AGAINST' ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                Proposal #{vote.proposalId} - Voted {vote.support}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {vote.reason || 'No reason provided'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">
                              {parseFloat(vote.votingPower).toLocaleString()} votes
                            </div>
                            <div className="text-gray-400 text-sm">
                              {new Date(vote.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
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