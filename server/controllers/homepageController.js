import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const getHomepageSections = async (req, res) => {
  try {
    const sections = await prisma.homepageSection.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    const formatted = sections.map((s) => ({
      ...s,
      content: typeof s.content === 'string' ? JSON.parse(s.content || '{}') : s.content
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH HOMEPAGE SECTIONS', error: error.message });
  }
};

export const updateHomepageSections = async (req, res) => {
  try {
    const { sectionKey, content, enabled, displayOrder } = req.body;

    if (!sectionKey) {
      return res.status(400).json({ message: 'SECTION KEY IS REQUIRED' });
    }

    const updated = await prisma.homepageSection.upsert({
      where: { sectionKey },
      update: {
        content: typeof content === 'object' ? JSON.stringify(content) : content,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0
      },
      create: {
        sectionKey,
        name: sectionKey.toUpperCase().replace('_', ' '),
        content: typeof content === 'object' ? JSON.stringify(content) : content,
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'HOMEPAGE_UPDATED',
      entityType: 'HOMEPAGE',
      entityId: sectionKey,
      description: `Updated homepage section "${sectionKey}"`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE HOMEPAGE SECTION', error: error.message });
  }
};
