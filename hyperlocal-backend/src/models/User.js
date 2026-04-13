import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { applyIdJson } from './jsonTransform.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['CUSTOMER', 'OWNER', 'ADMIN', 'DELIVERY_MAN'], required: true },
    /** false = seller signed up, waiting for admin approval (OWNER only). */
    sellerApproved: { type: Boolean, default: true },
    locationPrompted: { type: Boolean, default: false },
    location: {
      type: {
        address: String,
        lat: Number,
        lng: Number
      },
      default: null
    }
  },
  { timestamps: true }
);

applyIdJson(userSchema);

export const UserModel = mongoose.model('User', userSchema);
