import { BRAND_ASSETS } from '../config/assets.js';

/**
 * Normalizes an image URL or file path for reliable web browser rendering.
 * 
 * Handles:
 * 1. Stripping accidental surrounding quotes (double or single quotes commonly added by Windows "Copy as path")
 * 2. Replacing Windows backslashes with standard forward slashes
 * 3. Preserving valid absolute URLs (https://, http://, data:, //)
 * 4. Resolving local repository file paths (e.g. D:/.../public/assets/... -> /assets/...)
 * 5. Ensuring relative web asset paths begin with a leading slash (/assets/...)
 */
export function normalizeImagePath(src, fallback = BRAND_ASSETS.FALLBACK_CAMPAIGN) {
  if (!src || typeof src !== 'string') return fallback;

  let cleaned = src.trim();

  // Strip wrapping quotes (single, double, escaped quotes)
  cleaned = cleaned.replace(/^["'\\]+|["'\\]+$/g, '').trim();
  cleaned = cleaned.replace(/^["']+|["']+$/g, '').trim();

  // If empty after stripping quotes
  if (!cleaned) return fallback;

  // Convert all Windows backslashes to forward slashes
  cleaned = cleaned.replace(/\\/g, '/');

  // If already an absolute HTTP/HTTPS URL or Data URI or protocol-relative URL, return as-is
  if (/^(https?:\/\/|data:image\/|\/\/)/i.test(cleaned)) {
    return cleaned;
  }

  // If the path contains an '/assets/' directory anywhere, resolve from '/assets/...'
  const assetsIndex = cleaned.toLowerCase().indexOf('/assets/');
  if (assetsIndex !== -1) {
    cleaned = cleaned.slice(assetsIndex);
  } else {
    // If user pasted a local file path containing /public/ (e.g. D:/projects/venm/public/assets/...),
    // extract the web path served relative to public root
    const publicIndex = cleaned.toLowerCase().indexOf('/public/');
    if (publicIndex !== -1) {
      cleaned = cleaned.slice(publicIndex + 7); // keep starting from '/assets/...'
    } else if (/^[a-zA-Z]:/i.test(cleaned) || (cleaned.includes('/') && !cleaned.startsWith('/assets/'))) {
      // If user pasted an arbitrary local filesystem path (e.g. D:/shoot/IMG_0628.jpg)
      // Extract the filename and resolve to the campaign assets public folder
      const filename = cleaned.split('/').filter(Boolean).pop();
      if (filename) {
        cleaned = `/assets/campaign/${filename}`;
      }
    }
  }

  // If user pasted a path with drive letter like D:/assets/..., strip the drive letter
  cleaned = cleaned.replace(/^[a-zA-Z]:\/?/, '/');

  // Ensure path starts with a leading slash for root-relative web asset resolution
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned;
  }

  return cleaned;
}
