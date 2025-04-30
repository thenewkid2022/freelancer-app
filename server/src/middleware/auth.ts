import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('Kein Authentifizierungstoken vorhanden');
    }

    const token = authHeader.replace('Bearer ', '');
    const authService = AuthService.getInstance();
    const user = await authService.validateToken(token);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError('Nicht authentifiziert'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AuthError('Keine Berechtigung für diese Aktion'));
    }

    next();
  };
}; 