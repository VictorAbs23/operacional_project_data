import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@absolutsport/shared';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  validateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set({ user }),
      logout: () => {
        const token = get().token;
        if (token) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        set({ token: null, user: null });
      },
      isAuthenticated: () => !!get().token && !!get().user,
      validateSession: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            set({ token: null, user: null });
          }
        } catch {
          set({ token: null, user: null });
        }
      },
    }),
    {
      name: 'absolutsport-auth',
    },
  ),
);
