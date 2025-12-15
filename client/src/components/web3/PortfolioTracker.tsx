import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
    if (score < 3) return 'text-green-400';
    if (score < 7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score < 3) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (score < 7) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  if (!isConnected) {
    return (
      <Card className={`bg-white/10 border-white/20 backdrop-blur-lg ${className}`}>
        <CardContent className="p-8 text-center">
          <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">Portfolio Tracker</h3>
          <p className="text-gray-400">Connect your wallet to view portfolio analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Portfolio Overview
            </div>
            <Badge className={getRiskBadgeColor(portfolioData.riskScore)}>
              Risk: {portfolioData.riskScore}/10
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-8 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-white/10 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Total Portfolio Value */}
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${portfolioData.totalValue}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {portfolioData.dayChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <span className={portfolioData.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {portfolioData.dayChange >= 0 ? '+' : ''}{portfolioData.dayChange.toFixed(2)}%
                  </span>
                  <span className="text-gray-400">
                    (${portfolioData.dayChangeValue})
                  </span>
                </div>
              </div>

              {/* Portfolio Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-gray-900 dark:text-white font-semibold">${portfolioData.stakingValue}</div>
                  <div className="text-gray-400 text-sm">Staking</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-gray-900 dark:text-white font-semibold">${portfolioData.lpValue}</div>
                  <div className="text-gray-400 text-sm">Liquidity</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Target className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-gray-900 dark:text-white font-semibold">${portfolioData.nftValue}</div>
                  <div className="text-gray-400 text-sm">NFTs</div>
                </div>
              </div>

              {/* Token Holdings */}
              <div className="space-y-3">
                <h4 className="text-gray-900 dark:text-white font-semibold">Holdings</h4>
                {portfolioData.holdings.map((holding, index) => (
                  <motion.div
                    key={holding.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-gray-900 dark:text-white text-xs font-bold">
                          {holding.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium">{holding.symbol}</div>
                        <div className="text-gray-400 text-sm">{holding.balance}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-gray-900 dark:text-white font-semibold">${holding.value}</div>
                      <div className="flex items-center gap-2">
                        <span className={holding.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(2)}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {holding.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Risk Assessment */}
              <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-red-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <span className="text-gray-900 dark:text-white font-medium">Risk Assessment</span>
                  </div>
                  <span className={`font-bold ${getRiskColor(portfolioData.riskScore)}`}>
                    {portfolioData.riskScore.toFixed(1)}/10
                  </span>
                </div>
                <Progress 
                  value={portfolioData.riskScore * 10} 
                  className="h-2 mb-2" 
                />
                <div className="text-sm text-gray-300">
                  {portfolioData.riskScore < 3 && "Low risk portfolio with stable assets"}
                  {portfolioData.riskScore >= 3 && portfolioData.riskScore < 7 && "Moderate risk with balanced exposure"}
                  {portfolioData.riskScore >= 7 && "High risk portfolio - consider diversification"}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}