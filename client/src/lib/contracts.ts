import { Contract, Interface } from 'ethers';
import { web3Manager, type WalletInfo } from './web3';

// ═══════════════════════════════════════════════════════════════════════
// DEPLOYMENT CONFIGURATION - Update after deploying contracts to Base
// ═══════════════════════════════════════════════════════════════════════
// 
// After deploying your smart contracts to Base network, update the addresses below:
// 1. Deploy STREAM token contract → Update VITE_BASE_STREAM_TOKEN
// 2. Deploy SummaryNFT contract → Update VITE_BASE_SUMMARY_NFT
// 3. Deploy Staking contract → Update VITE_BASE_STAKING
// 4. Deploy BountyBoard contract → Update VITE_BASE_BOUNTY_BOARD
//
// Add these to your .env file:
// VITE_BASE_STREAM_TOKEN=0xYourStreamTokenAddress
// VITE_BASE_SUMMARY_NFT=0xYourSummaryNFTAddress
// VITE_BASE_STAKING=0xYourStakingAddress
// VITE_BASE_BOUNTY_BOARD=0xYourBountyBoardAddress
//
// ═══════════════════════════════════════════════════════════════════════

// StreamAiX Token Contract ABI
export const STREAM_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function mint(address to, uint256 amount) returns (bool)',
  'function burn(uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// StreamAiX Summary NFT Contract ABI
export const SUMMARY_NFT_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function mintSummaryNFT(address to, string memory ipfsHash, string memory arweaveId) returns (uint256)',
  'function getSummaryData(uint256 tokenId) view returns (string memory ipfsHash, string memory arweaveId, uint256 timestamp)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function approve(address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event SummaryMinted(uint256 indexed tokenId, address indexed owner, string ipfsHash)',
];

// Staking Contract ABI
export const STAKING_ABI = [
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function claimRewards()',
  'function getStakedAmount(address user) view returns (uint256)',
  'function getPendingRewards(address user) view returns (uint256)',
  'function getAPR() view returns (uint256)',
  'function totalStaked() view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
];

// BountyBoard Contract ABI
export const BOUNTY_BOARD_ABI = [
  'function createBounty(uint256 reward, uint256 deadline) returns (uint256)',
  'function claimBounty(uint256 bountyId)',
  'function completeBounty(uint256 bountyId)',
  'function addTip(uint256 bountyId, uint256 amount)',
  'function refund(uint256 bountyId)',
  'function getBounty(uint256 bountyId) view returns (tuple(address creator, address claimer, uint256 reward, uint256 tipPool, uint256 deadline, uint8 status))',
  'function getBountyCount() view returns (uint256)',
  'function platformFee() view returns (uint256)',
  'function platformFeeRecipient() view returns (address)',
  'event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward, uint256 deadline)',
  'event BountyClaimed(uint256 indexed bountyId, address indexed claimer)',
  'event BountyCompleted(uint256 indexed bountyId, address indexed claimer, uint256 totalPayout)',
  'event TipAdded(uint256 indexed bountyId, address indexed tipper, uint256 amount)',
  'event BountyRefunded(uint256 indexed bountyId, address indexed creator, uint256 amount)',
];

// Contract addresses by network
// Base network addresses can be overridden via environment variables
export const CONTRACT_ADDRESSES = {
  1: { // Ethereum Mainnet (not used - Base is primary network)
    streamToken: '0x0000000000000000000000000000000000000001',
    summaryNFT: '0x0000000000000000000000000000000000000002',
    staking: '0x0000000000000000000000000000000000000003',
    bountyBoard: '0x0000000000000000000000000000000000000010',
  },
  10: { // Optimism (not used - Base is primary network)
    streamToken: '0x0000000000000000000000000000000000000004',
    summaryNFT: '0x0000000000000000000000000000000000000005',
    staking: '0x0000000000000000000000000000000000000006',
    bountyBoard: '0x0000000000000000000000000000000000000011',
  },
  137: { // Polygon (not used - Base is primary network)
    streamToken: '0x0000000000000000000000000000000000000007',
    summaryNFT: '0x0000000000000000000000000000000000000008',
    staking: '0x0000000000000000000000000000000000000009',
    bountyBoard: '0x0000000000000000000000000000000000000012',
  },
  8453: { // Base - PRIMARY NETWORK FOR PRODUCTION
    streamToken: import.meta.env.VITE_BASE_STREAM_TOKEN || '0x000000000000000000000000000000000000000A',
    summaryNFT: import.meta.env.VITE_BASE_SUMMARY_NFT || '0x000000000000000000000000000000000000000B',
    staking: import.meta.env.VITE_BASE_STAKING || '0x000000000000000000000000000000000000000C',
    bountyBoard: import.meta.env.VITE_BASE_BOUNTY_BOARD || '0x000000000000000000000000000000000000000D',
  },
};

// Primary network for StreamAiX
export const PRIMARY_CHAIN_ID = 8453; // Base network

// Check if Base contracts are properly configured
export function areContractsConfigured(): boolean {
  const baseAddresses = CONTRACT_ADDRESSES[8453];
  return Object.values(baseAddresses).every(addr => 
    addr !== '0x000000000000000000000000000000000000000A' &&
    addr !== '0x000000000000000000000000000000000000000B' &&
    addr !== '0x000000000000000000000000000000000000000C' &&
    addr !== '0x000000000000000000000000000000000000000D'
  );
}

export class ContractManager {
  private wallet: WalletInfo | null = null;

  constructor() {
    // Listen for wallet changes
    web3Manager.onWalletChange((wallet) => {
      this.wallet = wallet;
    });
  }

  // Get contract addresses for current network
  getContractAddresses(chainId: number) {
    return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  }

  // Create contract instance
  private createContract(address: string, abi: string[]) {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }
    return new Contract(address, abi, this.wallet.signer);
  }

  // STREAM Token Methods
  async getStreamTokenContract() {
    if (!this.wallet) throw new Error('Wallet not connected');
    const addresses = this.getContractAddresses(this.wallet.chainId);
    if (!addresses) throw new Error('Unsupported network');
    
    return this.createContract(addresses.streamToken, STREAM_TOKEN_ABI);
  }

  async getStreamBalance(address: string): Promise<string> {
    const contract = await this.getStreamTokenContract();
    const balance = await contract.balanceOf(address);
    return balance.toString();
  }

  async transferStream(to: string, amount: string): Promise<string> {
    const contract = await this.getStreamTokenContract();
    const tx = await contract.transfer(to, amount);
    return tx.hash;
  }

  async approveStream(spender: string, amount: string): Promise<string> {
    const contract = await this.getStreamTokenContract();
    const tx = await contract.approve(spender, amount);
    return tx.hash;
  }

  // Summary NFT Methods
  async getSummaryNFTContract() {
    if (!this.wallet) throw new Error('Wallet not connected');
    const addresses = this.getContractAddresses(this.wallet.chainId);
    if (!addresses) throw new Error('Unsupported network');
    
    return this.createContract(addresses.summaryNFT, SUMMARY_NFT_ABI);
  }

  async mintSummaryNFT(to: string, ipfsHash: string, arweaveId: string): Promise<string> {
    const contract = await this.getSummaryNFTContract();
    const tx = await contract.mintSummaryNFT(to, ipfsHash, arweaveId);
    return tx.hash;
  }

  async getUserNFTs(address: string): Promise<Array<{ tokenId: string, ipfsHash: string, arweaveId: string }>> {
    const contract = await this.getSummaryNFTContract();
    const balance = await contract.balanceOf(address);
    const nfts = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(address, i);
      const [ipfsHash, arweaveId] = await contract.getSummaryData(tokenId);
      nfts.push({
        tokenId: tokenId.toString(),
        ipfsHash,
        arweaveId
      });
    }

    return nfts;
  }

  async getSummaryNFTMetadata(tokenId: string): Promise<string> {
    const contract = await this.getSummaryNFTContract();
    return await contract.tokenURI(tokenId);
  }

  // Staking Methods
  async getStakingContract() {
    if (!this.wallet) throw new Error('Wallet not connected');
    const addresses = this.getContractAddresses(this.wallet.chainId);
    if (!addresses) throw new Error('Unsupported network');
    
    return this.createContract(addresses.staking, STAKING_ABI);
  }

  async stakeTokens(amount: string): Promise<string> {
    const contract = await this.getStakingContract();
    const tx = await contract.stake(amount);
    return tx.hash;
  }

  async unstakeTokens(amount: string): Promise<string> {
    const contract = await this.getStakingContract();
    const tx = await contract.unstake(amount);
    return tx.hash;
  }

  async claimStakingRewards(): Promise<string> {
    const contract = await this.getStakingContract();
    const tx = await contract.claimRewards();
    return tx.hash;
  }

  async getStakingInfo(address: string): Promise<{
    stakedAmount: string;
    pendingRewards: string;
    apr: string;
    totalStaked: string;
  }> {
    const contract = await this.getStakingContract();
    const [stakedAmount, pendingRewards, apr, totalStaked] = await Promise.all([
      contract.getStakedAmount(address),
      contract.getPendingRewards(address),
      contract.getAPR(),
      contract.totalStaked(),
    ]);

    return {
      stakedAmount: stakedAmount.toString(),
      pendingRewards: pendingRewards.toString(),
      apr: apr.toString(),
      totalStaked: totalStaked.toString(),
    };
  }

  // BountyBoard Methods
  async getBountyBoardContract() {
    if (!this.wallet) throw new Error('Wallet not connected');
    const addresses = this.getContractAddresses(this.wallet.chainId);
    if (!addresses || !addresses.bountyBoard) throw new Error('BountyBoard not deployed on this network');
    
    return this.createContract(addresses.bountyBoard, BOUNTY_BOARD_ABI);
  }

  async createBounty(reward: string, deadline: number): Promise<string> {
    const contract = await this.getBountyBoardContract();
    const tx = await contract.createBounty(reward, deadline);
    return tx.hash;
  }

  async claimBounty(bountyId: number): Promise<string> {
    const contract = await this.getBountyBoardContract();
    const tx = await contract.claimBounty(bountyId);
    return tx.hash;
  }

  async completeBounty(bountyId: number): Promise<string> {
    const contract = await this.getBountyBoardContract();
    const tx = await contract.completeBounty(bountyId);
    return tx.hash;
  }

  async addTipToBounty(bountyId: number, amount: string): Promise<string> {
    const contract = await this.getBountyBoardContract();
    const tx = await contract.addTip(bountyId, amount);
    return tx.hash;
  }

  async refundBounty(bountyId: number): Promise<string> {
    const contract = await this.getBountyBoardContract();
    const tx = await contract.refund(bountyId);
    return tx.hash;
  }

  async getBountyFromChain(bountyId: number): Promise<{
    creator: string;
    claimer: string;
    reward: string;
    tipPool: string;
    deadline: string;
    status: number;
  }> {
    const contract = await this.getBountyBoardContract();
    const bounty = await contract.getBounty(bountyId);
    return {
      creator: bounty[0],
      claimer: bounty[1],
      reward: bounty[2].toString(),
      tipPool: bounty[3].toString(),
      deadline: bounty[4].toString(),
      status: bounty[5],
    };
  }

  async getBountyCount(): Promise<number> {
    const contract = await this.getBountyBoardContract();
    const count = await contract.getBountyCount();
    return count.toNumber();
  }

  // Utility Methods
  async estimateGas(contract: Contract, method: string, params: any[]): Promise<string> {
    const gasEstimate = await contract[method].estimateGas(...params);
    return gasEstimate.toString();
  }

  async getTransactionReceipt(txHash: string) {
    if (!this.wallet) throw new Error('Wallet not connected');
    return await this.wallet.provider.getTransactionReceipt(txHash);
  }

  async waitForTransaction(txHash: string) {
    if (!this.wallet) throw new Error('Wallet not connected');
    return await this.wallet.provider.waitForTransaction(txHash);
  }
}

// Create singleton instance
export const contractManager = new ContractManager();

// Export utility functions
export const formatTokenAmount = (amount: string, decimals: number = 18): string => {
  try {
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toFixed(4);
  } catch {
    return '0.0000';
  }
};

// ═══════════════════════════════════════════════════════════════════════
// BASE NETWORK UTILITIES
// ═══════════════════════════════════════════════════════════════════════

// Get BaseScan transaction URL
export function getBaseScanTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}

// Get BaseScan address URL
export function getBaseScanAddressUrl(address: string): string {
  return `https://basescan.org/address/${address}`;
}

// Get BaseScan token URL
export function getBaseScanTokenUrl(tokenAddress: string): string {
  return `https://basescan.org/token/${tokenAddress}`;
}

// Estimate gas for Base network (Base has lower gas costs than Ethereum mainnet)
export function estimateBaseGas(operationType: 'transfer' | 'approve' | 'bounty' | 'stake'): bigint {
  const gasEstimates = {
    transfer: 50000n,
    approve: 60000n,
    bounty: 200000n,
    stake: 150000n,
  };
  return gasEstimates[operationType] || 100000n;
}

// Format Base network errors for user-friendly display
export function formatBaseNetworkError(error: any): string {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Common Base network errors
  if (errorMessage.includes('insufficient funds')) {
    return 'Insufficient ETH on Base network for gas fees. Please add ETH to your wallet.';
  }
  if (errorMessage.includes('user rejected')) {
    return 'Transaction was rejected. Please try again.';
  }
  if (errorMessage.includes('nonce')) {
    return 'Transaction nonce error. Try refreshing and attempting again.';
  }
  if (errorMessage.includes('gas')) {
    return 'Gas estimation failed. The transaction may fail or network may be congested.';
  }
  if (errorMessage.includes('reverted')) {
    return 'Transaction reverted. Check contract state and try again.';
  }
  
  return errorMessage;
}

export const parseTokenAmount = (amount: string, decimals: number = 18): string => {
  try {
    const value = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(value).toString();
  } catch {
    return '0';
  }
};