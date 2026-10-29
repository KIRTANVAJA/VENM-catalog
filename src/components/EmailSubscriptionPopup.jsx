import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { X, Mail, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { apiSubscribe } from '../services/api';

const CONSENT_WORDING = "I agree to receive promotional emails from VENM about new collections, product launches, campaigns and offers. I understand that I can unsubscribe at any time.";
const POPUP_DISMISS_KEY = 'venm_email_popup_dismissed';
const SUBSCRIBED_KEY = 'venm_subscriber_status';

const EmailSubscriptionPopup = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false); // MUST be unchecked by default
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Check if visitor should see the popup
  useEffect(() => {
    // Never show on admin pages or unsubscribe / legal pages
    if (
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/unsubscribe')
    ) {
      return;
    }

    try {
      const isAlreadySubscribed = localStorage.getItem(SUBSCRIBED_KEY) === 'subscribed';
      if (isAlreadySubscribed) return;

      const lastDismissed = localStorage.getItem(POPUP_DISMISS_KEY);
      if (lastDismissed) {
        const dismissedTime = parseInt(lastDismissed, 10);
        // Suppress popup for 7 days after dismissal
        if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
          return;
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    // Display popup after 18 seconds of browsing
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 18000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    setEmail('');
    setMarketingConsent(false);
    setErrorMessage(null);
    try {
      localStorage.setItem(POPUP_DISMISS_KEY, Date.now().toString());
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Strict client-side validation
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!marketingConsent) {
      setErrorMessage('Please confirm your marketing consent by checking the box below.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiSubscribe({
        email: cleanEmail,
        marketingConsent: true,
        consentWording: CONSENT_WORDING,
        consentSource: 'POPUP',
        honeypot
      });

      try {
        localStorage.setItem(SUBSCRIBED_KEY, 'subscribed');
      } catch (e) {}

      setSuccessMessage(response.message || 'YOU ARE ON THE LIST. First access will be delivered to your inbox.');
      setEmail('');

      // Auto close modal after showing success state
      setTimeout(() => {
        setIsOpen(false);
      }, 3500);

    } catch (err) {
      setErrorMessage(err.message || 'Unable to subscribe at this moment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans"
    >
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 text-white p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Subtle decorative neon accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-400 via-neutral-600 to-lime-400" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close email subscription popup"
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {successMessage ? (
          <div className="py-8 text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 bg-lime-400/20 text-lime-400 border border-lime-400/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider text-white">
              ACCESS GRANTED
            </h3>
            <p className="text-xs text-neutral-300 font-mono leading-relaxed max-w-sm mx-auto">
              {successMessage}
            </p>
            <div className="pt-2">
              <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                VENM DROP NOTIFICATIONS &bull; AHMEDABAD
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Tagline */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-400" />
                <span className="text-[10px] font-mono tracking-[0.25em] text-lime-400 font-bold uppercase">
                  EXCLUSIVE ARCHIVAL PRIVILEGE
                </span>
              </div>
              <h2 id="email-popup-title" className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                DON'T MISS THE NEXT DROP.
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
              Get first access to VENM's latest collections, exclusive designs, campaign launches and custom fashion inspiration.
            </p>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Anti-spam honeypot (invisible to humans) */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <input
                  type="text"
                  name="website_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label htmlFor="subscribe-email-input" className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-bold">
                  YOUR EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="subscribe-email-input"
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-neutral-900 border border-neutral-700 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-lime-400 font-sans disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Marketing Consent Checkbox (UNCHECKED BY DEFAULT) */}
              <div className="pt-1">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-0.5 w-4 h-4 accent-lime-400 rounded-none cursor-pointer"
                  />
                  <span className="text-[11px] text-neutral-400 group-hover:text-neutral-300 leading-normal">
                    {CONSENT_WORDING}{' '}
                    <Link
                      to="/privacy"
                      onClick={handleDismiss}
                      className="text-lime-400 underline underline-offset-2 hover:text-lime-300"
                    >
                      Privacy Notice
                    </Link>
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <span>{isSubmitting ? 'VERIFYING...' : 'SUBSCRIBE TO DROPS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto py-2.5 px-4 text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  NO THANKS
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-600 text-center">
              We respect your inbox. You can unsubscribe at any time via the link in each email.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailSubscriptionPopup;

