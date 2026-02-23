import type { Request, Response, NextFunction } from 'express';
import * as formsService from './forms.service.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AppError } from '../../middleware/errorHandler.js';
import { prisma } from '../../config/database.js';
import { AuditAction } from '@absolutsport/shared';

export async function getFormInstance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await formsService.getFormInstance(req.params.accessId as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPassengerSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await formsService.getPassengerSlot(req.params.slotId as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function savePassengerResponse(req: Request, res: Response, next: NextFunction) {
  try {
    const slotId = req.params.slotId as string;

    // Deadline enforcement: check if the form deadline has passed
    const slot = await prisma.passengerSlot.findUnique({
      where: { id: slotId },
      include: {
        formInstance: {
          include: {
            access: true,
          },
        },
      },
    });

    if (!slot) {
      throw new AppError('Passenger slot not found', 404);
    }

    const deadline = slot.formInstance?.access?.deadline;
    if (deadline && new Date(deadline) < new Date()) {
      throw new AppError('Deadline expired', 403);
    }

    const result = await formsService.savePassengerResponse(
      slotId,
      req.body.answers,
      req.user?.id,
    );

    await logAudit(req, {
      action: AuditAction.FORM_SAVED,
      entity: 'passenger_slot',
      entityId: slotId,
      payload: { filledSlots: result.filledSlots, totalSlots: result.totalSlots },
    });

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
