import { prisma } from '../../config/database.js';
import type { DashboardStats } from '@absolutsport/shared';

export async function getStats(): Promise<DashboardStats> {
  // Single query: groupBy captureStatus to get counts + sums in 2 queries (instead of 5)
  const [statusGroups, aggregate] = await Promise.all([
    prisma.formInstance.groupBy({
      by: ['captureStatus'],
      _count: true,
    }),
    prisma.formInstance.aggregate({
      _sum: { totalSlots: true, filledSlots: true },
    }),
  ]);

  const countByStatus = new Map(statusGroups.map((g) => [g.captureStatus, g._count]));

  const totalDispatched = statusGroups.reduce((sum, g) => sum + g._count, 0);
  const notStarted = countByStatus.get('AWAITING_FILL') || 0;
  const inProgress = countByStatus.get('IN_PROGRESS') || 0;
  const completed = countByStatus.get('COMPLETED') || 0;

  const totalSlots = aggregate._sum.totalSlots || 0;
  const filledSlots = aggregate._sum.filledSlots || 0;
  const globalProgress = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  return {
    totalDispatched,
    notStarted,
    inProgress,
    completed,
    globalProgress,
  };
}
