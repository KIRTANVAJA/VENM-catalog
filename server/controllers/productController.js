import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const getProducts = async (req, res) => {
  try {
    const { collection, category, status, featured, search } = req.query;

    const conditions = [];

    if (collection && collection !== 'ALL') {
      if (collection === 'navratri') {
        conditions.push({
          OR: [
            { collectionSlug: 'navratri' },
            { isNavratriEdit: true }
          ]
        });
      } else {
        conditions.push({ collectionSlug: collection });
      }
    }

    if (category && category !== 'ALL') {
      conditions.push({ category });
    }

    if (status && status !== 'ALL') {
      conditions.push({ availability: status });
    } else if (!status) {
      // Public catalog: Exclude DRAFT items by default
      conditions.push({ availability: { not: 'DRAFT' } });
    }

    if (featured === 'true') {
      conditions.push({ isFeatured: true });
    }

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search } },
          { slug: { contains: search } },
          { category: { contains: search } }
        ]
      });
    }

    const whereClause = conditions.length > 0 ? { AND: conditions } : {};

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Parse JSON strings back to JavaScript arrays/objects
    const formatted = products.map((p) => ({
      ...p,
      details: typeof p.details === 'string' ? JSON.parse(p.details || '[]') : p.details,
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : p.images,
      sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes || '[]') : p.sizes,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : p.tags
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH PRODUCTS', error: error.message });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: slug }, { id: slug }]
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'PRODUCT NOT FOUND' });
    }

    const formatted = {
      ...product,
      details: typeof product.details === 'string' ? JSON.parse(product.details || '[]') : product.details,
      images: typeof product.images === 'string' ? JSON.parse(product.images || '[]') : product.images,
      sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes || '[]') : product.sizes,
      tags: typeof product.tags === 'string' ? JSON.parse(product.tags || '[]') : product.tags
    };

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH PRODUCT DETAIL', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      details,
      collectionSlug,
      collectionName,
      category,
      images,
      sizes,
      availability,
      estimatedPrice,
      minPrice,
      maxPrice,
      priceDisplayMode,
      customizationInfo,
      sizingInfo,
      sourceAttribution,
      isFeatured,
      isNavratriEdit,
      tags,
      garmentCare
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'REFERENCE NAME IS REQUIRED' });
    }

    let finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const created = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description: description || '',
        details: JSON.stringify(details || []),
        collectionSlug: collectionSlug || 'navratri',
        collectionName: collectionName || 'NAVRATRI EDIT',
        category: category || 'Outerwear',
        images: JSON.stringify(images || []),
        sizes: JSON.stringify(sizes || ['S', 'M', 'L', 'XL', 'Custom']),
        availability: availability || 'REQUESTABLE',
        estimatedPrice: estimatedPrice || 'Estimated from ₹1,800',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        priceDisplayMode: priceDisplayMode || 'STARTING_FROM',
        customizationInfo: customizationInfo || 'Custom embroidery, fit adjustments, and design alterations available.',
        sizingInfo: sizingInfo || 'Custom sizing available according to your requirements.',
        sourceAttribution: sourceAttribution || 'VENM Reference Design',
        isFeatured: Boolean(isFeatured),
        isNavratriEdit: Boolean(isNavratriEdit),
        tags: JSON.stringify(tags || []),
        garmentCare: garmentCare || ''
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: created.id,
      entityName: created.name,
      description: `Created reference "${created.name}" (${created.availability})`
    });

    const formattedCreated = {
      ...created,
      details: typeof created.details === 'string' ? JSON.parse(created.details || '[]') : created.details,
      images: typeof created.images === 'string' ? JSON.parse(created.images || '[]') : created.images,
      sizes: typeof created.sizes === 'string' ? JSON.parse(created.sizes || '[]') : created.sizes,
      tags: typeof created.tags === 'string' ? JSON.parse(created.tags || '[]') : created.tags
    };

    res.status(201).json(formattedCreated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO CREATE REFERENCE', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const dataToUpdate = { ...body };
    delete dataToUpdate.id;
    delete dataToUpdate.collection;
    delete dataToUpdate.categoryObj;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    if (!dataToUpdate.collectionId) delete dataToUpdate.collectionId;
    if (!dataToUpdate.categoryId) delete dataToUpdate.categoryId;

    if (body.details && typeof body.details !== 'string') dataToUpdate.details = JSON.stringify(body.details);
    if (body.images && typeof body.images !== 'string') dataToUpdate.images = JSON.stringify(body.images);
    if (body.sizes && typeof body.sizes !== 'string') dataToUpdate.sizes = JSON.stringify(body.sizes);
    if (body.tags && typeof body.tags !== 'string') dataToUpdate.tags = JSON.stringify(body.tags);
    if (body.isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(body.isFeatured);
    if (body.isNavratriEdit !== undefined) dataToUpdate.isNavratriEdit = Boolean(body.isNavratriEdit);

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'PRODUCT_UPDATED',
      entityType: 'PRODUCT',
      entityId: updated.id,
      entityName: updated.name,
      description: `Updated reference "${updated.name}"`
    });

    const formattedUpdated = {
      ...updated,
      details: typeof updated.details === 'string' ? JSON.parse(updated.details || '[]') : updated.details,
      images: typeof updated.images === 'string' ? JSON.parse(updated.images || '[]') : updated.images,
      sizes: typeof updated.sizes === 'string' ? JSON.parse(updated.sizes || '[]') : updated.sizes,
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags || '[]') : updated.tags
    };

    res.json(formattedUpdated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE REFERENCE', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'PRODUCT_DELETED',
      entityType: 'PRODUCT',
      entityId: id,
      description: `Deleted product ID "${id}"`
    });

    res.json({ message: 'PRODUCT DELETED SUCCESSFULLY' });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO DELETE PRODUCT', error: error.message });
  }
};

export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: { availability }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'PRODUCT_STATUS_CHANGED',
      entityType: 'PRODUCT',
      entityId: updated.id,
      entityName: updated.name,
      description: `Changed status of "${updated.name}" to ${availability}`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE STATUS', error: error.message });
  }
};
