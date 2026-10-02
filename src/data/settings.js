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
    footerText: "FASHION REFERENCE CATALOG & BESPOKE CUSTOM REQUEST PLATFORM. GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR.",
    siteStatus: "LIVE",
    logoUrl: "/assets/brand/venm-logo.png"
  },
  whatsapp: {
    number: "+91 96649 84749",
    rawNumber: "919664984749",
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
    // Graceful fallback to default settings
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

export function formatWhatsAppUrl(product, size = '', requestType = '') {
  const settings = getSettings();
  const phone = settings.whatsapp?.number || settings.whatsapp?.rawNumber || '+91 96649 84749';
  const rawNum = phone.replace(/[^0-9]/g, '');
  
  let msg = settings.whatsapp?.defaultTemplate || `Hi VENM! 👋\n\nI'd like to request this look:\n\nReference:\n{{product_name}}\n\nReference ID:\n{{product_id}}\n\nEstimated Price:\n{{estimated_price}}\n\nRequest Option:\n{{request_type}}\n\nI'd like to discuss:\n• Customization\n• Sizing / measurements\n• Garment sourcing / My own garment\n\nReference:\n{{product_url}}\n\nPlease let me know how we can take this forward.\nThank you!`;
  
  const effectiveSize = size && size.trim() !== '' ? size : 'Custom sizing to be discussed';
  const effectiveReqType = requestType && requestType.trim() !== '' 
    ? requestType 
    : 'To be discussed (I have garment or need sourcing)';
  const brandName = settings.general?.brandName || 'VENM';
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const productId = product?.id || product?.slug || 'VENM-REF-001';

  // Compute estimated price string
  let priceStr = 'Price on Request';
  if (product?.estimatedPrice) {
    priceStr = product.estimatedPrice;
  } else if (product?.minPrice && product?.maxPrice) {
    priceStr = `₹${product.minPrice} – ₹${product.maxPrice}`;
  }

  msg = msg.replace(/\{\{product_name\}\}/g, product?.name || 'Reference Look')
           .replace(/\{\{product_id\}\}/g, productId)
           .replace(/\{\{estimated_price\}\}/g, priceStr)
           .replace(/\{\{request_type\}\}/g, effectiveReqType)
           .replace(/\{\{collection\}\}/g, product?.collectionName || 'Catalog Collection')
           .replace(/\{\{category\}\}/g, product?.category || 'Fashion')
           .replace(/\{\{size\}\}/g, effectiveSize)
           .replace(/\{\{product_url\}\}/g, pageUrl)
           .replace(/\{\{brand_name\}\}/g, brandName)
           .replace(/\{\{[a-zA-Z0-9_]+\}\}/g, 'N/A');

  return `https://wa.me/${rawNum}?text=${encodeURIComponent(msg)}`;
}
