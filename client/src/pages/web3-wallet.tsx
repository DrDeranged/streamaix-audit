import { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Surface from '@/components/ds/Surface';
import StatValue from '@/components/ds/StatValue';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Web3WalletPage() {
  const { wallet, isConnected, formatBalance, getNetworkInfo } = useWeb3();
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
      <div className="min-h-[100dvh] bg-ink-page">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Surface className="rounded-xl">
            <CardContent className="p-8 text-center">
               <Wallet className="h-16 w-16 text-accent-bright mx-auto mb-4" />
               <h2 className="text-2xl font-bold text-primary mb-2">Authentication Required</h2>
               <p className="text-body mb-6">Please sign in to access your Web3 wallet features.</p>
               <Button className="grad-accent glow-accent rounded-xl">
                Sign In
              </Button>
            </CardContent>
          </Surface>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-ink-page">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <PageHeader
            eyebrow="Web3 · self-custody"
            title="Web3 Wallet"
            subtitle="Connect and manage your decentralized wallet."
          />
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
                <p className="text-sm text-body mb-2">Web3 Features Available:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
                    <Shield className="h-3 w-3 mr-1" />
                    Secure Transactions
                  </Badge>
                  <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
                    <Globe className="h-3 w-3 mr-1" />
                    Decentralized Storage
                  </Badge>
                  <Badge variant="outline" className="border-accent-core/30 text-accent-bright">
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
              <Surface className="p-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-sm font-medium">Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <StatValue label="Network" value={networkInfo?.name || 'Unknown'} valueClassName="text-accent-bright" />
                      <p className="text-secondary text-sm">Chain ID: {wallet.chainId}</p>
                    </div>
                     <Globe className="h-8 w-8 text-accent-bright" />
                  </div>
                </CardContent>
              </Surface>

              <Surface className="p-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-sm font-medium">Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <StatValue label="Balance" value={wallet.balance ? formatBalance(wallet.balance) : '0.0000'} valueClassName="text-accent-bright" />
                      <p className="text-secondary text-sm">
                        {networkInfo?.nativeCurrency.symbol || 'ETH'}
                      </p>
                    </div>
                     <Coins className="h-8 w-8 text-accent-bright" />
                  </div>
                </CardContent>
              </Surface>

              <Surface className="p-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-sm font-medium">ENS Name</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <StatValue label="ENS Name" value={wallet.ensName || 'None'} valueClassName="text-accent-bright" />
                      <p className="text-secondary text-sm">Domain name</p>
                    </div>
                     <Shield className="h-8 w-8 text-accent-bright" />
                  </div>
                </CardContent>
              </Surface>
            </motion.div>

            {/* Main Content Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Tabs defaultValue="tokens" className="space-y-6">
                <TabsList className="bg-ink-surface border border-ink-edge rounded-xl">
                  <TabsTrigger value="tokens" className="text-primary data-[state=active]:bg-accent-core data-[state=active]:text-white glow-accent rounded-xl">
                    <Coins className="h-4 w-4 mr-2" />
                    Tokens
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="text-primary data-[state=active]:bg-accent-core data-[state=active]:text-white glow-accent rounded-xl">
                    <Receipt className="h-4 w-4 mr-2" />
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger value="send" className="text-primary data-[state=active]:bg-accent-core data-[state=active]:text-white glow-accent rounded-xl">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tokens" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Native Token */}
                    <Surface className="p-0">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-accent-core rounded-xl flex items-center justify-center">
                               <span className="text-primary font-bold">ETH</span>
                            </div>
                            <div>
                                <CardTitle className="text-primary">
                                {networkInfo?.nativeCurrency.symbol || 'ETH'}
                              </CardTitle>
                               <p className="text-secondary text-sm">{networkInfo?.name || 'Ethereum'}</p>
                            </div>
                          </div>
                           <Badge variant="outline" className="border-gain/30 text-gain">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +2.1%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                             <p className="tabular text-xl font-bold text-primary">
                              {wallet.balance ? formatBalance(wallet.balance) : '0.0000'}
                            </p>
                             <p className="text-secondary text-sm">~$0.00</p>
                          </div>
                           <Button variant="outline" size="sm" className="border-ink-edge rounded-xl">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Surface>

                    {/* Mock Tokens */}
                    {mockTokens.map((token, index) => (
                      <Surface key={token.symbol} className="p-0">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{token.icon}</div>
                              <div>
                                <CardTitle className="text-primary">{token.symbol}</CardTitle>
                                <p className="text-secondary text-sm">StreamAiX Token</p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={token.change.includes('+') 
                                 ? "border-gain/30 text-gain"
                                 : "border-loss/30 text-loss"
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
                              <p className="tabular text-xl font-bold text-primary">{token.amount}</p>
                              <p className="text-secondary text-sm">{token.value}</p>
                            </div>
                             <Button variant="outline" size="sm" className="border-ink-edge rounded-xl">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Surface>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                   <Surface className="p-0">
                    <CardHeader>
                       <CardTitle className="text-primary">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockTransactions.map((tx) => (
                           <div key={tx.id} className="flex items-center justify-between p-4 bg-ink-raised rounded-xl border border-ink-divider">
                            <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                 tx.type === 'received' ? 'bg-gain/20' : 'bg-accent-core/20'
                              }`}>
                                {tx.type === 'received' ? (
                                   <ArrowDownRight className="h-4 w-4 text-gain" />
                                ) : (
                                   <ArrowUpRight className="h-4 w-4 text-accent-bright" />
                                )}
                              </div>
                              <div>
                                 <p className="text-primary font-medium tabular">{tx.amount}</p>
                                 <p className="text-secondary text-sm">{tx.from || tx.to}</p>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-secondary text-sm">{tx.time}</p>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                   </Surface>
                </TabsContent>

                <TabsContent value="send" className="space-y-4">
                   <Surface className="p-0">
                    <CardHeader>
                       <CardTitle className="text-primary">Send Tokens</CardTitle>
                       <p className="text-secondary text-sm">Send tokens to another wallet address</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-primary">Recipient Address</Label>
                        <Input
                          placeholder="0x..."
                          value={sendAddress}
                          onChange={(e) => setSendAddress(e.target.value)}
                           className="bg-ink-raised border-ink-edge text-primary placeholder:text-muted rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-primary">Amount</Label>
                        <Input
                          placeholder="0.0"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                           className="bg-ink-raised border-ink-edge text-primary placeholder:text-muted rounded-xl"
                        />
                      </div>
                      <Button 
                         className="w-full grad-accent glow-accent rounded-xl"
                        disabled={!sendAddress || !sendAmount}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Transaction
                      </Button>
                       <p className="text-warn text-sm text-center">
                        ⚠️ This is a demo interface. Real transactions require additional security measures.
                      </p>
                    </CardContent>
                   </Surface>
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
            <Surface className="max-w-md mx-auto">
              <CardContent className="p-8">
                <Wallet className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">No Wallet Connected</h3>
                <p className="text-secondary mb-6">
                  Connect your Web3 wallet to access decentralized features, manage tokens, and interact with the blockchain.
                </p>
                <div className="space-y-2 text-sm text-secondary">
                  <p>✓ Secure wallet connection</p>
                  <p>✓ Real-time balance updates</p>
                  <p>✓ Transaction history</p>
                  <p>✓ Multi-network support</p>
                </div>
              </CardContent>
            </Surface>
          </motion.div>
        )}
      </div>
    </div>
  );
}