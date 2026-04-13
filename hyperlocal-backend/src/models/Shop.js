import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { applyIdJson } from './jsonTransform.js';

const { Schema } = mongoose;

const shopSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    shopType: { type: String, default: 'Grocery' },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '21:00' },
    ownerName: { type: String },
    contactPhone: { type: String }
  },
  { timestamps: true }
);

applyIdJson(shopSchema);

export const ShopModel = mongoose.model('Shop', shopSchema);
