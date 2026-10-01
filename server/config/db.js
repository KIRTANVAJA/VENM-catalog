import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(__dirname, '../data/store.json');

// Default initial database state
const INITIAL_STORE = {
  activityLogs: [],
  users: [
    {
      id: 'admin-1',
      name: 'Studio Admin',
      email: 'venm1310@gmail.com',
      passwordHash: bcrypt.hashSync('password123', 10),
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  collections: [
    {
      id: 'navratri',
      name: 'NAVRATRI EDIT',
      slug: 'navratri',
      tagline: 'GUJARATI ETHOS × CYBER STREETWEAR',
      description: 'Traditional Garba silhouettes reengineered through raw distressed denim, oversized technical outerwear, and mirror-work streetwear details.',
      coverImage: '/assets/campaign/HOMEPAGE_2.webp',
      season: 'FESTIVE 2026',
      status: 'ACTIVE',
      featured: true,
      displayOrder: 1,
      productCount: 8
    },
    {
      id: 'diwali',
      name: 'DIWALI EDIT',
      slug: 'diwali',
      tagline: 'FESTIVE LUMINANCE & MODULAR DRAPES',
      description: 'Deep obsidian silks, metallic brass accents, and structured Indo-Western silhouettes.',
      coverImage: '/assets/campaign/nas8.jpg',
      season: 'COMING SOON',
      status: 'COMING_SOON',
      featured: true,
      displayOrder: 2,
      productCount: 6
    },
    {
      id: 'ethnic',
      name: 'CONTEMPORARY ETHNIC',
      slug: 'ethnic',
      tagline: 'REENGINEERED HERITAGE SILHOUETTES',
      description: 'Traditional Indian craftsmanship infused with modern boxy cuts and tactical functional detailing.',
      coverImage: '/assets/campaign/nas1.webp',
      season: 'PERMANENT',
      status: 'ACTIVE',
      featured: false,
      displayOrder: 3,
      productCount: 6
    },
    {
      id: 'indo-western',
      name: 'INDO-WESTERN',
      slug: 'indo-western',
      tagline: 'EXPERIMENTAL HYBRID SUITING',
      description: 'Where sharp Western tailoring meets fluid Eastern drapes and hand-embroidered motif patches.',
      coverImage: '/assets/campaign/nas9.jpg',
      season: 'ESSENTIALS',
      status: 'ACTIVE',
      featured: true,
      displayOrder: 4,
      productCount: 5
    },
    {
      id: 'denim',
      name: 'RAW DENIM',
      slug: 'denim',
      tagline: 'HEAVYWEIGHT DISTRESSED DENIM',
      description: '14oz Japanese & Indian selvedge denim featuring laser-etched Gujarati motifs and cargo pockets.',
      coverImage: '/assets/products/denim.jpg',
      season: 'CORE',
      status: 'ACTIVE',
      featured: false,
      displayOrder: 5,
      productCount: 7
    },
    {
      id: 'street',
      name: 'STREETWEAR',
      slug: 'street',
      tagline: 'METROPOLITAN YOUTH CULTURE',
      description: '400GSM cotton loopback hoodies, drop-shoulder graphic tees, and utility shorts.',
      coverImage: '/assets/products/jakets.jpg',
      season: 'PERMANENT',
      status: 'ACTIVE',
      featured: false,
      displayOrder: 6,
      productCount: 9
    },
    {
      id: 'y2k',
      name: 'Y2K KINETIC',
      slug: 'y2k',
      tagline: 'RETRO-FUTURISTIC EXPERIMENTAL',
      description: 'Cybernetic chrome prints, contrast topstitching, translucent nylon shells, and Y2K proportions.',
      coverImage: '/assets/campaign/nas3.webp',
      season: 'CAPSULE',
      status: 'ACTIVE',
      featured: false,
      displayOrder: 7,
      productCount: 4
    },
    {
      id: 'accessories',
      name: 'ACCESSORIES',
      slug: 'accessories',
      tagline: 'UTILITY GEAR & EMBROIDERED TOTES',
      description: 'Heavy-duty canvas totes, embroidered headwear, and tactical crossbody gear.',
      coverImage: '/assets/products/DIY ethnic tie made with oxidised jewellery pieces.jpg',
      season: 'PERMANENT',
      status: 'ACTIVE',
      featured: false,
      displayOrder: 8,
      productCount: 5
    }
  ],
  categories: [
    { id: 'cat-1', name: 'Outerwear', slug: 'outerwear', description: 'Jackets & Vests', status: 'Active', displayOrder: 1 },
    { id: 'cat-2', name: 'Tops', slug: 'tops', description: 'Tees & Shirts', status: 'Active', displayOrder: 2 },
    { id: 'cat-3', name: 'Bottoms', slug: 'bottoms', description: 'Denim & Cargos', status: 'Active', displayOrder: 3 },
    { id: 'cat-4', name: 'Ethnic', slug: 'ethnic', description: 'Drapes & Kurtas', status: 'Active', displayOrder: 4 },
    { id: 'cat-5', name: 'Accessories', slug: 'accessories', description: 'Bags & Caps', status: 'Active', displayOrder: 5 }
  ],
  products: [
    {
      id: 'vnm-001',
      slug: 'garba-cyber-vest-jac1',
      name: 'GARBA CYBER VEST',
      collectionSlug: 'navratri',
      collectionName: 'NAVRATRI EDIT',
      category: 'Outerwear',
      description: 'Oversized tactical utility vest constructed from water-repellent shell nylon, accented with hand-stitched Gujarati mirrorwork tabs.',
      details: '["Material: 100% Water-repellent Technical Nylon", "Embroidery: Traditional Mirrorwork Patchwork on Chest", "Fit: Oversized Drop-shoulder Silhouette"]',
      images: '["/assets/products/Denim Jacket.jpg", "/assets/products/Jean Jacket.jpg"]',
      sizes: '["S", "M", "L", "XL"]',
      availability: 'IN STOCK',
      isFeatured: true,
      isNavratriEdit: true,
      tags: '["NavratriEdit", "IndoWestern", "Outerwear"]',
      garmentCare: 'Dry clean only.',
      displayOrder: 1
    },
    {
      id: 'vnm-002',
      slug: 'dandiya-distressed-denim-den1',
      name: 'DANDIYA WIDE-LEG RAW DENIM',
      collectionSlug: 'navratri',
      collectionName: 'NAVRATRI EDIT',
      category: 'Bottoms',
      description: '14.5oz raw Indigo denim cut in a wide-leg silhouette. Features laser-etched geometric Garba circle motifs.',
      details: '["Fabric: 14.5oz Heavyweight 100% Cotton Denim", "Detailing: Laser-etched Gujarati Geometric Motifs"]',
      images: '["/assets/collections/denim.jpg", "/assets/products/Jean Jacket.jpg"]',
      sizes: '["XS", "S", "M", "L", "XL"]',
      availability: 'IN STOCK',
      isFeatured: true,
      isNavratriEdit: true,
      tags: '["NavratriEdit", "RawDenim", "Bottoms"]',
      garmentCare: 'Hand wash cold inside out.',
      displayOrder: 2
    },
    {
      id: 'vnm-003',
      slug: 'kathiawadi-heavyweight-tee-tees1',
      name: 'KATHIAWADI MOTIF TEE',
      collectionSlug: 'navratri',
      collectionName: 'NAVRATRI EDIT',
      category: 'Tops',
      description: '280GSM heavy combed cotton graphic tee featuring distressed high-density plastisol prints of traditional Kathiawadi folk art.',
      details: '["Fabric: 100% Organic Heavy Combed Cotton (280 GSM)", "Fit: Signature Boxy Drop-shoulder"]',
      images: '["/assets/products/download (1).jpg", "/assets/products/download (2).jpg"]',
      sizes: '["S", "M", "L", "XL"]',
      availability: 'IN STOCK',
      isFeatured: true,
      isNavratriEdit: true,
      tags: '["NavratriEdit", "GraphicTee", "Tops"]',
      garmentCare: 'Machine wash cold.',
      displayOrder: 3
    },
    {
      id: 'vnm-004',
      slug: 'chunri-deconstructed-kimono-nas1',
      name: 'CHUNRI DECONSTRUCTED KIMONO',
      collectionSlug: 'navratri',
      collectionName: 'NAVRATRI EDIT',
      category: 'Ethnic',
      description: 'Modern hybrid outerwear cape combining bandhani-inspired chunri textile paneling with raw canvas streetwear drapes.',
      details: '["Fabric: Bandhani Cotton Blend & Raw Canvas", "Closure: Open-front with Tactical Nylon Strap Tie"]',
      images: '["/assets/campaign/nas1.webp", "/assets/campaign/nas2.avif"]',
      sizes: '["S/M", "L/XL"]',
      availability: 'MADE TO ORDER',
      isFeatured: true,
      isNavratriEdit: true,
      tags: '["NavratriEdit", "Ethnic", "IndoWestern"]',
      garmentCare: 'Dry clean only.',
      displayOrder: 4
    }
  ],
  campaigns: [
    {
      id: 'camp-1',
      name: 'NAVRATRI EDIT 2026',
      slug: 'navratri-edit-2026',
      description: 'GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR',
      image: '/assets/campaign/HOMEPAGE_2.webp',
      announcement: 'VENM × NAVRATRI: THE FESTIVE EDIT IS NOW LIVE',
      startDate: '2026-09-15',
      endDate: '2026-10-31',
      status: 'ACTIVE',
      theme: 'Festive',
      festivalLights: true,
      dandiya: true,
      chunri: true,
      bangles: false,
      festivalGlow: true
    }
  ],
  homepageSections: [
    {
      id: 'sec-1',
      sectionKey: 'hero',
      name: 'HERO CAMPAIGN BANNER',
      enabled: true,
      displayOrder: 1,
      content: JSON.stringify({
        campaignBadge: 'VENM × NAVRATRI // THE FESTIVE EDIT',
        title: 'VENM CATALOG',
        subtitle: 'TRADITION, REINTERPRETED.',
        description: 'GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR & INDO-WESTERN EXPERIMENTATION.',
        heroImage: '/assets/campaign/HOMEPAGE_2.webp',
        primaryCtaText: 'EXPLORE THE EDIT',
        primaryCtaLink: '/collection/navratri',
        secondaryCtaText: 'ALL COLLECTIONS',
        secondaryCtaLink: '/collections'
      })
    },
    {
      id: 'sec-2',
      sectionKey: 'featured_collection',
      name: 'FEATURED COLLECTION SPOTLIGHT',
      enabled: true,
      displayOrder: 2,
      content: JSON.stringify({
        title: 'NAVRATRI EDIT 2026',
        tagline: 'GUJARATI ETHOS × CYBER STREETWEAR',
        description: 'Traditional Garba silhouettes reengineered through raw distressed denim and mirror-work streetwear.',
        coverImage: '/assets/campaign/HOMEPAGE_2.webp',
        ctaText: 'VIEW COLLECTION (8 PIECES)',
        ctaLink: '/collection/navratri'
      })
    },
    {
      id: 'sec-3',
      sectionKey: 'brand_statement',
      name: 'BRAND PHILOSOPHY & MANIFESTO',
      enabled: true,
      displayOrder: 3,
      content: JSON.stringify({
        badge: 'VENM BRAND PHILOSOPHY',
        line1: 'NOT TRADITIONAL.',
        line2: 'NOT STREETWEAR.',
        line3: 'SOMEWHERE IN BETWEEN.',
        description: 'VENM STANDS AT THE INTERSECTION OF GUJARATI HERITAGE CRAFTSMANSHIP AND Y2K KINETIC STREETWEAR. WE DESIGN SILHOUETTES THAT REBEL AGAINST ORDINARY UNIFORMS WHILE HONORING TRADITIONAL ETHOS.',
        ctaText: 'READ OUR BRAND STORY',
        ctaLink: '/about'
      })
    },
    {
      id: 'sec-4',
      sectionKey: 'lookbook',
      name: 'EDITORIAL LOOKBOOK GRID',
      enabled: true,
      displayOrder: 4,
      content: JSON.stringify({
        title: 'EDITORIAL LOOKBOOK 2026',
        subtitle: 'FESTIVE GARBA SILHOUETTES IN MOTION',
        description: 'A VISUAL ARCHIVE OF BESPOKE GUJARATI FUSION SILHOUETTES',
        images: JSON.stringify([
          { url: '/assets/campaign/nas1.webp', alt: 'Navratri Lookbook 1', title: 'GARBA CYBER VEST' },
          { url: '/assets/campaign/nas2.avif', alt: 'Navratri Lookbook 2', title: 'CHUNRI KIMONO' },
          { url: '/assets/campaign/nas8.jpg', alt: 'Navratri Lookbook 3', title: 'RAW DENIM DRAPE' },
          { url: '/assets/campaign/nas9.jpg', alt: 'Navratri Lookbook 4', title: 'INDO-WESTERN HYBRID' }
        ])
      })
    },
    {
      id: 'sec-5',
      sectionKey: 'about_story',
      name: 'ABOUT PAGE MANIFESTO & STORY',
      enabled: true,
      displayOrder: 5,
      content: JSON.stringify({
        badge: 'VENM ARCHIVE & DESIGN STUDIO',
        title: 'THE MANIFESTO OF VENM',
        subtitle: 'CULTURE × EXPERIMENTATION × YOUTH CULTURE × GUJARATI HERITAGE',
        headline: 'BORN IN AHMEDABAD. ENGINEERED FOR MIDNIGHT.',
        paragraph1: 'VENM was founded with a singular conviction: traditional fashion should not remain frozen in history textbooks or restricted to standard wedding attire.',
        paragraph2: 'Rooted in Gujarat’s centuries-old textile mastery—from intricate bandhani tie-dyes and hand-carved block prints to reflective mirrorwork—VENM reinterprets these sacred cultural motifs through raw 14oz selvedge denim, 400GSM cotton loopback fleece, and tactical cybernetic silhouettes.',
        paragraph3: 'We do not create disposable fast-fashion. We build bespoke catalog pieces designed for confidence, individuality, and midnight Garba energy.',
        coverImage: '/assets/campaign/nas1.webp',
        caption: 'HAND-EMBROIDERED MIRRORWORK & HEAVY DENIM INTEGRATION',
        ctaText: 'EXPLORE THE FESTIVE EDIT',
        ctaLink: '/collection/navratri'
      })
    }
  ],
  settings: [
    {
      id: 'set-1',
      sectionKey: 'general',
      data: JSON.stringify({
        brandName: "VENM",
        tagline: "GUJARATI ETHOS × CYBER STREETWEAR",
        contactEmail: "venm1310@gmail.com",
        contactPhone: "+91 96649 84749",
        location: "Ahmedabad, Gujarat, India",
        footerText: "CONTEMPORARY GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR & INDO-WESTERN SILHOUETTES.",
        siteStatus: "LIVE"
      })
    },
    {
      id: 'set-2',
      sectionKey: 'whatsapp',
      data: JSON.stringify({
        number: "+91 96649 84749",
        rawNumber: "919664984749",
        enabled: true,
        buttonText: "INQUIRE ON WHATSAPP",
        defaultTemplate: "Hi VENM! 👋\nI'm interested in: {{product_name}}\nCollection: {{collection}}\nCategory: {{category}}\nSize: {{size}}\n\nCould you please share availability and bespoke details?\nThank you!"
      })
    },
    {
      id: 'set-3',
      sectionKey: 'social',
      data: JSON.stringify({
        instagram: "https://instagram.com/venm.exe",
        facebook: "https://facebook.com/venmofficial",
        youtube: "https://youtube.com/@venmofficial"
      })
    },
    {
      id: 'set-4',
      sectionKey: 'seo',
      data: JSON.stringify({
        siteTitle: "VENM CATALOG — Gujarati Ethos × Cyber Streetwear",
        metaDescription: "Official VENM Fashion Catalog. Contemporary Gujarati heritage fused with Y2K kinetic streetwear.",
        defaultOgImage: "/assets/campaign/HOMEPAGE_2.webp"
      })
    }
  ],
  media: [
    { id: 'm-1', name: 'HOMEPAGE_2.webp', url: '/assets/campaign/HOMEPAGE_2.webp', type: 'image/webp', size: '115 KB', category: 'Campaigns', usedBy: 'Hero Banner' },
    { id: 'm-2', name: 'venm-logo.png', url: '/assets/brand/venm-logo.png', type: 'image/png', size: '170 KB', category: 'Brand', usedBy: 'Header Logo' },
    { id: 'm-3', name: 'jac3.jpg', url: '/assets/products/jac3.jpg', type: 'image/jpeg', size: '133 KB', category: 'Products', usedBy: 'Garba Cyber Vest' }
  ]
};

// Ensure data directory exists
const dataDir = path.dirname(STORE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure store file exists
if (!fs.existsSync(STORE_PATH)) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_STORE, null, 2));
}

function loadStore() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_STORE;
  }
}

function saveStore(store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Error writing store.json:', err);
  }
}

// Database helper wrapping Prisma-like interface for robust offline/online functionality
const db = {
  user: {
    findUnique: async ({ where }) => {
      const store = loadStore();
      return store.users.find((u) => (where.email && u.email === where.email) || (where.id && u.id === where.id)) || null;
    },
    upsert: async ({ where, update, create }) => {
      const store = loadStore();
      const idx = store.users.findIndex((u) => u.email === where.email);
      if (idx >= 0) {
        store.users[idx] = { ...store.users[idx], ...update, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.users[idx];
      } else {
        const newUser = { id: `u-${Date.now()}`, ...create, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        store.users.push(newUser);
        saveStore(store);
        return newUser;
      }
    }
  },

  product: {
    findMany: async ({ where = {}, orderBy = {} } = {}) => {
      const store = loadStore();
      let res = [...store.products];

      if (where.collectionSlug) {
        res = res.filter((p) => p.collectionSlug === where.collectionSlug);
      }
      if (where.category) {
        res = res.filter((p) => p.category === where.category);
      }
      if (where.availability) {
        if (typeof where.availability === 'object' && where.availability.not !== undefined) {
          res = res.filter((p) => p.availability !== where.availability.not);
        } else {
          res = res.filter((p) => p.availability === where.availability);
        }
      }
      if (where.isFeatured) {
        res = res.filter((p) => p.isFeatured === true);
      }
      if (where.OR && Array.isArray(where.OR)) {
        res = res.filter((p) => {
          return where.OR.some((cond) => {
            if (cond.name?.contains) return p.name.toLowerCase().includes(cond.name.contains.toLowerCase());
            if (cond.slug?.contains) return p.slug.toLowerCase().includes(cond.slug.contains.toLowerCase());
            if (cond.category?.contains) return p.category.toLowerCase().includes(cond.category.contains.toLowerCase());
            return false;
          });
        });
      }
      return res;
    },
    findFirst: async ({ where = {} }) => {
      const store = loadStore();
      if (where.OR) {
        return store.products.find((p) => where.OR.some((c) => (c.slug && p.slug === c.slug) || (c.id && p.id === c.id))) || null;
      }
      return store.products.find((p) => (where.slug && p.slug === where.slug) || (where.id && p.id === where.id)) || null;
    },
    create: async ({ data }) => {
      const store = loadStore();
      const newProduct = {
        id: data.id || `vnm-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };
      store.products.unshift(newProduct);
      saveStore(store);
      return newProduct;
    },
    update: async ({ where, data }) => {
      const store = loadStore();
      const idx = store.products.findIndex((p) => p.id === where.id || p.slug === where.id);
      if (idx >= 0) {
        store.products[idx] = { ...store.products[idx], ...data, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.products[idx];
      }
      throw new Error('Product not found');
    },
    upsert: async ({ where, update, create }) => {
      const store = loadStore();
      const idx = store.products.findIndex((p) => p.slug === where.slug || p.id === where.slug);
      if (idx >= 0) {
        store.products[idx] = { ...store.products[idx], ...update, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.products[idx];
      } else {
        const newP = { id: create.id || `vnm-${Date.now()}`, ...create, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        store.products.push(newP);
        saveStore(store);
        return newP;
      }
    },
    delete: async ({ where }) => {
      const store = loadStore();
      store.products = store.products.filter((p) => p.id !== where.id && p.slug !== where.id);
      saveStore(store);
      return { success: true };
    }
  },

  collection: {
    findMany: async () => {
      const store = loadStore();
      return store.collections;
    },
    findFirst: async ({ where }) => {
      const store = loadStore();
      if (where.OR) {
        return store.collections.find((c) => where.OR.some((cond) => (cond.slug && c.slug === cond.slug) || (cond.id && c.id === cond.id))) || null;
      }
      return store.collections.find((c) => (where.slug && c.slug === where.slug) || (where.id && c.id === where.id)) || null;
    },
    create: async ({ data }) => {
      const store = loadStore();
      const newCol = { id: data.id || data.slug || `col-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
      store.collections.push(newCol);
      saveStore(store);
      return newCol;
    },
    update: async ({ where, data }) => {
      const store = loadStore();
      const idx = store.collections.findIndex((c) => c.id === where.id || c.slug === where.id);
      if (idx >= 0) {
        store.collections[idx] = { ...store.collections[idx], ...data, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.collections[idx];
      }
      throw new Error('Collection not found');
    },
    upsert: async ({ where, update, create }) => {
      const store = loadStore();
      const idx = store.collections.findIndex((c) => c.slug === where.slug || c.id === where.slug);
      if (idx >= 0) {
        store.collections[idx] = { ...store.collections[idx], ...update, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.collections[idx];
      } else {
        const newC = { id: create.id || create.slug, ...create, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        store.collections.push(newC);
        saveStore(store);
        return newC;
      }
    },
    delete: async ({ where }) => {
      const store = loadStore();
      store.collections = store.collections.filter((c) => c.id !== where.id && c.slug !== where.id);
      saveStore(store);
      return { success: true };
    }
  },

  category: {
    findMany: async () => {
      const store = loadStore();
      return store.categories;
    },
    create: async ({ data }) => {
      const store = loadStore();
      const newCat = { id: `cat-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
      store.categories.push(newCat);
      saveStore(store);
      return newCat;
    },
    update: async ({ where, data }) => {
      const store = loadStore();
      const idx = store.categories.findIndex((c) => c.id === where.id);
      if (idx >= 0) {
        store.categories[idx] = { ...store.categories[idx], ...data, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.categories[idx];
      }
      throw new Error('Category not found');
    },
    upsert: async ({ where, update, create }) => {
      const store = loadStore();
      const idx = store.categories.findIndex((c) => c.slug === where.slug);
      if (idx >= 0) {
        store.categories[idx] = { ...store.categories[idx], ...update, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.categories[idx];
      } else {
        const newCat = { id: `cat-${Date.now()}`, ...create, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        store.categories.push(newCat);
        saveStore(store);
        return newCat;
      }
    },
    delete: async ({ where }) => {
      const store = loadStore();
      store.categories = store.categories.filter((c) => c.id !== where.id);
      saveStore(store);
      return { success: true };
    }
  },

  campaign: {
    findMany: async () => {
      const store = loadStore();
      return store.campaigns;
    },
    findFirst: async ({ where = {} }) => {
      const store = loadStore();
      if (where.status) return store.campaigns.find((c) => c.status === where.status) || store.campaigns[0] || null;
      return store.campaigns[0] || null;
    },
    create: async ({ data }) => {
      const store = loadStore();
      const newCamp = { id: `camp-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
      store.campaigns.push(newCamp);
      saveStore(store);
      return newCamp;
    },
    update: async ({ where, data }) => {
      const store = loadStore();
      const idx = store.campaigns.findIndex((c) => c.id === where.id);
      if (idx >= 0) {
        store.campaigns[idx] = { ...store.campaigns[idx], ...data, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.campaigns[idx];
      }
      throw new Error('Campaign not found');
    },
    upsert: async ({ where, update, create }) => {
      const store = loadStore();
      const idx = store.campaigns.findIndex((c) => c.slug === where.slug);
      if (idx >= 0) {
        store.campaigns[idx] = { ...store.campaigns[idx], ...update, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.campaigns[idx];
      } else {
        const newCamp = { id: `camp-${Date.now()}`, ...create, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        store.campaigns.push(newCamp);
        saveStore(store);
        return newCamp;
      }
    },
    delete: async ({ where }) => {
      const store = loadStore();
      store.campaigns = store.campaigns.filter((c) => c.id !== where.id);
      saveStore(store);
      return { success: true };
    }
  },

  homepageSection: {
    findMany: async () => {
      const store = loadStore();
      return store.homepageSections;
    },
    upsert: async ({ where, update, create }) => {
      const store = loadStore();
      const idx = store.homepageSections.findIndex((s) => s.sectionKey === where.sectionKey);
      if (idx >= 0) {
        store.homepageSections[idx] = { ...store.homepageSections[idx], ...update, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.homepageSections[idx];
      } else {
        const newSec = { id: `sec-${Date.now()}`, ...create, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        store.homepageSections.push(newSec);
        saveStore(store);
        return newSec;
      }
    }
  },

  setting: {
    findMany: async () => {
      const store = loadStore();
      return store.settings;
    },
    upsert: async ({ where, update, create }) => {
      const store = loadStore();
      const idx = store.settings.findIndex((s) => s.sectionKey === where.sectionKey);
      if (idx >= 0) {
        store.settings[idx] = { ...store.settings[idx], ...update, updatedAt: new Date().toISOString() };
        saveStore(store);
        return store.settings[idx];
      } else {
        const newSet = { id: `set-${Date.now()}`, ...create, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        store.settings.push(newSet);
        saveStore(store);
        return newSet;
      }
    }
  },

  media: {
    findMany: async () => {
      const store = loadStore();
      return store.media;
    },
    create: async ({ data }) => {
      const store = loadStore();
      const newM = { id: `m-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
      store.media.unshift(newM);
      saveStore(store);
      return newM;
    },
    delete: async ({ where }) => {
      const store = loadStore();
      store.media = store.media.filter((m) => m.id !== where.id);
      saveStore(store);
      return { success: true };
    }
  },

  activityLog: {
    findMany: async ({ limit = 50, page = 1, action, entityType } = {}) => {
      const store = loadStore();
      let res = [...(store.activityLogs || [])];
      if (action) res = res.filter((a) => a.action === action);
      if (entityType) res = res.filter((a) => a.entityType === entityType);
      res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const start = (page - 1) * limit;
      return res.slice(start, start + limit);
    },
    count: async ({ action, entityType } = {}) => {
      const store = loadStore();
      let res = [...(store.activityLogs || [])];
      if (action) res = res.filter((a) => a.action === action);
      if (entityType) res = res.filter((a) => a.entityType === entityType);
      return res.length;
    },
    create: async ({ data }) => {
      const store = loadStore();
      if (!store.activityLogs) store.activityLogs = [];
      const newLog = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        adminUserId: data.adminUserId || 'admin-1',
        adminEmail: data.adminEmail || 'venm1310@gmail.com',
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        entityName: data.entityName || '',
        description: data.description || '',
        metadata: data.metadata || {},
        createdAt: new Date().toISOString()
      };
      store.activityLogs.unshift(newLog);
      if (store.activityLogs.length > 500) {
        store.activityLogs = store.activityLogs.slice(0, 500);
      }
      saveStore(store);
      if (global.broadcastActivitySSE) {
        global.broadcastActivitySSE(newLog);
      }
      return newLog;
    }
  }
};

export default db;
