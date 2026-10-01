import { PRODUCTS, COLLECTIONS } from './catalog';

// Centralized Admin Mock Store for Phase 2 CMS Operations
let mockProducts = [...PRODUCTS];
let mockCollections = [...COLLECTIONS];

let mockCategories = [
  { id: 'cat-1', slug: 'outerwear', name: 'Outerwear', productCount: 4, status: 'Active', displayOrder: 1 },
  { id: 'cat-2', slug: 'tops', name: 'Tops & Graphic Tees', productCount: 3, status: 'Active', displayOrder: 2 },
  { id: 'cat-3', slug: 'bottoms', name: 'Bottoms & Raw Denim', productCount: 2, status: 'Active', displayOrder: 3 },
  { id: 'cat-4', slug: 'ethnic', name: 'Contemporary Ethnic', productCount: 2, status: 'Active', displayOrder: 4 },
  { id: 'cat-5', slug: 'accessories', name: 'Utility Accessories', productCount: 2, status: 'Active', displayOrder: 5 }
];

let mockHomepageSections = [
  {
    id: 'hero',
    name: 'HERO CAMPAIGN BANNER',
    enabled: true,
    displayOrder: 1,
    content: {
      title: 'VENM CATALOG',
      subtitle: 'GUJARATI ETHOS FUSED WITH CYBER STREETWEAR',
      heroImage: '/assets/campaign/HOMEPAGE_2.webp',
      primaryCtaText: 'EXPLORE THE EDIT',
      primaryCtaLink: '/collection/navratri',
      secondaryCtaText: 'ALL COLLECTIONS',
      secondaryCtaLink: '/collections'
    }
  },
  {
    id: 'featured_collection',
    name: 'FEATURED COLLECTION SPOTLIGHT',
    enabled: true,
    displayOrder: 2,
    content: {
      collectionSlug: 'navratri',
      title: 'NAVRATRI EDIT 2026',
      description: 'Traditional Garba silhouettes reengineered through raw distressed denim and mirror-work streetwear.',
      ctaText: 'VIEW COLLECTION'
    }
  },
  {
    id: 'featured_products',
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
    name: 'BRAND STATEMENT MANIFESTO',
    enabled: true,
    displayOrder: 4,
    content: {
      line1: 'NOT TRADITIONAL.',
      line2: 'NOT STREETWEAR.',
      line3: 'SOMEWHERE IN BETWEEN.',
      description: 'VENM STANDS AT THE INTERSECTION OF GUJARATI HERITAGE CRAFTSMANSHIP AND Y2K KINETIC STREETWEAR.'
    }
  },
  {
    id: 'lookbook',
    name: 'EDITORIAL LOOKBOOK',
    enabled: true,
    displayOrder: 5,
    content: {
      title: 'THE FESTIVE EDITORIAL',
      vol: 'EDITORIAL LOOKBOOK // VOL. 04',
      manifesto: '"WE DO NOT COPY THE PAST. WE REENGINEER IT FOR THE MIDNIGHT DANCE FLOOR."'
    }
  },
  {
    id: 'final_cta',
    name: 'COLLECTIONS GRID & FINAL CTA',
    enabled: true,
    displayOrder: 6,
    content: {
      title: 'CURATED COLLECTIONS',
      ctaText: 'EXPLORE THE FESTIVE EDIT'
    }
  }
];

let mockCampaigns = [
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

let mockMedia = [
  { id: 'm-1', name: 'HOMEPAGE_2.webp', category: 'Campaigns', type: 'image/webp', size: '115 KB', url: '/assets/campaign/HOMEPAGE_2.webp', usedBy: 'Hero Banner' },
  { id: 'm-2', name: 'venm-logo.png', category: 'Brand', type: 'image/png', size: '170 KB', url: '/assets/brand/venm-logo.png', usedBy: 'Header Logo' },
  { id: 'm-3', name: 'jac3.jpg', category: 'Products', type: 'image/jpeg', size: '133 KB', url: '/assets/products/jac3.jpg', usedBy: 'Garba Cyber Vest' },
  { id: 'm-4', name: 'denim.jpg', category: 'Products', type: 'image/jpeg', size: '441 KB', url: '/assets/products/denim.jpg', usedBy: 'Dandiya Raw Denim' },
  { id: 'm-5', name: 'nas1.webp', category: 'Campaigns', type: 'image/webp', size: '96 KB', url: '/assets/campaign/nas1.webp', usedBy: 'Editorial Look 01' },
  { id: 'm-6', name: 'hoodies.jpg', category: 'Products', type: 'image/jpeg', size: '175 KB', url: '/assets/products/hoodies.jpg', usedBy: 'Heavy Hoodie' }
];

// PRODUCTS CRUD
export function getAdminProducts() {
  return mockProducts;
}

export function saveAdminProduct(productData) {
  const existingIdx = mockProducts.findIndex((p) => p.id === productData.id || p.slug === productData.slug);
  if (existingIdx >= 0) {
    mockProducts[existingIdx] = { ...mockProducts[existingIdx], ...productData };
  } else {
    const newProduct = {
      ...productData,
      id: productData.id || `vnm-${Date.now().toString().slice(-4)}`,
      slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    mockProducts.unshift(newProduct);
  }
  return mockProducts;
}

export function deleteAdminProduct(productId) {
  mockProducts = mockProducts.filter((p) => p.id !== productId && p.slug !== productId);
  return mockProducts;
}

// COLLECTIONS CRUD
export function getAdminCollections() {
  return mockCollections;
}

export function saveAdminCollection(colData) {
  const idx = mockCollections.findIndex((c) => c.id === colData.id || c.slug === colData.slug);
  if (idx >= 0) {
    mockCollections[idx] = { ...mockCollections[idx], ...colData };
  } else {
    const newCol = {
      ...colData,
      id: colData.id || colData.slug || `col-${Date.now()}`
    };
    mockCollections.push(newCol);
  }
  return mockCollections;
}

export function deleteAdminCollection(colId) {
  mockCollections = mockCollections.filter((c) => c.id !== colId && c.slug !== colId);
  return mockCollections;
}

// CATEGORIES CRUD
export function getAdminCategories() {
  return mockCategories;
}

export function saveAdminCategory(catData) {
  const idx = mockCategories.findIndex((c) => c.id === catData.id);
  if (idx >= 0) {
    mockCategories[idx] = { ...mockCategories[idx], ...catData };
  } else {
    mockCategories.push({ ...catData, id: `cat-${Date.now()}` });
  }
  return mockCategories;
}

export function deleteAdminCategory(catId) {
  mockCategories = mockCategories.filter((c) => c.id !== catId);
  return mockCategories;
}

// HOMEPAGE CMS
export function getAdminHomepageSections() {
  return mockHomepageSections;
}

export function updateHomepageSection(sectionId, updatedContent) {
  const sec = mockHomepageSections.find((s) => s.id === sectionId);
  if (sec) {
    sec.content = { ...sec.content, ...updatedContent };
  }
  return mockHomepageSections;
}

export function toggleHomepageSection(sectionId) {
  const sec = mockHomepageSections.find((s) => s.id === sectionId);
  if (sec) {
    sec.enabled = !sec.enabled;
  }
  return mockHomepageSections;
}

// CAMPAIGNS
export function getAdminCampaigns() {
  return mockCampaigns;
}

export function saveAdminCampaign(campData) {
  const idx = mockCampaigns.findIndex((c) => c.id === campData.id);
  if (idx >= 0) {
    mockCampaigns[idx] = { ...mockCampaigns[idx], ...campData };
  } else {
    mockCampaigns.push({ ...campData, id: `camp-${Date.now()}` });
  }
  return mockCampaigns;
}

// MEDIA
export function getAdminMedia() {
  return mockMedia;
}

export function addAdminMedia(mediaObj) {
  mockMedia.unshift({
    id: `m-${Date.now()}`,
    ...mediaObj
  });
  return mockMedia;
}
