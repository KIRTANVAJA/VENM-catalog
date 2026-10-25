import assert from 'assert';
import http from 'http';
import app from '../server/app.js';
import prisma from '../server/config/db.js';
import { generateToken } from '../server/utils/token.js';
import { normalizeImagePath } from '../server/controllers/collectionController.js';

const PORT = 5599;
let server;
let adminToken;
let authHeaders;

const BASE_URL = `http://localhost:${PORT}/api`;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {})
    },
    ...options
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, headers: res.headers, body: data };
}

async function runTests() {
  console.log('================================================================');
  console.log('VENM CATALOG — COLLECTION IMAGE PERSISTENCE & DISPLAY TESTS');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${desc}`);
      console.error(`    -> ${err.message}`);
      failed++;
    }
  }

  // Start test server
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}\n`);
      resolve();
    });
  });

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  assert(adminUser, 'Admin user must exist in database');
  adminToken = generateToken(adminUser);
  authHeaders = { Authorization: `Bearer ${adminToken}` };

  const testIdA = `test-col-a-${Date.now()}`;
  const testIdB = `test-col-b-${Date.now()}`;
  const imageA = '/assets/campaign/nas8.jpg';
  const imageB = 'https://res.cloudinary.com/dvyhywbe/image/upload/v1792850000/venm-catalog/collections/sample.webp';
  const imageBOriginal = '/assets/campaign/nas1.webp';

  try {
    console.log('[TEST 1] normalizeImagePath utility unit tests');
    test('Strips wrapping double quotes from Windows path', () => {
      const res = normalizeImagePath('"D:\\ceative\\5PROJECTS\\VENM1\\VENM1\\public\\assets\\products\\Denim Jacket.jpg"');
      assert.strictEqual(res, '/assets/products/Denim Jacket.jpg');
    });

    test('Strips single quotes and whitespace', () => {
      const res = normalizeImagePath("  '/assets/campaign/nas8.jpg'  ");
      assert.strictEqual(res, '/assets/campaign/nas8.jpg');
    });

    test('Preserves Cloudinary HTTPS URLs intact', () => {
      const url = 'https://res.cloudinary.com/dvyhywbe/image/upload/v12345/collection.jpg';
      const res = normalizeImagePath(url);
      assert.strictEqual(res, url);
    });

    test('Adds leading slash for relative web asset paths', () => {
      const res = normalizeImagePath('assets/campaign/nas9.jpg');
      assert.strictEqual(res, '/assets/campaign/nas9.jpg');
    });

    test('Falls back gracefully for null or empty string', () => {
      const res = normalizeImagePath('');
      assert.strictEqual(res, '/assets/campaign/HOMEPAGE_2.webp');
    });

    console.log('\n[TEST 2] Create Collection A with Image A & Collection B with Image B');
    const createResA = await request('/collections', {
      method: 'POST',
      body: JSON.stringify({
        name: `COLLECTION A ${Date.now()}`,
        slug: testIdA,
        coverImage: imageA,
        status: 'ACTIVE'
      })
    });
    test('Collection A created successfully', () => {
      assert.strictEqual(createResA.status, 201);
      assert.strictEqual(createResA.body.coverImage, imageA);
    });

    const createResB = await request('/collections', {
      method: 'POST',
      body: JSON.stringify({
        name: `COLLECTION B ${Date.now()}`,
        slug: testIdB,
        coverImage: imageBOriginal,
        status: 'ACTIVE'
      })
    });
    test('Collection B created successfully', () => {
      assert.strictEqual(createResB.status, 201);
      assert.strictEqual(createResB.body.coverImage, imageBOriginal);
    });

    console.log('\n[TEST 3] Confirm DB and Public API return exact Image A for Collection A');
    const dbColA = await prisma.collection.findUnique({ where: { id: createResA.body.id } });
    test('Database stores exact Image A for Collection A', () => {
      assert.strictEqual(dbColA.coverImage, imageA);
    });

    const apiColA = await request(`/collections/${testIdA}`);
    test('Public API GET /collections/:slug returns exact Image A', () => {
      assert.strictEqual(apiColA.status, 200);
      assert.strictEqual(apiColA.body.coverImage, imageA);
    });

    const apiAllCols = await request('/collections');
    test('Public API GET /collections list includes Collection A with Image A', () => {
      assert.strictEqual(apiAllCols.status, 200);
      const found = apiAllCols.body.find((c) => c.slug === testIdA);
      assert(found, 'Collection A should be in list');
      assert.strictEqual(found.coverImage, imageA);
    });

    console.log('\n[TEST 4] Change Collection A image to Cloudinary Image B');
    const updateResA = await request(`/collections/${createResA.body.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        coverImage: imageB
      })
    });
    test('Update Collection A returns HTTP 200 with new image', () => {
      assert.strictEqual(updateResA.status, 200);
      assert.strictEqual(updateResA.body.coverImage, imageB);
    });

    const dbColAUpdated = await prisma.collection.findUnique({ where: { id: createResA.body.id } });
    test('Database persisted Image B for Collection A', () => {
      assert.strictEqual(dbColAUpdated.coverImage, imageB);
    });

    const apiColAUpdated = await request(`/collections/${testIdA}`);
    test('Public API GET /collections/:slug immediately returns Image B', () => {
      assert.strictEqual(apiColAUpdated.body.coverImage, imageB);
    });

    console.log('\n[TEST 5] Confirm Collection B image remains completely unchanged');
    const dbColB = await prisma.collection.findUnique({ where: { id: createResB.body.id } });
    test('Collection B image is untouched in DB', () => {
      assert.strictEqual(dbColB.coverImage, imageBOriginal);
    });

    const apiColB = await request(`/collections/${testIdB}`);
    test('Collection B public API detail returns untouched image', () => {
      assert.strictEqual(apiColB.body.coverImage, imageBOriginal);
    });

    console.log('\n[TEST 6] Test Windows quoted path submission normalization via API');
    const quotedWindowsPath = '"D:\\ceative\\5PROJECTS\\VENM1\\VENM1\\public\\assets\\collections\\denim.jpg"';
    const updateQuoted = await request(`/collections/${createResA.body.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        coverImage: quotedWindowsPath
      })
    });
    test('Backend normalizes Windows quoted path into clean web path', () => {
      assert.strictEqual(updateQuoted.status, 200);
      assert.strictEqual(updateQuoted.body.coverImage, '/assets/collections/denim.jpg');
    });

    const dbNormalized = await prisma.collection.findUnique({ where: { id: createResA.body.id } });
    test('Database persists sanitized path without quotes or Windows drive letter', () => {
      assert.strictEqual(dbNormalized.coverImage, '/assets/collections/denim.jpg');
    });

  } finally {
    console.log('\n[CLEANUP] Removing test collections...');
    await prisma.collection.deleteMany({
      where: {
        slug: { in: [testIdA, testIdB] }
      }
    }).catch(() => {});
    console.log('  ✓ Cleaned up test records');

    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} / ${passed + failed} ASSERTIONS PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('[UNCAUGHT ERROR]', err);
  process.exit(1);
});
