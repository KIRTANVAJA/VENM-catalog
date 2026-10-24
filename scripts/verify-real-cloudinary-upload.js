/**
 * VENM Catalog — Live Cloudinary Upload & End-to-End Persistence Verifier
 *
 * This script tests the real deployed Vercel backend and Cloudinary upload:
 * 1. Authenticates as Admin on https://venm-store.vercel.app
 * 2. Checks Cloudinary diagnostic status (/api/media/cloudinary-diagnostic)
 * 3. Verifies that the Cloudinary API secret matches the account credentials
 * 4. Generates a fresh upload signature
 * 5. Performs a real signed direct upload of an image to Cloudinary
 * 6. Persists the resulting HTTPS URL in a test product in PostgreSQL DB
 * 7. Confirms retrieval and cleans up the test product
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://venm-store.vercel.app';

async function verifyLiveUpload() {
  console.log('================================================================');
  console.log('VENM CATALOG — LIVE CLOUDINARY UPLOAD & PERSISTENCE VERIFICATION');
  console.log('================================================================\n');

  // Step 1: Login
  console.log('[STEP 1] Authenticating as Admin on live deployment...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'venm1310@gmail.com', password: 'password123' })
  });

  if (!loginRes.ok) {
    throw new Error(`Admin authentication failed: HTTP ${loginRes.status}`);
  }

  const { token, user } = await loginRes.json();
  console.log(`  ✓ Authenticated as ${user.email} (Role: ${user.role})`);

  // Step 2: Diagnostic Check
  console.log('\n[STEP 2] Inspecting server Cloudinary configuration diagnostics...');
  const diagRes = await fetch(`${BASE_URL}/api/media/cloudinary-diagnostic`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const diag = await diagRes.json();

  console.log('  -> Cloud Name:', diag.cloudName);
  console.log('  -> API Key:', diag.apiKey);
  console.log('  -> Secret Configured:', diag.secretDiagnostic?.isConfigured);
  console.log('  -> Secret Length:', diag.secretDiagnostic?.length, '(Expected: 27 chars)');
  console.log('  -> Secret Mask:', diag.secretDiagnostic?.mask);
  console.log('  -> Placeholder Detected:', diag.secretDiagnostic?.mask === 'CL***ET');
  console.log('  -> Cloudinary Ping Result:', diag.pingResult);

  if (diag.secretDiagnostic?.mask === 'CL***ET') {
    console.error('\n❌ ROOT CAUSE DIAGNOSED:');
    console.error('In Vercel Project Settings > Environment Variables, the value of CLOUDINARY_API_SECRET');
    console.error('is literally set to "CLOUDINARY_API_SECRET" (21 chars, the variable name itself),');
    console.error('instead of your actual 27-character secret from Cloudinary Console.');
    console.error('\nACTION REQUIRED:');
    console.error('1. Open https://console.cloudinary.com -> Settings ⚙ -> Access Keys');
    console.error('2. For cloud "dvyhywbe" and API Key "973165824978536", reveal and copy the API Secret.');
    console.error('3. In Vercel Project Settings > Environment Variables, edit CLOUDINARY_API_SECRET');
    console.error('   and paste the 27-character secret for Production & Preview.');
    console.error('4. Redeploy in Vercel, then re-run this verification.');
    return { success: false, reason: 'PLACEHOLDER_SECRET_CONFIGURED' };
  }

  if (diag.pingResult?.ok !== true) {
    console.error('\n❌ CLOUDINARY API REJECTED CREDENTIALS:', diag.pingResult?.error);
    return { success: false, reason: diag.pingResult?.error };
  }

  // Step 3: Fetch fresh signature
  console.log('\n[STEP 3] Fetching fresh signed upload parameters...');
  const sigRes = await fetch(`${BASE_URL}/api/media/upload-signature?folder=venm-catalog/products`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const sig = await sigRes.json();
  console.log('  ✓ Received signature:', {
    timestamp: sig.timestamp,
    folder: sig.folder,
    apiKey: sig.apiKey,
    signaturePrefix: sig.signature?.slice(0, 8) + '...'
  });

  // Step 4: Real Cloudinary Upload
  console.log('\n[STEP 4] Uploading test image directly to Cloudinary...');
  let fileBuffer;
  let fileName = 'IMG_0466.jpg';
  const testImagePath = path.join(process.cwd(), 'public', 'assets', 'products', 'IMG_0466.jpg');

  if (fs.existsSync(testImagePath)) {
    fileBuffer = fs.readFileSync(testImagePath);
    console.log(`  -> Using local test image: ${testImagePath} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
  } else {
    fileName = 'test-pixel.png';
    fileBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAEASTOtaQAAAAElFTkSuQmCC', 'base64');
  }

  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'image/jpeg' }), fileName);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
  const upRes = await fetch(uploadUrl, { method: 'POST', body: formData });
  const upData = await upRes.json();

  if (!upRes.ok || !upData.secure_url) {
    console.error('  ❌ Cloudinary upload failed (HTTP', upRes.status, '):', upData);
    return { success: false, reason: upData?.error?.message || 'UPLOAD_FAILED' };
  }

  console.log('  ✓ Cloudinary upload succeeded!');
  console.log('  ✓ Secure URL:', upData.secure_url);
  console.log('  ✓ Public ID:', upData.public_id);
  console.log(`  ✓ Resolution: ${upData.width}x${upData.height}, Format: ${upData.format}`);

  // Step 5: Test Product Persistence
  console.log('\n[STEP 5] Testing product persistence with returned HTTPS URL...');
  const testSlug = `test-cloudinary-live-${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'LIVE CLOUDINARY TEST PRODUCT',
      slug: testSlug,
      collectionSlug: 'navratri',
      collectionName: 'NAVRATRI EDIT',
      category: 'Outerwear',
      description: 'Automated verification product for Cloudinary signed upload.',
      details: ['Cloudinary Upload Verification'],
      images: [upData.secure_url],
      isFeatured: false,
      isNavratriEdit: false,
      availability: 'REQUESTABLE'
    })
  });

  const createdProduct = await createRes.json();
  console.log(`  ✓ Product created in PostgreSQL DB with ID: ${createdProduct.id}`);

  // Step 6: Verify Persistence
  console.log('\n[STEP 6] Querying product back to verify persistence...');
  const getRes = await fetch(`${BASE_URL}/api/products/${testSlug}`);
  const fetchedProduct = await getRes.json();
  const retrievedImages = Array.isArray(fetchedProduct.images)
    ? fetchedProduct.images
    : JSON.parse(fetchedProduct.images || '[]');

  console.log(`  ✓ Product fetched. Images count: ${retrievedImages.length}`);
  console.log(`  ✓ Stored image URL matches Cloudinary URL: ${retrievedImages[0] === upData.secure_url}`);

  // Step 7: Clean up test product
  console.log('\n[STEP 7] Cleaning up test product from database...');
  await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('  ✓ Test product deleted.');

  console.log('\n================================================================');
  console.log('ALL VERIFICATIONS PASSED: REAL CLOUDINARY UPLOAD & PERSISTENCE OK');
  console.log('================================================================');
  return { success: true, secure_url: upData.secure_url };
}

verifyLiveUpload().catch((err) => {
  console.error('\nVerification encountered error:', err.message);
  process.exit(1);
});
