import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { StatGrid } from '@/components/StatGrid';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigation } from '@/components/landing/navigation';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';
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
  regime_shift: { label: 'Regime Shift', Icon: Layers, iconClass: 'text-accent-bright' },
  divergence: { label: 'Divergence', Icon: GitBranch, iconClass: 'text-accent-bright' },
  contrarian: { label: 'Contrarian', Icon: Sparkles, iconClass: 'text-accent-bright' },
  cross_asset: { label: 'Cross-Asset', Icon: Activity, iconClass: 'text-accent-bright' },
  conditional: { label: 'If → Then', Icon: ArrowRight, iconClass: 'text-accent-bright' },
  opportunity: { label: 'Opportunity', Icon: Lightbulb, iconClass: 'text-accent-bright' },
  risk: { label: 'Risk', Icon: Shield, iconClass: 'text-warn' },
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
      return <TrendingUp className="h-4 w-4 text-gain" />;
    case 'bearish':
      return <TrendingDown className="h-4 w-4 text-loss" />;
    case 'caution':
      return <AlertCircle className="h-4 w-4 text-warn" />;
    default:
      return <Activity className="h-4 w-4 text-accent-bright" />;
  }
}

function getImpactColor(impact: string) {
  switch (impact) {
    case 'high':
      return 'bg-loss/10 text-loss border-loss/30';
    case 'medium':
      return 'bg-accent-core/10 text-accent-bright border-accent-core/30';
    default:
      return 'bg-gain/10 text-gain border-gain/30';
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
    <div className="min-h-[100dvh] bg-ink-page">
      <Navigation />
      <div className="section-container section-stack pt-24">
        <PageHeader
          eyebrow="AI · Reasoning chain"
          title="Smart Insights"
          icon={<Brain className="h-5 w-5" />}
          subtitle={
            <>
              Reasoning-chain market intelligence — regime shifts, divergences, contrarian setups, and
               <span className="text-accent-bright"> if-then sequences</span>.
              {data && (
                 <span className="mt-1 block text-xs text-muted" data-testid="insights-meta">
                  Generated {new Date(data.generatedAt).toLocaleTimeString()} · model{' '}
                   <span className="text-accent-bright">{data.modelUsed}</span>
                   {data.fromCache && <span className="ml-2 text-gain">(cached)</span>}
                </span>
              )}
            </>
          }
          actions={
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
               className="min-h-[44px] rounded-xl border border-accent-core/40 bg-ink-surface px-4 py-2 text-sm text-accent-bright transition hover:border-accent-core hover:bg-ink-raised disabled:opacity-50 flex items-center gap-2"
              data-testid="button-refresh-insights"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          }
        />

         {data?.marketRegime && (
           <Surface className="grad-surface p-5" data-testid="card-market-regime">
             <div className="mb-4 flex items-center gap-2">
                 <Layers className="h-5 w-5 text-accent-bright" />
                 <SectionTitle as="h2">Current Market Regime</SectionTitle>
                 <Badge variant="outline" className="ml-auto border-accent-core/30 text-accent-bright">
                  ~{data.marketRegime.durabilityHours}h durability
                </Badge>
             </div>
             <div>
               <div className="mb-2 text-2xl font-semibold text-primary">
                {data.marketRegime.label}
              </div>
               <p className="leading-relaxed text-body">{data.marketRegime.description}</p>
             </div>
           </Surface>
        )}

        <StatGrid>
          {[
             { label: 'Active Insights', value: insights.length, Icon: Zap },
             { label: 'Avg Confidence', value: `+${avgConfidence.toFixed(2)}%`, Icon: CheckCircle2 },
             { label: 'Opportunities', value: opportunities, Icon: Lightbulb },
             { label: 'Risk Alerts', value: riskAlerts, Icon: AlertCircle },
          ].map(stat => (
             <Surface key={stat.label} className="p-4">
               <div className="mb-3 flex items-center gap-2 text-sm font-medium text-secondary">
                  <stat.Icon className="h-4 w-4" />
                  {stat.label}
               </div>
               <StatValue label="" value={stat.value} valueClassName="text-3xl font-bold" />
             </Surface>
          ))}
        </StatGrid>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
           <TabsList className="flex h-auto flex-wrap border border-ink-edge bg-ink-surface">
            {TAB_FILTERS.map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                 className="data-[state=active]:bg-accent-core data-[state=active]:text-white data-[state=active]:glow-accent"
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
                   <Surface key={i} className="p-4">
                     <div>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/3 mt-2" />
                     </div>
                     <div className="mt-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                     </div>
                   </Surface>
                ))}
              </>
            )}

            {isError && !isLoading && (
               <Surface className="p-4 text-loss">
                 <div className="pt-2">
                  Failed to load reasoning insights. Click Refresh to try again.
                 </div>
               </Surface>
            )}

            {!isLoading && !isError && filteredInsights.length === 0 && (
               <Surface className="p-4 text-secondary">
                 <div className="pt-2">
                  No insights match this filter right now. Try a different category.
                 </div>
               </Surface>
            )}

            {filteredInsights.map(insight => {
              const meta = CATEGORY_META[insight.category] ?? CATEGORY_META.opportunity;
              const Icon = meta.Icon;
              return (
                 <Surface
                  key={insight.id}
                   className="p-4 transition hover:border-accent-core"
                  data-testid={`insight-${insight.id}`}
                >
                   <div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Icon className={`h-5 w-5 ${meta.iconClass}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={getImpactColor(insight.impact)}>{insight.impact} impact</Badge>
                           <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
                            {meta.label}
                          </Badge>
                          {insight.assets.slice(0, 3).map(a => (
                             <Badge key={a} variant="outline" className="border-accent-core/30 text-accent-bright">
                              {a}
                            </Badge>
                          ))}
                          <div className="flex items-center gap-1 ml-auto">
                            {getSentimentIcon(insight.sentiment)}
                             <span className="text-xs text-secondary capitalize">{insight.sentiment}</span>
                          </div>
                        </div>
                         <SectionTitle as="h3" className="text-lg">
                          {insight.headline}
                         </SectionTitle>
                      </div>
                    </div>
                   </div>

                   <div className="mt-4 space-y-4">
                    <div>
                       <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
                        <Brain className="h-3 w-3" /> Reasoning chain
                      </div>
                      <ol className="space-y-1.5">
                        {insight.reasoning.map((step, idx) => (
                           <li key={idx} className="flex gap-3 text-sm text-body">
                             <span className="mt-0.5 font-mono text-xs text-accent-bright">{idx + 1}.</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {insight.conditional && (
                       <Surface variant="raised" className="border border-accent-core/30 p-3 text-sm">
                         <div className="mb-1 flex items-center gap-2 text-accent-bright">
                          <ArrowRight className="h-4 w-4" />
                          <span className="font-semibold uppercase tracking-wide text-xs">If → Then</span>
                        </div>
                         <div className="text-body">
                           <span className="font-medium text-accent-bright">If</span> {insight.conditional.trigger}
                           <span className="font-medium text-accent-bright"> then</span>{' '}
                          {insight.conditional.thenOutcome}
                         </div>
                       </Surface>
                     )}

                     <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-divider pt-3">
                       <div className="flex min-w-0 flex-1 items-start gap-2 text-sm text-body">
                         <Target className="mt-0.5 h-4 w-4 shrink-0 text-gain" />
                        <span className="leading-relaxed">{insight.conclusion}</span>
                      </div>
                      <div className="text-sm whitespace-nowrap">
                         <span className="text-secondary">Confidence:</span>
                         <span className="tabular ml-2 font-semibold text-accent-bright">
                           {insight.confidence >= 0 ? '+' : ''}
                           {insight.confidence.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                   </div>
                 </Surface>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
