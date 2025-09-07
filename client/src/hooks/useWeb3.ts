import { useState, useEffect, useCallback } from 'react';
import { web3Manager, type WalletInfo, type Chain, type WalletType } from '@/lib/web3';
import { useToast } from './use-toast';

export function useWeb3() {
  const [wallet, setWallet] = useState<WalletInfo | null>(web3Manager.getWallet());
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Listen for wallet changes
  useEffect(() => {
    const unsubscribe = web3Manager.onWalletChange((newWallet) => {
      setWallet(newWallet);
      if (newWallet) {
        setError(null);
      }
    });

    return unsubscribe;
  }, []);

  // Generic connect method for any wallet type
  const connectWallet = useCallback(async (walletType: WalletType): Promise<WalletInfo | null> => {
    if (isConnecting) return null;

    setIsConnecting(true);
    setError(null);

    try {
      const walletInfo = await web3Manager.connect(walletType);
      
      toast({
        title: 'Wallet Connected!',
        description: `Connected to ${walletInfo.walletName || 'wallet'}: ${web3Manager.formatAddress(walletInfo.address)}`,
      });

      return walletInfo;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect wallet';
      setError(errorMessage);
      
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, toast]);

  // Connect to MetaMask (legacy method, uses generic connect)
  const connectMetaMask = useCallback(async (): Promise<WalletInfo | null> => {
    return connectWallet('metamask');
  }, [connectWallet]);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number): Promise<boolean> => {
    setError(null);

    try {
      await web3Manager.switchNetwork(chainId);
      
      const networkInfo = web3Manager.getNetworkInfo(chainId);
      toast({
        title: 'Network Switched',
        description: `Switched to ${networkInfo?.name || 'Unknown Network'}`,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to switch network';
      setError(errorMessage);
      
      toast({
        title: 'Network Switch Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return false;
    }
  }, [toast]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    setError(null);

    try {
      const signature = await web3Manager.signMessage(message);
      return signature;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign message';
      setError(errorMessage);
      
      toast({
        title: 'Signing Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    }
  }, [toast]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    web3Manager.disconnect();
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  }, [toast]);

  // Generate authentication message
  const generateAuthMessage = useCallback((address: string, nonce: string): string => {
    return web3Manager.generateAuthMessage(address, nonce);
  }, []);

  // Get network info
  const getNetworkInfo = useCallback((chainId: number): Chain | undefined => {
    return web3Manager.getNetworkInfo(chainId);
  }, []);

  // Format address for display
  const formatAddress = useCallback((address: string): string => {
    return web3Manager.formatAddress(address);
  }, []);

  // Format balance for display
  const formatBalance = useCallback((balance: string, decimals?: number): string => {
    return web3Manager.formatBalance(balance, decimals);
  }, []);

  // Check if address is valid
  const isValidAddress = useCallback((address: string): boolean => {
    return web3Manager.isValidAddress(address);
  }, []);

  // Check if MetaMask is available
  const isMetaMaskAvailable = useCallback((): boolean => {
    return web3Manager.isMetaMaskAvailable();
  }, []);

  // Check if Coinbase Wallet is available
  const isCoinbaseWalletAvailable = useCallback((): boolean => {
    return web3Manager.isCoinbaseWalletAvailable();
  }, []);

  // Check if any injected wallet is available
  const isInjectedWalletAvailable = useCallback((): boolean => {
    return web3Manager.isInjectedWalletAvailable();
  }, []);

  // Get available wallets
  const getAvailableWallets = useCallback(() => {
    return web3Manager.getAvailableWallets();
  }, []);

  return {
    // State
    wallet,
    isConnected: !!wallet,
    isConnecting,
    error,

    // Actions
    connectWallet,
    connectMetaMask, // Legacy support
    switchNetwork,
    signMessage,
    disconnect,
    generateAuthMessage,

    // Utils
    getNetworkInfo,
    formatAddress,
    formatBalance,
    isValidAddress,
    isMetaMaskAvailable,
    isCoinbaseWalletAvailable,
    isInjectedWalletAvailable,
    getAvailableWallets,
  };
}