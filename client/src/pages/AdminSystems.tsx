import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, Clock, Zap, Brain, Bot, Target, Droplet, Sparkles, Shield, Users, DollarSign, ArrowRightLeft, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SystemMetrics {
  actionsPerHour: number;
  successRate: number;
  errorCount: number;
  totalActions: number;
}

interface RecentAction {
  id: string;
  actionType: string;
  status: string;
  targetId: string | null;
  reasoning: string | null;
  errorMessage: string | null;
  executionTimeMs: number | null;
  createdAt: string | null;
  metadata: any;
}

interface SystemStatus {
  name: string;
  key: string;
  description: string;
  status: 'active' | 'warning' | 'error' | 'idle';
  lastRunTime: string | null;
  nextRunTime: string | null;
  metrics: SystemMetrics;
  recentActions: RecentAction[];
}

interface PlatformMetrics {
  totalSystems: number;
  activeSystems: number;
  warningSystems: number;
  errorSystems: number;
  totalActionsLast24h: number;
  overallSuccessRate: number;
}

interface SystemsStatusResponse {
  success: boolean;
  systems: SystemStatus[];
  platformMetrics: PlatformMetrics;
  timestamp: string;
}

const systemIcons: Record<string, any> = {
  'social_agents': Brain,
  'trading_bots': Bot,
  'market_resolver': Target,
  'liquidity_provider': Droplet,
  'trend_spotter': Sparkles,
  'content_moderator': Shield,
  'community_manager': Users,
  'treasury_manager': DollarSign,
  'meta_trader': ArrowRightLeft,
  'newsletter': Mail,
};

const statusColors = {
  active: 'from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-400',
  warning: 'from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-400',
  error: 'from-red-500/20 to-rose-500/20 border-red-500/50 text-red-400',
  idle: 'from-slate-500/20 to-gray-500/20 border-slate-500/50 text-slate-400',
};

const statusBadgeColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/50',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  error: 'bg-red-500/20 text-red-400 border-red-500/50',
  idle: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
};

const statusIcons = {
  active: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  idle: Clock,
};

export default function AdminSystems() {
  const { data, isLoading, error } = useQuery<SystemsStatusResponse>({
    queryKey: ['/api/admin/systems/status'],
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="neural-glass rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/80 font-medium">Loading autonomous systems...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="neural-glass border-red-500/50 p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Access Error</h2>
          </div>
          <p className="text-white/70">
            {error instanceof Error ? error.message : 'Failed to load systems data. Admin access required.'}
          </p>
        </Card>
      </div>
    );
  }

  const { systems, platformMetrics } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 neural-glass sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Autonomous Systems
              </h1>
              <p className="text-white/60 mt-2">Real-time monitoring of all AI-powered platform systems</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="text-white/80 text-sm">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Platform Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="neural-glass border-purple-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-white/60 text-sm">Total Systems</span>
            </div>
            <div className="text-3xl font-bold text-white">{platformMetrics.totalSystems}</div>
          </Card>

          <Card className="neural-glass border-green-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-white/60 text-sm">Active</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{platformMetrics.activeSystems}</div>
          </Card>

          <Card className="neural-glass border-amber-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-white/60 text-sm">Warning</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">{platformMetrics.warningSystems}</div>
          </Card>

          <Card className="neural-glass border-red-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-white/60 text-sm">Error</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{platformMetrics.errorSystems}</div>
          </Card>

          <Card className="neural-glass border-cyan-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span className="text-white/60 text-sm">Actions (24h)</span>
            </div>
            <div className="text-3xl font-bold text-cyan-400">{platformMetrics.totalActionsLast24h}</div>
          </Card>

          <Card className="neural-glass border-blue-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-white/60 text-sm">Success Rate</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">{platformMetrics.overallSuccessRate}%</div>
          </Card>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {systems.map((system) => {
            const Icon = systemIcons[system.key] || Activity;
            const StatusIcon = statusIcons[system.status];
            
            return (
              <Card
                key={system.key}
                className={`neural-glass border-2 bg-gradient-to-br ${statusColors[system.status]} hover:scale-[1.02] transition-all duration-300 overflow-hidden group`}
                data-testid={`system-card-${system.key}`}
              >
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white" data-testid={`system-name-${system.key}`}>
                          {system.name}
                        </h3>
                        <p className="text-white/60 text-sm">{system.description}</p>
                      </div>
                    </div>
                    <Badge className={`${statusBadgeColors[system.status]} border flex items-center gap-1`} data-testid={`system-status-${system.key}`}>
                      <StatusIcon className="w-3 h-3" />
                      {system.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white" data-testid={`system-actions-${system.key}`}>
                        {system.metrics.actionsPerHour}
                      </div>
                      <div className="text-xs text-white/60">Actions/hr</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400" data-testid={`system-success-rate-${system.key}`}>
                        {system.metrics.successRate}%
                      </div>
                      <div className="text-xs text-white/60">Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400" data-testid={`system-errors-${system.key}`}>
                        {system.metrics.errorCount}
                      </div>
                      <div className="text-xs text-white/60">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400" data-testid={`system-total-${system.key}`}>
                        {system.metrics.totalActions}
                      </div>
                      <div className="text-xs text-white/60">Total</div>
                    </div>
                  </div>

                  {/* Last Run Time */}
                  {system.lastRunTime && (
                    <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Last run: {formatDistanceToNow(new Date(system.lastRunTime), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>

                {/* Recent Actions */}
                <div className="p-6 max-h-64 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Recent Activity</h4>
                  {system.recentActions.length > 0 ? (
                    <div className="space-y-2">
                      {system.recentActions.slice(0, 5).map((action) => (
                        <div
                          key={action.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                          data-testid={`action-${action.id}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/90 text-sm font-medium">{action.actionType}</span>
                            <Badge
                              className={`text-xs ${
                                action.status === 'success'
                                  ? 'bg-green-500/20 text-green-400'
                                  : action.status === 'failed'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {action.status}
                            </Badge>
                          </div>
                          {action.reasoning && (
                            <p className="text-white/60 text-xs line-clamp-2 mb-1">{action.reasoning}</p>
                          )}
                          {action.errorMessage && (
                            <p className="text-red-400 text-xs line-clamp-1 mb-1">{action.errorMessage}</p>
                          )}
                          <div className="flex items-center gap-3 text-white/40 text-xs">
                            {action.createdAt && (
                              <span>{formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}</span>
                            )}
                            {action.executionTimeMs && (
                              <span>• {action.executionTimeMs}ms</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/40">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center gap-2 text-white/40 text-sm py-4">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
          <span>Auto-refreshing every 10 seconds</span>
        </div>
      </div>
    </div>
  );
}
