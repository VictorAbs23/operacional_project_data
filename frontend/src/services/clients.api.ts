import api from './api';
import type { ClientSummary, ClientDetail, PaginatedResponse } from '@absolutsport/shared';

export const clientsApi = {
  list: (page = 1, pageSize = 20, search?: string) =>
    api.get<PaginatedResponse<ClientSummary>>('/clients', { params: { page, pageSize, search } }).then((r) => r.data),
  getById: (id: string) => api.get<ClientDetail>(`/clients/${id}`).then((r) => r.data),
  resetPassword: (id: string) => api.post<{ tempPassword: string }>(`/clients/${id}/reset-password`).then((r) => r.data),
  deactivate: (id: string) => api.post(`/clients/${id}/deactivate`).then((r) => r.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
};
