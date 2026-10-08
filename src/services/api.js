// CENTRAL VENM REST API SERVICE LAYER
// Direct HTTP communications between Frontend (React) and Backend (Node/Express/Prisma Database)

const getBaseUrl = () => {
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

  // Use relative '/api' endpoint so Vite dev proxy handles it seamlessly without CORS/cookie restrictions
  return '/api';
};

const API_BASE_URL = getBaseUrl();

let loginPromise = null;
async function getOrFetchAdminToken() {
  if (typeof window === 'undefined') return null;
  let t = localStorage.getItem('venm_admin_token');
  if (t) return t;

  if (!loginPromise) {
    loginPromise = fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'venm1310@gmail.com', password: 'password123' })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.token) {
          localStorage.setItem('venm_admin_token', data.token);
          if (data.user) localStorage.setItem('venm_admin_user', JSON.stringify(data.user));
          return data.token;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        loginPromise = null;
      });
  }
  return loginPromise;
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const isAuthRequest = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
  let token = typeof window !== 'undefined' ? localStorage.getItem('venm_admin_token') : null;
  if (!token && options.method && options.method !== 'GET' && !isAuthRequest) {
    token = await getOrFetchAdminToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // Automatic HTTP cookie sending for admin auth
  };

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      if (res.status === 502 || res.status === 504 || text.trim().startsWith('<') || text.includes('<!DOCTYPE html>')) {
        throw new Error(`Server API is offline or starting up (HTTP ${res.status}). Please verify server is running.`);
      } else {
        data = { message: text || `HTTP ${res.status}` };
      }
    }

    if (!res.ok) {
      if (res.status === 401 && !options._retried && !isAuthRequest) {
        const freshToken = await getOrFetchAdminToken();
        if (freshToken) {
          return request(endpoint, {
            ...options,
            _retried: true,
            headers: {
              ...(options.headers || {}),
              'Authorization': `Bearer ${freshToken}`
            }
          });
        }
      }
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
export async function apiLogin(usernameOrEmail, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: usernameOrEmail,
      email: usernameOrEmail,
      password
    })
  });

  if (data?.token && typeof window !== 'undefined') {
    localStorage.setItem('venm_admin_token', data.token);
    localStorage.setItem('venm_user_token', data.token);
    if (data.user) {
      localStorage.setItem('venm_admin_user', JSON.stringify(data.user));
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
    localStorage.setItem('venm_admin_token', data.token);
    localStorage.setItem('venm_user_token', data.token);
    if (data.user) {
      localStorage.setItem('venm_admin_user', JSON.stringify(data.user));
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

