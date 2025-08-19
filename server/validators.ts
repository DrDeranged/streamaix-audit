import { z } from 'zod';

// Authentication schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(8).max(100),
  email: z.string().email().optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address').optional(),
  ensName: z.string().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const walletLoginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address').optional(),
  ensName: z.string().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  password: z.string().min(8).max(100).optional(),
});

// Summary schemas
export const createSummarySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  originalUrl: z.string().url('Invalid URL'),
  originalDuration: z.number().positive().optional(),
  contentType: z.enum(['podcast', 'video', 'livestream']),
  platform: z.string().min(1).max(50),
  tags: z.array(z.string().max(30)).max(10).optional(),
  isPublic: z.boolean().default(true),
});

export const updateSummarySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  isPublic: z.boolean().optional(),
});

// Bounty schemas
export const createBountySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  contentUrl: z.string().url('Invalid content URL'),
  reward: z.number().positive('Reward must be positive'),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const updateBountySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  reward: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  status: z.enum(['open', 'claimed', 'in_progress', 'completed', 'expired']).optional(),
});

// Interaction schemas
export const createInteractionSchema = z.object({
  summaryId: z.string().uuid('Invalid summary ID'),
  interactionType: z.enum(['like', 'bookmark', 'share', 'view']),
  metadata: z.record(z.any()).optional(),
});

// Knowledge stack schemas
export const createKnowledgeStackSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  summaryIds: z.array(z.string().uuid()).max(50),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const updateKnowledgeStackSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  summaryIds: z.array(z.string().uuid()).max(50).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

// Processing schemas
export const processContentSchema = z.object({
  url: z.string().url('Invalid URL'),
  contentType: z.enum(['podcast', 'video', 'livestream']),
  platform: z.string().min(1).max(50),
  title: z.string().min(1).max(200).optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

// Pagination and search schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// Web3 schemas
export const web3AuthSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  nonce: z.string().min(1),
});

export const socialShareSchema = z.object({
  summaryId: z.string().uuid('Invalid summary ID'),
  platform: z.enum(['lens', 'farcaster', 'twitter']),
  message: z.string().max(280).optional(),
});

// Admin schemas
export const adminUserUpdateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['user', 'moderator', 'admin']).optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
});

// Type exports for request validation
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type WalletLoginRequest = z.infer<typeof walletLoginSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

export type CreateSummaryRequest = z.infer<typeof createSummarySchema>;
export type UpdateSummaryRequest = z.infer<typeof updateSummarySchema>;

export type CreateBountyRequest = z.infer<typeof createBountySchema>;
export type UpdateBountyRequest = z.infer<typeof updateBountySchema>;

export type CreateInteractionRequest = z.infer<typeof createInteractionSchema>;

export type CreateKnowledgeStackRequest = z.infer<typeof createKnowledgeStackSchema>;
export type UpdateKnowledgeStackRequest = z.infer<typeof updateKnowledgeStackSchema>;

export type ProcessContentRequest = z.infer<typeof processContentSchema>;
export type SocialShareRequest = z.infer<typeof socialShareSchema>;

// Helper function for validation
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}