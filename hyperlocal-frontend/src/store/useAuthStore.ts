import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export type UserRole = 'CUSTOMER' | 'OWNER';
export type AuthUser = { id: string; email: string; role: UserRole };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const storageKey = 'hyperlocal_auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  loading: false,
  error: null,

  hydrate: () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      set({ token: parsed.token ?? null, user: parsed.user ?? null });
    } catch {
      // ignore
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ success: boolean; token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      set({ token: data.token, user: data.user, loading: false });
      localStorage.setItem(storageKey, JSON.stringify({ token: data.token, user: data.user }));
      return data.user;
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Login failed' });
      throw e;
    }
  },

  logout: () => {
    set({ token: null, user: null, error: null });
    localStorage.removeItem(storageKey);
  }
}));

