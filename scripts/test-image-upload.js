/**
 * VENM Reference Catalog - Comprehensive Image Upload & Persistence Test Suite
 *
 * Verifies all 10 scenarios outlined in Phase 5:
 * 1. Base64 rejection prevents FUNCTION_PAYLOAD_TOO_LARGE and payload bloat
 * 2. Cloudinary upload signature generation
 * 3. Create a product with 1 image
 * 4. Create a product with 2 images
 * 5. Create a product with 5 images
 * 6. Edit a product and add another image (now 6 images)
 * 7. Remove an image and save the product
 * 8. Change the cover image (reorder index 0)
 * 9. Save a draft containing 5 images
 * 10. Publish a product containing 5 images
 * 11. Refresh / Query check: confirm all images persist
 * 12. Deletion handling with safe asset cleanup
 */

import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import app from '../server/app.js';
import prisma from '../server/config/db.js';
import { generateSignedUploadParams, isCloudinaryConfigured } from '../server/config/cloudinary.js';

dotenv.config();

const PORT = 5566;
let server;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api${path}`,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);

    if (options.body) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(data);
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('VENM CATALOG — MULTI-IMAGE UPLOAD & PERSISTENCE TEST SUITE');
  console.log('===============================================================\n');

  // Start test HTTP server
  server = app.listen(PORT);
  console.log(`[TEST SERVER] Running on port ${PORT}`);

  // Fetch Admin user from DB and generate valid JWT Token
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    throw new Error('No admin user found in database for testing.');
  }
  const { generateToken } = await import('../server/utils/token.js');
  const adminToken = generateToken(adminUser);
  const authHeaders = {
    Authorization: `Bearer ${adminToken}`,
    Cookie: `venm_admin_token=${adminToken}`
  };

  let testProductIds = [];
  let passedCount = 0;
  let totalTests = 0;

  function assert(condition, name) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Root Cause Prevention - Base64 Payload Rejection
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Root Cause Prevention: Base64 Payload Rejection');
    const fakeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(5000);
    const base64Res = await makeRequest('/products', {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'TEST REJECT BASE64',
        images: [fakeBase64]
      }
    });

    assert(
      base64Res.status === 400 &&
      base64Res.body.message &&
      base64Res.body.message.includes('INVALID_IMAGE_PAYLOAD'),
      'Direct Base64 images are rejected by the API with HTTP 400, preventing FUNCTION_PAYLOAD_TOO_LARGE'
    );

    // -------------------------------------------------------------
    // TEST 2: Upload Signature Generation Endpoint
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Cloudinary Upload Signature Endpoint');
    const sigRes = await makeRequest('/media/upload-signature?folder=venm-catalog/products', {
      headers: authHeaders
    });

    assert(
      sigRes.status === 200 && sigRes.body !== undefined,
      'Upload signature endpoint is accessible by admin'
    );
    assert(
      sigRes.body.api_secret === undefined && sigRes.body.CLOUDINARY_API_SECRET === undefined,
      'Cloudinary API secret is NEVER exposed to the frontend'
    );

    // -------------------------------------------------------------
    // TEST 3: Create a product with 1 image
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Scenario: Create a product with 1 image');
    const img1 = 'https://res.cloudinary.com/venm-cloud/image/upload/v1740000001/venm-catalog/products/look-1.jpg';
    const prod1Payload = {
      name: 'VENM CYBER VEST LOOK 1',
      description: 'Single image test reference piece',
      collectionSlug: 'navratri',
      collectionName: 'NAVRATRI EDIT',
      category: 'Outerwear',
      availability: 'REQUESTABLE',
      estimatedPrice: 'Estimated from ₹2,200',
      images: [img1]
    };

    const payloadBytes1 = JSON.stringify(prod1Payload).length;
    console.log(`  -> Payload size sent to API: ${payloadBytes1} bytes (well below 4.5MB limit)`);
    assert(payloadBytes1 < 1000, 'Payload size with 1 image is tiny (< 1000 bytes)');

    const prod1Res = await makeRequest('/products', {
      method: 'POST',
      headers: authHeaders,
      body: prod1Payload
    });

    assert(prod1Res.status === 201, 'Product with 1 image created successfully (HTTP 201)');
    assert(prod1Res.body.images.length === 1, 'Product has exactly 1 image');
    assert(prod1Res.body.images[0] === img1, 'First image matches img1');
    testProductIds.push(prod1Res.body.id);

    // -------------------------------------------------------------
    // TEST 4: Create a product with 2 images (previously failed with FUNCTION_PAYLOAD_TOO_LARGE)
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Scenario: Create a product with 2 images');
    const img2 = 'https://res.cloudinary.com/venm-cloud/image/upload/v1740000002/venm-catalog/products/look-2.jpg';
    const prod2Payload = {
      name: 'VENM CYBER VEST LOOK 2',
      description: 'Two image test reference piece',
      collectionSlug: 'navratri',
      collectionName: 'NAVRATRI EDIT',
      category: 'Outerwear',
      availability: 'REQUESTABLE',
      estimatedPrice: 'Estimated from ₹2,500',
      images: [img1, img2]
    };

    const payloadBytes2 = JSON.stringify(prod2Payload).length;
    console.log(`  -> Payload size sent to API: ${payloadBytes2} bytes (well below 4.5MB limit)`);
    assert(payloadBytes2 < 1200, 'Payload size with 2 images is tiny (< 1200 bytes)');

    const prod2Res = await makeRequest('/products', {
      method: 'POST',
      headers: authHeaders,
      body: prod2Payload
    });

    assert(prod2Res.status === 201, 'Product with 2 images created successfully without FUNCTION_PAYLOAD_TOO_LARGE (HTTP 201)');
    assert(prod2Res.body.images.length === 2, 'Product has exactly 2 images');
    assert(prod2Res.body.images[0] === img1, 'Main cover image is img1');
    assert(prod2Res.body.images[1] === img2, 'Secondary image is img2');
    testProductIds.push(prod2Res.body.id);

    // -------------------------------------------------------------
    // TEST 5: Create a product with 5 images
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Scenario: Create a product with 5 images');
    const fiveImages = [
      'https://res.cloudinary.com/venm-cloud/image/upload/v1740000001/venm-catalog/products/angle-front.jpg',
      'https://res.cloudinary.com/venm-cloud/image/upload/v1740000002/venm-catalog/products/angle-back.jpg',
      'https://res.cloudinary.com/venm-cloud/image/upload/v1740000003/venm-catalog/products/angle-detail-embroidery.jpg',
      'https://res.cloudinary.com/venm-cloud/image/upload/v1740000004/venm-catalog/products/angle-side.jpg',
      'https://res.cloudinary.com/venm-cloud/image/upload/v1740000005/venm-catalog/products/angle-model-movement.jpg'
    ];

    const prod5Payload = {
      name: 'KINETIC CHUNRI BOMBER 5-VIEW',
      description: 'Comprehensive 5-angle photographic study',
      collectionSlug: 'navratri',
      collectionName: 'NAVRATRI EDIT',
      category: 'Outerwear',
      availability: 'REQUESTABLE',
      estimatedPrice: 'Estimated from ₹3,800',
      images: fiveImages
    };

    const payloadBytes5 = JSON.stringify(prod5Payload).length;
    console.log(`  -> Payload size sent to API with 5 images: ${payloadBytes5} bytes (well below 4.5MB limit)`);
    assert(payloadBytes5 < 1500, 'Payload size with 5 images is less than 1.5KB (0.03% of Vercel limit)');

    const prod5Res = await makeRequest('/products', {
      method: 'POST',
      headers: authHeaders,
      body: prod5Payload
    });

    assert(prod5Res.status === 201, 'Product with 5 images created successfully (HTTP 201)');
    assert(prod5Res.body.images.length === 5, 'Product contains all 5 persistent image URLs');
    assert(prod5Res.body.images[0] === fiveImages[0], 'Index 0 is angle-front');
    assert(prod5Res.body.images[4] === fiveImages[4], 'Index 4 is angle-model-movement');
    const prod5Id = prod5Res.body.id;
    testProductIds.push(prod5Id);

    // -------------------------------------------------------------
    // TEST 6: Edit a product and add another image (now 6 images)
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Scenario: Edit product and add 6th image');
    const img6 = 'https://res.cloudinary.com/venm-cloud/image/upload/v1740000006/venm-catalog/products/angle-close-hardware.jpg';
    const sixImages = [...fiveImages, img6];

    const editRes = await makeRequest(`/products/${prod5Id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        images: sixImages
      }
    });

    assert(editRes.status === 200, 'Product edited and 6th image added successfully (HTTP 200)');
    assert(editRes.body.images.length === 6, 'Product now has 6 images in database');
    assert(editRes.body.images[5] === img6, '6th image is angle-close-hardware');

    // -------------------------------------------------------------
    // TEST 7: Remove an image and save the product
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Scenario: Remove an image and save product');
    const fiveAfterRemove = sixImages.filter((_, idx) => idx !== 2); // remove embroidery detail (index 2)

    const removeRes = await makeRequest(`/products/${prod5Id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        images: fiveAfterRemove
      }
    });

    assert(removeRes.status === 200, 'Product saved with removed image (HTTP 200)');
    assert(removeRes.body.images.length === 5, 'Product now has 5 images');
    assert(!removeRes.body.images.includes(sixImages[2]), 'Removed image is no longer in product images');

    // -------------------------------------------------------------
    // TEST 8: Change the cover image
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Scenario: Change cover image (reorder index 0)');
    // Move last image to position 0 (main cover)
    const reorderedImages = [...fiveAfterRemove];
    const newCoverImage = reorderedImages.pop(); // takes angle-close-hardware
    reorderedImages.unshift(newCoverImage);

    const reorderRes = await makeRequest(`/products/${prod5Id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        images: reorderedImages
      }
    });

    assert(reorderRes.status === 200, 'Cover image reordered and saved successfully (HTTP 200)');
    assert(reorderRes.body.images[0] === newCoverImage, 'New cover image is set at index 0');
    assert(reorderRes.body.images.length === 5, 'Total image count remains 5');

    // -------------------------------------------------------------
    // TEST 9: Save draft containing 5 images
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Scenario: Save draft containing 5 images');
    const draftPayload = {
      name: 'DRAFT STUDIO LOOK WITH 5 IMAGES',
      description: 'Hidden draft look for upcoming drop',
      availability: 'DRAFT',
      images: fiveImages
    };

    const draftRes = await makeRequest('/products', {
      method: 'POST',
      headers: authHeaders,
      body: draftPayload
    });

    assert(draftRes.status === 201, 'Draft product created with 5 images (HTTP 201)');
    assert(draftRes.body.availability === 'DRAFT', 'Product status is DRAFT');
    assert(draftRes.body.images.length === 5, 'Draft retains all 5 images');
    const draftId = draftRes.body.id;
    testProductIds.push(draftId);

    // Verify public catalog excludes draft
    const publicCatalogRes = await makeRequest('/products');
    const publicDraft = publicCatalogRes.body.find((p) => p.id === draftId);
    assert(!publicDraft, 'Public catalog correctly excludes DRAFT item by default');

    // -------------------------------------------------------------
    // TEST 10: Publish a product containing 5 images
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Scenario: Publish product containing 5 images');
    const publishRes = await makeRequest(`/products/${draftId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        availability: 'REQUESTABLE'
      }
    });

    assert(publishRes.status === 200, 'Product published to REQUESTABLE (HTTP 200)');
    assert(publishRes.body.availability === 'REQUESTABLE', 'Product availability is now REQUESTABLE');

    // Verify published product is visible in public catalog
    const publicAfterPublishRes = await makeRequest('/products');
    const publishedLook = publicAfterPublishRes.body.find((p) => p.id === draftId);
    assert(Boolean(publishedLook), 'Published product with 5 images is now visible in public catalog');
    assert(publishedLook.images.length === 5, 'Public catalog returns all 5 images for the published product');

    // -------------------------------------------------------------
    // TEST 11: Refresh & Query Persistence Check
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Scenario: Refresh page and confirm every image persists');
    const refreshRes = await makeRequest(`/products/${draftId}`);
    assert(refreshRes.status === 200, 'Product retrieved by ID/slug (simulating page reload)');
    assert(Array.isArray(refreshRes.body.images), 'Images property is parsed JSON array');
    assert(refreshRes.body.images.length === 5, 'All 5 images persist across reloads');
    for (let i = 0; i < 5; i++) {
      assert(refreshRes.body.images[i] === fiveImages[i], `Image #${i + 1} matches persistent URL`);
    }

    // -------------------------------------------------------------
    // TEST 12: Delete product with safe cleanup check
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Scenario: Delete product and safe cleanup');
    const deleteRes = await makeRequest(`/products/${draftId}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    assert(deleteRes.status === 200, 'Product deleted successfully (HTTP 200)');
    const checkDeleted = await makeRequest(`/products/${draftId}`);
    assert(checkDeleted.status === 404, 'Deleted product is no longer found in database');

    // Remove from cleanup queue since already deleted
    testProductIds = testProductIds.filter((tid) => tid !== draftId);

  } finally {
    // Clean up test records from database
    console.log('\n[CLEANUP] Removing remaining test products from database...');
    for (const tid of testProductIds) {
      try {
        await prisma.product.delete({ where: { id: tid } });
      } catch (e) {}
    }

    server.close();
    console.log('[TEST SERVER] Stopped.');
  }

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passedCount} / ${totalTests} ASSERTIONS PASSED`);
  console.log('===============================================================\n');

  if (passedCount === totalTests) {
    console.log('ALL SCENARIOS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('SOME ASSERTIONS FAILED.');
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('\n[FATAL TEST RUNNER ERROR]:', err);
  if (server) server.close();
  process.exit(1);
});
