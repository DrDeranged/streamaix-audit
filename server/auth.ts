import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
  walletAddress?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export class AuthService {
  static generateToken(user: AuthenticatedUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): AuthenticatedUser | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    } catch (error) {
      return null;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
  }

  const user = AuthService.verifyToken(token);
  if (!user) {
    return res.status(403).json({ 
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }

  // Verify user still exists in database
  const dbUser = await storage.getUser(user.id);
  if (!dbUser) {
    return res.status(403).json({ 
      error: 'User not found',
      message: 'The user associated with this token no longer exists'
    });
  }

  req.user = user;
  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = AuthService.verifyToken(token);
    if (user) {
      const dbUser = await storage.getUser(user.id);
      if (dbUser) {
        req.user = user;
      }
    }
  }

  next();
};