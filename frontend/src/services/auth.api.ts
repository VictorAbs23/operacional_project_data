import api from './api';
import type { LoginInput, ChangePasswordInput, ForgotPasswordInput, LoginResponse, AuthUser } from '@absolutsport/shared';

export const authApi = {
  login: (data: LoginInput) => api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
  changePassword: (data: ChangePasswordInput) => api.post('/auth/change-password', data).then((r) => r.data),
  me: () => api.get<AuthUser>('/auth/me').then((r) => r.data),
  forgotPassword: (data: ForgotPasswordInput) => api.post('/auth/forgot-password', data).then((r) => r.data),
  resetPassword: (data: { token: string; newPassword: string; confirmPassword: string }) =>
    api.post('/auth/reset-password', data).then((r) => r.data),
};
