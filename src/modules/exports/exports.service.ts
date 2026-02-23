import { prisma } from '../../config/database.js';
import type { SalesOrder } from '@prisma/client';
import dayjs from 'dayjs';

const UTF8_BOM = '\uFEFF';

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const str = String(v);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return UTF8_BOM + [toCsvRow(headers), ...rows.map(toCsvRow)].join('\n');
}

export async function generateExport(
  type: string,
  proposalId?: string,
): Promise<{ csv: string; filename: string }> {
  const date = dayjs().format('YYYY-MM-DD');

  switch (type) {
    case 'full_matrix':
      return generateFullMatrix(proposalId, date);
    case 'form_responses':
      return generateFormResponses(proposalId, date);
    case 'sales_log':
      return generateSalesLog(proposalId, date);
    case 'capture_status':
      return generateCaptureStatus(date);
    case 'pending_risk':
      return generatePendingRisk(date);
    case 'global_export':
      return generateGlobalExport(date);
    default:
      throw new Error(`Unknown export type: ${type}`);
  }
}

async function generateFullMatrix(proposalId: string | undefined, date: string) {
  const where = proposalId ? { proposal: proposalId } : {};
  const salesOrders = await prisma.salesOrder.findMany({ where: where as any, orderBy: { proposal: 'asc' } });

  const headers = [
    'PROPOSAL', 'CLIENT', 'GAME', 'HOTEL', 'ROOM_TYPE', 'PAX', 'CHECK_IN', 'CHECK_OUT',
    'TICKET_CAT', 'SELLER', 'STATUS',
    'PASSENGER_NAME', 'NATIONALITY', 'GENDER', 'DOC_TYPE', 'DOC_NUMBER',
    'DOC_COUNTRY', 'DOC_EXPIRY', 'BIRTH_DATE', 'PHONE', 'EMAIL', 'FAN_TEAM',
    'TICKET_STATUS', 'HOTEL_CONFIRMATION', 'FLIGHT_LOCATOR', 'INSURANCE_NUMBER', 'TRANSFER_REF',
  ];

  const rows: (string | number | null)[][] = [];

  for (const order of salesOrders) {
    const access = await prisma.clientProposalAccess.findFirst({
      where: { proposal: order.proposal },
      include: {
        formInstance: {
          include: {
            passengerSlots: { include: { response: true }, orderBy: { slotIndex: 'asc' } },
          },
        },
      },
    });

    const slots = access?.formInstance?.passengerSlots || [];
    if (slots.length === 0) {
      rows.push([
        order.proposal, order.clientName, order.game, order.hotel, order.roomType,
        order.numberOfPax, order.checkIn, order.checkOut, order.ticketCategory, order.seller, order.status,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      ]);
    } else {
      for (const slot of slots) {
        const a = (slot.response?.answers as Record<string, string>) || {};
        rows.push([
          order.proposal, order.clientName, order.game, order.hotel, order.roomType,
          order.numberOfPax, order.checkIn, order.checkOut, order.ticketCategory, order.seller, order.status,
          a.full_name || '', a.nationality || '', a.gender || '', a.document_type || '', a.document_number || '',
          a.document_issuing_country || '', a.document_expiry_date || '', a.birth_date || '',
          a.phone || '', a.email || '', a.fan_team || '',
          a.ticket_status || '', a.hotel_confirmation_number || '', a.flight_locator || '',
          a.insurance_number || '', a.transfer_reference || '',
        ]);
      }
    }
  }

  const prefix = proposalId || 'all';
  return { csv: toCsv(headers, rows), filename: `${prefix}_matriz_completa_${date}.csv` };
}

async function generateFormResponses(proposalId: string | undefined, date: string) {
  const headers = ['PROPOSAL', 'ROOM', 'NAME', 'NATIONALITY', 'GENDER', 'DOC_TYPE', 'DOC_NUMBER', 'DOC_COUNTRY', 'DOC_EXPIRY', 'BIRTH_DATE', 'PHONE', 'EMAIL', 'FAN_TEAM'];
  const rows: (string | number | null)[][] = [];

  const whereAccess = proposalId ? { proposal: proposalId } : {};
  const accesses = await prisma.clientProposalAccess.findMany({
    where: whereAccess,
    include: {
      formInstance: {
        include: {
          passengerSlots: { include: { response: true }, orderBy: { slotIndex: 'asc' } },
        },
      },
    },
  });

  for (const access of accesses) {
    for (const slot of access.formInstance?.passengerSlots || []) {
      const a = (slot.response?.answers as Record<string, string>) || {};
      rows.push([
        access.proposal, slot.roomLabel, a.full_name || '', a.nationality || '', a.gender || '',
        a.document_type || '', a.document_number || '', a.document_issuing_country || '',
        a.document_expiry_date || '', a.birth_date || '', a.phone || '', a.email || '', a.fan_team || '',
      ]);
    }
  }

  return { csv: toCsv(headers, rows), filename: `${proposalId || 'all'}_respostas_${date}.csv` };
}

async function generateSalesLog(proposalId: string | undefined, date: string) {
  const where = proposalId ? { proposal: proposalId } : {};
  const orders = await prisma.salesOrder.findMany({ where: where as any, orderBy: { proposal: 'asc' } });

  const headers = ['PROPOSAL', 'CLIENT', 'EMAIL', 'GAME', 'HOTEL', 'ROOM_TYPE', 'ROOMS', 'PAX', 'CHECK_IN', 'CHECK_OUT', 'TICKET_CAT', 'SELLER', 'STATUS'];
  const rows = orders.map((o: SalesOrder) => [
    o.proposal, o.clientName, o.clientEmail, o.game, o.hotel, o.roomType,
    o.numberOfRooms, o.numberOfPax, o.checkIn, o.checkOut, o.ticketCategory, o.seller, o.status,
  ]);

  return { csv: toCsv(headers, rows), filename: `${proposalId || 'all'}_sales_log_${date}.csv` };
}

async function generateCaptureStatus(date: string) {
  const headers = ['PROPOSAL', 'CLIENT', 'GAME', 'TOTAL_FORMS', 'FILLED_FORMS', 'PERCENT', 'STATUS', 'DEADLINE'];
  const rows: (string | number | null)[][] = [];

  const accesses = await prisma.clientProposalAccess.findMany({
    include: { formInstance: true },
    orderBy: { dispatchedAt: 'desc' },
  });

  for (const access of accesses) {
    const order = await prisma.salesOrder.findFirst({ where: { proposal: access.proposal } });
    const fi = access.formInstance;
    rows.push([
      access.proposal, order?.clientName || '', order?.game || '',
      fi?.totalSlots || 0, fi?.filledSlots || 0,
      fi && fi.totalSlots > 0 ? Math.round((fi.filledSlots / fi.totalSlots) * 100) : 0,
      fi?.captureStatus || 'NOT_DISPATCHED',
      access.deadline ? dayjs(access.deadline).format('YYYY-MM-DD') : '',
    ]);
  }

  return { csv: toCsv(headers, rows), filename: `capture_status_${date}.csv` };
}

async function generatePendingRisk(date: string) {
  const headers = ['PROPOSAL', 'CLIENT', 'EMAIL', 'GAME', 'PERCENT', 'STATUS', 'DEADLINE'];
  const rows: (string | number | null)[][] = [];

  const accesses = await prisma.clientProposalAccess.findMany({
    include: { formInstance: true },
  });

  for (const access of accesses) {
    const fi = access.formInstance;
    if (!fi || fi.captureStatus === 'COMPLETED') continue;

    const order = await prisma.salesOrder.findFirst({ where: { proposal: access.proposal } });
    const percent = fi.totalSlots > 0 ? Math.round((fi.filledSlots / fi.totalSlots) * 100) : 0;

    rows.push([
      access.proposal, order?.clientName || '', order?.clientEmail || '', order?.game || '',
      percent, fi.captureStatus,
      access.deadline ? dayjs(access.deadline).format('YYYY-MM-DD') : '',
    ]);
  }

  return { csv: toCsv(headers, rows), filename: `pending_risk_${date}.csv` };
}

async function generateGlobalExport(date: string) {
  return generateFullMatrix(undefined, date);
}
