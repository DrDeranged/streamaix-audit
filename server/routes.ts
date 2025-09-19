import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { StreamProcessor } from "./services/streamProcessor";
import { StreamProcessorV2 } from "./services/streamProcessorV2";
import RebuiltContentProcessor from "./services/rebuiltContentProcessor";
import { AIService } from "./services/aiService";
import { Web3Service } from "./services/web3Service";
import { MarketDataService } from "./services/marketDataService";
import { youtubeService } from "./services/youtubeService";
import passport from "passport";

// Initialize services
const marketDataService = MarketDataService.getInstance();
import session from "express-session";
import { 
  loginSchema, 
  registerSchema, 
  walletLoginSchema,
  twitterAuthSchema,
  updateUserSchema,
  createSummarySchema,
  updateSummarySchema,
  createBountySchema,
  updateBountySchema,
  createInteractionSchema,
  createKnowledgeStackSchema,
  updateKnowledgeStackSchema,
  createUserNoteSchema,
  updateUserNoteSchema,
  paginationSchema,
  searchSchema,
  recentActivitySchema,
  processContentSchema,
  type LoginRequest,
  type RegisterRequest,
  type WalletLoginRequest,
  type TwitterAuthRequest,
  type RecentActivityRequest
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

  // Configure session for passport
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup Twitter OAuth (optional)
  const twitterEnabled = AuthService.setupTwitterAuth();

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

  // Twitter OAuth routes (only if enabled)
  if (twitterEnabled) {
    app.get('/api/auth/twitter', (req: Request, res: Response, next: Function) => {
      passport.authenticate('twitter', {
        scope: ['email']
      })(req, res, next);
    });

    app.get('/api/auth/twitter/callback', 
      passport.authenticate('twitter', { 
        failureRedirect: '/auth?error=twitter',
        session: true
      }),
      async (req: Request, res: Response) => {
        try {
          const user = req.user as any;
          if (!user) {
            return res.redirect('/auth?error=twitter-failed');
          }

          // Generate JWT token for the Twitter user
          const token = AuthService.generateToken({
            id: user.id,
            username: user.username,
            email: user.email || undefined,
            authProvider: 'twitter'
          });

          // Redirect to frontend with token in URL parameters
          // Frontend will extract token and store it
          res.redirect(`/auth-success?token=${token}`);
        } catch (error) {
          console.error('Twitter callback error:', error);
          res.redirect('/auth?error=twitter-callback');
        }
      }
    );

    // Handle manual OAuth PIN verification for desktop apps
    app.post('/api/auth/twitter/verify', asyncHandler(async (req: Request, res: Response) => {
      const { oauth_token, oauth_verifier } = req.body;
      
      if (!oauth_token || !oauth_verifier) {
        return res.status(400).json({ error: 'Missing OAuth token or verifier' });
      }

      // This would require additional implementation for desktop app flow
      res.status(501).json({ 
        error: 'Desktop app flow not fully implemented. Please configure your Twitter app as a Web App.' 
      });
    }));
  } else {
    // Fallback routes when Twitter OAuth is not configured
    app.get('/api/auth/twitter', (req: Request, res: Response) => {
      res.status(503).json({ error: 'Twitter OAuth is not configured' });
    });
    
    app.get('/api/auth/twitter/callback', (req: Request, res: Response) => {
      res.redirect('/auth?error=twitter-not-configured');
    });
  }

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
    
    // Use the exact same method as processing-result endpoint for consistency
    const processor = RebuiltContentProcessor.getInstance();
    const transformedSummary = await processor.getProcessingResult(req.params.id);
    
    if (!transformedSummary) {
      console.log(`API: Summary ${req.params.id} not found`);
      return res.status(404).json({ error: 'Summary not found' });
    }

    console.log(`API: Summary ${req.params.id} found - status: ${transformedSummary.processingStatus}`);

    // Track view if user is authenticated
    if (req.user) {
      await storage.createUserInteraction({
        userId: req.user.id,
        summaryId: req.params.id,
        interactionType: 'view',
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    res.json({ summary: transformedSummary });
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
    
    // Parse marketAnalysis JSON for each summary to include comprehensive data
    const enrichedSummaries = summaries.map(summary => {
      let marketData = {};
      try {
        if (summary.marketAnalysis) {
          marketData = JSON.parse(summary.marketAnalysis);
        }
      } catch (e) {
        console.log('Could not parse market analysis data for summary:', summary.id);
      }
      
      return {
        ...summary,
        ...marketData, // Spread the parsed fields (bulletPoints, trends, financialTrends, etc.)
        executiveSummary: summary.blogPost || summary.summary
      };
    });
    
    res.json({ summaries: enrichedSummaries });
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
  // USER NOTES ROUTES
  // =============================================================================

  // Get user's notes (optionally filtered by summary)
  app.get('/api/notes', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { summaryId } = req.query;
    const notes = await storage.getUserNotes(req.user!.id, summaryId as string);
    res.json({ notes });
  }));

  // Get notes for a specific summary (public notes only)
  app.get('/api/summaries/:summaryId/notes', asyncHandler(async (req: Request, res: Response) => {
    const notes = await storage.getUserNotesBySummary(req.params.summaryId);
    // Filter to only public notes
    const publicNotes = notes.filter(note => !note.isPrivate);
    res.json({ notes: publicNotes });
  }));

  // Get specific note by ID
  app.get('/api/notes/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const note = await storage.getUserNote(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user owns the note or if it's public
    if (note.userId !== req.user!.id && note.isPrivate) {
      return res.status(403).json({ error: 'Access denied - private note' });
    }

    res.json({ note });
  }));

  // Create new user note
  app.post('/api/notes', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const validation = validateRequest(createUserNoteSchema, {
      ...req.body,
      userId: req.user!.id
    });
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    // Verify the summary exists (skip for journal entries)
    const validatedData = validation.data as any;
    const isJournalEntry = validatedData.summaryId.startsWith('journal-');
    
    if (!isJournalEntry) {
      const summary = await storage.getSummary(validatedData.summaryId);
      if (!summary) {
        return res.status(404).json({ error: 'Summary not found' });
      }
    }

    const note = await storage.createUserNote(validation.data as any);
    res.status(201).json({
      message: 'Note created successfully',
      note
    });
  }));

  // Update user note
  app.patch('/api/notes/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingNote = await storage.getUserNote(req.params.id);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (existingNote.userId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only edit your own notes' });
    }

    const validation = validateRequest(updateUserNoteSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const note = await storage.updateUserNote(req.params.id, validation.data as any);
    res.json({
      message: 'Note updated successfully',
      note
    });
  }));

  // Delete user note
  app.delete('/api/notes/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingNote = await storage.getUserNote(req.params.id);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (existingNote.userId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only delete your own notes' });
    }

    const deleted = await storage.deleteUserNote(req.params.id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete note' });
    }

    res.json({ message: 'Note deleted successfully' });
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

    try {
      console.log(`Starting AI content analysis for URL: ${url}`);
      
      // Use RebuiltContentProcessor for faster processing
      console.log('🚀 Starting processing with RebuiltContentProcessor');
      const processor = RebuiltContentProcessor.getInstance();
      const result = await processor.processContent(url, req.user!.id);
      const summaryId = result.summaryId;

      res.status(201).json({
        message: 'Content processing started successfully',
        summary: { 
          id: summaryId,
          title: title || 'Processing...',
          originalUrl: url,
          contentType,
          platform,
          processingStatus: 'processing'
        },
        jobId: `job-${Date.now()}`, // Compatibility with frontend
        statusUrl: `/api/processing-result/${summaryId}`
      });
    } catch (error) {
      console.error('Content processing failed to start:', error);
      res.status(500).json({ 
        error: 'Failed to start content processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
        try {
          // Use real Farcaster service instead of mock
          const { farcasterService } = await import('./services/farcaster');
          const castResponse = await farcasterService.createCast({
            title: shareContent.title,
            summary: shareContent.summary,
            originalUrl: summary.originalUrl,
            summaryUrl: shareContent.url,
            tags: shareContent.tags
          });
          result = {
            success: true,
            castHash: castResponse.cast.hash,
            castUrl: `https://warpcast.com/${castResponse.cast.author.username}/${castResponse.cast.hash.substring(0, 10)}`
          };
        } catch (error) {
          console.error('Farcaster sharing error:', error);
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to share to Farcaster'
          };
        }
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
  // FARCASTER ACTIVITY ROUTES
  // =============================================================================

  // Get user's Farcaster activity analytics
  app.get('/api/farcaster/activity/:fid', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const fid = parseInt(req.params.fid);
    
    if (!fid || isNaN(fid)) {
      return res.status(400).json({ error: 'Valid Farcaster ID (fid) required' });
    }

    try {
      const { farcasterService } = await import('./services/farcaster');
      const analytics = await farcasterService.getUserActivityAnalytics(fid);
      
      res.json({
        success: true,
        activity: analytics
      });
    } catch (error) {
      console.error('Failed to fetch Farcaster activity:', error);
      res.status(500).json({ 
        error: 'Failed to fetch Farcaster activity',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get user's recent casts
  app.get('/api/farcaster/casts/:fid', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const fid = parseInt(req.params.fid);
    const limit = parseInt(req.query.limit as string) || 25;
    
    if (!fid || isNaN(fid)) {
      return res.status(400).json({ error: 'Valid Farcaster ID (fid) required' });
    }

    try {
      const { farcasterService } = await import('./services/farcaster');
      const casts = await farcasterService.getUserCasts(fid, limit);
      
      res.json({
        success: true,
        casts: casts,
        count: casts.length
      });
    } catch (error) {
      console.error('Failed to fetch user casts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user casts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get user profile information
  app.get('/api/farcaster/profile/:fid', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const fid = parseInt(req.params.fid);
    
    if (!fid || isNaN(fid)) {
      return res.status(400).json({ error: 'Valid Farcaster ID (fid) required' });
    }

    try {
      const { farcasterService } = await import('./services/farcaster');
      const profile = await farcasterService.getUserProfile(fid);
      
      res.json({
        success: true,
        profile: profile
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get trending content from Farcaster with recent activity filtering
  app.get('/api/farcaster/trending', asyncHandler(async (req: Request, res: Response) => {
    const validation = validateRequest<RecentActivityRequest>(recentActivitySchema, req.query);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { since, order, limit } = validation.data!;
    
    try {
      const { farcasterService } = await import('./services/farcaster');
      const trending = await farcasterService.getTrendingContent(limit, { since, order });
      
      res.json({
        success: true,
        trending: trending,
        count: trending.length,
        filters: { since, order, limit }
      });
    } catch (error) {
      console.error('Failed to fetch trending content:', error);
      res.status(500).json({ 
        error: 'Failed to fetch trending content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Test Neynar API endpoints to see which ones work
  app.get('/api/farcaster/test-endpoints', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { farcasterService } = await import('./services/farcaster');
      const testResults = await farcasterService.testApiEndpoints();
      
      res.json({
        success: true,
        testResults: testResults
      });
    } catch (error) {
      console.error('Failed to test Farcaster endpoints:', error);
      res.status(500).json({ 
        error: 'Failed to test Farcaster endpoints',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get prominent crypto users from Farcaster
  app.get('/api/farcaster/prominent-users', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { farcasterService } = await import('./services/farcaster');
      const prominentUsers = await farcasterService.getProminentCryptoUsers();
      
      res.json({
        success: true,
        users: prominentUsers,
        count: prominentUsers.length,
        message: 'Prominent crypto users fetched successfully'
      });
    } catch (error) {
      console.error('Failed to fetch prominent crypto users:', error);
      res.status(500).json({ 
        error: 'Failed to fetch prominent crypto users',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // =============================================================================
  // TRENDING CRYPTO CONTENT ROUTES
  // =============================================================================

  // Get trending casts from top crypto accounts
  app.get('/api/trending', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const fid = req.query.fid ? parseInt(req.query.fid as string) : undefined;
    
    try {
      const { farcasterService } = await import('./services/farcaster.js');
      const { getTopFids } = await import('./services/farcasterTopAccounts.js');
      
      let trendingCasts;
      if (fid) {
        // Get casts from specific account
        trendingCasts = await farcasterService.fetchUserRecent(fid, limit);
      } else {
        // Get trending from all top accounts
        const topFids = getTopFids(10);
        trendingCasts = await farcasterService.aggregateTrendingFromFids(topFids, limit);
      }
      
      res.json({
        success: true,
        items: trendingCasts,
        count: trendingCasts.length,
        fid: fid || null
      });
    } catch (error) {
      console.error('Failed to fetch trending content:', error);
      res.status(500).json({ 
        error: 'Failed to fetch trending content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get top crypto accounts with their highlight casts
  app.get('/api/top-accounts', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;
    
    try {
      const { farcasterService } = await import('./services/farcaster.js');
      const accountsWithHighlights = await farcasterService.getTopAccountsWithHighlights(limit);
      
      res.json({
        success: true,
        accounts: accountsWithHighlights,
        count: accountsWithHighlights.length
      });
    } catch (error) {
      console.error('Failed to fetch top accounts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch top accounts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Get conversation thread for a cast
  app.get('/api/threads/:hash', asyncHandler(async (req: Request, res: Response) => {
    const { hash } = req.params;
    const depth = parseInt(req.query.depth as string) || 2;
    
    if (!hash) {
      return res.status(400).json({ error: 'Cast hash required' });
    }
    
    try {
      const { farcasterService } = await import('./services/farcaster.js');
      const thread = await farcasterService.fetchCastThread(hash, depth);
      
      res.json({
        success: true,
        root: thread.root,
        replies: thread.replies,
        count: thread.replies.length
      });
    } catch (error) {
      console.error(`Failed to fetch thread for cast ${hash}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch thread',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // =============================================================================
  // YOUTUBE CONTENT ROUTES
  // =============================================================================

  // Get latest crypto podcast content from YouTube
  app.get('/api/youtube/crypto-content', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    
    try {
      const videos = await youtubeService.getLatestCryptoContent(limit);
      
      res.json({
        success: true,
        videos,
        count: videos.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch YouTube crypto content:', error);
      res.status(500).json({ 
        error: 'Failed to fetch crypto content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Search crypto videos on YouTube
  app.get('/api/youtube/search', asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    try {
      const videos = await youtubeService.searchCryptoVideos(query, limit);
      
      res.json({
        success: true,
        videos,
        count: videos.length,
        query
      });
    } catch (error) {
      console.error('Failed to search YouTube videos:', error);
      res.status(500).json({ 
        error: 'Failed to search videos',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // =============================================================================
  // WALLET & REWARDS ROUTES
  // =============================================================================

  // Real wallet balance endpoint 
  app.get('/api/wallet/balance', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    // TODO: Implement real wallet integration
    // For now, return zeros instead of fake data
    const balance = {
      streamTokens: 0,
      usdValue: 0,
      change24h: 0,
      totalEarned: 0,
      totalSpent: 0,
      pendingRewards: 0,
    };
    
    res.json({ balance });
  }));

  app.get('/api/wallet/transactions', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    // TODO: Implement real transaction history from database
    // Return empty array instead of fake transactions
    const transactions: any[] = [];
    
    res.json({ transactions });
  }));

  // =============================================================================
  // MARKET DATA ROUTES 
  // =============================================================================

  // Get live crypto prices (CoinGecko + CoinMarketCap)
  app.get('/api/market/crypto/:symbols', asyncHandler(async (req: Request, res: Response) => {
    const symbols = req.params.symbols.split(',');
    const marketData = MarketDataService.getInstance();
    
    try {
      const quotes = await marketData.getCryptoQuotes(symbols);
      res.json({ quotes, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error('Market data error:', error);
      res.json({ quotes: [], error: 'Market data unavailable', timestamp: new Date().toISOString() });
    }
  }));

  // Get crypto-related stocks
  app.get('/api/market/stocks/crypto', asyncHandler(async (req: Request, res: Response) => {
    const marketData = MarketDataService.getInstance();
    
    try {
      const stocks = await marketData.getCryptoStocks();
      res.json({ 
        stocks, 
        count: stocks.length,
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('Crypto stocks error:', error);
      res.json({ 
        stocks: [], 
        error: 'Stock data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // Get financial news from CoinDesk
  app.get('/api/market/news', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const marketData = MarketDataService.getInstance();
    
    try {
      const articles = await marketData.getFinancialNews(limit);
      res.json({ 
        articles, 
        count: articles.length,
        source: 'CoinDesk',
        timestamp: new Date().toISOString() 
      });
    } catch (error: any) {
      console.error('News data error:', error);
      res.json({ 
        articles: [], 
        error: 'News data unavailable', 
        timestamp: new Date().toISOString() 
      });
    }
  }));

  // =============================================================================
  // SOCIAL ACTION ROUTES (Protected)
  // =============================================================================

  // Follow user
  app.post('/api/social/follow', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fid, username } = req.body;
    
    if (!fid || !username) {
      return res.status(400).json({ error: 'FID and username are required' });
    }
    
    try {
      // For now, simulate successful follow - in real implementation would use Farcaster API
      console.log(`User ${req.user!.username} following ${username} (FID: ${fid})`);
      
      // Simulate follow action
      res.json({
        success: true,
        message: `Successfully followed @${username}`,
        action: 'follow',
        targetUser: { fid, username },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Follow error:', error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  }));

  // Like cast
  app.post('/api/social/like', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { castHash } = req.body;
    
    if (!castHash) {
      return res.status(400).json({ error: 'Cast hash is required' });
    }
    
    try {
      // For now, simulate successful like - in real implementation would use Farcaster API
      console.log(`User ${req.user!.username} liking cast ${castHash}`);
      
      res.json({
        success: true,
        message: 'Successfully liked cast',
        action: 'like',
        castHash,
        newLikeCount: Math.floor(Math.random() * 100) + 50, // Simulate optimistic count
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Like error:', error);
      res.status(500).json({ error: 'Failed to like cast' });
    }
  }));

  // Recast
  app.post('/api/social/recast', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { castHash } = req.body;
    
    if (!castHash) {
      return res.status(400).json({ error: 'Cast hash is required' });
    }
    
    try {
      console.log(`User ${req.user!.username} recasting ${castHash}`);
      
      res.json({
        success: true,
        message: 'Successfully recasted',
        action: 'recast',
        castHash,
        newRecastCount: Math.floor(Math.random() * 50) + 20, // Simulate optimistic count
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Recast error:', error);
      res.status(500).json({ error: 'Failed to recast' });
    }
  }));

  // Reply to cast
  app.post('/api/social/reply', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { castHash, replyText } = req.body;
    
    if (!castHash || !replyText) {
      return res.status(400).json({ error: 'Cast hash and reply text are required' });
    }
    
    if (replyText.length > 320) {
      return res.status(400).json({ error: 'Reply text too long (max 320 characters)' });
    }
    
    try {
      console.log(`User ${req.user!.username} replying to cast ${castHash}: ${replyText.substring(0, 50)}...`);
      
      res.json({
        success: true,
        message: 'Reply posted successfully',
        action: 'reply',
        castHash,
        replyText,
        newReplyCount: Math.floor(Math.random() * 30) + 10, // Simulate optimistic count
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Reply error:', error);
      res.status(500).json({ error: 'Failed to post reply' });
    }
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
  app.post('/api/analyze-content', asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required for processing' });
    }

    try {
      console.log(`Starting AI content analysis for URL: ${url}`);
      
      // Get current user ID from session/request
      // For now, use a consistent demo user until auth is fully implemented
      let userId = 'b57e2c1e-c053-4bff-8bff-d3cee93a3f0a'; // Default demo user
      
      // Try to get actual user from query param or use the main demo user we see in logs
      if (req.query.userId) {
        userId = req.query.userId as string;
      } else {
        // Use the actual user ID we see in the dashboard logs
        userId = '22e98fd8-e107-4f6d-bc84-e99f5b4c73e9';
      }

      console.log(`📝 Processing content for user: ${userId}`);

      // Start real processing with RealContentProcessor
      console.log('🚀 Starting processing with RealContentProcessor');
      const processor = RebuiltContentProcessor.getInstance();
      const result = await processor.processContent(url, userId);
      const summaryId = result.summaryId;

      res.status(201).json({
        message: 'AI content analysis started successfully',
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

  // Get processing result endpoint (Rebuilt Processor)
  app.get('/api/processing-result/:summaryId', asyncHandler(async (req: Request, res: Response) => {
    // Set headers to prevent caching for real-time updates
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const processor = RebuiltContentProcessor.getInstance();
    const result = await processor.getProcessingResult(req.params.summaryId);
    res.json(result);
  }));

  // =============================================================================
  // MARKET DATA API ROUTES
  // =============================================================================

  // Get live cryptocurrency quotes
  app.get('/api/market/crypto/quotes', asyncHandler(async (req: Request, res: Response) => {
    const symbols = req.query.symbols as string;
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }

    const symbolArray = symbols.split(',').map(s => s.trim());
    const quotes = await marketDataService.getCryptoQuotes(symbolArray);
    res.json({ quotes });
  }));

  // Get cryptocurrency information
  app.get('/api/market/crypto/info/:symbol', asyncHandler(async (req: Request, res: Response) => {
    const symbol = req.params.symbol;
    const info = await marketDataService.getCryptoInfo(symbol);
    res.json({ info });
  }));

  // Get top cryptocurrencies
  app.get('/api/market/crypto/top', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const cryptos = await marketDataService.getTopCryptos(limit);
    res.json({ cryptos });
  }));

  // Get crypto market stats for dashboard
  app.get('/api/crypto-stats', asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await marketDataService.getCryptoStats();
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to fetch crypto stats:', error);
      res.status(502).json({ 
        success: false, 
        error: 'Market data temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Enhance financial trends with live market data
  app.post('/api/market/enhance-trends', asyncHandler(async (req: Request, res: Response) => {
    const { trends } = req.body;
    if (!trends || !Array.isArray(trends)) {
      return res.status(400).json({ error: 'Trends array is required' });
    }

    const enhancedTrends = await marketDataService.enhanceFinancialTrends(trends);
    res.json({ enhancedTrends });
  }));

  // =============================================================================
  // DISCOVER PAGE API ROUTES (Phase 1)
  // =============================================================================

  // Get market overview for discover page
  app.get('/api/market/overview', asyncHandler(async (req: Request, res: Response) => {
    const timeFilter = req.query.timeFilter as string || '24h';
    const marketData = MarketDataService.getInstance();
    
    try {
      // Get top crypto movers
      const [cryptoQuotes, stocks] = await Promise.all([
        marketData.getTopCryptos(20),
        marketData.getCryptoStocks()
      ]);
      
      // Calculate market movers based on percentage change
      const movers = [
        ...cryptoQuotes.map(crypto => ({
          symbol: crypto.symbol,
          name: crypto.name,
          price: crypto.price,
          change24h: crypto.percentChange24h,
          changePercent: crypto.percentChange24h,
          volume: crypto.volume24h,
          marketCap: crypto.marketCap,
          category: 'crypto' as const,
          momentum: crypto.percentChange24h > 2 ? 'bullish' as const : 
                   crypto.percentChange24h < -2 ? 'bearish' as const : 'neutral' as const
        })),
        ...stocks.slice(0, 10).map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change24h: stock.percentChange24h || 0,
          changePercent: stock.percentChange24h || 0,
          volume: stock.volume || 0,
          marketCap: stock.marketCap,
          category: 'stock' as const,
          momentum: (stock.percentChange24h || 0) > 2 ? 'bullish' as const : 
                   (stock.percentChange24h || 0) < -2 ? 'bearish' as const : 'neutral' as const
        }))
      ]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 12);

      res.json({
        movers,
        timestamp: new Date().toISOString(),
        timeFilter
      });
    } catch (error: any) {
      console.error('Failed to fetch market overview:', error);
      res.status(500).json({ 
        error: 'Failed to fetch market overview',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get trending stories for discover page
  app.get('/api/discover/trending', asyncHandler(async (req: Request, res: Response) => {
    const timeFilter = req.query.timeFilter as string || '24h';
    const storyFilter = req.query.storyFilter as string || 'all';
    
    try {
      const { farcasterService } = await import('./services/farcaster');
      
      // Get trending content from multiple sources
      const [farcasterTrending, youtubeData, marketNews] = await Promise.all([
        farcasterService.getTrendingContent({
          limit: 20,
          since: timeFilter === '1h' ? '1h' : timeFilter === '6h' ? '6h' : '24h',
          order: 'desc'
        }),
        // YouTube data from existing endpoint
        req.app.locals?.youtubeService?.searchCryptoContent?.('trending crypto') || Promise.resolve([]),
        MarketDataService.getInstance().getFinancialNews(10)
      ]);

      // Transform and combine stories from different sources
      const stories = [];

      // Add Farcaster stories (if filter allows)
      if (storyFilter === 'all' || storyFilter === 'farcaster') {
        farcasterTrending.forEach((cast: any) => {
          stories.push({
            id: cast.hash,
            title: cast.text.slice(0, 100) + (cast.text.length > 100 ? '...' : ''),
            description: cast.text,
            source: cast.author.username,
            sourceType: 'farcaster',
            engagement: {
              likes: cast.likes || 0,
              comments: cast.replies || 0,
              shares: cast.recasts || 0,
              views: cast.engagement || 0,
              score: (cast.likes || 0) + (cast.replies || 0) * 2 + (cast.recasts || 0) * 3
            },
            metadata: {
              publishedAt: cast.timestamp,
              author: cast.author.displayName || cast.author.username,
              tags: ['farcaster', 'social'],
              sentiment: 'neutral' as const,
              trendingScore: cast.engagement || 0
            },
            url: `https://warpcast.com/${cast.author.username}/${cast.hash}`
          });
        });
      }

      // Add news stories (if filter allows)
      if (storyFilter === 'all' || storyFilter === 'news') {
        marketNews.forEach((article: any, index: number) => {
          stories.push({
            id: `news-${index}`,
            title: article.title,
            description: article.summary || article.title,
            source: article.source,
            sourceType: 'news',
            engagement: {
              likes: Math.floor(Math.random() * 100),
              comments: Math.floor(Math.random() * 50),
              shares: Math.floor(Math.random() * 25),
              views: Math.floor(Math.random() * 1000) + 500,
              score: Math.floor(Math.random() * 100) + 50
            },
            metadata: {
              publishedAt: article.published,
              author: article.source,
              tags: ['news', 'crypto', 'finance'],
              sentiment: 'neutral' as const,
              trendingScore: Math.floor(Math.random() * 100) + 50
            },
            url: article.url
          });
        });
      }

      // Sort by engagement score and trending score
      const sortedStories = stories
        .sort((a, b) => (b.engagement.score + b.metadata.trendingScore) - (a.engagement.score + a.metadata.trendingScore))
        .slice(0, 20);

      res.json({
        stories: sortedStories,
        count: sortedStories.length,
        timeFilter,
        storyFilter,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to fetch trending stories:', error);
      res.status(500).json({ 
        error: 'Failed to fetch trending stories',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get sector data for discover page  
  app.get('/api/market/sectors', asyncHandler(async (req: Request, res: Response) => {
    console.log(`🔍 API Call: GET /api/market/sectors - Query:`, req.query, 'Headers:', req.headers.accept);
    const timeFilter = req.query.timeFilter as string || '24h';
    const marketData = MarketDataService.getInstance();
    
    try {
      // Get crypto data to calculate sector performance
      const cryptos = await marketData.getTopCryptos(50);
      
      // Define sector mappings
      const sectorMappings: { [key: string]: string[] } = {
        'DeFi': ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'YFI', 'CRV'],
        'Layer 1': ['BTC', 'ETH', 'ADA', 'SOL', 'AVAX', 'DOT', 'ATOM'],
        'Layer 2': ['MATIC', 'OP', 'ARB', 'LRC', 'IMX'],
        'Gaming': ['AXS', 'SAND', 'MANA', 'ENJ', 'GALA', 'ILV'],
        'AI & Data': ['FET', 'OCEAN', 'GRT', 'RNDR', 'LPT'],
        'Memecoins': ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK']
      };

      const sectors = Object.entries(sectorMappings).map(([sectorName, symbols]) => {
        const sectorCryptos = cryptos.filter(crypto => 
          symbols.includes(crypto.symbol.toUpperCase())
        );
        
        if (sectorCryptos.length === 0) {
          return {
            name: sectorName,
            performance: 0,
            volume: 0,
            assets: 0,
            trend: 'stable' as const,
            sentiment: 0.5
          };
        }

        const avgPerformance = sectorCryptos.reduce((sum, crypto) => sum + crypto.percentChange24h, 0) / sectorCryptos.length;
        const totalVolume = sectorCryptos.reduce((sum, crypto) => sum + crypto.volume24h, 0);
        
        return {
          name: sectorName,
          performance: avgPerformance,
          volume: totalVolume,
          assets: sectorCryptos.length,
          trend: avgPerformance > 2 ? 'up' as const : avgPerformance < -2 ? 'down' as const : 'stable' as const,
          sentiment: Math.max(0, Math.min(1, (avgPerformance + 10) / 20)) // Normalize to 0-1
        };
      });

      res.json({
        sectors,
        timestamp: new Date().toISOString(),
        timeFilter
      });
    } catch (error: any) {
      console.error('Failed to fetch sector data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sector data',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Get social trending data
  app.get('/api/social/trending', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { farcasterService } = await import('./services/farcaster');
      
      // Get prominent crypto users and their recent activity
      const [prominentUsers, trendingContent] = await Promise.all([
        farcasterService.getProminentCryptoUsers(10),
        farcasterService.getTrendingContent({ limit: 15, since: '6h' })
      ]);

      // Calculate social metrics
      const socialMetrics = {
        totalEngagement: trendingContent.reduce((sum: number, cast: any) => 
          sum + (cast.likes || 0) + (cast.replies || 0) + (cast.recasts || 0), 0),
        activeUsers: prominentUsers.length,
        trending: trendingContent.slice(0, 5).map((cast: any) => ({
          text: cast.text.slice(0, 80) + '...',
          author: cast.author.username,
          engagement: (cast.likes || 0) + (cast.replies || 0) + (cast.recasts || 0)
        }))
      };

      res.json({
        metrics: socialMetrics,
        prominentUsers: prominentUsers.slice(0, 5),
        trendingContent: trendingContent.slice(0, 10),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Failed to fetch social trending data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch social trending data',
        timestamp: new Date().toISOString()
      });
    }
  }));

  const httpServer = createServer(app);
  
  // =============================================================================
  // WEBSOCKET SERVER FOR REAL-TIME UPDATES
  // =============================================================================
  
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('📡 WebSocket client connected');
    clients.add(ws);
    
    // Send initial stock data
    ws.send(JSON.stringify({
      type: 'initial',
      message: 'Connected to real-time stock updates'
    }));
    
    ws.on('close', () => {
      console.log('📡 WebSocket client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('📡 WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Broadcast real-time stock updates every 3 seconds
  const broadcastStockUpdates = async () => {
    if (clients.size === 0) return;
    
    try {
      const marketService = MarketDataService.getInstance();
      const stocks = await marketService.getCryptoStocks();
      const message = JSON.stringify({
        type: 'stockUpdate',
        data: { stocks }
      });
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      
      console.log(`📈 Broadcast real-time stock updates to ${clients.size} clients`);
    } catch (error) {
      console.error('📈 Error broadcasting stock updates:', error);
    }
  };
  
  // Start real-time updates
  const stockUpdateInterval = setInterval(broadcastStockUpdates, 30000); // Every 30 seconds for real API calls
  
  // Cleanup on server close
  httpServer.on('close', () => {
    clearInterval(stockUpdateInterval);
    clients.clear();
  });
  
  return httpServer;
}
