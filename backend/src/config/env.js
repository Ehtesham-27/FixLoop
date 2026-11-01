import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root if it exists
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixloop',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_change_in_production_32chars_min',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_change_in_production_32chars_min',
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),

  // Optional seed variables for first-time account initialization
  INITIAL_ADMIN_NAME: process.env.INITIAL_ADMIN_NAME || '',
  INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL ? process.env.INITIAL_ADMIN_EMAIL.trim().toLowerCase() : '',
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD || '',

  INITIAL_TECH_NAME: process.env.INITIAL_TECH_NAME || '',
  INITIAL_TECH_EMAIL: process.env.INITIAL_TECH_EMAIL ? process.env.INITIAL_TECH_EMAIL.trim().toLowerCase() : '',
  INITIAL_TECH_PASSWORD: process.env.INITIAL_TECH_PASSWORD || ''
};

export function validateEnv() {
  if (envSchema.NODE_ENV === 'production') {
    const requiredInProd = [
      'MONGODB_URI',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'CLIENT_ORIGIN'
    ];
    const missing = requiredInProd.filter(
      (key) => !process.env[key] || process.env[key].startsWith('dev_') || process.env[key].startsWith('replace_')
    );
    if (missing.length > 0) {
      throw new Error(`Production environment missing required secure variables: ${missing.join(', ')}`);
    }
  }
  return envSchema;
}

export const env = envSchema;
