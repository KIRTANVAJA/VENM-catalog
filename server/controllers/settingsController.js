import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const getSettings = async (req, res) => {
  try {
    const settingsList = await prisma.setting.findMany();

    const formatted = {};
    settingsList.forEach((s) => {
      formatted[s.sectionKey] = typeof s.data === 'string' ? JSON.parse(s.data || '{}') : s.data;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH SETTINGS', error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { sectionKey, data } = req.body;

    if (!sectionKey || !data) {
      return res.status(400).json({ message: 'SECTION KEY AND DATA ARE REQUIRED' });
    }

    const updated = await prisma.setting.upsert({
      where: { sectionKey },
      update: {
        data: typeof data === 'object' ? JSON.stringify(data) : data
      },
      create: {
        sectionKey,
        data: typeof data === 'object' ? JSON.stringify(data) : data
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'SETTINGS_UPDATED',
      entityType: 'SETTINGS',
      entityId: sectionKey,
      description: `Updated ${sectionKey.toUpperCase()} settings`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE SETTINGS', error: error.message });
  }
};
