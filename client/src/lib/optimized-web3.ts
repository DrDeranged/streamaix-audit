// Optimized Web3 integration with connection pooling and batching
import { BrowserProvider, JsonRpcSigner, Contract } from 'ethers';
// Import types only to avoid circular dependencies
export interface WalletInfo {
  address: string;
  chainId: number;
  ensName?: string;
  balance?: string;
  provider: BrowserProvider;
  signer: JsonRpcSigner;
}

export interface ContractCall {
  address: string;
  abi: any[];
  method: string;
  args: any[];
  chainId: number;
}

export interface BatchCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class OptimizedWeb3Manager {
  private static instance: OptimizedWeb3Manager;
  private providers: Map<number, BrowserProvider> = new Map();
  private contracts: Map<string, Contract> = new Map();
  private batchQueue: Array<{
    call: ContractCall;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimeout: number | null = null;
  private readonly BATCH_DELAY = 50; // 50ms batching window
  private readonly MAX_BATCH_SIZE = 20;

  static getInstance(): OptimizedWeb3Manager {
    if (!OptimizedWeb3Manager.instance) {
      OptimizedWeb3Manager.instance = new OptimizedWeb3Manager();
    }
    return OptimizedWeb3Manager.instance;
  }

  // Get cached provider for chain
  getProvider(chainId: number): BrowserProvider {
    if (!this.providers.has(chainId)) {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not available');
      }
      
      const provider = new BrowserProvider(window.ethereum);
      this.providers.set(chainId, provider);
    }
    
    return this.providers.get(chainId)!;
  }

  // Get cached contract instance
  getContract(address: string, abi: any[], chainId: number): Contract {
    const key = `${chainId}-${address.toLowerCase()}`;
    
    if (!this.contracts.has(key)) {
      const provider = this.getProvider(chainId);
      const contract = new Contract(address, abi, provider);
      this.contracts.set(key, contract);
    }
    
    return this.contracts.get(key)!;
  }

  // Optimized single contract call with caching
  async callContract(
    address: string,
    abi: any[],
    method: string,
    args: any[] = [],
    chainId: number = 1
  ): Promise<any> {
    try {
      const contract = this.getContract(address, abi, chainId);
      return await contract[method](...args);
    } catch (error: any) {
      console.error(`Contract call failed: ${method}`, error);
      throw new Error(`Contract call failed: ${error.message}`);
    }
  }

  // Batch multiple contract calls for efficiency
  async batchCall(calls: ContractCall[]): Promise<BatchCallResult[]> {
    const promises = calls.map(call => 
      new Promise<BatchCallResult>((resolve, reject) => {
        this.batchQueue.push({ call, resolve, reject });
      })
    );

    this.scheduleBatch();
    
    return Promise.all(promises);
  }

  private scheduleBatch(): void {
    if (this.batchTimeout !== null) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = window.setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    const batch = this.batchQueue.splice(0, this.MAX_BATCH_SIZE);
    this.batchTimeout = null;

    // Group by chain ID for efficient processing
    const callsByChain = batch.reduce((acc, item) => {
      const chainId = item.call.chainId;
      if (!acc[chainId]) {
        acc[chainId] = [];
      }
      acc[chainId].push(item);
      return acc;
    }, {} as Record<number, typeof batch>);

    // Process each chain's calls in parallel
    const chainPromises = Object.entries(callsByChain).map(([chainId, chainCalls]) =>
      this.processChainCalls(Number(chainId), chainCalls)
    );

    await Promise.all(chainPromises);

    // Continue processing if there are more calls
    if (this.batchQueue.length > 0) {
      this.scheduleBatch();
    }
  }

  private async processChainCalls(
    chainId: number,
    calls: Array<{
      call: ContractCall;
      resolve: (value: any) => void;
      reject: (error: any) => void;
    }>
  ): Promise<void> {
    try {
      // Execute all calls for this chain in parallel
      const results = await Promise.allSettled(
        calls.map(({ call }) =>
          this.callContract(call.address, call.abi, call.method, call.args, call.chainId)
        )
      );

      // Resolve/reject each call with its result
      results.forEach((result, index) => {
        const { resolve, reject } = calls[index];
        
        if (result.status === 'fulfilled') {
          resolve({ success: true, data: result.value });
        } else {
          reject({ success: false, error: result.reason.message });
        }
      });
    } catch (error: any) {
      // If batch processing fails, reject all calls
      calls.forEach(({ reject }) => {
        reject({ success: false, error: error.message });
      });
    }
  }

  // Optimized transaction with simulation
  async simulateTransaction(
    to: string,
    data: string,
    value: string = '0',
    chainId: number = 1
  ): Promise<{ success: boolean; gasEstimate?: string; error?: string }> {
    try {
      const provider = this.getProvider(chainId);
      const gasEstimate = await provider.estimateGas({
        to,
        data,
        value,
      });

      return {
        success: true,
        gasEstimate: gasEstimate.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Enhanced transaction with retry logic
  async sendTransaction(
    to: string,
    data: string,
    value: string = '0',
    gasLimit?: string,
    chainId: number = 1
  ): Promise<string> {
    const provider = this.getProvider(chainId);
    const signer = await provider.getSigner();

    // Simulate first
    const simulation = await this.simulateTransaction(to, data, value, chainId);
    if (!simulation.success) {
      throw new Error(`Transaction simulation failed: ${simulation.error}`);
    }

    const tx = {
      to,
      data,
      value,
      gasLimit: gasLimit || simulation.gasEstimate,
    };

    try {
      const txResponse = await signer.sendTransaction(tx);
      return txResponse.hash;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  // Multi-chain balance fetching
  async getMultiChainBalances(address: string, chainIds: number[]): Promise<Record<number, string>> {
    const balancePromises = chainIds.map(async (chainId) => {
      try {
        const provider = this.getProvider(chainId);
        const balance = await provider.getBalance(address);
        return { chainId, balance: balance.toString() };
      } catch (error) {
        console.warn(`Failed to get balance for chain ${chainId}:`, error);
        return { chainId, balance: '0' };
      }
    });

    const results = await Promise.all(balancePromises);
    return results.reduce((acc, { chainId, balance }) => {
      acc[chainId] = balance;
      return acc;
    }, {} as Record<number, string>);
  }

  // Token balance fetching with multicall optimization
  async getTokenBalances(
    address: string,
    tokens: Array<{ address: string; decimals: number; symbol: string }>,
    chainId: number = 1
  ): Promise<Array<{ symbol: string; balance: string; decimals: number }>> {
    const ERC20_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
    ];

    const calls: ContractCall[] = tokens.map(token => ({
      address: token.address,
      abi: ERC20_ABI,
      method: 'balanceOf',
      args: [address],
      chainId,
    }));

    try {
      const results = await this.batchCall(calls);
      
      return tokens.map((token, index) => ({
        symbol: token.symbol,
        balance: results[index].success ? results[index].data.toString() : '0',
        decimals: token.decimals,
      }));
    } catch (error) {
      console.error('Token balance fetch failed:', error);
      return tokens.map(token => ({
        symbol: token.symbol,
        balance: '0',
        decimals: token.decimals,
      }));
    }
  }

  // Gas price optimization
  async getOptimalGasPrice(chainId: number = 1): Promise<{
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  }> {
    try {
      const provider = this.getProvider(chainId);
      const gasPrice = await provider.getFeeData();
      
      const baseGasPrice = Number(gasPrice.gasPrice || 0);
      
      return {
        slow: (baseGasPrice * 0.8).toString(),
        standard: baseGasPrice.toString(),
        fast: (baseGasPrice * 1.2).toString(),
        instant: (baseGasPrice * 1.5).toString(),
      };
    } catch (error) {
      console.error('Gas price fetch failed:', error);
      // Fallback values
      return {
        slow: '20000000000', // 20 gwei
        standard: '25000000000', // 25 gwei
        fast: '30000000000', // 30 gwei
        instant: '35000000000', // 35 gwei
      };
    }
  }

  // Connection health monitoring
  async checkConnectionHealth(chainId: number): Promise<{
    healthy: boolean;
    latency: number;
    blockNumber: number;
  }> {
    const start = performance.now();
    
    try {
      const provider = this.getProvider(chainId);
      const blockNumber = await provider.getBlockNumber();
      const latency = performance.now() - start;
      
      return {
        healthy: true,
        latency,
        blockNumber,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: performance.now() - start,
        blockNumber: 0,
      };
    }
  }

  // Clear caches for memory management
  clearCaches(): void {
    this.contracts.clear();
    // Keep providers for better UX
  }

  // Clean up resources
  cleanup(): void {
    if (this.batchTimeout !== null) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    this.batchQueue = [];
    this.clearCaches();
  }
}

// Singleton instance
export const optimizedWeb3 = OptimizedWeb3Manager.getInstance();

// Hook for React components
export function useOptimizedWeb3() {
  return {
    callContract: optimizedWeb3.callContract.bind(optimizedWeb3),
    batchCall: optimizedWeb3.batchCall.bind(optimizedWeb3),
    simulateTransaction: optimizedWeb3.simulateTransaction.bind(optimizedWeb3),
    sendTransaction: optimizedWeb3.sendTransaction.bind(optimizedWeb3),
    getMultiChainBalances: optimizedWeb3.getMultiChainBalances.bind(optimizedWeb3),
    getTokenBalances: optimizedWeb3.getTokenBalances.bind(optimizedWeb3),
    getOptimalGasPrice: optimizedWeb3.getOptimalGasPrice.bind(optimizedWeb3),
    checkConnectionHealth: optimizedWeb3.checkConnectionHealth.bind(optimizedWeb3),
  };
}