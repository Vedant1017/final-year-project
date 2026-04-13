import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { applyIdJson } from './jsonTransform.js';

const { Schema } = mongoose;

const orderItemSubSchema = new Schema(
  {
    productId: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    customerId: { type: String, required: true, index: true },
    shopId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PAID', 'PLACED', 'PACKING', 'OUT_FOR_DELIVERY', 'FULFILLED', 'DELIVERED', 'CANCELLED'],
      required: true
    },
    paymentId: { type: String, default: null },
    paymentMethod: { type: String, default: null },
    pickupSlot: { type: Date, default: null },
    totalAmount: { type: String, required: true },
    items: { type: [orderItemSubSchema], default: [] },
    deliveryDetails: {
      type: {
        name: String,
        phone: String,
        email: String,
        address: String,
        lat: Number,
        lng: Number
      },
      default: null
    },
    deliveryManId: { type: String, default: null },
    chats: {
      type: [
        {
          senderId: String,
          senderRole: String,
          text: String,
          timestamp: { type: Date, default: Date.now }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

applyIdJson(orderSchema);

export const OrderModel = mongoose.model('Order', orderSchema);
