import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock, Coins, Medal, Crown, ArrowRight, ArrowLeft, Plus, TrendingUp, Target, Zap, Calendar, DollarSign, Timer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow, format, differenceInDays, differenceInHours } from 'date-fns';

interface League {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  entryFee: number;
  maxParticipants: number | null;
  minTrades: number;
  prizePool: number;
  prizeDistribution: { rank: number; percentage: number }[];
  leagueType: string;
  status: string;
  totalParticipants: number;
  totalVolume: number;
  creatorId: string | null;
}

interface LeagueParticipant {
  id: string;
  leagueId: string;
  userId: string;
  totalTrades: number;
  totalVolume: number;
  netProfit: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  roi: number;
  currentRank: number | null;
  finalRank: number | null;
  prizeWon: number;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    isAiAgent?: boolean;
  } | null;
  rank?: number;
}

interface ActiveLeaguesResponse {
  active: League[];
  upcoming: League[];
  recentCompleted: League[];
}

function getTimeRemaining(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const days = differenceInDays(end, now);
  const hours = differenceInHours(end, now) % 24;
  
  if (days > 0) {
    return `${days}d ${hours}h left`;
  } else if (hours > 0) {
    return `${hours}h left`;
  } else {
    return 'Ending soon';
  }
}

function getTimeUntilStart(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  const days = differenceInDays(start, now);
  const hours = differenceInHours(start, now) % 24;
  
  if (days > 0) {
    return `Starts in ${days}d ${hours}h`;
  } else if (hours > 0) {
    return `Starts in ${hours}h`;
  } else {
    return 'Starting soon';
  }
}

function LeagueCard({ league, onJoin, isJoining }: { league: League; onJoin: (id: string) => void; isJoining: boolean }) {
  const [, setLocation] = useLocation();
  const isActive = league.status === 'active';
  const isUpcoming = league.status === 'upcoming';
  const fillPercent = league.maxParticipants 
    ? (league.totalParticipants / league.maxParticipants) * 100 
    : 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-slate-900/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm p-6 relative overflow-hidden cursor-pointer hover:border-purple-400/50 transition-all"
        onClick={() => setLocation(`/leagues/${league.id}`)}
        data-testid={`league-card-${league.id}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge 
                variant="outline" 
                className={`mb-2 ${isActive ? 'border-green-500/50 text-green-400' : isUpcoming ? 'border-amber-500/50 text-amber-400' : 'border-gray-500/50 text-gray-400'}`}
              >
                {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed'}
              </Badge>
              <h3 className="text-xl font-bold text-white mb-1">{league.name}</h3>
              {league.description && (
                <p className="text-sm text-gray-400 line-clamp-2">{league.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-400">
                <Trophy className="w-5 h-5" />
                <span className="font-bold text-lg">{league.prizePool.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500">STREAM Prize Pool</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-2 bg-slate-800/50 rounded-lg">
              <Users className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <p className="text-sm font-semibold text-white">
                {league.totalParticipants}{league.maxParticipants ? `/${league.maxParticipants}` : ''}
              </p>
              <p className="text-xs text-gray-500">Players</p>
            </div>
            <div className="text-center p-2 bg-slate-800/50 rounded-lg">
              <Coins className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
              <p className="text-sm font-semibold text-white">
                {league.entryFee > 0 ? league.entryFee.toLocaleString() : 'Free'}
              </p>
              <p className="text-xs text-gray-500">Entry Fee</p>
            </div>
            <div className="text-center p-2 bg-slate-800/50 rounded-lg">
              <Timer className="w-4 h-4 mx-auto mb-1 text-pink-400" />
              <p className="text-sm font-semibold text-white">
                {isActive ? getTimeRemaining(league.endDate) : isUpcoming ? getTimeUntilStart(league.startDate) : 'Ended'}
              </p>
              <p className="text-xs text-gray-500">{isActive ? 'Remaining' : isUpcoming ? 'Until Start' : 'Status'}</p>
            </div>
          </div>

          {league.maxParticipants && (
            <div className="mb-4">
              <Progress value={fillPercent} className="h-2 bg-slate-700" />
              <p className="text-xs text-gray-500 mt-1">{fillPercent.toFixed(0)}% full</p>
            </div>
          )}

          <div className="flex gap-2">
            {(isActive || isUpcoming) && (
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
                onClick={(e) => { e.stopPropagation(); onJoin(league.id); }}
                disabled={isJoining}
                data-testid={`join-league-${league.id}`}
              >
                {isJoining ? 'Joining...' : league.entryFee > 0 ? `Join (${league.entryFee} STREAM)` : 'Join Free'}
              </Button>
            )}
            <Button 
              variant="outline" 
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              onClick={(e) => { e.stopPropagation(); setLocation(`/leagues/${league.id}`); }}
              data-testid={`view-league-${league.id}`}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function LeaderboardRow({ participant, index }: { participant: LeagueParticipant & { rank: number }; index: number }) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-500/20' };
    if (rank === 3) return { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return null;
  };

  const rankStyle = getRankStyle(participant.rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-4 p-4 rounded-lg ${rankStyle ? rankStyle.bg : 'bg-slate-800/30'} border border-slate-700/50`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${rankStyle ? rankStyle.bg : 'bg-slate-700'}`}>
        {rankStyle ? (
          <rankStyle.icon className={`w-5 h-5 ${rankStyle.color}`} />
        ) : (
          <span className="text-gray-400">#{participant.rank}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center text-white font-bold">
          {participant.user?.avatar ? (
            <img src={participant.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            participant.user?.username?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div>
          <p className="font-semibold text-white flex items-center gap-2">
            {participant.user?.username || 'Unknown'}
            {participant.user?.isAiAgent && (
              <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">AI</Badge>
            )}
          </p>
          <p className="text-xs text-gray-500">{participant.totalTrades} trades</p>
        </div>
      </div>

      <div className="text-right">
        <p className={`font-bold ${participant.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {participant.netProfit >= 0 ? '+' : ''}{participant.netProfit.toLocaleString()} STREAM
        </p>
        <p className="text-xs text-gray-500">
          {participant.winRate.toFixed(1)}% win rate
        </p>
      </div>
    </motion.div>
  );
}

export default function LeaguesPage() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState('active');
  const { toast } = useToast();

  const { data: leaguesData, isLoading } = useQuery<ActiveLeaguesResponse>({
    queryKey: ['/api/prediction-leagues/active'],
  });

  const { data: myParticipations } = useQuery<{ participations: any[] }>({
    queryKey: ['/api/prediction-leagues/my/participation'],
  });

  const joinMutation = useMutation({
    mutationFn: async (leagueId: string) => {
      return apiRequest(`/api/prediction-leagues/${leagueId}/join`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({
        title: "Joined League!",
        description: "You've successfully joined the prediction league. Good luck!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-leagues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-leagues/my/participation'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join",
        description: error.message || "Could not join the league. Please try again.",
        variant: "destructive",
      });
    },
  });

  const allLeagues = {
    active: leaguesData?.active || [],
    upcoming: leaguesData?.upcoming || [],
    completed: leaguesData?.recentCompleted || [],
  };

  const myLeagueIds = new Set(myParticipations?.participations?.map(p => p.leagueId) || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button 
                variant="ghost" 
                className="mb-3 text-gray-400 hover:text-white hover:bg-purple-500/20 -ml-2"
                onClick={() => setLocation('/markets')}
                data-testid="btn-back-to-markets"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Prediction Markets
              </Button>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 mb-2">
                Prediction Leagues
              </h1>
              <p className="text-gray-400">
                Compete with other traders in weekly competitions for STREAM rewards
              </p>
            </div>
            
            <Button 
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
              onClick={() => setLocation('/markets')}
              data-testid="btn-trade-now"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trade Now
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{allLeagues.active.length}</p>
                  <p className="text-sm text-gray-400">Active Leagues</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-amber-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{allLeagues.upcoming.length}</p>
                  <p className="text-sm text-gray-400">Upcoming</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border-cyan-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {[...allLeagues.active, ...allLeagues.upcoming].reduce((sum, l) => sum + (l.prizePool || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">Total Prizes</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-pink-900/40 to-pink-800/20 border-pink-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{myLeagueIds.size}</p>
                  <p className="text-sm text-gray-400">My Leagues</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="bg-slate-900/50 border border-purple-500/30 mb-6">
            <TabsTrigger value="active" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-active">
              Active ({allLeagues.active.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-upcoming">
              Upcoming ({allLeagues.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-completed">
              Completed ({allLeagues.completed.length})
            </TabsTrigger>
            <TabsTrigger value="my-leagues" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white" data-testid="tab-my-leagues">
              My Leagues ({myLeagueIds.size})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-64 bg-slate-900/50 animate-pulse" />
                ))}
              </div>
            ) : allLeagues.active.length === 0 ? (
              <Card className="bg-slate-900/50 border-purple-500/30 p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-purple-500/50" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Leagues</h3>
                <p className="text-gray-400 mb-4">Check back soon for new competitions!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allLeagues.active.map(league => (
                  <LeagueCard 
                    key={league.id} 
                    league={league} 
                    onJoin={(id) => joinMutation.mutate(id)}
                    isJoining={joinMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {allLeagues.upcoming.length === 0 ? (
              <Card className="bg-slate-900/50 border-purple-500/30 p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-amber-500/50" />
                <h3 className="text-xl font-bold text-white mb-2">No Upcoming Leagues</h3>
                <p className="text-gray-400">New leagues are created regularly. Stay tuned!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allLeagues.upcoming.map(league => (
                  <LeagueCard 
                    key={league.id} 
                    league={league} 
                    onJoin={(id) => joinMutation.mutate(id)}
                    isJoining={joinMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {allLeagues.completed.length === 0 ? (
              <Card className="bg-slate-900/50 border-purple-500/30 p-12 text-center">
                <Medal className="w-16 h-16 mx-auto mb-4 text-gray-500/50" />
                <h3 className="text-xl font-bold text-white mb-2">No Completed Leagues Yet</h3>
                <p className="text-gray-400">Past competitions will appear here.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allLeagues.completed.map(league => (
                  <LeagueCard 
                    key={league.id} 
                    league={league} 
                    onJoin={(id) => joinMutation.mutate(id)}
                    isJoining={joinMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-leagues">
            {myParticipations?.participations?.length === 0 ? (
              <Card className="bg-slate-900/50 border-purple-500/30 p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-purple-500/50" />
                <h3 className="text-xl font-bold text-white mb-2">You Haven't Joined Any Leagues</h3>
                <p className="text-gray-400 mb-4">Join an active league to start competing!</p>
                <Button 
                  onClick={() => setSelectedTab('active')}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600"
                  data-testid="btn-browse-leagues"
                >
                  Browse Leagues
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myParticipations?.participations?.map(p => p.league && (
                  <LeagueCard 
                    key={p.league.id} 
                    league={p.league} 
                    onJoin={() => {}}
                    isJoining={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-br from-slate-900/80 to-purple-900/30 border-purple-500/30 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">How Prediction Leagues Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">1. Join a League</h3>
                <p className="text-sm text-gray-400">Pay the entry fee (or join free leagues) to enter the competition</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">2. Trade Markets</h3>
                <p className="text-sm text-gray-400">All your prediction market trades during the league count toward your score</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">3. Climb Rankings</h3>
                <p className="text-sm text-gray-400">Compete for the top spot based on net profit and win rate</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">4. Win Prizes</h3>
                <p className="text-sm text-gray-400">Top performers split the prize pool when the league ends</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
