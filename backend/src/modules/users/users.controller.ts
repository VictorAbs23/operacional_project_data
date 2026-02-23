import type { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AuditAction } from '@absolutsport/shared';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await usersService.listUsers(page, pageSize);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.createUser(req.body);
    await logAudit(req, {
      action: AuditAction.USER_CREATED,
      entity: 'user',
      entityId: result.user.id,
      payload: { email: result.user.email, role: result.user.role },
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(req.params.id as string, req.body);
    await logAudit(req, {
      action: AuditAction.USER_UPDATED,
      entity: 'user',
      entityId: user.id,
      payload: req.body,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deactivateUser(req.params.id as string);
    await logAudit(req, {
      action: AuditAction.USER_DEACTIVATED,
      entity: 'user',
      entityId: req.params.id as string,
    });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const tempPassword = await usersService.resetPassword(req.params.id as string);
    await logAudit(req, {
      action: AuditAction.PASSWORD_CHANGED,
      entity: 'user',
      entityId: req.params.id as string,
      payload: { resetBy: req.user!.id },
    });
    res.json({ tempPassword });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id as string;
    await usersService.deleteUser(userId);
    await logAudit(req, {
      action: AuditAction.USER_DELETED,
      entity: 'user',
      entityId: userId,
    });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params.id as string);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
