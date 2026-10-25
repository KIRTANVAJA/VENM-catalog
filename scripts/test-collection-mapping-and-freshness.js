import http from 'http';
import app from '../server/app.js';
import prisma from '../server/config/db.js';
import { generateToken } from '../server/utils/token.js';

const PORT = 5588;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('VENM CATALOG — COLLECTION MAPPING, FRESHNESS & ACTIVE FEST TESTS');
  console.log('================================================================');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[TEST SERVER] Running on port ${PORT}`);

  // Fetch Admin user from DB and generate valid JWT Token
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    throw new Error('No admin user found in database for testing.');
  }
  const adminToken = generateToken(adminUser);
  const authHeaders = {
    Authorization: `Bearer ${adminToken}`,
    Cookie: `venm_admin_token=${adminToken}`
  };

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Cache-Control Headers for Freshness (Bug 1)
    // ----------------------------------------------------
    console.log('\n[TEST 1] HTTP Cache-Control Headers for Real-Time Freshness');
    const prodsRes = await makeRequest('GET', '/products');
    assert(prodsRes.status === 200, 'GET /api/products returns HTTP 200');
    assert(
      prodsRes.headers['cache-control'] && prodsRes.headers['cache-control'].includes('no-store'),
      'GET /api/products includes Cache-Control: no-store'
    );
    assert(
      prodsRes.headers['cache-control'].includes('no-cache'),
      'GET /api/products includes Cache-Control: no-cache'
    );

    const colsRes = await makeRequest('GET', '/collections');
    assert(colsRes.status === 200, 'GET /api/collections returns HTTP 200');
    assert(
      colsRes.headers['cache-control'] && colsRes.headers['cache-control'].includes('no-store'),
      'GET /api/collections includes Cache-Control: no-store'
    );

    // ----------------------------------------------------
    // TEST 2: Permanent Collections Existence & Status (Bug 2)
    // ----------------------------------------------------
    console.log('\n[TEST 2] Permanent Collections Existence and Public Visibility');
    const allCols = colsRes.data;
    assert(Array.isArray(allCols), 'Collections returned as array');

    const diwaliCol = allCols.find((c) => c.slug === 'diwali' || c.id === 'diwali');
    assert(!!diwaliCol, 'Diwali collection exists in collections API');
    assert(diwaliCol.name === 'DIWALI EDIT' || diwaliCol.name === 'DIWALI COLLECTION', 'Diwali collection name is DIWALI EDIT or DIWALI COLLECTION');
    assert(diwaliCol.status === 'ACTIVE' || diwaliCol.isActive === true, 'Diwali collection is ACTIVE');

    const indoCol = allCols.find((c) => c.slug === 'indo-western');
    assert(!!indoCol, 'Indo-Western collection exists in collections API');
    assert(indoCol.name === 'INDO-WESTERN', 'Indo-Western collection name is INDO-WESTERN');
    assert(indoCol.status === 'ACTIVE' || indoCol.isActive === true, 'Indo-Western collection is ACTIVE');

    const accessoriesCol = allCols.find((c) => c.slug === 'accessories');
    assert(!!accessoriesCol, 'Accessories collection exists in collections API');

    const navratriCol = allCols.find((c) => c.slug === 'navratri');
    assert(!!navratriCol, 'Navratri collection exists in collections API');

    // ----------------------------------------------------
    // TEST 3: Product-to-Collection Mapping
    // ----------------------------------------------------
    console.log('\n[TEST 3] Product-to-Collection Mapping & Separation');
    // Fetch products belonging to Diwali
    const diwaliProdsRes = await makeRequest('GET', '/products?collection=diwali');
    assert(diwaliProdsRes.status === 200, 'GET /api/products?collection=diwali returns 200');
    assert(Array.isArray(diwaliProdsRes.data), 'Diwali products returned as array');
    const diwaliSlugs = diwaliProdsRes.data.map((p) => p.slug);
    assert(diwaliSlugs.includes('black-kurta'), 'Dark Knight Kurta appears under Diwali collection');
    assert(!diwaliSlugs.includes('rangrez-patchwork-flared-pants'), 'Indo-Western product does NOT appear under Diwali');

    // Fetch products belonging to Indo-Western
    const indoProdsRes = await makeRequest('GET', '/products?collection=indo-western');
    assert(indoProdsRes.status === 200, 'GET /api/products?collection=indo-western returns 200');
    const indoSlugs = indoProdsRes.data.map((p) => p.slug);
    assert(indoSlugs.includes('rangrez-patchwork-flared-pants'), 'Rangrez Flared Pants appears under Indo-Western');
    assert(indoSlugs.includes('rangrez-embroisered-fusion-shirt'), 'Rangrez Fusion Shirt appears under Indo-Western');
    assert(!indoSlugs.includes('black-kurta'), 'Diwali product does NOT appear under Indo-Western');

    // ----------------------------------------------------
    // TEST 4: Collection Detail API for Diwali and Indo-Western
    // ----------------------------------------------------
    console.log('\n[TEST 4] Collection Detail Endpoint with Associated Products');
    const diwaliDetail = await makeRequest('GET', '/collections/diwali');
    assert(diwaliDetail.status === 200, 'GET /api/collections/diwali returns 200');
    assert(diwaliDetail.data.name === 'DIWALI EDIT', 'Diwali detail returns DIWALI EDIT name');
    assert(Array.isArray(diwaliDetail.data.products), 'Diwali detail returns products array');
    assert(diwaliDetail.data.products.some((p) => p.slug === 'black-kurta'), 'Dark Knight Kurta is in Diwali detail products');

    const indoDetail = await makeRequest('GET', '/collections/indo-western');
    assert(indoDetail.status === 200, 'GET /api/collections/indo-western returns 200');
    assert(indoDetail.data.products.length >= 2, 'Indo-Western detail returns at least 2 products');

    // ----------------------------------------------------
    // TEST 5: Create Product with Collection ID & Persistence
    // ----------------------------------------------------
    console.log('\n[TEST 5] Create Product with Collection ID & DB Relationship Persistence');
    const testSlug = `acc-test-item-${Date.now()}`;
    const createRes = await makeRequest('POST', '/products', {
      name: 'TEST SILVER BROOCH',
      slug: testSlug,
      collectionId: accessoriesCol.id,
      category: 'Accessories',
      description: 'Handcrafted test accessory.',
      images: ['/assets/migrated/test-brooch.webp'],
      sizes: ['Custom'],
      availability: 'REQUESTABLE'
    }, authHeaders);

    assert(createRes.status === 201, 'Product created successfully with HTTP 201');
    assert(createRes.data.collectionId === accessoriesCol.id, 'Created product persisted collectionId');
    assert(createRes.data.collectionSlug === 'accessories', 'Created product has synchronized collectionSlug');
    assert(createRes.data.collectionName === accessoriesCol.name, 'Created product has synchronized collectionName');

    const createdId = createRes.data.id;

    // Verify it appears under Accessories query
    const accProds = await makeRequest('GET', '/products?collection=accessories');
    assert(accProds.data.some((p) => p.id === createdId), 'New product immediately appears under Accessories collection');

    // Verify it does NOT appear under Diwali or Indo-Western
    const diwaliAfter = await makeRequest('GET', '/products?collection=diwali');
    assert(!diwaliAfter.data.some((p) => p.id === createdId), 'Accessories item does NOT appear under Diwali');

    // ----------------------------------------------------
    // TEST 6: Edit Product Collection (Reassignment)
    // ----------------------------------------------------
    console.log('\n[TEST 6] Edit Product Collection & Immediate Relationship Update');
    const updateRes = await makeRequest('PUT', `/products/${createdId}`, {
      collectionId: diwaliCol.id
    }, authHeaders);
    assert(updateRes.status === 200, 'Product update returned HTTP 200');
    assert(updateRes.data.collectionId === diwaliCol.id, 'Product collectionId updated to Diwali');
    assert(updateRes.data.collectionSlug === 'diwali', 'Product collectionSlug updated to diwali');

    // Verify it now appears under Diwali
    const diwaliReassigned = await makeRequest('GET', '/products?collection=diwali');
    assert(diwaliReassigned.data.some((p) => p.id === createdId), 'Reassigned product appears under Diwali');

    // Verify it disappeared from Accessories
    const accAfterReassign = await makeRequest('GET', '/products?collection=accessories');
    assert(!accAfterReassign.data.some((p) => p.id === createdId), 'Reassigned product disappeared from Accessories');

    // ----------------------------------------------------
    // TEST 7: Collection Rename Cascades via Stable ID
    // ----------------------------------------------------
    console.log('\n[TEST 7] Collection Rename Cascades via Stable collectionId');
    const customColSlug = `capsule-${Date.now()}`;
    const customCol = await makeRequest('POST', '/collections', {
      name: 'LIMITED CAPSULE',
      slug: customColSlug,
      tagline: 'SPECIAL DROP'
    }, authHeaders);
    assert(customCol.status === 201, 'Created new collection');

    // Assign test product to this new collection
    await makeRequest('PUT', `/products/${createdId}`, {
      collectionId: customCol.data.id
    }, authHeaders);

    // Rename the collection
    const renamedCol = await makeRequest('PUT', `/collections/${customCol.data.id}`, {
      name: 'ARCHIVE CAPSULE RENAMED'
    }, authHeaders);
    assert(renamedCol.status === 200, 'Renamed collection');

    // Verify product still retains relation and updated collectionName
    const productAfterColRename = await makeRequest('GET', `/products/${testSlug}`);
    assert(productAfterColRename.data.collectionId === customCol.data.id, 'Product retains stable collectionId after collection rename');
    assert(productAfterColRename.data.collectionName === 'ARCHIVE CAPSULE RENAMED', 'Product synchronized with renamed collection name');

    // ----------------------------------------------------
    // TEST 8: Active Fest Is Dynamic & Does NOT Mutate Permanent Collections
    // ----------------------------------------------------
    console.log('\n[TEST 8] Active Fest Dynamism & Permanent Collection Independence');
    const settingsBefore = await makeRequest('GET', '/settings');
    assert(settingsBefore.status === 200, 'GET /settings succeeds');
    assert(!!settingsBefore.data.active_fest, 'Settings includes active_fest');

    // Update active festival to a new festival (e.g. HOLI EDIT)
    await makeRequest('PUT', '/settings', {
      sectionKey: 'active_fest',
      data: {
        name: 'HOLI EDIT',
        slug: 'holi',
        navLabel: 'HOLI EDIT',
        announcement: 'VENM × HOLI: EXPERIMENTAL COLOR CAPSULE',
        assignedProductIds: [createdId]
      }
    }, authHeaders);

    // Verify settings updated
    const settingsAfter = await makeRequest('GET', '/settings');
    assert(settingsAfter.data.active_fest.name === 'HOLI EDIT', 'Active Fest setting updated to HOLI EDIT');
    assert(settingsAfter.data.active_fest.slug === 'holi', 'Active Fest slug updated to holi');

    // CRITICAL CHECK: Verify permanent collections are 100% UNTOUCHED!
    const colsAfterFestChange = await makeRequest('GET', '/collections');
    const diwaliCheck = colsAfterFestChange.data.find((c) => c.slug === 'diwali');
    assert(!!diwaliCheck, 'Diwali collection remains intact after Active Fest changed to Holi');
    assert(diwaliCheck.name === 'DIWALI EDIT', 'Diwali collection name remains DIWALI EDIT');

    const indoCheck = colsAfterFestChange.data.find((c) => c.slug === 'indo-western');
    assert(!!indoCheck, 'Indo-Western collection remains intact after Active Fest changed');

    // Restore active_fest to Diwali Edit
    await makeRequest('PUT', '/settings', {
      sectionKey: 'active_fest',
      data: {
        name: 'DIWALI EDIT',
        slug: 'diwali',
        navLabel: 'DIWALI EDIT',
        announcement: 'VENM × DIWALI EDIT: THE FESTIVE EDIT IS NOW LIVE',
        assignedProductIds: [diwaliDetail.data.products[0]?.id || createdId]
      }
    }, authHeaders);
    console.log('  ✓ PASS: Restored active_fest back to Diwali Edit');

    // ----------------------------------------------------
    // CLEANUP TEST DATA
    // ----------------------------------------------------
    console.log('\n[CLEANUP] Removing test product and temporary test collection...');
    await makeRequest('DELETE', `/products/${createdId}`, null, authHeaders);
    await makeRequest('DELETE', `/collections/${customCol.data.id}`, null, authHeaders);
    console.log('  ✓ Cleaned up test records');

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passed} / ${total} ASSERTIONS PASSED (100%)`);
    console.log('================================================================');

  } finally {
    server.close();
  }
}

runTests().then(() => {
  console.log('\nALL TESTS COMPLETED SUCCESSFULLY.');
  process.exit(0);
}).catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
