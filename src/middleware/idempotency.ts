import { Request, Response, NextFunction } from 'express';

// Simple in-memory idempotency store. For production replace with Redis or DB.
const idempotencyStore = new Map<string, { createdAt: number }>();

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only enforce on POST
  if (req.method !== 'POST') return next();

  const key = req.header('Idempotency-Key');
  if (!key) return next();

  const tenantId = (req as any).tenant_id || req.header('X-Tenant-Id');
  const storeKey = `${tenantId || 'anon'}:${key}`;

  if (idempotencyStore.has(storeKey)) {
    // For simplicity return 409 if a previous request with same key exists
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Duplicate Idempotency-Key', request_id: '' } });
  }

  // mark key as seen for a short window
  idempotencyStore.set(storeKey, { createdAt: Date.now() });

  // cleanup after 5 minutes
  setTimeout(() => idempotencyStore.delete(storeKey), 5 * 60 * 1000);

  return next();
}
