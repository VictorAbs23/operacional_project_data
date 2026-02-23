import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const pageSize = Math.min(100, Math.max(1, Math.floor(Number(req.query.pageSize) || 30)));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (req.query.action) where.action = req.query.action;
    if (req.query.userId) where.userId = req.query.userId;

    if (req.user!.role === 'ADMIN') {
      where.userId = req.user!.id;
    }

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
