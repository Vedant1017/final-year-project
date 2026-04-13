import { create } from 'zustand';
import { io } from 'socket.io-client';

export const useInventoryStore = create((set) => ({
  stockMap: {},
  socket: null,
  connectToShop: (shopId) => {
    const newSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      newSocket.emit('watchShop', shopId);
    });

    newSocket.on('stockUpdate', (data) => {
      console.log('Real-time stock update received:', data);
      set((state) => ({
        stockMap: { ...state.stockMap, [data.sku]: data.newStock }
      }));
    });

    set({ socket: newSocket });
  },
  updateStock: (sku, newStock) =>
    set((state) => ({
      stockMap: { ...state.stockMap, [sku]: newStock }
    }))
}));
