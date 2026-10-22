// CENTRALIZED SETTINGS STATE LAYER
// Reads & writes to Express API endpoint (/api/settings) with fallback defaults

import { apiGetSettings, apiUpdateSettings } from '../services/api.js';

export const DEFAULT_SETTINGS = {
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

function loadStoredSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem('venm_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
        whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...(parsed.whatsapp || {}) },
        social: { ...DEFAULT_SETTINGS.social, ...(parsed.social || {}) },
        seo: { ...DEFAULT_SETTINGS.seo, ...(parsed.seo || {}) },
        active_fest: parsed.active_fest || null
      };
    }
  } catch (e) {}
  return { ...DEFAULT_SETTINGS };
}

let cachedSettings = loadStoredSettings();

export function applySeoMetadata(settings) {
  if (typeof document === 'undefined') return;
  const s = settings || cachedSettings;
  const title = s?.seo?.siteTitle || (s?.general?.brandName && s?.general?.tagline ? `${s.general.brandName} CATALOG — ${s.general.tagline}` : null);
  if (title) {
    document.title = title;
  }
  const desc = s?.seo?.metaDescription || s?.general?.footerText;
  if (desc) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }
}

if (typeof window !== 'undefined') {
  applySeoMetadata(cachedSettings);
}

export async function fetchLiveSettings() {
  try {
    const live = await apiGetSettings();
    if (live && Object.keys(live).length > 0) {
      cachedSettings = {
        general: { ...DEFAULT_SETTINGS.general, ...(live.general || {}) },
        whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...(live.whatsapp || {}) },
        social: { ...DEFAULT_SETTINGS.social, ...(live.social || {}) },
        seo: { ...DEFAULT_SETTINGS.seo, ...(live.seo || {}) },
        active_fest: live.active_fest || cachedSettings.active_fest || null
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('venm_settings', JSON.stringify(cachedSettings));
          applySeoMetadata(cachedSettings);
          window.dispatchEvent(new CustomEvent('venm_settings_updated', { detail: cachedSettings }));
        } catch (e) {}
      }
    }
  } catch (err) {
    // Graceful fallback to default/cached settings
  }
  return cachedSettings;
}

export function getSettings() {
  return cachedSettings;
}

export async function saveSettingsSection(sectionKey, newValues) {
  const currentSection = cachedSettings[sectionKey] || DEFAULT_SETTINGS[sectionKey] || {};
  cachedSettings[sectionKey] = {
    ...currentSection,
    ...newValues
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('venm_settings', JSON.stringify(cachedSettings));
      applySeoMetadata(cachedSettings);
      window.dispatchEvent(new CustomEvent('venm_settings_updated', { detail: cachedSettings }));
    } catch (e) {}
  }

  try {
    await apiUpdateSettings(sectionKey, cachedSettings[sectionKey]);
  } catch (err) {
    console.warn(`[SETTINGS API] Update failed for ${sectionKey}:`, err);
  }

  return cachedSettings;
}

export function formatWhatsAppUrl(product, size = '', requestType = '', user = null) {
  const settings = getSettings();
  const phone = settings.whatsapp?.number || settings.whatsapp?.rawNumber || '+91 74340 96095';
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

  // Obtain active logged in user profile
  let clientUser = user;
  if (!clientUser && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('venm_user') || localStorage.getItem('venm_admin_user');
      if (stored) clientUser = JSON.parse(stored);
    } catch (e) {}
  }

  msg = msg.replace(/\{\{product_name\}\}/g, product?.name || 'Reference Look')
           .replace(/\{\{product_id\}\}/g, productId)
           .replace(/\{\{estimated_price\}\}/g, priceStr)
           .replace(/\{\{request_type\}\}/g, effectiveReqType)
           .replace(/\{\{collection\}\}/g, product?.collectionName || 'Catalog Collection')
           .replace(/\{\{category\}\}/g, product?.category || 'Fashion')
           .replace(/\{\{size\}\}/g, effectiveSize)
           .replace(/\{\{product_url\}\}/g, pageUrl)
           .replace(/\{\{brand_name\}\}/g, brandName);

  // Automatically attach full client registered profile to WhatsApp inquiry
  if (clientUser) {
    const regDateStr = clientUser.createdAt ? new Date(clientUser.createdAt).toLocaleDateString() : 'Active Member';
    const clientDetailsBlock = `\n\n━━━━━━━━━━━━━━━━━━━━━━\n👤 VERIFIED CLIENT ACCOUNT:\n• Name: ${clientUser.name || 'VENM Client'}\n• Email: ${clientUser.email || 'N/A'}\n• Phone: ${clientUser.phone || 'N/A'}\n• Client ID: ${clientUser.id || 'N/A'}\n• Role: ${clientUser.role || 'CUSTOMER'}\n• Registered: ${regDateStr}\n━━━━━━━━━━━━━━━━━━━━━━`;
    msg += clientDetailsBlock;
  }

  msg = msg.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, 'N/A');

  return `https://wa.me/${rawNum}?text=${encodeURIComponent(msg)}`;
}
