import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './errors.js';
import { readSession } from './session.js';
import type { Role } from '../domain/constants.js';
import type { SessionPayload } from '../domain/types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

// Resolve the caller from cookie/bearer and reject unauthenticated requests.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await readSession(req);
  if (!user) return next(new ApiError(401, 'Not authenticated'));
  req.user = user;
  next();
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!allowed.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
}

export function user(req: Request): SessionPayload {
  if (!req.user) throw new ApiError(401, 'Not authenticated');
  return req.user;
}
