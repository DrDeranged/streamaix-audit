import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { StreamProcessor } from "./services/streamProcessor";
import { StreamProcessorV2 } from "./services/streamProcessorV2";
import RealContentProcessor from "./services/realContentProcessor";
import { AIService } from "./services/aiService";
import { Web3Service } from "./services/web3Service";
import { 
  loginSchema, 
  registerSchema, 
  walletLoginSchema,
  updateUserSchema,
  createSummarySchema,
  updateSummarySchema,
  createBountySchema,
  updateBountySchema,
  createInteractionSchema,
  createKnowledgeStackSchema,
  updateKnowledgeStackSchema,
  paginationSchema,
  searchSchema,
  processContentSchema,
  type LoginRequest,
  type RegisterRequest,
  type WalletLoginRequest
} from "./validators";
import { Request, Response } from "express";
import cors from "cors";

// Helper function to handle validation errors
const validateRequest = <T>(schema: any, data: any): { success: boolean; data?: T; error?: string } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error: any) {
    const errorMessage = error.errors?.[0]?.message || 'Validation failed';
    return { success: false, error: errorMessage };
  }
};

// Helper function to handle async route errors
const asyncHandler = (fn: (req: any, res: Response, next: Function) => Promise<any>) => 
  (req: Request, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => next(err));
  };

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true
  }));

  // =============================================================================
  // AUTH ROUTES
  // =============================================================================

  // Register new user
  app.post('/api/auth/register', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest<RegisterRequest>(registerSchema, req.body);
    if (!validation.success) {
      console.log('Registration validation failed:', validation.error);
      return res.status(400).json({ error: validation.error });
    }

    const { username, password, email, walletAddress, ensName, avatar, bio } = validation.data!;

    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Check if wallet address already exists (if provided)
      if (walletAddress) {
        const existingWalletUser = await storage.getUserByWalletAddress?.(walletAddress);
        if (existingWalletUser) {
          return res.status(400).json({ error: 'Wallet address already registered' });
        }
      }

      // Hash password and create user
      const hashedPassword = await AuthService.hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        walletAddress,
        ensName,
        avatar,
        bio
      });

      // Generate token
      const token = AuthService.generateToken({
        id: user.id,
        username: user.username,
        email: user.email || undefined,
        walletAddress: user.walletAddress || undefined
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          ensName: user.ensName,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.createdAt
        },
        token
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === '23505') {
        if (error.detail?.includes('username')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        if (error.detail?.includes('wallet_address')) {
          return res.status(400).json({ error: 'Wallet address already registered' });
        }
      }
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }));

  // Login with username/password
  app.post('/api/auth/login', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest<LoginRequest>(loginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { username, password } = validation.data!;

    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await AuthService.comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = AuthService.generateToken({
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      walletAddress: user.walletAddress || undefined
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        ensName: user.ensName,
        avatar: user.avatar,
        bio: user.bio
      },
      token
    });
  }));

  // Wallet login (for Web3 authentication)
  app.post('/api/auth/wallet-login', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest<WalletLoginRequest>(walletLoginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { walletAddress, signature, message } = validation.data!;

    // TODO: Implement signature verification for wallet authentication
    // For now, we'll create or find user by wallet address
    let user = await storage.getUserByWalletAddress?.(walletAddress);
    
    if (!user) {
      // Create new user with wallet address - use full address + timestamp for uniqueness
      const timestamp = Date.now().toString().slice(-6);
      const uniqueUsername = `wallet_${walletAddress.slice(-6)}_${timestamp}`;
      
      user = await storage.createUser({
        username: uniqueUsername,
        password: 'wallet_auth_placeholder', // Placeholder for wallet-only accounts
        walletAddress,
      });
    }

    const token = AuthService.generateToken({
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      walletAddress: user.walletAddress || undefined
    });

    res.json({
      message: 'Wallet login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        ensName: user.ensName,
        avatar: user.avatar,
        bio: user.bio
      },
      token
    });
  }));

  // Get current user profile
  app.get('/api/users/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user stats
    const summaries = await storage.getSummariesByUser(req.user!.id);
    const bounties = await storage.getBountiesByUser(req.user!.id);
    const interactions = await storage.getUserInteractions(req.user!.id);
    const stacks = await storage.getKnowledgeStacksByUser(req.user!.id);
    
    const stats = {
      summariesCount: summaries.length,
      bountiesCount: bounties.length,
      interactionsCount: interactions.length,
      stacksCount: stacks.length
    };

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        ensName: user.ensName,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt
      },
      stats
    });
  }));

  // =============================================================================
  // USER ROUTES
  // =============================================================================

  // Update user profile
  app.patch('/api/users/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(updateUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const updates: any = validation.data!;
    if (updates.password) {
      updates.password = await AuthService.hashPassword(updates.password);
    }

    const user = await storage.updateUser(req.user!.id, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        ensName: user.ensName,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  }));

  // Get user by ID (public)
  app.get('/api/users/:id', asyncHandler(async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get public user stats
    const summaries = await storage.getSummariesByUser(req.params.id);
    const bounties = await storage.getBountiesByUser(req.params.id);
    const stacks = await storage.getKnowledgeStacksByUser(req.params.id);
    
    const stats = {
      summariesCount: summaries.filter(s => s.isPublic).length,
      bountiesCount: bounties.length,
      stacksCount: stacks.filter(s => s.isPublic).length
    };

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        ensName: user.ensName,
        createdAt: user.createdAt
      },
      stats
    });
  }));

  // =============================================================================
  // SUMMARY ROUTES
  // =============================================================================

  // Get all summaries (public) - for landing page
  app.get('/api/summaries', asyncHandler(async (req: Request, res: Response) => {
    try {
      const summaries = await storage.getAllSummaries();
      
      // Filter to public summaries with content
      const publicSummaries = summaries
        .filter((s: any) => s.isPublic && s.processingStatus === 'completed')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10); // Limit to most recent 10
      
      res.json(publicSummaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      res.status(500).json({ error: 'Failed to fetch summaries' });
    }
  }));

  // Get trending summaries
  app.get('/api/summaries/trending', asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const summaries = await storage.getTrendingSummaries(limit);

    res.json({ summaries });
  }));

  // Search summaries
  app.get('/api/summaries/search', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(searchSchema, req.query);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { q, limit } = validation.data as { q: string; limit: number };
    const summaries = await storage.searchSummaries(q, limit);

    res.json({ summaries, query: q });
  }));

  // Get summary by ID
  app.get('/api/summaries/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log(`API: Fetching summary ${req.params.id}`);
    const summary = await storage.getSummary(req.params.id);
    if (!summary) {
      console.log(`API: Summary ${req.params.id} not found`);
      return res.status(404).json({ error: 'Summary not found' });
    }

    console.log(`API: Summary ${req.params.id} found - status: ${summary.processingStatus}`);

    // Track view if user is authenticated
    if (req.user) {
      await storage.createUserInteraction({
        userId: req.user.id,
        summaryId: summary.id,
        interactionType: 'view',
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    res.json({ summary });
  }));

  // Create new summary
  app.post('/api/summaries', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createSummarySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const summaryData = { ...validation.data as any, creatorId: req.user!.id };
    const summary = await storage.createSummary(summaryData);

    res.status(201).json({
      message: 'Summary created successfully',
      summary
    });
  }));

  // Update summary
  app.patch('/api/summaries/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingSummary = await storage.getSummary(req.params.id);
    if (!existingSummary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    if (existingSummary.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own summaries' });
    }

    const validation = validateRequest(updateSummarySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const summary = await storage.updateSummary(req.params.id, validation.data as any);
    res.json({
      message: 'Summary updated successfully',
      summary
    });
  }));

  // Delete summary
  app.delete('/api/summaries/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingSummary = await storage.getSummary(req.params.id);
    if (!existingSummary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    if (existingSummary.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only delete your own summaries' });
    }

    const deleted = await storage.deleteSummary(req.params.id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete summary' });
    }

    res.json({ message: 'Summary deleted successfully' });
  }));

  // Get user's summaries
  app.get('/api/users/:id/summaries', asyncHandler(async (req: Request, res: Response) => {
    const summaries = await storage.getSummariesByUser(req.params.id);
    res.json({ summaries });
  }));



  // =============================================================================
  // BOUNTY ROUTES
  // =============================================================================

  // Get all bounties
  app.get('/api/bounties', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(paginationSchema, req.query);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { limit, offset } = validation.data as { limit: number; offset: number };
    const bounties = await storage.getBounties(limit, offset);

    res.json({
      bounties,
      pagination: { limit, offset, count: bounties.length }
    });
  }));

  // Get bounty by ID
  app.get('/api/bounties/:id', asyncHandler(async (req: Request, res: Response) => {
    const bounty = await storage.getBounty(req.params.id);
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    res.json({ bounty });
  }));

  // Create new bounty
  app.post('/api/bounties', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createBountySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const bountyData = { ...validation.data as any, creatorId: req.user!.id };
    const bounty = await storage.createBounty(bountyData);

    res.status(201).json({
      message: 'Bounty created successfully',
      bounty
    });
  }));

  // Update bounty
  app.patch('/api/bounties/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingBounty = await storage.getBounty(req.params.id);
    if (!existingBounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (existingBounty.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own bounties' });
    }

    const validation = validateRequest(updateBountySchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const bounty = await storage.updateBounty(req.params.id, validation.data as any);
    res.json({
      message: 'Bounty updated successfully',
      bounty
    });
  }));

  // Get user's bounties
  app.get('/api/users/:id/bounties', asyncHandler(async (req: Request, res: Response) => {
    const bounties = await storage.getBountiesByUser(req.params.id);
    res.json({ bounties });
  }));

  // =============================================================================
  // INTERACTION ROUTES
  // =============================================================================

  // Create user interaction (like, bookmark, share)
  app.post('/api/interactions', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createInteractionSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const interactionData = { ...validation.data as any, userId: req.user!.id };
    const interaction = await storage.createUserInteraction(interactionData);

    res.status(201).json({
      message: 'Interaction recorded successfully',
      interaction
    });
  }));

  // Remove user interaction
  app.delete('/api/interactions/:summaryId/:type', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { summaryId, type } = req.params;
    const deleted = await storage.deleteUserInteraction(req.user!.id, summaryId, type);

    if (!deleted) {
      return res.status(404).json({ error: 'Interaction not found' });
    }

    res.json({ message: 'Interaction removed successfully' });
  }));

  // Get user's interactions
  app.get('/api/users/me/interactions', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const summaryId = req.query.summaryId as string;
    const interactions = await storage.getUserInteractions(req.user!.id, summaryId);

    res.json({ interactions });
  }));

  // =============================================================================
  // KNOWLEDGE STACK ROUTES
  // =============================================================================

  // Get all knowledge stacks
  app.get('/api/stacks', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(paginationSchema, req.query);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { limit, offset } = validation.data as { limit: number; offset: number };
    const stacks = await storage.getKnowledgeStacks(limit, offset);

    res.json({
      stacks,
      pagination: { limit, offset, count: stacks.length }
    });
  }));

  // Get knowledge stack by ID
  app.get('/api/stacks/:id', asyncHandler(async (req: Request, res: Response) => {
    const stack = await storage.getKnowledgeStack(req.params.id);
    if (!stack) {
      return res.status(404).json({ error: 'Knowledge stack not found' });
    }

    res.json({ stack });
  }));

  // Create new knowledge stack
  app.post('/api/stacks', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createKnowledgeStackSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const stackData = { ...validation.data as any, creatorId: req.user!.id };
    const stack = await storage.createKnowledgeStack(stackData);

    res.status(201).json({
      message: 'Knowledge stack created successfully',
      stack
    });
  }));

  // Update knowledge stack
  app.patch('/api/stacks/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingStack = await storage.getKnowledgeStack(req.params.id);
    if (!existingStack) {
      return res.status(404).json({ error: 'Knowledge stack not found' });
    }

    if (existingStack.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own knowledge stacks' });
    }

    const validation = validateRequest(updateKnowledgeStackSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const stack = await storage.updateKnowledgeStack(req.params.id, validation.data as any);
    res.json({
      message: 'Knowledge stack updated successfully',
      stack
    });
  }));

  // Get user's knowledge stacks
  app.get('/api/users/:id/stacks', asyncHandler(async (req: Request, res: Response) => {
    const stacks = await storage.getKnowledgeStacksByUser(req.params.id);
    res.json({ stacks });
  }));

  // =============================================================================
  // STREAM PROCESSING ROUTES
  // =============================================================================

  // Start processing a summary
  app.post('/api/summaries/:id/process', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const summaryId = req.params.id;
    const summary = await storage.getSummary(summaryId);
    
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    
    if (summary.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized - not your summary' });
    }
    
    if (summary.processingStatus === 'processing') {
      return res.status(400).json({ error: 'Summary is already being processed' });
    }
    
    if (summary.processingStatus === 'completed') {
      return res.status(400).json({ error: 'Summary has already been processed' });
    }
    
    // Start processing in background
    const jobId = await StreamProcessor.queueProcessing(summaryId, summary.originalUrl, {
      contentType: summary.contentType as any,
      platform: summary.platform,
      title: summary.title,
    });
    
    res.json({
      message: 'Processing started',
      summaryId,
      jobId,
      status: 'processing'
    });
  }));

  // Get processing status
  app.get('/api/summaries/:id/status', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const summaryId = req.params.id;
    const summary = await storage.getSummary(summaryId);
    
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    
    if (summary.creatorId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized - not your summary' });
    }
    
    const jobs = StreamProcessor.getJobsForSummary(summaryId);
    const latestJob = jobs.length > 0 ? jobs[jobs.length - 1] : null;
    
    res.json({
      summaryId,
      status: summary.processingStatus,
      job: latestJob ? {
        id: latestJob.id,
        status: latestJob.status,
        progress: latestJob.progress,
        error: latestJob.error,
        startedAt: latestJob.startedAt,
        completedAt: latestJob.completedAt
      } : null
    });
  }));

  // Process content from URL directly
  app.post('/api/process-content', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(processContentSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { url, contentType, platform, title, isPublic, tags } = validation.data as any;

    // Create summary entry
    const summary = await storage.createSummary({
      title: title || 'Untitled Content',
      originalUrl: url,
      contentType,
      platform,
      tags: tags || [],
      creatorId: req.user!.id,
      isPublic: isPublic ?? true,
      processingStatus: 'pending'
    });

    // Start processing
    const jobId = await StreamProcessor.queueProcessing(summary.id, url, {
      contentType,
      platform,
      title
    });

    res.status(201).json({
      message: 'Content processing started',
      summary: {
        id: summary.id,
        title: summary.title,
        originalUrl: summary.originalUrl,
        contentType: summary.contentType,
        platform: summary.platform,
        processingStatus: summary.processingStatus
      },
      jobId
    });
  }));

  // =============================================================================
  // WEB3 & SOCIAL ROUTES
  // =============================================================================

  // Get wallet authentication nonce
  app.post('/api/web3/nonce', asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    
    if (!walletAddress || !Web3Service.isValidAddress(walletAddress)) {
      return res.status(400).json({ error: 'Valid wallet address required' });
    }

    const nonce = Web3Service.generateNonce();
    const message = Web3Service.generateAuthMessage(walletAddress, nonce);

    res.json({ 
      nonce, 
      message,
      walletAddress 
    });
  }));

  // Share summary to social platforms
  app.post('/api/summaries/:id/share', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const summaryId = req.params.id;
    const { platform, message } = req.body;

    const summary = await storage.getSummary(summaryId);
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    const shareContent = {
      title: summary.title,
      summary: summary.summary || 'AI-generated summary available on StreamAiX',
      url: `https://streamaix.com/summaries/${summaryId}`,
      tags: summary.tags || []
    };

    let result;
    switch (platform) {
      case 'lens':
        result = await Web3Service.shareToLens(shareContent);
        break;
      case 'farcaster':
        result = await Web3Service.shareToFarcaster(shareContent);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    // Record share interaction
    await storage.createUserInteraction({
      userId: req.user!.id,
      summaryId,
      interactionType: 'share',
      metadata: { platform, result }
    });

    res.json({
      message: 'Content shared successfully',
      platform,
      result
    });
  }));

  // Get user recommendations
  app.get('/api/recommendations', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const recentSummaries = await storage.getSummariesByUser(req.user!.id);
    const interactions = await storage.getUserInteractions(req.user!.id);
    
    // Extract user interests from interactions and summaries
    const userTags = new Set<string>();
    recentSummaries.forEach(s => s.tags?.forEach(tag => userTags.add(tag)));
    
    const recommendations = await AIService.generateRecommendations(
      req.user!.id,
      Array.from(userTags),
      recentSummaries.slice(0, 5)
    );

    res.json(recommendations);
  }));

  // =============================================================================
  // WALLET & REWARDS ROUTES
  // =============================================================================

  // Mock wallet endpoints for demo
  app.get('/api/wallet/balance', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const balance = {
      streamTokens: 1247.85 + Math.random() * 100,
      usdValue: 3743.55 + Math.random() * 300,
      change24h: (Math.random() - 0.5) * 20,
      totalEarned: 2890.40,
      totalSpent: 1642.55,
      pendingRewards: 156.90,
    };
    
    res.json({ balance });
  }));

  app.get('/api/wallet/transactions', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const transactions = [
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'reward',
        amount: 45.60,
        description: 'Summary accuracy reward - "Web3 Fundamentals Explained"',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'bounty_payment',
        amount: -100.00,
        description: 'Bounty created - "AI Ethics Discussion Analysis"',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
      },
    ];
    
    res.json({ transactions });
  }));

  // =============================================================================
  // ADMIN ROUTES (Protected)
  // =============================================================================

  // Admin middleware (for future use)
  const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
    // TODO: Implement admin role checking
    // For now, just check if user exists
    if (!req.user) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  // Get all data for admin dashboard
  app.get('/api/admin/stats', authenticateToken, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get basic counts for admin dashboard
    const [summaries, bounties, stacks] = await Promise.all([
      storage.getSummaries(5),
      storage.getBounties(5),
      storage.getKnowledgeStacks(5)
    ]);

    res.json({
      stats: {
        summariesCount: summaries.length,
        bountiesCount: bounties.length,
        stacksCount: stacks.length
      },
      recentSummaries: summaries,
      recentBounties: bounties,
      recentStacks: stacks
    });
  }));

  // Error handling middleware
  app.use((error: any, req: Request, res: Response, next: Function) => {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });

  // =============================================================================
  // REAL PROCESSING ENDPOINTS
  // =============================================================================

  // Test real processing endpoint
  app.post('/api/test-processing', asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required for processing' });
    }

    try {
      console.log(`Starting REAL content processing for URL: ${url}`);
      
      // Use a fixed existing user ID from database
      const demoUserId = 'b57e2c1e-c053-4bff-8bff-d3cee93a3f0a';

      // Start real processing with RealContentProcessor
      console.log('🚀 Starting processing with RealContentProcessor');
      const processor = RealContentProcessor.getInstance();
      const summaryId = await processor.startProcessing(url, demoUserId);

      res.status(201).json({
        message: 'REAL AI processing started successfully',
        summaryId,
        jobId: `job-${Date.now()}`, // Compatibility with frontend
        summary: { id: summaryId }, // Frontend expects this format
        statusUrl: `/api/processing-result/${summaryId}`,
        debugUrl: `/api/summaries/${summaryId}`,
        instructions: 'Check the processing result endpoint for real-time updates'
      });
    } catch (error) {
      console.error('Real processing failed to start:', error);
      res.status(500).json({ 
        error: 'Failed to start real processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Debug endpoint to check processing status and detect issues
  app.get('/api/debug/summary/:id', asyncHandler(async (req: Request, res: Response) => {
    const summary = await storage.getSummary(req.params.id);
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    // Get processing job status from V2 processor
    let processingInfo = 'No active processing info available';
    try {
      processingInfo = StreamProcessorV2.getQueueStatus();
    } catch (e) {
      processingInfo = 'Unable to retrieve processing status';
    }
    
    res.json({
      summary: {
        id: summary.id,
        processingStatus: summary.processingStatus,
        title: summary.title,
        hasContent: !!summary.summary,
        hasTags: summary.tags?.length || 0,
        hasTranscript: !!summary.transcript,
        hasKeyInsights: Array.isArray(summary.keyInsights) ? summary.keyInsights.length : 0,
        hasChapters: Array.isArray(summary.chapters) ? summary.chapters.length : 0,
        accuracy: summary.accuracy,
        ipfsHash: summary.ipfsHash,
        arweaveId: summary.arweaveId,
        contentLength: summary.summary?.length || 0,
        transcriptLength: summary.transcript?.length || 0
      },
      processingInfo,
      timestamp: new Date().toISOString(),
      recommendation: summary.processingStatus === 'processing' ? 
        'Check if backend processing completed but status update failed' : 
        'Status appears correct'
    });
  }));

  // Get job status endpoint (V2)
  app.get('/api/jobs/:id', asyncHandler(async (req: Request, res: Response) => {
    const job = StreamProcessorV2.getJobStatus(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  }));

  // Get processing result endpoint (Real Processor)
  app.get('/api/processing-result/:summaryId', asyncHandler(async (req: Request, res: Response) => {
    const processor = RealContentProcessor.getInstance();
    const result = await processor.getProcessingResult(req.params.summaryId);
    res.json(result);
  }));

  const httpServer = createServer(app);
  return httpServer;
}
