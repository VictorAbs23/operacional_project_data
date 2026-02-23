import type { Request, Response, NextFunction } from 'express';
import { generateExport } from './exports.service.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AuditAction } from '@absolutsport/shared';

export async function downloadExport(req: Request, res: Response, next: NextFunction) {
  try {
    const type = req.query.type as string;
    const proposalId = req.query.proposalId as string | undefined;

    if (!type) {
      res.status(400).json({ message: 'Export type is required' });
      return;
    }

    const { csv, filename } = await generateExport(type, proposalId);

    await logAudit(req, {
      action: AuditAction.EXPORT_GENERATED,
      entity: 'export',
      payload: { type, proposalId, filename },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
