import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { runSync } from './sheetsSync.job.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AuditAction } from '@absolutsport/shared';

export async function triggerSync(req: Request, res: Response, next: NextFunction) {
  try {
    await logAudit(req, { action: AuditAction.SYNC_STARTED });

    // Run sync and WAIT for result so the user gets feedback
    const result = await runSync();

    if (result === null) {
      res.status(409).json({ message: 'Sync already running or failed. Check logs.' });
      return;
    }

    res.json({
      message: 'Sync completed',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSyncLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const pageSize = Math.min(100, Math.max(1, Math.floor(Number(req.query.pageSize) || 20)));
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({
        orderBy: { startedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.syncLog.count(),
    ]);

    res.json({
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
}
