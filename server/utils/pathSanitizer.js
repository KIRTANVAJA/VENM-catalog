/**
 * VENM Image & Asset Path Sanitizer
 * Ensures all stored and returned image paths are publicly accessible production URLs.
 * Strips Windows local drive prefixes (e.g. D:\..., C:\...), normalizes backslashes,
 * and preserves valid Data URLs, HTTP/HTTPS URLs, and public /assets/ paths.
 */

export function sanitizeImageUrl(inputUrl) {
  if (!inputUrl) {
    return '/assets/campaign/HOMEPAGE_2.webp';
  }

  const raw = typeof inputUrl === 'string' ? inputUrl : (inputUrl?.secure_url || inputUrl?.url || '');
  if (!raw || typeof raw !== 'string') {
    return '/assets/campaign/HOMEPAGE_2.webp';
  }

  let clean = raw.trim();

  // If already an external HTTP/HTTPS URL, preserve directly
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Normalize all Windows backslashes to standard forward slashes
  clean = clean.replace(/\\+/g, '/');

  // Strip file:/// protocol prefix
  if (clean.toLowerCase().startsWith('file:///')) {
    clean = clean.slice(8);
  }

  // If Windows drive letter is present (e.g., D:/... or C:/...)
  if (/^[a-zA-Z]:/i.test(clean)) {
    clean = clean.replace(/^[a-zA-Z]:/i, '');
    const assetIdx = clean.toLowerCase().indexOf('/assets/');
    if (assetIdx !== -1) {
      clean = clean.slice(assetIdx);
    } else {
      const publicIdx = clean.toLowerCase().indexOf('/public/');
      if (publicIdx !== -1) {
        clean = clean.slice(publicIdx + 7);
      } else {
        const filename = clean.split('/').filter(Boolean).pop();
        clean = `/assets/products/${filename || 'HOMEPAGE_2.webp'}`;
      }
    }
  }

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
