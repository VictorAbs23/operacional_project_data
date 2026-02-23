import type { Request, Response, NextFunction } from 'express';
import passport from '../config/passport.js';
import type { AuthUser } from '@absolutsport/shared';

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: AuthUser | false) => {
    if (err) return next(err);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
}
