/**
 * VENM Frontend Image Path Sanitizer
 * Strips Windows drive paths (D:\..., C:\...), normalizes backslashes,
 * and converts them to valid relative public assets or web URLs.
 */

export function sanitizeImageUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return '/assets/campaign/HOMEPAGE_2.webp';
  }

  let clean = inputUrl.trim();

  // If already a Data URL or external HTTP/HTTPS URL, preserve directly
  if (clean.startsWith('data:image/') || clean.startsWith('http://') || clean.startsWith('https://')) {
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
