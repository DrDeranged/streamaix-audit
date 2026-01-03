import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock, Coins, Medal, Crown, ArrowLeft, TrendingUp, Target, Calendar, DollarSign, Timer, Award, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    if (rank === 1) return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-500/20', border: 'border-gray-500/30' };
    if (rank === 3) return { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
    return null;
  };

  const rankStyle = getRankStyle(participant.rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-4 p-4 rounded-lg ${rankStyle ? `${rankStyle.bg} ${rankStyle.border}` : 'bg-slate-800/30 border-slate-700/50'} border`}
      data-testid={`leaderboard-row-${participant.rank}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${rankStyle ? rankStyle.bg : 'bg-slate-700'}`}>
        {rankStyle ? (
          <rankStyle.icon className={`w-6 h-6 ${rankStyle.color}`} />
        ) : (
          <span className="text-gray-400 text-lg">#{participant.rank}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg">
          {participant.user?.avatar ? (
            <img src={participant.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            participant.user?.username?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div>
          <p className="font-semibold text-white flex items-center gap-2 text-lg">
            {participant.user?.username || 'Unknown'}
            {participant.user?.isAiAgent && (
              <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">AI</Badge>
            )}
          </p>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>{participant.totalTrades} trades</span>
            <span>•</span>
            <span>{participant.totalVolume.toLocaleString()} vol</span>
          </div>
        </div>
      </div>

      <div className="text-center px-4">
        <p className="text-sm text-gray-400">Win Rate</p>
        <p className="font-semibold text-white">{participant.winRate.toFixed(1)}%</p>
      </div>

      <div className="text-center px-4">
        <p className="text-sm text-gray-400">ROI</p>
        <p className={`font-semibold ${participant.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {participant.roi >= 0 ? '+' : ''}{participant.roi.toFixed(1)}%
        </p>
      </div>

      <div className="text-right min-w-[140px]">
        <p className={`font-bold text-xl ${participant.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {participant.netProfit >= 0 ? '+' : ''}{participant.netProfit.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">STREAM P/L</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading league details...</div>
      </div>
    );
  }

  if (error || !data?.league) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-red-500/30 p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">League Not Found</h2>
          <p className="text-gray-400 mb-4">This league doesn't exist or has been removed.</p>
          <Link href="/#prediction-markets">
            <Button data-testid="btn-back-to-leagues">
              Back to Leagues
            </Button>
          </Link>
        </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/#prediction-markets">
          <Button 
            variant="ghost" 
            className="mb-6 text-gray-400 hover:text-white"
            data-testid="btn-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leagues
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge 
                  variant="outline" 
                  className={`${isActive ? 'border-green-500/50 text-green-400' : isUpcoming ? 'border-amber-500/50 text-amber-400' : 'border-gray-500/50 text-gray-400'}`}
                >
                  {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed'}
                </Badge>
                <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                  {league.leagueType}
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 mb-2">
                {league.name}
              </h1>
              
              {league.description && (
                <p className="text-gray-400 text-lg mb-4">{league.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
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

            <Card className="lg:w-80 bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-amber-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-3xl font-bold text-white">{league.prizePool.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">STREAM Prize Pool</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {prizeBreakdown.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {i + 1}st Place
                    </span>
                    <span className="text-white font-semibold">{p.amount.toLocaleString()} STREAM</span>
                  </div>
                ))}
              </div>

              {(isActive || isUpcoming) && (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  data-testid="btn-join-league"
                >
                  {joinMutation.isPending ? 'Joining...' : league.entryFee > 0 ? `Join (${league.entryFee} STREAM)` : 'Join Free'}
                </Button>
              )}
            </Card>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-purple-500/30 p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{league.totalParticipants}</p>
                <p className="text-sm text-gray-400">Participants</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-900/50 border-cyan-500/30 p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-2xl font-bold text-white">{league.totalVolume.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Volume</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-900/50 border-pink-500/30 p-4">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-pink-400" />
              <div>
                <p className="text-2xl font-bold text-white">{league.entryFee > 0 ? league.entryFee.toLocaleString() : 'Free'}</p>
                <p className="text-sm text-gray-400">Entry Fee</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-900/50 border-amber-500/30 p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{league.minTrades}</p>
                <p className="text-sm text-gray-400">Min Trades</p>
              </div>
            </div>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900/50 border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-400" />
                Leaderboard
              </h2>
              <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                {standings.length} traders
              </Badge>
            </div>

            {standings.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-purple-500/50" />
                <h3 className="text-xl font-bold text-white mb-2">No Participants Yet</h3>
                <p className="text-gray-400 mb-4">Be the first to join this league!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {standings.map((participant, index) => (
                  <LeaderboardRow key={participant.id} participant={participant} index={index} />
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 border-purple-500/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Ready to Compete?</h3>
                  <p className="text-gray-400">Start trading on prediction markets to climb the leaderboard!</p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-cyan-600 to-purple-600"
                  onClick={() => setLocation('/markets')}
                  data-testid="btn-start-trading"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Trading
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
