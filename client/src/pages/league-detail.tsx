import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Trophy, Users, Coins, Medal, Crown, TrendingUp, Target, Calendar, Timer, Award, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, differenceInDays, differenceInHours } from 'date-fns';

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
  prizeWon: number;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    isAiAgent?: boolean;
  } | null;
  rank: number;
}

interface LeagueDetailResponse {
  league: League;
  standings: LeagueParticipant[];
  participantCount: number;
}

function getTimeRemaining(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const days = differenceInDays(end, now);
  const hours = differenceInHours(end, now) % 24;
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return 'Ending soon';
}

function getTimeUntilStart(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  const days = differenceInDays(start, now);
  const hours = differenceInHours(start, now) % 24;
  
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h`;
  return 'Starting soon';
}

function LeaderboardRow({ participant, index }: { participant: LeagueParticipant; index: number }) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: 'text-warn', bg: 'bg-warn/20', border: 'border-warn/30' };
    if (rank === 2) return { icon: Medal, color: 'text-secondary', bg: 'bg-ink-surface', border: 'border-ink-edge' };
    if (rank === 3) return { icon: Medal, color: 'text-warn', bg: 'bg-ink-surface', border: 'border-warn/30' };
    return null;
  };

  const rankStyle = getRankStyle(participant.rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-4 rounded-xl border border-ink-divider bg-ink-raised p-4 ${rankStyle ? `${rankStyle.bg} ${rankStyle.border}` : ''}`}
      data-testid={`leaderboard-row-${participant.rank}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold ${rankStyle ? rankStyle.bg : 'bg-ink-surface'}`}>
        {rankStyle ? (
          <rankStyle.icon className={`w-6 h-6 ${rankStyle.color}`} />
        ) : (
          <span className="text-secondary text-lg">#{participant.rank}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink-edge bg-accent-deep text-lg font-bold text-primary">
          {participant.user?.avatar ? (
            <img src={participant.user.avatar} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            participant.user?.username?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold text-primary">
            {participant.user?.username || 'Unknown'}
            {participant.user?.isAiAgent && (
              <Badge variant="outline" className="border-accent-core/50 text-accent-bright text-xs">AI</Badge>
            )}
          </p>
          <div className="flex items-center gap-3 text-sm text-secondary">
            <span>{participant.totalTrades} trades</span>
            <span>•</span>
            <span>{participant.totalVolume.toLocaleString()} vol</span>
          </div>
        </div>
      </div>

      <div className="text-center px-4">
        <p className="text-muted text-sm">Win Rate</p>
        <p className="tabular font-semibold text-primary">{participant.winRate.toFixed(2)}%</p>
      </div>

      <div className="text-center px-4">
        <p className="text-muted text-sm">ROI</p>
        <p className={`tabular font-semibold ${participant.roi >= 0 ? 'text-gain' : 'text-loss'}`}>
          {participant.roi >= 0 ? '+' : ''}{participant.roi.toFixed(2)}%
        </p>
      </div>

      <div className="text-right min-w-[140px]">
        <p className={`tabular text-xl font-bold ${participant.netProfit >= 0 ? 'text-gain' : 'text-loss'}`}>
          {participant.netProfit >= 0 ? '+' : ''}{participant.netProfit.toLocaleString()}
        </p>
        <p className="text-muted text-xs">STREAM P/L</p>
      </div>
    </motion.div>
  );
}

export default function LeagueDetailPage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<LeagueDetailResponse>({
    queryKey: ['/api/prediction-leagues', leagueId],
    enabled: !!leagueId,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/prediction-leagues/${leagueId}/join`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({
        title: "Joined League!",
        description: "You've successfully joined the prediction league. Good luck!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prediction-leagues', leagueId] });
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

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink-page">
        <div className="text-secondary">Loading league details...</div>
      </div>
    );
  }

  if (error || !data?.league) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink-page">
        <Surface className="border-loss/30 p-8 text-center">
          <SectionTitle as="h2" className="mb-2 text-xl font-bold">League Not Found</SectionTitle>
          <p className="text-body mb-4">This league doesn't exist or has been removed.</p>
          <Link href="/#prediction-markets">
            <Button data-testid="btn-back-to-leagues">
              Back to Leagues
            </Button>
          </Link>
        </Surface>
      </div>
    );
  }

  const { league, standings } = data;
  const isActive = league.status === 'active';
  const isUpcoming = league.status === 'upcoming';
  const isCompleted = league.status === 'completed';

  const prizeBreakdown = (league.prizeDistribution || []).map(p => ({
    ...p,
    amount: Math.floor((league.prizePool * p.percentage) / 100)
  }));

  return (
    <div className="min-h-[100dvh] bg-ink-page">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge 
                  variant="outline" 
                  className={`${isActive ? 'border-gain/50 text-gain' : isUpcoming ? 'border-warn/50 text-warn' : 'border-ink-edge text-secondary'}`}
                >
                  {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed'}
                </Badge>
                <Badge variant="outline" className="border-accent-core/50 text-accent-bright">
                  {league.leagueType}
                </Badge>
              </div>
              
              <SectionTitle as="h1" className="mb-2 text-4xl font-bold">{league.name}</SectionTitle>
              
              {league.description && (
                <p className="text-body mb-4 text-lg">{league.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-secondary">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(league.startDate), 'MMM d')} - {format(new Date(league.endDate), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  {isActive ? getTimeRemaining(league.endDate) : isUpcoming ? getTimeUntilStart(league.startDate) : 'Ended'}
                </div>
              </div>
            </div>

            <Surface className="grad-surface border-warn/30 p-6 lg:w-80">
              <div className="flex items-center gap-3 mb-4">
                 <Trophy className="h-8 w-8 text-warn" />
                <div>
                   <p className="tabular text-3xl font-bold text-primary">{league.prizePool.toLocaleString()}</p>
                   <p className="text-secondary text-sm">STREAM Prize Pool</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {prizeBreakdown.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                     <span className="text-secondary">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {i + 1}st Place
                    </span>
                     <span className="tabular font-semibold text-primary">{p.amount.toLocaleString()} STREAM</span>
                  </div>
                ))}
              </div>

              {(isActive || isUpcoming) && (
                <Button 
                   className="grad-accent glow-accent w-full rounded-xl text-white"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  data-testid="btn-join-league"
                >
                  {joinMutation.isPending ? 'Joining...' : league.entryFee > 0 ? `Join (${league.entryFee} STREAM)` : 'Join Free'}
                </Button>
              )}
            </Surface>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Surface className="p-4">
            <div className="flex items-center gap-3">
               <Users className="h-8 w-8 text-accent-bright" />
              <div>
                 <StatValue label="Participants" value={league.totalParticipants} />
              </div>
            </div>
          </Surface>
          
          <Surface className="p-4">
            <div className="flex items-center gap-3">
               <TrendingUp className="h-8 w-8 text-accent-bright" />
              <div>
                 <StatValue label="Total Volume" value={league.totalVolume.toLocaleString()} />
              </div>
            </div>
          </Surface>
          
          <Surface className="p-4">
            <div className="flex items-center gap-3">
               <Coins className="h-8 w-8 text-accent-bright" />
              <div>
                 <StatValue label="Entry Fee" value={league.entryFee > 0 ? league.entryFee.toLocaleString() : 'Free'} />
              </div>
            </div>
          </Surface>
          
          <Surface className="p-4">
            <div className="flex items-center gap-3">
               <Target className="h-8 w-8 text-warn" />
              <div>
                 <StatValue label="Min Trades" value={league.minTrades} />
              </div>
            </div>
          </Surface>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
           <Surface className="p-6">
            <div className="flex items-center justify-between mb-6">
               <SectionTitle as="h2" className="flex items-center gap-2 text-2xl font-bold">
                 <Award className="h-6 w-6 text-accent-bright" />
                 Leaderboard
               </SectionTitle>
               <Badge variant="outline" className="border-accent-core/50 text-accent-bright">
                {standings.length} traders
              </Badge>
            </div>

            {standings.length === 0 ? (
              <div className="text-center py-12">
                 <Users className="mx-auto mb-4 h-16 w-16 text-accent-core/50" />
                 <SectionTitle as="h3" className="mb-2 text-xl font-bold">No Participants Yet</SectionTitle>
                 <p className="text-body mb-4">Be the first to join this league!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {standings.map((participant, index) => (
                  <LeaderboardRow key={participant.id} participant={participant} index={index} />
                ))}
              </div>
            )}
           </Surface>
        </motion.div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
             <Surface variant="raised" className="border border-accent-core/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                   <SectionTitle as="h3" className="mb-1 text-xl font-bold">Ready to Compete?</SectionTitle>
                   <p className="text-body">Start trading on prediction markets to climb the leaderboard!</p>
                </div>
                <Button 
                   className="grad-accent glow-accent rounded-xl text-white"
                  onClick={() => setLocation('/markets')}
                  data-testid="btn-start-trading"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Trading
                </Button>
              </div>
             </Surface>
          </motion.div>
        )}
      </div>
    </div>
  );
}
