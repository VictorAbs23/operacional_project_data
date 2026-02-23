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
  rowsErrored: number;
}

export async function upsertSalesOrders(rows: SalesOrderRow[]): Promise<UpsertResult> {
  let rowsUpserted = 0;
  let rowsSkipped = 0;
  let rowsErrored = 0;

  // Filter out rows without a proposal
  const validRows = rows.filter((r) => r.proposal);
  rowsSkipped += rows.length - validRows.length;

  if (validRows.length === 0) {
    return { rowsUpserted, rowsSkipped, rowsErrored };
  }

  // BATCH: Fetch all existing hashes in a single query
  const uniqueKeys = validRows.map((r) => ({
    proposal: r.proposal,
    lineNumber: r.lineNumber,
  }));

  const existingRecords = await prisma.salesOrder.findMany({
    where: {
      OR: uniqueKeys.map((k) => ({
        proposal: k.proposal,
        lineNumber: k.lineNumber,
      })),
    },
    select: { proposal: true, lineNumber: true, rawHash: true },
  });

  // Build a lookup map: "proposal:lineNumber" -> rawHash
  const hashMap = new Map<string, string>();
  for (const rec of existingRecords) {
    hashMap.set(`${rec.proposal}:${rec.lineNumber}`, rec.rawHash);
  }

  // Determine which rows need upsert (hash changed or new)
  const toUpsert: { row: SalesOrderRow; rawHash: string }[] = [];

  for (const row of validRows) {
    const rawHash = computeHash(row.rawData);
    const existingHash = hashMap.get(`${row.proposal}:${row.lineNumber}`);

    if (existingHash === rawHash) {
      rowsSkipped++;
      continue;
    }

    toUpsert.push({ row, rawHash });
  }

  // BATCH upsert with per-row error handling
  for (const { row, rawHash } of toUpsert) {
    try {
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
    } catch (err) {
      rowsErrored++;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to upsert row: proposal=${row.proposal}, line=${row.lineNumber}`, { error: msg });
    }
  }

  logger.info(
    `Upsert complete: ${rowsUpserted} upserted, ${rowsSkipped} skipped, ${rowsErrored} errored (of ${rows.length} total)`,
  );
  return { rowsUpserted, rowsSkipped, rowsErrored };
}
