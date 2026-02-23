import { prisma } from '../../config/database.js';
import type { DashboardStats } from '@absolutsport/shared';

export async function getStats(): Promise<DashboardStats> {
  // Count form instances by capture status
  const [totalDispatched, notStarted, inProgress, completed] = await Promise.all([
    prisma.formInstance.count(),
    prisma.formInstance.count({ where: { captureStatus: 'AWAITING_FILL' } }),
    prisma.formInstance.count({ where: { captureStatus: 'IN_PROGRESS' } }),
    prisma.formInstance.count({ where: { captureStatus: 'COMPLETED' } }),
  ]);

  // Global progress: total filled slots / total slots
  const aggregate = await prisma.formInstance.aggregate({
    _sum: {
      totalSlots: true,
      filledSlots: true,
    },
  });

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
