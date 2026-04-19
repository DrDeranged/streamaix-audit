/**
 * Shared route helpers hoisted out of `server/routes.ts` during the domain
 * split. These utilities used to live as locals inside `registerRoutes` and
 * were reachable by closure. Extracting them keeps the new domain modules
 * (`server/routes/<domain>.ts`) thin and import-clean.
 */
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../auth';

/** Comma-separated list of usernames allowed to hit admin endpoints. */
export const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'admin')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

/** Returns true if the authenticated user is in the admin allowlist. */
export const isAdmin = (req: AuthRequest): boolean => {
  if (!req.user) return false;
  return ADMIN_USERNAMES.includes(req.user.username as string);
};

/**
 * Express middleware: requires an authenticated admin user. Use AFTER
 * `authenticateToken`. For environments that need a secret-header fallback,
 * use `requireAdminFlexible` from `server/middleware/security.ts` instead.
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Validates `data` against a Zod schema and returns a discriminated result.
 * Use inside route handlers when the body shape is computed dynamically; for
 * fixed schemas, prefer the `validateBody(schema)` middleware.
 */
export const validateRequest = <T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error: unknown) {
    const e = error as { errors?: Array<{ message?: string }> };
    const errorMessage = e?.errors?.[0]?.message || 'Validation failed';
    return { success: false, error: errorMessage };
  }
};

/**
 * Wraps an async route handler so rejected promises are forwarded to the
 * Express error pipeline instead of crashing the process.
 */
export const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch((err) => next(err));
  };
