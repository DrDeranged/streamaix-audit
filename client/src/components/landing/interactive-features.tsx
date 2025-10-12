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
import { Card, CardContent } from '@/components/ui/card';

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
      gradient: 'from-purple-500/20 to-pink-500/20',
      stat: ((bountiesData as any)?.open?.toString() || '0'),
      statLabel: 'Open Bounties'
    },
    {
      icon: TrendingUp,
      title: 'Prediction Markets',
      description: 'Trade on AI-generated predictions from content analysis',
      link: '/markets',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      stat: ((marketsData as any)?.active?.toString() || '0'),
      statLabel: 'Active Markets'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Real-time market intelligence with 67+ API endpoints',
      link: '/discover',
      gradient: 'from-green-500/20 to-emerald-500/20',
      stat: '9',
      statLabel: 'Categories'
    },
    {
      icon: FileText,
      title: 'AI Summaries',
      description: 'Transform podcasts & videos into actionable insights',
      link: '/summaries',
      gradient: 'from-orange-500/20 to-red-500/20',
      stat: ((summariesData as any)?.total?.toString() || '0'),
      statLabel: 'Summaries'
    },
    {
      icon: LayoutDashboard,
      title: 'Dashboard',
      description: 'Your personal hub for tracking summaries, bounties & portfolio',
      link: '/dashboard',
      gradient: 'from-indigo-500/20 to-purple-500/20',
      stat: 'Live',
      statLabel: 'Real-time Data'
    },
    {
      icon: Sparkles,
      title: 'Discover',
      description: 'Advanced insights with volatility forecasting & pattern recognition',
      link: '/discover',
      gradient: 'from-yellow-500/20 to-amber-500/20',
      stat: '67+',
      statLabel: 'API Endpoints'
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-medium">Explore Platform</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Access Everything
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Navigate directly to any section of the platform. Real-time data, AI-powered insights, and decentralized features at your fingertips.
          </p>
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
                <Card 
                  className={`group relative bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border-white/10 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer h-full overflow-hidden`}
                  data-testid={`card-feature-${feature.title.toLowerCase().replace(' ', '-')}`}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:via-transparent group-hover:to-purple-500/10 transition-all duration-500" />
                  
                  {/* Animated border gradient */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-cyan-500/50 blur-xl" />
                  </div>

                  <CardContent className="p-6 relative z-10">
                    {/* Icon and stat badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all duration-300">
                        <feature.icon className="h-6 w-6 text-cyan-400" />
                      </div>
                      
                      {feature.stat && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {feature.stat}
                          </div>
                          <div className="text-xs text-gray-400">
                            {feature.statLabel}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {feature.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium group-hover:gap-3 transition-all">
                      <span>Explore</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
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
          <p className="text-gray-400 text-sm">
            New to StreamAiX?{' '}
            <Link href="/onboarding">
              <span className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer">
                Start the interactive tour
              </span>
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
