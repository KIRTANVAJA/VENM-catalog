// CENTRAL VENM REST API SERVICE LAYER
// Direct HTTP communications between Frontend (React) and Backend (Node/Express/Prisma Database)

export const getBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null;

  if (envUrl) {
    let cleanUrl = envUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    // If VITE_API_URL is provided without /api suffix, append /api
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl = `${cleanUrl}/api`;
    }
    return cleanUrl;
  }

  const isBrowser = typeof window !== 'undefined';
  const isLocalHost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // In local browser development:
  // Connect directly to local Express API backend on port 5000 to eliminate any Vite static server proxy drops (405 Method Not Allowed / index.html rewrites)
  if (isLocalHost) {
    return `http://${window.location.hostname}:5000/api`;
  }

  // In production (Vercel, Netlify): relative '/api' endpoint
  return '/api';
};

export const API_BASE_URL = getBaseUrl();

export function getStoredAdminToken() {
  if (typeof window === 'undefined') return null;
  const adminToken = localStorage.getItem('venm_admin_token');
  if (adminToken && adminToken !== 'undefined' && adminToken !== 'null' && adminToken.trim() !== '') {
    return adminToken.trim();
  }
  const userToken = localStorage.getItem('venm_user_token');
  if (userToken && userToken !== 'undefined' && userToken !== 'null' && userToken.trim() !== '') {
    return userToken.trim();
  }
  return null;
}

async function request(endpoint, options = {}) {
  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const token = getStoredAdminToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    cache: 'no-store',
    ...options,
    headers,
    credentials: 'include' // Automatic HTTP cookie sending for admin auth
  };

  try {
    let res;
    try {
      res = await fetch(url, config);
    } catch (fetchErr) {
      // If fetching failed and url was relative or proxy dropped, retry direct to port 5000 on localhost
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal && !url.includes(':5000')) {
        const directUrl = `http://${window.location.hostname}:5000${endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`}`;
        res = await fetch(directUrl, config);
      } else {
        throw fetchErr;
      }
    }

    const contentType = res.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE html>');
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      // CRITICAL FIX: If static server (Vite/Netlify) caught the request and returned 405 Method Not Allowed or index.html (status 200),
      // automatically bypass and retry direct to the Express backend on port 5000
      if ((isHtml || res.status === 405) && isLocal && !url.includes(':5000') && !options._retriedDirect) {
        console.warn(`[VENM API] Static server intercepted ${url} (status ${res.status}). Retrying directly to backend port 5000...`);
        const directUrl = `http://${window.location.hostname}:5000${endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`}`;
        return request(directUrl, { ...options, _retriedDirect: true });
      }

      if (res.status === 502 || res.status === 504 || isHtml) {
        throw new Error(`Server API is offline or starting up (HTTP ${res.status}). Please verify server is running on port 5000.`);
      } else {
        data = { message: text || `HTTP ${res.status}` };
      }
    }

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('venm_admin_token');
        localStorage.removeItem('venm_admin_user');
        window.dispatchEvent(new CustomEvent('venm-session-expired', { detail: { message: data?.message || 'SESSION EXPIRED' } }));
      }
      const errorDetail = data?.error ? `${data?.message || 'ERROR'}: ${data.error}` : (data?.message || `API ERROR (${res.status})`);
      throw new Error(errorDetail);
    }

    return data;

  } catch (err) {
    console.warn(`[VENM API] ${endpoint} failed:`, err.message);
    throw err;
  }
}

// ----------------------------------------------------
// AUTHENTICATION API
// ----------------------------------------------------
export async function apiLogin(usernameOrEmail, password) {
  const cleanIdentifier = (usernameOrEmail || '').trim();
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: cleanIdentifier,
      email: cleanIdentifier,
      password
    })
  });

  if (data?.token && typeof window !== 'undefined') {
    if (data.user?.role === 'ADMIN') {
      localStorage.setItem('venm_admin_token', data.token);
      localStorage.setItem('venm_admin_user', JSON.stringify(data.user));
    }
    localStorage.setItem('venm_user_token', data.token);
    if (data.user) {
      localStorage.setItem('venm_user', JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent('venm-auth-change', { detail: data.user }));
    }
  }

  return data;
}

export async function apiRegister(userData) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });

  if (data?.token && typeof window !== 'undefined') {
    if (data.user?.role === 'ADMIN') {
      localStorage.setItem('venm_admin_token', data.token);
      localStorage.setItem('venm_admin_user', JSON.stringify(data.user));
    }
    localStorage.setItem('venm_user_token', data.token);
    if (data.user) {
      localStorage.setItem('venm_user', JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent('venm-auth-change', { detail: data.user }));
    }
  }

  return data;
}

export async function apiGoogleLogin(googleData) {
  const data = await request('/auth/google', {
    method: 'POST',
    body: JSON.stringify(googleData)
  });

  if (data?.token && typeof window !== 'undefined') {
    if (data.user?.role === 'ADMIN') {
      localStorage.setItem('venm_admin_token', data.token);
      localStorage.setItem('venm_admin_user', JSON.stringify(data.user));
    }
    localStorage.setItem('venm_user_token', data.token);
    if (data.user) {
      localStorage.setItem('venm_user', JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent('venm-auth-change', { detail: data.user }));
    }
  }

  return data;
}

export async function apiLogout(user = null) {
  let currentUser = user;
  if (!currentUser && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('venm_user') || localStorage.getItem('venm_admin_user');
      currentUser = stored ? JSON.parse(stored) : null;
    } catch (e) {}
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('venm_admin_token');
    localStorage.removeItem('venm_admin_user');
    localStorage.removeItem('venm_user_token');
    localStorage.removeItem('venm_user');
    window.dispatchEvent(new CustomEvent('venm-auth-change', { detail: null }));
  }
  return request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ user: currentUser })
  }).catch(() => ({}));
}

export function apiGetMe() {
  return request('/auth/me');
}

export function apiGetRegisteredUsers() {
  return request('/auth/users');
}

export function apiDeleteUser(id) {
  return request(`/auth/users/${id}`, { method: 'DELETE' });
}


// ----------------------------------------------------
// ACTIVITY & DASHBOARD STATS API
// ----------------------------------------------------
export function apiGetDashboardStats() {
  return request('/admin/activity/dashboard-stats');
}

export function apiGetLiveUserAnalytics() {
  return request('/admin/activity/live-analytics');
}

export function apiGetUniqueVisitors() {
  return request('/admin/activity/visitors');
}

export function apiSendHeartbeat(data) {
  return request('/analytics/heartbeat', {
    method: 'POST',
    body: JSON.stringify(data)
  }).catch(() => ({}));
}

export function apiRecordProductView(data) {
  return request('/analytics/product-view', {
    method: 'POST',
    body: JSON.stringify(data)
  }).catch(() => ({}));
}

export function apiGetActivityLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.append('limit', params.limit);
  if (params.page) query.append('page', params.page);
  if (params.action) query.append('action', params.action);
  if (params.entityType) query.append('entityType', params.entityType);

  const qStr = query.toString();
  return request(`/admin/activity/logs${qStr ? `?${qStr}` : ''}`);
}

export function apiTrackWhatsAppClick(productName, collectionName) {
  return request('/analytics/whatsapp-click', {
    method: 'POST',
    body: JSON.stringify({ productName, collectionName })
  }).catch(() => {});
}

// ----------------------------------------------------
// PRODUCTS / REFERENCES API
// ----------------------------------------------------
export function apiGetProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.collection) query.append('collection', params.collection);
  if (params.category) query.append('category', params.category);
  if (params.status) query.append('status', params.status);
  if (params.featured) query.append('featured', 'true');
  if (params.search) query.append('search', params.search);

  const qStr = query.toString();
  return request(`/products${qStr ? `?${qStr}` : ''}`);
}

export function apiGetProductBySlug(slug) {
  return request(`/products/${slug}`);
}

export function clearClientCatalogCache() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('venm_cached_product_') ||
        key.startsWith('venm_cached_collection_') ||
        key === 'venm_cached_collections' ||
        key === 'venm_cached_featured_prods'
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent('venm_collections_updated'));
    window.dispatchEvent(new CustomEvent('venm_catalog_updated'));
  } catch (e) {}
}

export function apiCreateProduct(data) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }).then((res) => {
    clearClientCatalogCache();
    return res;
  });
}

export function apiUpdateProduct(id, data) {
  return request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }).then((res) => {
    clearClientCatalogCache();
    return res;
  });
}

export function apiDeleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' }).then((res) => {
    clearClientCatalogCache();
    return res;
  });
}

export function apiUpdateProductStatus(id, availability) {
  return request(`/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ availability })
  }).then((res) => {
    clearClientCatalogCache();
    return res;
  });
}

// ----------------------------------------------------
// COLLECTIONS API
// ----------------------------------------------------
export function apiGetCollections() {
  return request('/collections');
}

export function apiGetCollectionBySlug(slug) {
  return request(`/collections/${slug}`);
}

export function apiCreateCollection(data) {
  return request('/collections', {
    method: 'POST',
    body: JSON.stringify(data)
  }).then((res) => {
    clearClientCatalogCache();
    return res;
  });
}

export function apiUpdateCollection(id, data) {
  return request(`/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }).then((res) => {
    clearClientCatalogCache();
    return res;
  });
}

export function apiDeleteCollection(id) {
  return request(`/collections/${id}`, { method: 'DELETE' }).then((res) => {
    clearClientCatalogCache();
    return res;
  });
}

// ----------------------------------------------------
// CATEGORIES API
// ----------------------------------------------------
export function apiGetCategories() {
  return request('/categories');
}

export function apiCreateCategory(data) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function apiUpdateCategory(id, data) {
  return request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function apiDeleteCategory(id) {
  return request(`/categories/${id}`, { method: 'DELETE' });
}

// ----------------------------------------------------
// CAMPAIGNS API
// ----------------------------------------------------
export function apiGetCampaigns() {
  return request('/campaigns');
}

export function apiGetActiveCampaign() {
  return request('/campaigns/active');
}

export function apiCreateCampaign(data) {
  return request('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function apiUpdateCampaign(id, data) {
  return request(`/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function apiDeleteCampaign(id) {
  return request(`/campaigns/${id}`, { method: 'DELETE' });
}

// ----------------------------------------------------
// HOMEPAGE CMS API
// ----------------------------------------------------
export function apiGetHomepageSections() {
  return request('/homepage');
}

export function apiUpdateHomepageSection(data) {
  return request('/homepage', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ----------------------------------------------------
// MEDIA LIBRARY & CLOUDINARY UPLOAD API
// ----------------------------------------------------
export function apiGetMedia() {
  return request('/media');
}

export function apiCreateMedia(data) {
  return request('/media', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function apiDeleteMedia(id) {
  return request(`/media/${id}`, { method: 'DELETE' });
}

export async function apiGetUploadSignature(folder = 'venm-catalog/products') {
  const query = folder ? `?folder=${encodeURIComponent(folder)}` : '';
  return request(`/media/upload-signature${query}`);
}

export async function apiGetCloudinaryDiagnostic() {
  return request('/media/cloudinary-diagnostic');
}

/**
 * Uploads an image File or Blob directly from the browser to Cloudinary.
 * The binary file never touches the Vercel backend serverless function,
 * completely avoiding FUNCTION_PAYLOAD_TOO_LARGE.
 *
 * @param {File|Blob} fileOrBlob - The image file or canvas blob to upload.
 * @param {Object} signatureData - The signed upload parameters from apiGetUploadSignature.
 * @param {Function} [onProgress] - Optional callback receiving progress percentage (0 - 100).
 * @returns {Promise<{ secure_url: string, public_id: string, width: number, height: number, bytes: number }>}
 */
export function apiDirectCloudinaryUpload(fileOrBlob, signatureData, onProgress) {
  return new Promise((resolve, reject) => {
    if (!signatureData || !signatureData.signature || !signatureData.cloudName || !signatureData.apiKey) {
      return reject(new Error('Invalid or missing Cloudinary upload credentials.'));
    }

    const formData = new FormData();
    formData.append('file', fileOrBlob);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', String(signatureData.timestamp));
    formData.append('signature', signatureData.signature);
    if (signatureData.folder) {
      formData.append('folder', signatureData.folder);
    }

    const xhr = new XMLHttpRequest();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;

    xhr.open('POST', uploadUrl);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      let response;
      try {
        response = JSON.parse(xhr.responseText);
      } catch (e) {
        response = { message: xhr.responseText };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          secure_url: response.secure_url || response.url,
          public_id: response.public_id,
          width: response.width,
          height: response.height,
          bytes: response.bytes,
          format: response.format
        });
      } else {
        const errorMsg = response?.error?.message || response?.message || `Upload failed with HTTP ${xhr.status}`;
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during direct Cloudinary upload.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Cloudinary upload timed out. Please check network connection.'));
    };

    xhr.send(formData);
  });
}

/**
 * Unified, reliable upload pipeline for all Admin components:
 * 1. Fetches a fresh, backend-signed upload signature specifically for this file
 * 2. Uploads the image directly from browser to Cloudinary via signed POST
 * 3. Returns the persistent Cloudinary secure_url and metadata
 *
 * Guarantees that:
 * - Every upload operation obtains a brand-new signature with current timestamp
 * - No signatures or timestamps are reused across multiple files or retries
 * - The binary never routes through Vercel serverless function (no 4.5MB payload limit)
 *
 * @param {File|Blob} fileOrBlob - The image file or canvas blob to upload.
 * @param {string} [folder='venm-catalog/products'] - The destination Cloudinary folder.
 * @param {Function} [onProgress] - Optional progress callback receiving percent (0-100).
 * @returns {Promise<{ secure_url: string, public_id: string, width: number, height: number, bytes: number, format: string }>}
 */
export async function apiUploadImageToCloudinary(fileOrBlob, folder = 'venm-catalog/products', onProgress) {
  // 1. Retrieve fresh upload signature specifically for this image upload
  const sigData = await apiGetUploadSignature(folder);
  if (!sigData || !sigData.configured) {
    throw new Error(
      sigData?.message ||
      'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.'
    );
  }

  // 2. Perform direct upload with fresh matching signature & timestamp
  return apiDirectCloudinaryUpload(fileOrBlob, sigData, onProgress);
}

// ----------------------------------------------------
// SETTINGS API
// ----------------------------------------------------
export function apiGetSettings() {
  return request('/settings');
}

export function apiUpdateSettings(sectionKey, data) {
  return request('/settings', {
    method: 'PUT',
    body: JSON.stringify({ sectionKey, data })
  });
}

// ----------------------------------------------------
// PRODUCT INQUIRIES API
// ----------------------------------------------------
export function apiCreateInquiry(inquiryData) {
  return request('/inquiries', {
    method: 'POST',
    body: JSON.stringify(inquiryData)
  });
}

export function apiGetMyInquiries(params = {}) {
  const query = new URLSearchParams();
  if (params.contact) query.append('contact', params.contact);
  if (params.userId) query.append('userId', params.userId);
  const qStr = query.toString();
  return request(`/inquiries/my${qStr ? `?${qStr}` : ''}`);
}

export function apiGetAllInquiries() {
  return request('/inquiries');
}

