import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import crypto from 'crypto';
import prisma from './db.js';

dotenv.config();

/**
 * Sanitizes an environment variable value by trimming whitespace/newlines,
 * stripping surrounding single or double quotes commonly added by deployment dashboards,
 * and removing accidental key prefixes (e.g. KEY=value).
 */
export function cleanEnvString(val, keyName = null) {
  if (!val || typeof val !== 'string') return '';
  let cleaned = val.replace(/[\r\n\t]/g, '').trim();
  // Strip surrounding quotes (double or single)
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  // Strip variable name prefix if accidentally included in Vercel value field
  if (keyName && cleaned.startsWith(`${keyName}=`)) {
    cleaned = cleaned.slice(keyName.length + 1).trim();
    cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  }
  const genericPrefixes = [
    'CLOUDINARY_API_SECRET=',
    'CLOUDINARY_API_KEY=',
    'CLOUDINARY_CLOUD_NAME=',
    'CLOUDINARY_URL=',
    'api_secret=',
    'api_key=',
    'cloud_name='
  ];
  for (const prefix of genericPrefixes) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.slice(prefix.length).trim();
      cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
      break;
    }
  }
  return cleaned;
}

/**
 * Parses a standard Cloudinary URL (e.g. cloudinary://api_key:api_secret@cloud_name)
 */
export function parseCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const cleaned = cleanEnvString(url);
  try {
    const match = cleaned.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) {
      return {
        apiKey: cleanEnvString(match[1]),
        apiSecret: cleanEnvString(match[2]),
        cloudName: cleanEnvString(match[3]).split('/')[0]
      };
    }
  } catch (e) {
    // Ignore parsing error
  }
  return null;
}

/**
 * Dynamically resolves, cleans, and validates Cloudinary credentials from either
 * individual environment variables or a CLOUDINARY_URL connection string.
 */
export function getCloudinaryConfig() {
  let cloudName = cleanEnvString(process.env.CLOUDINARY_CLOUD_NAME, 'CLOUDINARY_CLOUD_NAME');
  let apiKey = cleanEnvString(process.env.CLOUDINARY_API_KEY, 'CLOUDINARY_API_KEY');
  let apiSecret = cleanEnvString(process.env.CLOUDINARY_API_SECRET, 'CLOUDINARY_API_SECRET');
  let defaultFolder = cleanEnvString(process.env.CLOUDINARY_FOLDER) || 'venm-catalog/products';

  // Fallback: If any key is missing, check CLOUDINARY_URL
  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (parsed) {
      if (!cloudName) cloudName = parsed.cloudName;
      if (!apiKey) apiKey = parsed.apiKey;
      if (!apiSecret) apiSecret = parsed.apiSecret;
    }
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    defaultFolder
  };
}

/**
 * Checks if Cloudinary is fully and validly configured.
 */
export function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
}

/**
 * Synchronizes the Cloudinary SDK configuration with current clean credentials.
 */
export function syncCloudinarySdkConfig() {
  const config = getCloudinaryConfig();
  if (config.cloudName && config.apiKey && config.apiSecret) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true
    });
    return true;
  }
  return false;
}

// Initial synchronization on module import
syncCloudinarySdkConfig();

/**
 * Generates secure, backend-signed upload parameters for direct browser uploads.
 * Cloudinary API Secret is NEVER returned to the client.
 *
 * Parameters signed:
 * - folder: exactly 'venm-catalog/products' (or permitted subfolder)
 * - timestamp: current integer unix epoch in seconds
 */
export function generateSignedUploadParams(customFolder = null) {
  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    const missing = [];
    if (!config.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!config.apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!config.apiSecret) missing.push('CLOUDINARY_API_SECRET');
    throw new Error(
      `Cloudinary credentials not configured. Please set ${missing.join(', ')} in environment variables.`
    );
  }

  // Ensure SDK is configured with the clean values
  syncCloudinarySdkConfig();

  // Fresh integer timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000);

  // Normalize folder name: trim, remove leading/trailing slashes
  const rawFolder = customFolder || config.defaultFolder || 'venm-catalog/products';
  const folder = cleanEnvString(rawFolder).replace(/^\/+|\/+$/g, '') || 'venm-catalog/products';

  // Cloudinary expects alphabetical sorting of parameters to sign.
  // Exactly matching what the browser sends: folder, timestamp
  const paramsToSign = {
    folder,
    timestamp
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    config.apiSecret
  );

  return {
    signature,
    timestamp,
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    folder
  };
}

/**
 * Safe Cloudinary diagnostics for debugging signature or credentials mismatches.
 * CRITICAL: NEVER logs or returns the raw API secret.
 */
export async function getCloudinaryDiagnostics(options = {}) {
  const { verifyPing = false } = options;
  const config = getCloudinaryConfig();
  const rawSecret = config.apiSecret || '';
  const rawEnvSecret = process.env.CLOUDINARY_API_SECRET || '';

  let pingResult = { ok: null, status: 'Not performed', error: null };
  if (verifyPing && config.cloudName && config.apiKey && rawSecret) {
    syncCloudinarySdkConfig();
    try {
      const res = await cloudinary.api.ping();
      pingResult = {
        ok: true,
        status: res?.status || 'ok',
        message: 'Cloudinary credentials verified successfully!'
      };
    } catch (err) {
      pingResult = {
        ok: false,
        status: 'failed',
        error: err?.error?.message || err?.message || 'Verification failed',
        httpCode: err?.error?.http_code || err?.http_code || 401
      };
    }
  }

  const sha256 = rawSecret
    ? crypto.createHash('sha256').update(rawSecret).digest('hex')
    : null;

  return {
    configured: Boolean(config.cloudName && config.apiKey && rawSecret),
    cloudName: config.cloudName || null,
    apiKey: config.apiKey || null,
    apiKeyPrefix: config.apiKey ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-3)}` : null,
    folder: config.defaultFolder,
    secretDiagnostic: {
      isConfigured: Boolean(rawSecret),
      length: rawSecret.length,
      isStandardLength27: rawSecret.length === 27,
      mask: rawSecret.length >= 6
        ? `${rawSecret.slice(0, 2)}***${rawSecret.slice(-2)}`
        : (rawSecret.length > 0 ? '***' : 'empty'),
      sha256Prefix: sha256 ? sha256.slice(0, 8) : null,
      isSameAsApiKey: Boolean(rawSecret && rawSecret === config.apiKey),
      isSameAsCloudName: Boolean(rawSecret && rawSecret === config.cloudName),
      hasWhitespace: /\s/.test(rawEnvSecret),
      hasQuotes: /^["'].*["']$/.test(rawEnvSecret.trim()),
      hasPrefix: /^(CLOUDINARY|api_secret|secret)/i.test(rawEnvSecret.trim()),
      hasEqualSign: rawEnvSecret.includes('=')
    },
    sources: {
      hasCloudNameEnv: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      hasApiKeyEnv: Boolean(process.env.CLOUDINARY_API_KEY),
      hasApiSecretEnv: Boolean(process.env.CLOUDINARY_API_SECRET),
      hasCloudinaryUrlEnv: Boolean(process.env.CLOUDINARY_URL)
    },
    pingResult
  };
}

/**
 * Extracts the Cloudinary public_id from a Cloudinary secure_url.
 */
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return null;
  }

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.substring(uploadIndex + 8);
    // Strip version prefix if present (e.g. v1234567890/)
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');

    // Strip extension
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }

    return pathAfterUpload || null;
  } catch (e) {
    return null;
  }
}

/**
 * Checks if an image is in use by any OTHER product, media item, collection, or campaign.
 * If unused, safely deletes the asset from Cloudinary.
 */
export async function safeDeleteCloudinaryAssetIfUnused(imageUrl, excludeProductId = null) {
  if (!isCloudinaryConfigured() || !imageUrl) return;

  const publicId = extractCloudinaryPublicId(imageUrl);
  if (!publicId) return;

  try {
    // Check if other products reference this image
    const otherProducts = await prisma.product.findMany({
      where: {
        AND: [
          excludeProductId ? { id: { not: excludeProductId } } : {},
          { images: { contains: imageUrl } }
        ]
      },
      select: { id: true }
    });

    if (otherProducts.length > 0) {
      console.log(`[CLOUDINARY CLEANUP] Skipping deletion of "${publicId}": in use by ${otherProducts.length} other product(s).`);
      return;
    }

    // Check collections
    const collectionsUsing = await prisma.collection.findFirst({
      where: { coverImage: imageUrl },
      select: { id: true }
    });
    if (collectionsUsing) {
      console.log(`[CLOUDINARY CLEANUP] Skipping deletion of "${publicId}": in use as collection cover.`);
      return;
    }

    // Check campaigns
    const campaignsUsing = await prisma.campaign.findFirst({
      where: { image: imageUrl },
      select: { id: true }
    });
    if (campaignsUsing) {
      console.log(`[CLOUDINARY CLEANUP] Skipping deletion of "${publicId}": in use by campaign.`);
      return;
    }

    // Check media registry
    const mediaUsing = await prisma.media.findFirst({
      where: { url: imageUrl },
      select: { id: true }
    });
    if (mediaUsing) {
      console.log(`[CLOUDINARY CLEANUP] Skipping deletion of "${publicId}": referenced in media registry.`);
      return;
    }

    // If completely unused, destroy from Cloudinary
    console.log(`[CLOUDINARY CLEANUP] Deleting orphaned asset "${publicId}" from Cloudinary...`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[CLOUDINARY CLEANUP] Cloudinary destruction result for "${publicId}":`, result);
  } catch (err) {
    console.warn(`[CLOUDINARY CLEANUP] Safe delete skipped or failed for "${imageUrl}":`, err.message);
  }
}

export default cloudinary;
