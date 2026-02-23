import type { Request, Response, NextFunction } from 'express';
import * as clientsService from './clients.service.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AuditAction } from '@absolutsport/shared';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const search = req.query.search as string | undefined;
    const result = await clientsService.listClients(page, pageSize, search);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientsService.getClientById(req.params.id as string);
    res.json(client);
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    await clientsService.deactivateClient(req.params.id as string);
    await logAudit(req, {
      action: AuditAction.USER_DEACTIVATED,
      entity: 'client',
      entityId: req.params.id as string,
    });
    res.json({ message: 'Client deactivated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await logAudit(req, {
      action: AuditAction.USER_DELETED,
      entity: 'client',
      entityId: req.params.id as string,
    });
    await clientsService.deleteClient(req.params.id as string);
    res.json({ message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const tempPassword = await clientsService.resetClientPassword(req.params.id as string);
    res.json({ tempPassword });
  } catch (err) {
    next(err);
  }
}
