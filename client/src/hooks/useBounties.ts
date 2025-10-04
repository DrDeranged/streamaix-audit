import { useMutation, useQuery } from '@tanstack/react-query';
import { contractManager, parseTokenAmount } from '@/lib/contracts';
import { useWeb3 } from './useWeb3';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

export function useBounties() {
  const { wallet, isConnected } = useWeb3();
  const { toast } = useToast();

  // Fetch bounty count from blockchain
  const { data: bountyCount } = useQuery({
    queryKey: ['/api/bounties/count', wallet?.chainId],
    queryFn: async () => {
      if (!isConnected) return 0;
      return await contractManager.getBountyCount();
    },
    enabled: isConnected,
  });

  // Create bounty on blockchain and database
  const createBounty = useMutation({
    mutationFn: async ({
      title,
      description,
      reward,
      deadline,
      tags,
    }: {
      title: string;
      description: string;
      reward: number;
      deadline: Date;
      tags?: string[];
    }) => {
      if (!wallet?.address) throw new Error('Wallet not connected');

      // Convert reward to wei (18 decimals)
      const rewardInWei = parseTokenAmount(reward.toString(), 18);
      
      // Approve STREAM tokens for BountyBoard contract
      const addresses = contractManager.getContractAddresses(wallet.chainId);
      if (!addresses?.bountyBoard) throw new Error('BountyBoard not deployed on this network');
      
      toast({
        title: 'Approving tokens...',
        description: 'Please approve the $STREAM token transfer in your wallet.',
      });

      const approveTxHash = await contractManager.approveStream(addresses.bountyBoard, rewardInWei);
      await contractManager.waitForTransaction(approveTxHash);

      toast({
        title: 'Creating bounty...',
        description: 'Please confirm the bounty creation transaction.',
      });

      // Create bounty on blockchain
      const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
      const txHash = await contractManager.createBounty(rewardInWei, deadlineTimestamp);
      
      // Wait for transaction confirmation
      const receipt = await contractManager.waitForTransaction(txHash);
      if (!receipt) throw new Error('Transaction failed');

      // Save to database
      const response = await apiRequest('/api/bounties', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          reward,
          deadline: deadline.toISOString(),
          tags: tags || [],
          creatorWallet: wallet.address,
          blockchainTxHash: txHash,
          status: 'open',
        }),
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Bounty created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bounty',
        variant: 'destructive',
      });
    },
  });

  // Claim bounty
  const claimBounty = useMutation({
    mutationFn: async ({ bountyId, contractBountyId }: { bountyId: string; contractBountyId: number }) => {
      if (!wallet?.address) throw new Error('Wallet not connected');

      toast({
        title: 'Claiming bounty...',
        description: 'Please confirm the claim transaction in your wallet.',
      });

      // Claim on blockchain
      const txHash = await contractManager.claimBounty(contractBountyId);
      
      // Wait for confirmation
      const receipt = await contractManager.waitForTransaction(txHash);
      if (!receipt) throw new Error('Transaction failed');

      // Update database
      const response = await apiRequest(`/api/bounties/${bountyId}/claim`, {
        method: 'POST',
        body: JSON.stringify({
          claimerWallet: wallet.address,
          blockchainTxHash: txHash,
        }),
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Bounty claimed successfully. Start working on it!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim bounty',
        variant: 'destructive',
      });
    },
  });

  // Complete bounty
  const completeBounty = useMutation({
    mutationFn: async ({
      bountyId,
      contractBountyId,
      summaryId,
    }: {
      bountyId: string;
      contractBountyId: number;
      summaryId: string;
    }) => {
      if (!wallet?.address) throw new Error('Wallet not connected');

      toast({
        title: 'Completing bounty...',
        description: 'Please confirm the completion transaction in your wallet.',
      });

      // Complete on blockchain (triggers payout)
      const txHash = await contractManager.completeBounty(contractBountyId);
      
      // Wait for confirmation
      const receipt = await contractManager.waitForTransaction(txHash);
      if (!receipt) throw new Error('Transaction failed');

      // Update database
      const response = await apiRequest(`/api/bounties/${bountyId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          summaryId,
          completionTxHash: txHash,
        }),
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Bounty completed! Payout has been sent to your wallet.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete bounty',
        variant: 'destructive',
      });
    },
  });

  // Add tip to bounty
  const addTip = useMutation({
    mutationFn: async ({
      bountyId,
      contractBountyId,
      amount,
    }: {
      bountyId: string;
      contractBountyId: number;
      amount: number;
    }) => {
      if (!wallet?.address) throw new Error('Wallet not connected');

      // Convert amount to wei
      const amountInWei = parseTokenAmount(amount.toString(), 18);

      // Approve tokens
      const addresses = contractManager.getContractAddresses(wallet.chainId);
      if (!addresses?.bountyBoard) throw new Error('BountyBoard not deployed on this network');

      toast({
        title: 'Approving tip...',
        description: 'Please approve the token transfer in your wallet.',
      });

      const approveTxHash = await contractManager.approveStream(addresses.bountyBoard, amountInWei);
      await contractManager.waitForTransaction(approveTxHash);

      toast({
        title: 'Adding tip...',
        description: 'Please confirm the tip transaction.',
      });

      // Add tip on blockchain
      const txHash = await contractManager.addTipToBounty(contractBountyId, amountInWei);
      
      // Wait for confirmation
      const receipt = await contractManager.waitForTransaction(txHash);
      if (!receipt) throw new Error('Transaction failed');

      // Update database
      const response = await apiRequest(`/api/bounties/${bountyId}/tip`, {
        method: 'POST',
        body: JSON.stringify({
          tipperWallet: wallet.address,
          amount,
          blockchainTxHash: txHash,
        }),
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Tip added successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add tip',
        variant: 'destructive',
      });
    },
  });

  // Refund bounty (if expired and unclaimed)
  const refundBounty = useMutation({
    mutationFn: async ({ bountyId, contractBountyId }: { bountyId: string; contractBountyId: number }) => {
      if (!wallet?.address) throw new Error('Wallet not connected');

      toast({
        title: 'Requesting refund...',
        description: 'Please confirm the refund transaction in your wallet.',
      });

      // Refund on blockchain
      const txHash = await contractManager.refundBounty(contractBountyId);
      
      // Wait for confirmation
      const receipt = await contractManager.waitForTransaction(txHash);
      if (!receipt) throw new Error('Transaction failed');

      // Update database status to expired
      const response = await apiRequest(`/api/bounties/${bountyId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'expired',
        }),
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Refund processed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bounties'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process refund',
        variant: 'destructive',
      });
    },
  });

  return {
    bountyCount,
    createBounty,
    claimBounty,
    completeBounty,
    addTip,
    refundBounty,
    isConnected,
    wallet,
  };
}
