import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ExternalLink, Copy, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

interface WalletOption {
  type: string;
  name: string;
  icon: string;
  available: boolean;
  description: string;
}

interface WalletConnectorProps {
  onWalletConnected?: (address: string, signature: string, message: string) => void;
  onWalletDisconnected?: () => void;
  children?: any;
  showBalance?: boolean;
  showNetwork?: boolean;
}

export function WalletConnector({ 
  onWalletConnected, 
  onWalletDisconnected, 
  children,
  showBalance = true,
  showNetwork = true 
}: WalletConnectorProps) {
  const { 
    wallet, 
    isConnected, 
    isConnecting, 
    error,
    connectWallet, 
    disconnect, 
    signMessage,
    generateAuthMessage,
    switchNetwork,
    formatAddress, 
    formatBalance,
    getNetworkInfo,
    isMetaMaskAvailable,
    isCoinbaseWalletAvailable 
  } = useWeb3();
  
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleConnect = async (walletType: string = 'metamask') => {
    try {
      if (walletType === 'walletconnect') {
        // For now, show informative message about WalletConnect
        toast({
          title: 'WalletConnect Coming Soon!',
          description: 'WalletConnect integration is being implemented. Please use MetaMask or Coinbase Wallet for now.',
        });
        return;
      }

      const walletInfo = await connectWallet(walletType as 'metamask' | 'coinbase' | 'injected');
      
      if (walletInfo && onWalletConnected) {
        await handleAuthenticate(walletInfo.address);
      }
    } catch (error: any) {
      // Error handling is already done in the connectWallet hook
      console.error('Wallet connection error:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onWalletDisconnected?.();
  };

  const handleAuthenticate = async (address: string) => {
    if (!onWalletConnected) return;

    setIsAuthenticating(true);
    try {
      // Generate nonce and message
      const nonce = Math.random().toString(36).substring(7);
      const message = generateAuthMessage(address, nonce);
      
      // Request signature
      const signature = await signMessage(message);
      if (signature) {
        onWalletConnected(address, signature, message);
      }
    } catch (error: any) {
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Failed to sign authentication message',
        variant: 'destructive',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Address copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy address',
        variant: 'destructive',
      });
    }
  };

  const networkInfo = wallet && wallet.chainId ? getNetworkInfo(wallet.chainId) : null;

  const walletOptions: WalletOption[] = [
    {
      type: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      available: isMetaMaskAvailable(),
      description: 'Connect with MetaMask wallet'
    },
    {
      type: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      available: isCoinbaseWalletAvailable(),
      description: 'Connect with Coinbase Wallet'
    },
    {
      type: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      available: true,
      description: 'Connect with any WalletConnect compatible wallet (Coming Soon)'
    }
  ];

  const hasAnyWallet = walletOptions.some(option => option.available);

  if (!hasAnyWallet) {
    return (
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="flex-1">
              <p className="text-yellow-200 font-medium">MetaMask Required</p>
              <p className="text-yellow-300/80 text-sm">Please install MetaMask to connect your wallet</p>
            </div>
            <a
              href="https://metamask.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Install
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        {children && (
          <div className="text-center text-gray-300 mb-4">
            {children}
          </div>
        )}
        
        <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
          <CardHeader className="text-center">
            <Wallet className="h-12 w-12 text-purple-400 mx-auto mb-2" />
            <CardTitle className="text-gray-900 dark:text-white">Connect Your Wallet</CardTitle>
            <p className="text-gray-300 text-sm">
              Choose your preferred wallet to access Web3 features
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {walletOptions.map((option) => (
              <Button
                key={option.type}
                onClick={() => handleConnect(option.type)}
                disabled={isConnecting || !option.available}
                className={`w-full border transition-all duration-200 ${
                  option.available
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-transparent'
                    : 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 border-gray-600/30'
                } font-semibold`}
                data-testid={`button-connect-${option.type}`}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <span className="mr-2 text-lg">{option.icon}</span>
                    {option.name}
                    {!option.available && (
                      <span className="ml-2 text-xs">(Not Available)</span>
                    )}
                  </>
                )}
              </Button>
            ))}
            
            <div className="pt-2">
              <div className="text-xs text-gray-400 text-center mb-2">
                Need a wallet?
              </div>
              <div className="flex gap-2">
                <a
                  href="https://metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/20 text-gray-400 hover:text-white hover:bg-white/10 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Get MetaMask
                  </Button>
                </a>
                <a
                  href="https://www.coinbase.com/wallet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/20 text-gray-400 hover:text-white hover:bg-white/10 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Get Coinbase
                  </Button>
                </a>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-gray-900 dark:text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-gray-900 dark:text-white font-medium" data-testid="wallet-address">
                  {wallet ? formatAddress(wallet.address) : ''}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => wallet && copyToClipboard(wallet.address)}
                  className="h-6 w-6 p-0 hover:bg-white/10"
                  data-testid="button-copy-address"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                {showNetwork && networkInfo && (
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs"
                    data-testid="network-badge"
                  >
                    {networkInfo.name}
                  </Badge>
                )}
                
                {showBalance && wallet && wallet.balance && (
                  <Badge 
                    variant="secondary" 
                    className="bg-green-500/20 text-green-200 border-green-500/30 text-xs"
                    data-testid="balance-badge"
                  >
                    {formatBalance(wallet.balance)} {networkInfo?.nativeCurrency.symbol || 'ETH'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticating && (
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
                  data-testid="button-wallet-details"
                >
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/20 text-gray-900 dark:text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet Details
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-white/10 px-2 py-1 rounded font-mono">
                        {wallet?.address || ''}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => wallet && copyToClipboard(wallet.address)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {wallet?.ensName && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">ENS Name</p>
                      <p className="text-sm text-purple-300">{wallet.ensName}</p>
                    </div>
                  )}

                  {networkInfo && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Network</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{networkInfo.name}</p>
                        <Badge variant="outline" className="text-xs">
                          Chain ID: {wallet?.chainId || 0}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {wallet?.balance && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Balance</p>
                      <p className="text-sm">
                        {formatBalance(wallet.balance)} {networkInfo?.nativeCurrency.symbol || 'ETH'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {networkInfo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => switchNetwork(1)} // Switch to Ethereum
                        className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
                      >
                        Switch Network
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      className="border-white/20 text-gray-900 dark:text-white hover:bg-white/10"
                      data-testid="button-disconnect-wallet"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {children && (
          <div className="mt-4 pt-4 border-t border-white/10">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}