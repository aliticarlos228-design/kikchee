import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config/env';
import { prisma } from '../config/database';

export interface AuthPayload {
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant', code: 'UNAUTHORIZED' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Compte invalide ou désactivé', code: 'UNAUTHORIZED' });
    }

    prisma.user
      .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      .catch(() => {});

    req.user = { userId: user.id, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré', code: 'UNAUTHORIZED' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHORIZED' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé pour ce rôle', code: 'FORBIDDEN' });
    }
    next();
  };
}
