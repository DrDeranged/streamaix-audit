import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { StatGrid } from '@/components/StatGrid';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigation } from '@/components/landing/navigation';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Zap,
  Target,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Activity,
  ArrowRight,
  Layers,
  GitBranch,
  Sparkles,
  Shield,
  RefreshCw,
} from 'lucide-react';

type Category =
  | 'regime_shift'
  | 'divergence'
  | 'contrarian'
  | 'cross_asset'
  | 'conditional'
  | 'opportunity'
  | 'risk';

interface ReasoningInsight {
  id: string;
  category: Category;
  headline: string;
  reasoning: string[];
  conclusion: string;
  conditional?: { trigger: string; thenOutcome: string };
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'caution';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  assets: string[];
  timestamp: string;
}

interface SmartInsightsResponse {
  success: boolean;
  generatedAt: string;
  modelUsed: string;
  fromCache: boolean;
  marketRegime: { label: string; description: string; durabilityHours: number };
  insights: ReasoningInsight[];
}

const CATEGORY_META: Record<Category, { label: string; Icon: typeof Brain; iconClass: string }> = {
  regime_shift: { label: 'Regime Shift', Icon: Layers, iconClass: 'text-fuchsia-400' },
  divergence: { label: 'Divergence', Icon: GitBranch, iconClass: 'text-cyan-400' },
  contrarian: { label: 'Contrarian', Icon: Sparkles, iconClass: 'text-purple-400' },
  cross_asset: { label: 'Cross-Asset', Icon: Activity, iconClass: 'text-cyan-400' },
  conditional: { label: 'If → Then', Icon: ArrowRight, iconClass: 'text-fuchsia-400' },
  opportunity: { label: 'Opportunity', Icon: Lightbulb, iconClass: 'text-cyan-400' },
  risk: { label: 'Risk', Icon: Shield, iconClass: 'text-fuchsia-400' },
};

const TAB_FILTERS: Array<{ value: string; label: string; predicate: (i: ReasoningInsight) => boolean }> = [
  { value: 'all', label: 'All Insights', predicate: () => true },
  { value: 'regime', label: 'Regime', predicate: i => i.category === 'regime_shift' },
  { value: 'reasoning', label: 'Divergence & Contrarian', predicate: i => i.category === 'divergence' || i.category === 'contrarian' },
  { value: 'conditional', label: 'If → Then', predicate: i => i.category === 'conditional' },
  { value: 'opportunity', label: 'Opportunities', predicate: i => i.category === 'opportunity' || i.category === 'cross_asset' },
  { value: 'risk', label: 'Risks', predicate: i => i.category === 'risk' },
];

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case 'bullish':
      return <TrendingUp className="h-4 w-4 text-cyan-400" />;
    case 'bearish':
      return <TrendingDown className="h-4 w-4 text-fuchsia-400" />;
    case 'caution':
      return <AlertCircle className="h-4 w-4 text-amber-400" />;
    default:
      return <Activity className="h-4 w-4 text-purple-400" />;
  }
}

function getImpactColor(impact: string) {
  switch (impact) {
    case 'high':
      return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30';
    case 'medium':
      return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
    default:
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30';
  }
}

export default function InsightsDashboard() {
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<SmartInsightsResponse>({
    queryKey: ['/api/smart-insights/reasoning'],
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  const insights = data?.insights ?? [];
  const filterFn = TAB_FILTERS.find(t => t.value === activeTab)?.predicate ?? (() => true);
  const filteredInsights = insights.filter(filterFn);

  const avgConfidence =
    insights.length === 0
      ? 0
      : Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length);
  const opportunities = insights.filter(i => i.category === 'opportunity' || i.category === 'cross_asset').length;
  const riskAlerts = insights.filter(i => i.category === 'risk').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navigation />
      <div className="section-container section-stack pt-24">
        <PageHeader
          eyebrow="AI · Reasoning chain"
          title="Smart Insights"
          icon={<Brain className="h-5 w-5" />}
          subtitle={
            <>
              Reasoning-chain market intelligence — regime shifts, divergences, contrarian setups, and
              <span className="text-purple-300"> if-then sequences</span>.
              {data && (
                <span className="block mt-1 text-xs text-muted-foreground" data-testid="insights-meta">
                  Generated {new Date(data.generatedAt).toLocaleTimeString()} · model{' '}
                  <span className="text-purple-400">{data.modelUsed}</span>
                  {data.fromCache && <span className="ml-2 text-cyan-400">(cached)</span>}
                </span>
              )}
            </>
          }
          actions={
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-4 py-2 rounded-lg surface-1 surface-interactive border border-purple-500/40 text-purple-200 hover:border-neon-purple/60 transition flex items-center gap-2 text-sm disabled:opacity-50 min-h-[44px]"
              data-testid="button-refresh-insights"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          }
        />

        {data?.marketRegime && (
          <Card className="surface-2 border-fuchsia-500/30" data-testid="card-market-regime">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-fuchsia-400" />
                <CardTitle className="text-fuchsia-200">Current Market Regime</CardTitle>
                <Badge variant="outline" className="ml-auto border-fuchsia-400/30 text-fuchsia-200">
                  ~{data.marketRegime.durabilityHours}h durability
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold bg-gradient-to-r from-fuchsia-400 to-purple-300 bg-clip-text text-transparent mb-2">
                {data.marketRegime.label}
              </div>
              <p className="text-gray-300 leading-relaxed">{data.marketRegime.description}</p>
            </CardContent>
          </Card>
        )}

        <StatGrid>
          {[
            { label: 'Active Insights', value: insights.length, Icon: Zap, tint: 'from-purple-400 to-fuchsia-400' },
            { label: 'Avg Confidence', value: `${avgConfidence}%`, Icon: CheckCircle2, tint: 'from-fuchsia-400 to-cyan-400' },
            { label: 'Opportunities', value: opportunities, Icon: Lightbulb, tint: 'from-cyan-400 to-purple-400' },
            { label: 'Risk Alerts', value: riskAlerts, Icon: AlertCircle, tint: 'from-purple-400 via-fuchsia-400 to-cyan-400' },
          ].map(stat => (
            <Card key={stat.label} className="surface-2 border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <stat.Icon className="h-4 w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.tint} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </StatGrid>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="surface-1 border border-purple-500/30 flex-wrap h-auto">
            {TAB_FILTERS.map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white"
                data-testid={`tab-${t.value}`}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-4">
            {isLoading && (
              <>
                {[0, 1, 2].map(i => (
                  <Card key={i} className="surface-1 border-purple-500/20">
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/3 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {isError && !isLoading && (
              <Card className="bg-red-900/10 border-red-500/30">
                <CardContent className="pt-6 text-red-300">
                  Failed to load reasoning insights. Click Refresh to try again.
                </CardContent>
              </Card>
            )}

            {!isLoading && !isError && filteredInsights.length === 0 && (
              <Card className="surface-1 border-purple-500/30">
                <CardContent className="pt-6 text-gray-400">
                  No insights match this filter right now. Try a different category.
                </CardContent>
              </Card>
            )}

            {filteredInsights.map(insight => {
              const meta = CATEGORY_META[insight.category] ?? CATEGORY_META.opportunity;
              const Icon = meta.Icon;
              return (
                <Card
                  key={insight.id}
                  className="surface-2 border-purple-500/30 hover:border-fuchsia-500/50 transition-all"
                  data-testid={`insight-${insight.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Icon className={`h-5 w-5 ${meta.iconClass}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={getImpactColor(insight.impact)}>{insight.impact} impact</Badge>
                          <Badge variant="outline" className="border-purple-400/30 text-purple-200">
                            {meta.label}
                          </Badge>
                          {insight.assets.slice(0, 3).map(a => (
                            <Badge key={a} variant="outline" className="border-cyan-400/30 text-cyan-200">
                              {a}
                            </Badge>
                          ))}
                          <div className="flex items-center gap-1 ml-auto">
                            {getSentimentIcon(insight.sentiment)}
                            <span className="text-xs text-gray-400 capitalize">{insight.sentiment}</span>
                          </div>
                        </div>
                        <CardTitle className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent text-lg">
                          {insight.headline}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
                        <Brain className="h-3 w-3" /> Reasoning chain
                      </div>
                      <ol className="space-y-1.5">
                        {insight.reasoning.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-gray-300">
                            <span className="text-purple-400 font-mono text-xs mt-0.5">{idx + 1}.</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {insight.conditional && (
                      <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-900/10 p-3 text-sm">
                        <div className="flex items-center gap-2 text-fuchsia-300 mb-1">
                          <ArrowRight className="h-4 w-4" />
                          <span className="font-semibold uppercase tracking-wide text-xs">If → Then</span>
                        </div>
                        <div className="text-gray-300">
                          <span className="text-fuchsia-200 font-medium">If</span> {insight.conditional.trigger}
                          <span className="text-fuchsia-200 font-medium"> then</span>{' '}
                          {insight.conditional.thenOutcome}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-purple-500/20 pt-3 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-2 text-sm text-gray-200 flex-1 min-w-0">
                        <Target className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{insight.conclusion}</span>
                      </div>
                      <div className="text-sm whitespace-nowrap">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="ml-2 font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                          {insight.confidence}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
