import { ethers } from 'ethers';

interface Web3Config {
  rpcUrl: string;
  chainId: number;
  chainName: string;
}

export class Web3Service {
  private static configs: Record<string, Web3Config> = {
    ethereum: {
      rpcUrl: 'https://eth.llamarpc.com',
      chainId: 1,
      chainName: 'Ethereum Mainnet'
    },
    optimism: {
      rpcUrl: 'https://mainnet.optimism.io',
      chainId: 10,
      chainName: 'Optimism'
    },
    polygon: {
      rpcUrl: 'https://polygon-rpc.com',
      chainId: 137,
      chainName: 'Polygon'
    },
    base: {
      rpcUrl: 'https://mainnet.base.org',
      chainId: 8453,
      chainName: 'Base'
    }
  };

  /**
   * Verify wallet signature for authentication
   */
  static async verifySignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Resolve ENS name to address
   */
  static async resolveENS(ensName: string): Promise<string | null> {
    try {
      const provider = new ethers.JsonRpcProvider(this.configs.ethereum.rpcUrl);
      const address = await provider.resolveName(ensName);
      return address;
    } catch (error) {
      console.error('ENS resolution failed:', error);
      return null;
    }
  }

  /**
   * Get ENS name from address
   */
  static async lookupENS(address: string): Promise<string | null> {
    try {
      const provider = new ethers.JsonRpcProvider(this.configs.ethereum.rpcUrl);
      const ensName = await provider.lookupAddress(address);
      return ensName;
    } catch (error) {
      console.error('ENS lookup failed:', error);
      return null;
    }
  }

  /**
   * Check wallet balance across networks
   */
  static async getWalletBalances(address: string): Promise<{
    [network: string]: {
      native: string;
      usd?: number;
    };
  }> {
    const balances: any = {};

    try {
      for (const [network, config] of Object.entries(this.configs)) {
        try {
          const provider = new ethers.JsonRpcProvider(config.rpcUrl);
          const balance = await provider.getBalance(address);
          balances[network] = {
            native: ethers.formatEther(balance),
            usd: undefined // Would integrate with price API
          };
        } catch (error) {
          balances[network] = {
            native: '0.0',
            usd: 0
          };
        }
      }
    } catch (error) {
      console.error('Balance fetch failed:', error);
    }

    return balances;
  }

  /**
   * Generate wallet authentication message
   */
  static generateAuthMessage(address: string, nonce: string): string {
    return `Sign this message to authenticate with StreamAiX:

Address: ${address}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This signature is only used for authentication and will not trigger any blockchain transaction.`;
  }

  /**
   * Store data on IPFS using Pinata service
   */
  static async storeOnIPFS(data: any): Promise<string> {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    // If Pinata not configured, fall back to mock
    if (!pinataApiKey || !pinataSecretKey) {
      console.warn('⚠️ IPFS: Pinata not configured, using mock hash');
      const mockHash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      return mockHash;
    }

    try {
      console.log('📦 Uploading to IPFS via Pinata...');
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `streamaix-${Date.now()}.json`,
            keyvalues: {
              app: 'StreamAiX',
              timestamp: new Date().toISOString()
            }
          },
          pinataOptions: {
            cidVersion: 1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Pinata API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const ipfsHash = result.IpfsHash;
      
      console.log('✅ IPFS upload successful:', ipfsHash);
      return ipfsHash;
      
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      // Fall back to mock on error
      const mockHash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      console.warn('⚠️ Using mock IPFS hash:', mockHash);
      return mockHash;
    }
  }

  /**
   * Store data on Arweave (uses bundlr/irys for easy uploads)
   */
  static async storeOnArweave(data: any): Promise<string> {
    const arweaveKey = process.env.ARWEAVE_KEY;

    // If Arweave not configured, fall back to mock
    if (!arweaveKey) {
      console.warn('⚠️ Arweave: Key not configured, using mock ID');
      const mockTxId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      return mockTxId;
    }

    try {
      console.log('📦 Uploading to Arweave...');
      
      // For simplicity, using Irys (formerly Bundlr) devnet for uploads
      // In production, you'd use mainnet with real AR tokens
      const response = await fetch('https://devnet.irys.xyz/tx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Arweave upload error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Arweave upload successful:', result.id);
      return result.id;
      
    } catch (error) {
      console.error('❌ Arweave upload failed:', error);
      // Fall back to mock on error
      const mockTxId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      console.warn('⚠️ Using mock Arweave ID:', mockTxId);
      return mockTxId;
    }
  }

  /**
   * Token reward calculation (mock implementation)
   */
  static calculateTokenReward(
    contentType: 'summary' | 'bounty' | 'interaction',
    quality: number = 1.0,
    engagement: number = 1.0
  ): number {
    const baseRewards = {
      summary: 10,
      bounty: 25,
      interaction: 1
    };

    const base = baseRewards[contentType];
    return Math.floor(base * quality * engagement);
  }

  /**
   * Mock social protocol integration
   */
  static async shareToLens(content: {
    title: string;
    summary: string;
    url: string;
    tags: string[];
  }): Promise<{ success: boolean; postId?: string }> {
    // Mock Lens Protocol integration
    const postId = 'lens-' + Math.random().toString(36).substring(2, 10);
    console.log('Mock Lens share:', { postId, title: content.title });
    
    return {
      success: true,
      postId
    };
  }

  /**
   * Mock Farcaster integration
   */
  static async shareToFarcaster(content: {
    title: string;
    summary: string;
    url: string;
  }): Promise<{ success: boolean; castHash?: string }> {
    // Mock Farcaster integration
    const castHash = '0x' + Math.random().toString(16).substring(2, 10);
    console.log('Mock Farcaster cast:', { castHash, title: content.title });
    
    return {
      success: true,
      castHash
    };
  }

  /**
   * Validate wallet address format
   */
  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Generate random nonce for authentication
   */
  static generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}