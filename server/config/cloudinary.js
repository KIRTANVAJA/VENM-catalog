import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import prisma from './db.js';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const defaultFolder = process.env.CLOUDINARY_FOLDER || 'venm-catalog/products';

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Generates secure, backend-signed upload parameters for direct browser uploads.
 * Cloudinary API Secret is NEVER returned to the client.
 */
export function generateSignedUploadParams(customFolder = null) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = customFolder || defaultFolder;

  // Parameters to sign must exactly match what the browser includes in the upload payload
  const paramsToSign = {
    folder,
    timestamp
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
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
