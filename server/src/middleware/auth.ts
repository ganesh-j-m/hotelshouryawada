import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/index.js';
import { adminUsers, type AdminRole } from '../db/schema.js';
import { HttpError } from '../lib/errors.js';

export interface AdminContext {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminContext;
    }
  }
}

interface TokenPayload {
  sub: string;
  role: AdminRole;
}

export function signToken(userId: string, role: AdminRole): string {
  return jwt.sign({ sub: userId, role } satisfies TokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/api',
    maxAge: 1000 * 60 * 60 * 12,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/api',
  });
}

/** Verifies the session cookie and re-checks the user in the database on every request. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[config.cookieName];
    if (!token) throw new HttpError(401, 'Please sign in.');

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch {
      throw new HttpError(401, 'Your session has expired. Please sign in again.');
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, payload.sub));
    if (!user || !user.isActive) throw new HttpError(401, 'Please sign in.');

    req.admin = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) return next(new HttpError(401, 'Please sign in.'));
    if (!roles.includes(req.admin.role)) {
      return next(new HttpError(403, 'You do not have permission to do this.'));
    }
    next();
  };
}

/**
 * CSRF defence for cookie-authenticated, state-changing requests:
 * the browser Origin (or Referer) must be one of our allowed origins.
 */
export function verifyOrigin(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin') ?? (req.get('referer') ? new URL(req.get('referer')!).origin : '');
  const selfOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin && (config.clientOrigins.includes(origin) || origin === selfOrigin)) return next();
  next(new HttpError(403, 'Request blocked.'));
}
