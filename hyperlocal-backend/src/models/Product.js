import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { applyIdJson } from './jsonTransform.js';

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    price: { type: String, required: true },
    stock: { type: Number, required: true },
    shopId: { type: String, required: true, index: true },
    shopName: { type: String, default: null },
    imageUrl: { type: String, default: null }
  },
  { timestamps: true }
);

applyIdJson(productSchema);

export const ProductModel = mongoose.model('Product', productSchema);
