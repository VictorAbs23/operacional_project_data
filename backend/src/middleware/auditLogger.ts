import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import type { AuditAction } from '@absolutsport/shared';

interface AuditParams {
  action: AuditAction;
  entity?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}

export async function logAudit(req: Request, params: AuditParams) {
  try {
    const user = req.user;
    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userRole: user?.role ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        payload: (params.payload ?? Prisma.JsonNull) as any,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', { error: err });
  }
}
