import { v2 as cloudinary } from 'cloudinary';

type CloudinaryCredentials = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

const ENV_NAME_PATTERN = /^CLOUDINARY_[A-Z_]+$/;
const CLOUD_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function validateCloudName(cloudName: string) {
  if (!cloudName) return 'CLOUDINARY_CLOUD_NAME is empty';
  if (ENV_NAME_PATTERN.test(cloudName)) {
    return `CLOUDINARY_CLOUD_NAME is set to "${cloudName}", which looks like an environment variable name`;
  }
  if (!CLOUD_NAME_PATTERN.test(cloudName)) {
    return 'CLOUDINARY_CLOUD_NAME may only contain letters, numbers, hyphens, and underscores';
  }

  return '';
}

function getCredentialsFromUrl(urlValue: string): CloudinaryCredentials | null {
  try {
    const parsed = new URL(urlValue);
    if (parsed.protocol !== 'cloudinary:') return null;

    return {
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password),
      cloud_name: parsed.hostname,
    };
  } catch {
    return null;
  }
}

function getCloudinaryCredentials(): {
  credentials: CloudinaryCredentials | null;
  error: string;
} {
  const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);
  const url = cleanEnv(process.env.CLOUDINARY_URL);

  if (cloudName || apiKey || apiSecret) {
    if (!cloudName || !apiKey || !apiSecret) {
      return {
        credentials: null,
        error: 'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must all be set',
      };
    }

    const cloudNameError = validateCloudName(cloudName);
    if (cloudNameError) return { credentials: null, error: cloudNameError };

    return {
      credentials: { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret },
      error: '',
    };
  }

  if (url) {
    const credentials = getCredentialsFromUrl(url);
    if (!credentials?.cloud_name || !credentials.api_key || !credentials.api_secret) {
      return {
        credentials: null,
        error: 'CLOUDINARY_URL must use cloudinary://<api_key>:<api_secret>@<cloud_name>',
      };
    }

    const cloudNameError = validateCloudName(credentials.cloud_name);
    if (cloudNameError) return { credentials: null, error: cloudNameError };

    return { credentials, error: '' };
  }

  return { credentials: null, error: 'Cloudinary environment variables are not set' };
}

function initCloudinary() {
  const { credentials } = getCloudinaryCredentials();
  if (credentials) cloudinary.config(credentials);
}

initCloudinary();

export const cloudinaryConfigError = getCloudinaryCredentials().error;
export const isCloudinaryConfigured = !cloudinaryConfigError;

export default cloudinary;
