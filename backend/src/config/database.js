import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;
let listenersRegistered = false;

function maskUri(uri) {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return '***';
  }
}

function registerConnectionListeners() {
  if (listenersRegistered) return;

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[Database] MongoDB connection established.');
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error(`[Database] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database] MongoDB disconnected.');
  });

  listenersRegistered = true;
}

export async function connectDatabase() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  registerConnectionListeners();

  try {
    console.log(`[Database] Connecting to MongoDB (${maskUri(env.MONGODB_URI)})...`);
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      autoIndex: env.NODE_ENV !== 'production'
    });
    isConnected = true;
    console.log(`[Database] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    console.error(`[Database] Failed to connect to MongoDB: ${error.message}`);
    if (env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      isConnected = false;
      console.log('[Database] MongoDB connection closed gracefully.');
    } catch (err) {
      console.error(`[Database] Error during disconnect: ${err.message}`);
    }
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
