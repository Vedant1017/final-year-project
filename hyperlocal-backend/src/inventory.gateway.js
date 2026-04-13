export class InventoryGateway {
  constructor(io) {
    this.io = io;
    this.setupListeners();
  }

  setupListeners() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('watchShop', (shopId) => {
        socket.join(`shop-${shopId}`);
        console.log(`Socket ${socket.id} started watching shop-${shopId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  broadcastStockUpdate(shopId, sku, newStock) {
    this.io.to(`shop-${shopId}`).emit('stockUpdate', {
      sku,
      newStock,
      timestamp: new Date().toISOString()
    });
    console.log(`Broadcasted stock update for ${sku} at shop ${shopId} -> ${newStock}`);
  }
}
