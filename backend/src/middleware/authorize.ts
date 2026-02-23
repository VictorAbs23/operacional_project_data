import type { Request, Response, NextFunction } from 'express';
import { Role, hasHigherOrEqualRole } from '@absolutsport/shared';

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const userRole = user.role as Role;
    const hasPermission = roles.some((role) => hasHigherOrEqualRole(userRole, role));

    if (!hasPermission) {
      res.status(403).json({ message: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
}
