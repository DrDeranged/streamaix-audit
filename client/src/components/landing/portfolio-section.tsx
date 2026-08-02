import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  Wallet, TrendingUp, Brain, Shield,
  ArrowRight, Sparkles, Target, BarChart3, Lock, Eye, Zap,
  Bitcoin, DollarSign, Coins, Landmark, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';

const features = [
  {
    icon: Wallet,
    title: 'Unified Dashboard',
    description: 'Track crypto, stocks, ETFs, retirement, and cash in one place',
    color: 'bg-accent-core',
  },
  {
    icon: Brain,
    title: 'AI Intelligence',
    description: 'Get personalized rebalancing suggestions and risk analysis',
    color: 'bg-accent-deep',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays encrypted. No wallet connections required.',
    color: 'bg-gain',
  },
  {
    icon: Target,
    title: 'Real-time P&L',
    description: 'Live price syncing with automatic profit/loss calculations',
    color: 'bg-warn',
  },
];

const assetTypes = [
  { icon: Bitcoin, label: 'Crypto', color: 'text-warn' },
  { icon: TrendingUp, label: 'Stocks', color: 'text-accent-bright' },
  { icon: BarChart3, label: 'ETFs', color: 'text-accent-bright' },
  { icon: Landmark, label: 'Retirement', color: 'text-accent-bright' },
  { icon: Coins, label: 'Stablecoins', color: 'text-gain' },
  { icon: DollarSign, label: 'Cash', color: 'text-gain' },
  { icon: Building2, label: 'Real Estate', color: 'text-loss' },
];

function HealthScoreDemo() {
  const score = 78;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r="40" stroke="#232B45" strokeWidth="6" fill="none" />
        <motion.circle
          cx="48" cy="48" r="40"
          stroke="#3DD68C"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="tabular text-xl font-bold text-primary"
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted">Health</span>
      </div>
    </div>
  );
}

function AllocationPreview() {
  const allocations = [
    { type: 'Crypto', percent: 45, color: '#FFB454' },
    { type: 'Stocks', percent: 30, color: '#8B7CF6' },
    { type: 'ETFs', percent: 15, color: '#A99DF8' },
    { type: 'Cash', percent: 10, color: '#3DD68C' },
  ];

  return (
    <div className="space-y-2">
      {allocations.map((a, i) => (
        <motion.div
          key={a.type}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="w-16 text-xs text-secondary">{a.type}</div>
          <div className="flex-1 h-2 bg-ink-raised rounded-xl overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${a.percent}%` }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
              className="h-full rounded-xl"
              style={{ backgroundColor: a.color }}
             />
           </div>
          <div className="w-10 tabular text-xs text-primary text-right">{a.percent}%</div>
        </motion.div>
      ))}
     </div>
  );
}

export function PortfolioSection() {
  return (
    <div className="pt-24 pb-16 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-core/10 border border-accent-core/30 mb-6">
             <Sparkles className="w-4 h-4 text-accent-bright" />
             <span className="text-sm text-accent-bright">AI-Powered Portfolio Management</span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
               className="p-4 rounded-xl bg-accent-core shadow-xl shadow-accent-core/25"
              animate={{
                boxShadow: ['0 10px 40px -10px rgba(168,85,247,0.4)', '0 10px 60px -10px rgba(168,85,247,0.6)', '0 10px 40px -10px rgba(168,85,247,0.4)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Wallet className="w-10 h-10 text-white" />
            </motion.div>
          </div>

           <SectionTitle as="h1" className="text-4xl font-bold sm:text-5xl mb-4">
             AI Portfolio Command Center
           </SectionTitle>
           <p className="text-lg text-secondary max-w-2xl mx-auto mb-6">
            Track all your assets in one unified dashboard. Get AI-powered insights, 
            risk analysis, and personalized recommendations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {assetTypes.map((asset, i) => (
              <motion.div
                key={asset.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-raised rounded-xl border border-ink-edge"
              >
                <asset.icon className={cn("w-3.5 h-3.5", asset.color)} />
                 <span className="text-xs text-body">{asset.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
             <Surface className="p-6 h-full">
               <SectionTitle as="h3" className="text-xl font-semibold mb-6 flex items-center gap-2">
                 <Brain className="w-5 h-5 text-accent-bright" />
                 AI Analysis Preview
               </SectionTitle>
              <div className="flex items-center gap-8 mb-6">
                <HealthScoreDemo />
                <div className="flex-1">
                  <AllocationPreview />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <Surface variant="raised" className="p-3">
                   <p className="text-xs text-muted mb-1">Risk Level</p>
                   <Badge className="text-warn bg-warn/20">Moderate</Badge>
                 </Surface>
                 <Surface variant="raised" className="p-3">
                   <p className="text-xs text-muted mb-1">Diversification</p>
                  <div className="flex items-center gap-2">
                     <div className="flex-1 h-2 bg-ink-edge rounded-xl overflow-hidden">
                       <div className="h-full w-3/4 bg-gain rounded-xl" />
                    </div>
                     <span className="tabular text-sm text-primary">75%</span>
                  </div>
                 </Surface>
               </div>
             </Surface>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
             <Surface className="p-6 h-full">
               <SectionTitle as="h3" className="text-xl font-semibold mb-6 flex items-center gap-2">
                 <Lock className="w-5 h-5 text-gain" />
                 Privacy & Security
               </SectionTitle>
              <div className="space-y-4">
                 <Surface variant="raised" className="flex items-start gap-3 p-3 border border-gain/20">
                   <Shield className="w-5 h-5 text-gain mt-0.5" />
                  <div>
                     <p className="text-primary text-sm font-medium">No Wallet Connections Required</p>
                     <p className="text-secondary text-xs">Manually enter your holdings - we never access your wallets</p>
                  </div>
                 </Surface>
                 <Surface variant="raised" className="flex items-start gap-3 p-3 border border-accent-core/20">
                   <Eye className="w-5 h-5 text-accent-bright mt-0.5" />
                  <div>
                     <p className="text-primary text-sm font-medium">Hide Balances Anytime</p>
                     <p className="text-secondary text-xs">One-click privacy mode hides all sensitive values</p>
                  </div>
                 </Surface>
                 <Surface variant="raised" className="flex items-start gap-3 p-3 border border-accent-core/20">
                   <Zap className="w-5 h-5 text-accent-bright mt-0.5" />
                  <div>
                     <p className="text-primary text-sm font-medium">Real-Time Price Syncing</p>
                     <p className="text-secondary text-xs">Prices update automatically from trusted market data</p>
                  </div>
                 </Surface>
              </div>
             </Surface>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
               <Surface className="p-5 h-full hover:border-accent-core/30 transition-all">
                 <div className={cn("inline-flex p-2.5 rounded-xl mb-3", feature.color)}>
                   <feature.icon className="w-5 h-5 text-primary" />
                </div>
                 <h3 className="font-semibold text-primary mb-2">{feature.title}</h3>
                 <p className="text-sm text-secondary">{feature.description}</p>
               </Surface>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Link href="/portfolio">
            <Button
              size="lg"
               className="grad-accent glow-accent text-primary px-8 py-6 text-lg font-semibold group"
              data-testid="open-portfolio-button"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Open Portfolio Dashboard
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
           <p className="text-sm text-muted mt-4">Free to use. Sign in to save your portfolio.</p>
        </motion.div>
      </div>
    </div>
  );
}

export default PortfolioSection;
