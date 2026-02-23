import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AuditAction } from '@absolutsport/shared';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    await logAudit(req, {
      action: AuditAction.LOGIN,
      entity: 'user',
      entityId: result.user.id,
    });
    res.json(result);
  } catch (err) {
    await logAudit(req, {
      action: AuditAction.LOGIN_FAILED,
      payload: { email: req.body.email },
    });
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.changePassword(req.user!.id, req.body);
    await logAudit(req, {
      action: AuditAction.PASSWORD_CHANGED,
      entity: 'user',
      entityId: req.user!.id,
    });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await logAudit(req, {
      action: AuditAction.LOGOUT,
      entity: 'user',
      entityId: req.user!.id,
    });
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}
