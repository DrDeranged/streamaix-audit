import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Trophy, Users, Coins, Medal, Crown, ArrowRight, Plus, TrendingUp, Target, Calendar, DollarSign, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow, format, differenceInDays, differenceInHours } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { formatPoints } from '@/hooks/usePoints';

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
  const { user, isAuthenticated } = useAuth();
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
      <Surface className="relative cursor-pointer overflow-hidden p-6 transition-all hover:border-accent-core/50"
        onClick={() => setLocation(`/leagues/${league.id}`)}
        data-testid={`league-card-${league.id}`}
      >
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-accent-core/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Badge 
                variant="outline" 
                className={`mb-2 ${isActive ? 'border-gain/50 text-gain' : isUpcoming ? 'border-warn/50 text-warn' : 'border-ink-edge text-muted'}`}
              >
                {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed'}
              </Badge>
              <h3 className="mb-1 text-xl font-bold text-primary">{league.name}</h3>
              {league.description && (
                <p className="line-clamp-2 text-sm text-secondary">{league.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-warn">
                <Trophy className="w-5 h-5" />
                <span className="font-bold text-lg">{league.prizePool.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted">STREAM Prize Pool</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl bg-ink-raised p-2 text-center">
              <Users className="mx-auto mb-1 h-4 w-4 text-accent-bright" />
              <p className="tabular text-sm font-semibold text-primary">
                {league.totalParticipants}{league.maxParticipants ? `/${league.maxParticipants}` : ''}
              </p>
              <p className="text-xs text-muted">Players</p>
            </div>
            <div className="rounded-xl bg-ink-raised p-2 text-center">
              <Coins className="mx-auto mb-1 h-4 w-4 text-accent-bright" />
              <p className="tabular text-sm font-semibold text-primary">
                {league.entryFee > 0 ? league.entryFee.toLocaleString() : 'Free'}
              </p>
              <p className="text-xs text-muted">Entry Fee</p>
            </div>
            <div className="rounded-xl bg-ink-raised p-2 text-center">
              <Timer className="mx-auto mb-1 h-4 w-4 text-accent-bright" />
              <p className="tabular text-sm font-semibold text-primary">
                {isActive ? getTimeRemaining(league.endDate) : isUpcoming ? getTimeUntilStart(league.startDate) : 'Ended'}
              </p>
              <p className="text-xs text-muted">{isActive ? 'Remaining' : isUpcoming ? 'Until Start' : 'Status'}</p>
            </div>
          </div>

          {league.maxParticipants && (
            <div className="mb-4">
              <Progress value={fillPercent} className="h-2 bg-ink-raised" />
              <p className="mt-1 text-xs text-muted">{fillPercent.toFixed(0)}% full</p>
            </div>
          )}

          <div className="flex gap-2">
            {(isActive || isUpcoming) && (
              <div className="flex-1">
                {isAuthenticated && user && league.entryFee > 0 && (
                    <p className="mb-1.5 text-xs text-secondary">
                      Your balance: <span className="font-medium text-accent-bright">{formatPoints(Number(user.streamPoints || 0))} STREAM</span>
                  </p>
                )}
                <Button 
                  className="glow-accent w-full grad-accent text-white"
                  onClick={(e) => { e.stopPropagation(); onJoin(league.id); }}
                  disabled={isJoining}
                  data-testid={`join-league-${league.id}`}
                >
                  {isJoining ? 'Joining...' : league.entryFee > 0 ? `Join (${league.entryFee} STREAM)` : 'Join Free'}
                </Button>
              </div>
            )}
            <Button 
              variant="outline" 
              className="border-accent-core/50 text-accent-bright hover:bg-accent-core/10"
              onClick={(e) => { e.stopPropagation(); setLocation(`/leagues/${league.id}`); }}
              data-testid={`view-league-${league.id}`}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Surface>
    </motion.div>
  );
}

function LeaderboardRow({ participant, index }: { participant: LeagueParticipant & { rank: number }; index: number }) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: 'text-warn', bg: 'bg-warn/15' };
    if (rank === 2) return { icon: Medal, color: 'text-secondary', bg: 'bg-ink-raised' };
    if (rank === 3) return { icon: Medal, color: 'text-warn', bg: 'bg-warn/15' };
    return null;
  };

  const rankStyle = getRankStyle(participant.rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-4 rounded-xl border border-ink-edge p-4 ${rankStyle ? rankStyle.bg : 'bg-ink-raised'}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${rankStyle ? rankStyle.bg : 'bg-ink-raised'}`}>
        {rankStyle ? (
          <rankStyle.icon className={`w-5 h-5 ${rankStyle.color}`} />
        ) : (
          <span className="text-secondary">#{participant.rank}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-deep font-bold text-white">
          {participant.user?.avatar ? (
            <img src={participant.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            participant.user?.username?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div>
           <p className="flex items-center gap-2 font-semibold text-primary">
            {participant.user?.username || 'Unknown'}
            {participant.user?.isAiAgent && (
              <Badge variant="outline" className="border-accent-core/50 text-xs text-accent-bright">AI</Badge>
            )}
          </p>
          <p className="text-xs text-muted">{participant.totalTrades} trades</p>
        </div>
      </div>

      <div className="text-right">
        <p className={`tabular font-bold ${participant.netProfit >= 0 ? 'text-gain' : 'text-loss'}`}>
          {participant.netProfit >= 0 ? '+' : ''}{participant.netProfit.toLocaleString()} STREAM
        </p>
        <p className="tabular text-xs text-muted">
          {participant.winRate >= 0 ? '+' : ''}{participant.winRate.toFixed(2)}% win rate
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
        title: "Unable to join league",
        description: "Please try again.",
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
    <div className="min-h-screen bg-ink-page">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PageHeader
            eyebrow="Compete · weekly rewards"
            title="Prediction Leagues"
            icon={<Trophy className="h-5 w-5" />}
            subtitle="Compete with other traders in weekly competitions for STREAM rewards."
            className="mb-4"
            actions={
              <Button
                className="glow-accent min-h-[44px] grad-accent"
                onClick={() => setLocation('/markets')}
                data-testid="btn-trade-now"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trade Now
              </Button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Surface className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-core/15">
                  <Trophy className="h-6 w-6 text-accent-bright" />
                </div>
                <div>
                  <StatValue label="Active Leagues" value={allLeagues.active.length} />
                </div>
              </div>
            </Surface>
            
            <Surface className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warn/15">
                  <Calendar className="h-6 w-6 text-warn" />
                </div>
                <div>
                  <StatValue label="Upcoming" value={allLeagues.upcoming.length} />
                </div>
              </div>
            </Surface>
            
            <Surface className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-core/15">
                  <DollarSign className="h-6 w-6 text-accent-bright" />
                </div>
                <div>
                  <StatValue label="Total Prizes" value={[...allLeagues.active, ...allLeagues.upcoming].reduce((sum, l) => sum + (l.prizePool || 0), 0).toLocaleString()} />
                </div>
              </div>
            </Surface>
            
            <Surface className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-core/15">
                  <Users className="h-6 w-6 text-accent-bright" />
                </div>
                <div>
                  <StatValue label="My Leagues" value={myLeagueIds.size} />
                </div>
              </div>
            </Surface>
          </div>
        </motion.div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-6 border border-ink-edge bg-ink-surface">
            <TabsTrigger value="active" className="data-[state=active]:bg-accent-core data-[state=active]:text-white" data-testid="tab-active">
              Active ({allLeagues.active.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-accent-core data-[state=active]:text-white" data-testid="tab-upcoming">
              Upcoming ({allLeagues.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-accent-core data-[state=active]:text-white" data-testid="tab-completed">
              Completed ({allLeagues.completed.length})
            </TabsTrigger>
            <TabsTrigger value="my-leagues" className="data-[state=active]:bg-accent-core data-[state=active]:text-white" data-testid="tab-my-leagues">
              My Leagues ({myLeagueIds.size})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Surface key={i} className="h-64 animate-pulse" />
                ))}
              </div>
            ) : allLeagues.active.length === 0 ? (
              <Surface className="p-12 text-center">
                <Trophy className="mx-auto mb-4 h-16 w-16 text-accent-core/50" />
                <h3 className="mb-2 text-xl font-bold text-primary">No Active Leagues</h3>
                <p className="mb-4 text-body">Check back soon for new competitions!</p>
              </Surface>
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
              <Surface className="p-12 text-center">
                <Calendar className="mx-auto mb-4 h-16 w-16 text-warn/50" />
                <h3 className="mb-2 text-xl font-bold text-primary">No Upcoming Leagues</h3>
                <p className="text-body">New leagues are created regularly. Stay tuned!</p>
              </Surface>
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
              <Surface className="p-12 text-center">
                <Medal className="mx-auto mb-4 h-16 w-16 text-muted" />
                <h3 className="mb-2 text-xl font-bold text-primary">No Completed Leagues Yet</h3>
                <p className="text-body">Past competitions will appear here.</p>
              </Surface>
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
              <Surface className="p-12 text-center">
                <Target className="mx-auto mb-4 h-16 w-16 text-accent-core/50" />
                <h3 className="mb-2 text-xl font-bold text-primary">You Haven't Joined Any Leagues</h3>
                <p className="mb-4 text-body">Join an active league to start competing!</p>
                <Button 
                  onClick={() => setSelectedTab('active')}
                  className="grad-accent"
                  data-testid="btn-browse-leagues"
                >
                  Browse Leagues
                </Button>
              </Surface>
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
          <Surface className="p-8">
            <SectionTitle className="mb-4">How Prediction Leagues Work</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent-core/15">
                  <Plus className="h-8 w-8 text-accent-bright" />
                </div>
                <h3 className="mb-1 font-semibold text-primary">1. Join a League</h3>
                <p className="text-sm text-secondary">Pay the entry fee (or join free leagues) to enter the competition</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent-core/15">
                  <TrendingUp className="h-8 w-8 text-accent-bright" />
                </div>
                <h3 className="mb-1 font-semibold text-primary">2. Trade Markets</h3>
                <p className="text-sm text-secondary">All your prediction market trades during the league count toward your score</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent-core/15">
                  <Target className="h-8 w-8 text-accent-bright" />
                </div>
                <h3 className="mb-1 font-semibold text-primary">3. Climb Rankings</h3>
                <p className="text-sm text-secondary">Compete for the top spot based on net profit and win rate</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-warn/15">
                  <Trophy className="h-8 w-8 text-warn" />
                </div>
                <h3 className="mb-1 font-semibold text-primary">4. Win Prizes</h3>
                <p className="text-sm text-secondary">Top performers split the prize pool when the league ends</p>
              </div>
            </div>
          </Surface>
        </motion.div>
      </div>
    </div>
  );
}
