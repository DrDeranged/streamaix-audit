import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useWeb3 } from '@/hooks/useWeb3';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink, Sparkles, Shield, Zap } from 'lucide-react';

interface WalletOption {
  id: string;
  name: string;
  description: string;
  available: boolean;
  installUrl?: string;
  popular?: boolean;
}

interface WalletSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletConnected?: () => void;
}

const MetaMaskIcon = () => (
  <svg viewBox="0 0 40 40" className="w-10 h-10">
    <defs>
      <linearGradient id="mm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8821E" />
        <stop offset="100%" stopColor="#F5841F" />
      </linearGradient>
    </defs>
    <path fill="url(#mm-grad)" d="M33.9 5.3L21.9 14.3l2.2-5.3 9.8-3.7z"/>
    <path fill="#E4761B" d="M6.1 5.3l11.8 9.1-2.1-5.4-9.7-3.7zM29.5 26.5l-3.2 4.9 6.8 1.9 2-6.7-5.6-.1zM4.9 26.6l2 6.7 6.8-1.9-3.2-4.9-5.6.1z"/>
    <path fill="#CD6116" d="M13.4 17.6l-1.9 2.9 6.8.3-.2-7.3-4.7 4.1zM26.6 17.6l-4.8-4.2-.1 7.4 6.8-.3-1.9-2.9zM13.7 31.4l4.1-2-3.5-2.7-.6 4.7zM22.2 29.4l4.1 2-.6-4.7-3.5 2.7z"/>
    <path fill="#E4761B" d="M26.3 31.4l-4.1-2 .3 2.6-.1 1.1 3.9-1.7zM13.7 31.4l3.9 1.7-.1-1.1.3-2.6-4.1 2z"/>
    <path fill="#F6851B" d="M17.7 24.8l-3.4-1 2.4-1.1 1 2.1zM22.3 24.8l1-2.1 2.4 1.1-3.4 1z"/>
    <path fill="#C0AD9E" d="M13.7 31.4l.6-5-3.8.1 3.2 4.9zM25.7 26.4l.6 5 3.2-4.9-3.8-.1zM28.5 20.5l-6.8.3.6 3.4 1-2.1 2.4 1.1 2.8-2.7zM14.3 23.2l2.4-1.1 1 2.1.6-3.4-6.8-.3 2.8 2.7z"/>
    <path fill="#763D16" d="M11.5 20.5l3 5.7-.1-2.8-2.9-2.9zM25.7 23.4l-.1 2.8 3-5.7-2.9 2.9zM18.3 20.8l-.6 3.4.8 4.1.2-5.4-.4-2.1zM21.7 20.8l-.4 2.1.2 5.4.8-4.1-.6-3.4z"/>
    <path fill="#E4761B" d="M22.3 24.2l-.8 4.1.6.4 3.5-2.7.1-2.8-3.4 1zM14.3 23.2l.1 2.8 3.5 2.7.6-.4-.8-4.1-3.4-1z"/>
    <path fill="#C0AD9E" d="M22.4 33.1l.1-1.1-.3-.3H17.8l-.3.3.1 1.1-3.9-1.7 1.4 1.1 2.8 1.9h4.4l2.8-1.9 1.4-1.1-3.9 1.7z"/>
    <path fill="#161616" d="M22.2 29.4l-.6-.4h-3.2l-.6.4-.3 2.6.3-.3h4.4l.3.3-.3-2.6z"/>
    <path fill="#763D16" d="M34.6 14.9l1-5-1.7-4.6-11.7 8.6 4.5 3.8 6.4 1.9 1.4-1.7-.6-.4 1-1-.8-.6 1-.8-.6-.5-.6.5zM4.4 9.9l1 5-.7.5 1 .8-.7.6 1 1-.6.4 1.4 1.7 6.4-1.9 4.5-3.8L6.1 5.3 4.4 9.9z"/>
    <path fill="#F6851B" d="M33.1 19.6l-6.4-1.9 1.9 2.9-3 5.7 4 0h6l-2.5-6.7zM13.3 17.7l-6.4 1.9-2.4 6.7h6l3.9 0-3-5.7 1.9-2.9zM21.7 20.8l.4-7.1 1.8-4.8h-7.8l1.8 4.8.4 7.1.2 2.1v5.4h3.2v-5.4l.2-2.1z"/>
  </svg>
);

const CoinbaseIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#0052FF] flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  </div>
);

const WalletConnectIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B99FC] to-[#2B6CB0] flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
      <path d="M6.5 8.5c2.7-2.7 7.1-2.7 9.8 0l.3.3c.1.1.1.3 0 .5l-1.1 1.1c-.1.1-.2.1-.3 0l-.4-.4c-1.9-1.9-5-1.9-6.9 0l-.4.4c-.1.1-.2.1-.3 0L6.1 9.3c-.1-.1-.1-.3 0-.5l.4-.3zm12.1 2.3l1 1c.1.1.1.3 0 .5l-4.5 4.5c-.1.1-.3.1-.5 0l-3.2-3.2c0-.1-.1-.1-.2 0l-3.2 3.2c-.1.1-.3.1-.5 0L3 12.3c-.1-.1-.1-.3 0-.5l1-1c.1-.1.3-.1.5 0l3.2 3.2c.1 0 .1.1.2 0l3.2-3.2c.1-.1.3-.1.5 0l3.2 3.2c.1 0 .1.1.2 0l3.2-3.2c.1-.1.3-.1.5 0z"/>
    </svg>
  </div>
);

const BrowserWalletIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M3 10h18"/>
      <circle cx="12" cy="15" r="2"/>
    </svg>
  </div>
);

export function WalletSelectionModal({ open, onOpenChange, onWalletConnected }: WalletSelectionModalProps) {
  const { connectMetaMask, isConnecting } = useWeb3();
  const { toast } = useToast();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const checkWalletAvailability = (walletType: 'metamask' | 'coinbase') => {
    if (typeof window === 'undefined') return false;
    
    const ethereum = (window as any).ethereum;
    
    if (ethereum?.providers && Array.isArray(ethereum.providers)) {
      if (walletType === 'metamask') {
        return ethereum.providers.some((provider: any) => provider.isMetaMask && !provider.isCoinbaseWallet);
      } else if (walletType === 'coinbase') {
        return ethereum.providers.some((provider: any) => provider.isCoinbaseWallet);
      }
    } else if (ethereum) {
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
      description: 'Connect using browser extension',
      available: checkWalletAvailability('metamask'),
      installUrl: 'https://metamask.io/download/',
      popular: true
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase Wallet',
      available: checkWalletAvailability('coinbase'),
      installUrl: 'https://www.coinbase.com/wallet'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect using QR code',
      available: true
    },
    {
      id: 'injected',
      name: 'Browser Wallet',
      description: 'Not installed',
      available: typeof window !== 'undefined' && !!(window as any).ethereum && (
        (window as any).ethereum.providers?.length > 2 ||
        (!checkWalletAvailability('metamask') && !checkWalletAvailability('coinbase'))
      )
    }
  ];

  const getWalletIcon = (id: string) => {
    switch (id) {
      case 'metamask': return <MetaMaskIcon />;
      case 'coinbase': return <CoinbaseIcon />;
      case 'walletconnect': return <WalletConnectIcon />;
      default: return <BrowserWalletIcon />;
    }
  };

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
      if (walletType === 'metamask') {
        targetProvider = ethereum.providers.find((provider: any) => provider.isMetaMask && !provider.isCoinbaseWallet);
      } else if (walletType === 'coinbase') {
        targetProvider = ethereum.providers.find((provider: any) => provider.isCoinbaseWallet);
      }
    } else if (ethereum) {
      if (walletType === 'metamask' && ethereum.isMetaMask && !ethereum.isCoinbaseWallet) {
        targetProvider = ethereum;
      } else if (walletType === 'coinbase' && ethereum.isCoinbaseWallet) {
        targetProvider = ethereum;
      }
    }
    
    if (!targetProvider) {
      throw new Error(`${walletType === 'metamask' ? 'MetaMask' : 'Coinbase Wallet'} not detected`);
    }
    
    const accounts = await targetProvider.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    if (walletType === 'metamask') {
      const originalEthereum = (window as any).ethereum;
      (window as any).ethereum = targetProvider;
      
      try {
        await connectMetaMask();
      } finally {
        (window as any).ethereum = originalEthereum;
      }
    } else {
      toast({
        title: 'Coinbase Wallet Connected',
        description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
      });
    }
  };

  const connectWalletConnect = async () => {
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

    let targetProvider = ethereum;
    
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      const otherProvider = ethereum.providers.find((provider: any) => 
        !provider.isMetaMask && !provider.isCoinbaseWallet
      );
      targetProvider = otherProvider || ethereum.providers[0];
    }

    const accounts = await targetProvider.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    let walletName = 'Browser Wallet';
    if (targetProvider.isMetaMask) walletName = 'MetaMask';
    else if (targetProvider.isCoinbaseWallet) walletName = 'Coinbase Wallet';
    else if (targetProvider.isRabby) walletName = 'Rabby Wallet';
    else if (targetProvider.isTrust) walletName = 'Trust Wallet';

    toast({
      title: `${walletName} Connected`,
      description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
    });
  };

  const handleInstallWallet = (installUrl: string) => {
    window.open(installUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10" />
          <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          
          <div className="relative p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 backdrop-blur-xl border border-violet-500/30">
                <Sparkles className="h-8 w-8 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                Connect Wallet
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Choose your preferred wallet to connect to StreamAiX
              </p>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence>
                {walletOptions.map((wallet, index) => (
                  <motion.div
                    key={wallet.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {wallet.available ? (
                      <button
                        onClick={() => handleWalletConnect(wallet.id)}
                        disabled={connectingWallet === wallet.id || isConnecting}
                        className="group relative w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 text-left transition-all duration-300 hover:border-violet-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-violet-500/10 disabled:opacity-50"
                        data-testid={`wallet-${wallet.id}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-cyan-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
                        
                        <div className="relative flex items-center gap-4">
                          <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                            {getWalletIcon(wallet.id)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{wallet.name}</span>
                              {wallet.popular && (
                                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-300 border border-violet-500/30">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-slate-400">{wallet.description}</p>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {connectingWallet === wallet.id ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20">
                                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/50 text-slate-400 transition-all group-hover:bg-violet-500/20 group-hover:text-violet-400">
                                <Zap className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ) : wallet.installUrl ? (
                      <button
                        onClick={() => handleInstallWallet(wallet.installUrl!)}
                        className="group relative w-full overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-800/30 p-4 text-left transition-all duration-300 hover:border-slate-600/50 hover:bg-slate-800/50"
                        data-testid={`wallet-install-${wallet.id}`}
                      >
                        <div className="relative flex items-center gap-4 opacity-60">
                          <div className="flex-shrink-0 grayscale">
                            {getWalletIcon(wallet.id)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-slate-300">{wallet.name}</span>
                            <p className="mt-0.5 text-sm text-slate-500">Not installed</p>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/30">
                              <ExternalLink className="h-4 w-4 text-slate-500" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ) : null}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-6 border-t border-slate-700/50 pt-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>Secure Connection</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <button 
                onClick={() => window.open('https://ethereum.org/wallets/', '_blank')}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Learn more about wallets
              </button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
