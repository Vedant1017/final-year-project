import { Server } from 'socket.io';

export class InventoryGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupListeners();
  }

  private setupListeners() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Customers will subscribe to shops they are viewing
      socket.on('watchShop', (shopId: string) => {
        socket.join(`shop-${shopId}`);
        console.log(`Socket ${socket.id} started watching shop-${shopId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Called when stock is updated via an order or manually by shopkeeper
  broadcastStockUpdate(shopId: string, sku: string, newStock: number) {
    this.io.to(`shop-${shopId}`).emit('stockUpdate', {
      sku,
      newStock,
      timestamp: new Date().toISOString()
    });
    console.log(`Broadcasted stock update for ${sku} at shop ${shopId} -> ${newStock}`);
  }
}
