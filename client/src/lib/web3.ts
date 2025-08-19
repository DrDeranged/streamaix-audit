import { BrowserProvider, JsonRpcSigner } from 'ethers';

// Define wallet types
export type WalletType = 'metamask' | 'walletconnect' | 'coinbase';

export interface WalletInfo {
  address: string;
  chainId: number;
  ensName?: string;
  balance?: string;
  provider: BrowserProvider;
  signer: JsonRpcSigner;
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
  }
};

class Web3Manager {
  private wallet: WalletInfo | null = null;
  private listeners: Array<(wallet: WalletInfo | null) => void> = [];

  // Check if MetaMask is available
  isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined' &&
           (window as any).ethereum.isMetaMask;
  }

  // Connect to MetaMask
  async connectMetaMask(): Promise<WalletInfo> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please ensure MetaMask is unlocked.');
      }

      const provider = new BrowserProvider(ethereum);
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
        signer
      };

      this.wallet = walletInfo;
      this.notifyListeners();

      // Listen for account changes
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.connectMetaMask().catch(console.error);
        }
      });

      // Listen for chain changes
      ethereum.on('chainChanged', () => {
        this.connectMetaMask().catch(console.error);
      });

      return walletInfo;
    } catch (error: any) {
      console.error('MetaMask connection failed:', error);
      throw new Error(error.message || 'Failed to connect to MetaMask');
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

  // Disconnect wallet
  disconnect(): void {
    this.wallet = null;
    this.notifyListeners();
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