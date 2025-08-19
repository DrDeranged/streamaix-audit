import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WalletConnector } from '@/components/wallet/WalletConnector';
import { useWeb3 } from '@/hooks/useWeb3';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/ui/navigation';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  Send, 
  Receipt, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Globe,
  Settings,
  Copy,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Web3WalletPage() {
  const { wallet, isConnected, formatAddress, formatBalance, getNetworkInfo } = useWeb3();
  const { isAuthenticated } = useAuth();
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');

  // Mock additional data for demo purposes
  const mockTokens = [
    { symbol: 'STREAM', amount: '1,500.00', value: '$3,750.00', change: '+12.5%', icon: '🚀' },
    { symbol: 'USDC', amount: '10,250.00', value: '$10,250.00', change: '0.0%', icon: '💰' },
  ];

  const mockTransactions = [
    { id: 1, type: 'received', amount: '+250 STREAM', from: 'Summary Reward', time: '2 hours ago', hash: '0x1234...5678' },
    { id: 2, type: 'sent', amount: '-0.05 ETH', to: 'Gas Fee', time: '5 hours ago', hash: '0x2345...6789' },
    { id: 3, type: 'received', amount: '+500 STREAM', from: 'Bounty Completion', time: '1 day ago', hash: '0x3456...7890' },
    { id: 4, type: 'sent', amount: '-100 USDC', to: 'Platform Fee', time: '2 days ago', hash: '0x4567...8901' },
  ];

  const networkInfo = wallet ? getNetworkInfo(wallet.chainId) : null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <Wallet className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
              <p className="text-gray-300 mb-6">Please sign in to access your Web3 wallet features.</p>
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
      
      <div className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Web3 Wallet</h1>
          <p className="text-gray-400">Connect and manage your decentralized wallet</p>
        </motion.div>

        {/* Wallet Connection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <WalletConnector 
            showBalance={true} 
            showNetwork={true}
          >
            {isConnected && (
              <div className="mt-4">
                <p className="text-sm text-gray-300 mb-2">Web3 Features Available:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-green-500/30 text-green-300">
                    <Shield className="h-3 w-3 mr-1" />
                    Secure Transactions
                  </Badge>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                    <Globe className="h-3 w-3 mr-1" />
                    Decentralized Storage
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                    <Zap className="h-3 w-3 mr-1" />
                    Instant Rewards
                  </Badge>
                </div>
              </div>
            )}
          </WalletConnector>
        </motion.div>

        {isConnected && wallet && (
          <>
            {/* Wallet Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm font-medium">Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {networkInfo?.name || 'Unknown'}
                      </p>
                      <p className="text-gray-400 text-sm">Chain ID: {wallet.chainId}</p>
                    </div>
                    <Globe className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm font-medium">Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {wallet.balance ? formatBalance(wallet.balance) : '0.0000'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {networkInfo?.nativeCurrency.symbol || 'ETH'}
                      </p>
                    </div>
                    <Coins className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm font-medium">ENS Name</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {wallet.ensName || 'None'}
                      </p>
                      <p className="text-gray-400 text-sm">Domain name</p>
                    </div>
                    <Shield className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Tabs defaultValue="tokens" className="space-y-6">
                <TabsList className="bg-white/10 border border-white/20">
                  <TabsTrigger value="tokens" className="text-white data-[state=active]:bg-purple-600">
                    <Coins className="h-4 w-4 mr-2" />
                    Tokens
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="text-white data-[state=active]:bg-purple-600">
                    <Receipt className="h-4 w-4 mr-2" />
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger value="send" className="text-white data-[state=active]:bg-purple-600">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tokens" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Native Token */}
                    <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">ETH</span>
                            </div>
                            <div>
                              <CardTitle className="text-white">
                                {networkInfo?.nativeCurrency.symbol || 'ETH'}
                              </CardTitle>
                              <p className="text-gray-400 text-sm">{networkInfo?.name || 'Ethereum'}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-green-500/30 text-green-300">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +2.1%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xl font-bold text-white">
                              {wallet.balance ? formatBalance(wallet.balance) : '0.0000'}
                            </p>
                            <p className="text-gray-400 text-sm">~$0.00</p>
                          </div>
                          <Button variant="outline" size="sm" className="border-white/20">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mock Tokens */}
                    {mockTokens.map((token, index) => (
                      <Card key={token.symbol} className="bg-white/10 border-white/20 backdrop-blur-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{token.icon}</div>
                              <div>
                                <CardTitle className="text-white">{token.symbol}</CardTitle>
                                <p className="text-gray-400 text-sm">StreamAiX Token</p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={token.change.includes('+') 
                                ? "border-green-500/30 text-green-300" 
                                : "border-red-500/30 text-red-300"
                              }
                            >
                              {token.change.includes('+') ? <TrendingUp className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                              {token.change}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xl font-bold text-white">{token.amount}</p>
                              <p className="text-gray-400 text-sm">{token.value}</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-white/20">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-white">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockTransactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                tx.type === 'received' ? 'bg-green-500/20' : 'bg-red-500/20'
                              }`}>
                                {tx.type === 'received' ? (
                                  <ArrowDownRight className="h-4 w-4 text-green-400" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium">{tx.amount}</p>
                                <p className="text-gray-400 text-sm">{tx.from || tx.to}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-400 text-sm">{tx.time}</p>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="send" className="space-y-4">
                  <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-white">Send Tokens</CardTitle>
                      <p className="text-gray-400 text-sm">Send tokens to another wallet address</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Recipient Address</Label>
                        <Input
                          placeholder="0x..."
                          value={sendAddress}
                          onChange={(e) => setSendAddress(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Amount</Label>
                        <Input
                          placeholder="0.0"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        disabled={!sendAddress || !sendAmount}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Transaction
                      </Button>
                      <p className="text-yellow-300 text-sm text-center">
                        ⚠️ This is a demo interface. Real transactions require additional security measures.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </>
        )}

        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-12"
          >
            <Card className="bg-white/10 border-white/20 backdrop-blur-lg max-w-md mx-auto">
              <CardContent className="p-8">
                <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Wallet Connected</h3>
                <p className="text-gray-400 mb-6">
                  Connect your Web3 wallet to access decentralized features, manage tokens, and interact with the blockchain.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>✓ Secure wallet connection</p>
                  <p>✓ Real-time balance updates</p>
                  <p>✓ Transaction history</p>
                  <p>✓ Multi-network support</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}