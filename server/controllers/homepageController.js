import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

const DEFAULT_SECTIONS = [
  {
    sectionKey: 'hero',
    name: 'HERO CAMPAIGN BANNER',
    enabled: true,
    displayOrder: 1,
    content: {
      campaignBadge: 'VENM REFERENCE CATALOG // FASHION & CUSTOM REQUESTS',
      title: 'VENM REFERENCE CATALOG',
      subtitle: "FIND A LOOK. TELL US WHAT YOU NEED. WE'LL WORK FROM THERE.",
      description: 'A FASHION REFERENCE CATALOG & BESPOKE CUSTOM REQUEST PLATFORM SHOWCASING WHAT VENM CAN CREATE, CUSTOMIZE, STYLE, SOURCE AND WORK ON.',
      heroImage: '/assets/campaign/HOMEPAGE_2.webp',
      primaryCtaText: 'BROWSE REFERENCES',
      primaryCtaLink: '/collections',
      secondaryCtaText: 'NAVRATRI EDIT',
      secondaryCtaLink: '/collection/navratri'
    }
  },
  {
    sectionKey: 'featured_collection',
    name: 'FEATURED COLLECTION SPOTLIGHT',
    enabled: true,
    displayOrder: 2,
    content: {
      collectionSlug: 'navratri',
      title: 'NAVRATRI EDIT 2026',
      tagline: 'GUJARATI ETHOS × CYBER STREETWEAR',
      description: 'Traditional Garba silhouettes reengineered through raw distressed denim and mirror-work streetwear.',
      coverImage: '/assets/campaign/HOMEPAGE_2.webp',
      ctaText: 'EXPLORE EDIT REFERENCES (8 LOOKS)',
      ctaLink: '/collection/navratri'
    }
  },
  {
    sectionKey: 'brand_statement',
    name: 'BRAND STATEMENT MANIFESTO',
    enabled: true,
    displayOrder: 3,
    content: {
      badge: 'VENM BRAND PHILOSOPHY',
      line1: 'NOT TRADITIONAL STORE.',
      line2: 'NOT FIXED INVENTORY.',
      line3: 'YOUR IDEA, YOUR VENM.',
      description: 'VENM CATALOG IS A CURATED REFERENCE BOARD OF WHAT WE CAN CRAFT, CUSTOMIZE, AND SOURCE. WE WORK WITH YOUR GARMENTS OR SOURCE BASE PIECES TO BUILD YOUR UNIQUE STYLE.',
      ctaText: 'READ OUR BRAND STORY',
      ctaLink: '/about'
    }
  },
  {
    sectionKey: 'featured_products',
    name: 'FEATURED PRODUCTS GRID',
    enabled: true,
    displayOrder: 4,
    content: {
      title: 'HIGHLIGHTED STYLE REFERENCES',
      subtitle: 'CATALOG SELECTION // STYLE REFERENCES'
    }
  },
  {
    sectionKey: 'lookbook',
    name: 'EDITORIAL LOOKBOOK',
    enabled: true,
    displayOrder: 5,
    content: {
      title: 'THE FESTIVE EDITORIAL',
      subtitle: 'EDITORIAL LOOKBOOK // VOL. 04',
      description: '"WE DO NOT COPY THE PAST. WE REENGINEER IT FOR THE MIDNIGHT DANCE FLOOR."'
    }
  },
  {
    sectionKey: 'about_story',
    name: 'ABOUT STUDIO MANIFESTO',
    enabled: true,
    displayOrder: 6,
    content: {
      badge: 'VENM ARCHIVE & DESIGN STUDIO',
      title: 'THE MANIFESTO OF VENM',
      subtitle: 'CULTURE × EXPERIMENTATION × YOUTH CULTURE × GUJARATI HERITAGE',
      headline: 'BORN IN AHMEDABAD. ENGINEERED FOR MIDNIGHT.',
      paragraph1: 'VENM was founded with a singular conviction: traditional fashion should not remain frozen in history textbooks or restricted to standard wedding attire.',
      paragraph2: 'We took Gujarati silhouettes — Chaniya Cholis, mirror-work vests, Kediya cuts — and tore them apart through distressed denim, raw hems, and technical cyber streetwear details.',
      paragraph3: 'Every piece is crafted as a bespoke project. We source the garment or work on yours.',
      coverImage: '/assets/campaign/HOMEPAGE_2.webp',
      caption: 'ARCHIVAL STUDY 004 // CYBER CHUNRI',
      ctaText: 'REQUEST BESPOKE PIECE',
      ctaLink: '/collections'
    }
  }
];

export const getHomepageSections = async (req, res) => {
  try {
    let sections = await prisma.homepageSection.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    if (sections.length === 0) {
      for (const s of DEFAULT_SECTIONS) {
        await prisma.homepageSection.upsert({
          where: { sectionKey: s.sectionKey },
          update: {},
          create: {
            sectionKey: s.sectionKey,
            name: s.name,
            enabled: s.enabled,
            displayOrder: s.displayOrder,
            content: JSON.stringify(s.content)
          }
        });
      }
      sections = await prisma.homepageSection.findMany({
        orderBy: { displayOrder: 'asc' }
      });
    }

    const defaultMap = {};
    DEFAULT_SECTIONS.forEach((s) => { defaultMap[s.sectionKey] = s; });

    const formatted = sections.map((s) => {
      const parsedContent = typeof s.content === 'string' ? JSON.parse(s.content || '{}') : (s.content || {});
      const defContent = defaultMap[s.sectionKey]?.content || {};
      const merged = {
        ...defContent,
        ...parsedContent
      };

      if (s.sectionKey === 'hero') {
        if (!merged.title && merged.heading) merged.title = merged.heading;
        if (!merged.heading && merged.title) merged.heading = merged.title;
        if (!merged.subtitle && merged.subheading) merged.subtitle = merged.subheading;
        if (!merged.subheading && merged.subtitle) merged.subheading = merged.subtitle;
      }

      return {
        ...s,
        content: merged
      };
    });

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

    const defaultSec = DEFAULT_SECTIONS.find((s) => s.sectionKey === sectionKey);
    const existing = await prisma.homepageSection.findUnique({
      where: { sectionKey }
    });

    let existingContent = {};
    if (existing && existing.content) {
      existingContent = typeof existing.content === 'string' ? JSON.parse(existing.content || '{}') : existing.content;
    } else if (defaultSec) {
      existingContent = { ...defaultSec.content };
    }

    const incomingContent = typeof content === 'object' ? content : JSON.parse(content || '{}');
    const mergedContent = {
      ...(defaultSec?.content || {}),
      ...existingContent,
      ...incomingContent
    };

    if (sectionKey === 'hero') {
      if (!mergedContent.title && mergedContent.heading) mergedContent.title = mergedContent.heading;
      if (!mergedContent.heading && mergedContent.title) mergedContent.heading = mergedContent.title;
      if (!mergedContent.subtitle && mergedContent.subheading) mergedContent.subtitle = mergedContent.subheading;
      if (!mergedContent.subheading && mergedContent.subtitle) mergedContent.subheading = mergedContent.subtitle;
    }

    const updated = await prisma.homepageSection.upsert({
      where: { sectionKey },
      update: {
        content: JSON.stringify(mergedContent),
        enabled: enabled !== undefined ? Boolean(enabled) : (existing ? existing.enabled : true),
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : (existing ? existing.displayOrder : 0)
      },
      create: {
        sectionKey,
        name: defaultSec?.name || sectionKey.toUpperCase().replace('_', ' '),
        content: JSON.stringify(mergedContent),
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

    const formattedUpdated = {
      ...updated,
      content: mergedContent
    };

    res.json(formattedUpdated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE HOMEPAGE SECTION', error: error.message });
  }
};

