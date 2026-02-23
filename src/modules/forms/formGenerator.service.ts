import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';

interface RoomAllocation {
  roomLabel: string;
  paxCount: number;
}

/**
 * Distributes PAX across rooms based on ROOM_TYPE.
 * E.g., 4 PAX with ROOM_TYPE "DOUBLE" → 2 rooms × 2 PAX each
 * E.g., 3 PAX with ROOM_TYPE "TRIPLE" → 1 room × 3 PAX
 * E.g., 5 PAX with ROOM_TYPE "SINGLE" → 5 rooms × 1 PAX each
 */
function distributeRooms(
  numberOfPax: number,
  numberOfRooms: number,
  roomType: string,
  hotel: string,
  checkIn: string,
): RoomAllocation[] {
  if (numberOfPax <= 0) return [];

  const rooms: RoomAllocation[] = [];

  if (numberOfRooms <= 0) {
    // Ticket-only: no room allocation, just PAX slots
    rooms.push({
      roomLabel: 'Ticket Only',
      paxCount: numberOfPax,
    });
    return rooms;
  }

  const paxPerRoom = Math.floor(numberOfPax / numberOfRooms);
  const remainder = numberOfPax % numberOfRooms;

  for (let i = 0; i < numberOfRooms; i++) {
    const extraPax = i < remainder ? 1 : 0;
    rooms.push({
      roomLabel: `${roomType.toUpperCase()} ${i + 1} | ${checkIn} | ${hotel}`,
      paxCount: paxPerRoom + extraPax,
    });
  }

  return rooms;
}

export async function generateFormInstance(
  accessId: string,
  proposal: string,
): Promise<string> {
  // Get all sales order lines for this proposal
  const salesOrders = await prisma.salesOrder.findMany({
    where: { proposal },
    orderBy: { lineNumber: 'asc' },
  });

  if (salesOrders.length === 0) {
    throw new Error(`No sales orders found for proposal ${proposal}`);
  }

  // Aggregate PAX and rooms across all lines for this proposal
  let totalSlots = 0;
  const allRooms: RoomAllocation[] = [];

  for (const order of salesOrders) {
    const rooms = distributeRooms(
      order.numberOfPax,
      order.numberOfRooms,
      order.roomType,
      order.hotel,
      order.checkIn,
    );
    allRooms.push(...rooms);
    totalSlots += order.numberOfPax;
  }

  // Create form instance with passenger slots
  const formInstance = await prisma.formInstance.create({
    data: {
      proposal,
      accessId,
      totalSlots,
      filledSlots: 0,
      passengerSlots: {
        create: allRooms.flatMap((room) =>
          Array.from({ length: room.paxCount }, (_, i) => ({
            roomLabel: room.roomLabel,
            slotIndex: i,
            status: 'PENDING',
          })),
        ),
      },
    },
  });

  logger.info(`Form instance created for proposal ${proposal}: ${totalSlots} slots in ${allRooms.length} rooms`);
  return formInstance.id;
}
