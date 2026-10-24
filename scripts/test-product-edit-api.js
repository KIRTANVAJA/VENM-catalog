/**
 * Verification Script: Test Product Edit & Save Flow against API
 */
import http from 'http';
import app from '../server/app.js';
import prisma from '../server/config/db.js';
import { generateToken } from '../server/utils/token.js';

const PORT = 5599;

function request(path, options = {}) {
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
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('TESTING REAL PRODUCT EDIT & SAVE FLOW VIA HTTP API');
  console.log('================================================================\n');

  const server = app.listen(PORT);
  console.log(`[TEST SERVER] Running on port ${PORT}`);

  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const token = generateToken(adminUser);
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1. Fetch black-kurta
    console.log('[STEP 1] Fetching existing product "black-kurta"...');
    const getRes = await request('/products/black-kurta');
    console.log('Status:', getRes.status);
    console.log('Name:', getRes.body.name);
    console.log('Images count:', getRes.body.images?.length);
    console.log('Images:', getRes.body.images);

    // 2. Perform Save/Edit without error
    console.log('\n[STEP 2] Updating product with 5th image and new description...');
    const existingImages = getRes.body.images;
    const fifthImage = 'https://res.cloudinary.com/dvyhywbe/image/upload/v1740000008/venm-catalog/products/new-5th-look.jpg';
    const newImages = [...existingImages, fifthImage];

    const putRes = await request(`/products/${getRes.body.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: {
        ...getRes.body,
        description: 'Updated with 5 images and zero Base64 errors.',
        images: newImages
      }
    });

    console.log('PUT Status:', putRes.status);
    console.log('PUT Response Message:', putRes.body.message || 'OK');
    console.log('Updated Images Count:', putRes.body.images?.length);
    console.log('5th Image:', putRes.body.images?.[4]);

    if (putRes.status === 200 && putRes.body.images?.length === 5) {
      console.log('\n✓ SUCCESS: Product edit and save succeeded with 5 images and NO Base64 error!');
    } else {
      console.error('\n❌ FAILURE:', putRes.body);
      process.exit(1);
    }
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
