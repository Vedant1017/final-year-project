import { OrderModel } from './models/Order.js';

export class ChatGateway {
  constructor(io) {
    this.io = io;
    this.setupListeners();
  }

  setupListeners() {
    this.io.on('connection', (socket) => {
      socket.on('joinOrderChat', (orderId) => {
        if (!orderId) return;
        socket.join(`order-chat-${orderId}`);
        console.log(`Socket ${socket.id} joined chat for order ${orderId}`);
      });

      socket.on('sendMessage', async (data) => {
        const { orderId, senderId, senderRole, text } = data;
        if (!orderId || !senderId || !text) return;

        try {
          const timestamp = new Date();
          const message = { senderId, senderRole, text, timestamp };

          // Persist to DB
          await OrderModel.findByIdAndUpdate(orderId, {
            $push: { chats: message }
          });

          // Broadcast to everyone in the chat room (including sender)
          this.io.to(`order-chat-${orderId}`).emit('newMessage', {
            orderId,
            ...message
          });
        } catch (error) {
          console.error('Failed to save chat message:', error);
        }
      });
    });
  }
}
