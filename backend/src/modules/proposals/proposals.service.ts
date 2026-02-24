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
  const page = Math.max(1, Math.floor(filters.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(filters.pageSize || 20)));
  const skip = (page - 1) * pageSize;

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

  const selectFields = {
    id: true,
    proposal: true,
    clientName: true,
    clientEmail: true,
    game: true,
    hotel: true,
    status: true,
    seller: true,
    company: true,
    cellPhone: true,
    numberOfPax: true,
  } as const;

  // FAST PATH: no captureStatus filter → paginate at DB level
  if (!filters.status) {
    const [paginatedProposals, totalGroups] = await Promise.all([
      prisma.salesOrder.findMany({
        where: where as any,
        distinct: ['proposal'],
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: selectFields,
      }),
      // Count distinct proposals (lightweight - only fetches proposal strings)
      prisma.salesOrder.findMany({
        where: where as any,
        distinct: ['proposal'],
        select: { proposal: true },
      }),
    ]);

    const total = totalGroups.length;
    const proposalCodes = paginatedProposals.map((o) => o.proposal);

    // Aggregate totalPax per proposal
    const paxAgg = proposalCodes.length > 0
      ? await prisma.salesOrder.groupBy({
          by: ['proposal'],
          where: { proposal: { in: proposalCodes } },
          _sum: { numberOfPax: true },
        })
      : [];
    const paxMap = new Map(paxAgg.map((r) => [r.proposal, r._sum.numberOfPax || 0]));

    // Fetch accesses ONLY for the current page (small batch)
    const accesses = proposalCodes.length > 0
      ? await prisma.clientProposalAccess.findMany({
          where: { proposal: { in: proposalCodes } },
          include: { formInstance: true },
          orderBy: { dispatchedAt: 'desc' },
        })
      : [];

    const accessMap = new Map<string, typeof accesses[number]>();
    for (const access of accesses) {
      if (!accessMap.has(access.proposal)) {
        accessMap.set(access.proposal, access);
      }
    }

    const data: ProposalSummary[] = paginatedProposals.map((order) => {
      const access = accessMap.get(order.proposal);
      const fi = access?.formInstance;
      return {
        id: order.id,
        proposal: order.proposal,
        clientName: order.clientName,
        clientEmail: order.clientEmail,
        game: order.game,
        hotel: order.hotel,
        status: order.status,
        seller: order.seller,
        company: order.company,
        cellPhone: order.cellPhone,
        totalPax: paxMap.get(order.proposal) || 0,
        captureStatus: fi?.captureStatus || 'NOT_DISPATCHED',
        totalSlots: fi?.totalSlots || 0,
        filledSlots: fi?.filledSlots || 0,
        progressPercent: fi && fi.totalSlots > 0
          ? Math.round((fi.filledSlots / fi.totalSlots) * 100)
          : 0,
        deadline: access?.deadline?.toISOString() || null,
        dispatchedAt: access?.dispatchedAt?.toISOString() || null,
      };
    });

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // SLOW PATH: captureStatus filter requires cross-table join → in-memory pagination
  const allProposals = await prisma.salesOrder.findMany({
    where: where as any,
    distinct: ['proposal'],
    orderBy: { createdAt: 'desc' },
    select: selectFields,
  });

  const proposalCodes = allProposals.map((o) => o.proposal);

  const allAccesses = proposalCodes.length > 0
    ? await prisma.clientProposalAccess.findMany({
        where: { proposal: { in: proposalCodes } },
        include: { formInstance: true },
        orderBy: { dispatchedAt: 'desc' },
      })
    : [];

  const accessMap = new Map<string, typeof allAccesses[number]>();
  for (const access of allAccesses) {
    if (!accessMap.has(access.proposal)) {
      accessMap.set(access.proposal, access);
    }
  }

  // Aggregate totalPax per proposal (slow path)
  const paxAggSlow = proposalCodes.length > 0
    ? await prisma.salesOrder.groupBy({
        by: ['proposal'],
        where: { proposal: { in: proposalCodes } },
        _sum: { numberOfPax: true },
      })
    : [];
  const paxMapSlow = new Map(paxAggSlow.map((r) => [r.proposal, r._sum.numberOfPax || 0]));

  const allResults: ProposalSummary[] = [];
  for (const order of allProposals) {
    const access = accessMap.get(order.proposal);
    const fi = access?.formInstance;
    const captureStatus = fi?.captureStatus || 'NOT_DISPATCHED';

    if (captureStatus !== filters.status) continue;

    allResults.push({
      id: order.id,
      proposal: order.proposal,
      clientName: order.clientName,
      clientEmail: order.clientEmail,
      game: order.game,
      hotel: order.hotel,
      status: order.status,
      seller: order.seller,
      company: order.company,
      cellPhone: order.cellPhone,
      totalPax: paxMapSlow.get(order.proposal) || 0,
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

  const total = allResults.length;
  const paginatedData = allResults.slice(skip, skip + pageSize);

  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
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
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) return [];

  const salesOrders = await prisma.salesOrder.findMany({
    where: { proposal: order.proposal },
    orderBy: { lineNumber: 'asc' },
  });

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

  for (const slot of slots) {
    const answers = (slot.response?.answers ?? {}) as Record<string, string>;

    const matchedOrder = salesOrders.find(so =>
      slot.roomLabel.includes(so.hotel) || slot.roomLabel.includes(so.roomType)
    ) || salesOrders[0] || order;

    rows.push({
      proposal: matchedOrder.proposal,
      clientName: matchedOrder.clientName,
      clientEmail: matchedOrder.clientEmail,
      game: matchedOrder.game,
      hotel: matchedOrder.hotel,
      roomType: matchedOrder.roomType,
      checkIn: matchedOrder.checkIn,
      checkOut: matchedOrder.checkOut,
      ticketCategory: matchedOrder.ticketCategory,
      seller: matchedOrder.seller,
      status: matchedOrder.status,
      numberOfRooms: matchedOrder.numberOfRooms,
      numberOfPax: matchedOrder.numberOfPax,
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
      ticketStatus: answers.ticket_status || null,
      hotelConfirmation: answers.hotel_confirmation_number || null,
      flightLocator: answers.flight_locator || null,
      insuranceNumber: answers.insurance_number || null,
      transferReference: answers.transfer_reference || null,
      slotId: slot.id,
      slotStatus: slot.status,
    });
  }

  return rows;
}

export async function getFilterOptions(
  filters: { game?: string; hotel?: string; seller?: string } = {},
): Promise<{ games: string[]; hotels: string[]; sellers: string[] }> {
  // Each dimension is filtered by the OTHER active filters,
  // so the user only sees options that would return results.
  const baseWhere: Record<string, string> = {};
  if (filters.game) baseWhere.game = filters.game;
  if (filters.hotel) baseWhere.hotel = filters.hotel;
  if (filters.seller) baseWhere.seller = filters.seller;

  // For games: filter by hotel + seller (exclude game itself)
  const { game: _g, ...whereForGames } = baseWhere;
  // For hotels: filter by game + seller (exclude hotel itself)
  const { hotel: _h, ...whereForHotels } = baseWhere;
  // For sellers: filter by game + hotel (exclude seller itself)
  const { seller: _s, ...whereForSellers } = baseWhere;

  const [gamesRows, hotelsRows, sellersRows] = await Promise.all([
    prisma.salesOrder.findMany({
      where: whereForGames,
      distinct: ['proposal'],
      select: { game: true },
    }),
    prisma.salesOrder.findMany({
      where: whereForHotels,
      distinct: ['proposal'],
      select: { hotel: true },
    }),
    prisma.salesOrder.findMany({
      where: whereForSellers,
      distinct: ['proposal'],
      select: { seller: true },
    }),
  ]);

  const games = [...new Set(gamesRows.map((o) => o.game).filter(Boolean))].sort();
  const hotels = [...new Set(hotelsRows.map((o) => o.hotel).filter(Boolean))].sort();
  const sellers = [...new Set(sellersRows.map((o) => o.seller).filter(Boolean))].sort();

  return { games, hotels, sellers };
}

export async function getProposalById(id: string): Promise<ProposalSummary | null> {
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) return null;

  const [access, allLines] = await Promise.all([
    prisma.clientProposalAccess.findFirst({
      where: { proposal: order.proposal },
      include: { formInstance: true },
      orderBy: { dispatchedAt: 'desc' },
    }),
    prisma.salesOrder.findMany({
      where: { proposal: order.proposal },
      select: { numberOfPax: true },
    }),
  ]);

  const fi = access?.formInstance;
  const totalPax = allLines.reduce((sum, l) => sum + l.numberOfPax, 0);

  return {
    id: order.id,
    proposal: order.proposal,
    clientName: order.clientName,
    clientEmail: order.clientEmail,
    game: order.game,
    hotel: order.hotel,
    status: order.status,
    seller: order.seller,
    company: order.company,
    cellPhone: order.cellPhone,
    totalPax,
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
