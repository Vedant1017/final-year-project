import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { applyIdJson } from './jsonTransform.js';

const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    customerId: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: true }
);

applyIdJson(cartSchema);

export const CartModel = mongoose.model('Cart', cartSchema);
