import { v2 as cloudinary } from 'cloudinary';

/**
 * Initialise Cloudinary configuration.
 * Supports two ways of providing credentials:
 *   1. Single `CLOUDINARY_URL` env var (e.g. cloudinary://<api_key>:<api_secret>@<cloud_name>)
 *   2. Separate vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const url = process.env.CLOUDINARY_URL;

  // If full URL is supplied, cloudinary library parses it automatically
  if (url) {
    cloudinary.config({ cloud_name: '', api_key: '', api_secret: '' }); // will be overridden by URL parsing
    cloudinary.config({ cloud_name: undefined, api_key: undefined, api_secret: undefined }); // ensure reset
    // cloudinary library reads CLOUDINARY_URL automatically when config() is called with no args
    cloudinary.config();
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  } else {
    // No configuration – callers should check isConfigured before using
  }
}

// Initialise on module load
initCloudinary();

/** Helper to check whether cloudinary is correctly configured */
export const isCloudinaryConfigured = !!(
  (process.env.CLOUDINARY_URL) ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

export default cloudinary;
