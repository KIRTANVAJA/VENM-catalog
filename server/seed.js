import bcrypt from 'bcryptjs';
import prisma from './config/db.js';
import { PRODUCTS, COLLECTIONS } from '../src/data/catalog.js';

async function main() {
  console.log('🌱 SEEDING VENM CATALOG DATABASE...');

  // 1. Seed Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'venm1310@gmail.com' },
    update: { passwordHash },
    create: {
      name: 'Studio Admin',
      email: 'venm1310@gmail.com',
      passwordHash,
      role: 'ADMIN'
    }
  });
  console.log(`✅ Admin user seeded: ${adminUser.email}`);

  // 2. Seed Collections
  for (let i = 0; i < COLLECTIONS.length; i++) {
    const c = COLLECTIONS[i];
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        coverImage: c.coverImage,
        season: c.season,
        status: c.isActive ? 'ACTIVE' : 'COMING_SOON',
        featured: Boolean(c.isFeatured),
        displayOrder: i + 1
      },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        description: c.description,
        coverImage: c.coverImage,
        season: c.season,
        status: c.isActive ? 'ACTIVE' : 'COMING_SOON',
        featured: Boolean(c.isFeatured),
        displayOrder: i + 1
      }
    });
  }
  console.log(`✅ ${COLLECTIONS.length} Collections seeded`);

  // 3. Seed Categories
  const categories = [
    { name: 'Outerwear', slug: 'outerwear', displayOrder: 1 },
    { name: 'Tops', slug: 'tops', displayOrder: 2 },
    { name: 'Bottoms', slug: 'bottoms', displayOrder: 3 },
    { name: 'Ethnic', slug: 'ethnic', displayOrder: 4 },
    { name: 'Accessories', slug: 'accessories', displayOrder: 5 }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, displayOrder: cat.displayOrder },
      create: { name: cat.name, slug: cat.slug, displayOrder: cat.displayOrder }
    });
  }
  console.log(`✅ ${categories.length} Categories seeded`);

  // 4. Seed Products
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        details: JSON.stringify(p.details || []),
        collectionSlug: p.collectionSlug,
        collectionName: p.collectionName,
        category: p.category,
        images: JSON.stringify(p.images || []),
        sizes: JSON.stringify(p.sizes || []),
        availability: p.availability || 'IN STOCK',
        isFeatured: Boolean(p.isFeatured),
        isNavratriEdit: Boolean(p.isNavratriEdit),
        tags: JSON.stringify(p.tags || []),
        garmentCare: p.garmentCare || '',
        displayOrder: i + 1
      },
      create: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        details: JSON.stringify(p.details || []),
        collectionSlug: p.collectionSlug,
        collectionName: p.collectionName,
        category: p.category,
        images: JSON.stringify(p.images || []),
        sizes: JSON.stringify(p.sizes || []),
        availability: p.availability || 'IN STOCK',
        isFeatured: Boolean(p.isFeatured),
        isNavratriEdit: Boolean(p.isNavratriEdit),
        tags: JSON.stringify(p.tags || []),
        garmentCare: p.garmentCare || '',
        displayOrder: i + 1
      }
    });
  }
  console.log(`✅ ${PRODUCTS.length} Products seeded`);

  // 5. Seed Campaigns
  await prisma.campaign.upsert({
    where: { slug: 'navratri-edit-2026' },
    update: { status: 'ACTIVE' },
    create: {
      name: 'NAVRATRI EDIT 2026',
      slug: 'navratri-edit-2026',
      description: 'GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR',
      image: '/assets/campaign/HOMEPAGE_2.webp',
      announcement: 'VENM × NAVRATRI: THE FESTIVE EDIT IS NOW LIVE',
      status: 'ACTIVE',
      festivalLights: true,
      dandiya: true,
      chunri: true,
      bangles: false,
      festivalGlow: true
    }
  });
  console.log(`✅ Campaigns seeded`);

  // 6. Seed Settings
  const settingsData = [
    {
      sectionKey: 'general',
      data: JSON.stringify({
        brandName: "VENM",
        tagline: "GUJARATI ETHOS × CYBER STREETWEAR",
        contactEmail: "venm1310@gmail.com",
        contactPhone: "+91 96649 84749",
        location: "Ahmedabad, Gujarat, India",
        footerText: "CONTEMPORARY GUJARATI ETHOS FUSED WITH METROPOLITAN STREETWEAR & INDO-WESTERN SILHOUETTES.",
        siteStatus: "LIVE",
        logoUrl: "/assets/brand/venm-logo.png"
      })
    },
    {
      sectionKey: 'whatsapp',
      data: JSON.stringify({
        number: "+91 96649 84749",
        rawNumber: "919664984749",
        enabled: true,
        buttonText: "INQUIRE ON WHATSAPP",
        defaultTemplate: `Hi VENM! 👋\nI'm interested in: {{product_name}}\nCollection: {{collection}}\nCategory: {{category}}\nSize: {{size}}\n\nCould you please share availability and bespoke details?\nThank you!`
      })
    },
    {
      sectionKey: 'social',
      data: JSON.stringify({
        instagram: "https://instagram.com/venm.exe",
        facebook: "https://facebook.com/venmofficial",
        youtube: "https://youtube.com/@venmofficial"
      })
    },
    {
      sectionKey: 'seo',
      data: JSON.stringify({
        siteTitle: "VENM CATALOG — Gujarati Ethos × Cyber Streetwear",
        metaDescription: "Official VENM Fashion Catalog. Contemporary Gujarati heritage fused with Y2K kinetic streetwear, distressed selvedge denim, and Navratri campaign edits.",
        defaultOgImage: "/assets/campaign/HOMEPAGE_2.webp",
        keywords: "VENM, Gujarati Streetwear, Navratri Garba Fashion, Indo-Western, Raw Denim"
      })
    }
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { sectionKey: s.sectionKey },
      update: { data: s.data },
      create: { sectionKey: s.sectionKey, data: s.data }
    });
  }
  console.log(`✅ Settings seeded`);

  console.log('🎉 SEEDING COMPLETE SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  });
