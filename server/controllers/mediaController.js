import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';
import {
  isCloudinaryConfigured,
  generateSignedUploadParams,
  safeDeleteCloudinaryAssetIfUnused,
  getCloudinaryDiagnostics
} from '../config/cloudinary.js';

export const getUploadSignature = async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      console.warn('[CLOUDINARY DIAGNOSTIC] Upload signature requested but Cloudinary is unconfigured.', {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      });
      return res.status(200).json({
        configured: false,
        message: 'Cloudinary credentials are not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.'
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
