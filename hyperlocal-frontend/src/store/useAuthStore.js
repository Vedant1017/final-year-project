import { create } from 'zustand';
import { api, setAuthToken } from '../lib/api';

const storageKey = 'hyperlocal_auth';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  loading: false,
  error: null,

  hydrate: () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const token = parsed.token ?? null;
      set({ token, user: parsed.user ?? null });
      setAuthToken(token);
    } catch {
      // ignore
    }
  },

  /** Refresh user from server (e.g. after admin approves seller). */
  refreshProfile: async () => {
    const token = get().token;
    if (!token) return null;
    try {
      const { data } = await api.get('auth/me');
      const user = data.user;
      set({ user });
      localStorage.setItem(storageKey, JSON.stringify({ token, user }));
      return user;
    } catch {
      return null;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('auth/login', { email: email.trim().toLowerCase(), password });
      setAuthToken(data.token);
      set({ token: data.token, user: data.user, loading: false });
      localStorage.setItem(storageKey, JSON.stringify({ token: data.token, user: data.user }));
      return data.user;
    } catch (e) {
      set({ loading: false, error: e?.message ?? 'Login failed' });
      throw e;
    }
  },

  signup: async (email, password, accountType) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('auth/signup', {
        email,
        password,
        accountType
      });
      setAuthToken(data.token);
      set({ token: data.token, user: data.user, loading: false });
      localStorage.setItem(storageKey, JSON.stringify({ token: data.token, user: data.user }));
      return data.user;
    } catch (e) {
      set({ loading: false, error: e?.message ?? 'Sign up failed' });
      throw e;
    }
  },

  updateLocation: async (lat, lng, address) => {
    try {
      const { data } = await api.post('auth/location', { lat, lng, address });
      const user = data.user;
      set({ user });
      const token = get().token;
      localStorage.setItem(storageKey, JSON.stringify({ token, user }));
      return user;
    } catch (e) {
      throw e;
    }
  },

  logout: () => {
    setAuthToken(null);
    set({ token: null, user: null, error: null });
    localStorage.removeItem(storageKey);
  }
}));
