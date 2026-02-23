import { getAuthSheets } from '../../config/sheets.config.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type { SalesOrderRow } from '@absolutsport/shared';

interface SheetRow {
  [key: string]: string | number | null;
}

export async function fetchSalesLog(): Promise<SheetRow[]> {
  const sheets = await getAuthSheets();
  if (!sheets) {
    throw new Error('Google Sheets client not available');
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.SHEETS_SPREADSHEET_ID,
    range: 'World Cup',
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    return [];
  }

  // First row is headers
  const headers = rows[0].map((h: string) => String(h).trim());
  const dataRows = rows.slice(1);

  return dataRows.map((row: unknown[]) => {
    const obj: SheetRow = {};
    headers.forEach((header: string, i: number) => {
      obj[header] = row[i] !== undefined ? row[i] as string | number : null;
    });
    return obj;
  });
}

export function mapRowToSalesOrder(row: SheetRow, lineNumber: number): SalesOrderRow {
  const get = (key: string): string => {
    // Try exact match first, then case-insensitive
    if (row[key] !== undefined && row[key] !== null) return String(row[key]);
    const found = Object.keys(row).find((k) => k.toUpperCase() === key.toUpperCase());
    return found && row[found] !== undefined && row[found] !== null ? String(row[found]) : '';
  };

  const getNum = (key: string): number => {
    const val = get(key);
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  return {
    proposal: get('PROPOSAL') || get('PROPOSAL ID'),
    lineNumber: getNum('#') || lineNumber,
    status: get('STATUS'),
    clientName: get('CLIENT') || get('CLIENT NAME'),
    clientEmail: get('EMAIL') || get('CLIENT EMAIL'),
    game: get('GAME') || get('GAME DETAILS'),
    hotel: get('HOTEL'),
    roomType: get('ROOM TYPE') || get('ROOM_TYPE') || get('PRODUCT'),
    numberOfRooms: getNum('NUMBER OF ROOMS') || getNum('NUMBER OF TICKETS') || getNum('ROOMS') || getNum('TICKETS'),
    numberOfPax: getNum('NUMBER OF PAX') || getNum('PAX'),
    checkIn: get('CHECK IN') || get('CHECK_IN'),
    checkOut: get('CHECK OUT') || get('CHECK_OUT'),
    ticketCategory: get('TICKET CAT') || get('TICKET CATEGORY'),
    seller: get('SELLER'),
    rawData: row as Record<string, unknown>,
  };
}
