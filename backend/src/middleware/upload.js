import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { cloudinaryConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Validate both MIME type and file extension
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        'Invalid file type. Only JPEG, PNG, and WebP images are permitted (.jpg, .jpeg, .png, .webp)'
      ),
      false
    );
  }
};

// --- Storage strategy ---
// Production (Cloudinary configured): use memoryStorage so the buffer can be streamed to Cloudinary.
// Development (no Cloudinary vars):   use diskStorage for local serving via /uploads static route.

let storage;

if (cloudinaryConfigured) {
  // Buffers held in memory just long enough to stream to Cloudinary.
  storage = multer.memoryStorage();
} else {
  // Ensure upload directory exists inside backend directory
  const uploadDir = path.resolve(__dirname, '../../', env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Collision-resistant hex filenames with sanitized extension
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const randomHex = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${randomHex}${ext}`);
    }
  });
}

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 // 5 MB per file
  },
  fileFilter
});
