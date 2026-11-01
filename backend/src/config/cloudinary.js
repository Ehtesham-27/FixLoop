import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

/**
 * Whether Cloudinary is configured via environment variables.
 * - true  → production mode: images are uploaded to Cloudinary and a secure_url is stored.
 * - false → development mode: images are stored on local disk and served via /uploads static route.
 */
export const cloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

export { cloudinary };

/**
 * Upload a file buffer to Cloudinary and return upload result.
 * @param {Buffer} buffer     File data from multer memoryStorage.
 * @param {string} originalName  Original file name for reference.
 * @param {string} mimeType   MIME type string (e.g. 'image/png').
 * @returns {Promise<object>} Cloudinary upload result with secure_url, public_id, bytes, format.
 */
export function uploadBufferToCloudinary(buffer, originalName, mimeType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'fixloop/tickets',
        resource_type: 'image',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        format: mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
}
