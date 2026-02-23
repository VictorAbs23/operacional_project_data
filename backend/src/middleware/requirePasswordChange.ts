import type { Request, Response, NextFunction } from 'express';

export function requirePasswordChange(req: Request, res: Response, next: NextFunction) {
  if (req.user?.mustChangePassword) {
    res.status(403).json({
      message: 'You must change your password before accessing this resource',
      code: 'MUST_CHANGE_PASSWORD',
    });
    return;
  }
  next();
}
