import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import type { SalesOrderRow } from '@absolutsport/shared';

function computeHash(data: Record<string, unknown>): string {
  const json = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
}

interface UpsertResult {
  rowsUpserted: number;
  rowsSkipped: number;
}

export async function upsertSalesOrders(rows: SalesOrderRow[]): Promise<UpsertResult> {
  let rowsUpserted = 0;
  let rowsSkipped = 0;

  for (const row of rows) {
    if (!row.proposal) {
      rowsSkipped++;
      continue;
    }

    const rawHash = computeHash(row.rawData);

    // Check if record exists with the same hash
    const existing = await prisma.salesOrder.findUnique({
      where: {
        proposal_line_unique: {
          proposal: row.proposal,
          lineNumber: row.lineNumber,
        },
      },
      select: { rawHash: true },
    });

    if (existing && existing.rawHash === rawHash) {
      rowsSkipped++;
      continue;
    }

    // Upsert - data has changed or is new
    await prisma.salesOrder.upsert({
      where: {
        proposal_line_unique: {
          proposal: row.proposal,
          lineNumber: row.lineNumber,
        },
      },
      update: {
        status: row.status,
        clientName: row.clientName,
        clientEmail: row.clientEmail,
        game: row.game,
        hotel: row.hotel,
        roomType: row.roomType,
        numberOfRooms: row.numberOfRooms,
        numberOfPax: row.numberOfPax,
        checkIn: row.checkIn,
        checkOut: row.checkOut,
        ticketCategory: row.ticketCategory,
        seller: row.seller,
        rawData: row.rawData as any,
        rawHash,
        lastSyncedAt: new Date(),
      },
      create: {
        proposal: row.proposal,
        lineNumber: row.lineNumber,
        status: row.status,
        clientName: row.clientName,
        clientEmail: row.clientEmail,
        game: row.game,
        hotel: row.hotel,
        roomType: row.roomType,
        numberOfRooms: row.numberOfRooms,
        numberOfPax: row.numberOfPax,
        checkIn: row.checkIn,
        checkOut: row.checkOut,
        ticketCategory: row.ticketCategory,
        seller: row.seller,
        rawData: row.rawData as any,
        rawHash,
      },
    });

    rowsUpserted++;
  }

  logger.info(`Upsert complete: ${rowsUpserted} upserted, ${rowsSkipped} skipped`);
  return { rowsUpserted, rowsSkipped };
}
