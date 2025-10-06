import { ethers, Contract } from 'ethers';
import { STREAM_TOKEN_ABI, SUMMARY_NFT_ABI, STAKING_ABI, BOUNTY_BOARD_ABI } from '../../shared/contractABIs';

interface ContractAddresses {
  streamToken: string;
  summaryNFT: string;
  staking: string;
  bountyBoard: string;
}

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private addresses: ContractAddresses;
  
  constructor(rpcUrl: string, addresses: ContractAddresses) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.addresses = addresses;
  }
  
  // Helper to get contract instance with signer
  private getContractWithSigner(address: string, abi: any[], privateKey: string) {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    return new Contract(address, abi, wallet);
  }
  
  // Helper to get read-only contract instance
  private getContract(address: string, abi: any[]) {
    return new Contract(address, abi, this.provider);
  }
  
  // ==================== BOUNTY BOARD FUNCTIONS ====================
  
  async createBountyOnChain(
    privateKey: string,
    reward: string, // in wei
    deadline: number // timestamp
  ): Promise<{ txHash: string; bountyId: number }> {
    try {
      const contract = this.getContractWithSigner(
        this.addresses.bountyBoard,
        BOUNTY_BOARD_ABI,
        privateKey
      );
      
      const tx = await contract.createBounty(reward, deadline);
      const receipt = await tx.wait();
      
      // Get bountyId from BountyCreated event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'BountyCreated';
        } catch {
          return false;
        }
      });
      
      let bountyId = 0;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        bountyId = Number(parsed?.args[0] || 0);
      }
      
      return {
        txHash: receipt.hash,
        bountyId
      };
    } catch (error: any) {
      console.error('Error creating bounty on-chain:', error);
      throw new Error(`On-chain bounty creation failed: ${error.message}`);
    }
  }
  
  async approveBountyTokens(
    privateKey: string,
    amount: string // in wei
  ): Promise<string> {
    try {
      const contract = this.getContractWithSigner(
        this.addresses.streamToken,
        STREAM_TOKEN_ABI,
        privateKey
      );
      
      const tx = await contract.approve(this.addresses.bountyBoard, amount);
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error approving tokens:', error);
      throw new Error(`Token approval failed: ${error.message}`);
    }
  }
  
  async completeBountyOnChain(
    privateKey: string,
    bountyId: number
  ): Promise<string> {
    try {
      const contract = this.getContractWithSigner(
        this.addresses.bountyBoard,
        BOUNTY_BOARD_ABI,
        privateKey
      );
      
      const tx = await contract.completeBounty(bountyId);
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error completing bounty on-chain:', error);
      throw new Error(`On-chain bounty completion failed: ${error.message}`);
    }
  }
  
  async addTipToBounty(
    privateKey: string,
    bountyId: number,
    amount: string // in wei
  ): Promise<string> {
    try {
      // First approve tokens
      await this.approveBountyTokens(privateKey, amount);
      
      const contract = this.getContractWithSigner(
        this.addresses.bountyBoard,
        BOUNTY_BOARD_ABI,
        privateKey
      );
      
      const tx = await contract.addTip(bountyId, amount);
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error adding tip on-chain:', error);
      throw new Error(`On-chain tip failed: ${error.message}`);
    }
  }
  
  // ==================== NFT FUNCTIONS ====================
  
  async mintSummaryNFT(
    ownerPrivateKey: string,
    recipientAddress: string,
    ipfsHash: string,
    arweaveId: string
  ): Promise<{ txHash: string; tokenId: number }> {
    try {
      const contract = this.getContractWithSigner(
        this.addresses.summaryNFT,
        SUMMARY_NFT_ABI,
        ownerPrivateKey
      );
      
      const tx = await contract.mintSummaryNFT(recipientAddress, ipfsHash, arweaveId);
      const receipt = await tx.wait();
      
      // Get tokenId from SummaryMinted event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'SummaryMinted';
        } catch {
          return false;
        }
      });
      
      let tokenId = 0;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        tokenId = Number(parsed?.args[0] || 0);
      }
      
      return {
        txHash: receipt.hash,
        tokenId
      };
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      throw new Error(`NFT minting failed: ${error.message}`);
    }
  }
  
  async getUserNFTs(address: string): Promise<Array<{ tokenId: number; ipfsHash: string; arweaveId: string }>> {
    try {
      const contract = this.getContract(this.addresses.summaryNFT, SUMMARY_NFT_ABI);
      const balance = await contract.balanceOf(address);
      const nfts = [];
      
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        const [ipfsHash, arweaveId] = await contract.getSummaryData(tokenId);
        nfts.push({
          tokenId: Number(tokenId),
          ipfsHash,
          arweaveId
        });
      }
      
      return nfts;
    } catch (error: any) {
      console.error('Error getting user NFTs:', error);
      throw new Error(`Failed to get NFTs: ${error.message}`);
    }
  }
  
  // ==================== STAKING FUNCTIONS ====================
  
  async stake(
    privateKey: string,
    amount: string // in wei
  ): Promise<string> {
    try {
      // First approve staking contract
      const tokenContract = this.getContractWithSigner(
        this.addresses.streamToken,
        STREAM_TOKEN_ABI,
        privateKey
      );
      
      const approveTx = await tokenContract.approve(this.addresses.staking, amount);
      await approveTx.wait();
      
      // Then stake
      const stakingContract = this.getContractWithSigner(
        this.addresses.staking,
        STAKING_ABI,
        privateKey
      );
      
      const tx = await stakingContract.stake(amount);
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error staking:', error);
      throw new Error(`Staking failed: ${error.message}`);
    }
  }
  
  async unstake(
    privateKey: string,
    amount: string // in wei
  ): Promise<string> {
    try {
      const contract = this.getContractWithSigner(
        this.addresses.staking,
        STAKING_ABI,
        privateKey
      );
      
      const tx = await contract.unstake(amount);
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error unstaking:', error);
      throw new Error(`Unstaking failed: ${error.message}`);
    }
  }
  
  async claimRewards(privateKey: string): Promise<string> {
    try {
      const contract = this.getContractWithSigner(
        this.addresses.staking,
        STAKING_ABI,
        privateKey
      );
      
      const tx = await contract.claimRewards();
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error claiming rewards:', error);
      throw new Error(`Claim rewards failed: ${error.message}`);
    }
  }
  
  async getStakedAmount(address: string): Promise<string> {
    try {
      const contract = this.getContract(this.addresses.staking, STAKING_ABI);
      const amount = await contract.getStakedAmount(address);
      return amount.toString();
    } catch (error: any) {
      console.error('Error getting staked amount:', error);
      return '0';
    }
  }
  
  async getPendingRewards(address: string): Promise<string> {
    try {
      const contract = this.getContract(this.addresses.staking, STAKING_ABI);
      const rewards = await contract.getPendingRewards(address);
      return rewards.toString();
    } catch (error: any) {
      console.error('Error getting pending rewards:', error);
      return '0';
    }
  }
  
  // ==================== TOKEN FUNCTIONS ====================
  
  async getTokenBalance(address: string): Promise<string> {
    try {
      const contract = this.getContract(this.addresses.streamToken, STREAM_TOKEN_ABI);
      const balance = await contract.balanceOf(address);
      return balance.toString();
    } catch (error: any) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }
  
  async mintTokens(
    ownerPrivateKey: string,
    recipientAddress: string,
    amount: string // in wei
  ): Promise<string> {
    try {
      const contract = this.getContractWithSigner(
        this.addresses.streamToken,
        STREAM_TOKEN_ABI,
        ownerPrivateKey
      );
      
      const tx = await contract.mint(recipientAddress, amount);
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Error minting tokens:', error);
      throw new Error(`Token minting failed: ${error.message}`);
    }
  }
}

// Singleton instance for Base network
let contractServiceInstance: ContractService | null = null;

export function getContractService(): ContractService {
  if (!contractServiceInstance) {
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    const addresses: ContractAddresses = {
      streamToken: process.env.VITE_BASE_STREAM_TOKEN || '',
      summaryNFT: process.env.VITE_BASE_SUMMARY_NFT || '',
      staking: process.env.VITE_BASE_STAKING || '',
      bountyBoard: process.env.VITE_BASE_BOUNTY_BOARD || '',
    };
    
    contractServiceInstance = new ContractService(rpcUrl, addresses);
  }
  
  return contractServiceInstance;
}
