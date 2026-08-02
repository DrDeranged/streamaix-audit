import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Surface from '@/components/ds/Surface';
import SectionTitle from '@/components/ds/SectionTitle';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ExternalLink, Copy, CheckCircle, Loader2, AlertTriangle, Smartphone } from 'lucide-react';
import { isMobile, isInMobileWalletBrowser } from '@/lib/mobileWallet';

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
        title: 'Unable to authenticate',
        description: 'Please try again.',
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
        title: 'Unable to copy',
        description: 'Please try copying manually.',
        variant: 'destructive',
      });
    }
  };

  const networkInfo = wallet && wallet.chainId ? getNetworkInfo(wallet.chainId) : null;
  const mobile = isMobile();
  const inWalletBrowser = isInMobileWalletBrowser();

  const walletOptions: WalletOption[] = [
    {
      type: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      available: mobile ? true : isMetaMaskAvailable(), // Always available on mobile via deep link
      description: mobile && !inWalletBrowser 
        ? 'Open in MetaMask app'
        : 'Connect with MetaMask wallet'
    },
    {
      type: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      available: mobile ? true : isCoinbaseWalletAvailable(), // Always available on mobile via deep link
      description: mobile && !inWalletBrowser
        ? 'Open in Coinbase Wallet app'
        : 'Connect with Coinbase Wallet'
    },
    {
      type: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      available: false, // Disabled for now
      description: 'Connect with any WalletConnect compatible wallet (Coming Soon)'
    }
  ];

  const hasAnyWallet = walletOptions.some(option => option.available);

  if (!hasAnyWallet) {
    return (
      <Surface className="border-warn/30 bg-warn/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warn" />
            <div className="flex-1">
              <p className="font-medium text-primary">MetaMask Required</p>
              <p className="text-sm text-secondary">Please install MetaMask to connect your wallet</p>
            </div>
            <a
              href="https://metamask.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="sm" className="bg-warn text-ink-page hover:bg-warn/80">
                <ExternalLink className="h-4 w-4 mr-2" />
                Install
              </Button>
            </a>
          </div>
      </Surface>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        {children && (
          <div className="text-center text-body mb-4">
            {children}
          </div>
        )}
        
        <Surface className="p-4">
          <div className="text-center">
            {mobile ? (
              <Smartphone className="h-12 w-12 text-accent-bright mx-auto mb-2" />
            ) : (
              <Wallet className="h-12 w-12 text-accent-bright mx-auto mb-2" />
            )}
            <SectionTitle as="h3">Connect Your Wallet</SectionTitle>
            <p className="text-secondary text-sm mt-1">
              {mobile && !inWalletBrowser
                ? 'Tap to open in your wallet app'
                : 'Choose your preferred wallet to access Web3 features'}
            </p>
          </div>
          <div className="space-y-3 mt-5">
            {walletOptions.map((option) => (
              <Button
                key={option.type}
                onClick={() => handleConnect(option.type)}
                disabled={isConnecting || !option.available}
                className={`w-full border transition-all duration-200 ${
                  option.available
                     ? 'grad-accent glow-accent text-primary border-transparent'
                     : 'bg-ink-raised hover:bg-ink-edge text-muted border-ink-edge'
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
               <div className="text-xs text-muted text-center mb-2">
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
                     className="w-full border-ink-edge text-secondary hover:text-primary hover:bg-ink-raised text-xs"
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
                     className="w-full border-ink-edge text-secondary hover:text-primary hover:bg-ink-raised text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Get Coinbase
                  </Button>
                </a>
              </div>
            </div>

            {error && (
               <div className="p-3 bg-loss/10 border border-loss/30 rounded-xl">
                 <p className="text-loss text-sm">{error}</p>
              </div>
            )}
          </div>
        </Surface>
      </div>
    );
  }

  // Check if user is on wrong network (not Base - Chain ID 8453)
  const isOnBaseNetwork = wallet?.chainId === 8453;
  
  if (!isOnBaseNetwork && wallet) {
    return (
      <Surface className="border-warn/30 bg-warn/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warn mt-0.5" />
            <div className="flex-1">
              <h4 className="text-primary font-semibold mb-1">Wrong Network</h4>
              <p className="text-body text-sm mb-3">
                StreamAiX operates on Base network. Please switch to continue.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => switchNetwork(8453)}
                   className="grad-accent glow-accent"
                  data-testid="button-switch-to-base"
                >
                  Switch to Base
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                   className="border-ink-edge text-primary hover:bg-ink-raised"
                >
                  Disconnect
                </Button>
              </div>
              {showNetwork && networkInfo && (
                 <p className="text-xs text-muted mt-2">
                  Currently connected to: {networkInfo.name}
                </p>
              )}
            </div>
          </div>
      </Surface>
    );
  }

  return (
    <Surface className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-core/15 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-accent-bright" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-primary font-medium" data-testid="wallet-address">
                  {wallet ? formatAddress(wallet.address) : ''}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => wallet && copyToClipboard(wallet.address)}
                  className="h-6 w-6 p-0 hover:bg-ink-raised"
                  data-testid="button-copy-address"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                {showNetwork && networkInfo && (
                  <Badge 
                    variant="secondary" 
                     className="bg-accent-core/15 text-accent-bright border-accent-core/30 text-xs"
                    data-testid="network-badge"
                  >
                    {networkInfo.name}
                  </Badge>
                )}
                
                {showBalance && wallet && wallet.balance && (
                  <Badge 
                    variant="secondary" 
                     className="bg-gain/10 text-gain border-gain/30 text-xs"
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
              <Loader2 className="h-4 w-4 animate-spin text-accent-bright" />
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                   className="border-ink-edge text-primary hover:bg-ink-raised"
                  data-testid="button-wallet-details"
                >
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl bg-ink-surface border-ink-edge text-primary">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet Details
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted mb-1">Address</p>
                    <div className="flex items-center gap-2">
                       <code className="text-sm bg-ink-raised px-2 py-1 rounded-xl font-mono text-secondary">
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
                       <p className="text-sm text-muted mb-1">ENS Name</p>
                       <p className="text-sm text-accent-bright">{wallet.ensName}</p>
                    </div>
                  )}

                  {networkInfo && (
                    <div>
                     <p className="text-sm text-muted mb-1">Network</p>
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
                     <p className="text-sm text-muted mb-1">Balance</p>
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
                         className="border-ink-edge text-primary hover:bg-ink-raised"
                      >
                        Switch Network
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                       className="border-ink-edge text-primary hover:bg-ink-raised"
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
           <div className="mt-4 pt-4 border-t border-ink-divider">
            {children}
          </div>
        )}
    </Surface>
  );
}