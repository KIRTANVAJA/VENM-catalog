// CENTRALIZED SETTINGS STATE LAYER
// Reads & writes to Express API endpoint (/api/settings) with fallback defaults

import { apiGetSettings, apiUpdateSettings } from '../services/api.js';

export const DEFAULT_SETTINGS = {
  general: {
    brandName: "VENM",
    tagline: "GUJARATI ETHOS × CYBER STREETWEAR",
    contactEmail: "venm1310@gmail.com",
    contactPhone: "+91 96649 84749",
    location: "Ahmedabad, Gujarat, India",
    footerText: "CONTEMPORARY GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR & INDO-WESTERN SILHOUETTES.",
    siteStatus: "LIVE",
    logoUrl: "/assets/brand/venm-logo.png"
  },
  whatsapp: {
    number: "+91 96649 84749",
    rawNumber: "919664984749",
    enabled: true,
    buttonText: "INQUIRE ON WHATSAPP",
    defaultTemplate: `Hi VENM! 👋\n\nI'm interested in:\n\nProduct:\n{{product_name}}\n\nProduct ID:\n{{product_id}}\n\nCollection:\n{{collection}}\n\nCategory:\n{{category}}\n\nSize:\n{{size}}\n\nCould you please share:\n• Price\n• Available sizes\n• Availability\n• Delivery details\n\nThank you!`
  },
  social: {
    instagram: "https://instagram.com/venm.exe",
    facebook: "https://facebook.com/venmofficial",
    youtube: "https://youtube.com/@venmofficial"
  },
  seo: {
    siteTitle: "VENM CATALOG — Gujarati Ethos × Cyber Streetwear",
    metaDescription: "Official VENM Fashion Catalog. Contemporary Gujarati heritage fused with Y2K kinetic streetwear.",
    defaultOgImage: "/assets/campaign/HOMEPAGE_2.webp",
    keywords: "VENM, Gujarati Streetwear, Navratri Garba Fashion, Indo-Western, Raw Denim"
  }
};

let cachedSettings = { ...DEFAULT_SETTINGS };

export async function fetchLiveSettings() {
  try {
    const live = await apiGetSettings();
    if (live && Object.keys(live).length > 0) {
      cachedSettings = {
        general: live.general || DEFAULT_SETTINGS.general,
        whatsapp: live.whatsapp || DEFAULT_SETTINGS.whatsapp,
        social: live.social || DEFAULT_SETTINGS.social,
        seo: live.seo || DEFAULT_SETTINGS.seo
      };
    }
  } catch (err) {
    // Graceful fallback to default settings if server starting
  }
  return cachedSettings;
}

export function getSettings() {
  return cachedSettings;
}

export async function saveSettingsSection(sectionKey, newValues) {
  cachedSettings[sectionKey] = {
    ...cachedSettings[sectionKey],
    ...newValues
  };

  try {
    await apiUpdateSettings(sectionKey, cachedSettings[sectionKey]);
  } catch (err) {
    console.warn(`[SETTINGS API] Update failed for ${sectionKey}:`, err);
  }

  return cachedSettings;
}

export function formatWhatsAppUrl(product, size = '') {
  const settings = getSettings();
  const phone = settings.whatsapp?.number || settings.whatsapp?.rawNumber || '+91 96649 84749';
  const rawNum = phone.replace(/[^0-9]/g, '');
  
  let msg = settings.whatsapp?.defaultTemplate || `Hi VENM! 👋\n\nI'm interested in:\n\nProduct:\n{{product_name}}\n\nProduct ID:\n{{product_id}}\n\nCollection:\n{{collection}}\n\nCategory:\n{{category}}\n\nSize:\n{{size}}\n\nCould you please share:\n• Price\n• Available sizes\n• Availability\n• Delivery details\n\nThank you!`;
  
  const effectiveSize = size && size.trim() !== '' ? size : 'Not selected';
  const brandName = settings.general?.brandName || 'VENM';
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const productId = product?.id || product?.slug || 'N/A';

  msg = msg.replace(/\{\{product_name\}\}/g, product?.name || 'Piece')
           .replace(/\{\{product_id\}\}/g, productId)
           .replace(/\{\{collection\}\}/g, product?.collectionName || 'Collection')
           .replace(/\{\{category\}\}/g, product?.category || 'Fashion')
           .replace(/\{\{size\}\}/g, effectiveSize)
           .replace(/\{\{product_url\}\}/g, pageUrl)
           .replace(/\{\{brand_name\}\}/g, brandName)
           .replace(/\{\{[a-zA-Z0-9_]+\}\}/g, 'N/A');

  return `https://wa.me/${rawNum}?text=${encodeURIComponent(msg)}`;
}
