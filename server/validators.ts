import { z } from 'zod';
import { 
  insertUserSchema, 
  insertSummarySchema, 
  insertBountySchema, 
  insertUserInteractionSchema,
  insertKnowledgeStackSchema 
} from '@shared/schema';

// Auth validators
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const walletLoginSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
});

// User validators
export const updateUserSchema = insertUserSchema.partial();

// Summary validators
export const createSummarySchema = insertSummarySchema.extend({
  originalUrl: z.string().url('Please provide a valid URL'),
  contentType: z.enum(['podcast', 'video', 'livestream'], {
    errorMap: () => ({ message: 'Content type must be podcast, video, or livestream' })
  }),
});

export const updateSummarySchema = createSummarySchema.partial();

// Bounty validators
export const createBountySchema = insertBountySchema.extend({
  contentUrl: z.string().url('Please provide a valid URL'),
  reward: z.number().min(1, 'Reward must be at least 1 token'),
  deadline: z.string().datetime('Please provide a valid deadline').optional(),
});

export const updateBountySchema = createBountySchema.partial();

// Interaction validators
export const createInteractionSchema = insertUserInteractionSchema.extend({
  interactionType: z.enum(['like', 'bookmark', 'share', 'view'], {
    errorMap: () => ({ message: 'Interaction type must be like, bookmark, share, or view' })
  }),
});

// Knowledge stack validators
export const createKnowledgeStackSchema = insertKnowledgeStackSchema;
export const updateKnowledgeStackSchema = createKnowledgeStackSchema.partial();

// Query validators
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type WalletLoginRequest = z.infer<typeof walletLoginSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type CreateSummaryRequest = z.infer<typeof createSummarySchema>;
export type UpdateSummaryRequest = z.infer<typeof updateSummarySchema>;
export type CreateBountyRequest = z.infer<typeof createBountySchema>;
export type UpdateBountyRequest = z.infer<typeof updateBountySchema>;
export type CreateInteractionRequest = z.infer<typeof createInteractionSchema>;
export type CreateKnowledgeStackRequest = z.infer<typeof createKnowledgeStackSchema>;
export type UpdateKnowledgeStackRequest = z.infer<typeof updateKnowledgeStackSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type SearchQuery = z.infer<typeof searchSchema>;