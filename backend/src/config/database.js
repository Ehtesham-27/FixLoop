import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: env.NODE_ENV !== 'production'
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    // In development or when MongoDB isn't running yet during scaffold check,
    // we log an informative error message instead of abruptly crashing unless in production.
    if (env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[Database] MongoDB disconnected');
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

