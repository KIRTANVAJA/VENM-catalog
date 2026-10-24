import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import prisma from './db.js';

dotenv.config();

/**
 * Sanitizes an environment variable value by trimming whitespace/newlines
 * and stripping surrounding single or double quotes commonly added by deployment dashboards.
 */
export function cleanEnvString(val) {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
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
  let cloudName = cleanEnvString(process.env.CLOUDINARY_CLOUD_NAME);
  let apiKey = cleanEnvString(process.env.CLOUDINARY_API_KEY);
  let apiSecret = cleanEnvString(process.env.CLOUDINARY_API_SECRET);
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
