import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { storage } from './storage';

export interface JWTPayload {
  id: string;
  username: string;
  email?: string;
  walletAddress?: string;
  authProvider?: string;
}

export interface TwitterProfile {
  id: string;
  username: string;
  displayName: string;
  photos?: Array<{ value: string }>;
  emails?: Array<{ value: string; verified?: boolean }>;
  verified?: boolean;
}

export interface AuthRequest extends Request {
  user?: JWTPayload | Express.User;
}

declare global {
  namespace Express {
    interface User extends JWTPayload {}
  }
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable must be set in production. ' +
    'Refusing to start with insecure fallback secret.',
  );
}

if (!process.env.JWT_SECRET) {
  console.warn(
    '[auth] JWT_SECRET not set — using ephemeral random dev secret. ' +
    'Tokens will not survive a server restart. Set JWT_SECRET in .env to persist sessions.',
  );
}

export class AuthService {
  private static JWT_SECRET =
    process.env.JWT_SECRET || randomBytes(64).toString('hex');
  
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'streamaix',
      audience: 'streamaix-users'
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'streamaix',
        audience: 'streamaix-users'
      }) as JWTPayload;
      return payload;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Token verification failed:', (error as Error).message);
      }
      return null;
    }
  }

  /**
   * Generate secure random session ID
   */
  static generateSessionId(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate username format
   */
  static isValidUsername(username: string): boolean {
    // Username: 3-30 characters, alphanumeric + underscore/hyphen
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): {
    valid: boolean;
    message?: string;
  } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true };
  }

  /**
   * Setup Twitter OAuth strategy
   */
  static setupTwitterAuth(): boolean {
    if (!process.env.TWITTER_CONSUMER_KEY || !process.env.TWITTER_CONSUMER_SECRET) {
      console.warn('Twitter OAuth credentials not found. Twitter login will not be available.');
      return false;
    }

    try {
      passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL || 'oob',
        includeEmail: true
      },
    async (token: string, tokenSecret: string, profile: any, done: any) => {
      try {
        const twitterProfile: TwitterProfile = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          photos: profile.photos,
          emails: profile.emails,
          verified: profile.verified
        };

        // Check if user already exists with this Twitter ID
        let user = await storage.getUserByTwitterId(twitterProfile.id);
        
        if (user) {
          // Update existing user with latest Twitter data
          user = await storage.updateUser(user.id, {
            twitterUsername: twitterProfile.username,
            twitterDisplayName: twitterProfile.displayName,
            twitterVerified: twitterProfile.verified || false,
            avatar: user.avatar || twitterProfile.photos?.[0]?.value,
          });
        } else {
          // Create new user from Twitter profile
          console.log(`🆕 Creating new Twitter user: ${twitterProfile.username} (Twitter ID: ${twitterProfile.id})`);
          console.log(`📧 Twitter email: ${twitterProfile.emails?.[0]?.value || 'No email'}`);
          
          try {
            const newUser = await storage.createUser({
              username: twitterProfile.username,
              twitterId: twitterProfile.id,
              twitterUsername: twitterProfile.username,
              twitterDisplayName: twitterProfile.displayName,
              twitterVerified: twitterProfile.verified || false,
              email: twitterProfile.emails?.[0]?.value,
              avatar: twitterProfile.photos?.[0]?.value,
              authProvider: 'twitter',
            });
            console.log(`✅ Successfully created Twitter user in database! User ID: ${newUser.id}`);
            user = newUser;
          } catch (createError: any) {
            console.error(`❌ Failed to create Twitter user in database!`);
            console.error(`💬 Error message: ${createError.message}`);
            console.error(`📚 Error stack:`, createError.stack);
            throw createError;
          }
        }

        if (user) {
          console.log(`✅ Twitter OAuth successful for user: ${user.id} (${user.username})`);
          return done(null, user);
        }
        return done(new Error('Failed to create or find user'), null);
      } catch (error: any) {
        console.error('❌ Twitter OAuth error:', error);
        console.error(`💬 Error type: ${error.constructor?.name}`);
        console.error(`📝 Error details:`, error);
        return done(error, null);
      }
    }));

      // Serialize user for session
      passport.serializeUser((user: any, done: any) => {
        done(null, user.id);
      });

      // Deserialize user from session
      passport.deserializeUser(async (id: string, done: any) => {
        try {
          const user = await storage.getUser(id);
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      });

      console.log('Twitter OAuth configured successfully');
      return true;
    } catch (error) {
      console.error('Failed to setup Twitter OAuth:', error);
      return false;
    }
  }
}

/**
 * Middleware to authenticate JWT token (required)
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
};

/**
 * Middleware to optionally authenticate JWT token
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    const payload = AuthService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user has admin role (would be stored in user profile)
  // For now, implement basic admin check
  const adminUsernames = ['admin', 'streamaix-admin'];
  
  if (!adminUsernames.includes(req.user.username)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Rate limiting middleware (simple implementation)
 */
export const rateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  const requests = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const userRequests = requests.get(key) || [];

    // Clean old requests
    const validRequests = userRequests.filter((time: number) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    validRequests.push(now);
    requests.set(key, validRequests);
    next();
  };
};