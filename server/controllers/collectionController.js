import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const getCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    const formatted = await Promise.all(collections.map(async (c) => {
      const productCount = await prisma.product.count({
        where: {
          OR: [
            { collectionId: c.id },
            { collectionSlug: c.slug }
          ],
          availability: { not: 'DRAFT' }
        }
      });
      return {
        ...c,
        isActive: c.status === 'ACTIVE',
        productCount
      };
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH COLLECTIONS', error: error.message });
  }
};

export const getCollectionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const collection = await prisma.collection.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug },
          { slug: slug.toLowerCase() },
          { name: { equals: slug, mode: 'insensitive' } },
          { name: { equals: `${slug} edit`, mode: 'insensitive' } }
        ]
      }
    });

    if (!collection) {
      return res.status(404).json({ message: 'COLLECTION NOT FOUND' });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { collectionId: collection.id },
          { collectionSlug: collection.slug },
          { collectionSlug: slug }
        ]
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
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
      isActive: collection.status === 'ACTIVE',
      productCount: formattedProducts.length,
      products: formattedProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH COLLECTION DETAIL', error: error.message });
  }
};

export function normalizeImagePath(img) {
  if (!img || typeof img !== 'string') return '/assets/campaign/HOMEPAGE_2.webp';
  let cleaned = img.trim();

  // Strip wrapping quotes (single, double, escaped quotes)
  cleaned = cleaned.replace(/^["'\\]+|["'\\]+$/g, '').trim();
  cleaned = cleaned.replace(/^["']+|["']+$/g, '').trim();

  if (!cleaned) return '/assets/campaign/HOMEPAGE_2.webp';

  // Convert Windows backslashes to forward slashes
  cleaned = cleaned.replace(/\\/g, '/');

  // If already an absolute URL (HTTP/HTTPS/Data URI/protocol-relative), return as-is
  if (/^(https?:\/\/|data:image\/|\/\/)/i.test(cleaned)) {
    return cleaned;
  }

  // If user pasted a local file path containing /public/ (e.g. D:/projects/venm/public/assets/...),
  // extract the web path served relative to public root
  const publicIndex = cleaned.toLowerCase().indexOf('/public/');
  if (publicIndex !== -1) {
    cleaned = cleaned.slice(publicIndex + 7);
  }

  // Strip drive letter if present (e.g. D:/assets/... -> /assets/...)
  cleaned = cleaned.replace(/^[a-zA-Z]:\/?/, '/');

  // Ensure path starts with a leading slash for root-relative web asset resolution
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned;
  }

  return cleaned;
}

export const createCollection = async (req, res) => {
  try {
    const { name, slug, tagline, description, coverImage, season, status, featured, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'COLLECTION NAME IS REQUIRED' });
    }

    const resolvedStatus = status || (isActive === false ? 'COMING_SOON' : 'ACTIVE');
    const resolvedCoverImage = normalizeImagePath(coverImage);

    const created = await prisma.collection.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: tagline || '',
        description: description || '',
        coverImage: resolvedCoverImage,
        season: season || 'FESTIVE 2026',
        status: resolvedStatus,
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

    res.status(201).json({
      ...created,
      isActive: created.status === 'ACTIVE',
      productCount: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO CREATE COLLECTION', error: error.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const dataToUpdate = { ...req.body };
    delete dataToUpdate.id;
    delete dataToUpdate.products;
    delete dataToUpdate.productCount;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    if (dataToUpdate.isActive !== undefined && !dataToUpdate.status) {
      dataToUpdate.status = dataToUpdate.isActive ? 'ACTIVE' : 'COMING_SOON';
    }
    delete dataToUpdate.isActive;

    if (dataToUpdate.featured !== undefined) {
      dataToUpdate.featured = Boolean(dataToUpdate.featured);
    }

    if (dataToUpdate.coverImage) {
      dataToUpdate.coverImage = normalizeImagePath(dataToUpdate.coverImage);
    }

    const targetCol = await prisma.collection.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    });

    if (!targetCol) {
      return res.status(404).json({ message: 'COLLECTION NOT FOUND TO UPDATE' });
    }

    const updated = await prisma.collection.update({
      where: { id: targetCol.id },
      data: dataToUpdate
    });

    // Cascade name or slug changes to all products linked to this collection
    if (dataToUpdate.name || dataToUpdate.slug) {
      await prisma.product.updateMany({
        where: { collectionId: updated.id },
        data: {
          ...(dataToUpdate.name ? { collectionName: updated.name } : {}),
          ...(dataToUpdate.slug ? { collectionSlug: updated.slug } : {})
        }
      });
    }

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'COLLECTION_UPDATED',
      entityType: 'COLLECTION',
      entityId: updated.id,
      entityName: updated.name,
      description: `Updated collection "${updated.name}"`
    });

    const productCount = await prisma.product.count({
      where: {
        OR: [
          { collectionId: updated.id },
          { collectionSlug: updated.slug }
        ]
      }
    });

    res.json({
      ...updated,
      isActive: updated.status === 'ACTIVE',
      productCount
    });
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
