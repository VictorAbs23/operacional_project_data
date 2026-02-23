import api from './api';
import type { DashboardStats } from '@absolutsport/shared';

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
};
