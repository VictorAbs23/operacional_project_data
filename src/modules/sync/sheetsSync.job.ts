import cron from 'node-cron';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { fetchSalesLog, mapRowToSalesOrder } from './sheets.service.js';
import { upsertSalesOrders } from './salesOrder.service.js';

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
  } finally {
    isRunning = false;
  }
}

export function startSyncJob() {
  // Run every 1 minute
  cron.schedule('*/1 * * * *', () => {
    logger.debug('Cron trigger: starting sync...');
    runSync().catch((err) => logger.error('Cron sync error', { error: err }));
  });

  logger.info('Sheets sync cron job scheduled (every 1 minute)');
}
