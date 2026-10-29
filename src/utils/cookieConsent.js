/**
 * VENM PRIVACY-CONSCIOUS COOKIE & STORAGE CONSENT MANAGER
 * 
 * Standards:
 * - Essential storage is strictly functional (auth, security, layout settings). Always enabled.
 * - Analytics & Marketing tracking are OFF by default.
 * - No optional tracking fires until affirmative visitor consent.
 * - Cookie consent is completely decoupled from Email Marketing consent.
 */

const STORAGE_KEY = 'venm_cookie_consent';
const CONSENT_VERSION = '1.0';

export const DEFAULT_CONSENT = {
  version: CONSENT_VERSION,
  essential: true, // Always required for catalog & cart security
  analytics: false,
  marketing: false,
  status: 'pending', // 'pending' | 'accepted_all' | 'rejected_optional' | 'customized'
  decidedAt: null
};

export function getCookieConsent() {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || CONSENT_VERSION,
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      status: parsed.status || 'customized',
      decidedAt: parsed.decidedAt || null
    };
  } catch (e) {
    return DEFAULT_CONSENT;
  }
}

export function hasUserDecided() {
  const current = getCookieConsent();
  return current.status !== 'pending' && current.decidedAt !== null;
}

export function isAnalyticsAllowed() {
  const consent = getCookieConsent();
  return consent.analytics === true;
}

export function isMarketingAllowed() {
  const consent = getCookieConsent();
  return consent.marketing === true;
}

export function saveCookieConsent({ analytics = false, marketing = false, status = 'customized' }) {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;

  const updated = {
    version: CONSENT_VERSION,
    essential: true,
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
    status,
    decidedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[VENM COOKIE CONSENT] Failed to write consent to storage:', e);
  }

  // Notify components and tracking listeners
  window.dispatchEvent(new CustomEvent('venm_cookie_consent_change', { detail: updated }));

  return updated;
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('venm_open_cookie_modal'));
}

