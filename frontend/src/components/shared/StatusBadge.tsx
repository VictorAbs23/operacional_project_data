import { Badge } from '../ui/Badge';
import { useLanguageStore } from '../../stores/languageStore';

interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { variant: 'completed' | 'inProgress' | 'notStarted' | 'expired' | 'active' | 'draft' | 'closed' | 'info'; key: string }> = {
  COMPLETED: { variant: 'completed', key: 'status.completed' },
  IN_PROGRESS: { variant: 'inProgress', key: 'status.inProgress' },
  AWAITING_FILL: { variant: 'notStarted', key: 'status.notStarted' },
  NOT_DISPATCHED: { variant: 'draft', key: 'status.pending' },
  EXPIRED: { variant: 'expired', key: 'status.expired' },
  CONFIRMED: { variant: 'active', key: 'status.confirmed' },
  CANCELED: { variant: 'closed', key: 'status.canceled' },
  PENDING: { variant: 'notStarted', key: 'status.pending' },
  FILLED: { variant: 'completed', key: 'status.completed' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useLanguageStore((s) => s.t);
  const mapped = statusMap[status] || { variant: 'info' as const, key: status };

  return <Badge variant={mapped.variant}>{t(mapped.key)}</Badge>;
}
