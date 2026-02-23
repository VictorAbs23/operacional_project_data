import cron from 'node-cron';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { fetchSalesLog, mapRowToSalesOrder } from './sheets.service.js';
import { upsertSalesOrders } from './salesOrder.service.js';
import { AuditAction, CaptureStatus } from '@absolutsport/shared';

let isRunning = false;

export async function runSync(): Promise<void> {
  if (isRunning) {
    logger.warn('Sync already running, skipping...');
    return;
  }

  isRunning = true;

  // Create sync log entry
  const syncLog = await prisma.syncLog.create({
    data: { status: 'RUNNING' },
  });

  // Audit: SYNC_STARTED
  try {
    await prisma.auditLog.create({
      data: {
        action: AuditAction.SYNC_STARTED,
        entity: 'syncLog',
        entityId: syncLog.id,
        payload: Prisma.JsonNull,
      },
    });
  } catch (auditErr) {
    logger.error('Failed to write SYNC_STARTED audit log', { error: auditErr });
  }

  try {
    // Fetch data from Google Sheets
    const rawRows = await fetchSalesLog();
    const mappedRows = rawRows.map((row, i) => mapRowToSalesOrder(row, i + 1));

    // Upsert into database
    const { rowsUpserted, rowsSkipped } = await upsertSalesOrders(mappedRows);

    // Update sync log with success
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'SUCCESS',
        finishedAt: new Date(),
        rowsRead: rawRows.length,
        rowsUpserted,
        rowsSkipped,
      },
    });

    // Audit: SYNC_COMPLETED
    try {
      await prisma.auditLog.create({
        data: {
          action: AuditAction.SYNC_COMPLETED,
          entity: 'syncLog',
          entityId: syncLog.id,
          payload: { rowsRead: rawRows.length, rowsUpserted, rowsSkipped },
        },
      });
    } catch (auditErr) {
      logger.error('Failed to write SYNC_COMPLETED audit log', { error: auditErr });
    }

    logger.info(`Sync completed: ${rawRows.length} read, ${rowsUpserted} upserted, ${rowsSkipped} skipped`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Sync failed', { error: errorMessage });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'ERROR',
        finishedAt: new Date(),
        error: errorMessage,
      },
    });

    // Audit: SYNC_FAILED
    try {
      await prisma.auditLog.create({
        data: {
          action: AuditAction.SYNC_FAILED,
          entity: 'syncLog',
          entityId: syncLog.id,
          payload: { error: errorMessage },
        },
      });
    } catch (auditErr) {
      logger.error('Failed to write SYNC_FAILED audit log', { error: auditErr });
    }
  } finally {
    isRunning = false;
  }
}

/**
 * Expire form instances whose deadline has passed and captureStatus is not COMPLETED.
 */
export async function expireOverdueForms(): Promise<void> {
  try {
    const now = new Date();

    // Find all ClientProposalAccess records with a past deadline
    // whose associated FormInstance is not COMPLETED and not already EXPIRED
    const overdueAccesses = await prisma.clientProposalAccess.findMany({
      where: {
        deadline: { lt: now },
        formInstance: {
          captureStatus: {
            notIn: [CaptureStatus.COMPLETED, CaptureStatus.EXPIRED],
          },
        },
      },
      include: { formInstance: true },
    });

    for (const access of overdueAccesses) {
      if (!access.formInstance) continue;

      await prisma.formInstance.update({
        where: { id: access.formInstance.id },
        data: { captureStatus: CaptureStatus.EXPIRED },
      });

      logger.info(
        `Form instance ${access.formInstance.id} for proposal ${access.proposal} marked as EXPIRED (deadline was ${access.deadline?.toISOString()})`,
      );
    }

    if (overdueAccesses.length > 0) {
      logger.info(`Expired ${overdueAccesses.length} overdue form instance(s)`);
    }
  } catch (err) {
    logger.error('Failed to expire overdue forms', { error: err });
  }
}

export function startSyncJob() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    logger.debug('Cron trigger: starting sync...');
    runSync().catch((err) => logger.error('Cron sync error', { error: err }));
    expireOverdueForms().catch((err) => logger.error('Cron expire error', { error: err }));
  });

  logger.info('Sheets sync cron job scheduled (every 5 minutes)');
}
