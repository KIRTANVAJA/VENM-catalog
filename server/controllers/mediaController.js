import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

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
    await prisma.media.delete({ where: { id } });

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
