/**
 * Database Image Migration Script
 * Converts any legacy Base64 images in PostgreSQL into clean, static public assets
 * at /assets/migrated/ and updates the database records.
 */

import fs from 'fs';
import path from 'path';
import prisma from '../server/config/db.js';

async function migrateBase64Images() {
  console.log('================================================================');
  console.log('MIGRATING LEGACY BASE64 IMAGES IN POSTGRESQL DATABASE');
  console.log('================================================================\n');

  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products in database.\n`);

  const migratedDir = path.join(process.cwd(), 'public', 'assets', 'migrated');
  if (!fs.existsSync(migratedDir)) {
    fs.mkdirSync(migratedDir, { recursive: true });
  }

  let migratedCount = 0;

  for (const product of products) {
    let images = [];
    try {
      images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      if (!Array.isArray(images)) images = [images];
    } catch (e) {
      images = [product.images];
    }

    let productHadBase64 = false;
    const cleanImages = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        productHadBase64 = true;
        const match = img.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (match) {
          const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          const filename = `${product.slug}-${i}.${ext}`;
          const filePath = path.join(migratedDir, filename);
          const buffer = Buffer.from(match[2], 'base64');

          fs.writeFileSync(filePath, buffer);
          const publicUrl = `/assets/migrated/${filename}`;
          cleanImages.push(publicUrl);
          console.log(`  -> Migrated Base64 image (${(buffer.length / 1024).toFixed(1)} KB) -> ${publicUrl}`);
        } else {
          cleanImages.push(img);
        }
      } else {
        cleanImages.push(img);
      }
    }

    if (productHadBase64) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: JSON.stringify(cleanImages)
        }
      });
      migratedCount++;
      console.log(`✓ Updated product "${product.name}" (${product.slug}): ${cleanImages.length} clean URLs saved.\n`);
    } else {
      console.log(`✓ Product "${product.name}" (${product.slug}): Already has clean URLs.\n`);
    }
  }

  console.log('================================================================');
  console.log(`MIGRATION COMPLETE: ${migratedCount} products updated in database.`);
  console.log('================================================================');
}

migrateBase64Images()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
