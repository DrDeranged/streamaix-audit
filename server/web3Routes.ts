import type { Express, Response } from "express";
import { authenticateToken, type AuthRequest } from "./auth";
import { getContractService } from "./services/contractService";
import { storage } from "./storage";
import { ethers } from "ethers";

// Helper function to handle async route errors
const asyncHandler = (fn: (req: any, res: Response) => Promise<any>) => 
  (req: AuthRequest, res: Response) => {
    Promise.resolve(fn(req, res)).catch((err: any) => {
      console.error('Web3 Route Error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    });
  };

export function registerWeb3Routes(app: Express) {
  const contractService = getContractService();
  const nftOwnerPrivateKey = process.env.NFT_OWNER_PRIVATE_KEY || '';
  
  // ==================== NFT ROUTES ====================
  
  // Mint NFT for completed summary (server-side, requires NFT owner key)
  app.post('/api/web3/mint-summary-nft', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { summaryId, recipientAddress, ipfsHash, arweaveId } = req.body;
    
    if (!summaryId || !recipientAddress || !ipfsHash) {
      return res.status(400).json({ error: 'Summary ID, recipient address, and IPFS hash are required' });
    }
    
    if (!nftOwnerPrivateKey) {
      return res.status(500).json({ error: 'NFT owner private key not configured' });
    }
    
    // Verify summary exists and belongs to user or is completed bounty
    const summary = await storage.getSummary(summaryId);
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    
    if (summary.processingStatus !== 'completed') {
      return res.status(400).json({ error: 'Summary must be completed before minting NFT' });
    }
    
    try {
      const result = await contractService.mintSummaryNFT(
        nftOwnerPrivateKey,
        recipientAddress,
        ipfsHash,
        arweaveId || ''
      );
      
      // Update summary with NFT info
      await storage.updateSummary(summaryId, {
        nftTokenId: result.tokenId.toString(),
        nftTxHash: result.txHash
      });
      
      res.json({
        message: 'NFT minted successfully',
        txHash: result.txHash,
        tokenId: result.tokenId,
        explorer: `https://basescan.org/tx/${result.txHash}`
      });
    } catch (error: any) {
      console.error('NFT minting error:', error);
      res.status(500).json({ error: error.message });
    }
  }));
  
  // Get user's NFTs
  app.get('/api/web3/nfts/:address', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    try {
      const nfts = await contractService.getUserNFTs(address);
      res.json({ nfts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));
  
  // ==================== STAKING ROUTES ====================
  
  // Get staking info for address
  app.get('/api/web3/staking/:address', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    try {
      const [stakedAmount, pendingRewards] = await Promise.all([
        contractService.getStakedAmount(address),
        contractService.getPendingRewards(address)
      ]);
      
      res.json({
        address,
        stakedAmount: ethers.formatEther(stakedAmount),
        stakedAmountWei: stakedAmount,
        pendingRewards: ethers.formatEther(pendingRewards),
        pendingRewardsWei: pendingRewards
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));
  
  // ==================== TOKEN ROUTES ====================
  
  // Get token balance
  app.get('/api/web3/balance/:address', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    try {
      const balance = await contractService.getTokenBalance(address);
      
      res.json({
        address,
        balance: ethers.formatEther(balance),
        balanceWei: balance
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));
  
  // Reward user with tokens (platform operation, requires owner key)
  app.post('/api/web3/reward-tokens', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientAddress, amount, reason } = req.body;
    
    if (!recipientAddress || !amount) {
      return res.status(400).json({ error: 'Recipient address and amount are required' });
    }
    
    if (!ethers.isAddress(recipientAddress)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }
    
    const tokenOwnerKey = process.env.PRIVATE_KEY;
    if (!tokenOwnerKey) {
      return res.status(500).json({ error: 'Token owner private key not configured' });
    }
    
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const txHash = await contractService.mintTokens(
        tokenOwnerKey,
        recipientAddress,
        amountWei.toString()
      );
      
      res.json({
        message: 'Tokens rewarded successfully',
        txHash,
        amount,
        recipient: recipientAddress,
        reason,
        explorer: `https://basescan.org/tx/${txHash}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }));
  
  // ==================== CONTRACT INFO ROUTES ====================
  
  // Get contract addresses
  app.get('/api/web3/contracts', asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({
      network: 'Base',
      chainId: 8453,
      contracts: {
        streamToken: process.env.VITE_BASE_STREAM_TOKEN,
        summaryNFT: process.env.VITE_BASE_SUMMARY_NFT,
        staking: process.env.VITE_BASE_STAKING,
        bountyBoard: process.env.VITE_BASE_BOUNTY_BOARD
      },
      explorer: 'https://basescan.org'
    });
  }));
  
  // Verify transaction hash
  app.post('/api/web3/verify-tx', asyncHandler(async (req: AuthRequest, res: Response) => {
    const { txHash } = req.body;
    
    if (!txHash) {
      return res.status(400).json({ error: 'Transaction hash is required' });
    }
    
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.BASE_RPC_URL || 'https://mainnet.base.org'
      );
      
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return res.status(404).json({ 
          error: 'Transaction not found',
          verified: false 
        });
      }
      
      res.json({
        verified: true,
        txHash,
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        explorer: `https://basescan.org/tx/${txHash}`
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: error.message,
        verified: false 
      });
    }
  }));
}
