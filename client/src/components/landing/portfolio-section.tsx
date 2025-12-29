import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  Wallet, PieChart, TrendingUp, TrendingDown, Brain, Shield,
  ArrowRight, Sparkles, Target, BarChart3, Lock, Eye, Zap,
  Bitcoin, DollarSign, Coins, Landmark, Building2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Wallet,
    title: 'Unified Dashboard',
    description: 'Track crypto, stocks, ETFs, retirement, and cash in one place',
    color: 'from-purple-500 to-fuchsia-500',
  },
  {
    icon: Brain,
    title: 'AI Intelligence',
    description: 'Get personalized rebalancing suggestions and risk analysis',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays encrypted. No wallet connections required.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Target,
    title: 'Real-time P&L',
    description: 'Live price syncing with automatic profit/loss calculations',
    color: 'from-amber-500 to-orange-500',
  },
];

const assetTypes = [
  { icon: Bitcoin, label: 'Crypto', color: 'text-orange-400' },
  { icon: TrendingUp, label: 'Stocks', color: 'text-blue-400' },
  { icon: BarChart3, label: 'ETFs', color: 'text-purple-400' },
  { icon: Landmark, label: 'Retirement', color: 'text-indigo-400' },
  { icon: Coins, label: 'Stablecoins', color: 'text-teal-400' },
  { icon: DollarSign, label: 'Cash', color: 'text-green-400' },
  { icon: Building2, label: 'Real Estate', color: 'text-rose-400' },
];

function HealthScoreDemo() {
  const score = 78;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
        <motion.circle
          cx="48" cy="48" r="40"
          stroke="#22c55e"
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
          className="text-xl font-bold text-white"
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-gray-400">Health</span>
      </div>
    </div>
  );
}

function AllocationPreview() {
  const allocations = [
    { type: 'Crypto', percent: 45, color: '#f59e0b' },
    { type: 'Stocks', percent: 30, color: '#3b82f6' },
    { type: 'ETFs', percent: 15, color: '#8b5cf6' },
    { type: 'Cash', percent: 10, color: '#10b981' },
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
          <div className="w-16 text-xs text-gray-400">{a.type}</div>
          <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${a.percent}%` }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
              className="h-full rounded-full"
              style={{ backgroundColor: a.color }}
            />
          </div>
          <div className="w-10 text-xs text-white text-right">{a.percent}%</div>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI-Powered Portfolio Management</span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-xl shadow-purple-500/25"
              animate={{
                boxShadow: ['0 10px 40px -10px rgba(168,85,247,0.4)', '0 10px 60px -10px rgba(168,85,247,0.6)', '0 10px 40px -10px rgba(168,85,247,0.4)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Wallet className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-4">
            AI Portfolio Command Center
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-6">
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-full border border-slate-700/50"
              >
                <asset.icon className={cn("w-3.5 h-3.5", asset.color)} />
                <span className="text-xs text-gray-300">{asset.label}</span>
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
            <Card className="bg-slate-900/60 border-slate-700/50 p-6 backdrop-blur-sm h-full">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                AI Analysis Preview
              </h3>
              <div className="flex items-center gap-8 mb-6">
                <HealthScoreDemo />
                <div className="flex-1">
                  <AllocationPreview />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Risk Level</p>
                  <Badge className="text-amber-400 bg-amber-500/20">Moderate</Badge>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Diversification</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-green-500 rounded-full" />
                    </div>
                    <span className="text-sm text-white">75%</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-slate-900/60 border-slate-700/50 p-6 backdrop-blur-sm h-full">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                Privacy & Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">No Wallet Connections Required</p>
                    <p className="text-gray-400 text-xs">Manually enter your holdings - we never access your wallets</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <Eye className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Hide Balances Anytime</p>
                    <p className="text-gray-400 text-xs">One-click privacy mode hides all sensitive values</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Real-Time Price Syncing</p>
                    <p className="text-gray-400 text-xs">Prices update automatically from trusted market data</p>
                  </div>
                </div>
              </div>
            </Card>
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
              <Card className="bg-slate-900/60 border-slate-700/50 p-5 h-full backdrop-blur-sm hover:border-purple-500/30 transition-all">
                <div className={cn("inline-flex p-2.5 rounded-xl bg-gradient-to-br mb-3", feature.color)}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </Card>
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
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white px-8 py-6 text-lg font-semibold shadow-xl shadow-purple-500/25 group"
              data-testid="open-portfolio-button"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Open Portfolio Dashboard
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">Free to use. Sign in to save your portfolio.</p>
        </motion.div>
      </div>
    </div>
  );
}

export default PortfolioSection;
