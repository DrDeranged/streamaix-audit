import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Loader2, ExternalLink } from 'lucide-react';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  available: boolean;
  installUrl?: string;
}

interface WalletSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletConnected?: () => void;
}

export function WalletSelectionModal({ open, onOpenChange, onWalletConnected }: WalletSelectionModalProps) {
  const { connectMetaMask, isConnecting } = useWeb3();
  const { toast } = useToast();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const checkWalletAvailability = (walletType: 'metamask' | 'coinbase') => {
    if (typeof window === 'undefined') return false;
    
    const ethereum = (window as any).ethereum;
    
    if (ethereum?.providers && Array.isArray(ethereum.providers)) {
      // Multiple wallets are installed
      if (walletType === 'metamask') {
        return ethereum.providers.some((provider: any) => provider.isMetaMask && !provider.isCoinbaseWallet);
      } else if (walletType === 'coinbase') {
        return ethereum.providers.some((provider: any) => provider.isCoinbaseWallet);
      }
    } else if (ethereum) {
      // Single wallet or main provider
      if (walletType === 'metamask') {
        return ethereum.isMetaMask && !ethereum.isCoinbaseWallet;
      } else if (walletType === 'coinbase') {
        return ethereum.isCoinbaseWallet;
      }
    }
    
    return false;
  };

  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using browser extension',
      available: checkWalletAvailability('metamask'),
      installUrl: 'https://metamask.io/download/'
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect using Coinbase Wallet',
      available: checkWalletAvailability('coinbase'),
      installUrl: 'https://www.coinbase.com/wallet'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect using QR code',
      available: true
    },
    {
      id: 'injected',
      name: 'Browser Wallet',
      icon: '🌐',
      description: 'Connect using injected wallet',
      available: typeof window !== 'undefined' && !!(window as any).ethereum
    }
  ];

  const handleWalletConnect = async (walletId: string) => {
    if (!walletOptions.find(w => w.id === walletId)?.available) {
      return;
    }

    setConnectingWallet(walletId);
    
    try {
      switch (walletId) {
        case 'metamask':
          await connectSpecificWallet('metamask');
          break;
        case 'coinbase':
          await connectSpecificWallet('coinbase');
          break;
        case 'walletconnect':
          await connectWalletConnect();
          break;
        case 'injected':
          await connectInjectedWallet();
          break;
        default:
          throw new Error('Wallet not supported');
      }
      
      onWalletConnected?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    } finally {
      setConnectingWallet(null);
    }
  };

  const connectSpecificWallet = async (walletType: 'metamask' | 'coinbase') => {
    if (typeof window === 'undefined') throw new Error('Window not available');
    
    const ethereum = (window as any).ethereum;
    let targetProvider = null;
    
    if (ethereum?.providers && Array.isArray(ethereum.providers)) {
      // Multiple wallets are installed
      if (walletType === 'metamask') {
        targetProvider = ethereum.providers.find((provider: any) => provider.isMetaMask && !provider.isCoinbaseWallet);
      } else if (walletType === 'coinbase') {
        targetProvider = ethereum.providers.find((provider: any) => provider.isCoinbaseWallet);
      }
    } else if (ethereum) {
      // Single wallet or main provider
      if (walletType === 'metamask' && ethereum.isMetaMask && !ethereum.isCoinbaseWallet) {
        targetProvider = ethereum;
      } else if (walletType === 'coinbase' && ethereum.isCoinbaseWallet) {
        targetProvider = ethereum;
      }
    }
    
    if (!targetProvider) {
      throw new Error(`${walletType === 'metamask' ? 'MetaMask' : 'Coinbase Wallet'} not detected`);
    }
    
    // Use the specific provider
    const accounts = await targetProvider.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // If MetaMask, use the existing connectMetaMask method for full integration
    if (walletType === 'metamask') {
      // Temporarily set the provider and call connectMetaMask
      const originalEthereum = (window as any).ethereum;
      (window as any).ethereum = targetProvider;
      
      try {
        await connectMetaMask();
      } finally {
        // Restore original ethereum object
        (window as any).ethereum = originalEthereum;
      }
    } else {
      // For Coinbase, just show success message
      toast({
        title: 'Coinbase Wallet Connected',
        description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
      });
    }
  };

  const connectWalletConnect = async () => {
    // For now, show a message that WalletConnect integration is coming soon
    toast({
      title: 'Coming Soon',
      description: 'WalletConnect integration is coming in the next update',
    });
    throw new Error('WalletConnect integration coming soon');
  };

  const connectInjectedWallet = async () => {
    if (typeof window === 'undefined') throw new Error('Window not available');
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error('No wallet detected');
    }

    // Request account access for any injected wallet
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    toast({
      title: 'Wallet Connected',
      description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
    });
  };

  const handleInstallWallet = (installUrl: string) => {
    window.open(installUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose your preferred wallet to connect to StreamAiX
          </p>
          
          <div className="space-y-2">
            {walletOptions.map((wallet) => (
              <div key={wallet.id} className="relative">
                {wallet.available ? (
                  <Button
                    onClick={() => handleWalletConnect(wallet.id)}
                    disabled={connectingWallet === wallet.id || isConnecting}
                    className="w-full h-auto p-4 justify-start text-left bg-background hover:bg-muted border border-border"
                    variant="outline"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{wallet.name}</div>
                        <div className="text-xs text-muted-foreground">{wallet.description}</div>
                      </div>
                      {connectingWallet === wallet.id && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                    </div>
                  </Button>
                ) : (
                  <div className="relative">
                    <Button
                      onClick={() => wallet.installUrl && handleInstallWallet(wallet.installUrl)}
                      className="w-full h-auto p-4 justify-start text-left bg-background hover:bg-muted border border-border opacity-60"
                      variant="outline"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-2xl grayscale">{wallet.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{wallet.name}</div>
                          <div className="text-xs text-muted-foreground">Not installed</div>
                        </div>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Don't have a wallet?{' '}
              <button 
                onClick={() => window.open('https://ethereum.org/wallets/', '_blank')}
                className="text-primary hover:underline"
              >
                Learn more about wallets
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}