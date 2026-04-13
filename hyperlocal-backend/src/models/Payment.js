import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { applyIdJson } from './jsonTransform.js';

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    orderId: { type: String, required: true, index: true },
    customerId: { type: String, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: String, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    method: { type: String }
  },
  { timestamps: true }
);

applyIdJson(paymentSchema);

export const PaymentModel = mongoose.model('Payment', paymentSchema);
