import type { Request, Response, NextFunction } from 'express';
import * as capturesService from './captures.service.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AuditAction } from '@absolutsport/shared';

export async function dispatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { proposal, mode, deadline } = req.body;

    if (!proposal || !mode) {
      res.status(400).json({ message: 'proposal and mode are required' });
      return;
    }

    const result = await capturesService.dispatchCapture(
      proposal,
      mode,
      req.user!.id,
      deadline,
    );

    const action = mode === 'EMAIL'
      ? AuditAction.CAPTURE_DISPATCHED
      : AuditAction.CAPTURE_LINK_GENERATED;

    await logAudit(req, {
      action,
      entity: 'proposal',
      entityId: proposal,
      payload: { mode, deadline },
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSchema(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = await capturesService.getFormSchema(req.params.accessId as string);
    res.json(schema);
  } catch (err) {
    next(err);
  }
}
