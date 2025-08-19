import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface JWTPayload {
  id: string;
  username: string;
  email?: string;
  walletAddress?: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  
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
      console.error('Token verification failed:', error);
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