import './env-loader.js';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';
import { startSyncJob } from './modules/sync/sheetsSync.job.js';

async function connectWithRetry(retries = 5, delay = 3000): Promise<boolean> {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      logger.info('Database connected');
      return true;
    } catch (err) {
      logger.error(`Database connection attempt ${i}/${retries} failed`, { error: err });
      if (i < retries) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  return false;
}

async function main() {
  // Start server first so healthcheck can respond
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // Then connect to DB with retries
  const dbConnected = await connectWithRetry();
  if (!dbConnected) {
    logger.error('All database connection attempts failed. Server will stay up but DB-dependent routes will fail.');
  }

  // Start cron job for Google Sheets sync
  if (dbConnected && env.SHEETS_SPREADSHEET_ID) {
    startSyncJob();
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

main();
