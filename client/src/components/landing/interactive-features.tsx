import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Target, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  LayoutDashboard, 
  Sparkles,
  ArrowRight,
  Zap
} from 'lucide-react';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';

interface FeatureCardData {
  icon: any;
  title: string;
  description: string;
  link: string;
  gradient: string;
  stat?: string;
  statLabel?: string;
}

export function InteractiveFeatures() {
  // Fetch live stats
  const { data: bountiesData } = useQuery({
    queryKey: ['/api/bounties/stats'],
    staleTime: 30000,
  });

  const { data: marketsData } = useQuery({
    queryKey: ['/api/prediction-markets/stats'],
    staleTime: 30000,
  });

  const { data: summariesData } = useQuery({
    queryKey: ['/api/summaries/stats'],
    staleTime: 30000,
  });

  const features: FeatureCardData[] = [
    {
      icon: Target,
      title: 'Bounties',
      description: 'Gamified task marketplace with multi-token rewards and AI quality scoring',
      link: '/bounties',
      gradient: 'bg-accent-core/10',
      stat: ((bountiesData as any)?.open?.toString() || '0'),
      statLabel: 'Open Bounties'
    },
    {
      icon: TrendingUp,
      title: 'Prediction Markets',
      description: 'Trade on AI-generated predictions from content analysis',
      link: '/markets',
      gradient: 'bg-accent-core/10',
      stat: ((marketsData as any)?.active?.toString() || '0'),
      statLabel: 'Active Markets'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Real-time market intelligence with 67+ API endpoints',
      link: '/discover',
      gradient: 'bg-gain/10',
      stat: '9',
      statLabel: 'Categories'
    },
    {
      icon: FileText,
      title: 'AI Summaries',
      description: 'Transform podcasts & videos into actionable insights',
      link: '/summaries',
      gradient: 'bg-warn/10',
      stat: ((summariesData as any)?.total?.toString() || '0'),
      statLabel: 'Summaries'
    },
    {
      icon: LayoutDashboard,
      title: 'Dashboard',
      description: 'Your personal hub for tracking summaries, bounties & portfolio',
      link: '/dashboard',
      gradient: 'bg-accent-core/10',
      stat: 'Live',
      statLabel: 'Real-time Data'
    },
    {
      icon: Sparkles,
      title: 'Discover',
      description: 'Advanced insights with volatility forecasting & pattern recognition',
      link: '/discover',
      gradient: 'bg-warn/10',
      stat: '67+',
      statLabel: 'API Endpoints'
    }
  ];

  return (
    <section className="relative overflow-hidden bg-ink-page px-4 py-24 sm:px-6 lg:px-8">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-accent-core/5" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-bright">
              <Zap className="h-3 w-3" />
              <span>Explore Platform</span>
            </div>
            <SectionTitle as="h2" className="text-center text-2xl sm:text-3xl">
              Access Everything
            </SectionTitle>
            <p className="max-w-xl text-center text-sm text-secondary">
              Navigate directly to any section of the platform
            </p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={feature.link}>
                <Surface
                  className={`group relative h-full cursor-pointer overflow-hidden border-ink-edge ${feature.gradient} transition-all duration-300 hover:border-accent-core`}
                  data-testid={`card-feature-${feature.title.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="relative z-10 p-6">
                    {/* Icon and stat badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="rounded-xl border border-accent-core/20 bg-accent-core/10 p-3 transition-all duration-300 group-hover:border-accent-core/50 group-hover:bg-accent-core/20">
                        <feature.icon className="h-6 w-6 text-accent-bright" />
                      </div>
                      
                      {feature.stat && (
                        <StatValue
                          className="text-right"
                          label={feature.statLabel}
                          value={feature.stat}
                          valueClassName="text-accent-bright group-hover:text-primary transition-colors"
                        />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 text-xl font-semibold text-primary transition-colors group-hover:text-accent-bright">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="mb-4 line-clamp-2 text-sm text-secondary">
                      {feature.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-medium text-accent-bright transition-all group-hover:gap-3">
                      <span>Explore</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Surface>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-secondary">
            New to StreamAiX?{' '}
            <Link href="/onboarding">
              <span className="cursor-pointer text-accent-bright underline underline-offset-4 hover:text-primary">
                Start the interactive tour
              </span>
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
