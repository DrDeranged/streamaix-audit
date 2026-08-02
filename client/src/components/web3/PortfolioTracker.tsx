import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import StatValue from '@/components/ds/StatValue';
import { useWeb3 } from '@/hooks/useWeb3';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Target,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TokenHolding {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  percentage: number;
  change24h: number;
  logo: string;
}

interface PortfolioData {
  totalValue: string;
  dayChange: number;
  dayChangeValue: string;
  holdings: TokenHolding[];
  stakingValue: string;
  lpValue: string;
  nftValue: string;
  riskScore: number;
}

interface PortfolioTrackerProps {
  className?: string;
}

export function PortfolioTracker({ className = '' }: PortfolioTrackerProps) {
  const { wallet, isConnected } = useWeb3();
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValue: '0.00',
    dayChange: 0,
    dayChangeValue: '0.00',
    holdings: [],
    stakingValue: '0.00',
    lpValue: '0.00',
    nftValue: '0.00',
    riskScore: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Real portfolio data fetching (when wallet is connected)
  useEffect(() => {
    if (!isConnected) {
      // Reset portfolio data when wallet disconnects
      setPortfolioData({
        totalValue: '0.00',
        dayChange: 0,
        dayChangeValue: '0.00',
        holdings: [],
        stakingValue: '0.00',
        lpValue: '0.00',
        nftValue: '0.00',
        riskScore: 0
      });
      return;
    }

    // Portfolio data fetching is handled when wallet provides balance APIs
    // For now, display zero values until Web3 integration is complete
    if (wallet?.address) {
      console.log(`Portfolio tracking active for wallet: ${wallet.address.slice(0, 8)}...`);
    }
  }, [isConnected]);

  const getRiskColor = (score: number) => {
    if (score < 3) return 'text-gain';
    if (score < 7) return 'text-warn';
    return 'text-loss';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score < 3) return 'bg-gain/10 text-gain border-gain/30';
    if (score < 7) return 'bg-warn/10 text-warn border-warn/30';
    return 'bg-loss/10 text-loss border-loss/30';
  };

  if (!isConnected) {
    return (
      <Surface className={`p-8 text-center ${className}`}>
        <PieChart className="mx-auto mb-4 h-16 w-16 text-muted" />
        <SectionTitle as="h3" className="mb-2">Portfolio Tracker</SectionTitle>
        <p className="text-secondary">Connect your wallet to view portfolio analytics</p>
      </Surface>
    );
  }

  return (
    <div className={className}>
      <Surface className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <SectionTitle as="h3">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-accent-bright" />
              Portfolio Overview
            </div>
          </SectionTitle>
          <Badge className={`rounded-xl border ${getRiskBadgeColor(portfolioData.riskScore)}`}>
              Risk: {portfolioData.riskScore}/10
          </Badge>
        </div>
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="mb-2 h-8 rounded-xl bg-ink-raised"></div>
                  <div className="h-4 w-1/2 rounded-xl bg-ink-raised"></div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                      <div className="h-12 rounded-xl bg-ink-raised"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Total Portfolio Value */}
              <div className="space-y-2 text-center">
                <StatValue label="Total portfolio value" value={`$${portfolioData.totalValue}`} valueClassName="text-3xl font-bold" />
                <div className="flex items-center justify-center gap-2">
                  {portfolioData.dayChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-gain" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-loss" />
                  )}
                  <span className={`tabular ${portfolioData.dayChange >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {portfolioData.dayChange >= 0 ? '+' : ''}{portfolioData.dayChange.toFixed(2)}%
                  </span>
                  <span className="tabular text-secondary">
                    (${portfolioData.dayChangeValue})
                  </span>
                </div>
              </div>

              {/* Portfolio Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-ink-divider bg-ink-raised p-3 text-center">
                  <Activity className="mx-auto mb-2 h-6 w-6 text-accent-bright" />
                  <div className="tabular font-semibold text-primary">${portfolioData.stakingValue}</div>
                  <div className="text-sm text-muted">Staking</div>
                </div>
                <div className="rounded-xl border border-ink-divider bg-ink-raised p-3 text-center">
                  <DollarSign className="mx-auto mb-2 h-6 w-6 text-accent-bright" />
                  <div className="tabular font-semibold text-primary">${portfolioData.lpValue}</div>
                  <div className="text-sm text-muted">Liquidity</div>
                </div>
                <div className="rounded-xl border border-ink-divider bg-ink-raised p-3 text-center">
                  <Target className="mx-auto mb-2 h-6 w-6 text-warn" />
                  <div className="tabular font-semibold text-primary">${portfolioData.nftValue}</div>
                  <div className="text-sm text-muted">NFTs</div>
                </div>
              </div>

              {/* Token Holdings */}
              <div className="space-y-3">
                <SectionTitle as="h3">Holdings</SectionTitle>
                {portfolioData.holdings.map((holding, index) => (
                  <motion.div
                    key={holding.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between rounded-xl border border-ink-divider bg-ink-raised p-3 transition-colors hover:bg-ink-surface"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-deep">
                        <span className="text-xs font-bold text-primary">
                          {holding.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-primary">{holding.symbol}</div>
                        <div className="text-sm text-secondary">{holding.balance}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="tabular font-semibold text-primary">${holding.value}</div>
                      <div className="flex items-center gap-2">
                        <span className={`tabular ${holding.change24h >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(2)}%
                        </span>
                        <Badge variant="outline" className="rounded-xl border-ink-edge text-xs text-secondary">
                          {holding.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Risk Assessment */}
              <div className="rounded-xl border border-warn/30 bg-warn/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warn" />
                    <span className="font-medium text-primary">Risk Assessment</span>
                  </div>
                  <span className={`font-bold ${getRiskColor(portfolioData.riskScore)}`}>
                    {portfolioData.riskScore.toFixed(1)}/10
                  </span>
                </div>
                <Progress 
                  value={portfolioData.riskScore * 10} 
                  className="h-2 mb-2" 
                />
                <div className="text-sm text-body">
                  {portfolioData.riskScore < 3 && "Low risk portfolio with stable assets"}
                  {portfolioData.riskScore >= 3 && portfolioData.riskScore < 7 && "Moderate risk with balanced exposure"}
                  {portfolioData.riskScore >= 7 && "High risk portfolio - consider diversification"}
                </div>
              </div>
            </>
          )}
        </div>
      </Surface>
    </div>
  );
}