import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const DEFAULT_SETTINGS_SERVER = {
  general: {
    brandName: "VENM",
    tagline: "GUJARATI ETHOS × CYBER STREETWEAR",
    contactEmail: "venm1310@gmail.com",
    contactPhone: "+91 74340 96095",
    location: "Ahmedabad, Gujarat, India",
    footerText: "FASHION REFERENCE CATALOG & BESPOKE CUSTOM REQUEST PLATFORM. GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR.",
    siteStatus: "LIVE",
    logoUrl: "/assets/brand/venm-logo.png"
  },
  whatsapp: {
    number: "+91 74340 96095",
    rawNumber: "917434096095",
    enabled: true,
    buttonText: "REQUEST THIS LOOK",
    defaultTemplate: `Hi VENM! 👋\n\nI'd like to request this look:\n\nReference:\n{{product_name}}\n\nReference ID:\n{{product_id}}\n\nEstimated Price:\n{{estimated_price}}\n\nRequest Option:\n{{request_type}}\n\nI'd like to discuss:\n• Customization\n• Sizing / measurements\n• Garment sourcing / My own garment\n\nReference:\n{{product_url}}\n\nPlease let me know how we can take this forward.\nThank you!`
  },
  social: {
    instagram: "https://instagram.com/venm.exe",
    facebook: "https://facebook.com/venmofficial",
    youtube: "https://youtube.com/@venmofficial"
  },
  seo: {
    siteTitle: "VENM REFERENCE CATALOG — Custom Fashion & Bespoke Requests",
    metaDescription: "Official VENM Reference Catalog. Contemporary Gujarati heritage fused with Y2K kinetic streetwear. Request your custom look today.",
    defaultOgImage: "/assets/campaign/HOMEPAGE_2.webp",
    keywords: "VENM, Reference Catalog, Custom Fashion, Bespoke Garment, Gujarati Streetwear, Indo-Western"
  }
};

export const getSettings = async (req, res) => {
  try {
    const settingsList = await prisma.setting.findMany();

    const formatted = {
      general: { ...DEFAULT_SETTINGS_SERVER.general },
      whatsapp: { ...DEFAULT_SETTINGS_SERVER.whatsapp },
      social: { ...DEFAULT_SETTINGS_SERVER.social },
      seo: { ...DEFAULT_SETTINGS_SERVER.seo }
    };

    settingsList.forEach((s) => {
      const parsed = typeof s.data === 'string' ? JSON.parse(s.data || '{}') : (s.data || {});
      if (formatted[s.sectionKey]) {
        formatted[s.sectionKey] = {
          ...formatted[s.sectionKey],
          ...parsed
        };
      } else {
        formatted[s.sectionKey] = parsed;
      }
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

    const existing = await prisma.setting.findUnique({
      where: { sectionKey }
    });

    let existingData = {};
    if (existing && existing.data) {
      existingData = typeof existing.data === 'string' ? JSON.parse(existing.data || '{}') : existing.data;
    } else if (DEFAULT_SETTINGS_SERVER[sectionKey]) {
      existingData = { ...DEFAULT_SETTINGS_SERVER[sectionKey] };
    }

    const incomingData = typeof data === 'object' ? data : JSON.parse(data || '{}');
    const mergedData = {
      ...existingData,
      ...incomingData
    };

    const updated = await prisma.setting.upsert({
      where: { sectionKey },
      update: {
        data: JSON.stringify(mergedData)
      },
      create: {
        sectionKey,
        data: JSON.stringify(mergedData)
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

    const parsedUpdated = {
      ...updated,
      data: mergedData
    };

    res.json(parsedUpdated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE SETTINGS', error: error.message });
  }
};

