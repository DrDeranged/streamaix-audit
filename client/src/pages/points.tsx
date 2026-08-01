import { usePointsHistory, usePointsWebSocket, formatPoints, getSourceIcon, getSourceLabel } from '@/hooks/usePoints';
import { Navigation } from '@/components/landing/navigation';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Calendar, Flame, Award, ArrowUpRight, ArrowDownRight, Loader2, Wifi, WifiOff } from 'lucide-react';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import SectionTitle from '@/components/ds/SectionTitle';
import { Badge } from '@/components/ui/badge';
import { NeuralNetworkBackground } from '@/components/NeuralNetworkBackground';
import { cn } from '@/lib/utils';

export default function PointsPage() {
  const { data, isLoading } = usePointsHistory(100, 0);
  const { isConnected } = usePointsWebSocket();

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
    <div className="min-h-[100dvh] bg-ink-page text-primary">
      <NeuralNetworkBackground />
      <Navigation />
      
      <main className="relative z-10 px-4 pb-12 pt-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-xl border border-accent-core/40 bg-accent-core/15 p-3 text-accent-bright">
                <Coins className="h-8 w-8" />
              </div>
              <div>
                <SectionTitle as="h1">STREAM Points</SectionTitle>
                <div className="flex items-center gap-2">
                  <p className="text-secondary">Track your earnings and spending</p>
                  <div className={cn(
                    "flex items-center gap-1 rounded-xl border px-2 py-0.5 text-xs",
                    isConnected 
                      ? "border-gain/30 bg-gain/10 text-gain"
                      : "border-ink-edge bg-ink-raised text-muted"
                  )}>
                    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isConnected ? 'Live' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent-bright" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Surface className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <StatValue label="Current Balance" value={formatPoints(data?.balance || 0)} valueClassName="text-gain" />
                        <Coins className="h-5 w-5 text-gain" />
                      </div>
                  </Surface>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Surface className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <StatValue label="Total Earned" value={formatPoints(data?.totalEarned || 0)} valueClassName="text-gain" />
                        <TrendingUp className="h-5 w-5 text-gain" />
                      </div>
                  </Surface>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Surface className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <StatValue label="Total Spent" value={formatPoints(data?.totalSpent || 0)} valueClassName="text-accent-bright" />
                        <TrendingDown className="h-5 w-5 text-accent-bright" />
                      </div>
                  </Surface>
                </motion.div>
              </div>

              <Surface>
                <div className="border-b border-ink-divider p-6">
                  <SectionTitle as="h2" className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent-bright" />
                    Transaction History
                  </SectionTitle>
                </div>
                <div className="p-0">
                  {!data?.transactions?.length ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Award className="mb-4 h-12 w-12 text-muted" />
                      <p className="mb-2 text-secondary">No transactions yet</p>
                      <p className="text-sm text-muted">Start earning STREAM points by engaging with the platform!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-ink-divider">
                      {data.transactions.map((tx, index) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center justify-between p-4 transition-colors hover:bg-ink-raised"
                          data-testid={`transaction-${tx.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                              tx.amount > 0 
                                ? "border border-gain/30 bg-gain/10"
                                : "border border-loss/30 bg-loss/10"
                            )}>
                              {getSourceIcon(tx.source)}
                            </div>
                            <div>
                              <p className="font-medium text-primary">
                                {getSourceLabel(tx.source)}
                              </p>
                              <p className="text-xs text-secondary">
                                {tx.description || formatDate(tx.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={cn(
                                "font-semibold flex items-center gap-1",
                                tx.amount > 0 ? "text-gain" : "text-loss"
                              )}>
                                {tx.amount > 0 ? (
                                  <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4" />
                                )}
                                {tx.amount > 0 ? '+' : ''}{formatPoints(Math.abs(tx.amount))}
                              </p>
                              <p className="text-xs text-muted">
                                Balance: {formatPoints(tx.balanceAfter)}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              tx.type === 'bonus' && "border-warn/50 text-warn",
                              tx.type === 'earn' && "border-gain/50 text-gain",
                              tx.type === 'spend' && "border-loss/50 text-loss",
                            )}>
                              {tx.type}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </Surface>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <Surface className="border-accent-core/20 bg-ink-surface p-6">
                  <SectionTitle as="h3" className="mb-4 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-warn" />
                    How to Earn STREAM Points
                  </SectionTitle>
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
                      <div key={item.label} className="rounded-xl border border-ink-edge bg-ink-raised p-3">
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <p className="text-sm font-medium text-primary">{item.label}</p>
                        <p className="text-xs text-gain">+{item.points}</p>
                      </div>
                    ))}
                  </div>
                </Surface>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
