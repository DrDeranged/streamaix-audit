import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Zap,
  Target,
  Star,
  Flame,
  Gift,
  Crown,
  Calendar,
  Lock,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  BarChart3,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Surface from "@/components/ds/Surface";
import SectionTitle from "@/components/ds/SectionTitle";

interface LevelInfo {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  progress: number;
  totalXpEarned: number;
  prestigeLevel: number;
}

interface QuestProgress {
  questId: string;
  name: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
  xpReward: number;
  streamReward: number;
  expiresAt: string;
}

interface MissionProgress {
  missionId: string;
  name: string;
  description: string;
  objectives: Array<{
    id: string;
    description: string;
    current: number;
    target: number;
    completed: boolean;
  }>;
  overallProgress: number;
  completed: boolean;
  xpReward: number;
  streamReward: number;
  weekEnd: string;
}

interface StreakInfo {
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivity: string | null;
  nextMilestone: number;
  graceAvailable: boolean;
}

interface SeasonPassInfo {
  seasonId: string;
  seasonName: string;
  currentTier: number;
  maxTier: number;
  currentXp: number;
  xpPerTier: number;
  tierProgress: number;
  hasPremium: boolean;
  unclaimedFreeRewards: number[];
  unclaimedPremiumRewards: number[];
  daysRemaining: number;
}

interface XPTransaction {
  id: string;
  xpAmount: number;
  xpType: string;
  source: string;
  description: string;
  createdAt: string;
}

interface GamificationDashboard {
  level: LevelInfo;
  dailyQuests: QuestProgress[];
  weeklyMissions: MissionProgress[];
  streaks: StreakInfo[];
  seasonPass: SeasonPassInfo | null;
  activeEvent: { xpMultiplier: number } | null;
  recentXP: XPTransaction[];
  notifications: any[];
}

const streakIcons: Record<string, any> = {
  login: Calendar,
  trading: TrendingUp,
  prediction: Target,
  content: Star,
};

const streakColors: Record<string, string> = {
  login: "bg-accent-core",
  trading: "bg-gain",
  prediction: "bg-warn",
  content: "bg-loss",
};

function XPBar({ level }: { level: LevelInfo }) {
  return (
    <Surface className="relative overflow-hidden grad-surface border border-accent-core/30 p-4 sm:p-6">
      <div className="absolute inset-0 bg-accent-core/10" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-accent-core rounded-xl blur-md opacity-50"
              />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-accent-deep flex items-center justify-center border-2 border-accent-core/50">
                <span className="text-xl sm:text-2xl font-bold text-primary tabular">
                  {level.currentLevel}
                </span>
              </div>
              {level.prestigeLevel > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-xl bg-warn flex items-center justify-center border border-warn">
                  <Crown className="w-3 h-3 text-primary" />
                </div>
              )}
            </div>
            <div>
              <SectionTitle as="h2" className="text-lg sm:text-xl font-bold">
                Level {level.currentLevel}
              </SectionTitle>
              {level.prestigeLevel > 0 && (
                <Badge className="bg-warn/20 text-warn border-warn/30 text-[10px]">
                  Prestige {level.prestigeLevel}
                </Badge>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-bold text-accent-bright tabular">
              {level.totalXpEarned.toLocaleString()}
            </p>
            <p className="text-xs text-secondary">Total XP</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-secondary">
            <span>{level.currentXp.toLocaleString()} XP</span>
            <span>
              {level.xpToNextLevel.toLocaleString()} XP to Level{" "}
              {level.currentLevel + 1}
            </span>
          </div>
          <div className="relative h-3 bg-ink-raised/50 rounded-xl overflow-hidden border border-accent-core/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${level.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-accent-core"
            />
            <div className="absolute inset-0 bg-accent-bright/10 animate-shimmer" />
          </div>
        </div>
      </div>
    </Surface>
  );
}

function DailyQuestsSurface({ quests }: { quests: QuestProgress[] }) {
  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <Surface className="bg-ink-surface border border-accent-core/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-warn/20">
            <Target className="w-5 h-5 text-warn" />
          </div>
          <div>
            <h3 className="font-semibold text-primary">Daily Quests</h3>
            <p className="text-xs text-secondary">
              {completedCount}/{quests.length} completed
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            "text-xs",
            completedCount === quests.length
              ? "bg-gain/20 text-gain border-gain/30"
              : "bg-ink-raised/50 text-secondary border-ink-edge/30"
          )}
        >
          {completedCount === quests.length ? "All Done!" : "In Progress"}
        </Badge>
      </div>

      <div className="space-y-3">
        {quests.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            No quests available today
          </p>
        ) : (
          quests.map((quest) => (
            <motion.div
              key={quest.questId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "p-3 rounded-xl border transition-all",
                quest.completed
                  ? "bg-gain/10 border-gain/30"
                  : "bg-ink-raised/30 border-ink-edge/30 hover:border-accent-core/30"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {quest.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-gain" />
                    ) : (
                      <div className="w-4 h-4 rounded-xl border-2 border-muted" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        quest.completed
                          ? "text-gain line-through"
                          : "text-primary"
                      )}
                    >
                      {quest.name}
                    </span>
                  </div>
                  <p className="text-xs text-secondary ml-6 mt-1">
                    {quest.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3 text-warn" />
                  <span className="text-warn font-medium">
                    {quest.xpReward} XP
                  </span>
                </div>
              </div>

              {!quest.completed && (
                <div className="ml-6 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>
                      {quest.current}/{quest.target}
                    </span>
                    <span>
                      {Math.round((quest.current / quest.target) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(quest.current / quest.target) * 100}
                    className="h-1.5"
                  />
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </Surface>
  );
}

function StreaksSurface({ streaks }: { streaks: StreakInfo[] }) {
  return (
    <Surface className="bg-ink-surface border border-accent-core/20 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-warn/20">
          <Flame className="w-5 h-5 text-warn" />
        </div>
        <h3 className="font-semibold text-primary">Active Streaks</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {streaks.length === 0 ? (
          <p className="text-sm text-muted col-span-2 text-center py-4">
            Start an activity to begin a streak!
          </p>
        ) : (
          streaks.map((streak) => {
            const Icon = streakIcons[streak.streakType] || Flame;
            const colorClass =
              streakColors[streak.streakType] || "bg-accent-core";

            return (
              <motion.div
                key={streak.streakType}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-3 rounded-xl border border-ink-edge/30 bg-ink-raised/30",
                  streak.currentStreak > 0 && "border-warn/30 bg-warn/5"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-1.5 rounded-xl ", colorClass)}>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-body capitalize">
                    {streak.streakType}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary tabular">
                    {streak.currentStreak}
                  </span>
                  <span className="text-xs text-secondary">days</span>
                  {streak.currentStreak > 0 && (
                    <Flame className="w-4 h-4 text-warn animate-pulse ml-1" />
                  )}
                </div>

                <div className="mt-2 text-[10px] text-muted">
                  Best: {streak.longestStreak} days • Next:{" "}
                  {streak.nextMilestone}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </Surface>
  );
}

function SeasonPassSurface({
  seasonPass,
}: {
  seasonPass: SeasonPassInfo | null;
}) {
  if (!seasonPass) {
    return (
      <Surface className="bg-ink-surface border border-accent-core/20 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-accent-core/20">
            <Gift className="w-5 h-5 text-accent-bright" />
          </div>
          <h3 className="font-semibold text-primary">Season Pass</h3>
        </div>
        <p className="text-sm text-muted text-center py-6">
          No active season. Check back soon!
        </p>
      </Surface>
    );
  }

  const unclaimedTotal =
    seasonPass.unclaimedFreeRewards.length +
    seasonPass.unclaimedPremiumRewards.length;

  return (
    <Surface className="bg-ink-surface border border-accent-core/30 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-accent-core/10" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent-core/20">
              <Gift className="w-5 h-5 text-accent-bright" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">
                {seasonPass.seasonName}
              </h3>
              <p className="text-xs text-secondary">
                {seasonPass.daysRemaining} days remaining
              </p>
            </div>
          </div>

          {seasonPass.hasPremium ? (
            <Badge className="bg-warn text-ink-page border-0">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          ) : (
            <Button
              size="sm"
              className="grad-accent hover:bg-accent-deep border-0 h-8 text-xs"
            >
              Upgrade
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-accent-core flex items-center justify-center border-2 border-fuchsia-400/50">
              <span className="text-lg font-bold text-primary tabular">
                {seasonPass.currentTier}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-secondary mb-1">
              <span>Tier {seasonPass.currentTier}</span>
              <span>
                Tier {Math.min(seasonPass.currentTier + 1, seasonPass.maxTier)}
              </span>
            </div>
            <Progress value={seasonPass.tierProgress} className="h-2" />
            <p className="text-[10px] text-muted mt-1">
              {seasonPass.currentXp}/{seasonPass.xpPerTier} XP to next tier
            </p>
          </div>
        </div>

        {unclaimedTotal > 0 && (
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-xl bg-warn/20 border border-warn/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warn animate-pulse" />
                <span className="text-sm font-medium text-warn">
                  {unclaimedTotal} reward{unclaimedTotal > 1 ? "s" : ""} to
                  claim!
                </span>
              </div>
              <Button
                size="sm"
                className="bg-warn hover:bg-warn text-ink-page h-7 text-xs"
              >
                Claim
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Surface>
  );
}

function RecentXPSurface({ transactions }: { transactions: XPTransaction[] }) {
  return (
    <Surface className="bg-ink-surface border border-accent-core/20 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-accent-core/20">
          <BarChart3 className="w-5 h-5 text-accent-bright" />
        </div>
        <h3 className="font-semibold text-primary">Recent XP</h3>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            No XP earned yet
          </p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2 rounded-xl bg-ink-raised/30 border border-ink-edge/30"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-warn" />
                <div>
                  <p className="text-xs font-medium text-primary">
                    {tx.description || tx.source}
                  </p>
                  <p className="text-[10px] text-muted">{tx.xpType}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gain">
                +{tx.xpAmount}
              </span>
            </div>
          ))
        )}
      </div>
    </Surface>
  );
}

export default function GamificationPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery<{
    success: boolean;
    dashboard: GamificationDashboard;
  }>({
    queryKey: ["/api/gamification/dashboard"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const dashboard = data?.dashboard;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center p-4">
        <Surface className="p-8 bg-ink-surface/90 border-accent-core/30 text-center max-w-md">
          <Lock className="w-12 h-12 text-accent-bright mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">
            Sign In Required
          </h2>
          <p className="text-secondary mb-6">
            Sign in to track your progress and earn rewards!
          </p>
          <Link href="/auth">
            <Button className="grad-accent hover:bg-accent-deep">
              Sign In
            </Button>
          </Link>
        </Surface>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-page flex items-center justify-center">
        <div className="animate-pulse text-accent-bright">
          Loading your progress...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-page safe-area-inset">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <PageHeader
          eyebrow="XP · quests · streaks"
          title="Your Progress"
          icon={<Sparkles className="h-5 w-5" />}
          subtitle="Complete quests, earn XP, level up."
          className="mb-6"
        />

        {dashboard?.activeEvent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-warn/20 border border-warn/30"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-warn" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-warn">
                  Double XP Event Active!
                </p>
                <p className="text-xs text-warn/70">
                  All XP gains are multiplied by{" "}
                  {dashboard.activeEvent.xpMultiplier}x
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {dashboard && (
          <div className="space-y-6">
            <XPBar level={dashboard.level} />

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full bg-ink-surface/50 border border-accent-core/20 p-1 h-auto flex-wrap">
                <TabsTrigger
                  value="overview"
                  className="flex-1 data-[state=active]:bg-accent-core text-xs sm:text-sm"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="quests"
                  className="flex-1 data-[state=active]:bg-accent-core text-xs sm:text-sm"
                >
                  Quests
                </TabsTrigger>
                <TabsTrigger
                  value="season"
                  className="flex-1 data-[state=active]:bg-accent-core text-xs sm:text-sm"
                >
                  Season
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DailyQuestsSurface quests={dashboard.dailyQuests} />
                  <StreaksSurface streaks={dashboard.streaks} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SeasonPassSurface seasonPass={dashboard.seasonPass} />
                  <RecentXPSurface transactions={dashboard.recentXP} />
                </div>
              </TabsContent>

              <TabsContent value="quests" className="mt-6 space-y-6">
                <DailyQuestsSurface quests={dashboard.dailyQuests} />

                <Surface className="bg-ink-surface border border-accent-core/20 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-accent-core/20">
                      <Calendar className="w-5 h-5 text-accent-bright" />
                    </div>
                    <h3 className="font-semibold text-primary">
                      Weekly Missions
                    </h3>
                  </div>

                  {dashboard.weeklyMissions.length === 0 ? (
                    <p className="text-sm text-muted text-center py-6">
                      No weekly missions active
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dashboard.weeklyMissions.map((mission) => (
                        <div
                          key={mission.missionId}
                          className="p-4 rounded-xl bg-ink-raised/30 border border-ink-edge/30"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-primary">
                                {mission.name}
                              </h4>
                              <p className="text-xs text-secondary">
                                {mission.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs">
                                <Zap className="w-3 h-3 text-warn" />
                                <span className="text-warn font-medium">
                                  {mission.xpReward} XP
                                </span>
                              </div>
                              {mission.streamReward > 0 && (
                                <div className="flex items-center gap-1 text-xs mt-1">
                                  <Coins className="w-3 h-3 text-accent-bright" />
                                  <span className="text-accent-bright">
                                    {mission.streamReward}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Progress
                            value={mission.overallProgress}
                            className="h-2 mb-2"
                          />
                          <p className="text-[10px] text-muted">
                            {mission.overallProgress}% complete
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Surface>
              </TabsContent>

              <TabsContent value="season" className="mt-6 space-y-6">
                <SeasonPassSurface seasonPass={dashboard.seasonPass} />

                {dashboard.seasonPass && (
                  <Surface className="bg-ink-surface border border-accent-core/20 p-4">
                    <h3 className="font-semibold text-primary mb-4">
                      Reward Track
                    </h3>
                    <div className="relative">
                      <div className="absolute top-6 left-0 right-0 h-1 bg-ink-raised rounded-xl" />
                      <div
                        className="absolute top-6 left-0 h-1 bg-accent-core rounded-xl transition-all"
                        style={{
                          width: `${
                            (dashboard.seasonPass.currentTier /
                              dashboard.seasonPass.maxTier) *
                            100
                          }%`,
                        }}
                      />

                      <div className="flex justify-between relative">
                        {[1, 25, 50, 75, 100].map((tier) => {
                          const isReached =
                            dashboard.seasonPass!.currentTier >= tier;
                          return (
                            <div
                              key={tier}
                              className="flex flex-col items-center"
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all",
                                  isReached
                                    ? "bg-accent-core border-fuchsia-400"
                                    : "bg-ink-raised border-ink-edge"
                                )}
                              >
                                {isReached ? (
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                ) : (
                                  <Lock className="w-3 h-3 text-secondary" />
                                )}
                              </div>
                              <span className="text-[10px] text-secondary mt-2">
                                Tier {tier}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Surface>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
