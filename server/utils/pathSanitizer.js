/**
 * VENM Image & Asset Path Sanitizer
 * Ensures all stored and returned image paths are publicly accessible production URLs.
 * Strips Windows local drive prefixes (e.g. D:\..., C:\...), normalizes backslashes,
 * and preserves valid Data URLs, HTTP/HTTPS URLs, and public /assets/ paths.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicCampaignDir = path.resolve(__dirname, '../../public/assets/campaign');
const publicProductsDir = path.resolve(__dirname, '../../public/assets/products');

export function sanitizeImageUrl(inputUrl, defaultType = 'campaign') {
  if (!inputUrl) {
    return '/assets/campaign/HOMEPAGE_2.webp';
  }

  const raw = typeof inputUrl === 'string' ? inputUrl : (inputUrl?.secure_url || inputUrl?.url || '');
  if (!raw || typeof raw !== 'string') {
    return '/assets/campaign/HOMEPAGE_2.webp';
  }

  let clean = raw.trim();

  // Strip leading and trailing quotation marks (double, single, or escaped quotes)
  clean = clean.replace(/^["'\\]+|["'\\]+$/g, '').trim();

  // If already an external HTTP/HTTPS URL or Data URI, preserve directly
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image/')) {
    return clean;
  }

  // Check if raw local file exists on disk (Windows drive letter or absolute path)
  const isWindowsDrive = /^[a-zA-Z]:[/\\]/i.test(clean);
  if (isWindowsDrive && fs.existsSync(clean)) {
    try {
      const filename = path.basename(clean);
      const targetDir = defaultType === 'products' ? publicProductsDir : publicCampaignDir;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const destPath = path.join(targetDir, filename);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(clean, destPath);
      }
      return `/assets/${defaultType === 'products' ? 'products' : 'campaign'}/${filename}`;
    } catch (err) {
      console.warn('[PATH SANITIZER] Failed to copy local file:', err.message);
    }
  }

  // Normalize all Windows backslashes to standard forward slashes
  clean = clean.replace(/\\+/g, '/');

  // Strip file:/// protocol prefix
  if (clean.toLowerCase().startsWith('file:///')) {
    clean = clean.slice(8);
  }

  // If the path contains an '/assets/' directory anywhere, resolve from '/assets/...'
  const assetIdx = clean.toLowerCase().indexOf('/assets/');
  if (assetIdx !== -1) {
    clean = clean.slice(assetIdx);
  } else {
    const publicIdx = clean.toLowerCase().indexOf('/public/');
    if (publicIdx !== -1) {
      clean = clean.slice(publicIdx + 7);
    } else if (/^[a-zA-Z]:/i.test(clean) || (clean.includes('/') && !clean.startsWith('/assets/'))) {
      const filename = clean.split('/').filter(Boolean).pop();
      clean = `/assets/${defaultType === 'products' ? 'products' : 'campaign'}/${filename || 'HOMEPAGE_2.webp'}`;
    }
  }

  // Strip drive letter if still present
  clean = clean.replace(/^[a-zA-Z]:\/?/, '/');

  // If relative path does not start with /, prepend /
  if (!clean.startsWith('/')) {
    clean = `/${clean}`;
  }

  return clean;
}

export function sanitizeImageArray(images) {
  if (!images) return [];
  let arr = [];
  if (Array.isArray(images)) {
    arr = images;
  } else if (typeof images === 'string') {
    try {
      arr = JSON.parse(images || '[]');
    } catch (e) {
      arr = images.split(',').map((s) => s.trim());
    }
  }
  return arr.map(sanitizeImageUrl);
}
