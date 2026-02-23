import cron from 'node-cron';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { fetchSalesLog, mapRowToSalesOrder } from './sheets.service.js';
import { upsertSalesOrders } from './salesOrder.service.js';
import { AuditAction, CaptureStatus } from '@absolutsport/shared';

let isRunning = false;
let syncStartedAt: number = 0;

/** Retry a fn up to `retries` times on transient DB errors (P1001, P1002, P2024). */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isTransient = ['P1001', 'P1002', 'P2024'].includes(err?.code);
      if (!isTransient || attempt >= retries) throw err;
      const delay = 1000 * (attempt + 1);
      logger.warn(`Transient DB error (${err.code}), retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
const SYNC_TIMEOUT_MS = 5 * 60 * 1000; // 5 min safety timeout

export async function runSync(): Promise<{ rowsRead: number; rowsUpserted: number; rowsSkipped: number; rowsErrored: number } | null> {
  // Safety: reset isRunning if stuck for more than 5 minutes
  if (isRunning && Date.now() - syncStartedAt > SYNC_TIMEOUT_MS) {
    logger.warn('Sync appears stuck (>5 min), resetting isRunning flag');
    isRunning = false;
  }

  if (isRunning) {
    logger.warn('Sync already running, skipping...');
    return null;
  }

  isRunning = true;
  syncStartedAt = Date.now();

  // Create sync log entry (with retry for transient DB errors)
  const syncLog = await withRetry(() =>
    prisma.syncLog.create({ data: { status: 'RUNNING' } }),
  );

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
    logger.info(`Fetched ${rawRows.length} rows from Google Sheets`);

    const mappedRows = rawRows.map((row, i) => mapRowToSalesOrder(row, i + 1));

    // Upsert into database (batched, with per-row error handling + retry on transient errors)
    const { rowsUpserted, rowsSkipped, rowsErrored } = await withRetry(() => upsertSalesOrders(mappedRows));

    const elapsed = Date.now() - syncStartedAt;

    // Update sync log with success
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: rowsErrored > 0 ? 'PARTIAL' : 'SUCCESS',
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
          payload: { rowsRead: rawRows.length, rowsUpserted, rowsSkipped, rowsErrored, elapsedMs: elapsed },
        },
      });
    } catch (auditErr) {
      logger.error('Failed to write SYNC_COMPLETED audit log', { error: auditErr });
    }

    logger.info(`Sync completed in ${elapsed}ms: ${rawRows.length} read, ${rowsUpserted} upserted, ${rowsSkipped} skipped, ${rowsErrored} errored`);

    return { rowsRead: rawRows.length, rowsUpserted, rowsSkipped, rowsErrored };
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

    return null;
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
    const overdueAccesses = await withRetry(() => prisma.clientProposalAccess.findMany({
      where: {
        deadline: { lt: now },
        formInstance: {
          captureStatus: {
            notIn: [CaptureStatus.COMPLETED, CaptureStatus.EXPIRED],
          },
        },
      },
      include: { formInstance: true },
    }));

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
  // Run every 5 minutes — expire runs AFTER sync to avoid competing for DB connections
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Cron trigger: starting sync...');
    try {
      await runSync();
    } catch (err) {
      logger.error('Cron sync error', { error: err });
    }
    try {
      await expireOverdueForms();
    } catch (err) {
      logger.error('Cron expire error', { error: err });
    }
  });

  logger.info('Sheets sync cron job scheduled (every 5 minutes)');
}
