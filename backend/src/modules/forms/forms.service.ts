import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function getFormInstance(accessId: string) {
  const access = await prisma.clientProposalAccess.findUnique({
    where: { accessToken: accessId },
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
  });

  if (!access || !access.formInstance) {
    throw new AppError('Form not found', 404);
  }

  const fi = access.formInstance;

  // Get proposal info from sales_orders
  const salesOrders = await prisma.salesOrder.findMany({
    where: { proposal: access.proposal },
    take: 1,
  });

  const order = salesOrders[0];

  return {
    accessId: access.accessToken,
    proposal: access.proposal,
    game: order?.game || '',
    hotel: order?.hotel || '',
    captureStatus: fi.captureStatus,
    totalSlots: fi.totalSlots,
    filledSlots: fi.filledSlots,
    deadline: access.deadline,
    slots: fi.passengerSlots.map((slot: (typeof fi.passengerSlots)[number]) => ({
      id: slot.id,
      roomLabel: slot.roomLabel,
      slotIndex: slot.slotIndex,
      status: slot.status,
      passengerName: slot.response?.answers
        ? (slot.response.answers as Record<string, string>).full_name || null
        : null,
    })),
  };
}

export async function getPassengerSlot(slotId: string) {
  const slot = await prisma.passengerSlot.findUnique({
    where: { id: slotId },
    include: { response: true },
  });

  if (!slot) {
    throw new AppError('Passenger slot not found', 404);
  }

  return {
    id: slot.id,
    roomLabel: slot.roomLabel,
    slotIndex: slot.slotIndex,
    status: slot.status,
    response: slot.response
      ? { answers: slot.response.answers, submittedAt: slot.response.submittedAt }
      : null,
  };
}

export async function savePassengerResponse(
  slotId: string,
  answers: Record<string, unknown>,
  userId?: string,
) {
  const slot = await prisma.passengerSlot.findUnique({
    where: { id: slotId },
    include: { formInstance: true },
  });

  if (!slot) {
    throw new AppError('Passenger slot not found', 404);
  }

  // Upsert response
  await prisma.formResponse.upsert({
    where: { passengerSlotId: slotId },
    update: {
      answers: answers as any,
      submittedBy: userId,
    },
    create: {
      passengerSlotId: slotId,
      answers: answers as any,
      submittedBy: userId,
    },
  });

  // Update slot status
  await prisma.passengerSlot.update({
    where: { id: slotId },
    data: { status: 'FILLED' },
  });

  // Recalculate filled slots
  const filledCount = await prisma.passengerSlot.count({
    where: {
      formInstanceId: slot.formInstanceId,
      status: 'FILLED',
    },
  });

  const fi = slot.formInstance;
  const newStatus =
    filledCount === fi.totalSlots
      ? 'COMPLETED'
      : filledCount > 0
        ? 'IN_PROGRESS'
        : 'AWAITING_FILL';

  await prisma.formInstance.update({
    where: { id: fi.id },
    data: {
      filledSlots: filledCount,
      captureStatus: newStatus,
    },
  });

  return { status: 'saved', filledSlots: filledCount, totalSlots: fi.totalSlots };
}

export async function getClientProposals(userId: string) {
  const accesses = await prisma.clientProposalAccess.findMany({
    where: { userId },
    include: {
      formInstance: true,
    },
    orderBy: { dispatchedAt: 'desc' },
  });

  const results = [];

  for (const access of accesses) {
    const salesOrders = await prisma.salesOrder.findMany({
      where: { proposal: access.proposal },
      take: 1,
    });

    const order = salesOrders[0];
    const fi = access.formInstance;

    results.push({
      accessId: access.accessToken,
      proposal: access.proposal,
      game: order?.game || '',
      hotel: order?.hotel || '',
      captureStatus: fi?.captureStatus || 'AWAITING_FILL',
      totalSlots: fi?.totalSlots || 0,
      filledSlots: fi?.filledSlots || 0,
      progressPercent: fi && fi.totalSlots > 0 ? Math.round((fi.filledSlots / fi.totalSlots) * 100) : 0,
      deadline: access.deadline,
    });
  }

  return results;
}
