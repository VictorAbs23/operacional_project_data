import { prisma } from '../../config/database.js';
import type { ProposalSummary, PaginatedResponse } from '@absolutsport/shared';

interface ProposalFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  game?: string;
  hotel?: string;
  seller?: string;
  search?: string;
}

export async function listProposals(filters: ProposalFilters): Promise<PaginatedResponse<ProposalSummary>> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const skip = (page - 1) * pageSize;

  // Get unique proposals from sales_orders
  const where: Record<string, unknown> = {};
  if (filters.game) where.game = filters.game;
  if (filters.hotel) where.hotel = filters.hotel;
  if (filters.seller) where.seller = filters.seller;
  if (filters.search) {
    where.OR = [
      { proposal: { contains: filters.search, mode: 'insensitive' } },
      { clientName: { contains: filters.search, mode: 'insensitive' } },
      { clientEmail: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Get distinct proposals
  const proposals = await prisma.salesOrder.findMany({
    where: where as any,
    distinct: ['proposal'],
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
  });

  const totalOrders = await prisma.salesOrder.groupBy({
    by: ['proposal'],
    where: where as any,
  });

  const results: ProposalSummary[] = [];

  for (const order of proposals) {
    // Get form instance for this proposal
    const access = await prisma.clientProposalAccess.findFirst({
      where: { proposal: order.proposal },
      include: { formInstance: true },
      orderBy: { dispatchedAt: 'desc' },
    });

    const fi = access?.formInstance;
    const captureStatus = fi?.captureStatus || 'NOT_DISPATCHED';

    // Apply capture status filter
    if (filters.status && captureStatus !== filters.status) continue;

    results.push({
      id: order.id,
      proposal: order.proposal,
      clientName: order.clientName,
      clientEmail: order.clientEmail,
      game: order.game,
      hotel: order.hotel,
      status: order.status,
      captureStatus,
      totalSlots: fi?.totalSlots || 0,
      filledSlots: fi?.filledSlots || 0,
      progressPercent: fi && fi.totalSlots > 0
        ? Math.round((fi.filledSlots / fi.totalSlots) * 100)
        : 0,
      deadline: access?.deadline?.toISOString() || null,
      dispatchedAt: access?.dispatchedAt?.toISOString() || null,
    });
  }

  return {
    data: results,
    total: totalOrders.length,
    page,
    pageSize,
    totalPages: Math.ceil(totalOrders.length / pageSize),
  };
}

export interface MatrixRow {
  // Sales Log (blue) fields
  proposal: string;
  clientName: string;
  clientEmail: string;
  game: string;
  hotel: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  ticketCategory: string;
  seller: string;
  status: string;
  numberOfRooms: number;
  numberOfPax: number;
  // Passenger (green) fields
  roomLabel: string;
  slotIndex: number;
  passengerName: string | null;
  nationality: string | null;
  gender: string | null;
  documentType: string | null;
  documentNumber: string | null;
  issuingCountry: string | null;
  expiryDate: string | null;
  birthDate: string | null;
  fanTeam: string | null;
  phone: string | null;
  email: string | null;
  // Admin (yellow) fields
  ticketStatus: string | null;
  hotelConfirmation: string | null;
  flightLocator: string | null;
  insuranceNumber: string | null;
  transferReference: string | null;
  // Slot metadata
  slotId: string;
  slotStatus: string;
}

export async function getProposalMatrix(id: string): Promise<MatrixRow[]> {
  // 1. Find the SalesOrder by id
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) return [];

  // 2. Get all sales orders for this proposal
  const salesOrders = await prisma.salesOrder.findMany({
    where: { proposal: order.proposal },
    orderBy: { lineNumber: 'asc' },
  });

  // 3. Find the ClientProposalAccess for this proposal
  const access = await prisma.clientProposalAccess.findFirst({
    where: { proposal: order.proposal },
    include: {
      formInstance: {
        include: {
          passengerSlots: {
            include: { response: true },
            orderBy: [{ roomLabel: 'asc' }, { slotIndex: 'asc' }],
          },
        },
      },
    },
    orderBy: { dispatchedAt: 'desc' },
  });

  const slots = access?.formInstance?.passengerSlots ?? [];

  const rows: MatrixRow[] = [];

  // Use the first sales order for shared fields (or iterate if multiple)
  const baseOrder = salesOrders[0] ?? order;

  for (const slot of slots) {
    const answers = (slot.response?.answers ?? {}) as Record<string, string>;

    rows.push({
      // Sales Log (blue) fields
      proposal: baseOrder.proposal,
      clientName: baseOrder.clientName,
      clientEmail: baseOrder.clientEmail,
      game: baseOrder.game,
      hotel: baseOrder.hotel,
      roomType: baseOrder.roomType,
      checkIn: baseOrder.checkIn,
      checkOut: baseOrder.checkOut,
      ticketCategory: baseOrder.ticketCategory,
      seller: baseOrder.seller,
      status: baseOrder.status,
      numberOfRooms: baseOrder.numberOfRooms,
      numberOfPax: baseOrder.numberOfPax,
      // Passenger (green) fields
      roomLabel: slot.roomLabel,
      slotIndex: slot.slotIndex,
      passengerName: answers.full_name || null,
      nationality: answers.nationality || null,
      gender: answers.gender || null,
      documentType: answers.document_type || null,
      documentNumber: answers.document_number || null,
      issuingCountry: answers.document_issuing_country || null,
      expiryDate: answers.document_expiry_date || null,
      birthDate: answers.birth_date || null,
      fanTeam: answers.fan_team || null,
      phone: answers.phone || null,
      email: answers.email || null,
      // Admin (yellow) fields
      ticketStatus: answers.ticket_status || null,
      hotelConfirmation: answers.hotel_confirmation_number || null,
      flightLocator: answers.flight_locator || null,
      insuranceNumber: answers.insurance_number || null,
      transferReference: answers.transfer_reference || null,
      // Slot metadata
      slotId: slot.id,
      slotStatus: slot.status,
    });
  }

  return rows;
}

export async function getProposalById(id: string): Promise<ProposalSummary | null> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) return null;

  const access = await prisma.clientProposalAccess.findFirst({
    where: { proposal: order.proposal },
    include: { formInstance: true },
    orderBy: { dispatchedAt: 'desc' },
  });

  const fi = access?.formInstance;

  return {
    id: order.id,
    proposal: order.proposal,
    clientName: order.clientName,
    clientEmail: order.clientEmail,
    game: order.game,
    hotel: order.hotel,
    status: order.status,
    captureStatus: fi?.captureStatus || 'NOT_DISPATCHED',
    totalSlots: fi?.totalSlots || 0,
    filledSlots: fi?.filledSlots || 0,
    progressPercent: fi && fi.totalSlots > 0
      ? Math.round((fi.filledSlots / fi.totalSlots) * 100)
      : 0,
    deadline: access?.deadline?.toISOString() || null,
    dispatchedAt: access?.dispatchedAt?.toISOString() || null,
  };
}
