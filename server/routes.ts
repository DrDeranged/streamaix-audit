import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { StreamProcessor } from "./services/streamProcessor";
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
      return res.status(400).json({ error: validation.error });
    }

    const { username, password, email, walletAddress, ensName, avatar, bio } = validation.data!;

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
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
      // Create new user with wallet address
      user = await storage.createUser({
        username: `user_${walletAddress.slice(-8)}`,
        password: 'wallet_auth', // Placeholder for wallet-only accounts
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
  app.get('/api/auth/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await storage.getUserStats(user.id);

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

    const stats = await storage.getUserStats(user.id);

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

  // Get all summaries (public)
  app.get('/api/summaries', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest(paginationSchema, req.query);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { limit, offset } = validation.data as { limit: number; offset: number };
    const summaries = await storage.getSummaries(limit, offset);

    res.json({
      summaries,
      pagination: { limit, offset, count: summaries.length }
    });
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
    const summary = await storage.getSummary(req.params.id);
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

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
    const processor = StreamProcessor.getInstance();
    const content = {
      url: summary.originalUrl,
      title: summary.title,
      contentType: summary.contentType as any,
      platform: summary.platform,
    };
    
    // Don't await - let it process in background
    processor.processStream(summaryId, content).catch(error => {
      console.error(`Background processing failed for summary ${summaryId}:`, error);
    });
    
    res.json({
      message: 'Processing started',
      summaryId,
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
    
    const processor = StreamProcessor.getInstance();
    const stages = processor.getProcessingStatus(summaryId);
    const isProcessing = processor.isProcessing(summaryId);
    
    res.json({
      summaryId,
      status: summary.processingStatus,
      isProcessing,
      stages,
      currentStage: stages.length > 0 ? stages[stages.length - 1] : null
    });
  }));

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

  const httpServer = createServer(app);
  return httpServer;
}
