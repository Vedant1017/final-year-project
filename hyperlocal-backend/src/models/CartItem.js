import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { applyIdJson } from './jsonTransform.js';

const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    cartId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    quantity: { type: Number, required: true }
  },
  { timestamps: true }
);

cartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });

applyIdJson(cartItemSchema);

export const CartItemModel = mongoose.model('CartItem', cartItemSchema);
