import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 30;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (req.query.action) where.action = req.query.action;
    if (req.query.userId) where.userId = req.query.userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
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
