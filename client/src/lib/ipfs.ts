// IPFS and Arweave integration for decentralized storage

export interface IPFSNode {
  id: string;
  agentVersion: string;
  protocolVersion: string;
}

export interface StorageResult {
  ipfsHash?: string;
  arweaveId?: string;
  gateway: string;
  timestamp: number;
}

// IPFS Configuration
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
];

// Arweave Configuration  
const ARWEAVE_GATEWAYS = [
  'https://arweave.net/',
  'https://ar-io.net/',
  'https://g8way.io/',
];

export class DecentralizedStorage {
  private pinataApiKey?: string;
  private arweaveKey?: string;

  constructor(pinataApiKey?: string, arweaveKey?: string) {
    this.pinataApiKey = pinataApiKey;
    this.arweaveKey = arweaveKey;
  }

  // IPFS Methods
  async uploadToIPFS(content: any, metadata?: any): Promise<StorageResult> {
    try {
      // For demo purposes, we'll simulate IPFS upload
      // In production, use services like Pinata, Infura, or Web3.Storage
      
      const mockHash = this.generateMockIPFSHash();
      const gateway = IPFS_GATEWAYS[0];
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        ipfsHash: mockHash,
        gateway: `${gateway}${mockHash}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`IPFS upload failed: ${error}`);
    }
  }

  async uploadJSONToIPFS(data: object): Promise<StorageResult> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      return await this.uploadToIPFS(jsonString, {
        contentType: 'application/json',
        size: jsonString.length,
      });
    } catch (error) {
      throw new Error(`JSON IPFS upload failed: ${error}`);
    }
  }

  async getFromIPFS(hash: string): Promise<any> {
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const response = await fetch(`${gateway}${hash}`, {
          timeout: 10000,
        } as any);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return await response.json();
          }
          return await response.text();
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}: ${error}`);
      }
    }
    throw new Error(`Failed to retrieve IPFS content: ${hash}`);
  }

  // Arweave Methods
  async uploadToArweave(content: any, tags?: Array<{name: string, value: string}>): Promise<StorageResult> {
    try {
      // For demo purposes, we'll simulate Arweave upload
      // In production, use Arweave SDK with proper wallet
      
      const mockId = this.generateMockArweaveId();
      const gateway = ARWEAVE_GATEWAYS[0];
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        arweaveId: mockId,
        gateway: `${gateway}${mockId}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Arweave upload failed: ${error}`);
    }
  }

  async getFromArweave(id: string): Promise<any> {
    for (const gateway of ARWEAVE_GATEWAYS) {
      try {
        const response = await fetch(`${gateway}${id}`, {
          timeout: 10000,
        } as any);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return await response.json();
          }
          return await response.text();
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}: ${error}`);
      }
    }
    throw new Error(`Failed to retrieve Arweave content: ${id}`);
  }

  // Hybrid Storage - Upload to both IPFS and Arweave
  async uploadToDecentralizedStorage(content: any, metadata?: any): Promise<{
    ipfs: StorageResult;
    arweave: StorageResult;
  }> {
    try {
      const [ipfsResult, arweaveResult] = await Promise.all([
        this.uploadToIPFS(content, metadata),
        this.uploadToArweave(content, metadata ? Object.entries(metadata).map(([name, value]) => ({name, value: String(value)})) : undefined),
      ]);

      return {
        ipfs: ipfsResult,
        arweave: arweaveResult,
      };
    } catch (error) {
      throw new Error(`Decentralized storage upload failed: ${error}`);
    }
  }

  // Content Verification
  async verifyContent(ipfsHash: string, arweaveId: string): Promise<boolean> {
    try {
      const [ipfsContent, arweaveContent] = await Promise.all([
        this.getFromIPFS(ipfsHash),
        this.getFromArweave(arweaveId),
      ]);

      // Simple comparison - in production, use cryptographic hashes
      return JSON.stringify(ipfsContent) === JSON.stringify(arweaveContent);
    } catch (error) {
      console.error('Content verification failed:', error);
      return false;
    }
  }

  // Summary-specific methods
  async storeSummaryData(summary: {
    title: string;
    content: string;
    originalUrl: string;
    keyInsights?: string[];
    chapters?: Array<{title: string, content: string, timestamp: string}>;
    metadata?: any;
  }): Promise<{
    ipfs: StorageResult;
    arweave: StorageResult;
    nftMetadata: any;
  }> {
    // Create NFT metadata
    const nftMetadata = {
      name: summary.title,
      description: `AI-generated summary of: ${summary.originalUrl}`,
      image: this.generateSummaryImage(summary.title),
      external_url: summary.originalUrl,
      attributes: [
        { trait_type: 'Content Type', value: 'AI Summary' },
        { trait_type: 'Original Platform', value: this.extractPlatform(summary.originalUrl) },
        { trait_type: 'Insights Count', value: summary.keyInsights?.length || 0 },
        { trait_type: 'Chapters Count', value: summary.chapters?.length || 0 },
        { trait_type: 'Created At', value: new Date().toISOString() },
      ],
      properties: {
        summary: summary.content,
        keyInsights: summary.keyInsights,
        chapters: summary.chapters,
        metadata: summary.metadata,
      },
    };

    // Upload to decentralized storage
    const storageResult = await this.uploadToDecentralizedStorage(nftMetadata);

    return {
      ...storageResult,
      nftMetadata,
    };
  }

  // Utility Methods
  private generateMockIPFSHash(): string {
    const chars = 'QmabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'Qm';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateMockArweaveId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    let result = '';
    for (let i = 0; i < 43; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateSummaryImage(title: string): string {
    // Generate a placeholder image URL or SVG for the summary
    const encodedTitle = encodeURIComponent(title);
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodedTitle}&backgroundColor=6366f1,8b5cf6,a855f7&scale=80`;
  }

  private extractPlatform(url: string): string {
    try {
      const domain = new URL(url).hostname;
      if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'YouTube';
      if (domain.includes('twitter.com') || domain.includes('x.com')) return 'Twitter';
      if (domain.includes('podcast')) return 'Podcast';
      if (domain.includes('twitch.tv')) return 'Twitch';
      if (domain.includes('spotify.com')) return 'Spotify';
      return 'Web';
    } catch {
      return 'Unknown';
    }
  }

  // Pin content to ensure availability
  async pinContent(hash: string, service: 'ipfs' | 'arweave' = 'ipfs'): Promise<boolean> {
    try {
      if (service === 'ipfs') {
        // In production, use Pinata, Web3.Storage, or other pinning services
        console.log(`Pinning IPFS content: ${hash}`);
        return true;
      } else {
        // Arweave content is permanent by default
        console.log(`Arweave content is permanently stored: ${hash}`);
        return true;
      }
    } catch (error) {
      console.error(`Failed to pin ${service} content:`, error);
      return false;
    }
  }

  // Get content size and metadata
  async getContentInfo(hash: string, service: 'ipfs' | 'arweave' = 'ipfs'): Promise<{
    size?: number;
    contentType?: string;
    lastModified?: number;
  }> {
    try {
      const gateways = service === 'ipfs' ? IPFS_GATEWAYS : ARWEAVE_GATEWAYS;
      const response = await fetch(`${gateways[0]}${hash}`, {
        method: 'HEAD',
      });

      return {
        size: response.headers.get('content-length') ? parseInt(response.headers.get('content-length')!) : undefined,
        contentType: response.headers.get('content-type') || undefined,
        lastModified: response.headers.get('last-modified') ? new Date(response.headers.get('last-modified')!).getTime() : undefined,
      };
    } catch (error) {
      console.error(`Failed to get ${service} content info:`, error);
      return {};
    }
  }
}

// Create singleton instance
export const decentralizedStorage = new DecentralizedStorage();

// Export utility functions
export const isValidIPFSHash = (hash: string): boolean => {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash);
};

export const isValidArweaveId = (id: string): boolean => {
  return /^[a-zA-Z0-9_-]{43}$/.test(id);
};

export const getIPFSGatewayUrl = (hash: string, gateway: string = IPFS_GATEWAYS[0]): string => {
  return `${gateway}${hash}`;
};

export const getArweaveGatewayUrl = (id: string, gateway: string = ARWEAVE_GATEWAYS[0]): string => {
  return `${gateway}${id}`;
};