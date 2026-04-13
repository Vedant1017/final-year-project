import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

export async function ensureDbInitialized() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
}
