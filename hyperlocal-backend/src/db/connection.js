import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

export async function ensureDbInitialized() {
  if (mongoose.connection.readyState === 1) return;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    throw err;
  }
}
