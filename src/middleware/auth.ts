import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../infra/auth/jwt';

export interface AuthedRequest extends Request {
  tenant_id?: string;
  jwt?: any;
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing token', request_id: '' } });
  }
  const token = auth.replace('Bearer ', '');
  try {
    const payload = verifyToken(token);
    if (!payload.tenant_id) {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing tenant_id', request_id: '' } });
    }
    req.tenant_id = payload.tenant_id;
    req.jwt = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: err.message, request_id: '' } });
  }
}
