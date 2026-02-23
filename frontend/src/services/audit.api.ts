import api from './api';
import type { PaginatedResponse } from '@absolutsport/shared';

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string | null;
  userRole: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  ipAddress: string | null;
  payload: Record<string, unknown> | null;
  user?: { name: string; email: string } | null;
}

export const auditApi = {
  list: (params: { page?: number; pageSize?: number; action?: string; userId?: string }) =>
    api.get<PaginatedResponse<AuditEntry>>('/audit', { params }).then((r) => r.data),
};
