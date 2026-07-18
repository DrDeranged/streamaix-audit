import { ethers, Contract } from 'ethers';
import { STREAM_TOKEN_ABI, SUMMARY_NFT_ABI, STAKING_ABI, BOUNTY_BOARD_ABI } from '../../shared/contractABIs';
import { db } from '../db';
import { onchainActions } from '@shared/schema';

interface ContractAddresses {
  streamToken: string;
  summaryNFT: string;
  staking: string;
  bountyBoard: string;
}

export function onchainWritesEnabled(): boolean {
  return process.env.ONCHAIN_WRITES_ENABLED === 'true';
}

/**
 * Resolve the limited service signer key (MINTER_ROLE only).
 * SERVICE_SIGNER_PRIVATE_KEY is the only supported source; the legacy
 * PRIVATE_KEY (owner/admin key) must never be used for routine writes.
 */
export function getServiceSignerKey(): string {
  const key = process.env.SERVICE_SIGNER_PRIVATE_KEY;
  if (!key) {
    if (process.env.PRIVATE_KEY) {
      throw new Error(
        'SERVICE_SIGNER_PRIVATE_KEY is not set. The legacy PRIVATE_KEY (admin key) is DEPRECATED for server-side writes and will not be used. Provision a limited MINTER_ROLE key as SERVICE_SIGNER_PRIVATE_KEY.'
      );
    }
    throw new Error('SERVICE_SIGNER_PRIVATE_KEY is not configured.');
  }
  return key;
}

/** Boot-time check: loud logging, never throws. */
export function logContractServiceBootState(): void {
  const writes = onchainWritesEnabled();
  const bridge = process.env.BRIDGE_ENABLED === 'true';
  console.log('\n⛓️  ========== ON-CHAIN / BRIDGE FLAGS ==========');
  console.log(
    writes
      ? '🟢 ONCHAIN_WRITES_ENABLED=true — on-chain WRITES ARE LIVE'
      : '🔒 ONCHAIN_WRITES_ENABLED=false (default) — all on-chain writes DISABLED; reads still allowed'
  );
  console.log(
    bridge
      ? '🟢 BRIDGE_ENABLED=true — points-to-token bridge is ACTIVE'
      : '🔒 BRIDGE_ENABLED=false (default) — points-to-token bridge DORMANT BY DESIGN (see replit.md)'
  );
  if (!process.env.SERVICE_SIGNER_PRIVATE_KEY && process.env.PRIVATE_KEY) {
    console.error(
      '❌ DEPRECATION: only PRIVATE_KEY is configured. Server-side contract writes now require SERVICE_SIGNER_PRIVATE_KEY (a limited MINTER_ROLE key). PRIVATE_KEY will NOT be used; writes will fail until SERVICE_SIGNER_PRIVATE_KEY is provisioned.'
    );
  }
  console.log('===============================================\n');
}

async function recordOnchainAction(row: {
  action: string;
  args: any;
  txHash?: string | null;
  gasUsed?: string | null;
  status: 'success' | 'failed';
  error?: string | null;
}): Promise<void> {
  try {
    await db.insert(onchainActions).values({
      action: row.action,
      args: row.args,
      txHash: row.txHash ?? null,
      gasUsed: row.gasUsed ?? null,
      status: row.status,
      error: row.error ?? null,
    });
  } catch (e: any) {
    console.error('[contractService] failed to write onchain_actions audit row:', e?.message);
  }
}

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private addresses: ContractAddresses;

  constructor(rpcUrl: string, addresses: ContractAddresses) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.addresses = addresses;
  }

  // Helper to get contract instance with the service signer
  private getContractWithSigner(address: string, abi: any[]) {
    const wallet = new ethers.Wallet(getServiceSignerKey(), this.provider);
    return new Contract(address, abi, wallet);
  }

  // Helper to get read-only contract instance
  private getContract(address: string, abi: any[]) {
    return new Contract(address, abi, this.provider);
  }

  private signerAddress(): string {
    return new ethers.Wallet(getServiceSignerKey()).address;
  }

  /** Throws unless the global kill switch is on. Every write path calls this first. */
  private assertWritesEnabled(action: string): void {
    if (!onchainWritesEnabled()) {
      throw new Error(
        `On-chain writes disabled: ONCHAIN_WRITES_ENABLED is not 'true' (attempted action: ${action}). This is a deliberate kill switch, not a bug.`
      );
    }
  }

  /** Pre-flight role check: fail fast if the service key lacks the required role. */
  private async assertRole(
    contractAddress: string,
    abi: any[],
    roleName: 'MINTER_ROLE' | 'RESOLVER_ROLE',
    action: string
  ): Promise<void> {
    const contract = this.getContract(contractAddress, abi);
    const signer = this.signerAddress();
    let has = false;
    try {
      const role = await contract[roleName]();
      has = await contract.hasRole(role, signer);
    } catch (e: any) {
      throw new Error(
        `Role pre-flight failed for ${action}: could not verify ${roleName} for ${signer} on ${contractAddress} (${e.message})`
      );
    }
    if (!has) {
      throw new Error(
        `Role pre-flight failed for ${action}: service signer ${signer} does NOT hold ${roleName} on ${contractAddress}. Grant the role or fix SERVICE_SIGNER_PRIVATE_KEY.`
      );
    }
  }

  /**
   * Executes an on-chain write with kill-switch gate, structured logging, and
   * an onchain_actions audit row (written on both success and failure).
   */
  private async executeWrite(
    action: string,
    args: Record<string, any>,
    fn: () => Promise<any>
  ): Promise<any> {
    this.assertWritesEnabled(action);
    try {
      const receipt = await fn();
      const txHash = receipt?.hash ?? null;
      const gasUsed = receipt?.gasUsed != null ? receipt.gasUsed.toString() : null;
      console.log('[onchain-write]', JSON.stringify({ action, args, txHash, gasUsed }));
      await recordOnchainAction({ action, args, txHash, gasUsed, status: 'success' });
      return receipt;
    } catch (error: any) {
      console.error('[onchain-write-failed]', JSON.stringify({ action, args, error: error.message }));
      await recordOnchainAction({ action, args, status: 'failed', error: error.message });
      throw error;
    }
  }

  // ==================== BOUNTY BOARD FUNCTIONS ====================

  async createBountyOnChain(
    reward: string, // in wei
    deadline: number // timestamp
  ): Promise<{ txHash: string; bountyId: number }> {
    const contract = this.getContractWithSigner(this.addresses.bountyBoard, BOUNTY_BOARD_ABI);
    const receipt = await this.executeWrite('createBounty', { reward, deadline }, async () => {
      const tx = await contract.createBounty(reward, deadline);
      return tx.wait();
    });

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

    return { txHash: receipt.hash, bountyId };
  }

  async approveBountyTokens(amount: string): Promise<string> {
    const contract = this.getContractWithSigner(this.addresses.streamToken, STREAM_TOKEN_ABI);
    const receipt = await this.executeWrite(
      'approveBountyTokens',
      { spender: this.addresses.bountyBoard, amount },
      async () => {
        const tx = await contract.approve(this.addresses.bountyBoard, amount);
        return tx.wait();
      }
    );
    return receipt.hash;
  }

  async completeBountyOnChain(bountyId: number): Promise<string> {
    const contract = this.getContractWithSigner(this.addresses.bountyBoard, BOUNTY_BOARD_ABI);
    const receipt = await this.executeWrite('completeBounty', { bountyId }, async () => {
      const tx = await contract.completeBounty(bountyId);
      return tx.wait();
    });
    return receipt.hash;
  }

  async addTipToBounty(bountyId: number, amount: string): Promise<string> {
    // First approve tokens
    await this.approveBountyTokens(amount);

    const contract = this.getContractWithSigner(this.addresses.bountyBoard, BOUNTY_BOARD_ABI);
    const receipt = await this.executeWrite('addTip', { bountyId, amount }, async () => {
      const tx = await contract.addTip(bountyId, amount);
      return tx.wait();
    });
    return receipt.hash;
  }

  // ==================== NFT FUNCTIONS ====================

  async mintSummaryNFT(
    recipientAddress: string,
    ipfsHash: string,
    arweaveId: string
  ): Promise<{ txHash: string; tokenId: number }> {
    this.assertWritesEnabled('mintSummaryNFT');
    await this.assertRole(this.addresses.summaryNFT, SUMMARY_NFT_ABI, 'MINTER_ROLE', 'mintSummaryNFT');

    const contract = this.getContractWithSigner(this.addresses.summaryNFT, SUMMARY_NFT_ABI);
    const receipt = await this.executeWrite(
      'mintSummaryNFT',
      { recipientAddress, ipfsHash, arweaveId },
      async () => {
        const tx = await contract.mintSummaryNFT(recipientAddress, ipfsHash, arweaveId);
        return tx.wait();
      }
    );

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

    return { txHash: receipt.hash, tokenId };
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

  async stake(amount: string): Promise<string> {
    // First approve staking contract
    const tokenContract = this.getContractWithSigner(this.addresses.streamToken, STREAM_TOKEN_ABI);
    await this.executeWrite('approveStaking', { spender: this.addresses.staking, amount }, async () => {
      const tx = await tokenContract.approve(this.addresses.staking, amount);
      return tx.wait();
    });

    const stakingContract = this.getContractWithSigner(this.addresses.staking, STAKING_ABI);
    const receipt = await this.executeWrite('stake', { amount }, async () => {
      const tx = await stakingContract.stake(amount);
      return tx.wait();
    });
    return receipt.hash;
  }

  async unstake(amount: string): Promise<string> {
    const contract = this.getContractWithSigner(this.addresses.staking, STAKING_ABI);
    const receipt = await this.executeWrite('unstake', { amount }, async () => {
      const tx = await contract.unstake(amount);
      return tx.wait();
    });
    return receipt.hash;
  }

  async claimRewards(): Promise<string> {
    const contract = this.getContractWithSigner(this.addresses.staking, STAKING_ABI);
    const receipt = await this.executeWrite('claimRewards', {}, async () => {
      const tx = await contract.claimRewards();
      return tx.wait();
    });
    return receipt.hash;
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
    recipientAddress: string,
    amount: string // in wei
  ): Promise<string> {
    this.assertWritesEnabled('mintTokens');
    await this.assertRole(this.addresses.streamToken, STREAM_TOKEN_ABI, 'MINTER_ROLE', 'mintTokens');

    const contract = this.getContractWithSigner(this.addresses.streamToken, STREAM_TOKEN_ABI);
    const receipt = await this.executeWrite('mintTokens', { recipientAddress, amount }, async () => {
      const tx = await contract.mint(recipientAddress, amount);
      return tx.wait();
    });
    return receipt.hash;
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
