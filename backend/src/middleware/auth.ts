import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: number;
  email: string;
  rol: 'Usuario' | 'Administrador';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token no proporcionado.' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    const secret = process.env.JWT_SECRET || "memora_secret_key";
    const verified = jwt.verify(token, secret);

    if (!verified || typeof verified === 'string') {
      throw new Error('Token inválido.');
    }

    const payload = verified as jwt.JwtPayload;
    req.user = {
      sub: Number(payload.sub),
      email: String(payload.email),
      rol: payload.rol === 'Administrador' ? 'Administrador' : 'Usuario',
    };
    next();
  } catch (error: any) {
    console.error(" ERROR REAL EN AUTH.TS:", error?.message || error);
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.rol !== 'Administrador') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol admin.' });
    return;
  }
  next();
}
