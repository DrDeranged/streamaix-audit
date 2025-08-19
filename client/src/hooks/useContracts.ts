import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './useWeb3';
import { useToast } from './use-toast';
import { contractManager, formatTokenAmount, parseTokenAmount } from '@/lib/contracts';
import { decentralizedStorage } from '@/lib/ipfs';

export function useContracts() {
  const { wallet, isConnected } = useWeb3();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Token operations
  const [streamBalance, setStreamBalance] = useState<string>('0');
  const [stakingInfo, setStakingInfo] = useState({
    stakedAmount: '0',
    pendingRewards: '0',
    apr: '0',
    totalStaked: '0',
  });
  const [userNFTs, setUserNFTs] = useState<Array<{
    tokenId: string;
    ipfsHash: string;
    arweaveId: string;
    metadata?: any;
  }>>([]);

  // Load user's contract data
  const loadContractData = useCallback(async () => {
    if (!wallet || !isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load STREAM token balance
      const balance = await contractManager.getStreamBalance(wallet.address);
      setStreamBalance(balance);

      // Load staking information
      const staking = await contractManager.getStakingInfo(wallet.address);
      setStakingInfo(staking);

      // Load user's NFTs
      const nfts = await contractManager.getUserNFTs(wallet.address);
      
      // Load metadata for each NFT
      const nftsWithMetadata = await Promise.all(
        nfts.map(async (nft) => {
          try {
            const metadata = await decentralizedStorage.getFromIPFS(nft.ipfsHash);
            return { ...nft, metadata };
          } catch (error) {
            console.warn(`Failed to load metadata for NFT ${nft.tokenId}:`, error);
            return nft;
          }
        })
      );

      setUserNFTs(nftsWithMetadata);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load contract data';
      setError(errorMessage);
      console.error('Contract data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, isConnected]);

  // Load data when wallet connects
  useEffect(() => {
    loadContractData();
  }, [loadContractData]);

  // Token Transfer
  const transferTokens = useCallback(async (to: string, amount: string): Promise<string | null> => {
    if (!wallet) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to transfer tokens',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      const parsedAmount = parseTokenAmount(amount);
      const txHash = await contractManager.transferStream(to, parsedAmount);
      
      toast({
        title: 'Transfer Initiated',
        description: `Transferring ${amount} STREAM tokens`,
      });

      // Wait for transaction confirmation
      await contractManager.waitForTransaction(txHash);
      
      toast({
        title: 'Transfer Successful',
        description: `Successfully transferred ${amount} STREAM tokens`,
      });

      // Reload contract data
      await loadContractData();
      
      return txHash;
    } catch (err: any) {
      const errorMessage = err.message || 'Transfer failed';
      setError(errorMessage);
      toast({
        title: 'Transfer Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, toast, loadContractData]);

  // Stake Tokens
  const stakeTokens = useCallback(async (amount: string): Promise<string | null> => {
    if (!wallet) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to stake tokens',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      const parsedAmount = parseTokenAmount(amount);
      
      // First approve the staking contract
      const approveTxHash = await contractManager.approveStream(
        contractManager.getContractAddresses(wallet.chainId)?.staking || '',
        parsedAmount
      );
      
      toast({
        title: 'Approval Initiated',
        description: 'Approving staking contract...',
      });

      await contractManager.waitForTransaction(approveTxHash);

      // Then stake the tokens
      const stakeTxHash = await contractManager.stakeTokens(parsedAmount);
      
      toast({
        title: 'Staking Initiated',
        description: `Staking ${amount} STREAM tokens`,
      });

      await contractManager.waitForTransaction(stakeTxHash);
      
      toast({
        title: 'Staking Successful',
        description: `Successfully staked ${amount} STREAM tokens`,
      });

      // Reload contract data
      await loadContractData();
      
      return stakeTxHash;
    } catch (err: any) {
      const errorMessage = err.message || 'Staking failed';
      setError(errorMessage);
      toast({
        title: 'Staking Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, toast, loadContractData]);

  // Unstake Tokens
  const unstakeTokens = useCallback(async (amount: string): Promise<string | null> => {
    if (!wallet) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to unstake tokens',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      const parsedAmount = parseTokenAmount(amount);
      const txHash = await contractManager.unstakeTokens(parsedAmount);
      
      toast({
        title: 'Unstaking Initiated',
        description: `Unstaking ${amount} STREAM tokens`,
      });

      await contractManager.waitForTransaction(txHash);
      
      toast({
        title: 'Unstaking Successful',
        description: `Successfully unstaked ${amount} STREAM tokens`,
      });

      // Reload contract data
      await loadContractData();
      
      return txHash;
    } catch (err: any) {
      const errorMessage = err.message || 'Unstaking failed';
      setError(errorMessage);
      toast({
        title: 'Unstaking Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, toast, loadContractData]);

  // Claim Staking Rewards
  const claimRewards = useCallback(async (): Promise<string | null> => {
    if (!wallet) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to claim rewards',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      const txHash = await contractManager.claimStakingRewards();
      
      toast({
        title: 'Claiming Rewards',
        description: 'Processing reward claim...',
      });

      await contractManager.waitForTransaction(txHash);
      
      toast({
        title: 'Rewards Claimed',
        description: 'Successfully claimed staking rewards',
      });

      // Reload contract data
      await loadContractData();
      
      return txHash;
    } catch (err: any) {
      const errorMessage = err.message || 'Reward claim failed';
      setError(errorMessage);
      toast({
        title: 'Claim Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, toast, loadContractData]);

  // Mint Summary NFT
  const mintSummaryNFT = useCallback(async (summaryData: {
    title: string;
    content: string;
    originalUrl: string;
    keyInsights?: string[];
    chapters?: Array<{title: string, content: string, timestamp: string}>;
    metadata?: any;
  }): Promise<string | null> => {
    if (!wallet) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to mint NFT',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      toast({
        title: 'Uploading to IPFS/Arweave',
        description: 'Storing summary data on decentralized networks...',
      });

      // Store summary data on IPFS and Arweave
      const storageResult = await decentralizedStorage.storeSummaryData(summaryData);
      
      toast({
        title: 'Minting NFT',
        description: 'Creating your summary NFT...',
      });

      // Mint the NFT
      const txHash = await contractManager.mintSummaryNFT(
        wallet.address,
        storageResult.ipfs.ipfsHash!,
        storageResult.arweave.arweaveId!
      );

      await contractManager.waitForTransaction(txHash);
      
      toast({
        title: 'NFT Minted Successfully',
        description: 'Your summary has been minted as an NFT',
      });

      // Reload contract data to show the new NFT
      await loadContractData();
      
      return txHash;
    } catch (err: any) {
      const errorMessage = err.message || 'NFT minting failed';
      setError(errorMessage);
      toast({
        title: 'Minting Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, toast, loadContractData]);

  // Format token amounts for display
  const formatStreamBalance = useCallback((balance: string) => {
    return formatTokenAmount(balance, 18);
  }, []);

  return {
    // State
    isLoading,
    error,
    streamBalance: formatStreamBalance(streamBalance),
    stakingInfo: {
      ...stakingInfo,
      stakedAmount: formatStreamBalance(stakingInfo.stakedAmount),
      pendingRewards: formatStreamBalance(stakingInfo.pendingRewards),
      apr: (Number(stakingInfo.apr) / 100).toFixed(2),
      totalStaked: formatStreamBalance(stakingInfo.totalStaked),
    },
    userNFTs,

    // Actions
    transferTokens,
    stakeTokens,
    unstakeTokens,
    claimRewards,
    mintSummaryNFT,
    loadContractData,

    // Utilities
    formatStreamBalance,
    isContractSupported: wallet ? !!contractManager.getContractAddresses(wallet.chainId) : false,
  };
}