import type { Request, Response, NextFunction } from 'express';
import { AuditAction } from '@absolutsport/shared';
import * as proposalsService from './proposals.service.js';
import { prisma } from '../../config/database.js';
import { logAudit } from '../../middleware/auditLogger.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      page: Math.max(1, Math.floor(Number(req.query.page) || 1)),
      pageSize: Math.min(100, Math.max(1, Math.floor(Number(req.query.pageSize) || 20))),
      status: (req.query.status as string) || undefined,
      game: (req.query.game as string) || undefined,
      hotel: (req.query.hotel as string) || undefined,
      seller: (req.query.seller as string) || undefined,
      search: (req.query.search as string) || undefined,
    };
    const result = await proposalsService.listProposals(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function filterOptions(_req: Request, res: Response, next: NextFunction) {
  try {
    const options = await proposalsService.getFilterOptions();
    res.json(options);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await proposalsService.getProposalById(req.params.id as string);
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }
    res.json(proposal);
  } catch (err) {
    next(err);
  }
}

export async function getMatrix(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await proposalsService.getProposalMatrix(req.params.id as string);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

const ADMIN_FIELDS = [
  'ticket_status',
  'hotel_confirmation_number',
  'flight_locator',
  'insurance_number',
  'transfer_reference',
] as const;

export async function updateAdminFields(req: Request, res: Response, next: NextFunction) {
  try {
    const slotId = req.params.slotId as string;

    // 1. Find the PassengerSlot
    const slot = await prisma.passengerSlot.findUnique({
      where: { id: slotId },
      include: { response: true },
    });

    if (!slot) {
      throw new AppError('Passenger slot not found', 404);
    }

    // 2. Build the admin-only update from request body
    const adminUpdate: Record<string, unknown> = {};
    for (const field of ADMIN_FIELDS) {
      if (req.body[field] !== undefined) {
        adminUpdate[field] = req.body[field];
      }
    }

    // 3. Get or create the FormResponse, merging admin fields into answers
    const existingAnswers = (slot.response?.answers ?? {}) as Record<string, unknown>;
    const mergedAnswers = { ...existingAnswers, ...adminUpdate };

    if (slot.response) {
      await prisma.formResponse.update({
        where: { passengerSlotId: slotId },
        data: {
          answers: mergedAnswers as any,
        },
      });
    } else {
      await prisma.formResponse.create({
        data: {
          passengerSlotId: slotId,
          answers: mergedAnswers as any,
        },
      });
    }

    // 4. Log audit entry
    await logAudit(req, {
      action: AuditAction.ADMIN_EDITED,
      entity: 'passenger_slot',
      entityId: slotId,
      payload: adminUpdate,
    });

    res.json({ message: 'Admin fields updated', slotId, updatedFields: adminUpdate });
  } catch (err) {
    next(err);
  }
}
