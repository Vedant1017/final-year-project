import { create } from 'zustand';
import { apiFetch } from '../lib/api';
import { useAuthStore } from './useAuthStore';

export type CartProduct = { id: string; sku: string; name: string; price: string; stock: number; shopId: string };
export type CartItem = { id: string; productId: string; quantity: number; product: CartProduct | null };

type CartState = {
  loading: boolean;
  items: CartItem[];
  refresh: () => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  clearLocal: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
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
      const data = await apiFetch<{ success: boolean; cart: { items: CartItem[] } }>('/cart', { token });
      set({ items: data.cart.items, loading: false });
    } catch {
      set({ loading: false });
      throw new Error('Failed to load cart');
    }
  },

  setQuantity: async (productId, quantity) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('Not logged in');
    await apiFetch('/cart/items', { token, method: 'POST', body: { productId, quantity } });
    await get().refresh();
  },

  clearLocal: () => set({ items: [] })
}));

