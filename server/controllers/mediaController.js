import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';
import {
  isCloudinaryConfigured,
  getCloudinaryConfig,
  generateSignedUploadParams,
  safeDeleteCloudinaryAssetIfUnused,
  getCloudinaryDiagnostics
} from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadLocalMedia = async (req, res) => {
  try {
    const { data, filename, folder = 'collections' } = req.body;
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ message: 'No image data provided. Expected Base64 string.' });
    }

    // Parse data URL: e.g. "data:image/jpeg;base64,...."
    let base64String = data;
    let mimeType = 'image/jpeg';
    let extension = 'jpg';

    const matches = data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64String = matches[2];
      const subtype = mimeType.split('/')[1] || 'jpg';
      extension = subtype === 'jpeg' ? 'jpg' : subtype.replace(/[^a-zA-Z0-9]/g, '');
    }

    const buffer = Buffer.from(base64String, 'base64');
    if (buffer.length > 20 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size exceeds 20MB limit.' });
    }

    // Sanitize destination folder: e.g. 'collections', 'products', 'campaign'
    let rawFolder = (folder || 'collections').toLowerCase();
    if (rawFolder.includes('collection')) rawFolder = 'collections';
    else if (rawFolder.includes('product')) rawFolder = 'products';
    else if (rawFolder.includes('fest') || rawFolder.includes('campaign')) rawFolder = 'campaign';
    const safeFolder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'collections';

    const targetDir = path.join(__dirname, `../../public/assets/${safeFolder}`);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate safe clean filename
    const rawName = (filename || 'upload').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = `${rawName}_${Date.now()}.${extension}`;
    const filePath = path.join(targetDir, safeName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/assets/${safeFolder}/${safeName}`;

    try {
      await prisma.media.create({
        data: {
          name: filename || safeName,
          url: publicUrl,
          type: mimeType,
          size: `${(buffer.length / 1024).toFixed(1)} KB`
        }
      });
    } catch (e) {
      // Non-fatal if media table registry has a duplicate or error
    }

    console.log(`[LOCAL UPLOAD SUCCESS] Stored image at: ${publicUrl}`);

    res.status(201).json({
      success: true,
      secure_url: publicUrl,
      url: publicUrl,
      public_id: safeName,
      bytes: buffer.length,
      format: extension
    });
  } catch (error) {
    console.error('[LOCAL UPLOAD ERROR]', error);
    res.status(500).json({ message: 'LOCAL UPLOAD FAILED', error: error.message });
  }
};


export const getUploadSignature = async (req, res) => {
  try {
    const config = getCloudinaryConfig();
    const isSecretPlaceholder = config.apiSecret && [
      'cloudinary_api_secret',
      'your_api_secret',
      'your-api-secret',
      'api_secret',
      'secret'
    ].includes(config.apiSecret.toLowerCase());

    if (!isCloudinaryConfigured() || isSecretPlaceholder) {
      console.warn('[CLOUDINARY DIAGNOSTIC] Upload signature requested but Cloudinary is unconfigured or placeholder detected.', {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        isSecretPlaceholder
      });
      const message = isSecretPlaceholder
        ? 'In your Vercel Environment Variables, the value of CLOUDINARY_API_SECRET is currently set to the text "CLOUDINARY_API_SECRET" (the variable name itself) instead of your actual Cloudinary API secret. Please copy the 27-character secret from Cloudinary Console > Settings > Access Keys and update CLOUDINARY_API_SECRET in Vercel.'
        : 'Cloudinary credentials are not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.';
      return res.status(200).json({
        configured: false,
        isSecretPlaceholder: Boolean(isSecretPlaceholder),
        message
      });
    }

    const requestedFolder = req.query.folder || req.body?.folder || 'venm-catalog/products';
    const folder = typeof requestedFolder === 'string' ? requestedFolder.trim() : 'venm-catalog/products';
    const params = generateSignedUploadParams(folder);

    // Run safe diagnostics (strictly NO secrets logged or exposed)
    const shouldVerifyPing = req.query.verify === 'true' || req.query.diagnostic === 'true';
    const diagnostics = await getCloudinaryDiagnostics({ verifyPing: shouldVerifyPing });

    const isCloudNameSuspicious = params.cloudName === params.apiKey || /^\d+$/.test(params.cloudName);
    console.log('[CLOUDINARY DIAGNOSTIC] Upload signature generated successfully:', {
      cloudName: params.cloudName,
      isCloudNameSuspicious,
      apiKeyPrefix: params.apiKey ? `${params.apiKey.slice(0, 4)}...` : null,
      folder: params.folder,
      timestamp: params.timestamp,
      signaturePrefix: params.signature ? `${params.signature.slice(0, 6)}...` : null,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      secretLength: diagnostics?.secretDiagnostic?.length,
      pingStatus: diagnostics?.pingResult?.status
    });

    if (isCloudNameSuspicious) {
      console.warn('[CLOUDINARY WARNING] CLOUDINARY_CLOUD_NAME appears to be identical to CLOUDINARY_API_KEY or purely numeric. In Cloudinary, the cloud name is an account name/alias (e.g. "venm-store" or "dxyz123"), distinct from the 15-digit API key.');
    }

    res.json({
      configured: true,
      ...params,
      diagnostics,
      ...(isCloudNameSuspicious ? {
        warning: 'CLOUDINARY_CLOUD_NAME is identical to or formatted like CLOUDINARY_API_KEY. Please verify in your Cloudinary Dashboard under Settings > Access Keys that CLOUDINARY_CLOUD_NAME contains your account cloud name, not your 15-digit API key.'
      } : {})
    });
  } catch (error) {
    console.error('[CLOUDINARY DIAGNOSTIC] Failed to generate signature:', error.message);
    res.status(500).json({
      configured: false,
      message: 'FAILED TO GENERATE UPLOAD SIGNATURE',
      error: error.message
    });
  }
};

/**
 * Dedicated diagnostic endpoint for Admins to inspect Cloudinary connectivity
 * and configuration health without exposing credentials.
 */
export const getCloudinaryDiagnosticStatus = async (req, res) => {
  try {
    const diagnostics = await getCloudinaryDiagnostics({ verifyPing: true });
    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      configured: false,
      message: 'FAILED TO RUN CLOUDINARY DIAGNOSTIC',
      error: error.message
    });
  }
};

export const getMedia = async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH MEDIA', error: error.message });
  }
};

export const createMedia = async (req, res) => {
  try {
    const created = await prisma.media.create({
      data: req.body
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'MEDIA_UPLOADED',
      entityType: 'MEDIA',
      entityId: created.id,
      entityName: created.name,
      description: `Uploaded media asset "${created.name}"`
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO CREATE MEDIA ASSET', error: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.media.findUnique({ where: { id } });

    await prisma.media.delete({ where: { id } });

    // Safely cleanup from Cloudinary if unused elsewhere
    if (existing?.url) {
      await safeDeleteCloudinaryAssetIfUnused(existing.url);
    }

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'MEDIA_DELETED',
      entityType: 'MEDIA',
      entityId: id,
      description: `Deleted media asset ID "${id}"`
    });

    res.json({ message: 'MEDIA DELETED SUCCESSFULLY' });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO DELETE MEDIA ASSET', error: error.message });
  }
};
