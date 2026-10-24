import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';
import {
  isCloudinaryConfigured,
  generateSignedUploadParams,
  safeDeleteCloudinaryAssetIfUnused
} from '../config/cloudinary.js';

export const getUploadSignature = async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(200).json({
        configured: false,
        message: 'Cloudinary credentials are not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.'
      });
    }

    const folder = req.query.folder || req.body?.folder || 'venm-catalog/products';
    const params = generateSignedUploadParams(folder);

    res.json({
      configured: true,
      ...params
    });
  } catch (error) {
    res.status(500).json({
      configured: false,
      message: 'FAILED TO GENERATE UPLOAD SIGNATURE',
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
