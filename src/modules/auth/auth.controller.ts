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

export async function forgotPassword(req: Request, res: Response, _next: NextFunction) {
  try {
    await authService.requestPasswordReset(req.body.email);
  } catch {
    // Swallow all errors — anti-enumeration: never leak whether email exists
  }
  await logAudit(req, {
    action: AuditAction.PASSWORD_RESET_REQUESTED,
    payload: { email: req.body.email },
  });
  // Always return 200 with generic message
  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = await authService.resetPassword(req.body.token, req.body.newPassword);
    await logAudit(req, {
      action: AuditAction.PASSWORD_RESET_COMPLETED,
      entity: 'user',
      entityId: userId,
    });
    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    next(err);
  }
}
