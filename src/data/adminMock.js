import { PRODUCTS, COLLECTIONS } from './catalog.js';

// Helper for localStorage persistence
const loadStored = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveStored = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

// Initial Mock Data Sets
const initialCategories = [
  { id: 'cat-1', slug: 'outerwear', name: 'Outerwear', productCount: 4, status: 'Active', displayOrder: 1 },
  { id: 'cat-2', slug: 'tops', name: 'Tops & Graphic Tees', productCount: 3, status: 'Active', displayOrder: 2 },
  { id: 'cat-3', slug: 'bottoms', name: 'Bottoms & Raw Denim', productCount: 2, status: 'Active', displayOrder: 3 },
  { id: 'cat-4', slug: 'ethnic', name: 'Contemporary Ethnic', productCount: 2, status: 'Active', displayOrder: 4 },
  { id: 'cat-5', slug: 'accessories', name: 'Utility Accessories', productCount: 2, status: 'Active', displayOrder: 5 }
];

const initialHomepageSections = [
  {
    id: 'hero',
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
    id: 'featured_collection',
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
    id: 'featured_products',
    sectionKey: 'featured_products',
    name: 'FEATURED PRODUCTS GRID',
    enabled: true,
    displayOrder: 3,
    content: {
      title: 'HIGHLIGHTED CATALOG PIECES',
      subtitle: 'SELECTION // FEATURED PIECES',
      selectedProductIds: ['vnm-001', 'vnm-002', 'vnm-003', 'vnm-004', 'vnm-005', 'vnm-009']
    }
  },
  {
    id: 'brand_statement',
    sectionKey: 'brand_statement',
    name: 'BRAND STATEMENT MANIFESTO',
    enabled: true,
    displayOrder: 4,
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
    id: 'lookbook',
    sectionKey: 'lookbook',
    name: 'EDITORIAL LOOKBOOK',
    enabled: true,
    displayOrder: 5,
    content: {
      title: 'THE FESTIVE EDITORIAL',
      subtitle: 'EDITORIAL LOOKBOOK // VOL. 04',
      description: '"WE DO NOT COPY THE PAST. WE REENGINEER IT FOR THE MIDNIGHT DANCE FLOOR."'
    }
  }
];

const initialCampaigns = [
  {
    id: 'camp-1',
    name: 'NAVRATRI EDIT 2026',
    slug: 'navratri-edit',
    status: 'ACTIVE',
    startDate: '2026-09-15',
    endDate: '2026-10-31',
    campaignImage: '/assets/campaign/HOMEPAGE_2.webp',
    announcement: 'VENM × NAVRATRI: THE FESTIVE EDIT IS NOW LIVE',
    festivalControls: {
      lights: true,
      dandiya: true,
      chunri: true,
      bangles: false,
      festivalGlow: true
    }
  },
  {
    id: 'camp-2',
    name: 'DIWALI LUMINANCE 2026',
    slug: 'diwali-luminance',
    status: 'SCHEDULED',
    startDate: '2026-11-01',
    endDate: '2026-11-20',
    campaignImage: '/assets/campaign/nas8.jpg',
    announcement: 'DIWALI LUMINANCE & OBSIDIAN SILKS CAPSULE',
    festivalControls: {
      lights: true,
      dandiya: false,
      chunri: false,
      bangles: true,
      festivalGlow: true
    }
  }
];

const initialMedia = [
  { id: 'm-1', name: 'HOMEPAGE_2.webp', category: 'Campaigns', type: 'image/webp', size: '115 KB', url: '/assets/campaign/HOMEPAGE_2.webp', usedBy: 'Hero Banner' },
  { id: 'm-2', name: 'venm-logo.png', category: 'Brand', type: 'image/png', size: '170 KB', url: '/assets/brand/venm-logo.png', usedBy: 'Header Logo' },
  { id: 'm-3', name: 'jac3.jpg', category: 'Products', type: 'image/jpeg', size: '133 KB', url: '/assets/products/jac3.jpg', usedBy: 'Garba Cyber Vest' },
  { id: 'm-4', name: 'denim.jpg', category: 'Products', type: 'image/jpeg', size: '441 KB', url: '/assets/products/denim.jpg', usedBy: 'Dandiya Raw Denim' },
  { id: 'm-5', name: 'nas1.webp', category: 'Campaigns', type: 'image/webp', size: '96 KB', url: '/assets/campaign/nas1.webp', usedBy: 'Editorial Look 01' },
  { id: 'm-6', name: 'hoodies.jpg', category: 'Products', type: 'image/jpeg', size: '175 KB', url: '/assets/products/hoodies.jpg', usedBy: 'Heavy Hoodie' }
];

// Persistent Stores
let mockProducts = loadStored('venm_mock_products', PRODUCTS);
let mockCollections = loadStored('venm_mock_collections', COLLECTIONS);
let mockCategories = loadStored('venm_mock_categories', initialCategories);
let mockHomepageSections = loadStored('venm_mock_homepage', initialHomepageSections);
let mockCampaigns = loadStored('venm_mock_campaigns', initialCampaigns);
let mockMedia = loadStored('venm_mock_media', initialMedia);

// Image Path Helper: Ensures leading slash if needed
export function normalizeImagePath(img) {
  if (!img) return '/assets/products/Denim Jacket.jpg';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) return img;
  let cleaned = img.trim();
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned;
  }
  return cleaned;
}

// PRODUCTS CRUD
export function getAdminProducts() {
  return mockProducts;
}

export function saveAdminProduct(productData) {
  const normalizedImages = (productData.images || []).map(normalizeImagePath);
  const targetId = productData.id || productData.slug;
  const existingIdx = mockProducts.findIndex((p) => p.id === targetId || p.slug === targetId || p.slug === productData.slug);

  let updatedProduct;
  if (existingIdx >= 0) {
    updatedProduct = {
      ...mockProducts[existingIdx],
      ...productData,
      id: mockProducts[existingIdx].id,
      images: normalizedImages.length > 0 ? normalizedImages : mockProducts[existingIdx].images
    };
    mockProducts[existingIdx] = updatedProduct;
  } else {
    updatedProduct = {
      ...productData,
      id: productData.id || `vnm-${Date.now().toString().slice(-4)}`,
      slug: productData.slug || (productData.name ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`),
      images: normalizedImages.length > 0 ? normalizedImages : ['/assets/products/Denim Jacket.jpg']
    };
    mockProducts.unshift(updatedProduct);
  }

  saveStored('venm_mock_products', mockProducts);
  return updatedProduct;
}

export function deleteAdminProduct(productId) {
  mockProducts = mockProducts.filter((p) => p.id !== productId && p.slug !== productId);
  saveStored('venm_mock_products', mockProducts);
  return mockProducts;
}

// COLLECTIONS CRUD
export function getAdminCollections() {
  return mockCollections;
}

export function saveAdminCollection(colData) {
  const colId = colData.id || colData.slug;
  const idx = mockCollections.findIndex((c) => c.id === colId || c.slug === colData.slug);
  const coverImage = normalizeImagePath(colData.coverImage);

  let updatedCol;
  if (idx >= 0) {
    updatedCol = { ...mockCollections[idx], ...colData, coverImage: coverImage || mockCollections[idx].coverImage };
    mockCollections[idx] = updatedCol;
  } else {
    updatedCol = {
      ...colData,
      id: colData.id || colData.slug || `col-${Date.now()}`,
      slug: colData.slug || `col-${Date.now()}`,
      coverImage: coverImage || '/assets/campaign/HOMEPAGE_2.webp'
    };
    mockCollections.push(updatedCol);
  }

  saveStored('venm_mock_collections', mockCollections);
  return updatedCol;
}

export function deleteAdminCollection(colId) {
  mockCollections = mockCollections.filter((c) => c.id !== colId && c.slug !== colId);
  saveStored('venm_mock_collections', mockCollections);
  return mockCollections;
}

// CATEGORIES CRUD
export function getAdminCategories() {
  return mockCategories;
}

export function saveAdminCategory(catData) {
  const idx = mockCategories.findIndex((c) => c.id === catData.id || c.slug === catData.slug);
  let updatedCat;
  if (idx >= 0) {
    updatedCat = { ...mockCategories[idx], ...catData };
    mockCategories[idx] = updatedCat;
  } else {
    updatedCat = { ...catData, id: catData.id || `cat-${Date.now()}` };
    mockCategories.push(updatedCat);
  }

  saveStored('venm_mock_categories', mockCategories);
  return updatedCat;
}

export function deleteAdminCategory(catId) {
  mockCategories = mockCategories.filter((c) => c.id !== catId);
  saveStored('venm_mock_categories', mockCategories);
  return mockCategories;
}

// HOMEPAGE CMS
export function getAdminHomepageSections() {
  return mockHomepageSections.map(s => ({
    ...s,
    sectionKey: s.sectionKey || s.id
  }));
}

export function updateHomepageSection(sectionKey, updatedContent, enabled = null, displayOrder = null) {
  const targetKey = sectionKey;
  let sec = mockHomepageSections.find((s) => s.sectionKey === targetKey || s.id === targetKey);
  
  if (sec) {
    sec.content = { ...sec.content, ...updatedContent };
    if (enabled !== null) sec.enabled = enabled;
    if (displayOrder !== null) sec.displayOrder = displayOrder;
  } else {
    sec = {
      id: targetKey,
      sectionKey: targetKey,
      name: targetKey.toUpperCase(),
      enabled: enabled !== null ? enabled : true,
      displayOrder: displayOrder || 99,
      content: updatedContent || {}
    };
    mockHomepageSections.push(sec);
  }

  saveStored('venm_mock_homepage', mockHomepageSections);
  return mockHomepageSections;
}

export function toggleHomepageSection(sectionKey) {
  const sec = mockHomepageSections.find((s) => s.sectionKey === sectionKey || s.id === sectionKey);
  if (sec) {
    sec.enabled = !sec.enabled;
    saveStored('venm_mock_homepage', mockHomepageSections);
  }
  return mockHomepageSections;
}

// CAMPAIGNS
export function getAdminCampaigns() {
  return mockCampaigns;
}

export function saveAdminCampaign(campData) {
  const idx = mockCampaigns.findIndex((c) => c.id === campData.id);
  let updatedCamp;
  if (idx >= 0) {
    updatedCamp = { ...mockCampaigns[idx], ...campData };
    mockCampaigns[idx] = updatedCamp;
  } else {
    updatedCamp = { ...campData, id: `camp-${Date.now()}` };
    mockCampaigns.push(updatedCamp);
  }

  saveStored('venm_mock_campaigns', mockCampaigns);
  return updatedCamp;
}

export function deleteAdminCampaign(campId) {
  mockCampaigns = mockCampaigns.filter((c) => c.id !== campId);
  saveStored('venm_mock_campaigns', mockCampaigns);
  return mockCampaigns;
}

// MEDIA
export function getAdminMedia() {
  return mockMedia;
}

export function addAdminMedia(mediaObj) {
  const newMedia = {
    id: `m-${Date.now()}`,
    name: mediaObj.name || 'uploaded-asset.jpg',
    category: mediaObj.category || 'General',
    type: mediaObj.type || 'image/jpeg',
    size: mediaObj.size || '150 KB',
    url: normalizeImagePath(mediaObj.url),
    usedBy: mediaObj.usedBy || 'Custom Media'
  };
  mockMedia.unshift(newMedia);
  saveStored('venm_mock_media', mockMedia);
  return newMedia;
}

export function deleteAdminMedia(mediaId) {
  mockMedia = mockMedia.filter((m) => m.id !== mediaId);
  saveStored('venm_mock_media', mockMedia);
  return mockMedia;
}
