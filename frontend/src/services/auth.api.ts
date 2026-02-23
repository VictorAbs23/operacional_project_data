import api from './api';
import type { LoginInput, ChangePasswordInput, LoginResponse, AuthUser } from '@absolutsport/shared';

export const authApi = {
  login: (data: LoginInput) => api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
  changePassword: (data: ChangePasswordInput) => api.post('/auth/change-password', data).then((r) => r.data),
  me: () => api.get<AuthUser>('/auth/me').then((r) => r.data),
};
