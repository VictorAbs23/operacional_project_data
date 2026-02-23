import api from './api';
import type { CreateUserInput, UpdateUserInput, AuthUser, PaginatedResponse } from '@absolutsport/shared';

export const usersApi = {
  list: (page = 1, pageSize = 20) =>
    api.get<PaginatedResponse<AuthUser>>('/users', { params: { page, pageSize } }).then((r) => r.data),
  getById: (id: string) => api.get<AuthUser>(`/users/${id}`).then((r) => r.data),
  create: (data: CreateUserInput) =>
    api.post<{ user: AuthUser; tempPassword?: string }>('/users', data).then((r) => r.data),
  update: (id: string, data: UpdateUserInput) => api.patch<AuthUser>(`/users/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => api.post(`/users/${id}/deactivate`).then((r) => r.data),
  resetPassword: (id: string) => api.post<{ tempPassword: string }>(`/users/${id}/reset-password`).then((r) => r.data),
};
