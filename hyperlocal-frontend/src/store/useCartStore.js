import { create } from 'zustand';
import { api } from '../lib/api';
import { useAuthStore } from './useAuthStore';

export const useCartStore = create((set, get) => ({
  loading: false,
  items: [],

  refresh: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ items: [] });
      return;
    }
    set({ loading: true });
    try {
      const { data } = await api.get('/cart');
      set({ items: data.cart.items, loading: false });
    } catch {
      set({ loading: false });
      throw new Error('Failed to load cart');
    }
  },

  setQuantity: async (productId, quantity) => {
    if (!useAuthStore.getState().token) throw new Error('Not logged in');
    await api.post('/cart/items', { productId, quantity });
    await get().refresh();
  },

  clearLocal: () => set({ items: [] })
}));
