// DAO Governance system for community-driven decisions
import { Contract } from 'ethers';
import { web3Manager, type WalletInfo } from './web3';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  proposerEnsName?: string;
  category: 'PROTOCOL' | 'TREASURY' | 'GOVERNANCE' | 'COMMUNITY' | 'TECHNICAL';
  status: 'DRAFT' | 'ACTIVE' | 'SUCCEEDED' | 'FAILED' | 'EXECUTED' | 'CANCELLED';
  votingPower: string;
  quorumRequired: string;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  startTime: number;
  endTime: number;
  executionTime?: number;
  executionData?: string;
  targets?: string[];
  values?: string[];
  signatures?: string[];
  calldatas?: string[];
}

export interface Vote {
  proposalId: string;
  voter: string;
  voterEnsName?: string;
  support: 'FOR' | 'AGAINST' | 'ABSTAIN';
  votingPower: string;
  reason?: string;
  timestamp: number;
  txHash: string;
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  totalVotingPower: string;
  participationRate: number;
  averageQuorum: number;
  successRate: number;
}

export interface VotingPower {
  address: string;
  tokenBalance: string;
  delegatedPower: string;
  totalVotingPower: string;
  delegatedTo?: string;
  delegatedFrom: string[];
}

// Governance contract ABI
const GOVERNANCE_ABI = [
  'function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
  'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)',
  'function getVotes(address account, uint256 blockNumber) view returns (uint256)',
  'function delegate(address delegatee)',
  'function proposals(uint256 proposalId) view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)',
  'function state(uint256 proposalId) view returns (uint8)',
  'function proposalThreshold() view returns (uint256)',
  'function quorum(uint256 blockNumber) view returns (uint256)',
  'event ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
  'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)',
];

const TIMELOCK_ABI = [
  'function queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) returns (bytes32)',
  'function executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) payable returns (bytes)',
  'function delay() view returns (uint256)',
  'event QueueTransaction(bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta)',
];

// Governance contract addresses by network
const GOVERNANCE_ADDRESSES = {
  1: {
    governor: '0x0000000000000000000000000000000000000001',
    timelock: '0x0000000000000000000000000000000000000002',
    token: '0x0000000000000000000000000000000000000003',
  },
  10: {
    governor: '0x0000000000000000000000000000000000000004',
    timelock: '0x0000000000000000000000000000000000000005',
    token: '0x0000000000000000000000000000000000000006',
  },
  137: {
    governor: '0x0000000000000000000000000000000000000007',
    timelock: '0x0000000000000000000000000000000000000008',
    token: '0x0000000000000000000000000000000000000009',
  },
  8453: {
    governor: '0x000000000000000000000000000000000000000A',
    timelock: '0x000000000000000000000000000000000000000B',
    token: '0x000000000000000000000000000000000000000C',
  },
};

export class GovernanceManager {
  private wallet: WalletInfo | null = null;

  constructor() {
    web3Manager.onWalletChange((wallet) => {
      this.wallet = wallet;
    });
  }

  // Create a new proposal
  async createProposal(
    title: string,
    description: string,
    category: Proposal['category'],
    targets: string[],
    values: string[],
    signatures: string[],
    calldatas: string[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const addresses = this.getGovernanceAddresses(this.wallet.chainId);
    if (!addresses) {
      throw new Error('Governance not supported on this network');
    }

    // Check if user has enough voting power to create proposal
    const votingPower = await this.getVotingPower(this.wallet.address);
    const proposalThreshold = await this.getProposalThreshold();
    
    if (parseFloat(votingPower.totalVotingPower) < parseFloat(proposalThreshold)) {
      throw new Error(`Insufficient voting power. Need ${proposalThreshold}, have ${votingPower.totalVotingPower}`);
    }

    const governor = new Contract(addresses.governor, GOVERNANCE_ABI, this.wallet.signer);
    
    // Format description with metadata
    const formattedDescription = this.formatProposalDescription(title, description, category);
    
    const tx = await governor.propose(
      targets,
      values,
      signatures,
      calldatas,
      formattedDescription
    );

    return tx.hash;
  }

  // Cast a vote on a proposal
  async vote(proposalId: string, support: 'FOR' | 'AGAINST' | 'ABSTAIN', reason?: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const addresses = this.getGovernanceAddresses(this.wallet.chainId);
    if (!addresses) {
      throw new Error('Governance not supported on this network');
    }

    const governor = new Contract(addresses.governor, GOVERNANCE_ABI, this.wallet.signer);
    const supportValue = this.supportToNumber(support);

    let tx;
    if (reason && reason.trim()) {
      tx = await governor.castVoteWithReason(proposalId, supportValue, reason);
    } else {
      tx = await governor.castVote(proposalId, supportValue);
    }

    return tx.hash;
  }

  // Delegate voting power to another address
  async delegate(delegatee: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const addresses = this.getGovernanceAddresses(this.wallet.chainId);
    if (!addresses) {
      throw new Error('Governance not supported on this network');
    }

    const tokenContract = new Contract(addresses.token, [
      'function delegate(address delegatee)',
    ], this.wallet.signer);

    const tx = await tokenContract.delegate(delegatee);
    return tx.hash;
  }

  // Get all active proposals
  async getActiveProposals(): Promise<Proposal[]> {
    // Mock active proposals for demonstration
    return [
      {
        id: '1',
        title: 'Increase Staking Rewards by 2%',
        description: 'Proposal to increase STREAM points staking rewards from current 12% APR to 14% APR to incentivize more participation in the protocol.',
        proposer: '0x742d35Cc6Bf42532e82e94aC2D797F89C2d70c4F',
        proposerEnsName: 'alice.eth',
        category: 'PROTOCOL',
        status: 'ACTIVE',
        votingPower: '1000000',
        quorumRequired: '400000',
        votesFor: '325000',
        votesAgainst: '45000',
        votesAbstain: '12000',
        startTime: Date.now() - (2 * 24 * 60 * 60 * 1000),
        endTime: Date.now() + (5 * 24 * 60 * 60 * 1000),
        targets: ['0x0000000000000000000000000000000000000001'],
        values: ['0'],
        signatures: ['setStakingRate(uint256)'],
        calldatas: ['0x000000000000000000000000000000000000000000000000000000000000000e'],
      },
      {
        id: '2',
        title: 'Treasury Allocation for AI Research',
        description: 'Allocate 500,000 STREAM points from treasury to fund advanced AI research and development for next-generation content processing.',
        proposer: '0x891b23C429C55A987B7c4C72D76C07F47D7A2D80',
        proposerEnsName: 'bob.eth',
        category: 'TREASURY',
        status: 'ACTIVE',
        votingPower: '1000000',
        quorumRequired: '400000',
        votesFor: '180000',
        votesAgainst: '95000',
        votesAbstain: '25000',
        startTime: Date.now() - (1 * 24 * 60 * 60 * 1000),
        endTime: Date.now() + (6 * 24 * 60 * 60 * 1000),
        targets: ['0x0000000000000000000000000000000000000002'],
        values: ['500000000000000000000000'],
        signatures: ['transfer(address,uint256)'],
        calldatas: ['0x000000000000000000000000research0000000000000000000000000000000000'],
      },
    ];
  }

  // Get proposal details by ID
  async getProposal(proposalId: string): Promise<Proposal | null> {
    const activeProposals = await this.getActiveProposals();
    return activeProposals.find(p => p.id === proposalId) || null;
  }

  // Get voting history for an address
  async getVotingHistory(address: string): Promise<Vote[]> {
    // Mock voting history
    return [
      {
        proposalId: '1',
        voter: address,
        support: 'FOR',
        votingPower: '50000',
        reason: 'Higher staking rewards will attract more users to the protocol',
        timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000),
        txHash: '0x123...',
      },
      {
        proposalId: '0',
        voter: address,
        support: 'AGAINST',
        votingPower: '50000',
        reason: 'Timeline is too aggressive for implementation',
        timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000),
        txHash: '0x456...',
      },
    ];
  }

  // Get user's voting power
  async getVotingPower(address: string): Promise<VotingPower> {
    // Mock voting power calculation
    return {
      address,
      tokenBalance: '75000',
      delegatedPower: '25000',
      totalVotingPower: '100000',
      delegatedFrom: ['0x123...', '0x456...'],
    };
  }

  // Get governance statistics
  async getGovernanceStats(): Promise<GovernanceStats> {
    return {
      totalProposals: 12,
      activeProposals: 2,
      totalVoters: 1247,
      totalVotingPower: '10000000',
      participationRate: 0.68,
      averageQuorum: 0.42,
      successRate: 0.75,
    };
  }

  // Get proposal threshold (minimum tokens needed to create proposal)
  async getProposalThreshold(): Promise<string> {
    if (!this.wallet) return '100000';
    
    const addresses = this.getGovernanceAddresses(this.wallet.chainId);
    if (!addresses) return '100000';

    try {
      const governor = new Contract(addresses.governor, GOVERNANCE_ABI, this.wallet.provider);
      const threshold = await governor.proposalThreshold();
      return threshold.toString();
    } catch (error) {
      console.error('Error fetching proposal threshold:', error);
      return '100000'; // Default fallback
    }
  }

  // Execute a successful proposal
  async executeProposal(proposalId: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const proposal = await this.getProposal(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'SUCCEEDED') {
      throw new Error('Proposal must be in SUCCEEDED state to execute');
    }

    const addresses = this.getGovernanceAddresses(this.wallet.chainId);
    if (!addresses) {
      throw new Error('Governance not supported on this network');
    }

    // In a real implementation, this would execute through the timelock
    const timelock = new Contract(addresses.timelock, TIMELOCK_ABI, this.wallet.signer);
    
    // Execute each target in the proposal
    const executionPromises = proposal.targets!.map(async (target, i) => {
      return timelock.executeTransaction(
        target,
        proposal.values![i],
        proposal.signatures![i],
        proposal.calldatas![i],
        proposal.executionTime!
      );
    });

    const results = await Promise.all(executionPromises);
    return results[0].hash; // Return first transaction hash
  }

  // Private helper methods
  private getGovernanceAddresses(chainId: number) {
    return GOVERNANCE_ADDRESSES[chainId as keyof typeof GOVERNANCE_ADDRESSES];
  }

  private supportToNumber(support: 'FOR' | 'AGAINST' | 'ABSTAIN'): number {
    switch (support) {
      case 'AGAINST': return 0;
      case 'FOR': return 1;
      case 'ABSTAIN': return 2;
      default: return 1;
    }
  }

  private formatProposalDescription(title: string, description: string, category: Proposal['category']): string {
    return `# ${title}\n\n**Category:** ${category}\n\n## Description\n\n${description}\n\n---\n*Created via StreamAiX Governance*`;
  }

  // Proposal state helpers
  getProposalStatus(state: number): Proposal['status'] {
    const states = ['DRAFT', 'ACTIVE', 'CANCELLED', 'FAILED', 'SUCCEEDED', 'EXECUTED'];
    return (states[state] || 'DRAFT') as Proposal['status'];
  }

  getVotingProgress(proposal: Proposal): {
    forPercentage: number;
    againstPercentage: number;
    abstainPercentage: number;
    quorumProgress: number;
  } {
    const totalVotes = parseFloat(proposal.votesFor) + parseFloat(proposal.votesAgainst) + parseFloat(proposal.votesAbstain);
    
    return {
      forPercentage: totalVotes > 0 ? (parseFloat(proposal.votesFor) / totalVotes) * 100 : 0,
      againstPercentage: totalVotes > 0 ? (parseFloat(proposal.votesAgainst) / totalVotes) * 100 : 0,
      abstainPercentage: totalVotes > 0 ? (parseFloat(proposal.votesAbstain) / totalVotes) * 100 : 0,
      quorumProgress: (totalVotes / parseFloat(proposal.quorumRequired)) * 100,
    };
  }

  getTimeRemaining(endTime: number): {
    days: number;
    hours: number;
    minutes: number;
    isExpired: boolean;
  } {
    const now = Date.now();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) {
      return { days: 0, hours: 0, minutes: 0, isExpired: true };
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    return { days, hours, minutes, isExpired: false };
  }
}

export const governanceManager = new GovernanceManager();