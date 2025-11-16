import jwt from 'jsonwebtoken';
import { config } from '../../config';

export type JwtPayload = { tenant_id: string; sub?: string; [k: string]: any };

export function verifyToken(token: string): JwtPayload {
  if (!config.JWT_PUBLIC_KEY) throw new Error('JWT_PUBLIC_KEY not configured');
  const payload = jwt.verify(token, config.JWT_PUBLIC_KEY, { algorithms: ['RS256', 'HS256'] }) as JwtPayload;
  return payload;
}
