import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';
import { sanitizeImageArray } from '../utils/pathSanitizer.js';
import { safeDeleteCloudinaryAssetIfUnused } from '../config/cloudinary.js';

/**
 * Checks whether any image in the given array/string is a direct Base64 or Data URL.
 * Base64 payload embeddings are forbidden in product API routes to guarantee
 * that request sizes stay tiny and never cause Vercel FUNCTION_PAYLOAD_TOO_LARGE.
 */
function containsBase64Image(images) {
  if (!images) return false;
  let list = [];
  if (Array.isArray(images)) {
    list = images;
  } else if (typeof images === 'string') {
    if (images.trim().startsWith('[')) {
      try {
        list = JSON.parse(images);
      } catch (e) {
        list = [images];
      }
    } else {
      list = [images];
    }
  }

  return list.some((img) => {
    const raw = typeof img === 'string' ? img : (img?.secure_url || img?.url || '');
    if (!raw || typeof raw !== 'string') return false;
    const trimmed = raw.trim();
    return (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('data:application/') ||
      trimmed.startsWith('blob:') ||
      (trimmed.length > 2000 && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/'))
    );
  });
}

export const getProducts = async (req, res) => {
  try {
    const { collection, category, status, featured, search, gender, exact } = req.query;

    const conditions = [];

    // Gender / Target Audience Filtering
    if (gender && gender !== 'ALL') {
      const gUpper = gender.toUpperCase();
      const isExact = exact === 'true' || exact === true;

      if (gUpper === 'MEN') {
        if (isExact) {
          conditions.push({ gender: 'MEN' });
        } else {
          conditions.push({
            OR: [
              { gender: 'MEN' },
              { gender: 'UNISEX' }
            ]
          });
        }
      } else if (gUpper === 'WOMEN') {
        if (isExact) {
          conditions.push({ gender: 'WOMEN' });
        } else {
          conditions.push({
            OR: [
              { gender: 'WOMEN' },
              { gender: 'UNISEX' }
            ]
          });
        }
      } else if (gUpper === 'UNISEX') {
        conditions.push({ gender: 'UNISEX' });
      } else if (gUpper === 'UNCLASSIFIED') {
        conditions.push({
          OR: [
            { gender: 'UNCLASSIFIED' },
            { gender: null }
          ]
        });
      }
    }

    if (collection && collection !== 'ALL') {
      const foundCol = await prisma.collection.findFirst({
        where: {
          OR: [
            { slug: collection },
            { id: collection },
            { slug: collection.toLowerCase() },
            { name: { equals: collection, mode: 'insensitive' } },
            { name: { equals: `${collection} edit`, mode: 'insensitive' } }
          ]
        }
      });

      if (foundCol) {
        conditions.push({
          OR: [
            { collectionId: foundCol.id },
            { collectionSlug: foundCol.slug },
            { collectionSlug: collection },
            { collectionId: collection }
          ]
        });
      } else {
        conditions.push({
          OR: [
            { collectionSlug: collection },
            { collectionId: collection }
          ]
        });
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
      include: {
        collection: true
      },
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
      gender,
      description,
      details,
      collectionId,
      collectionSlug,
      collectionName,
      category,
      categoryId,
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

    // STRICT CHECK: Validate Gender / Target Audience
    const normalizedGender = (gender || '').trim().toUpperCase();
    if (!normalizedGender || !['MEN', 'WOMEN', 'UNISEX'].includes(normalizedGender)) {
      return res.status(400).json({
        message: 'TARGET AUDIENCE / GENDER IS REQUIRED: Please select Men, Women, or Unisex.'
      });
    }

    // STRICT CHECK: Reject any Base64 image payload
    if (containsBase64Image(images)) {
      return res.status(400).json({
        message: 'INVALID_IMAGE_PAYLOAD: Direct Base64 image data is not permitted. All images must be uploaded to Cloudinary storage and submitted as secure URLs.'
      });
    }

    let finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Resolve Collection foreign key & metadata
    let resolvedCollectionId = collectionId || null;
    let resolvedCollectionSlug = collectionSlug || null;
    let resolvedCollectionName = collectionName || null;

    if (resolvedCollectionId) {
      const col = await prisma.collection.findUnique({ where: { id: resolvedCollectionId } });
      if (col) {
        resolvedCollectionId = col.id;
        resolvedCollectionSlug = col.slug;
        resolvedCollectionName = col.name;
      }
    } else if (resolvedCollectionSlug) {
      const col = await prisma.collection.findFirst({
        where: {
          OR: [
            { slug: resolvedCollectionSlug },
            { id: resolvedCollectionSlug },
            { slug: resolvedCollectionSlug.toLowerCase() },
            { name: { equals: resolvedCollectionSlug, mode: 'insensitive' } },
            { name: { equals: `${resolvedCollectionSlug} edit`, mode: 'insensitive' } }
          ]
        }
      });
      if (col) {
        resolvedCollectionId = col.id;
        resolvedCollectionSlug = col.slug;
        resolvedCollectionName = col.name;
      }
    }

    const created = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        gender: normalizedGender,
        description: description || '',
        details: JSON.stringify(details || []),
        collectionId: resolvedCollectionId,
        collectionSlug: resolvedCollectionSlug,
        collectionName: resolvedCollectionName,
        category: category || 'Outerwear',
        categoryId: categoryId || null,
        images: JSON.stringify(sanitizeImageArray(images || [])),
        sizes: JSON.stringify(sizes || ['Custom']),
        availability: availability || 'REQUESTABLE',
        estimatedPrice: estimatedPrice || 'Estimated from ₹1,800',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        priceDisplayMode: priceDisplayMode || 'STARTING_FROM',
        customizationInfo: customizationInfo || 'Custom embroidery, fit adjustments, and design alterations available.',
        sizingInfo: sizingInfo || '100% bespoke made-to-measure. Crafted to your exact body measurements upon order commitment.',
        sourceAttribution: sourceAttribution || 'VENM Reference Design',
        isFeatured: Boolean(isFeatured),
        isNavratriEdit: Boolean(isNavratriEdit),
        tags: JSON.stringify(tags || []),
        garmentCare: garmentCare || ''
      },
      include: {
        collection: true
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

    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }]
      }
    });

    if (!existing) {
      return res.status(404).json({ message: 'PRODUCT NOT FOUND' });
    }

    // STRICT CHECK: Reject any Base64 image payload
    if (body.images !== undefined && containsBase64Image(body.images)) {
      return res.status(400).json({
        message: 'INVALID_IMAGE_PAYLOAD: Direct Base64 image data is not permitted. All images must be uploaded to Cloudinary storage and submitted as secure URLs.'
      });
    }

    const dataToUpdate = { ...body };
    delete dataToUpdate.id;
    delete dataToUpdate.collection;
    delete dataToUpdate.categoryObj;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    // Resolve & synchronize Collection relationship
    if (body.collectionId !== undefined || body.collectionSlug !== undefined) {
      let resolvedColId = body.collectionId;
      let resolvedColSlug = body.collectionSlug;
      let resolvedColName = body.collectionName;

      if (resolvedColId) {
        const col = await prisma.collection.findUnique({ where: { id: resolvedColId } });
        if (col) {
          resolvedColId = col.id;
          resolvedColSlug = col.slug;
          resolvedColName = col.name;
        }
      } else if (resolvedColSlug) {
        const col = await prisma.collection.findFirst({
          where: {
            OR: [
              { slug: resolvedColSlug },
              { id: resolvedColSlug },
              { slug: resolvedColSlug.toLowerCase() },
              { name: { equals: resolvedColSlug, mode: 'insensitive' } },
              { name: { equals: `${resolvedColSlug} edit`, mode: 'insensitive' } }
            ]
          }
        });
        if (col) {
          resolvedColId = col.id;
          resolvedColSlug = col.slug;
          resolvedColName = col.name;
        }
      }

      dataToUpdate.collectionId = resolvedColId || null;
      if (resolvedColSlug) dataToUpdate.collectionSlug = resolvedColSlug;
      if (resolvedColName) dataToUpdate.collectionName = resolvedColName;
    }

    if (!dataToUpdate.categoryId) delete dataToUpdate.categoryId;

    if (body.details && typeof body.details !== 'string') dataToUpdate.details = JSON.stringify(body.details);
    if (body.images !== undefined) dataToUpdate.images = JSON.stringify(sanitizeImageArray(body.images));
    if (body.sizes && typeof body.sizes !== 'string') dataToUpdate.sizes = JSON.stringify(body.sizes);
    if (body.tags && typeof body.tags !== 'string') dataToUpdate.tags = JSON.stringify(body.tags);
    if (body.isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(body.isFeatured);
    if (body.isNavratriEdit !== undefined) dataToUpdate.isNavratriEdit = Boolean(body.isNavratriEdit);

    if (body.gender !== undefined) {
      const normalizedGender = String(body.gender || '').trim().toUpperCase();
      if (!['MEN', 'WOMEN', 'UNISEX', 'UNCLASSIFIED'].includes(normalizedGender)) {
        return res.status(400).json({
          message: 'INVALID GENDER VALUE: Must be Men, Women, or Unisex.'
        });
      }
      dataToUpdate.gender = normalizedGender;
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
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

    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }]
      }
    });

    if (!existing) {
      return res.status(404).json({ message: 'PRODUCT NOT FOUND' });
    }

    const existingImages = typeof existing.images === 'string' ? JSON.parse(existing.images || '[]') : (existing.images || []);

    await prisma.product.delete({
      where: { id: existing.id }
    });

    // Safely cleanup Cloudinary images if unused by other entities
    for (const imgUrl of existingImages) {
      safeDeleteCloudinaryAssetIfUnused(imgUrl, existing.id).catch((err) => {
        console.warn(`[PRODUCT DELETE] Error checking asset "${imgUrl}":`, err.message);
      });
    }

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'PRODUCT_DELETED',
      entityType: 'PRODUCT',
      entityId: existing.id,
      entityName: existing.name,
      description: `Deleted product "${existing.name}" (${existing.id})`
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

    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ id: id }, { slug: id }]
      }
    });

    if (!existing) {
      return res.status(404).json({ message: 'PRODUCT NOT FOUND' });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
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
