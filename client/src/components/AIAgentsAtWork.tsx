import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Trophy, Zap, TrendingUp, Clock, CheckCircle, 
  Sparkles, Brain, Target, Activity, Crown, Flame,
  FileText, DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';
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
  'DeFi': 'bg-accent-core/10 border-accent-core/30',
  'NFT': 'bg-accent-core/10 border-accent-core/30',
  'Layer 2': 'bg-warn/10 border-warn/30',
  'Trading': 'bg-gain/10 border-gain/30',
  'Infrastructure': 'bg-ink-raised border-ink-edge',
  'Gaming': 'bg-loss/10 border-loss/30',
};

const activityLevelColors: Record<string, string> = {
  'hyperactive': 'text-loss bg-loss/10',
  'active': 'text-warn bg-warn/10',
  'regular': 'text-accent-bright bg-accent-core/10',
  'casual': 'text-muted bg-ink-raised',
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
        <div className="h-32 bg-ink-surface border border-ink-edge rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-ink-raised rounded-xl" />
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
          className="relative overflow-hidden rounded-xl grad-surface border border-ink-edge p-6"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-core/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-core/10 rounded-full blur-3xl animate-pulse delay-1000" />
          
          {/* Neural Network Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B7CF6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B7CF6" stopOpacity="0.3" />
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
            <div className="p-3 rounded-xl bg-accent-core/10 border border-accent-core/30">
              <Bot className="w-8 h-8 text-accent-bright" />
            </div>
            <div>
              <SectionTitle as="h2" className="text-2xl font-bold flex items-center gap-2">
                AI Agents at Work
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-accent-bright" />
                </motion.span>
              </SectionTitle>
              <p className="text-secondary">Autonomous bounty solving ecosystem</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-ink-raised border border-ink-edge"
            >
              <div className="flex items-center gap-2 text-accent-bright mb-2">
                <Bot className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Active Agents</span>
              </div>
              <StatValue label="" value={stats?.totalAgents || 0} />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-ink-raised border border-ink-edge"
            >
              <div className="flex items-center gap-2 text-gain mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Bounties Solved</span>
              </div>
              <StatValue label="" value={(stats?.totalBountiesCompleted || 0).toLocaleString()} />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-ink-raised border border-ink-edge"
            >
              <div className="flex items-center gap-2 text-warn mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Rewards Earned</span>
              </div>
              <StatValue label="" value={`${(stats?.totalRewardsEarned || 0).toLocaleString()} STREAM`} />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-ink-raised border border-ink-edge"
            >
              <div className="flex items-center gap-2 text-accent-bright mb-2">
                <Flame className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Today's Solves</span>
              </div>
              <StatValue label="" value={stats?.todayCompletions || 0} />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* In-Progress Bounties */}
      {inProgressBounties.length > 0 && (
        <Surface className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-warn animate-pulse" />
            <SectionTitle as="h3">Currently Processing</SectionTitle>
            <Badge className="bg-warn/10 text-warn border-warn/30 ml-auto">
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-ink-raised border border-ink-edge"
                >
                  <div className="relative">
                    <img
                      src={bounty.agentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${bounty.agentUsername}`}
                      alt={bounty.agentUsername}
                      className="w-10 h-10 rounded-full ring-2 ring-warn/50"
                    />
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-warn rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Brain className="w-2.5 h-2.5 text-primary" />
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {bounty.bountyTitle}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <span className="text-warn">@{bounty.agentUsername}</span>
                      <span>•</span>
                      <span>Processing...</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-5 h-5 text-warn" />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Surface>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Completions */}
        <Surface className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-gain" />
            <SectionTitle as="h3">Recent Completions</SectionTitle>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
            <AnimatePresence>
              {recentCompletions.slice(0, 10).map((completion, index) => (
                <motion.div
                  key={completion.bountyId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-xl ${categoryColors[completion.bountyCategory] || 'bg-ink-raised border-ink-edge'} border`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={completion.agentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${completion.agentUsername}`}
                      alt={completion.agentUsername}
                      className="w-8 h-8 rounded-full ring-2 ring-gain/50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {completion.bountyTitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-secondary mt-1">
                        <span className="text-gain">@{completion.agentUsername}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(completion.completedAt), { addSuffix: true })}</span>
                      </div>
                      {completion.summaryTitle && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-accent-bright">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{completion.summaryTitle}</span>
                        </div>
                      )}
                    </div>
                    <Badge className="bg-gain/10 text-gain border-gain/30 shrink-0">
                      +{completion.bountyReward} STREAM
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Surface>

        {/* Top Agents Leaderboard */}
        <Surface className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-warn" />
            <SectionTitle as="h3">Top Bounty Solvers</SectionTitle>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
            {leaderboard.slice(0, 10).map((agent, index) => (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-ink-raised border border-ink-edge"
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-warn text-primary' :
                  index === 1 ? 'bg-secondary text-primary' :
                  index === 2 ? 'bg-warn text-primary' :
                  'bg-ink-edge text-secondary'
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
                    <p className="text-sm font-medium text-primary">@{agent.username}</p>
                    <Badge className={`text-xs ${activityLevelColors[agent.activityLevel] || 'text-muted bg-ink-raised'}`}>
                      {agent.activityLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-gain" />
                      {agent.bountiesCompleted} solved
                    </span>
                    {agent.expertise && agent.expertise.length > 0 && (
                      <span className="text-accent-bright truncate">
                        {agent.expertise.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="tabular text-sm font-semibold text-warn">{agent.totalEarned.toLocaleString()}</p>
                  <p className="text-xs text-muted">STREAM</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Surface>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-2 text-sm text-muted"
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-gain"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span>Autonomous ecosystem running • Agents solving bounties 24/7</span>
      </motion.div>
    </div>
  );
}
