import { prisma } from '../../config/database.js';
import { hashPassword } from '../../utils/hash.js';
import { generateTempPassword } from '../../utils/token.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { ClientSummary, ClientDetail, ClientDetailProposal, PaginatedResponse } from '@absolutsport/shared';

export async function listClients(
  page = 1,
  pageSize = 20,
  search?: string,
): Promise<PaginatedResponse<ClientSummary>> {
  const skip = (page - 1) * pageSize;

  const where: any = { role: 'CLIENT' };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        proposalAccess: {
          include: {
            formInstance: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data: ClientSummary[] = users.map((user) => {
    let totalSlots = 0;
    let filledSlots = 0;
    let lastAccessAt: string | null = null;

    for (const access of user.proposalAccess) {
      if (access.formInstance) {
        totalSlots += access.formInstance.totalSlots;
        filledSlots += access.formInstance.filledSlots;
      }
      const accessDate = access.dispatchedAt.toISOString();
      if (!lastAccessAt || accessDate > lastAccessAt) {
        lastAccessAt = accessDate;
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      totalProposals: user.proposalAccess.length,
      totalSlots,
      filledSlots,
      progressPercent: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
      lastAccessAt,
    };
  });

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getClientById(id: string): Promise<ClientDetail> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      proposalAccess: {
        include: {
          formInstance: true,
        },
      },
    },
  });

  if (!user || user.role !== 'CLIENT') {
    throw new AppError('Client not found', 404);
  }

  // Build proposals with sales order data
  const proposals: ClientDetailProposal[] = [];
  let totalSlots = 0;
  let filledSlots = 0;
  let completedProposals = 0;
  let inProgressProposals = 0;
  let pendingProposals = 0;

  for (const access of user.proposalAccess) {
    // Get sales order info for this proposal
    const salesOrder = await prisma.salesOrder.findFirst({
      where: { proposal: access.proposal },
    });

    const fi = access.formInstance;
    const slots = fi?.totalSlots ?? 0;
    const filled = fi?.filledSlots ?? 0;
    const captureStatus = fi?.captureStatus ?? 'NOT_DISPATCHED';
    const progress = slots > 0 ? Math.round((filled / slots) * 100) : 0;

    totalSlots += slots;
    filledSlots += filled;

    if (captureStatus === 'COMPLETED') completedProposals++;
    else if (captureStatus === 'IN_PROGRESS') inProgressProposals++;
    else pendingProposals++;

    proposals.push({
      accessId: access.id,
      proposal: access.proposal,
      game: salesOrder?.game ?? '',
      hotel: salesOrder?.hotel ?? '',
      captureStatus,
      totalSlots: slots,
      filledSlots: filled,
      progressPercent: progress,
      deadline: access.deadline?.toISOString() ?? null,
      dispatchedAt: access.dispatchedAt.toISOString(),
      seller: salesOrder?.seller ?? '',
    });
  }

  const globalProgress = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    profilePhotoUrl: user.profilePhotoUrl,
    proposals,
    stats: {
      totalProposals: user.proposalAccess.length,
      totalSlots,
      filledSlots,
      progressPercent: globalProgress,
      completedProposals,
      inProgressProposals,
      pendingProposals,
    },
  };
}

export async function deactivateClient(id: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'CLIENT') {
    throw new AppError('Client not found', 404);
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function deleteClient(id: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'CLIENT') {
    throw new AppError('Client not found', 404);
  }

  // Collect IDs outside the transaction for fast bulk deletes
  const accesses = await prisma.clientProposalAccess.findMany({
    where: { userId: id },
    select: { id: true },
  });
  const accessIds = accesses.map((a) => a.id);

  const formInstances = await prisma.formInstance.findMany({
    where: { accessId: { in: accessIds } },
    select: { id: true },
  });
  const formInstanceIds = formInstances.map((f) => f.id);

  const slots = await prisma.passengerSlot.findMany({
    where: { formInstanceId: { in: formInstanceIds } },
    select: { id: true },
  });
  const slotIds = slots.map((s) => s.id);

  await prisma.$transaction([
    // 1. Delete form responses
    prisma.formResponse.deleteMany({
      where: { passengerSlotId: { in: slotIds } },
    }),
    // 2. Delete passenger slots
    prisma.passengerSlot.deleteMany({
      where: { formInstanceId: { in: formInstanceIds } },
    }),
    // 3. Delete form instances
    prisma.formInstance.deleteMany({
      where: { accessId: { in: accessIds } },
    }),
    // 4. Delete proposal accesses
    prisma.clientProposalAccess.deleteMany({
      where: { userId: id },
    }),
    // 5. Disconnect audit logs (preserve trail)
    prisma.auditLog.updateMany({
      where: { userId: id },
      data: { userId: null },
    }),
    // 6. Delete the user
    prisma.user.delete({ where: { id } }),
  ]);
}

export async function resetClientPassword(id: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'CLIENT') {
    throw new AppError('Client not found', 404);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });

  return tempPassword;
}
