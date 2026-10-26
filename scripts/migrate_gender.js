import prisma from '../server/config/db.js';

async function migrate() {
  console.log('🚀 RUNNING DATABASE MIGRATION: ADD GENDER TO PRODUCT TABLE...');

  try {
    // 1. Add gender column if it does not already exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "gender" TEXT DEFAULT 'UNCLASSIFIED';
    `);
    console.log('✅ Column "gender" checked / added to "Product" table.');

    // 2. Add index on gender
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Product_gender_idx" ON "Product"("gender");
    `);
    console.log('✅ Index "Product_gender_idx" checked / created.');

    // 3. Ensure all existing products have 'UNCLASSIFIED' if null
    const updated = await prisma.$executeRawUnsafe(`
      UPDATE "Product" 
      SET "gender" = 'UNCLASSIFIED' 
      WHERE "gender" IS NULL;
    `);
    console.log(`✅ Backfilled existing products to UNCLASSIFIED (Rows updated: ${updated}).`);

    // 4. Verify all products
    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, gender: true }
    });
    console.log(`\n📦 CURRENT DATABASE PRODUCTS (${products.length}):`);
    products.forEach((p, idx) => {
      console.log(`  [${idx + 1}] ${p.name} (${p.slug}) -> GENDER: ${p.gender}`);
    });

    console.log('\n🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ MIGRATION FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
