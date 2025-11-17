import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { isMobile, isInMobileWalletBrowser, openMetaMaskMobile, openCoinbaseMobile, getMobileWalletAvailability } from './mobileWallet';

// Define wallet types
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'injected';

export interface WalletInfo {
  address: string;
  chainId: number;
  ensName?: string;
  balance?: string;
  provider: BrowserProvider;
  signer: JsonRpcSigner;
  walletType?: WalletType;
  walletName?: string;
}

export interface Chain {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Supported networks
export const chains: Record<number, Chain> = {
  1: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  10: {
    id: 10,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  137: {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 }
  },
  8453: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  84532: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  }
};

class Web3Manager {
  private wallet: WalletInfo | null = null;
  private listeners: Array<(wallet: WalletInfo | null) => void> = [];

  // Check if MetaMask is available
  isMetaMaskAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    const ethereum = (window as any).ethereum;
    
    // Check for multiple providers
    if (ethereum?.providers && Array.isArray(ethereum.providers)) {
      return ethereum.providers.some((provider: any) => provider.isMetaMask && !provider.isCoinbaseWallet);
    }
    
    // Check single provider
    return ethereum?.isMetaMask === true && ethereum?.isCoinbaseWallet !== true;
  }

  // Check if Coinbase Wallet is available
  isCoinbaseWalletAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    const ethereum = (window as any).ethereum;
    
    // Check for multiple providers
    if (ethereum?.providers && Array.isArray(ethereum.providers)) {
      return ethereum.providers.some((provider: any) => provider.isCoinbaseWallet);
    }
    
    // Check single provider
    return ethereum?.isCoinbaseWallet === true;
  }

  // Check if any injected wallet is available
  isInjectedWalletAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined';
  }

  // Get available wallet types
  getAvailableWallets(): Array<{ type: WalletType; name: string; available: boolean }> {
    return [
      { type: 'metamask', name: 'MetaMask', available: this.isMetaMaskAvailable() },
      { type: 'coinbase', name: 'Coinbase Wallet', available: this.isCoinbaseWalletAvailable() },
      { type: 'walletconnect', name: 'WalletConnect', available: true },
    ];
  }

  // Connect to MetaMask
  async connectMetaMask(): Promise<WalletInfo> {
    // Mobile deep linking
    if (isMobile() && !isInMobileWalletBrowser() && !this.isMetaMaskAvailable()) {
      openMetaMaskMobile();
      throw new Error('Redirecting to MetaMask mobile app...');
    }
    
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      const ethereum = (window as any).ethereum;
      let targetProvider = ethereum;
      
      // Handle multiple wallet providers (EIP-6963)
      if (ethereum?.providers && Array.isArray(ethereum.providers)) {
        // Find MetaMask specifically (not Coinbase Wallet)
        const metaMaskProvider = ethereum.providers.find(
          (provider: any) => provider.isMetaMask && !provider.isCoinbaseWallet
        );
        
        if (!metaMaskProvider) {
          throw new Error('MetaMask provider not found. Please ensure MetaMask is installed.');
        }
        
        targetProvider = metaMaskProvider;
      } else if (ethereum) {
        // Single provider - verify it's actually MetaMask
        if (!ethereum.isMetaMask || ethereum.isCoinbaseWallet) {
          throw new Error('MetaMask is not the active wallet. Please select MetaMask in your browser.');
        }
      }
      
      // Request account access from the specific provider
      const accounts = await targetProvider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please ensure MetaMask is unlocked.');
      }

      const provider = new BrowserProvider(targetProvider);
      const signer = await provider.getSigner();
      const address = accounts[0];
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      // Try to resolve ENS name
      let ensName: string | undefined;
      try {
        ensName = await provider.lookupAddress(address) || undefined;
      } catch (error) {
        // ENS resolution failed, which is fine
        console.log('ENS resolution failed:', error);
      }

      const walletInfo: WalletInfo = {
        address,
        chainId: Number(network.chainId),
        ensName,
        balance: balance.toString(),
        provider,
        signer,
        walletType: 'metamask',
        walletName: 'MetaMask'
      };

      this.wallet = walletInfo;
      this.notifyListeners();

      // Listen for account changes
      targetProvider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.connectMetaMask().catch(console.error);
        }
      });

      // Listen for chain changes
      targetProvider.on('chainChanged', () => {
        this.connectMetaMask().catch(console.error);
      });

      return walletInfo;
    } catch (error: any) {
      console.error('MetaMask connection failed:', error);
      throw new Error(error.message || 'Failed to connect to MetaMask');
    }
  }

  // Connect to Coinbase Wallet
  async connectCoinbaseWallet(): Promise<WalletInfo> {
    // Mobile deep linking
    if (isMobile() && !isInMobileWalletBrowser() && !this.isCoinbaseWalletAvailable()) {
      openCoinbaseMobile();
      throw new Error('Redirecting to Coinbase Wallet mobile app...');
    }
    
    if (!this.isCoinbaseWalletAvailable()) {
      throw new Error('Coinbase Wallet is not installed. Please install Coinbase Wallet to continue.');
    }

    try {
      const ethereum = (window as any).ethereum;
      let targetProvider = ethereum;
      
      // Handle multiple wallet providers (EIP-6963)
      if (ethereum?.providers && Array.isArray(ethereum.providers)) {
        // Find Coinbase Wallet specifically
        const coinbaseProvider = ethereum.providers.find(
          (provider: any) => provider.isCoinbaseWallet
        );
        
        if (!coinbaseProvider) {
          throw new Error('Coinbase Wallet provider not found. Please ensure Coinbase Wallet is installed.');
        }
        
        targetProvider = coinbaseProvider;
      } else if (ethereum) {
        // Single provider - verify it's actually Coinbase Wallet
        if (!ethereum.isCoinbaseWallet) {
          throw new Error('Coinbase Wallet is not the active wallet. Please select Coinbase Wallet in your browser.');
        }
      }
      
      // Request account access from the specific provider
      const accounts = await targetProvider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please ensure Coinbase Wallet is unlocked.');
      }

      const provider = new BrowserProvider(targetProvider);
      const signer = await provider.getSigner();
      const address = accounts[0];
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      const walletInfo: WalletInfo = {
        address,
        chainId: Number(network.chainId),
        balance: balance.toString(),
        provider,
        signer,
        walletType: 'coinbase',
        walletName: 'Coinbase Wallet'
      };

      this.wallet = walletInfo;
      this.notifyListeners();

      // Listen for account changes
      targetProvider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.connectCoinbaseWallet().catch(console.error);
        }
      });

      // Listen for chain changes
      targetProvider.on('chainChanged', () => {
        this.connectCoinbaseWallet().catch(console.error);
      });

      return walletInfo;
    } catch (error: any) {
      console.error('Coinbase Wallet connection failed:', error);
      throw new Error(error.message || 'Failed to connect to Coinbase Wallet');
    }
  }

  // Switch to a specific network
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not available');
    }

    const chain = chains[chainId];
    if (!chain) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    try {
      const ethereum = (window as any).ethereum;
      
      // Try to switch to the network
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Network not added to MetaMask, try to add it
      if (error.code === 4902) {
        const ethereum = (window as any).ethereum;
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: [chain.rpcUrl],
                blockExplorerUrls: [chain.blockExplorer],
              },
            ],
          });
        } catch (addError) {
          throw new Error(`Failed to add network: ${chain.name}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${error.message}`);
      }
    }
  }

  // Sign a message for authentication
  async signMessage(message: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.wallet.signer.signMessage(message);
      return signature;
    } catch (error: any) {
      console.error('Message signing failed:', error);
      throw new Error('Failed to sign message. Please approve the signature request.');
    }
  }

  // Generate authentication message
  generateAuthMessage(address: string, nonce: string): string {
    return `Welcome to StreamAiX!

Click to sign in and accept the StreamAiX Terms of Service: https://streamaix.com/tos

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will reset after 24 hours.

Wallet address:
${address}

Nonce:
${nonce}`;
  }

  // Get current wallet info
  getWallet(): WalletInfo | null {
    return this.wallet;
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.wallet !== null;
  }

  // Connect to any injected wallet (generic method)
  async connectInjectedWallet(): Promise<WalletInfo> {
    if (!this.isInjectedWalletAvailable()) {
      throw new Error('No injected wallet found. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.');
    }

    try {
      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please ensure your wallet is unlocked.');
      }

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = accounts[0];
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      // Determine wallet type
      let walletType: WalletType = 'injected';
      let walletName = 'Injected Wallet';
      
      if (ethereum.isMetaMask) {
        walletType = 'metamask';
        walletName = 'MetaMask';
      } else if (ethereum.isCoinbaseWallet) {
        walletType = 'coinbase';
        walletName = 'Coinbase Wallet';
      }

      const walletInfo: WalletInfo = {
        address,
        chainId: Number(network.chainId),
        balance: balance.toString(),
        provider,
        signer,
        walletType,
        walletName
      };

      this.wallet = walletInfo;
      this.notifyListeners();

      // Listen for account changes
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.connectInjectedWallet().catch(console.error);
        }
      });

      // Listen for chain changes
      ethereum.on('chainChanged', () => {
        this.connectInjectedWallet().catch(console.error);
      });

      return walletInfo;
    } catch (error: any) {
      console.error('Injected wallet connection failed:', error);
      throw new Error(error.message || 'Failed to connect to wallet');
    }
  }

  // Generic connect method
  async connect(walletType: WalletType): Promise<WalletInfo> {
    switch (walletType) {
      case 'metamask':
        return this.connectMetaMask();
      case 'coinbase':
        return this.connectCoinbaseWallet();
      case 'injected':
        return this.connectInjectedWallet();
      case 'walletconnect':
        throw new Error('WalletConnect support coming soon!');
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }

  // Disconnect wallet
  disconnect(): void {
    this.wallet = null;
    this.notifyListeners();

    // Clear listeners if they exist
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.removeAllListeners?.('accountsChanged');
      ethereum.removeAllListeners?.('chainChanged');
    }
  }

  // Add listener for wallet changes
  onWalletChange(listener: (wallet: WalletInfo | null) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of wallet changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.wallet));
  }

  // Get network info
  getNetworkInfo(chainId: number): Chain | undefined {
    return chains[chainId];
  }

  // Format address for display
  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Format balance for display
  formatBalance(balance: string, decimals: number = 18): string {
    try {
      const balanceInEth = Number(balance) / Math.pow(10, decimals);
      return balanceInEth.toFixed(4);
    } catch {
      return '0.0000';
    }
  }

  // Check if address is valid
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Get balance in readable format
  async getFormattedBalance(address: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.wallet.provider.getBalance(address);
      return this.formatBalance(balance.toString());
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0.0000';
    }
  }
}

// Create singleton instance
export const web3Manager = new Web3Manager();

// Utility functions for formatting
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance: string, decimals: number = 18): string => {
  try {
    const balanceInEth = Number(balance) / Math.pow(10, decimals);
    return balanceInEth.toFixed(4);
  } catch {
    return '0.0000';
  }
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Export the main manager for direct usage
export default web3Manager;