import { Router } from 'express';
import { storage } from './storage';
import { farcasterService } from './services/farcaster';
import { knowledgeAvatarService } from './services/knowledgeAvatarService';
import { farcasterTopAccountsService } from './services/farcasterTopAccounts';
import { crossMarketSignalService } from './services/crossMarketSignalService';
import { educationService } from './services/educationService';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Knowledge Avatars endpoints
router.get('/knowledge-avatars', async (req, res) => {
  try {
    console.log('🎓 Fetching Knowledge Avatars...');
    const avatars = await knowledgeAvatarService.getKnowledgeAvatars();
    
    res.json({
      success: true,
      avatars,
      count: avatars.length
    });
  } catch (error: any) {
    console.error('Failed to fetch knowledge avatars:', error);
    res.status(500).json({
      error: 'Failed to fetch knowledge avatars',
      message: error.message
    });
  }
});

router.post('/knowledge-avatars/initialize', async (req, res) => {
  try {
    console.log('🎓 Initializing Knowledge Avatars...');
    await knowledgeAvatarService.initializeKnowledgeAvatars();
    
    res.json({
      success: true,
      message: 'Knowledge avatars initialized successfully'
    });
  } catch (error: any) {
    console.error('Failed to initialize knowledge avatars:', error);
    res.status(500).json({
      error: 'Failed to initialize knowledge avatars',
      message: error.message
    });
  }
});

// Trending content
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    console.log(`🌐 Fetching global trending content from ALL Farcaster users (limit: ${limit})`);
    
    const trending = await farcasterService.getTrendingContent(limit);
    
    res.json({
      success: true,
      items: trending,
      count: trending.length,
      fid: null // Indicates global content, not user-specific
    });
  } catch (error: any) {
    console.error('Failed to fetch trending content:', error);
    res.status(500).json({
      error: 'Failed to fetch trending content',
      message: error.message
    });
  }
});

// Farcaster top accounts  
router.get('/farcaster/top-accounts', async (req, res) => {
  try {
    const accounts = await farcasterTopAccountsService.getTopAccounts();
    res.json(accounts);
  } catch (error: any) {
    console.error('Failed to fetch top accounts:', error);
    res.status(500).json({
      error: 'Failed to fetch top accounts',
      message: error.message
    });
  }
});

// Cross-market signals
router.get('/cross-market/signals', async (req, res) => {
  try {
    const timeframe = req.query.timeframe as string || '7d';
    const signals = await crossMarketSignalService.getUnifiedSignals(timeframe);
    
    res.json({
      success: true,
      signals,
      timeframe,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Failed to fetch cross-market signals:', error);
    res.status(500).json({
      error: 'Failed to fetch cross-market signals',
      message: error.message
    });
  }
});

// Education endpoints
router.get('/education/crypto-leaders', async (req, res) => {
  try {
    const leaders = await educationService.getCryptoLeaderEducation();
    res.json({
      success: true,
      leaders,
      count: Object.keys(leaders).length
    });
  } catch (error: any) {
    console.error('Failed to fetch crypto leader education:', error);
    res.status(500).json({
      error: 'Failed to fetch crypto leader education',
      message: error.message
    });
  }
});

// YouTube content endpoints
router.get('/youtube/crypto-content', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 12;
    
    // For now, return empty array since we don't have YouTube service implemented
    // This prevents errors in the frontend
    res.json({
      success: true,
      videos: [],
      count: 0
    });
  } catch (error: any) {
    console.error('Failed to fetch YouTube content:', error);
    res.status(500).json({
      error: 'Failed to fetch YouTube content',
      message: error.message
    });
  }
});

// Trending topics endpoints  
router.get('/trending-topics', async (req, res) => {
  try {
    // Static trending topics for now
    const topics = [
      { topic: 'Bitcoin ETF', posts: '2.8k', trend: 'up' },
      { topic: 'Ethereum Staking', posts: '1.9k', trend: 'up' },
      { topic: 'L2 Solutions', posts: '1.4k', trend: 'neutral' },
      { topic: 'DeFi Yields', posts: '1.1k', trend: 'down' },
      { topic: 'NFT Market', posts: '892', trend: 'down' }
    ];

    res.json({
      success: true,
      topics,
      count: topics.length
    });
  } catch (error: any) {
    console.error('Failed to fetch trending topics:', error);
    res.status(500).json({
      error: 'Failed to fetch trending topics', 
      message: error.message
    });
  }
});

export default router;