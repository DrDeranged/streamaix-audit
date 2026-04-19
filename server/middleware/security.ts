import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest, JWTPayload } from '../auth';

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'admin')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

function getUsername(user: AuthRequest['user']): string | undefined {
  if (!user) return undefined;
  const u = user as JWTPayload;
  return typeof u.username === 'string' ? u.username : undefined;
}

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
  const username = getUsername(req.user);
  if (username && ADMIN_USERNAMES.includes(username)) {
    return next();
  }

  const expectedSecret = process.env.ADMIN_RESEED_SECRET;
  const allowSecretPath =
    !!expectedSecret && process.env.ENABLE_ADMIN_SECRET_OVERRIDE === 'true';

  if (allowSecretPath) {
    const headerSecret = req.headers['x-admin-secret'];
    if (typeof headerSecret === 'string' && headerSecret === expectedSecret) {
      const ip = (req.ip || req.socket.remoteAddress || 'unknown').toString();
      console.warn(
        `[ADMIN_AUDIT] secret-override admin access — route=${req.method} ${req.path} ip=${ip} ts=${new Date().toISOString()}`,
      );
      return next();
    }
  }

  return res.status(403).json({ error: 'Admin access required' });
}

/**
 * Global mutation-body validator.
 *
 * For every POST/PUT/PATCH request, enforces that req.body is a plain JSON
 * object (not an array, not a primitive, not null). Rejects with 400 otherwise.
 *
 * This is a baseline defense applied to every mutating route in the app:
 *
 *   - blocks `__proto__` / `constructor` prototype-pollution payloads sent as
 *     non-object roots
 *   - blocks bodies posted as bare arrays, strings, or numbers (which can
 *     trip handlers expecting `{ ... }` and lead to NaN/undefined writes)
 *   - lets per-route Zod schemas (`validateBody(schema)`) further constrain
 *     individual fields
 *
 * Does NOT run for GET/DELETE/HEAD/OPTIONS, multipart/form-data uploads,
 * or webhook routes that legitimately accept other content types
 * (those are skipped via the `skipPaths` list).
 */
const GLOBAL_BODY_VALIDATOR_SKIP = [
  /^\/api\/webhooks?\//, // raw webhook bodies
  /^\/api\/upload/, // multipart uploads
];

export function requireJsonObjectBody(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const method = req.method.toUpperCase();
  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
    return next();
  }
  if (GLOBAL_BODY_VALIDATOR_SKIP.some((re) => re.test(req.path))) {
    return next();
  }
  const ct = (req.headers['content-type'] || '').toString().toLowerCase();
  if (ct.includes('multipart/form-data') || ct.startsWith('text/')) {
    return next();
  }

  const body = req.body;
  // Accept "no body" (Content-Length: 0) for empty-payload mutations
  if (body === undefined || body === null) {
    req.body = {};
    return next();
  }

  if (
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Buffer.isBuffer(body)
  ) {
    return res.status(400).json({
      error: 'Validation failed',
      field: 'body',
      message: 'Request body must be a JSON object',
    });
  }

  // Block prototype-pollution attempts at the root
  if (
    Object.prototype.hasOwnProperty.call(body, '__proto__') ||
    Object.prototype.hasOwnProperty.call(body, 'constructor') ||
    Object.prototype.hasOwnProperty.call(body, 'prototype')
  ) {
    return res.status(400).json({
      error: 'Validation failed',
      field: 'body',
      message: 'Forbidden property in request body',
    });
  }

  next();
}

export function disableInProd(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}

interface ZodLike<T = unknown> {
  parse: (data: unknown) => T;
}

export function validateBody<T>(schema: ZodLike<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      const e = err as { errors?: Array<{ message?: string; path?: Array<string | number> }> };
      const first = e?.errors?.[0];
      const field = first?.path?.join('.') || 'body';
      const message = first?.message || 'Invalid request body';
      return res.status(400).json({ error: 'Validation failed', field, message });
    }
  };
}
