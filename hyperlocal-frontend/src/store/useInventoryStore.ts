import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface InventoryState {
  stockMap: Record<string, number>;
  socket: Socket | null;
  connectToShop: (shopId: string) => void;
  updateStock: (sku: string, newStock: number) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stockMap: {},
  socket: null,
  connectToShop: (shopId: string) => {
    // Connect to the backend monolith real-time gateway
    const newSocket = io('http://localhost:3001');
    
    newSocket.on('connect', () => {
      newSocket.emit('watchShop', shopId);
    });

    newSocket.on('stockUpdate', (data: { sku: string; newStock: number }) => {
      console.log('Real-time stock update received:', data);
      set((state) => ({
        stockMap: { ...state.stockMap, [data.sku]: data.newStock }
      }));
    });

    set({ socket: newSocket });
  },
  updateStock: (sku, newStock) => set((state) => ({
    stockMap: { ...state.stockMap, [sku]: newStock }
  }))
}));
