import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Settings2, X, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { getCookieConsent, saveCookieConsent, hasUserDecided } from '../utils/cookieConsent';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Preference state for modal
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    // Show banner after a short delay if user has not yet decided
    if (!hasUserDecided()) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for external open requests (e.g. from footer link or floating trigger)
  useEffect(() => {
    const handleOpenModal = () => {
      const current = getCookieConsent();
      setAnalyticsEnabled(current.analytics);
      setMarketingEnabled(current.marketing);
      setIsModalOpen(true);
    };

    window.addEventListener('venm_open_cookie_modal', handleOpenModal);
    return () => window.removeEventListener('venm_open_cookie_modal', handleOpenModal);
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({
      analytics: true,
      marketing: true,
      status: 'accepted_all'
    });
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleRejectOptional = () => {
    saveCookieConsent({
      analytics: false,
      marketing: false,
      status: 'rejected_optional'
    });
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleSaveCustomPreferences = () => {
    saveCookieConsent({
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      status: 'customized'
    });
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleOpenCustomize = () => {
    const current = getCookieConsent();
    setAnalyticsEnabled(current.analytics);
    setMarketingEnabled(current.marketing);
    setIsModalOpen(true);
  };

  // If banner is dismissed via close button without affirmative consent,
  // do NOT treat as consent: treat as rejecting optional or keep banner hidden for current view
  const handleDismissBanner = () => {
    setIsVisible(false);
  };

  return (
    <>
      {/* ----------------- BOTTOM COOKIE CONSENT BANNER ----------------- */}
      {isVisible && !isModalOpen && (
        <aside
          role="dialog"
          aria-label="Cookie consent banner"
          className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-5 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 text-neutral-200 shadow-2xl animate-slideUp font-sans"
        >
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            {/* Info Text */}
            <div className="space-y-1.5 flex-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.25em] text-lime-400 uppercase font-bold">
                  PRIVACY & DATA CHOICE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                We use essential storage to power core website functions, catalog navigation and security.
                Optional analytics and marketing technologies are only deployed with your consent.
                Your choices are stored separately from email subscription preferences.
              </p>
              <div className="flex items-center gap-4 pt-0.5">
                <button
                  type="button"
                  onClick={handleOpenCustomize}
                  className="text-[11px] font-mono text-neutral-400 hover:text-white underline underline-offset-4 flex items-center gap-1 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Customize Preferences</span>
                </button>
                <a
                  href="/privacy"
                  className="text-[11px] font-mono text-neutral-400 hover:text-white underline underline-offset-4 flex items-center gap-1"
                >
                  <span>Privacy Notice</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleRejectOptional}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-mono tracking-wider uppercase border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-500 text-neutral-200 transition-all font-bold cursor-pointer"
              >
                Reject Optional
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-mono tracking-wider uppercase bg-lime-400 hover:bg-lime-300 text-black transition-all font-extrabold shadow-sm cursor-pointer"
              >
                Accept All
              </button>

              <button
                type="button"
                onClick={handleDismissBanner}
                aria-label="Dismiss cookie notice"
                className="hidden sm:flex p-2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ----------------- GRANULAR PREFERENCES MODAL ----------------- */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans"
        >
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 p-6 sm:p-8 text-neutral-200 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-lime-400" />
                  <span className="text-[10px] font-mono tracking-[0.25em] text-lime-400 uppercase font-bold">
                    VENM PRIVACY CENTER
                  </span>
                </div>
                <h3 id="cookie-modal-title" className="text-xl font-black uppercase text-white tracking-wide">
                  Cookie & Storage Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close preferences"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Tailor how VENM uses local storage and cookies on your device. Essential storage cannot be deactivated
              as it is strictly necessary to maintain system security, catalog routing and saved inquiry drafts.
              Optional categories are only used if you choose to enable them.
            </p>

            {/* Category Toggles */}
            <div className="space-y-4 mb-8">
              {/* 1. Essential Storage (Locked ON) */}
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-lime-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Strictly Essential Storage
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono bg-neutral-800 text-lime-400 font-bold uppercase border border-neutral-700">
                      Always Required
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Necessary for catalog display, security authentication, navigation state and remembering your consent preferences.
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  <span className="text-[11px] font-mono text-lime-400 font-bold">ACTIVE</span>
                </div>
              </div>

              {/* 2. Analytics & Performance */}
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Performance & Analytics
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Aggregated metrics on look views and catalog interactions to optimize website responsiveness and identify popular fashion collections. No personal profiling.
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400 peer-checked:after:bg-black"></div>
                  </label>
                </div>
              </div>

              {/* 3. Marketing & Personalization */}
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Marketing & Campaign Personalization
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Used to remember which archival edits and lookbooks you explored to display relevant fashion content.
                    (Note: Email newsletter subscriptions require a separate affirmative opt-in).
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingEnabled}
                      onChange={(e) => setMarketingEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400 peer-checked:after:bg-black"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleRejectOptional}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-mono tracking-wider uppercase border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold cursor-pointer"
              >
                Reject All Optional
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveCustomPreferences}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono tracking-wider uppercase bg-neutral-800 hover:bg-neutral-700 text-white font-bold border border-neutral-600 cursor-pointer"
                >
                  Save Preferences
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-mono tracking-wider uppercase bg-lime-400 hover:bg-lime-300 text-black font-extrabold cursor-pointer"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;

