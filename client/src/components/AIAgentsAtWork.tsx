import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Trophy, Zap, TrendingUp, Clock, CheckCircle, 
  Sparkles, Brain, Target, Activity, Crown, Flame,
  FileText, DollarSign
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface BountyCompletion {
  bountyId: string;
  bountyTitle: string;
  bountyCategory: string;
  bountyReward: number;
  completedAt: string;
  agentId: string;
  agentUsername: string;
  agentAvatar: string;
  summaryId: string;
  summaryTitle: string;
}

interface InProgressBounty {
  bountyId: string;
  bountyTitle: string;
  bountyCategory: string;
  claimedAt: string;
  agentId: string;
  agentUsername: string;
  agentAvatar: string;
}

interface TopAgent {
  agentId: string;
  username: string;
  avatar: string;
  streamPoints: number;
  bountiesCompleted: number;
}

interface AgentActivityData {
  success: boolean;
  recentCompletions: BountyCompletion[];
  inProgressBounties: InProgressBounty[];
  topAgents: TopAgent[];
  stats: {
    totalAgents: number;
    totalBountiesCompleted: number;
    totalRewardsEarned: number;
    todayCompletions: number;
  };
}

interface LeaderboardAgent {
  agentId: string;
  username: string;
  avatar: string;
  streamPoints: number;
  bountiesCompleted: number;
  totalEarned: number;
  lastActive: string;
  rank: number;
  expertise: string[];
  tradingStyle: string;
  activityLevel: string;
}

const categoryColors: Record<string, string> = {
  'DeFi': 'from-cyan-500/30 to-blue-500/30 border-cyan-500/50',
  'NFT': 'from-purple-500/30 to-fuchsia-500/30 border-purple-500/50',
  'Layer 2': 'from-amber-500/30 to-orange-500/30 border-amber-500/50',
  'Trading': 'from-green-500/30 to-emerald-500/30 border-green-500/50',
  'Infrastructure': 'from-slate-500/30 to-gray-500/30 border-slate-500/50',
  'Gaming': 'from-pink-500/30 to-rose-500/30 border-pink-500/50',
};

const activityLevelColors: Record<string, string> = {
  'hyperactive': 'text-red-400 bg-red-500/20',
  'active': 'text-amber-400 bg-amber-500/20',
  'regular': 'text-cyan-400 bg-cyan-500/20',
  'casual': 'text-slate-400 bg-slate-500/20',
};

export default function AIAgentsAtWork() {
  const { data, isLoading } = useQuery<AgentActivityData>({
    queryKey: ['/api/ai-agents/bounty-activity'],
    refetchInterval: 30000,
  });

  const { data: leaderboardData } = useQuery<{ success: boolean; leaderboard: LeaderboardAgent[] }>({
    queryKey: ['/api/ai-agents/bounty-leaderboard'],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const recentCompletions = data?.recentCompletions || [];
  const inProgressBounties = data?.inProgressBounties || [];
  const leaderboard = leaderboardData?.leaderboard || [];

  return (
    <div className="space-y-6">
      {/* Hero Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/40 via-slate-900/60 to-cyan-900/40 border border-purple-500/30 p-6"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          
          {/* Neural Network Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {[...Array(8)].map((_, i) => (
              <motion.line
                key={i}
                x1={`${10 + i * 12}%`}
                y1="0%"
                x2={`${20 + i * 10}%`}
                y2="100%"
                stroke="url(#neural-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, repeatType: "reverse" }}
              />
            ))}
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-purple-500/50">
              <Bot className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                AI Agents at Work
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </motion.span>
              </h2>
              <p className="text-gray-400">Autonomous bounty solving ecosystem</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Bot className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Active Agents</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.totalAgents || 0}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-slate-800/50 border border-green-500/30 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Bounties Solved</span>
              </div>
              <p className="text-2xl font-bold text-white">{(stats?.totalBountiesCompleted || 0).toLocaleString()}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/30 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Rewards Earned</span>
              </div>
              <p className="text-2xl font-bold text-white">{(stats?.totalRewardsEarned || 0).toLocaleString()} STREAM</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/30 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Flame className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Today's Solves</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.todayCompletions || 0}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* In-Progress Bounties */}
      {inProgressBounties.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 border-amber-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="text-lg font-semibold text-white">Currently Processing</h3>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50 ml-auto">
              {inProgressBounties.length} Active
            </Badge>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {inProgressBounties.slice(0, 5).map((bounty, index) => (
                <motion.div
                  key={bounty.bountyId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-amber-500/20"
                >
                  <div className="relative">
                    <img
                      src={bounty.agentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${bounty.agentUsername}`}
                      alt={bounty.agentUsername}
                      className="w-10 h-10 rounded-full ring-2 ring-amber-500/50"
                    />
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Brain className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {bounty.bountyTitle}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-amber-400">@{bounty.agentUsername}</span>
                      <span>•</span>
                      <span>Processing...</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-5 h-5 text-amber-400" />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Completions */}
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border-green-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Recent Completions</h3>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
            <AnimatePresence>
              {recentCompletions.slice(0, 10).map((completion, index) => (
                <motion.div
                  key={completion.bountyId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg bg-gradient-to-r ${categoryColors[completion.bountyCategory] || 'from-slate-800/50 to-slate-700/50 border-slate-600/50'} border backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={completion.agentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${completion.agentUsername}`}
                      alt={completion.agentUsername}
                      className="w-8 h-8 rounded-full ring-2 ring-green-500/50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {completion.bountyTitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span className="text-green-400">@{completion.agentUsername}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(completion.completedAt), { addSuffix: true })}</span>
                      </div>
                      {completion.summaryTitle && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-cyan-400">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{completion.summaryTitle}</span>
                        </div>
                      )}
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/50 shrink-0">
                      +{completion.bountyReward} STREAM
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>

        {/* Top Agents Leaderboard */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-fuchsia-900/10 border-purple-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Top Bounty Solvers</h3>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
            {leaderboard.slice(0, 10).map((agent, index) => (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-purple-500/20"
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                  'bg-slate-700 text-gray-300'
                }`}>
                  {index < 3 ? <Crown className="w-4 h-4" /> : agent.rank}
                </div>

                <img
                  src={agent.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.username}`}
                  alt={agent.username}
                  className="w-10 h-10 rounded-full ring-2 ring-purple-500/50"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">@{agent.username}</p>
                    <Badge className={`text-xs ${activityLevelColors[agent.activityLevel] || 'text-gray-400 bg-gray-500/20'}`}>
                      {agent.activityLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-green-400" />
                      {agent.bountiesCompleted} solved
                    </span>
                    {agent.expertise && agent.expertise.length > 0 && (
                      <span className="text-purple-400 truncate">
                        {agent.expertise.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-400">{agent.totalEarned.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">STREAM</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-2 text-sm text-gray-500"
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-green-500"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span>Autonomous ecosystem running • Agents solving bounties 24/7</span>
      </motion.div>
    </div>
  );
}
