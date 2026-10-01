import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH CATEGORIES', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, status, displayOrder } = req.body;
    const created = await prisma.category.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description || '',
        status: status || 'Active',
        displayOrder: displayOrder || 0
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'CATEGORY_CREATED',
      entityType: 'CATEGORY',
      entityId: created.id,
      entityName: created.name,
      description: `Created category "${created.name}"`
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO CREATE CATEGORY', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.category.update({
      where: { id },
      data: req.body
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'CATEGORY_UPDATED',
      entityType: 'CATEGORY',
      entityId: updated.id,
      entityName: updated.name,
      description: `Updated category "${updated.name}"`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE CATEGORY', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'CATEGORY_DELETED',
      entityType: 'CATEGORY',
      entityId: id,
      description: `Deleted category ID "${id}"`
    });

    res.json({ message: 'CATEGORY DELETED SUCCESSFULLY' });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO DELETE CATEGORY', error: error.message });
  }
};
