// CENTRAL VENM REST API SERVICE LAYER
// Handles all HTTP communications between Frontend (React) and Backend (Node/Express/Prisma)

const getBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null;
  const isBrowser = typeof window !== 'undefined';
  const isLocalHost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // In production deployment (non-localhost browser origin):
  if (isBrowser && !isLocalHost) {
    // If VITE_API_URL is configured and is NOT pointing to localhost, use it
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    // Default production fallback: relative /api endpoint on current host
    return '/api';
  }

  // In local development:
  if (envUrl) {
    return envUrl;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseUrl();


async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // Send HTTP-only auth cookies automatically
  };

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text || `HTTP ${res.status}` };
    }

    if (!res.ok) {
      throw new Error(data.message || `API ERROR (${res.status})`);
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
export function apiLogin(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function apiLogout() {
  return request('/auth/logout', { method: 'POST' });
}

export function apiGetMe() {
  return request('/auth/me');
}

// ----------------------------------------------------
// ACTIVITY & DASHBOARD STATS API
// ----------------------------------------------------
export function apiGetDashboardStats() {
  return request('/admin/activity/dashboard-stats');
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
// PRODUCTS API
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

export function apiCreateProduct(data) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function apiUpdateProduct(id, data) {
  return request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function apiDeleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' });
}

export function apiUpdateProductStatus(id, availability) {
  return request(`/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ availability })
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
  });
}

export function apiUpdateCollection(id, data) {
  return request(`/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function apiDeleteCollection(id) {
  return request(`/collections/${id}`, { method: 'DELETE' });
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
// MEDIA LIBRARY API
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
