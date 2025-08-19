import { useState, useEffect, useCallback } from 'react';
import { web3Manager, type WalletInfo, type Chain } from '@/lib/web3';
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

  // Connect to MetaMask
  const connectMetaMask = useCallback(async (): Promise<WalletInfo | null> => {
    if (isConnecting) return null;

    setIsConnecting(true);
    setError(null);

    try {
      const walletInfo = await web3Manager.connectMetaMask();
      
      toast({
        title: 'Wallet Connected!',
        description: `Connected to ${web3Manager.formatAddress(walletInfo.address)}`,
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

  return {
    // State
    wallet,
    isConnected: !!wallet,
    isConnecting,
    error,

    // Actions
    connectMetaMask,
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
  };
}