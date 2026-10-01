import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const getCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH COLLECTIONS', error: error.message });
  }
};

export const getCollectionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const collection = await prisma.collection.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      }
    });

    if (!collection) {
      return res.status(404).json({ message: 'COLLECTION NOT FOUND' });
    }

    const products = await prisma.product.findMany({
      where: { collectionSlug: collection.slug }
    });

    const formattedProducts = products.map((p) => ({
      ...p,
      details: typeof p.details === 'string' ? JSON.parse(p.details || '[]') : p.details,
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes || '[]') : p.sizes,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : p.tags
    }));

    res.json({
      ...collection,
      products: formattedProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH COLLECTION DETAIL', error: error.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { name, slug, tagline, description, coverImage, season, status, featured } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'COLLECTION NAME IS REQUIRED' });
    }

    const created = await prisma.collection.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: tagline || '',
        description: description || '',
        coverImage: coverImage || '/assets/campaign/HOMEPAGE_2.webp',
        season: season || 'FESTIVE 2026',
        status: status || 'ACTIVE',
        featured: Boolean(featured)
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'COLLECTION_CREATED',
      entityType: 'COLLECTION',
      entityId: created.id,
      entityName: created.name,
      description: `Created collection "${created.name}"`
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO CREATE COLLECTION', error: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.collection.update({
      where: { id },
      data: req.body
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'COLLECTION_UPDATED',
      entityType: 'COLLECTION',
      entityId: updated.id,
      entityName: updated.name,
      description: `Updated collection "${updated.name}"`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE COLLECTION', error: error.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.collection.delete({
      where: { id }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'COLLECTION_DELETED',
      entityType: 'COLLECTION',
      entityId: id,
      description: `Deleted collection ID "${id}"`
    });

    res.json({ message: 'COLLECTION DELETED SUCCESSFULLY' });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO DELETE COLLECTION', error: error.message });
  }
};
