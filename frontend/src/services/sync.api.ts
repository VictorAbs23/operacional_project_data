import api from './api';
import type { SyncLogEntry, PaginatedResponse } from '@absolutsport/shared';

export const syncApi = {
  triggerSync: () => api.post('/sync/trigger').then((r) => r.data),
  getLogs: (page = 1, pageSize = 20) =>
    api.get<PaginatedResponse<SyncLogEntry>>('/sync/logs', { params: { page, pageSize } }).then((r) => r.data),
};
