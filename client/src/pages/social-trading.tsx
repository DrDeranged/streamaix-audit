import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Navigation } from '@/components/ui/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { socialTradingManager, type TraderProfile, type TradeSignal } from '@/lib/social-trading';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Star,
  Copy,
  Signal,
  DollarSign,
  Eye,
  BarChart3,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SocialTradingPage() {
  const { isAuthenticated } = useAuth();
  const { wallet, isConnected } = useWeb3();
  const { toast } = useToast();

  const [topTraders, setTopTraders] = useState<TraderProfile[]>([]);
  const [tradeSignals, setTradeSignals] = useState<TradeSignal[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<TraderProfile | null>(null);
  const [copyTradeAmount, setCopyTradeAmount] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('traders');

  useEffect(() => {
    loadSocialTradingData();
  }, []);

  const loadSocialTradingData = async () => {
    setIsLoading(true);
    try {
      const [traders, signals] = await Promise.all([
        socialTradingManager.getTopTraders('return', '30d', 10),
        socialTradingManager.getTradeSignals(20)
      ]);
      
      setTopTraders(traders);
      setTradeSignals(signals);
    } catch (error) {
      console.error('Error loading social trading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load social trading data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCopyTrading = async (trader: TraderProfile) => {
    if (!wallet) return;

    try {
      await socialTradingManager.startCopyTrading({
        traderAddress: trader.address,
        allocation: copyTradeAmount,
        maxSlippage: 2,
        copyNFTs: false,
        copyStaking: true,
        autoRebalance: true,
      });

      toast({
        title: 'Copy Trading Started',
        description: `Started copying ${trader.displayName} with $${copyTradeAmount}`,
      });
    } catch (error: any) {
      toast({
        title: 'Copy Trading Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 3) return 'text-green-400';
    if (riskScore <= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore <= 3) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (riskScore <= 6) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  const getSignalColor = (action: TradeSignal['action']) => {
    switch (action) {
      case 'BUY': return 'text-green-400';
      case 'SELL': return 'text-red-400';
      case 'HOLD': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <Users className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Social Trading Access</h2>
              <p className="text-gray-300 mb-6">Please sign in to access social trading features.</p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Social Trading</h1>
          <p className="text-gray-400">Follow top traders and copy their strategies</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="traders" className="text-white data-[state=active]:bg-purple-600">
              <Trophy className="h-4 w-4 mr-2" />
              Top Traders
            </TabsTrigger>
            <TabsTrigger value="signals" className="text-white data-[state=active]:bg-purple-600">
              <Signal className="h-4 w-4 mr-2" />
              Trade Signals
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-white data-[state=active]:bg-purple-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Top Traders */}
          <TabsContent value="traders" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-16 w-16 bg-white/10 rounded-full mx-auto"></div>
                        <div className="h-4 bg-white/10 rounded w-3/4 mx-auto"></div>
                        <div className="h-8 bg-white/10 rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topTraders.map((trader, index) => (
                  <motion.div
                    key={trader.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-white/10 border-white/20 backdrop-blur-lg hover:bg-white/15 transition-all duration-300">
                      <CardHeader className="text-center">
                        <div className="flex items-center justify-center mb-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={trader.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg font-bold">
                              {trader.displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {trader.verified && (
                            <Badge className="ml-2 bg-blue-500/20 text-blue-300">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-white">{trader.displayName}</CardTitle>
                        {trader.ensName && (
                          <p className="text-gray-400 text-sm">{trader.ensName}</p>
                        )}
                        {trader.bio && (
                          <p className="text-gray-300 text-sm mt-2">{trader.bio}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                              +{trader.totalReturn.toFixed(1)}%
                            </div>
                            <div className="text-gray-400 text-sm">Total Return</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {trader.sharpeRatio.toFixed(2)}
                            </div>
                            <div className="text-gray-400 text-sm">Sharpe Ratio</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-white">
                              {trader.winRate.toFixed(1)}%
                            </div>
                            <div className="text-gray-400 text-sm">Win Rate</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-semibold ${getRiskColor(trader.riskScore)}`}>
                              {trader.riskScore}/10
                            </div>
                            <div className="text-gray-400 text-sm">Risk Score</div>
                          </div>
                        </div>

                        {/* Follower Stats */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Users className="h-3 w-3" />
                            {trader.followers.toLocaleString()} followers
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="h-3 w-3" />
                            ${parseFloat(trader.aum).toLocaleString()}k AUM
                          </div>
                        </div>

                        {/* Top Assets */}
                        <div>
                          <h4 className="text-white text-sm font-medium mb-2">Top Holdings</h4>
                          <div className="flex flex-wrap gap-1">
                            {trader.topAssets.slice(0, 3).map((asset, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {asset.symbol} {asset.percentage}%
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                                onClick={() => setSelectedTrader(trader)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Trade
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/20 text-white">
                              <DialogHeader>
                                <DialogTitle>Copy Trade {trader.displayName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="amount">Allocation Amount</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    value={copyTradeAmount}
                                    onChange={(e) => setCopyTradeAmount(Number(e.target.value))}
                                    className="bg-white/5 border-white/20 text-white mt-2"
                                    placeholder="1000"
                                  />
                                  <p className="text-gray-400 text-sm mt-1">
                                    Copy trading fee: {trader.copyTradingFee}%
                                  </p>
                                </div>
                                
                                <div>
                                  <Label>Risk Level</Label>
                                  <Badge className={`mt-2 ${getRiskBadgeColor(trader.riskScore)}`}>
                                    Risk Score: {trader.riskScore}/10
                                  </Badge>
                                </div>

                                <Button
                                  onClick={() => handleStartCopyTrading(trader)}
                                  className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                                  disabled={!isConnected}
                                >
                                  Start Copy Trading
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-white/20 text-white hover:bg-white/5"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Follow
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Trade Signals */}
          <TabsContent value="signals" className="space-y-6">
            <div className="space-y-4">
              {tradeSignals.map((signal, index) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
                              {signal.traderName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-semibold">{signal.traderName}</h3>
                              <Badge className={`${getSignalColor(signal.action) === 'text-green-400' ? 'bg-green-500/20 text-green-300' :
                                getSignalColor(signal.action) === 'text-red-400' ? 'bg-red-500/20 text-red-300' :
                                'bg-yellow-500/20 text-yellow-300'}`}>
                                {signal.action}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {signal.confidence}% confidence
                              </Badge>
                            </div>
                            
                            <div className="text-white mb-2">
                              <span className="font-medium">{signal.asset}</span> at{' '}
                              <span className="font-mono">${signal.price}</span>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-3">
                              {signal.reasoning}
                            </p>
                            
                            {signal.performance && (
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">
                                  Entry: ${signal.performance.entry}
                                </span>
                                <span className="text-gray-400">
                                  Current: ${signal.performance.current}
                                </span>
                                <span className={signal.performance.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  P&L: {signal.performance.pnl >= 0 ? '+' : ''}{signal.performance.pnl.toFixed(2)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-gray-400 text-sm">
                            {new Date(signal.timestamp).toLocaleString()}
                          </div>
                          <Button 
                            size="sm" 
                            className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600"
                          >
                            Copy Signal
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topTraders.slice(0, 4).map((trader, index) => (
                <Card key={trader.address} className="bg-white/10 border-white/20 backdrop-blur-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-purple-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg font-bold">
                        {trader.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="text-white font-semibold mb-2">{trader.displayName}</h3>
                    
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      +{trader.totalReturn.toFixed(1)}%
                    </div>
                    <div className="text-gray-400 text-sm">Total Return</div>
                    
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Users className="h-3 w-3" />
                      {trader.followers.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}