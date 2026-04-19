import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../auth';

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'admin')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

interface RateLimitOptions {
  windowMs: number;
  max: number;
  name: string;
  keyBy?: 'ip' | 'user-or-ip';
}

function createLimiter({ windowMs, max, name, keyBy = 'ip' }: RateLimitOptions) {
  const buckets = new Map<string, number[]>();

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of buckets) {
      const fresh = times.filter((t) => t > cutoff);
      if (fresh.length === 0) buckets.delete(key);
      else buckets.set(key, fresh);
    }
  }, windowMs).unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown').toString();
    const userId = (req as AuthRequest).user?.id;
    const key = keyBy === 'user-or-ip' && userId ? `u:${userId}` : `ip:${ip}`;
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = (buckets.get(key) || []).filter((t) => t > cutoff);

    if (recent.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        error: 'Too many requests',
        limit: name,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      });
    }

    recent.push(now);
    buckets.set(key, recent);
    next();
  };
}

export const strictLimit = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  name: 'strict',
  keyBy: 'user-or-ip',
});

export const mediumLimit = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  name: 'medium',
  keyBy: 'user-or-ip',
});

export const looseLimit = createLimiter({
  windowMs: 60 * 1000,
  max: 200,
  name: 'loose',
});

export const signupLimit = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  name: 'signup',
});

export const authLimit = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  name: 'auth',
});

export function requireAdminFlexible(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const adminSecret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_RESEED_SECRET;

  if (
    expectedSecret &&
    typeof adminSecret === 'string' &&
    adminSecret === expectedSecret
  ) {
    return next();
  }

  if (req.user && ADMIN_USERNAMES.includes((req.user as any).username)) {
    return next();
  }

  return res.status(403).json({ error: 'Admin access required' });
}

export function disableInProd(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}

export function validateBody(schema: { parse: (data: unknown) => unknown }) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      const message = err?.errors?.[0]?.message || 'Invalid request body';
      return res.status(400).json({ error: 'Validation failed', message });
    }
  };
}
