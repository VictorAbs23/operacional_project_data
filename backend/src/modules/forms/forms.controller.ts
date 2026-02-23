import type { Request, Response, NextFunction } from 'express';
import * as formsService from './forms.service.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AppError } from '../../middleware/errorHandler.js';
import { prisma } from '../../config/database.js';
import { AuditAction } from '@absolutsport/shared';

async function verifySlotOwnership(userId: string, slotId: string) {
  const slot = await prisma.passengerSlot.findUnique({
    where: { id: slotId },
    include: {
      formInstance: {
        include: { access: true },
      },
    },
  });
  if (!slot) throw new AppError('Passenger slot not found', 404);
  if (slot.formInstance?.access?.userId !== userId) {
    throw new AppError('Forbidden: you do not own this slot', 403);
  }
  return slot;
}

async function verifyAccessOwnership(userId: string, role: string, accessToken: string) {
  const access = await prisma.clientProposalAccess.findUnique({
    where: { accessToken },
  });
  if (!access) throw new AppError('Form not found', 404);
  if (role === 'CLIENT' && access.userId !== userId) {
    throw new AppError('Forbidden: you do not own this form', 403);
  }
  return access;
}

export async function getFormInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const accessId = req.params.accessId as string;
    await verifyAccessOwnership(user.id, user.role, accessId);
    const result = await formsService.getFormInstance(accessId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPassengerSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const slotId = req.params.slotId as string;
    if (user.role === 'CLIENT') {
      await verifySlotOwnership(user.id, slotId);
    }
    const result = await formsService.getPassengerSlot(slotId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function savePassengerResponse(req: Request, res: Response, next: NextFunction) {
  try {
    const slotId = req.params.slotId as string;
    const user = req.user!;

    // verifySlotOwnership already loads the slot with formInstance + access
    let slotWithRelations: Awaited<ReturnType<typeof verifySlotOwnership>> | null = null;

    if (user.role === 'CLIENT') {
      slotWithRelations = await verifySlotOwnership(user.id, slotId);
    } else {
      slotWithRelations = await prisma.passengerSlot.findUnique({
        where: { id: slotId },
        include: {
          formInstance: {
            include: { access: true },
          },
        },
      });
    }

    if (!slotWithRelations) throw new AppError('Passenger slot not found', 404);

    const deadline = slotWithRelations.formInstance?.access?.deadline;
    if (deadline && new Date(deadline) < new Date()) {
      throw new AppError('Deadline expired', 403);
    }

    const answers = req.body.answers;
    if (!answers || typeof answers !== 'object') {
      throw new AppError('answers is required and must be an object', 400);
    }

    const result = await formsService.savePassengerResponse(slotId, answers, user.id);

    await logAudit(req, {
      action: AuditAction.FORM_SAVED,
      entity: 'passenger_slot',
      entityId: slotId,
      payload: { filledSlots: result.filledSlots, totalSlots: result.totalSlots },
    });

    if (result.filledSlots === result.totalSlots) {
      await logAudit(req, {
        action: AuditAction.FORM_COMPLETED,
        entity: 'form_instance',
        entityId: slotWithRelations.formInstanceId,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getClientProposals(req: Request, res: Response, next: NextFunction) {
  try {
    const proposals = await formsService.getClientProposals(req.user!.id);
    res.json(proposals);
  } catch (err) {
    next(err);
  }
}
