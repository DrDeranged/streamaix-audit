import { usePointsHistory, formatPoints, getSourceIcon, getSourceLabel } from '@/hooks/usePoints';
import { Navigation } from '@/components/landing/navigation';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Calendar, Flame, Award, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeuralNetworkBackground } from '@/components/NeuralNetworkBackground';
import { cn } from '@/lib/utils';

export default function PointsPage() {
  const { data, isLoading } = usePointsHistory(100, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NeuralNetworkBackground />
      <Navigation />
      
      <main className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-white via-emerald-200 to-cyan-200 bg-clip-text text-transparent">
                  STREAM Points
                </h1>
                <p className="text-slate-400">Track your earnings and spending</p>
              </div>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-slate-900/60 border-emerald-500/30 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Current Balance</span>
                        <Coins className="w-5 h-5 text-emerald-400" />
                      </div>
                      <p className="text-3xl font-bold text-emerald-400">
                        {formatPoints(data?.balance || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-slate-900/60 border-cyan-500/30 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Total Earned</span>
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                      </div>
                      <p className="text-3xl font-bold text-cyan-400">
                        {formatPoints(data?.totalEarned || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-slate-900/60 border-violet-500/30 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Total Spent</span>
                        <TrendingDown className="w-5 h-5 text-violet-400" />
                      </div>
                      <p className="text-3xl font-bold text-violet-400">
                        {formatPoints(data?.totalSpent || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-xl">
                <CardHeader className="border-b border-slate-700/50">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!data?.transactions?.length ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Award className="w-12 h-12 text-slate-600 mb-4" />
                      <p className="text-slate-400 mb-2">No transactions yet</p>
                      <p className="text-sm text-slate-500">Start earning STREAM points by engaging with the platform!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/50">
                      {data.transactions.map((tx, index) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                          data-testid={`transaction-${tx.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                              tx.amount > 0 
                                ? "bg-emerald-500/10 border border-emerald-500/30" 
                                : "bg-red-500/10 border border-red-500/30"
                            )}>
                              {getSourceIcon(tx.source)}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {getSourceLabel(tx.source)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {tx.description || formatDate(tx.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={cn(
                                "font-semibold flex items-center gap-1",
                                tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                              )}>
                                {tx.amount > 0 ? (
                                  <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4" />
                                )}
                                {tx.amount > 0 ? '+' : ''}{formatPoints(Math.abs(tx.amount))}
                              </p>
                              <p className="text-xs text-slate-500">
                                Balance: {formatPoints(tx.balanceAfter)}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              tx.type === 'bonus' && "border-amber-500/50 text-amber-400",
                              tx.type === 'earn' && "border-emerald-500/50 text-emerald-400",
                              tx.type === 'spend' && "border-red-500/50 text-red-400",
                            )}>
                              {tx.type}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 border border-emerald-500/20"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  How to Earn STREAM Points
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Sign Up', points: '2,500', icon: '🎉' },
                    { label: 'Daily Login', points: '50-150', icon: '📅' },
                    { label: 'Watch Streams', points: '10/5min', icon: '📺' },
                    { label: 'Voice Chat', points: '50', icon: '🎤' },
                    { label: 'Submit Bounty', points: '100-500', icon: '📝' },
                    { label: 'Bounty Accepted', points: '1,000', icon: '✅' },
                    { label: 'Prediction Win', points: '1.5x stake', icon: '🎯' },
                    { label: 'Refer Friend', points: '500', icon: '👥' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-emerald-400">+{item.points}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
