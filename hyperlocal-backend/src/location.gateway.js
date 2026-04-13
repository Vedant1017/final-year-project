import { OrderModel } from './models/Order.js';

export class LocationGateway {
  constructor(io) {
    this.io = io;
    this.setupListeners();
  }

  setupListeners() {
    this.io.on('connection', (socket) => {
      socket.on('watchDelivery', (deliveryManId) => {
        if (!deliveryManId) return;
        socket.join(`delivery-${deliveryManId}`);
        console.log(`Socket ${socket.id} started watching delivery-${deliveryManId}`);
      });

      socket.on('updateLocation', (data) => {
        const { deliveryManId, lat, lng } = data;
        if (!deliveryManId || !lat || !lng) return;
        
        // Broadcast to users watching this delivery man
        this.io.to(`delivery-${deliveryManId}`).emit('locationUpdate', {
          deliveryManId,
          lat,
          lng,
          timestamp: new Date().toISOString()
        });
      });
    });
  }
}
